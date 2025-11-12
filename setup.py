#!/usr/bin/env python3
"""
Author: Michael K. Steinberg (Bis90 v25)
Name: setup.py
"""

import base64
import random
import sys
from pathlib import Path
from typing import Dict, List, Tuple
import os


def handle_import_error(module_name: str):
    print(f"❌  Auto-setup requires '{module_name}' package.")
    print(f"➡️   Install it via:\n    pip install {module_name}")
    sys.exit(1)


try:
    from dotenv import load_dotenv
except ImportError:
    handle_import_error("dotenv")

try:
    import requests
except ImportError:
    handle_import_error("requests")

try:
    from pyhive import HiveClient
except ImportError:
    print("❌  Auto-setup requires 'pyhive' package.")
    print("➡️   Install it via:\n    pip install PyHiveLMS")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Configuration Constants
# ---------------------------------------------------------------------------

AUTO_VARS = {
    "NODE_TLS_REJECT_UNAUTHORIZED": "0",  # Allow self-signed certs
}

SECRET_VARS = ("SYM_ENC_KEY", "JWT_SECRET")

PROMPT_VARS: Dict[str, str] = {
    "HIVE_HOSTNAME": "Hostname of Hive instance (e.g. hive.dother.mil)",
    "HIVE_PASSWORD": "Password for Hive PostgreSQL",
    "HIVE_API_PASSWORD": "Password for Hive API",
    "VNC_CLIENT_PASSWORD": "Password for VNC on student PCs",
    "TWEET_CHANNEL_ID": "Mattermost channel ID for tweets",
    "MATTERMOST_ACCESS_TOKEN": "Mattermost personal access token",
    "WEBSOCKET_SERVER_HOSTNAME": "Hostname for WebSocket server",
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def banner(msg: str):
    print(f"\n✨ {msg}")


def info(msg: str):
    print(f"🔹 {msg}")


def success(msg: str):
    print(f"✅ {msg}")


def warn(msg: str):
    print(f"⚠️  {msg}")


def error(msg: str):
    print(f"❌ {msg}")


def gen_random_b64_str(byte_len: int = 32) -> str:
    return base64.b64encode(random.randbytes(byte_len)).decode()


def b64_encode(value: str) -> str:
    return base64.b64encode(value.encode()).decode()


def b64_decode(value: str) -> str:
    if len(value) == 0:
        return value
    return base64.b64decode(value).decode()


def project_root() -> Path:
    return Path(sys.argv[0]).resolve().parent


def test_hive_user(hostname: str, password: str) -> bool:
    try:
        with HiveClient(
            username="api",
            password=password,
            hive_url=f"https://{hostname}/",
            verify=False,
        ) as client:
            client.get_hive_version()
            return True
    except Exception as e:
        warn(f"Hive authentication test failed: {e}")
        return False


def get_hive_students(hostname: str, password: str) -> List[Tuple[str, str]]:
    with HiveClient(
        username="api",
        password=password,
        hive_url=f"https://{hostname}/",
        verify=False,
    ) as client:
        return [
            (
                x.username,
                str(x.hostname),
            )
            for x in client.get_students()
        ]


def test_values(values: Dict[str, str]):
    info("Testing Hive hostname connectivity 🌐")
    try:
        resp = requests.get(f"https://{values['HIVE_HOSTNAME']}/", verify=False)
        resp.raise_for_status()
    except Exception as e:
        error(f"Unable to reach Hive: {e}")
        sys.exit(1)

    info("Testing Hive credentials 🔐")
    if not test_hive_user(values["HIVE_HOSTNAME"], values["HIVE_API_PASSWORD"]):
        error("Unable to authenticate to Hive with provided credentials.")
        sys.exit(1)

    success("Hive integration check passed ✅")


# ---------------------------------------------------------------------------
# Main Logic
# ---------------------------------------------------------------------------


def load_existing_env(env_path: Path) -> Dict[str, str]:
    """Load existing .env file into a dictionary if it exists."""
    if not env_path.exists():
        return {}
    load_dotenv(env_path)  # loads into os.environ
    return {
        var: (
            os.getenv(var, "")
            if var != "VNC_CLIENT_PASSWORD"
            else b64_decode(os.getenv(var, ""))
        )
        for var in PROMPT_VARS.keys() | set(SECRET_VARS) | set(AUTO_VARS.keys())
    }


def collect_vars() -> Dict[str, str]:
    banner("Hive Setup Wizard 🚀")
    root = project_root()
    env_path = root / ".env"

    existing_values = load_existing_env(env_path)
    values = AUTO_VARS.copy()

    info("Generating secure secrets 🔑")
    for s in SECRET_VARS:
        # reuse existing value if present
        values[s] = existing_values.get(s, gen_random_b64_str())

    # Prompt for interactive vars
    for var, desc in PROMPT_VARS.items():
        default = existing_values.get(var, "")
        prompt_msg = (
            f"👉 {var} ({desc}) [{default}]: " if default else f"👉 {var} ({desc}) = "
        )
        val = input(prompt_msg).strip()
        if not val:  # use default if user presses Enter
            val = default

        if var == "VNC_CLIENT_PASSWORD":
            val = b64_encode(val)

        values[var] = val

    return values


def write_env(values: Dict[str, str], env_path: Path):
    env_content = "\n".join(f"{k}='{v}'" for k, v in values.items())
    env_path.write_text(env_content)
    success(f".env file created at {env_path}")


def create_tokens_file(token_path: Path, hive_hostname: str, hive_password: str):
    info("Fetching student list 🧑‍🎓")
    students = get_hive_students(hive_hostname, hive_password)

    token_path.write_text(
        "\n".join(f"{hostname}: {hostname}:5900" for username, hostname in students)
        + "\n"
    )
    success(f"WebSocket token file created at {token_path}")


def main():
    root = project_root()
    env_file = root / ".env"
    token_file = root / "websock" / "websocket_token_source.txt"

    values = collect_vars()

    banner("Validating inputs ✅")
    test_values(values)

    banner("Writing configuration files 📁")
    write_env(values, env_file)
    create_tokens_file(token_file, values["HIVE_HOSTNAME"], values["HIVE_API_PASSWORD"])

    banner("Setup complete 🎉")
    success("Peek-a-boo environment is ready to go! 🚀🔥")


if __name__ == "__main__":
    main()
