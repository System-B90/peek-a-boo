"""
Name: test_setup_tweet_channel.py
Purpose: The setup wizard asks for the tweet channel's URL and resolves its ID
    through Mattermost's API (#101). Runs against a stub Mattermost over real HTTP.
Created: 2026-10-03
Author: Michael K. Steinberg
"""

import importlib.util
import json
import threading
from collections.abc import Iterator
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import ClassVar

import pytest

SETUP_PATH = Path(__file__).resolve().parents[1] / "setup.py"
_spec = importlib.util.spec_from_file_location("peekaboo_setup", SETUP_PATH)
assert _spec and _spec.loader
setup = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(setup)

CHANNEL_ID = "3bmhkoxr6bn4jgm9jnoobwibgh"
TOKEN = "bot-token"


class _Mattermost(BaseHTTPRequestHandler):
    seen: ClassVar[list[str]] = []

    def do_GET(self) -> None:
        type(self).seen.append(self.path)
        authorized = self.headers.get("Authorization") == f"Bearer {TOKEN}"
        if (
            authorized
            and self.path == "/api/v4/teams/name/my-team/channels/name/tweets"
        ):
            body = json.dumps({"id": CHANNEL_ID, "name": "tweets"}).encode()
            self.send_response(200)
        else:
            body = b'{"message": "not found"}'
            self.send_response(404)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *_: object) -> None:
        pass


@pytest.fixture
def mattermost() -> Iterator[str]:
    _Mattermost.seen = []
    server = ThreadingHTTPServer(("127.0.0.1", 0), _Mattermost)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield f"http://127.0.0.1:{server.server_address[1]}"
    server.shutdown()


@pytest.mark.parametrize(
    ("url", "expected"),
    [
        (
            "https://mattermost.local/my-team/channels/tweets",
            ("https://mattermost.local", "my-team", "tweets"),
        ),
        (
            "https://mm.local/chat/my-team/channels/tweets/?x=1#y",
            ("https://mm.local/chat", "my-team", "tweets"),
        ),
    ],
)
def test_parse_channel_url(url: str, expected: tuple[str, str, str]) -> None:
    assert setup.parse_channel_url(url) == expected


@pytest.mark.parametrize(
    "url",
    ["tweets", "https://mm.local/my-team", "https://mm.local/my-team/messages/@bob"],
)
def test_parse_channel_url_rejects_non_channel_urls(url: str) -> None:
    with pytest.raises(ValueError):
        setup.parse_channel_url(url)


def test_resolves_channel_url_to_id(mattermost: str) -> None:
    channel_url = f"{mattermost}/my-team/channels/tweets"
    assert setup.resolve_tweet_channel_id("", TOKEN, channel_url) == CHANNEL_ID


def test_prefers_configured_mattermost_url_for_the_api(mattermost: str) -> None:
    channel_url = "https://public.example/my-team/channels/tweets"
    assert setup.resolve_tweet_channel_id(mattermost, TOKEN, channel_url) == CHANNEL_ID


def test_raw_channel_id_is_kept_without_a_request(mattermost: str) -> None:
    assert setup.resolve_tweet_channel_id(mattermost, TOKEN, CHANNEL_ID) == CHANNEL_ID
    assert _Mattermost.seen == []


def test_unknown_channel_raises(mattermost: str) -> None:
    with pytest.raises(OSError):
        setup.resolve_tweet_channel_id(
            "", TOKEN, f"{mattermost}/my-team/channels/missing"
        )


class _FakeWizard:
    def __init__(self, values: dict[str, str], existing: dict[str, str]) -> None:
        self.values = dict(values)
        self.existing = existing

    def set(self, key: str, value: str) -> str:
        self.values[key] = value
        return value

    def prev(self, key: str, default: str = "") -> str:
        return self.existing.get(key) or default

    def keep(self, key: str, default: str = "") -> str:
        return self.set(key, self.prev(key, default))


def test_wizard_stores_resolved_channel_id(mattermost: str) -> None:
    wizard = _FakeWizard(
        {
            "MATTERMOST_URL": mattermost,
            "MATTERMOST_ACCESS_TOKEN": TOKEN,
            "TWEET_CHANNEL_URL": f"{mattermost}/my-team/channels/tweets",
        },
        {},
    )
    setup.set_tweet_channel(wizard)
    assert wizard.values["TWEET_CHANNEL_ID"] == CHANNEL_ID


def test_wizard_asks_for_the_url_not_the_id() -> None:
    assert "TWEET_CHANNEL_ID" not in setup.PROMPT_VARS
    assert "channel URL" in setup.PROMPT_VARS["TWEET_CHANNEL_URL"]
