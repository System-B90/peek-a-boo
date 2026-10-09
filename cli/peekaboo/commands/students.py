"""
Name: students.py
Purpose: `peekaboo students` — the student roster the dashboard, the mentees
         page and the student tiles are built from (/api/students).
Created: 2026-09-27
Author: Michael K. Steinberg
"""

from __future__ import annotations

from typing import Any

import typer

from peekaboo.commands._common import LIMIT_OPTION, OFFSET_OPTION, show, write_file
from peekaboo.context import state
from peekaboo.output import abort, success

app = typer.Typer(
    help="Student roster (Hive), mentees and avatars.", no_args_is_help=True
)

# The roster row carries ~17 columns; a table of all of them does not fit a
# terminal. These are the ones the student tile shows. --wide (or --json)
# gives everything.
_NARROW_COLUMNS = (
    "studentUsername",
    "studentFirstName",
    "studentLastName",
    "studentStatus",
    "hostname",
    "programName",
    "mentorUsername",
    "currentExerciseName",
)


def fetch_roster() -> list[dict[str, Any]]:
    with state.client() as client:
        return client.get("/api/students") or []


def fetch_student(username: str) -> dict[str, Any]:
    """One roster row, with the same not-found/ambiguous checks as the UI."""
    with state.client() as client:
        rows = client.get(f"/api/students/{username}") or []
    if len(rows) < 1:
        abort(f"Student {username!r} not found.")
    if len(rows) > 1:
        abort(f"Too many students matched {username!r}.")
    return rows[0]


def _narrow(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [{key: row.get(key) for key in _NARROW_COLUMNS} for row in rows]


@app.command("list")
def list_students(
    mentor: str = typer.Option(
        None, "--mentor", help="Only this mentor's mentees (mentor username)."
    ),
    mine: bool = typer.Option(
        False,
        "--mine",
        help="Only your own mentees -- the mentees page. Needs --mentor on a "
        "login-bypass server, which has no real user.",
    ),
    program: str = typer.Option(None, "--program", help="Only this program name."),
    status: str = typer.Option(None, "--status", help="Only this Hive status."),
    wide: bool = typer.Option(False, "--wide", help="Show every column."),
    limit: int = LIMIT_OPTION,
    offset: int = OFFSET_OPTION,
) -> None:
    """List students, optionally filtered the way the UI filters them."""
    rows = fetch_roster()
    if mine and not mentor:
        mentor = whoami_username()
    if mentor:
        rows = [row for row in rows if row.get("mentorUsername") == mentor]
    if program:
        rows = [row for row in rows if row.get("programName") == program]
    if status:
        rows = [row for row in rows if row.get("studentStatus") == status]
    if not wide and not state.as_json:
        rows = _narrow(rows)
    show(rows, title="Students", limit=limit, offset=offset)


def whoami_username() -> str:
    """The logged-in user's username, from the next-auth session route."""
    with state.client() as client:
        session = client.get_raw("/api/auth/session")
    username = (session or {}).get("user", {}).get("username")
    if not username:
        abort("Could not tell who is logged in -- pass --mentor explicitly.")
    return username


@app.command("get")
def get_student(username: str = typer.Argument(..., help="Hive username.")) -> None:
    """Show one student's full roster row."""
    show(fetch_student(username), title=username)


@app.command("avatar")
def avatar(
    hive_id: int = typer.Argument(..., help="The student's Hive id (hiveId)."),
    output: str = typer.Option(..., "--output", "-o", help="File to write."),
) -> None:
    """Download a student's Hive avatar image."""
    from pathlib import Path

    with state.client() as client:
        data = client.get(f"/api/avatar/{hive_id}")
    if not data:
        abort(f"No avatar for Hive id {hive_id}.")
    if isinstance(data, str):
        data = data.encode("utf-8")
    write_file(Path(output), data, what="avatar")
    success(f"Saved avatar to {output}")
