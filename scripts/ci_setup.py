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


def register_sso_service(nextauth_url: str) -> tuple[str, str]:
    print(f"Registering Peek-a-Boo SSO service with Hive at https://{HIVE_HOSTNAME}...")
    try:
        # Hive is initialized with admin/Password1 in CI setup.
        with HiveClient(
            "admin",
            "Password1",
            f"https://{HIVE_HOSTNAME}",
            verify=False,
            timeout=10,
        ) as client:
            sso_credentials = client.register_sso_service(
                service_name="Peek-a-Boo CI",
                redirect_uris=f"{nextauth_url}/api/auth/callback/hive",
            )
            client_id = sso_credentials["client_id"]
            client_secret = sso_credentials["client_secret"]
            print(f"SSO registration successful. Client ID: {client_id}")
            return client_id, client_secret
    except Exception as e:
        print(f"Failed to register SSO with Hive: {e}")
        sys.exit(1)


def main() -> None:
    verify_hive_api_account()

    nextauth_url = f"https://{TEST_HOSTNAME}:8443"
    hive_client_id, hive_client_secret = register_sso_service(nextauth_url)

    env_values = {
        "NODE_TLS_REJECT_UNAUTHORIZED": "0",
        "SYM_ENC_KEY": gen_random_b64_str(),
        "NEXTAUTH_URL": nextauth_url,
        "NEXTAUTH_SECRET": gen_random_b64_str(),
        "HOSTNAME": TEST_HOSTNAME,
        "VNC_CLIENT_PASSWORD": base64.b64encode(VNC_CLIENT_PASSWORD.encode()).decode(),
        "HIVE_HOSTNAME": HIVE_HOSTNAME,
        "HIVE_PASSWORD": "",
        "HIVE_API_PASSWORD": HIVE_API_PASSWORD,
        "MATTERMOST_URL": "",
        "MATTERMOST_ACCESS_TOKEN": "",
        "TWEET_CHANNEL_ID": "",
        "NEXT_PUBLIC_HIVE_URL": f"https://{HIVE_HOSTNAME}",
        "HIVE_CLIENT_ID": hive_client_id,
        "HIVE_CLIENT_SECRET": hive_client_secret,
    }

    env_path = Path(__file__).resolve().parent.parent / ".env"
    env_path.write_text("\n".join(f"{k}='{v}'" for k, v in env_values.items()) + "\n")
    print(f".env file created at {env_path}")


if __name__ == "__main__":
    main()
