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
    from sb90_deploy import envfile, hive
except ImportError:
    print("Error: dependencies missing. Run: pip install -r scripts/requirements.txt")
    sys.exit(1)


def gen_random_b64_str(byte_len: int = 32) -> str:
    return base64.b64encode(secrets.token_bytes(byte_len)).decode()


HIVE_HOSTNAME = "hive.org"
HIVE_URL = f"https://{HIVE_HOSTNAME}/"
# The shared CI Hive is initialised with these; the workflow sets api's.
HIVE_ADMIN_PASSWORD = "Password1"
HIVE_API_PASSWORD = "Password1"
# The e2e stack's proxy publishes on 127.0.0.5:8443 (docker-compose.test.yml).
TEST_HOSTNAME = "peekaboo.test"
VNC_CLIENT_PASSWORD = "TestVncPass1"
VNC_MASTER_PASSWORD = "TestVncMaster1"


def verify_hive_api_account() -> None:
    print(f"Verifying Hive 'api' service account against {HIVE_URL}...")
    problem = hive.check_api_user(HIVE_URL, "api", HIVE_API_PASSWORD)
    if problem:
        print(f"Failed to authenticate Hive 'api' service account: {problem}")
        raise SystemExit(1)
    print("Hive 'api' service account OK.")


def register_sso_service(nextauth_url: str) -> tuple[str, str]:
    print(f"Registering Peek-a-Boo SSO service with Hive at {HIVE_URL}...")
    try:
        # hive.register_sso is interactive (browser/prompts); CI has admin creds.
        with hive.api_client(HIVE_URL, "admin", HIVE_ADMIN_PASSWORD) as client:
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
        raise SystemExit(1) from e


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
        "VNC_MASTER_PASSWORD": base64.b64encode(VNC_MASTER_PASSWORD.encode()).decode(),
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
    envfile.write(str(env_path), env_values)
    print(f".env file created at {env_path}")


if __name__ == "__main__":
    main()
