"""
Name: misc.py
Purpose: The smaller UI features, each a single route: Hive classes, the tweet
         bot (post to Mattermost with a screenshot/recording attached), and the
         client environment the UI boots from.
Created: 2026-09-27
Author: Michael K. Steinberg
"""

from __future__ import annotations

import base64
import mimetypes
from pathlib import Path

import typer

from peekaboo.commands._common import LIMIT_OPTION, OFFSET_OPTION, show
from peekaboo.context import state
from peekaboo.output import abort, success

classes_app = typer.Typer(help="Hive classes.", no_args_is_help=True)


@classes_app.command("list")
def list_classes(limit: int = LIMIT_OPTION, offset: int = OFFSET_OPTION) -> None:
    """List the Hive classes the dashboard groups students by."""
    with state.client() as client:
        show(client.get("/api/class"), title="Classes", limit=limit, offset=offset)


# Same ceiling the server enforces (MAX_ATTACHMENT_BYTES in
# src/shared-api/media-attachment.ts) -- checked here so a too-large file fails
# before it is base64-encoded and uploaded.
MAX_ATTACHMENT_BYTES = 12 * 1024 * 1024


def attachment_data_uri(path: Path) -> str:
    """Encode an image/video file as the data URI /api/tweet expects."""
    content_type, _ = mimetypes.guess_type(path.name)
    if not content_type or content_type.split("/")[0] not in ("image", "video"):
        abort(f"{path.name}: only image and video files can be attached.")
    try:
        data = path.read_bytes()
    except OSError as exc:
        abort(f"Could not read {path}: {exc}")
    if len(data) > MAX_ATTACHMENT_BYTES:
        abort(
            f"{path.name} is {len(data) // (1024 * 1024)} MB; the limit is "
            f"{MAX_ATTACHMENT_BYTES // (1024 * 1024)} MB."
        )
    return f"data:{content_type};base64,{base64.b64encode(data).decode('ascii')}"


def tweet(
    message: str = typer.Argument(..., help="Message text (Markdown)."),
    attach: Path = typer.Option(
        None,
        "--attach",
        "-a",
        help="Image or video to post with it (screenshot / screen recording).",
    ),
) -> None:
    """Post a message to the tweet channel in Mattermost (the tweet bot)."""
    payload: dict[str, str] = {"message": message}
    if attach is not None:
        payload["attachment"] = attachment_data_uri(attach)
    with state.client() as client:
        client.post("/api/tweet", json=payload)
    success("Tweet sent.")


def env() -> None:
    """Show the client environment the UI boots from (websocket URL, Hive host)."""
    with state.client() as client:
        data = client.get("/api/env")
        bypass = client.get("/api/env/login-bypass")
    show({**(data or {}), **(bypass or {})}, title="Environment")


# Page name -> path, for the pages that have no data of their own to fetch
# (everything they show is reachable through the commands above).
PAGES = {
    "dashboard": "/",
    "mentees": "/mentees",
    "fullscreen": "/fullscreen",
    "settings": "/settings",
}


def open_page(
    page: str = typer.Argument(
        "dashboard", help=f"One of: {', '.join(PAGES)}.", show_default=True
    ),
    print_only: bool = typer.Option(
        False, "--print", help="Print the URL instead of opening a browser."
    ),
) -> None:
    """Open a Peek-a-boo page in the browser."""
    import webbrowser

    if page not in PAGES:
        abort(f"Unknown page {page!r}. Pick one of: {', '.join(PAGES)}.")
    url = f"{state.config.require_url()}{PAGES[page]}"
    if print_only:
        typer.echo(url)
        return
    webbrowser.open(url)
    success(f"Opened {url}")
