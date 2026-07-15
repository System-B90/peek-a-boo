#!/usr/bin/env python3
"""
Author: Michael K. Steinberg
Name: ci_setup.py

Non-interactive .env generator for CI e2e runs. Unlike setup.py (interactive
dev bootstrap), this assumes Hive is already up and its "api" service
account's password was already set by the workflow, and never prompts.
"""

import base64
import secrets
import sys
from pathlib import Path

try:
    from pyhive import HiveClient
except ImportError:
    print("Error: PyHiveLMS is not installed. Run: pip install PyHiveLMS")
    sys.exit(1)


def gen_random_b64_str(byte_len: int = 32) -> str:
    return base64.b64encode(secrets.token_bytes(byte_len)).decode()


HIVE_HOSTNAME = "hive.org"
HIVE_API_PASSWORD = "Password1"
TEST_HOSTNAME = "peekaboo.dev"
TEST_WEBSOCKET_HOSTNAME = f"wss.{TEST_HOSTNAME}"
VNC_CLIENT_PASSWORD = "TestVncPass1"


def verify_hive_api_account() -> None:
    print(f"Verifying Hive 'api' service account against https://{HIVE_HOSTNAME}...")
    try:
        with HiveClient(
            username="api",
            password=HIVE_API_PASSWORD,
            hive_url=f"https://{HIVE_HOSTNAME}/",
            verify=False,
            skip_version_check=True,
            timeout=10,
        ) as client:
            client.get_hive_version()
    except Exception as e:
        print(f"Failed to authenticate Hive 'api' service account: {e}")
        sys.exit(1)
    print("Hive 'api' service account OK.")


def main() -> None:
    verify_hive_api_account()

    env_values = {
        "NODE_TLS_REJECT_UNAUTHORIZED": "0",
        "SYM_ENC_KEY": gen_random_b64_str(),
        "JWT_SECRET": gen_random_b64_str(),
        "HOSTNAME": TEST_HOSTNAME,
        "WEBSOCKET_SERVER_HOSTNAME": TEST_WEBSOCKET_HOSTNAME,
        "VNC_CLIENT_PASSWORD": base64.b64encode(VNC_CLIENT_PASSWORD.encode()).decode(),
        "HIVE_HOSTNAME": HIVE_HOSTNAME,
        "HIVE_PASSWORD": "",
        "HIVE_API_PASSWORD": HIVE_API_PASSWORD,
        "MATTERMOST_URL": "",
        "MATTERMOST_ACCESS_TOKEN": "",
        "TWEET_CHANNEL_ID": "",
        "AUTH_SYSTEM": "hive",
        "LDAP_DC": "",
        "LDAP_URL": "",
        "SEGEL_OU_PATH": "",
    }

    env_path = Path(__file__).resolve().parent.parent / ".env"
    env_path.write_text("\n".join(f"{k}='{v}'" for k, v in env_values.items()) + "\n")
    print(f".env file created at {env_path}")


if __name__ == "__main__":
    main()
