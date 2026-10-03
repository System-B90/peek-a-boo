"""
Name: settings.py
Purpose: `peekaboo settings` — the settings page: read, edit and reset the
         server's user-controlled settings (/api/settings).
Created: 2026-09-27
Author: Michael K. Steinberg
"""

from __future__ import annotations

from typing import Any

import typer

from peekaboo_cli.commands._common import show
from peekaboo_cli.context import state
from peekaboo_cli.output import abort, success

app = typer.Typer(help="Server settings (the settings page).", no_args_is_help=True)

# Mirrors UserControlledSettings (src/server-api/settings.tsx). The route
# spreads whatever it is sent into settings.json, so an unknown key would be
# saved silently and never read -- rejected here instead.
KNOWN_KEYS = (
    "VNC_CLIENT_PASSWORD",
    "VNC_MASTER_PASSWORD",
    "HIVE_HOSTNAME",
    "HIVE_API_USERNAME",
    "HIVE_API_PASSWORD",
    "MATTERMOST_URL",
    "MATTERMOST_ACCESS_TOKEN",
    "TWEET_CHANNEL_ID",
)

# The fields the settings form renders as password inputs.
SECRET_KEYS = frozenset(
    {
        "VNC_CLIENT_PASSWORD",
        "VNC_MASTER_PASSWORD",
        "HIVE_API_PASSWORD",
        "MATTERMOST_ACCESS_TOKEN",
    }
)


def _masked(settings: dict[str, Any], reveal: bool) -> dict[str, Any]:
    if reveal:
        return settings
    return {
        key: ("<set>" if value else value) if key in SECRET_KEYS else value
        for key, value in settings.items()
    }


@app.command("show")
def show_settings(
    defaults: bool = typer.Option(
        False, "--defaults", help="Show the defaults instead of the saved values."
    ),
    reveal: bool = typer.Option(
        False, "--reveal", help="Print secrets instead of masking them."
    ),
) -> None:
    """Show the current (or default) settings. Secrets are masked by default."""
    path = "/api/settings/default" if defaults else "/api/settings"
    with state.client() as client:
        settings = client.get(path) or {}
    show(
        _masked(settings, reveal), title="Default settings" if defaults else "Settings"
    )


def _parse_assignment(pair: str) -> tuple[str, str]:
    key, sep, value = pair.partition("=")
    if not sep:
        raise typer.BadParameter(f"Expected KEY=VALUE, got {pair!r}.")
    key = key.strip()
    if key not in KNOWN_KEYS:
        raise typer.BadParameter(
            f"Unknown setting {key!r}. Known: {', '.join(KNOWN_KEYS)}."
        )
    return key, value


@app.command("set")
def set_settings(
    assignments: list[str] = typer.Argument(
        ..., help="One or more KEY=VALUE pairs, e.g. TWEET_CHANNEL_ID=abc123."
    ),
) -> None:
    """Change one or more settings, keeping the rest as they are."""
    changes = dict(_parse_assignment(pair) for pair in assignments)
    with state.client() as client:
        # The route merges the body over the current file itself; sending only
        # the changed keys leaves the rest untouched.
        client.post("/api/settings", json=changes)
    success(f"Saved {', '.join(changes)}.")


@app.command("reset")
def reset_settings(
    yes: bool = typer.Option(False, "--yes", "-y", help="Skip the confirmation."),
) -> None:
    """Restore every setting to its default (the form's reset + save)."""
    if not yes and not typer.confirm("Reset ALL settings to their defaults?"):
        abort("Aborted.")
    with state.client() as client:
        defaults = client.get("/api/settings/default") or {}
        client.post("/api/settings", json=defaults)
    success("Settings reset to defaults.")
