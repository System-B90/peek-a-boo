#!/bin/python3
"""
Author: Michael K. Steinberg (Bis90 v25)
Created: 08/04/2025
Name: start_websockify.py
"""
import os


def start():
    websocket_port = os.environ.get("WEBSOCKET_PORT", 60800)
    os.system(
        f"websockify --verbose --token-plugin=TokenFile {websocket_port} --token-source=/app/websocket_token_source.txt"
    )


if __name__ == "__main__":
    start()
