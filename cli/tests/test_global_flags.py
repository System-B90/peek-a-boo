"""
Name: test_global_flags.py
Purpose: Coverage for `_reorder_global_flags` (cli/peekaboo_cli/main.py), including
         trailing global flags after subcommand-specific options — the blind
         spot in conftest.run_cli, which only ever places globals before the
         subcommand (Bluz#526).
Created: 2026-09-27
Author: Michael K. Steinberg
"""

from __future__ import annotations

from peekaboo_cli.main import _reorder_global_flags, app
from typer.testing import CliRunner


def test_boolean_flag_does_not_swallow_a_trailing_global() -> None:
    argv = ["students", "list", "--wide", "--json"]
    assert _reorder_global_flags(argv) == ["--json", "students", "list", "--wide"]


def test_trailing_short_quiet_flag_after_boolean_flag() -> None:
    argv = ["settings", "reset", "--yes", "-q"]
    assert _reorder_global_flags(argv) == ["-q", "settings", "reset", "--yes"]


def test_value_taking_option_still_keeps_its_value() -> None:
    """A real value-taking option (--output) must not have its value hoisted."""
    argv = ["students", "avatar", "7", "--output", "a.png", "--json"]
    assert _reorder_global_flags(argv) == [
        "--json",
        "students",
        "avatar",
        "7",
        "--output",
        "a.png",
    ]


def test_global_value_option_is_hoisted_with_its_value() -> None:
    argv = ["classes", "list", "--url", "http://x", "--json"]
    assert _reorder_global_flags(argv) == [
        "--url",
        "http://x",
        "--json",
        "classes",
        "list",
    ]


def test_leading_globals_are_unaffected() -> None:
    argv = ["--json", "-q", "classes", "list"]
    assert _reorder_global_flags(argv) == argv


def test_end_to_end_trailing_json_flag_reaches_the_root_callback(stub_app) -> None:
    """CliRunner.invoke bypasses run()'s sys.argv reordering, so this applies
    _reorder_global_flags the same way run() does."""
    stub = stub_app()
    stub.envelope("GET", "/api/students", [{"studentUsername": "alice"}])

    argv = _reorder_global_flags(
        ["--url", stub.url, "--token", "t", "students", "list", "--wide", "--json"]
    )
    result = CliRunner().invoke(app, argv, catch_exceptions=False)

    assert result.exit_code == 0, result.output
    # --json reached the root: raw JSON, not a table.
    assert result.stdout.lstrip().startswith("[")


def test_an_option_value_spelling_a_global_flag_is_left_alone() -> None:
    argv = ["students", "list", "--mentor", "--json"]
    assert _reorder_global_flags(argv) == argv


def test_the_tree_walk_finds_a_nested_commands_value_option() -> None:
    from peekaboo_cli.main import _value_taking_options

    options = _value_taking_options()

    assert "--mentor" in options
    assert "--search-scope" in options
    # Boolean flags must stay out of it, or they swallow the next token.
    assert "--wide" not in options
    assert "--yes" not in options
