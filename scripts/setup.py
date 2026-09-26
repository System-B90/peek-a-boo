#!/usr/bin/env python3
"""
Author: Michael K. Steinberg (Bis90 v25)
Name: setup.py

Interactive .env / TLS / websockify-token wizard. Operates on the current
directory, which is the repo root in development (`python scripts/setup.py`)
and the bundle root in a release (run by ./install.sh; re-run with
`python3 bootstrap.py setup`).

The shared parts — keeping existing secrets and foreign keys (PEEKABOO_VERSION
from install, HIVE_NETWORK_NAME from link-hive), the port questions, the local
CA + leaf certificate, Hive clients — live in sb90-deploy
(System-B90/deploy-py). This file asks peek-a-boo's own questions.
"""

import base64
import json
import os
import ssl
import sys
import urllib.error
import urllib.request
from pathlib import Path

try:
    from sb90_deploy import hive
    from sb90_deploy.spec import AppSpec
    from sb90_deploy.wizard import Wizard, b64_key
except ImportError:
    print("❌  sb90-deploy is not installed.")
    print(
        "➡️   Release bundle: run ./install.sh. Checkout: pip install -r scripts/requirements.txt"
    )
    sys.exit(1)

CNET_TEST_URL = "https://8200artifactory.dother.mil/"
CNET_REGISTRIES = {
    "NODE_DOCKER_REGISTRY": "8200artifactory.dother.mil/docker-images/",
    "PYTHON_DOCKER_REGISTRY": "8200artifactory.dother.mil/uni-registry/base-images/",
}
SECRET_VARS = ("SYM_ENC_KEY", "NEXTAUTH_SECRET")

PROMPT_VARS = {
    "VNC_CLIENT_PASSWORD": "Password for VNC on student PCs",
    #
    "HIVE_HOSTNAME": 'Hostname of Hive instance (e.g. "hive.org")',
    "HIVE_PASSWORD": "Password for Hive PostgreSQL",
    "HIVE_API_PASSWORD": "Password for Hive API",
    #
    "MATTERMOST_URL": 'URL for Mattermost (e.g. "https://mattermost.domain.tld")',
    "MATTERMOST_ACCESS_TOKEN": "Mattermost personal access token",
    "TWEET_CHANNEL_ID": "Mattermost channel ID for tweets",
    #
    "NEXT_PUBLIC_HIVE_URL": 'Base URL of the Hive instance for OIDC SSO (e.g. "https://hive.org")',
    "HIVE_CLIENT_ID": "OAuth client ID registered with Hive for this app",
    "HIVE_CLIENT_SECRET": "OAuth client secret registered with Hive for this app",
}

_INSECURE = ssl.create_default_context()
_INSECURE.check_hostname = False
_INSECURE.verify_mode = ssl.CERT_NONE


def info(msg: str) -> None:
    print(f"🔹 {msg}")


def success(msg: str) -> None:
    print(f"✅ {msg}")


def fail(msg: str) -> None:
    print(f"❌ {msg}")
    sys.exit(1)


def _spec() -> AppSpec:
    """app.json sits beside setup.py in a bundle and under deploy/ in a checkout."""
    here = Path(__file__).resolve().parent
    for candidate in (here / "app.json", here.parent / "deploy" / "app.json"):
        if candidate.is_file():
            return AppSpec.load(str(candidate))
    raise SystemExit("app.json not found next to setup.py or in deploy/")


def _get(url: str, headers: dict | None = None, timeout: float = 10) -> dict:
    request = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(
        request, timeout=timeout, context=_INSECURE
    ) as response:
        body = response.read()
    return json.loads(body) if body.strip().startswith((b"{", b"[")) else {}


def is_connected_to_cnet() -> bool:
    try:
        _get(CNET_TEST_URL, timeout=2)
        return True
    except (OSError, ValueError):
        return False


def find_npm_token() -> str:
    """An @system-b90 GitHub Packages token so `docker compose build` (which
    can't see the host's .npmrc) can pull @system-b90/* deps in development.
    Checked: NPM_TOKEN/GITHUB_TOKEN env vars, then ~/.npmrc."""
    for var in ("NPM_TOKEN", "GITHUB_TOKEN"):
        if os.environ.get(var):
            return os.environ[var]
    npmrc = Path.home() / ".npmrc"
    if npmrc.exists():
        for line in npmrc.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("//npm.pkg.github.com/:_authToken="):
                return line.split("=", 1)[1].strip()
    return ""


def test_mattermost(url: str, token: str, channel_id: str) -> None:
    url = url.strip().rstrip("/")
    if not url or not token:
        print("⚠️  Mattermost URL/token not set — skipping Mattermost validation.")
        return
    headers = {"Authorization": f"Bearer {token.strip()}"}
    info("Testing Mattermost credentials 💬")
    try:
        user = _get(f"{url}/api/v4/users/me", headers)
    except (OSError, ValueError) as error:
        fail(f"Unable to authenticate to Mattermost: {error}")
    info(f"Tweets will be posted as: {user.get('username', '<unknown>')}")
    info("Resolving tweet channel 📢")
    try:
        channel = _get(f"{url}/api/v4/channels/{channel_id.strip()}", headers)
    except (OSError, ValueError) as error:
        fail(f"Unable to resolve tweet channel '{channel_id}': {error}")
    name = channel.get("display_name") or channel.get("name", "<unknown>")
    info(f"Tweets will be posted to: {name}")
    success("Mattermost integration check passed ✅")


def test_hive(hostname: str, api_password: str) -> None:
    info("Testing Hive hostname connectivity 🌐")
    try:
        _get(f"https://{hostname}/")
    except (OSError, ValueError) as error:
        fail(f"Unable to reach Hive: {error}")
    info("Testing Hive credentials 🔐")
    problem = hive.check_api_user(f"https://{hostname}/", "api", api_password)
    if problem:
        fail(f"Unable to authenticate to Hive with provided credentials: {problem}")
    success("Hive integration check passed ✅")


def create_tokens_file(token_path: Path, hostname: str, api_password: str) -> None:
    info("Fetching student list 🧑‍🎓")
    with hive.api_client(f"https://{hostname}/", "api", api_password) as client:
        students = [(s.username, str(s.hostname)) for s in client.get_students()]
    token_path.parent.mkdir(parents=True, exist_ok=True)
    token_path.write_text(
        "\n".join(f"{host}: {host}:5900" for _, host in students) + "\n"
    )
    success(f"WebSocket token file created at {token_path}")


def main() -> None:
    w = Wizard(_spec())

    cnet = is_connected_to_cnet()
    w.set("NODE_TLS_REJECT_UNAUTHORIZED", "0")  # allow self-signed certs
    for key, value in CNET_REGISTRIES.items():
        w.set(key, value if cnet else "")
    w.set("PIP_CONF_PATH", "pip_cnet.conf" if cnet else "pip_online.conf")
    w.set("IS_IN_CNET", "1" if cnet else "0")
    w.set("NPM_TOKEN", find_npm_token() or w.prev("NPM_TOKEN"))
    if not w.values["NPM_TOKEN"]:
        print(
            "⚠️  No @system-b90 GitHub Packages token found (NPM_TOKEN/GITHUB_TOKEN, "
            "~/.npmrc). Only `docker compose build` in a checkout needs one."
        )

    info("Generating secure secrets 🔑")
    for key in SECRET_VARS:
        w.generated(key, b64_key)

    hostname = w.domain(
        "Hostname for Peek-a-Boo (used for the certificate)",
        key="HOSTNAME",
        default="peekaboo.dev",
    )
    w.ports(default_bind="127.0.0.4")

    for key, description in PROMPT_VARS.items():
        if key == "VNC_CLIENT_PASSWORD":
            previous = w.prev(key)
            w.existing[key] = base64.b64decode(previous).decode() if previous else ""
            w.set(key, base64.b64encode(w.ask(key, description).encode()).decode())
        else:
            w.ask(key, description)

    # Persist inputs now so a failure in validation / token fetch / certs
    # doesn't lose them — a re-run offers them as defaults.
    w.write()

    values = w.values
    test_hive(values["HIVE_HOSTNAME"], values["HIVE_API_PASSWORD"])
    test_mattermost(
        values.get("MATTERMOST_URL", ""),
        values.get("MATTERMOST_ACCESS_TOKEN", ""),
        values.get("TWEET_CHANNEL_ID", ""),
    )
    create_tokens_file(
        Path("websock") / "websocket_token_source.txt",
        values["HIVE_HOSTNAME"],
        values["HIVE_API_PASSWORD"],
    )
    w.tls(hostname, ssl_dir="nginx/ssl", cert_name="star.crt", key_name="star.key")
    success("Peek-a-boo environment is ready to go! 🚀🔥")


if __name__ == "__main__":
    main()
