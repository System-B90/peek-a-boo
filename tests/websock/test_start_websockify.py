"""
Name: test_start_websockify.py
Purpose: Pins the websockify token-file resolution order and the
         no-file-found failure mode. websock/ is the repo's only Python
         runtime code and had no tests (peek-a-boo#60).
Created: 2026-09-19
Author: Michael K. Steinberg
"""

import importlib.util
import sys
from pathlib import Path

import pytest

_MODULE_PATH = Path(__file__).resolve().parents[2] / "websock" / "start_websockify.py"


def _load():
    spec = importlib.util.spec_from_file_location("start_websockify", _MODULE_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules["start_websockify"] = module
    spec.loader.exec_module(module)
    return module


websockify = _load()


def test_prefers_the_first_location_that_exists(tmp_path: Path) -> None:
    first = tmp_path / "in-container.txt"
    second = tmp_path / "cwd.txt"
    first.write_text("token-a")
    second.write_text("token-b")

    resolved = websockify.resolve_token_source_file((str(first), str(second)))

    assert resolved == first


def test_falls_back_to_a_later_location(tmp_path: Path) -> None:
    missing = tmp_path / "in-container.txt"
    present = tmp_path / "cwd.txt"
    present.write_text("token-b")

    resolved = websockify.resolve_token_source_file((str(missing), str(present)))

    assert resolved == present


def test_walks_past_several_missing_locations(tmp_path: Path) -> None:
    present = tmp_path / "third.txt"
    present.write_text("token")

    resolved = websockify.resolve_token_source_file(
        (str(tmp_path / "a.txt"), str(tmp_path / "b.txt"), str(present))
    )

    assert resolved == present


def test_raises_a_named_error_when_nothing_exists(tmp_path: Path) -> None:
    # The container crash-loops either way; the point is that the log says
    # which paths were tried instead of "IndexError: tuple index out of range".
    locations = (str(tmp_path / "a.txt"), str(tmp_path / "b.txt"))

    with pytest.raises(FileNotFoundError) as excinfo:
        websockify.resolve_token_source_file(locations)

    message = str(excinfo.value)
    for location in locations:
        assert location in message


def test_raises_rather_than_indexing_off_the_end(tmp_path: Path) -> None:
    # Regression guard for the original bug: the loop incremented past the
    # tuple and raised IndexError.
    with pytest.raises(FileNotFoundError):
        websockify.resolve_token_source_file((str(tmp_path / "nope.txt"),))


def test_an_empty_location_list_is_a_clean_failure() -> None:
    with pytest.raises(FileNotFoundError):
        websockify.resolve_token_source_file(())


def test_the_shipped_defaults_are_ordered_container_first() -> None:
    # A mounted token file must win over a stray copy in the working
    # directory, or a rebuilt image would keep serving stale tokens.
    assert websockify.TOKEN_SOURCE_FILE_LOCATIONS == (
        "/app/websocket_token_source.txt",
        "./websocket_token_source.txt",
    )


def test_a_directory_at_the_path_is_accepted_as_existing(tmp_path: Path) -> None:
    # Characterization: the check is `.exists()`, not `.is_file()`, so a
    # directory would be passed to websockify as a token source. Unlikely in
    # practice (nothing creates one), but pinned so a switch to is_file() is a
    # deliberate change.
    directory = tmp_path / "websocket_token_source.txt"
    directory.mkdir()

    assert websockify.resolve_token_source_file((str(directory),)) == directory
