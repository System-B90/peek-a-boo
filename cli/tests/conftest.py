"""
Name: conftest.py
Purpose: A real local HTTP server standing in for Peek-a-boo, so CLI tests assert the
         actual request the CLI puts on the wire — path, query and JSON body —
         rather than a mock of the client.
Created: 2026-09-27
Author: Michael K. Steinberg
"""

from __future__ import annotations

import json
import threading
from dataclasses import dataclass, field
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from urllib.parse import parse_qs, urlparse

import pytest
from peekaboo_cli.main import app
from typer.testing import CliRunner
from wire_types import Raw


@dataclass
class Recorded:
    method: str
    path: str
    query: dict[str, list[str]]
    body: Any


@dataclass
class StubApp:
    """A Peek-a-boo-shaped HTTP server. Routes answer with the response envelope."""

    url: str
    requests: list[Recorded] = field(default_factory=list)
    # (method, path) -> (status, body-to-send-verbatim, extra headers)
    routes: dict[tuple[str, str], tuple[int, Any, dict[str, str]]] = field(
        default_factory=dict
    )

    def route(
        self,
        method: str,
        path: str,
        body: Any,
        *,
        status: int = 200,
        headers: dict[str, str] | None = None,
    ) -> None:
        self.routes[(method.upper(), path)] = (status, body, headers or {})

    def envelope(self, method: str, path: str, data: Any, *, status: int = 200) -> None:
        """Register a route answering the standard { status: 0, data } envelope."""
        self.route(method, path, {"status": 0, "data": data}, status=status)

    def last(self) -> Recorded:
        assert self.requests, "the CLI made no request"
        return self.requests[-1]


@pytest.fixture
def stub_app():
    servers: list[ThreadingHTTPServer] = []

    def build() -> StubApp:
        stub = StubApp(url="")

        class Handler(BaseHTTPRequestHandler):
            protocol_version = "HTTP/1.1"

            def log_message(self, *args: Any) -> None:
                pass

            def _handle(self) -> None:
                parsed = urlparse(self.path)
                length = int(self.headers.get("Content-Length") or 0)
                raw = self.rfile.read(length) if length else b""
                body: Any = None
                if raw:
                    try:
                        body = json.loads(raw)
                    except ValueError:
                        body = raw.decode("utf-8", "replace")

                stub.requests.append(
                    Recorded(
                        method=self.command,
                        path=parsed.path,
                        query=parse_qs(parsed.query),
                        body=body,
                    )
                )

                status, payload, headers = stub.routes.get(
                    (self.command, parsed.path),
                    (
                        404,
                        {
                            "status": 1,
                            "error": {"name": "NotFound", "message": parsed.path},
                        },
                        {},
                    ),
                )
                if isinstance(payload, Raw):
                    encoded, content_type = payload.payload, payload.content_type
                else:
                    encoded = json.dumps(payload).encode("utf-8")
                    content_type = "application/json; charset=utf-8"
                self.send_response(status)
                self.send_header("Content-Type", content_type)
                self.send_header("Content-Length", str(len(encoded)))
                for name, value in headers.items():
                    self.send_header(name, value)
                self.end_headers()
                self.wfile.write(encoded)

            do_GET = _handle
            do_POST = _handle
            do_PUT = _handle
            do_PATCH = _handle
            do_DELETE = _handle

        server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        server.daemon_threads = True
        servers.append(server)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        stub.url = f"http://127.0.0.1:{server.server_address[1]}"
        return stub

    yield build

    for server in servers:
        server.shutdown()
        server.server_close()


@pytest.fixture
def run_cli(tmp_path, monkeypatch):
    """Invokes the CLI against a stub, with config isolated to a temp dir."""
    # typer.get_app_dir reads APPDATA on Windows and HOME/XDG elsewhere, so
    # all three are redirected -- otherwise the tests would read (and could
    # write) the developer's real peekaboo config.
    monkeypatch.setenv("APPDATA", str(tmp_path))
    monkeypatch.setenv("XDG_CONFIG_HOME", str(tmp_path))
    monkeypatch.setenv("HOME", str(tmp_path))
    monkeypatch.setenv("USERPROFILE", str(tmp_path))
    monkeypatch.delenv("PEEKABOO_URL", raising=False)
    monkeypatch.delenv("PEEKABOO_TOKEN", raising=False)
    runner = CliRunner()

    def invoke(stub: StubApp, *args: str, as_json: bool = True) -> Any:
        return runner.invoke(
            app,
            [
                "--url",
                stub.url,
                "--token",
                "test-token",
                *(["--json"] if as_json else []),
                *args,
            ],
            catch_exceptions=False,
        )

    return invoke


@pytest.fixture
def run_cli_table(run_cli, monkeypatch):
    """Like run_cli, but renders tables instead of --json -- on a console wide
    enough that headers never wrap, whatever terminal (or CI log) runs it."""
    from peekaboo_cli import output

    monkeypatch.setattr(output.console, "width", 250)

    def invoke(stub: StubApp, *args: str) -> Any:
        return run_cli(stub, *args, as_json=False)

    return invoke
