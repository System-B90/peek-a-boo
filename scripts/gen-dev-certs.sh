#!/usr/bin/env bash
# Generate dev TLS certs for peek-a-boo, issued by a local "System-B90" CA.
#
#   nginx/ssl/ca.crt    trust this once in your OS/browser store
#   nginx/ssl/star.crt  leaf (+ nothing else), SANs = HOSTNAME, localhost
#   nginx/ssl/star.key  leaf key
#
# Hostnames come from .env (HOSTNAME); defaults match dev.
# The CA is reused if present so the browser trust survives leaf regeneration.
set -euo pipefail
cd "$(dirname "$0")/.."

env_get() { [ -f .env ] && sed -n "s/^$1=['\"]\?\([^'\"]*\)['\"]\?$/\1/p" .env | head -1 || true; }
HOST="$(env_get HOSTNAME)"; HOST="${HOST:-peekaboo.dev}"

DIR=nginx/ssl
mkdir -p "$DIR"
export MSYS_NO_PATHCONV=1   # Git Bash: keep -subj "/O=..." from being path-converted

if [ ! -f "$DIR/ca.crt" ] || [ ! -f "$DIR/ca.key" ]; then
  openssl req -x509 -newkey rsa:4096 -nodes -sha256 -days 3650 \
    -keyout "$DIR/ca.key" -out "$DIR/ca.crt" \
    -subj "/C=IL/O=System-B90/CN=System-B90 Local Dev CA" \
\
    -addext "keyUsage=critical,keyCertSign,cRLSign"
fi

openssl req -newkey rsa:2048 -nodes -keyout "$DIR/star.key" -out "$DIR/star.csr" \
  -subj "/C=IL/O=System-B90/CN=$HOST"

cat > "$DIR/star.ext" <<EXT
basicConstraints=CA:FALSE
authorityKeyIdentifier=keyid,issuer
subjectKeyIdentifier=hash
keyUsage=critical,digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=DNS:$HOST,DNS:localhost,IP:127.0.0.1,IP:127.0.0.4
EXT

openssl x509 -req -in "$DIR/star.csr" -CA "$DIR/ca.crt" -CAkey "$DIR/ca.key" \
  -CAcreateserial -out "$DIR/star.crt" -days 397 -sha256 -extfile "$DIR/star.ext"
rm -f "$DIR/star.csr" "$DIR/star.ext"

openssl x509 -in "$DIR/star.crt" -noout -subject -issuer -ext subjectAltName
echo "Trust $DIR/ca.crt (Windows: certutil -addstore -user Root $DIR/ca.crt)"
