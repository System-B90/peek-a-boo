#!/usr/bin/env bash
#
# Peek-a-boo release upgrade — online (pull from GHCR) or offline (from a bundle).
#
# Upgrades a running deployment in place: get the new images, refresh the
# bundle's own files, roll the containers one service at a time, verify. Any
# failed step stops the upgrade and prints the exact rollback command.
#
# Peek-a-boo keeps no database, so unlike Bluz there is no backup step: .env,
# nginx/ssl/ and websock/websocket_token_source.txt are the only state, and
# none of them is touched.
#
# Run it from the extracted bundle root (the directory holding
# docker-compose.yml and .env).
#
# Usage: ./update.sh [--version <tag>] [--pre-release] [--yes]
#        ./update.sh --package <path> [--yes]
#
#        Without --version it upgrades to the latest published (non-prerelease)
#        release; --pre-release includes prereleases.
#
#        --package takes a FULL offline package — peekaboo-offline-<tag>.tar.gz
#        or the directory it extracts into — and upgrades from it with no
#        registry access.
#
# Env:   PEEKABOO_RELEASE_REPO   GitHub repo to read releases from
#                                (default System-B90/peek-a-boo)
#        PEEKABOO_HEALTH_RETRIES health-check attempts after the roll (default 30)

set -euo pipefail

RED='\033[1;31m'; GREEN='\033[1;32m'; YELLOW='\033[1;33m'; CYAN='\033[1;36m'; NC='\033[0m'

INSTALL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${INSTALL_DIR}"
ENV_FILE="./.env"
HEALTH_RETRIES="${PEEKABOO_HEALTH_RETRIES:-30}"
RELEASE_REPO="${PEEKABOO_RELEASE_REPO:-System-B90/peek-a-boo}"

TARGET_VERSION=""
PRE_RELEASE=0
ASSUME_YES=0
PREVIOUS_VERSION=""
PACKAGE_ARG=""
PACKAGE_ROOT=""
EXTRACT_DIR=""
BUNDLE_BACKUP_DIR=""

log()  { echo -e "${CYAN}[peekaboo-update]${NC} $*"; }
ok()   { echo -e "${GREEN}[OK]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }

fail() {
    echo -e "\n${RED}[ERROR] $1${NC}"
    shift
    for line in "$@"; do echo -e "        $line"; done
    exit 1
}

cleanup() {
    [ -n "${EXTRACT_DIR}" ] && [ -d "${EXTRACT_DIR}" ] && rm -rf "${EXTRACT_DIR}"
    return 0
}
trap cleanup EXIT

abort_with_rollback() {
    echo -e "\n${RED}[ERROR] Upgrade failed during: $1${NC}"
    if [ -n "${PREVIOUS_VERSION}" ]; then
        echo -e "        The stack is left as-is for inspection. To roll the images back:"
        echo -e "          1. set PEEKABOO_VERSION=${PREVIOUS_VERSION} in ${ENV_FILE}"
        echo -e "          2. docker compose ${COMPOSE_ARGS[*]} up -d --wait"
    fi
    if [ -n "${BUNDLE_BACKUP_DIR}" ]; then
        echo -e "        The bundle's own files were replaced. The previous copies are in:"
        echo -e "          ${BUNDLE_BACKUP_DIR}"
    fi
    exit 1
}

while [ $# -gt 0 ]; do
    case "$1" in
        --version) TARGET_VERSION="${2:-}"; shift 2 ;;
        --package) PACKAGE_ARG="${2:-}"; shift 2 ;;
        --pre-release) PRE_RELEASE=1; shift ;;
        --yes|-y) ASSUME_YES=1; shift ;;
        -h|--help) sed -n '2,28p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
        *) fail "Unknown argument: $1" "Run ./update.sh --help." ;;
    esac
done

if [ -n "${PACKAGE_ARG}" ]; then
    [ -z "${TARGET_VERSION}" ] && [ "${PRE_RELEASE}" -eq 0 ] \
        || fail "--package cannot be combined with --version / --pre-release." \
                "An offline package carries exactly one release."
fi

# ---------------------------------------------------------------------------
# Preflight
# ---------------------------------------------------------------------------
command -v docker &> /dev/null || fail "Docker is not installed or not in PATH."
docker info &> /dev/null || fail "Docker is installed but the daemon is not responding."
docker compose version &> /dev/null || fail "'docker compose' (v2) is not available."

[ -f docker-compose.yml ] \
    || fail "docker-compose.yml not found in ${INSTALL_DIR}." \
            "Run this from the directory you extracted the release into."
[ -f "${ENV_FILE}" ] \
    || fail "No .env in ${INSTALL_DIR} — this looks like a fresh host." \
            "Run ./install.sh instead."

# link-hive.sh persists HIVE_NETWORK_NAME; its presence means the running stack
# needs the co-located Hive overlay, or sign-in breaks after the roll.
COMPOSE_ARGS=(-f docker-compose.yml)
if grep -q '^HIVE_NETWORK_NAME=' "${ENV_FILE}" && [ -f docker-compose.hive-local.yml ]; then
    COMPOSE_ARGS+=(-f docker-compose.hive-local.yml)
    log "co-located Hive detected (HIVE_NETWORK_NAME in .env) — using docker-compose.hive-local.yml"
fi
compose() { docker compose "${COMPOSE_ARGS[@]}" --env-file "${ENV_FILE}" "$@"; }

PREVIOUS_VERSION="$(grep -E '^PEEKABOO_VERSION=' "${ENV_FILE}" | head -1 | cut -d= -f2- | tr -d "'\"" || true)"
[ -n "${PREVIOUS_VERSION}" ] \
    || fail "PEEKABOO_VERSION is not set in ${ENV_FILE}." \
            "Set it to the running release first, so there is a version to roll back to."

# ---------------------------------------------------------------------------
# Resolve the target
# ---------------------------------------------------------------------------
if [ -n "${PACKAGE_ARG}" ]; then
    if [ -d "${PACKAGE_ARG}" ]; then
        PACKAGE_ROOT="$(cd "${PACKAGE_ARG}" && pwd)"
    elif [ -f "${PACKAGE_ARG}" ]; then
        log "extracting ${PACKAGE_ARG}..."
        EXTRACT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/peekaboo-package.XXXXXX")"
        tar -xzf "${PACKAGE_ARG}" -C "${EXTRACT_DIR}" \
            || fail "Could not extract ${PACKAGE_ARG}."
        PACKAGE_ROOT="${EXTRACT_DIR}"
    else
        fail "Package not found: ${PACKAGE_ARG}"
    fi
    # The tarball wraps the bundle in one peekaboo/ directory.
    [ -f "${PACKAGE_ROOT}/docker-compose.yml" ] || [ ! -f "${PACKAGE_ROOT}/peekaboo/docker-compose.yml" ] \
        || PACKAGE_ROOT="${PACKAGE_ROOT}/peekaboo"

    [ -f "${PACKAGE_ROOT}/docker-compose.yml" ] \
        || fail "No docker-compose.yml in the package — not a peek-a-boo release bundle."
    ls "${PACKAGE_ROOT}"/images/*.tar &> /dev/null \
        || fail "No images/*.tar in the package." \
                "That is the ONLINE bundle. Download peekaboo-offline-<tag>.tar.gz."
    [ -f "${PACKAGE_ROOT}/VERSION" ] \
        || fail "The package has no VERSION file."
    TARGET_VERSION="$(tr -d '[:space:]' < "${PACKAGE_ROOT}/VERSION")"
    ok "offline package: ${TARGET_VERSION} (${PACKAGE_ROOT})"
elif [ -z "${TARGET_VERSION}" ]; then
    command -v curl &> /dev/null || fail "curl is required to resolve the latest release." \
                                         "Pass --version <tag> explicitly."
    if [ "${PRE_RELEASE}" -eq 1 ]; then
        API="https://api.github.com/repos/${RELEASE_REPO}/releases?per_page=1"
    else
        API="https://api.github.com/repos/${RELEASE_REPO}/releases/latest"
    fi
    log "resolving latest release from ${RELEASE_REPO}..."
    TARGET_VERSION="$(curl -fsSL --max-time 15 "${API}" 2>/dev/null \
        | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n 1)" || TARGET_VERSION=""
    [ -n "${TARGET_VERSION}" ] \
        || fail "Could not reach GitHub to resolve the latest release." \
                "Pass it explicitly: ./update.sh --version v1.0.0" \
                "Air-gapped host? Upgrade from a package: ./update.sh --package <path>"
    ok "latest release is ${TARGET_VERSION}"
fi

[ "${TARGET_VERSION}" != "${PREVIOUS_VERSION}" ] \
    || fail "Already running ${PREVIOUS_VERSION}."

[ "$(compose ps --status running --quiet | wc -l | tr -d ' ')" -gt 0 ] \
    || fail "No peek-a-boo containers are running." \
            "This script upgrades a live deployment. Start it first: docker compose up -d --wait"

echo
log "upgrade ${PREVIOUS_VERSION} -> ${TARGET_VERSION}"
log "mode        : $([ -n "${PACKAGE_ARG}" ] && echo "offline (${PACKAGE_ARG})" || echo "online (ghcr.io)")"
log "install dir : ${INSTALL_DIR}"
echo
if [ "${ASSUME_YES}" -eq 0 ]; then
    read -r -p "Proceed? [y/N] " reply
    case "${reply}" in [yY]*) ;; *) echo "Aborted."; exit 1 ;; esac
fi

# ---------------------------------------------------------------------------
# 1. Images — the running containers keep serving while these arrive.
# ---------------------------------------------------------------------------
if [ -n "${PACKAGE_ARG}" ]; then
    log "loading ${TARGET_VERSION} images from the package..."
    for archive in "${PACKAGE_ROOT}"/images/*.tar; do
        log "  $(basename "${archive}")"
        docker load -i "${archive}" > /dev/null || abort_with_rollback "loading $(basename "${archive}")"
    done
    for repo in nextjs websock; do
        docker image inspect "ghcr.io/system-b90/peek-a-boo/${repo}:${TARGET_VERSION}" &> /dev/null \
            || abort_with_rollback "package verification: ghcr.io/system-b90/peek-a-boo/${repo}:${TARGET_VERSION} not among the loaded images"
    done
    ok "images loaded"
else
    log "pulling ${TARGET_VERSION} images..."
    PEEKABOO_VERSION="${TARGET_VERSION}" compose pull || abort_with_rollback "image pull"
    ok "images pulled"

    # Every release also publishes the online bundle; fetch it so scripts and
    # compose file do not drift behind the images forever.
    log "fetching ${TARGET_VERSION} bundle files..."
    EXTRACT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/peekaboo-online.XXXXXX")"
    curl -fsSL --max-time 60 \
        "https://github.com/${RELEASE_REPO}/releases/download/${TARGET_VERSION}/peekaboo-online-${TARGET_VERSION}.tar.gz" \
        | tar -xz -C "${EXTRACT_DIR}" \
        || abort_with_rollback "downloading peekaboo-online-${TARGET_VERSION}.tar.gz"
    PACKAGE_ROOT="${EXTRACT_DIR}/peekaboo"
    [ -f "${PACKAGE_ROOT}/setup.py" ] \
        || abort_with_rollback "peekaboo-online-${TARGET_VERSION}.tar.gz did not contain the expected layout"
fi

# ---------------------------------------------------------------------------
# 2. Bundle files — host-specific state (.env, nginx/ssl/, websock token file,
#    images/) is deliberately excluded.
# ---------------------------------------------------------------------------
BUNDLE_BACKUP_DIR="${INSTALL_DIR}/.bundle-bak-${PREVIOUS_VERSION}"
log "refreshing bundle files (previous copies -> ${BUNDLE_BACKUP_DIR})..."
mkdir -p "${BUNDLE_BACKUP_DIR}"
for relative in \
    docker-compose.yml docker-compose.hive-local.yml \
    install.sh install.ps1 update.sh link-hive.sh \
    setup.py requirements.txt VERSION \
    nginx/nginx.conf.template
do
    [ -f "${PACKAGE_ROOT}/${relative}" ] || continue
    if [ -f "${relative}" ]; then
        mkdir -p "${BUNDLE_BACKUP_DIR}/$(dirname "${relative}")"
        cp -p "${relative}" "${BUNDLE_BACKUP_DIR}/${relative}" \
            || abort_with_rollback "saving previous ${relative}"
    fi
    mkdir -p "$(dirname "${relative}")"
    # update.sh is among the replaced files and bash reads its source by
    # offset — write a new inode instead of overwriting in place.
    cp "${PACKAGE_ROOT}/${relative}" "${relative}.new" && mv -f "${relative}.new" "${relative}" \
        || abort_with_rollback "installing ${relative}"
done
chmod +x ./*.sh 2>/dev/null || true

if [ -d "${PACKAGE_ROOT}/wheels" ]; then
    [ -d wheels ] && { mv wheels "${BUNDLE_BACKUP_DIR}/wheels" || abort_with_rollback "saving previous wheels/"; }
    cp -r "${PACKAGE_ROOT}/wheels" wheels || abort_with_rollback "installing wheels/"
fi

# Keep the wizard's venv in step with the new requirements.txt.
if [ -d .venv ]; then
    log "upgrading Python packages in .venv..."
    if [ -d wheels ]; then
        .venv/bin/pip install --no-index --find-links=wheels --upgrade -r requirements.txt --quiet
    else
        .venv/bin/pip install --upgrade -r requirements.txt --quiet
    fi || warn "could not upgrade .venv — re-run setup.py later if it misbehaves"
fi
ok "bundle files refreshed"

# ---------------------------------------------------------------------------
# 3. Roll — service by service, each waiting on its healthcheck. proxy last so
#    the public endpoint is the final thing to blink.
# ---------------------------------------------------------------------------
cp "${ENV_FILE}" "${ENV_FILE}.bak-${PREVIOUS_VERSION}"
sed -i.tmp "s|^PEEKABOO_VERSION=.*|PEEKABOO_VERSION=${TARGET_VERSION}|" "${ENV_FILE}" && rm -f "${ENV_FILE}.tmp"
export PEEKABOO_VERSION="${TARGET_VERSION}"

for service in ui vnc-bridge proxy; do
    log "rolling ${service}..."
    compose up -d --wait --no-deps "${service}" || abort_with_rollback "rolling ${service}"
    ok "${service} is up"
done

for service in ui vnc-bridge; do
    running="$(compose ps --format '{{.Image}}' "${service}")"
    case "${running}" in
        *":${TARGET_VERSION}") ;;
        *) abort_with_rollback "post-roll verification: ${service} is running ${running}, expected ${TARGET_VERSION}" ;;
    esac
done

# ---------------------------------------------------------------------------
# 4. Verify
# ---------------------------------------------------------------------------
log "verifying /api/health..."
attempt=0
until compose exec -T ui node -e \
    "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" \
    &> /dev/null
do
    attempt=$((attempt + 1))
    [ "${attempt}" -lt "${HEALTH_RETRIES}" ] || abort_with_rollback "health check (/api/health)"
    sleep 2
done
ok "/api/health is green"

echo
ok "peek-a-boo upgraded ${PREVIOUS_VERSION} -> ${TARGET_VERSION}"
echo -e "        previous env file kept at ${ENV_FILE}.bak-${PREVIOUS_VERSION}"
echo -e "        previous bundle files: ${BUNDLE_BACKUP_DIR}"
exit 0
