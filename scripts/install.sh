#!/bin/bash
# Peek-a-boo Linux bootstrapper — run from the extracted release bundle root
# (the directory holding docker-compose.yml, setup.py and VERSION).
#
# For a source checkout use `npm run docker:dev` / `npm run docker:prod`
# instead; this script only understands the bundle layout.
set -e

RED='\033[1;31m'; GREEN='\033[1;32m'; YELLOW='\033[1;33m'; BLUE='\033[1;34m'; CYAN='\033[1;36m'; NC='\033[0m'

echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN}      Peek-a-boo Linux Bootstrapper      ${NC}"
echo -e "${CYAN}=========================================${NC}"

fail() {
    echo -e "\n${RED}[ERROR] $1${NC}"
    shift
    for line in "$@"; do echo -e "        $line"; done
    exit 1
}

cd "$(dirname "$0")"

# ---------------------------------------------------------------------------
# Preflight — everything checked BEFORE compose is invoked.
# ---------------------------------------------------------------------------
command -v docker &> /dev/null \
    || fail "Docker is not installed or not in PATH." \
            "Install Docker Engine or Docker Desktop, then re-run this script."

docker info &> /dev/null \
    || fail "Docker is installed but the daemon is not responding." \
            "Start Docker Desktop (or 'sudo systemctl start docker') and re-run."

docker compose version &> /dev/null \
    || fail "'docker compose' (v2) is not available." \
            "The standalone 'docker-compose' v1 binary is not supported."

if ! command -v python3 &> /dev/null; then
    fail "python3 is required to run the setup wizard." \
         "On Debian/Ubuntu: sudo apt install python3 python3-venv"
fi

[ -f "docker-compose.yml" ] && [ -f "setup.py" ] \
    || fail "docker-compose.yml / setup.py not found in $(pwd)." \
            "Run this script from the directory you extracted the release into."

# ---------------------------------------------------------------------------
# Environment configuration (setup.py)
# ---------------------------------------------------------------------------
if [ ! -f ".env" ]; then
    echo -e "\n${YELLOW}[WAIT] Initializing environment configuration wizard...${NC}"
    python3 -m venv .venv \
        || fail "Could not create a Python virtualenv." \
                "On Debian/Ubuntu: sudo apt install python3-venv"
    # shellcheck disable=SC1091
    source .venv/bin/activate
    # The offline bundle ships every wheel under wheels/; --no-index keeps an
    # air-gapped box from reaching for PyPI and the org index.
    if [ -d "wheels" ]; then
        pip install --no-index --find-links=wheels -r requirements.txt --quiet \
            || fail "Could not install the wizard's Python packages from wheels/." \
                    "The bundle may be incomplete — re-download the offline release."
    else
        pip install -r requirements.txt --quiet
    fi
    python3 setup.py
    deactivate
    [ -f ".env" ] || fail "The setup wizard did not produce a .env file." \
                          "Re-run it directly to see the failure: .venv/bin/python setup.py"
    echo -e "${GREEN}[OK] Environment configured.${NC}"
else
    echo -e "\n${GREEN}[OK] Existing .env found. Skipping configuration wizard.${NC}"
fi

[ -f "websock/websocket_token_source.txt" ] \
    || fail "websock/websocket_token_source.txt is missing." \
            "setup.py writes it from Hive's student list — re-run: .venv/bin/python setup.py"

[ -f "nginx/ssl/star.crt" ] && [ -f "nginx/ssl/star.key" ] \
    || fail "TLS certificate missing (nginx/ssl/star.crt, nginx/ssl/star.key)." \
            "setup.py issues one; or drop your own certificate there under those names."

env_get() { grep -E "^$1=" .env | head -1 | cut -d= -f2- | tr -d "'\"" || true; }

env_set() {
    if grep -q "^$1=" .env; then
        sed -i.bak "s|^$1=.*|$1=$2|" .env && rm -f .env.bak
    else
        echo "$1=$2" >> .env
    fi
}

# ---------------------------------------------------------------------------
# Port availability — explain Docker's opaque "port is already allocated".
# ---------------------------------------------------------------------------
HTTP_PORT="$(env_get PEEKABOO_HTTP_PORT)"; HTTP_PORT="${HTTP_PORT:-80}"
HTTPS_PORT="$(env_get PEEKABOO_HTTPS_PORT)"; HTTPS_PORT="${HTTPS_PORT:-443}"

port_in_use() {
    if command -v ss &> /dev/null; then
        ss -ltn "sport = :$1" 2>/dev/null | grep -q LISTEN
    elif command -v netstat &> /dev/null; then
        netstat -ltn 2>/dev/null | grep -qE "[:.]$1[[:space:]]"
    else
        return 1
    fi
}

# Our own proxy holding the port (a re-run) is not a conflict.
if ! docker ps --format '{{.Names}}' | grep -qx peekaboo-proxy; then
    for PORT in "$HTTP_PORT" "$HTTPS_PORT"; do
        if port_in_use "$PORT"; then
            echo -e "\n${YELLOW}[WARN] Something is already listening on port $PORT.${NC}"
            echo -e "        If that is another stack (Hive, Bluz), peek-a-boo's proxy will fail"
            echo -e "        to start. Set PEEKABOO_HTTP_PORT / PEEKABOO_HTTPS_PORT, or bind both"
            echo -e "        stacks to distinct IPs via PEEKABOO_BIND_IP, in .env."
        fi
    done
fi

# ---------------------------------------------------------------------------
# Image resolution & versioning (offline vs online)
# ---------------------------------------------------------------------------
DETECTED_TAG=""
[ -f "VERSION" ] && DETECTED_TAG="$(tr -d '[:space:]' < VERSION)"
IS_OFFLINE=false

echo -e "\n${YELLOW}[WAIT] Resolving Docker images...${NC}"
if ls images/*.tar 1> /dev/null 2>&1; then
    IS_OFFLINE=true
    echo -e "${BLUE}>> Offline bundle detected. Loading local image archives...${NC}"
    for img in images/*.tar; do
        echo "   Loading $img..."
        docker load -i "$img" > /dev/null || fail "docker load failed for $img."
    done
    echo -e "${GREEN}[OK] Loaded offline images.${NC}"
else
    echo -e "${BLUE}>> No local images found. Assuming online mode.${NC}"
fi

# `latest` is never published for releases, so there is no safe fallback.
[ -n "$DETECTED_TAG" ] \
    || fail "Could not determine which peek-a-boo version to run." \
            "The bundle should contain a VERSION file. Set it by hand if you know" \
            "the version: echo v1.0.0 > VERSION"

env_set PEEKABOO_VERSION "$DETECTED_TAG"

# Persist HIVE_NETWORK_NAME if the operator set it, so later compose commands
# (restart, update.sh) resolve the same network.
[ -n "${HIVE_NETWORK_NAME:-}" ] && env_set HIVE_NETWORK_NAME "$HIVE_NETWORK_NAME"

# ---------------------------------------------------------------------------
# Boot
# ---------------------------------------------------------------------------
COMPOSE=(docker compose -f docker-compose.yml)
grep -q '^HIVE_NETWORK_NAME=' .env && [ -f docker-compose.hive-local.yml ] \
    && COMPOSE+=(-f docker-compose.hive-local.yml)

echo -e "\n${YELLOW}[WAIT] Validating compose configuration...${NC}"
"${COMPOSE[@]}" config --quiet \
    || fail "docker-compose.yml did not validate against your .env." \
            "The error above names the missing or malformed variable."

if [ "$IS_OFFLINE" = false ]; then
    echo -e "\n${YELLOW}[WAIT] Pulling containers ($DETECTED_TAG)...${NC}"
    "${COMPOSE[@]}" pull \
        || fail "Failed to pull images for version $DETECTED_TAG." \
                "If the packages are private, log in first: docker login ghcr.io"
fi

echo -e "\n${YELLOW}[WAIT] Starting peek-a-boo services...${NC}"
"${COMPOSE[@]}" up -d --wait \
    || fail "Services did not become healthy." \
            "Inspect with: docker compose logs ui proxy vnc-bridge"

echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN} 🎉 Peek-a-boo Installation Complete! 🎉 ${NC}"
echo -e "${GREEN}=========================================${NC}"
NEXTAUTH_URL="$(env_get NEXTAUTH_URL)"
[ -n "$NEXTAUTH_URL" ] && echo -e "Peek-a-boo should now be reachable at: ${CYAN}$NEXTAUTH_URL${NC}"
echo -e "Trust nginx/ssl/ca.crt (System-B90 Local Dev CA) to silence certificate warnings."
echo -e "\nTo stop the system, run: docker compose down"
echo -e "To upgrade later, run:   ./update.sh"
echo -e "Running Hive on this same machine? Run ./link-hive.sh."
