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
import re
import secrets
import shutil
import ssl
import sys
import urllib.error
import urllib.parse
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

# Build-time CNET switches from before images shipped in the release bundle.
# Dropped from .env on re-run rather than carried forward.
OBSOLETE_VARS = (
    "NODE_DOCKER_REGISTRY",
    "PYTHON_DOCKER_REGISTRY",
    "PIP_CONF_PATH",
    "IS_IN_CNET",
    # Students are read through the Hive API now; no Hive DB access (#102).
    "HIVE_PASSWORD",
    "HIVE_POSTGRES_HOSTNAME",
    "HIVE_POSTGRES_USERNAME",
)
SECRET_VARS = ("SYM_ENC_KEY", "NEXTAUTH_SECRET")

PROMPT_VARS = {
    "VNC_CLIENT_PASSWORD": "Password for VNC on student PCs",
    # Hive
    "HIVE_HOSTNAME": 'Hostname of Hive instance (e.g. "hive.org")',
    "HIVE_API_PASSWORD": "Password for Hive API",
    # Mattermost
    "MATTERMOST_URL": 'URL for Mattermost (e.g. "https://mattermost.domain.tld")',
    "MATTERMOST_ACCESS_TOKEN": "Mattermost personal access token",
    "TWEET_CHANNEL_URL": (
        'Mattermost tweets channel URL (e.g. "https://mattermost.local/my-team/channels/tweets")'
    ),
    # Hive SSO
    "NEXT_PUBLIC_HIVE_URL": 'Base URL of the Hive instance for OIDC SSO (e.g. "https://hive.org")',
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


def find_npm_token() -> str:
    """An @system-b90 GitHub Packages token so `docker compose build` (which
    can't see the host's .npmrc) can pull @system-b90/* deps in development.
    Checked by sb90-devops: NPM_TOKEN/GITHUB_TOKEN/GH_TOKEN, ~/.npmrc, then
    `gh auth token`. Release bundles ship without sb90-devops and pull
    prebuilt images, so they need no token."""
    try:
        from sb90_devops import find_npm_token as shared_lookup
    except ImportError:
        return ""
    return shared_lookup() or ""


# A Mattermost channel ID is 26 lowercase base32 characters.
_CHANNEL_ID = re.compile(r"^[a-z0-9]{26}$")


def parse_channel_url(channel_url: str) -> tuple[str, str, str]:
    """Split a channel URL into (server base URL, team name, channel name).

    Accepts ``https://host[/subpath]/<team>/channels/<channel>`` with an
    optional trailing slash, query or fragment, as copied from the browser.
    """
    parsed = urllib.parse.urlsplit(channel_url.strip())
    parts = [part for part in parsed.path.split("/") if part]
    if not parsed.scheme or not parsed.netloc or len(parts) < 3:
        raise ValueError(f"'{channel_url}' is not a Mattermost channel URL")
    if parts[-2] != "channels":
        raise ValueError(
            f"'{channel_url}' is not a channel URL "
            "(expected .../<team>/channels/<channel>)"
        )
    base = f"{parsed.scheme}://{parsed.netloc}" + "".join(
        f"/{part}" for part in parts[:-3]
    )
    return base, parts[-3], parts[-1]


def resolve_tweet_channel_id(url: str, token: str, channel_url: str) -> str:
    """The channel ID behind a channel URL, looked up through Mattermost's API.

    A bare channel ID (what earlier versions of this wizard asked for) is
    returned unchanged, so existing answers keep working.
    """
    channel_url = channel_url.strip()
    if not channel_url or _CHANNEL_ID.match(channel_url):
        return channel_url
    base, team, channel = parse_channel_url(channel_url)
    api = (url.strip().rstrip("/") or base) + "/api/v4"
    headers = {"Authorization": f"Bearer {token.strip()}"}
    found = _get(
        f"{api}/teams/name/{urllib.parse.quote(team)}"
        f"/channels/name/{urllib.parse.quote(channel)}",
        headers,
    )
    channel_id = found.get("id") if isinstance(found, dict) else None
    if not channel_id:
        raise ValueError(f"Mattermost returned no channel for '{channel_url}'")
    return str(channel_id)


def set_tweet_channel(w: Wizard) -> None:
    """Turn the TWEET_CHANNEL_URL answer into the TWEET_CHANNEL_ID the app reads."""
    channel_url = w.values.get("TWEET_CHANNEL_URL", "")
    token = w.values.get("MATTERMOST_ACCESS_TOKEN", "")
    if not channel_url:
        w.set("TWEET_CHANNEL_ID", "")
        return
    if not token and not _CHANNEL_ID.match(channel_url.strip()):
        print("⚠️  Mattermost token not set — cannot resolve the tweet channel.")
        w.keep("TWEET_CHANNEL_ID")
        return
    info("Resolving tweet channel URL 🔗")
    try:
        channel_id = resolve_tweet_channel_id(
            w.values.get("MATTERMOST_URL", ""), token, channel_url
        )
    except (OSError, ValueError) as error:
        fail(f"Unable to resolve the tweet channel: {error}")
    w.set("TWEET_CHANNEL_ID", channel_id)


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


def _set_master_password(w: Wizard, previous_client: str) -> None:
    """Keep an existing master password; otherwise generate a unique one.

    A re-run on a deployment that predates VNC_MASTER_PASSWORD reuses the client
    password, since that is what its master password effectively already is.
    """
    existing = w.prev("VNC_MASTER_PASSWORD")
    if existing:
        w.set("VNC_MASTER_PASSWORD", existing)
    elif previous_client:
        w.set("VNC_MASTER_PASSWORD", previous_client)
    else:
        password = secrets.token_urlsafe(12)
        w.set("VNC_MASTER_PASSWORD", base64.b64encode(password.encode()).decode())


def seed_default_cert(ssl_dir: Path) -> None:
    """In a checkout, start from the committed dev cert (System-B90 Dev Root CA,
    covers peekaboo.dev / peekaboo.test / peekaboo.localhost). w.tls keeps it
    when it covers the chosen hostname and issues a fresh one otherwise. Release
    bundles don't ship nginx/ssl-default, so production gets its own cert."""
    default = Path(__file__).resolve().parent.parent / "nginx" / "ssl-default"
    if not default.is_dir():
        return
    if (ssl_dir / "star.crt").exists() or (ssl_dir / "star.key").exists():
        return
    ssl_dir.mkdir(parents=True, exist_ok=True)
    for name in ("star.crt", "star.key"):
        shutil.copy2(default / name, ssl_dir / name)
    info("Copied the default dev cert (System-B90 Dev Root CA) to nginx/ssl 🔒")


def main() -> None:
    w = Wizard(_spec())

    for key in OBSOLETE_VARS:
        w.existing.pop(key, None)
    w.set("NODE_TLS_REJECT_UNAUTHORIZED", "0")  # allow self-signed certs
    w.set("NPM_TOKEN", find_npm_token() or w.prev("NPM_TOKEN"))
    if not w.values["NPM_TOKEN"]:
        print(
            "⚠️  No @system-b90 GitHub Packages token found (NPM_TOKEN/GITHUB_TOKEN/"
            "GH_TOKEN, ~/.npmrc, gh auth). Only `docker compose build` in a "
            "checkout needs one."
        )

    info("Generating secure secrets 🔑")
    for key in SECRET_VARS:
        w.generated(key, b64_key)

    hostname = w.domain(
        "Hostname for Peek-a-Boo (used for the certificate)",
        key="HOSTNAME",
        default="peekaboo.dev",
    )
    w.ports()

    for key, description in PROMPT_VARS.items():
        if (
            key == "TWEET_CHANNEL_URL"
            and not w.prev(key)
            and w.prev("TWEET_CHANNEL_ID")
        ):
            # Upgrading from a version that asked for the raw ID: offer it.
            w.existing[key] = w.prev("TWEET_CHANNEL_ID")
        if key == "VNC_CLIENT_PASSWORD":
            previous = w.prev(key)
            w.existing[key] = base64.b64decode(previous).decode() if previous else ""
            w.set(key, base64.b64encode(w.ask(key, description).encode()).decode())
        else:
            w.ask(key, description)
    # Registers the Hive SSO client (browser/password fallbacks in sb90-deploy),
    # or keeps an existing one.
    w.sso(w.values["NEXT_PUBLIC_HIVE_URL"])

    # Persist inputs now so a failure in validation / token fetch / certs
    # doesn't lose them — a re-run offers them as defaults.
    w.write()

    set_tweet_channel(w)
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
    seed_default_cert(Path("nginx") / "ssl")
    w.tls(hostname, ssl_dir="nginx/ssl", cert_name="star.crt", key_name="star.key")
    success("Peek-a-boo environment is ready to go! 🚀🔥")


if __name__ == "__main__":
    main()
