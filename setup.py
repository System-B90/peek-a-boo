#!/usr/bin/env python3
"""
Author: Michael K. Steinberg (Bis90 v25)
Name: setup.py
"""

import base64
import os
import random
import shutil
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple


def handle_import_error(module_name: str):
    print(f"❌  Auto-setup requires '{module_name}' package.")
    print(f"➡️   Install it via:\n    pip install {module_name}")
    sys.exit(1)


try:
    from cryptography import x509
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.serialization import (
        Encoding,
        NoEncryption,
        PrivateFormat,
    )
    from cryptography.x509.oid import ExtendedKeyUsageOID, NameOID
except ImportError:
    handle_import_error("cryptography")

try:
    import ipaddress
except ImportError:
    handle_import_error("ipaddress")

try:
    from dotenv import load_dotenv
except ImportError:
    # The import name is `dotenv`; the distribution is `python-dotenv`. There
    # is a separate, unrelated `dotenv` on PyPI, so printing the import name
    # here sent people to install the wrong package.
    handle_import_error("python-dotenv")

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


def find_npm_token() -> str:
    """Look for an existing @system-b90 GitHub Packages token so
    `docker compose build` (which can't see the host's global .npmrc) can
    still pull @system-b90/* deps. Checked in order: NPM_TOKEN/GITHUB_TOKEN
    env vars, then ~/.npmrc's registry auth line."""
    for var in ("NPM_TOKEN", "GITHUB_TOKEN"):
        if os.environ.get(var):
            return os.environ[var]

    npmrc_path = Path.home() / ".npmrc"
    if npmrc_path.exists():
        for line in npmrc_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("//npm.pkg.github.com/:_authToken="):
                return line.split("=", 1)[1].strip()

    return ""


AUTO_VARS = {
    "NODE_TLS_REJECT_UNAUTHORIZED": "0",  # Allow self-signed certs
    **choose_docker_registry(),
    "PIP_CONF_PATH": choose_pip_conf_name(),
    "IS_IN_CNET": "1" if is_connected_to_cnet() else "0",
    "NPM_TOKEN": find_npm_token(),
    "PEEKABOO_BIND_IP": "127.0.0.4",
    "PEEKABOO_HTTP_PORT": "80",
    "PEEKABOO_HTTPS_PORT": "443",
    "NEXTAUTH_URL": "",  # filled in after HOSTNAME is known, see collect_vars()
}

SECRET_VARS = ("SYM_ENC_KEY", "NEXTAUTH_SECRET", "HIVE_CLIENT_SECRET")

# Images docker-compose.yml expects (README "Quick Start" step 4).
REQUIRED_DOCKER_IMAGES = (
    "ghcr.io/system-b90/peek-a-boo/nextjs",
    "nginx",
    "ghcr.io/system-b90/peek-a-boo/websock",
)
# Image tarballs (e.g. from the releases tab) dropped here get `docker load`ed.
DOCKER_IMAGES_DIR = "images"

PROMPT_VARS: Dict[str, str] = {
    "HOSTNAME": "Hostname for Peek-a-Boo (Used for certificate)",
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


CA_NAME = "System-B90 Local Dev CA"


def _write_pem(path: Path, data: bytes, private: bool = False):
    path.write_bytes(data)
    if private:
        try:
            path.chmod(0o600)
        except OSError:  # Windows: chmod is a no-op for most bits
            pass


def _key_pem(key) -> bytes:
    return key.private_bytes(
        encoding=Encoding.PEM,
        format=PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=NoEncryption(),
    )


def load_or_create_ca(ca_cert_path: Path, ca_key_path: Path):
    """Return (cert, key) of the local System-B90 dev CA, creating it once.

    The CA is reused so trusting ca.crt in the OS/browser survives leaf
    regeneration.
    """
    if ca_cert_path.exists() and ca_key_path.exists():
        cert = x509.load_pem_x509_certificate(ca_cert_path.read_bytes())
        key = serialization.load_pem_private_key(ca_key_path.read_bytes(), None)
        return cert, key

    key = rsa.generate_private_key(public_exponent=65537, key_size=4096)
    name = x509.Name(
        [
            x509.NameAttribute(NameOID.COUNTRY_NAME, "IL"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "System-B90"),
            x509.NameAttribute(NameOID.COMMON_NAME, CA_NAME),
        ]
    )
    now = datetime.now(timezone.utc)
    cert = (
        x509.CertificateBuilder()
        .subject_name(name)
        .issuer_name(name)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - timedelta(minutes=5))
        .not_valid_after(now + timedelta(days=3650))
        .add_extension(x509.BasicConstraints(ca=True, path_length=None), critical=True)
        .add_extension(
            x509.KeyUsage(
                digital_signature=False,
                content_commitment=False,
                key_encipherment=False,
                data_encipherment=False,
                key_agreement=False,
                key_cert_sign=True,
                crl_sign=True,
                encipher_only=False,
                decipher_only=False,
            ),
            critical=True,
        )
        .add_extension(
            x509.SubjectKeyIdentifier.from_public_key(key.public_key()), critical=False
        )
        .sign(key, hashes.SHA256())
    )
    _write_pem(ca_cert_path, cert.public_bytes(Encoding.PEM))
    _write_pem(ca_key_path, _key_pem(key), private=True)
    return cert, key


def generate_ca_signed_cert(
    cert_path: Path,
    key_path: Path,
    ca_cert,
    ca_key,
    common_name: str,
    alt_names: list[str],  # DNS names or IP addresses
):
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = x509.Name(
        [
            x509.NameAttribute(NameOID.COUNTRY_NAME, "IL"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "System-B90"),
            x509.NameAttribute(NameOID.COMMON_NAME, common_name),
        ]
    )

    san_list: list[x509.GeneralName] = []
    for name in dict.fromkeys(alt_names):  # de-dupe, keep order
        try:
            san_list.append(x509.IPAddress(ipaddress.ip_address(name)))
        except ValueError:
            san_list.append(x509.DNSName(name))

    now = datetime.now(timezone.utc)
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(ca_cert.subject)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - timedelta(minutes=5))
        # 397 days: the longest lifetime browsers accept for a leaf.
        .not_valid_after(now + timedelta(days=397))
        .add_extension(x509.BasicConstraints(ca=False, path_length=None), critical=True)
        .add_extension(
            x509.KeyUsage(
                digital_signature=True,
                content_commitment=False,
                key_encipherment=True,
                data_encipherment=False,
                key_agreement=False,
                key_cert_sign=False,
                crl_sign=False,
                encipher_only=False,
                decipher_only=False,
            ),
            critical=True,
        )
        .add_extension(
            x509.ExtendedKeyUsage([ExtendedKeyUsageOID.SERVER_AUTH]), critical=False
        )
        .add_extension(x509.SubjectAlternativeName(san_list), critical=False)
        .add_extension(
            x509.AuthorityKeyIdentifier.from_issuer_public_key(ca_key.public_key()),
            critical=False,
        )
        .sign(ca_key, hashes.SHA256())
    )
    _write_pem(cert_path, cert.public_bytes(Encoding.PEM))
    _write_pem(key_path, _key_pem(key), private=True)


def cert_is_current(cert_path: Path, ca_cert, names: list[str]) -> bool:
    """True if the leaf is issued by our CA, not near expiry, and covers `names`."""
    try:
        cert = x509.load_pem_x509_certificate(cert_path.read_bytes())
        sans = cert.extensions.get_extension_for_class(
            x509.SubjectAlternativeName
        ).value.get_values_for_type(x509.DNSName)
    except (OSError, ValueError, x509.ExtensionNotFound):
        return False
    return (
        cert.issuer == ca_cert.subject
        and cert.not_valid_after_utc > datetime.now(timezone.utc) + timedelta(days=14)
        and all(n in sans for n in names)
    )


def handle_certs(values: dict[str, Any]):
    root = Path("./utils/certs/")
    os.makedirs(root, exist_ok=True)

    cert_path, key_path = root / "star.crt", root / "star.key"
    ca_cert_path, ca_key_path = root / "ca.crt", root / "ca.key"

    hostname = values["HOSTNAME"]
    ca_cert, ca_key = load_or_create_ca(ca_cert_path, ca_key_path)

    if key_path.exists() and cert_is_current(cert_path, ca_cert, [hostname]):
        success("Using existing certificates")
    else:
        alt_names = [hostname, "localhost", "127.0.0.1"]
        bind_ip = values.get("PEEKABOO_BIND_IP", "0.0.0.0")
        if bind_ip != "0.0.0.0":
            alt_names.append(bind_ip)
        generate_ca_signed_cert(
            cert_path,
            key_path,
            ca_cert,
            ca_key,
            common_name=hostname,
            alt_names=alt_names,
        )
        success(f"Issued {cert_path} (signed by {CA_NAME})")

    info(
        f"Trust {ca_cert_path} once to silence browser warnings "
        f"(Windows: certutil -addstore -user Root {ca_cert_path})"
    )


def collect_vars() -> Dict[str, str]:
    banner("Hive Setup Wizard 🚀")
    root = project_root()
    env_path = root / ".env"

    existing_values = load_existing_env(env_path)
    values = AUTO_VARS.copy()
    if not values["NPM_TOKEN"]:
        values["NPM_TOKEN"] = existing_values.get("NPM_TOKEN", "")
    if not values["NPM_TOKEN"]:
        print(
            "⚠️  No @system-b90 GitHub Packages token found (checked NPM_TOKEN/"
            "GITHUB_TOKEN env vars and ~/.npmrc). `docker compose build` will "
            "fail to install @system-b90/* deps until NPM_TOKEN is set in .env."
        )

    info("Generating secure secrets 🔑")
    for s in SECRET_VARS:
        # reuse existing value if present
        values[s] = existing_values.get(s, gen_random_b64_str())

    existing_values["HOSTNAME"] = (
        existing_values.get("HOSTNAME")
        if existing_values.get("HOSTNAME")
        else "peekaboo.dev"
    )

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

    # NextAuth needs this to build correct callback/redirect URLs — without
    # it, it falls back to guessing from request headers, which breaks
    # behind the nginx proxy.
    # Bind/port settings are kept from an existing .env (like Bluz's
    # BLUZ_BIND_IP / *_PORT) so the URL below matches what nginx publishes.
    for var in ("PEEKABOO_BIND_IP", "PEEKABOO_HTTP_PORT", "PEEKABOO_HTTPS_PORT"):
        values[var] = existing_values.get(var) or AUTO_VARS[var]
    https_port = values["PEEKABOO_HTTPS_PORT"]
    port_suffix = "" if https_port == "443" else f":{https_port}"
    values["NEXTAUTH_URL"] = f"https://{values['HOSTNAME']}{port_suffix}"

    return values


def write_env(values: Dict[str, str], env_path: Path):
    env_content = "\n".join(f"{k}='{v}'" for k, v in values.items()) + "\n"
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


def docker_image_exists(image: str) -> bool:
    result = subprocess.run(
        ["docker", "images", "-q", image],
        capture_output=True,
        text=True,
        check=False,
    )
    return result.returncode == 0 and bool(result.stdout.strip())


def handle_docker_images():
    banner("Checking Docker images 🐳")

    if shutil.which("docker") is None:
        warn("Docker not found on PATH — skipping image checks.")
        return

    # Load any image tarballs dropped into ./images/ (offline installs).
    images_dir = project_root() / DOCKER_IMAGES_DIR
    for tarball in sorted(images_dir.glob("*.tar")) if images_dir.is_dir() else []:
        info(f"Loading image from {tarball.name} 📦")
        result = subprocess.run(
            ["docker", "load", "-i", str(tarball)],
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode == 0:
            success(result.stdout.strip() or f"Loaded {tarball.name}")
        else:
            warn(f"Failed to load {tarball.name}: {result.stderr.strip()}")

    missing = [i for i in REQUIRED_DOCKER_IMAGES if not docker_image_exists(i)]
    if not missing:
        success("All required Docker images are present")
        return

    warn(f"Missing Docker images: {', '.join(missing)}")
    info(
        f"Place release tarballs in ./{DOCKER_IMAGES_DIR}/ and re-run setup, "
        "or pull/build them:"
    )
    for image in missing:
        if "peek-a-boo/" in image:
            print(f"    docker load -i <{image.split('/')[1]}.tar from releases tab>")
        else:
            print(f"    docker pull {image}")


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

    handle_docker_images()

    banner("Setup complete 🎉")
    success("Peek-a-boo environment is ready to go! 🚀🔥")


if __name__ == "__main__":
    main()
