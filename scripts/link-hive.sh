#!/bin/bash
# Brings peek-a-boo up against a Hive stack running on the SAME Docker daemon.
#
# Only needed for co-located installs. If Hive runs on another machine, plain
# ./install.sh is enough — HIVE_HOSTNAME resolves through ordinary DNS.
#
# Works from a release bundle root (./link-hive.sh) and from a source checkout
# (scripts/link-hive.sh, keeps whatever overlays the running stack uses, e.g.
# docker:dev). See docker-compose.hive-local.yml for why the alias has to live
# on Hive's nginx container rather than on ours.
set -e

RED='\033[1;31m'; GREEN='\033[1;32m'; YELLOW='\033[1;33m'; BLUE='\033[1;34m'; NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/docker-compose.hive-local.yml" ]; then
    ROOT="$SCRIPT_DIR"; COMPOSE_DIR="$SCRIPT_DIR"                       # bundle
else
    ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"; COMPOSE_DIR="$ROOT/deploy"   # repo
fi
cd "$ROOT"

if [ ! -f ".env" ]; then
    echo -e "${RED}[ERROR] No .env found in $ROOT. Run ./install.sh (or setup.py) first.${NC}"
    exit 1
fi

env_get() { grep -E "^$1=" .env | head -1 | cut -d= -f2- | tr -d "'\"" || true; }
env_set() {
    if grep -q "^$1=" .env; then
        sed -i.bak "s|^$1=.*|$1=$2|" .env && rm -f .env.bak
    else
        echo "$1=$2" >> .env
    fi
}

HIVE_HOSTNAME="${HIVE_HOSTNAME:-$(env_get HIVE_HOSTNAME)}"
HIVE_HOSTNAME="${HIVE_HOSTNAME:-hive.org}"

# Locate Hive's network. Compose names it after the directory Hive was brought
# up in, so it is not a fixed string.
if [ -z "$HIVE_NETWORK_NAME" ]; then
    echo -e "${YELLOW}[WAIT] Locating Hive's Docker network...${NC}"
    MATCHES=$(docker network ls --format '{{.Name}}' | grep -E 'hive.*net|net.*hive' || true)
    COUNT=$(echo "$MATCHES" | grep -c . || true)

    if [ "$COUNT" -eq 0 ]; then
        echo -e "${RED}[ERROR] No Hive network found on this Docker daemon.${NC}"
        echo -e "  Is the Hive stack running? Check with: docker compose ls"
        echo -e "  If Hive runs on a DIFFERENT machine, you do not need this script."
        exit 1
    elif [ "$COUNT" -gt 1 ]; then
        echo -e "${RED}[ERROR] Multiple candidate Hive networks found:${NC}"
        echo "$MATCHES" | sed 's/^/    /'
        echo -e "  Re-run with the right one, e.g.:"
        echo -e "    HIVE_NETWORK_NAME=$(echo "$MATCHES" | head -1) $0"
        exit 1
    fi
    HIVE_NETWORK_NAME="$MATCHES"
fi
echo -e "${GREEN}[OK] Using Hive network: $HIVE_NETWORK_NAME${NC}"

# Persist it: compose resolves ${HIVE_NETWORK_NAME} on EVERY invocation, and
# update.sh uses its presence to keep the overlay on.
env_set HIVE_NETWORK_NAME "$HIVE_NETWORK_NAME"

if [ -z "$HIVE_NGINX_CONTAINER" ]; then
    HIVE_NGINX_CONTAINER=$(docker ps --format '{{.Names}}' \
        --filter "network=$HIVE_NETWORK_NAME" | grep -E 'nginx|proxy' | grep -v peekaboo | head -1 || true)
fi

if [ -z "$HIVE_NGINX_CONTAINER" ]; then
    echo -e "${RED}[ERROR] Could not find Hive's nginx container on $HIVE_NETWORK_NAME.${NC}"
    echo -e "  Containers currently on that network:"
    docker ps --format '{{.Names}}' --filter "network=$HIVE_NETWORK_NAME" | sed 's/^/    /'
    echo -e "  Re-run naming it explicitly, e.g.:"
    echo -e "    HIVE_NGINX_CONTAINER=hive-nginx $0"
    exit 1
fi
echo -e "${GREEN}[OK] Using Hive nginx container: $HIVE_NGINX_CONTAINER${NC}"

echo -e "\n${YELLOW}[WAIT] Aliasing $HIVE_HOSTNAME onto $HIVE_NGINX_CONTAINER...${NC}"
EXISTING_ALIASES=$(docker inspect "$HIVE_NGINX_CONTAINER" \
    --format "{{range .NetworkSettings.Networks}}{{range .Aliases}}{{println .}}{{end}}{{end}}" 2>/dev/null || true)

if echo "$EXISTING_ALIASES" | grep -qx "$HIVE_HOSTNAME"; then
    echo -e "${GREEN}[OK] Alias already present — nothing to do.${NC}"
else
    # Already ON the network, so disconnect before reconnecting with the alias.
    docker network disconnect "$HIVE_NETWORK_NAME" "$HIVE_NGINX_CONTAINER" 2>/dev/null || true
    docker network connect --alias "$HIVE_HOSTNAME" "$HIVE_NETWORK_NAME" "$HIVE_NGINX_CONTAINER"
    echo -e "${GREEN}[OK] Alias added.${NC}"
fi

echo -e "\n${BLUE}>> Bringing peek-a-boo up with the co-located Hive overlay...${NC}"
export HIVE_NETWORK_NAME
# Keep whatever compose files the running stack was started with (e.g. the dev
# overlay); dropping them recreates ui in the wrong mode.
RUNNING_FILES="$(docker inspect peekaboo-ui --format '{{index .Config.Labels "com.docker.compose.project.config_files"}}' 2>/dev/null || true)"
[ -n "$RUNNING_FILES" ] || RUNNING_FILES="$COMPOSE_DIR/docker-compose.yml"
case ",$RUNNING_FILES," in
    *docker-compose.hive-local.yml*) ;;
    *) RUNNING_FILES="$RUNNING_FILES,$COMPOSE_DIR/docker-compose.hive-local.yml" ;;
esac
COMPOSE_ARGS=()
IFS=',' read -ra FILES <<< "$RUNNING_FILES"
for f in "${FILES[@]}"; do COMPOSE_ARGS+=(-f "$f"); done
docker compose --env-file "$ROOT/.env" "${COMPOSE_ARGS[@]}" up -d

echo -e "\n${GREEN}=============================================${NC}"
echo -e "${GREEN} peek-a-boo is linked to the local Hive stack. ${NC}"
echo -e "${GREEN}=============================================${NC}"
echo -e "Verify name resolution from inside the ui container:"
echo -e "    docker exec peekaboo-ui node -e \"require('dns').lookup('$HIVE_HOSTNAME',console.log)\""
