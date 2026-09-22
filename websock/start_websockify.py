#!/bin/python3
"""
Author: Michael K. Steinberg (Bis90 v25)
Created: 08/04/2025
Name: start_websockify.py
"""

import os
from pathlib import Path

# Sorted by override priority: the first location that exists wins, and the
# later ones are fallbacks. The in-container path comes first so a mounted
# token file beats a copy sitting in the working directory.
#
# Every location is a fallback for the ones before it, but not for *all* of
# them missing: that is a configuration error, and resolve_token_source_file
# raises rather than starting websockify with no tokens.
TOKEN_SOURCE_FILE_LOCATIONS = (
    "/app/websocket_token_source.txt",
    "./websocket_token_source.txt",
)


def resolve_token_source_file(
    locations: tuple[str, ...] = TOKEN_SOURCE_FILE_LOCATIONS,
) -> Path:
    """Returns the first location that exists, in priority order.

    Raises FileNotFoundError naming every location tried when none exists.
    This used to walk off the end of the tuple and raise a bare IndexError,
    which told whoever was reading the container's crash-loop nothing about
    what was actually missing.
    """
    for location in locations:
        candidate = Path(location)
        if candidate.exists():
            return candidate

    raise FileNotFoundError(
        "No websockify token source file found. Tried: " + ", ".join(locations)
    )


def start():
    websocket_port = os.environ.get("WEBSOCKET_PORT", "60800")

    token_source_file = resolve_token_source_file()

    print(f"Using token file: {token_source_file}")
    os.system(
        f"websockify --verbose --token-plugin=TokenFile {websocket_port} --token-source={token_source_file}"
    )


if __name__ == "__main__":
    start()
