#!/bin/python3
"""
Author: Michael K. Steinberg (Bis90 v25)
Created: 08/04/2025
Name: start_websockify.py
"""
import os
from pathlib import Path

# Sorted by override priority.
# The latters are fallbacks in case the forerunners are not found
TOKEN_SOURCE_FILE_LOCATIONS = (
    "/app/websocket_token_source.txt",
    "./websocket_token_source.txt",
)


def start():
    websocket_port = os.environ.get("WEBSOCKET_PORT", 60800)

    token_source_file_index = 0
    token_source_file = Path(TOKEN_SOURCE_FILE_LOCATIONS[token_source_file_index])
    while not token_source_file.exists():
        token_source_file_index += 1
        token_source_file = Path(TOKEN_SOURCE_FILE_LOCATIONS[token_source_file_index])

    print(f"Using token file: {token_source_file}")
    os.system(
        f"websockify --verbose --token-plugin=TokenFile {websocket_port} --token-source={token_source_file}"
    )


if __name__ == "__main__":
    start()
