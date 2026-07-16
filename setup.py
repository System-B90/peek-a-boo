#!/usr/bin/env python3
"""
Author: Michael K. Steinberg (Bis90 v25)
Name: setup.py
"""

import base64
import os
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


def handle_import_error(module_name: str):
    print(f"❌  Auto-setup requires '{module_name}' package.")
    print(f"➡️   Install it via:\n    pip install {module_name}")
    sys.exit(1)


try:
    from cryptography import x509
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.hazmat.primitives.serialization import (
        Encoding,
        NoEncryption,
        PrivateFormat,
    )
    from cryptography.x509.oid import NameOID
except ImportError:
    handle_import_error("cryptography")

try:
    import ipaddress
except ImportError:
    handle_import_error("ipaddress")

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


def is_connected_to_cnet() -> bool:
    CNET_TEST_URL = "https://8200artifactory.dother.mil/"
    try:
        requests.get(CNET_TEST_URL, timeout=2)
        return True
    except requests.RequestException:
        return False


def choose_docker_registry():
    """Choose Docker registry based on network connectivity."""
    return (
        {
            "NODE_DOCKER_REGISTRY": "8200artifactory.dother.mil/docker-images/",
            "PYTHON_DOCKER_REGISTRY": "8200artifactory.dother.mil/uni-registry/base-images/",
        }
        if is_connected_to_cnet()
        else {
            "NODE_DOCKER_REGISTRY": "",
            "PYTHON_DOCKER_REGISTRY": "",
        }
    )


def choose_pip_conf_name():
    """Choose pip.conf file name based on network connectivity."""
    return "pip_cnet.conf" if is_connected_to_cnet() else "pip_online.conf"


AUTO_VARS = {
    "NODE_TLS_REJECT_UNAUTHORIZED": "0",  # Allow self-signed certs
    **choose_docker_registry(),
    "PIP_CONF_PATH": choose_pip_conf_name(),
    "IS_IN_CNET": "1" if is_connected_to_cnet() else "0",
}

SECRET_VARS = ("SYM_ENC_KEY", "JWT_SECRET")

PROMPT_VARS: Dict[str, str] = {
    "HOSTNAME": "Hostname for Peek-a-Boo (Used for certificate)",
    "WEBSOCKET_SERVER_HOSTNAME": "Hostname for WebSocket server",
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
    "AUTH_SYSTEM": 'Authentication system to use ("ldap" or "hive")',
    "LDAP_DC": 'Domain for LDAP authentication (e.g. "dc=DOMAIN,dc=TLD")',
    "LDAP_URL": 'LDAP URL for authentication (e.g. "ldaps://domain.tld")',
    "SEGEL_OU_PATH": "OU path in the DC in which to search for Segel users (e.g. OU=Segel,OU=Course,DC=DOMAIN,DC=TLD)",
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
            skip_version_check=True,
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
        skip_version_check=True,
    ) as client:
        return [
            (
                x.username,
                str(x.hostname),
            )
            for x in client.get_students()
        ]


def test_mattermost(values: Dict[str, str]):
    url = values.get("MATTERMOST_URL", "").strip().rstrip("/")
    token = values.get("MATTERMOST_ACCESS_TOKEN", "").strip()
    channel_id = values.get("TWEET_CHANNEL_ID", "").strip()

    if not url or not token:
        warn("Mattermost URL/token not set — skipping Mattermost validation.")
        return

    headers = {"Authorization": f"Bearer {token}"}

    info("Testing Mattermost credentials 💬")
    try:
        resp = requests.get(
            f"{url}/api/v4/users/me", headers=headers, verify=False, timeout=10
        )
        resp.raise_for_status()
        user = resp.json()
    except Exception as e:
        error(f"Unable to authenticate to Mattermost: {e}")
        sys.exit(1)
    info(f"Tweets will be posted as: {user.get('username', '<unknown>')}")

    info("Resolving tweet channel 📢")
    try:
        resp = requests.get(
            f"{url}/api/v4/channels/{channel_id}",
            headers=headers,
            verify=False,
            timeout=10,
        )
        resp.raise_for_status()
        channel = resp.json()
    except Exception as e:
        error(f"Unable to resolve tweet channel '{channel_id}': {e}")
        sys.exit(1)
    info(
        f"Tweets will be posted to: {channel.get('display_name') or channel.get('name', '<unknown>')}"
    )

    success("Mattermost integration check passed ✅")


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

    test_mattermost(values)


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


def generate_self_signed_cert(
    cert_path: Path,
    key_path: Path,
    common_name: str,
    alt_names: Optional[list[str]] = None,  # list of DNS names or IP addresses
):
    alt_names = alt_names or [common_name]

    # Generate private key
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    # Certificate subject & issuer (self‑signed => identical)
    subject = issuer = x509.Name(
        [
            x509.NameAttribute(NameOID.COUNTRY_NAME, "IL"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Peek-a-Boo"),
            x509.NameAttribute(NameOID.COMMON_NAME, common_name),
            x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, "Dev"),
        ]
    )

    # Prepare SANs
    san_list = []
    for name in alt_names:
        try:
            # If it's an IP address
            san_list.append(x509.IPAddress(ipaddress.ip_address(name)))
        except ValueError:
            # Otherwise treat as DNS name
            san_list.append(x509.DNSName(name))

    # Build certificate
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(datetime.utcnow())
        .not_valid_after(datetime.utcnow() + timedelta(days=365))
        .add_extension(x509.SubjectAlternativeName(san_list), critical=False)
        .sign(key, hashes.SHA256())
    )

    # Save private key
    with open(key_path, "wb") as f:
        f.write(
            key.private_bytes(
                encoding=Encoding.PEM,
                format=PrivateFormat.TraditionalOpenSSL,
                encryption_algorithm=NoEncryption(),
            )
        )

    # Save certificate
    with open(cert_path, "wb") as f:
        f.write(cert.public_bytes(Encoding.PEM))

    return Path(cert_path), Path(key_path)


def handle_certs(values: dict[str, Any]):
    ROOT_CERT_PATH = Path("./utils/certs/")
    os.makedirs(ROOT_CERT_PATH, exist_ok=True)

    CERT_PATH = ROOT_CERT_PATH / "star.crt"
    KEY_PATH = ROOT_CERT_PATH / "star.key"

    if CERT_PATH.exists() or KEY_PATH.exists():
        success("Using existing certificates")
        return

    cert, key = generate_self_signed_cert(
        cert_path=CERT_PATH,
        key_path=KEY_PATH,
        common_name=values["HOSTNAME"],
        alt_names=[
            f"wss.{values['HOSTNAME']}",
            values["WEBSOCKET_SERVER_HOSTNAME"],
            "localhost",
        ],
    )

    assert cert == CERT_PATH
    assert key == KEY_PATH


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

    existing_values["HOSTNAME"] = (
        existing_values.get("HOSTNAME")
        if existing_values.get("HOSTNAME")
        else "peek-a-boo"
    )

    # Prompt for interactive vars
    for var, desc in PROMPT_VARS.items():
        default = existing_values.get(var, "")
        if var == "WEBSOCKET_SERVER_HOSTNAME" and not default:
            # HOSTNAME is prompted first (dict order), so it's available here.
            default = f"wss.{values['HOSTNAME']}"
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

    # Persist inputs immediately so a failure in any later step (validation,
    # token fetch, certs) doesn't lose them — a re-run offers them as defaults.
    banner("Writing configuration files 📁")
    write_env(values, env_file)

    banner("Validating inputs ✅")
    test_values(values)

    create_tokens_file(token_file, values["HIVE_HOSTNAME"], values["HIVE_API_PASSWORD"])

    handle_certs(values)

    banner("Setup complete 🎉")
    success("Peek-a-boo environment is ready to go! 🚀🔥")


if __name__ == "__main__":
    main()
