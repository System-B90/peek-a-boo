"""
Name: test_publish.py
Purpose: Regression tests for scripts/publish.py's manifest bump. The script it
    replaced (bump_version.py) rewrote package.json onto one line and never
    committed the bump, so package.json drifted behind the release tags.
Created: 2026-09-26
Author: Michael K. Steinberg
"""

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import publish  # noqa: E402

PACKAGE = """{
    "name": "peek-a-boo",
    "version": "1.3.3",
    "dependencies": {
        "next": "15.0.0"
    }
}
"""

LOCK = """{
    "name": "peek-a-boo",
    "version": "1.3.3",
    "lockfileVersion": 3,
    "packages": {
        "": {
            "name": "peek-a-boo",
            "version": "1.3.3"
        },
        "node_modules/next": {
            "version": "15.0.0"
        }
    }
}
"""


@pytest.fixture
def repo(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    (tmp_path / "package.json").write_text(PACKAGE, encoding="utf-8")
    (tmp_path / "package-lock.json").write_text(LOCK, encoding="utf-8")
    monkeypatch.chdir(tmp_path)
    return tmp_path


def test_bumps_package_json_in_place(repo: Path) -> None:
    updated = publish.update_manifests("1.4.3")

    text = (repo / "package.json").read_text(encoding="utf-8")
    assert text == PACKAGE.replace('"version": "1.3.3"', '"version": "1.4.3"')
    assert Path("package.json") in updated


def test_bumps_only_root_versions_in_lock(repo: Path) -> None:
    publish.update_manifests("1.4.3")

    lock = json.loads((repo / "package-lock.json").read_text(encoding="utf-8"))
    assert lock["version"] == "1.4.3"
    assert lock["packages"][""]["version"] == "1.4.3"
    assert lock["packages"]["node_modules/next"]["version"] == "15.0.0"


def test_missing_lock_file_is_skipped(repo: Path) -> None:
    (repo / "package-lock.json").unlink()

    assert publish.update_manifests("1.4.3") == [Path("package.json")]
