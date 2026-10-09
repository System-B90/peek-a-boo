"""
Name: vnc.py
Purpose: `peekaboo vnc` — everything the VNC views and the VNC admin pane do:
         open a student's live screen, hand the connection details to a native
         VNC viewer, and produce the TightVNC client install commands.
Created: 2026-09-27
Author: Michael K. Steinberg
"""

from __future__ import annotations

import urllib.parse
import webbrowser

import typer

from peekaboo.commands._common import show
from peekaboo.commands.students import fetch_student
from peekaboo.context import state
from peekaboo.output import abort, success

app = typer.Typer(
    help="Watch student screens and install the VNC client.", no_args_is_help=True
)

# TightVNC's listening port on the student machines; websockify dials the same.
VNC_PORT = 5900

_INSTALL_PATH = "/api/install-client"


def _base_url() -> str:
    return state.config.require_url()


def _open(url: str, *, print_only: bool) -> None:
    if print_only:
        typer.echo(url)
        return
    webbrowser.open(url)
    success(f"Opened {url}")


@app.command("open")
def open_screen(
    username: str = typer.Argument(..., help="Student's Hive username."),
    fullscreen: bool = typer.Option(
        False, "--fullscreen", help="Open the full-screen view instead."
    ),
    print_only: bool = typer.Option(
        False, "--print", help="Print the URL instead of opening a browser."
    ),
) -> None:
    """Open a student's live screen in the browser (the VNC tile / page)."""
    if fullscreen:
        query = urllib.parse.urlencode({"username": username})
        _open(f"{_base_url()}/fullscreen?{query}", print_only=print_only)
        return
    hostname = fetch_student(username).get("hostname")
    if not hostname:
        abort(f"Student {username!r} has no hostname in Hive.")
    _open(f"{_base_url()}/vnc/{urllib.parse.quote(hostname)}", print_only=print_only)


@app.command("info")
def info(
    username: str = typer.Argument(..., help="Student's Hive username."),
    reveal: bool = typer.Option(
        False, "--reveal", help="Print the VNC password instead of masking it."
    ),
) -> None:
    """Connection details for pointing a native VNC viewer at a student."""
    student = fetch_student(username)
    with state.client() as client:
        settings = client.get("/api/settings") or {}
        env = client.get("/api/env") or {}
    password = settings.get("VNC_CLIENT_PASSWORD") or ""
    show(
        {
            "username": username,
            "host": student.get("hostname"),
            "port": VNC_PORT,
            "password": password if reveal else ("<set>" if password else None),
            "websocketUrl": env.get("WEBSOCKET_URL"),
        },
        title="VNC",
    )


@app.command("install-command")
def install_command(
    computer: str = typer.Option(
        None, "--computer", help="Target computer name (single-machine command)."
    ),
    search_scope: str = typer.Option(
        None,
        "--search-scope",
        help="AD search base, e.g. OU=Classroom,DC=example,DC=com (bulk command).",
    ),
    username: str = typer.Option(
        "administrator", "--username", help="Admin account PsExec runs as."
    ),
    password: str = typer.Option(
        None, "--password", help="Admin password (prompted when omitted)."
    ),
) -> None:
    """Print the TightVNC install command -- raw, per machine, or AD-wide.

    With neither --computer nor --search-scope this prints the raw PowerShell
    the server hands out at /api/install-client; otherwise it prints the same
    PsExec one-liners as the settings page's VNC admin pane.
    """
    if computer and search_scope:
        abort("Pass --computer or --search-scope, not both.")

    if not computer and not search_scope:
        with state.client() as client:
            # Answers a bare JSON string, not the response envelope.
            typer.echo(client.get_raw(_INSTALL_PATH))
        return

    if password is None:
        password = typer.prompt("Admin password", hide_input=True)
    remote = (
        f'powershell "Invoke-Expression (Invoke-RestMethod {_base_url()}'
        f'{_INSTALL_PATH})"'
    )
    if computer:
        typer.echo(f"PsExec64 \\\\{computer} -u {username} -p {password} -h {remote}")
    else:
        typer.echo(
            f"Get-ADComputer -SearchScope {search_scope} -Filter * | "
            f"ForEach-Object {{ PsExec64 \\\\$_ -u {username} -p {password} -h "
            f"{remote} }}"
        )
