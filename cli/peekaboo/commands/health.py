"""
Name: health.py
Purpose: `peekaboo health` — the unauthenticated liveness probe served at
         /api/health, the same one the container healthcheck reads.
Created: 2026-09-27
Author: Michael K. Steinberg
"""

from __future__ import annotations

import typer

from peekaboo.commands._common import show
from peekaboo.context import state

_PATH = "/api/health"

# The route is deliberately dependency-free (Hive being down must not restart
# the container), so it only ever answers "ok" while the app is serving.
_HEALTHY = "ok"


def health() -> None:
    """Check that Peek-a-boo is up.

    Exits non-zero unless the server answers `ok`, so this is usable as a
    shell gate: `peekaboo health || echo "down"`.
    """
    with state.client() as client:
        # Not client.get: /api/health does not speak the response envelope.
        report = client.get_raw(_PATH)

    show(report, title="Health")

    if not isinstance(report, dict) or report.get("status") != _HEALTHY:
        raise typer.Exit(1)
