"""
Name: test_bundle.py
Purpose: Crafts a dry-run release bundle from deploy/app.json (no images, no
    wheels), so a bundle file that moved or a dev compose file shipped by
    mistake fails on the PR instead of in the tag-triggered release job.
Created: 2026-09-26
Author: Michael K. Steinberg
"""

import tarfile
from pathlib import Path

from sb90_deploy.bundle import craft

ROOT = Path(__file__).resolve().parents[2]


def test_release_bundle_has_everything_install_needs(tmp_path: Path) -> None:
    online, offline = craft(
        str(ROOT / "deploy" / "app.json"),
        "v0.0.0-test",
        str(tmp_path),
        repo=str(ROOT),
        images="skip",
        wheels=False,
    )
    with tarfile.open(online) as tar:
        names = set(tar.getnames())
    for expected in (
        "app.json",
        "VERSION",
        "bootstrap.py",
        "requirements.txt",
        "setup.py",
        "install.sh",
        "install.ps1",
        "update.sh",
        "update.ps1",
        "link-hive.sh",
        "link-hive.ps1",
        "docker-compose.yml",
        "docker-compose.hive-local.yml",
        "nginx/nginx.conf.template",
    ):
        assert f"peekaboo/{expected}" in names, expected
    assert offline.name == "peekaboo-offline-v0.0.0-test.tar.gz"
