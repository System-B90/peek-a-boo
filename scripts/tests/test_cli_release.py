"""
Name: test_cli_release.py
Purpose: Keep the peekaboo-cli package wired into the release: its version is
    bumped with the app's by `python -m sb90_deploy publish`, and release
    bundles vendor its wheel and install it into the bundle's venv.
Created: 2026-09-27
Author: Michael K. Steinberg
"""

import json
import re
import shutil
from pathlib import Path

import tomllib
from sb90_deploy.release import Manifest, update_manifests

ROOT = Path(__file__).resolve().parents[2]
APP_JSON = json.loads((ROOT / "deploy" / "app.json").read_text(encoding="utf-8"))
CLI_VERSION_FILE = "cli/peekaboo_cli/__init__.py"


def _cli_version(root: Path) -> str:
    text = (root / CLI_VERSION_FILE).read_text(encoding="utf-8")
    match = re.search(r'__version__\s*=\s*"([^"]+)"', text)
    assert match, f"no __version__ in {CLI_VERSION_FILE}"
    return match.group(1)


def test_cli_version_matches_the_app_version() -> None:
    package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
    assert _cli_version(ROOT) == package["version"]


def test_publish_bumps_the_cli_version_with_the_app(tmp_path: Path) -> None:
    for rel in ("package.json", "package-lock.json", CLI_VERSION_FILE):
        (tmp_path / rel).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(ROOT / rel, tmp_path / rel)
    manifests = [Manifest.from_spec(m) for m in APP_JSON["release"]["manifests"]]

    updated = update_manifests(tmp_path, manifests, "9.8.7")

    assert CLI_VERSION_FILE in updated
    assert _cli_version(tmp_path) == "9.8.7"


def test_bundles_ship_and_install_the_cli() -> None:
    pyproject = tomllib.loads((ROOT / "cli" / "pyproject.toml").read_text("utf-8"))
    assert pyproject["project"]["name"] in APP_JSON["venv_packages"]
    assert "cli/dist/*.whl" in APP_JSON["bundle"]["local_wheels"]
    assert pyproject["project"]["scripts"] == {"peekaboo": "peekaboo_cli.main:run"}
