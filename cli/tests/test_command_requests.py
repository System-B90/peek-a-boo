"""
Name: test_command_requests.py
Purpose: Wire contracts for every peek-a-boo command: the request each one puts
         on the wire (method, path, body) against a stub server, and what it
         makes of the answer.
Created: 2026-09-27
Author: Michael K. Steinberg
"""

from __future__ import annotations

import base64
import json

import pytest
from wire_types import Raw

ALICE = {
    "studentUsername": "alice",
    "studentFirstName": "Alice",
    "studentLastName": "A",
    "studentStatus": "Working",
    "hostname": "PC-01",
    "programName": "cyber",
    "mentorUsername": "mentor1",
    "currentExerciseName": "ex1",
    "hiveId": 7,
    "checkersBrief": "long text",
}
BOB = {
    **ALICE,
    "studentUsername": "bob",
    "hostname": "PC-02",
    "programName": "web",
    "mentorUsername": "mentor2",
    "studentStatus": "Toilet",
}


def _json(result):
    return json.loads(result.stdout)


# --- students --------------------------------------------------------------------


def test_students_list_reads_the_roster(stub_app, run_cli):
    stub = stub_app()
    stub.envelope("GET", "/api/students", [ALICE, BOB])

    result = run_cli(stub, "students", "list")

    assert result.exit_code == 0, result.output
    assert stub.last().method == "GET"
    assert stub.last().path == "/api/students"
    # --json keeps every column.
    assert _json(result)[0]["checkersBrief"] == "long text"


@pytest.mark.parametrize(
    ("flag", "value", "expected"),
    [
        ("--mentor", "mentor2", ["bob"]),
        ("--program", "cyber", ["alice"]),
        ("--status", "Toilet", ["bob"]),
    ],
)
def test_students_list_filters_like_the_ui(stub_app, run_cli, flag, value, expected):
    stub = stub_app()
    stub.envelope("GET", "/api/students", [ALICE, BOB])

    result = run_cli(stub, "students", "list", flag, value)

    assert [row["studentUsername"] for row in _json(result)] == expected


def test_students_list_mine_filters_by_the_logged_in_mentor(stub_app, run_cli):
    stub = stub_app()
    stub.envelope("GET", "/api/students", [ALICE, BOB])
    stub.route("GET", "/api/auth/session", {"user": {"username": "mentor1"}})

    result = run_cli(stub, "students", "list", "--mine")

    assert [row["studentUsername"] for row in _json(result)] == ["alice"]


def test_students_list_mine_without_a_session_user_fails(stub_app, run_cli):
    stub = stub_app()
    stub.envelope("GET", "/api/students", [ALICE])
    stub.route("GET", "/api/auth/session", {})

    result = run_cli(stub, "students", "list", "--mine")

    assert result.exit_code == 1
    assert "--mentor" in result.stderr


def test_students_list_table_is_narrow_unless_wide(stub_app, run_cli_table):
    stub = stub_app()
    stub.envelope("GET", "/api/students", [ALICE])

    narrow = run_cli_table(stub, "students", "list")
    wide = run_cli_table(stub, "students", "list", "--wide")

    assert "checkersBrief" not in narrow.stdout
    assert "checkersBrief" in wide.stdout


def test_students_list_limit_and_offset_slice(stub_app, run_cli):
    stub = stub_app()
    stub.envelope("GET", "/api/students", [ALICE, BOB])

    result = run_cli(stub, "students", "list", "--offset", "1", "--limit", "1")

    assert [row["studentUsername"] for row in _json(result)] == ["bob"]


def test_students_get_reads_one_student(stub_app, run_cli):
    stub = stub_app()
    stub.envelope("GET", "/api/students/alice", [ALICE])

    result = run_cli(stub, "students", "get", "alice")

    assert result.exit_code == 0
    assert _json(result)["hostname"] == "PC-01"


@pytest.mark.parametrize(
    ("rows", "message"), [([], "not found"), ([ALICE, BOB], "Too many")]
)
def test_students_get_rejects_zero_or_many_matches(stub_app, run_cli, rows, message):
    stub = stub_app()
    stub.envelope("GET", "/api/students/alice", rows)

    result = run_cli(stub, "students", "get", "alice")

    assert result.exit_code == 1
    assert message in result.stderr


def test_students_avatar_writes_the_image(stub_app, run_cli, tmp_path):
    stub = stub_app()
    stub.route("GET", "/api/avatar/7", Raw(b"\x89PNG-bytes", "image/png"))
    out = tmp_path / "a.png"

    result = run_cli(stub, "students", "avatar", "7", "--output", str(out))

    assert result.exit_code == 0, result.output
    assert out.read_bytes() == b"\x89PNG-bytes"


def test_students_avatar_with_no_image_fails(stub_app, run_cli, tmp_path):
    stub = stub_app()
    stub.route("GET", "/api/avatar/7", Raw(b"", "application/octet-stream"))

    result = run_cli(stub, "students", "avatar", "7", "-o", str(tmp_path / "a"))

    assert result.exit_code == 1


# --- classes ---------------------------------------------------------------------


def test_classes_list(stub_app, run_cli):
    stub = stub_app()
    stub.envelope("GET", "/api/class", [{"id": 1, "name": "A"}])

    result = run_cli(stub, "classes", "list")

    assert stub.last().path == "/api/class"
    assert _json(result) == [{"id": 1, "name": "A"}]


# --- vnc -------------------------------------------------------------------------


def test_vnc_open_prints_the_student_screen_url(stub_app, run_cli):
    stub = stub_app()
    stub.envelope("GET", "/api/students/alice", [ALICE])

    result = run_cli(stub, "vnc", "open", "alice", "--print")

    assert result.stdout.strip() == f"{stub.url}/vnc/PC-01"


def test_vnc_open_fullscreen_needs_no_lookup(stub_app, run_cli):
    stub = stub_app()

    result = run_cli(stub, "vnc", "open", "alice", "--fullscreen", "--print")

    assert result.stdout.strip() == f"{stub.url}/fullscreen?username=alice"
    assert stub.requests == []


def test_vnc_open_launches_a_browser(stub_app, run_cli, monkeypatch):
    from peekaboo_cli.commands import vnc

    opened = []
    monkeypatch.setattr(vnc.webbrowser, "open", opened.append)
    stub = stub_app()
    stub.envelope("GET", "/api/students/alice", [ALICE])

    result = run_cli(stub, "vnc", "open", "alice")

    assert result.exit_code == 0
    assert opened == [f"{stub.url}/vnc/PC-01"]


def test_vnc_open_without_a_hostname_fails(stub_app, run_cli):
    stub = stub_app()
    stub.envelope("GET", "/api/students/alice", [{**ALICE, "hostname": None}])

    result = run_cli(stub, "vnc", "open", "alice", "--print")

    assert result.exit_code == 1


def _vnc_stub(stub_app):
    stub = stub_app()
    stub.envelope("GET", "/api/students/alice", [ALICE])
    stub.envelope("GET", "/api/settings", {"VNC_CLIENT_PASSWORD": "s3cret"})
    stub.envelope("GET", "/api/env", {"WEBSOCKET_URL": "/ws"})
    return stub


def test_vnc_info_masks_the_password(stub_app, run_cli):
    stub = _vnc_stub(stub_app)

    info = _json(run_cli(stub, "vnc", "info", "alice"))

    assert info == {
        "username": "alice",
        "host": "PC-01",
        "port": 5900,
        "password": "<set>",
        "websocketUrl": "/ws",
    }


def test_vnc_info_reveals_the_password_on_request(stub_app, run_cli):
    stub = _vnc_stub(stub_app)

    info = _json(run_cli(stub, "vnc", "info", "alice", "--reveal"))

    assert info["password"] == "s3cret"


def test_vnc_install_command_raw_prints_the_server_script(stub_app, run_cli):
    stub = stub_app()
    stub.route("GET", "/api/install-client", "Start-Process msiexec.exe")

    result = run_cli(stub, "vnc", "install-command")

    assert result.stdout.strip() == "Start-Process msiexec.exe"


def test_vnc_install_command_for_one_computer(stub_app, run_cli):
    stub = stub_app()

    result = run_cli(
        stub, "vnc", "install-command", "--computer", "PC-01", "--password", "pw"
    )

    assert result.stdout.strip() == (
        "PsExec64 \\\\PC-01 -u administrator -p pw -h powershell "
        f'"Invoke-Expression (Invoke-RestMethod {stub.url}/api/install-client)"'
    )
    assert stub.requests == []


def test_vnc_install_command_for_a_whole_ou(stub_app, run_cli):
    stub = stub_app()

    result = run_cli(
        stub,
        "vnc",
        "install-command",
        "--search-scope",
        "OU=Classroom",
        "--username",
        "admin",
        "--password",
        "pw",
    )

    assert result.stdout.startswith("Get-ADComputer -SearchScope OU=Classroom")
    assert "PsExec64 \\\\$_ -u admin -p pw" in result.stdout


def test_vnc_install_command_refuses_both_targets(stub_app, run_cli):
    stub = stub_app()

    result = run_cli(
        stub, "vnc", "install-command", "--computer", "A", "--search-scope", "B"
    )

    assert result.exit_code == 1


# --- tweet -----------------------------------------------------------------------


def test_tweet_posts_the_message(stub_app, run_cli):
    stub = stub_app()
    stub.envelope("POST", "/api/tweet", {"ok": "ok"})

    result = run_cli(stub, "tweet", "hello **world**")

    assert result.exit_code == 0
    assert stub.last().method == "POST"
    assert stub.last().body == {"message": "hello **world**"}


def test_tweet_attaches_a_file_as_a_data_uri(stub_app, run_cli, tmp_path):
    stub = stub_app()
    stub.envelope("POST", "/api/tweet", {"ok": "ok"})
    shot = tmp_path / "shot.png"
    shot.write_bytes(b"png-bytes")

    run_cli(stub, "tweet", "look", "--attach", str(shot))

    encoded = base64.b64encode(b"png-bytes").decode()
    assert stub.last().body["attachment"] == f"data:image/png;base64,{encoded}"


def test_tweet_refuses_a_non_media_attachment(stub_app, run_cli, tmp_path):
    stub = stub_app()
    notes = tmp_path / "notes.txt"
    notes.write_text("x")

    result = run_cli(stub, "tweet", "look", "--attach", str(notes))

    assert result.exit_code == 1
    assert stub.requests == []


def test_tweet_refuses_an_oversized_attachment(
    stub_app, run_cli, tmp_path, monkeypatch
):
    from peekaboo_cli.commands import misc

    monkeypatch.setattr(misc, "MAX_ATTACHMENT_BYTES", 4)
    stub = stub_app()
    clip = tmp_path / "clip.webm"
    clip.write_bytes(b"12345")

    result = run_cli(stub, "tweet", "look", "--attach", str(clip))

    assert result.exit_code == 1
    assert stub.requests == []


# --- settings --------------------------------------------------------------------

SETTINGS = {"HIVE_HOSTNAME": "hive.org", "HIVE_PASSWORD": "pw", "TWEET_CHANNEL_ID": ""}


def test_settings_show_masks_secrets(stub_app, run_cli):
    stub = stub_app()
    stub.envelope("GET", "/api/settings", SETTINGS)

    shown = _json(run_cli(stub, "settings", "show"))

    assert shown == {
        "HIVE_HOSTNAME": "hive.org",
        "HIVE_PASSWORD": "<set>",
        "TWEET_CHANNEL_ID": "",
    }


def test_settings_show_reveal_and_defaults(stub_app, run_cli):
    stub = stub_app()
    stub.envelope("GET", "/api/settings/default", SETTINGS)

    shown = _json(run_cli(stub, "settings", "show", "--defaults", "--reveal"))

    assert stub.last().path == "/api/settings/default"
    assert shown["HIVE_PASSWORD"] == "pw"


def test_settings_set_posts_only_the_changed_keys(stub_app, run_cli):
    stub = stub_app()
    stub.envelope("POST", "/api/settings", {})

    result = run_cli(
        stub, "settings", "set", "TWEET_CHANNEL_ID=abc", "MATTERMOST_URL=https://m=1"
    )

    assert result.exit_code == 0
    assert stub.last().body == {
        "TWEET_CHANNEL_ID": "abc",
        "MATTERMOST_URL": "https://m=1",
    }


@pytest.mark.parametrize("pair", ["NOPE=1", "TWEET_CHANNEL_ID"])
def test_settings_set_rejects_unknown_or_malformed_pairs(stub_app, run_cli, pair):
    stub = stub_app()

    result = run_cli(stub, "settings", "set", pair)

    assert result.exit_code != 0
    assert stub.requests == []


def test_settings_reset_saves_the_defaults(stub_app, run_cli):
    stub = stub_app()
    stub.envelope("GET", "/api/settings/default", SETTINGS)
    stub.envelope("POST", "/api/settings", {})

    result = run_cli(stub, "settings", "reset", "--yes")

    assert result.exit_code == 0
    assert stub.last().method == "POST"
    assert stub.last().body == SETTINGS


# --- env, open, health, whoami ---------------------------------------------------


def test_env_merges_both_env_routes(stub_app, run_cli):
    stub = stub_app()
    stub.envelope("GET", "/api/env", {"WEBSOCKET_URL": "/ws", "HIVE_HOSTNAME": "h"})
    stub.envelope("GET", "/api/env/login-bypass", {"ALLOW_LOGIN_BYPASS": False})

    shown = _json(run_cli(stub, "env"))

    assert shown == {
        "WEBSOCKET_URL": "/ws",
        "HIVE_HOSTNAME": "h",
        "ALLOW_LOGIN_BYPASS": False,
    }


@pytest.mark.parametrize(
    ("page", "path"), [("dashboard", "/"), ("mentees", "/mentees")]
)
def test_open_prints_page_urls(stub_app, run_cli, page, path):
    stub = stub_app()

    result = run_cli(stub, "open", page, "--print")

    assert result.stdout.strip() == f"{stub.url}{path}"


def test_open_rejects_an_unknown_page(stub_app, run_cli):
    result = run_cli(stub_app(), "open", "nowhere", "--print")

    assert result.exit_code == 1


def test_health_ok(stub_app, run_cli):
    stub = stub_app()
    stub.route("GET", "/api/health", {"status": "ok"})

    assert run_cli(stub, "health").exit_code == 0


def test_health_down_exits_non_zero(stub_app, run_cli):
    stub = stub_app()
    stub.route("GET", "/api/health", {"status": "starting"})

    assert run_cli(stub, "health").exit_code == 1


def test_whoami_shows_the_session_user(stub_app, run_cli):
    stub = stub_app()
    stub.route("GET", "/api/auth/session", {"user": {"username": "mentor1"}})

    assert _json(run_cli(stub, "auth", "whoami")) == {"username": "mentor1"}


def test_whoami_without_a_session_is_not_logged_in(stub_app, run_cli):
    from peekaboo_cli.errors import NotAuthenticatedError

    stub = stub_app()
    stub.route("GET", "/api/auth/session", {})

    with pytest.raises(NotAuthenticatedError):
        run_cli(stub, "auth", "whoami")


def test_a_login_redirect_means_not_logged_in(stub_app, run_cli):
    """peek-a-boo answers an expired session with a redirect to /login."""
    from peekaboo_cli.errors import NotAuthenticatedError

    stub = stub_app()
    stub.route("GET", "/api/class", {}, status=307, headers={"Location": "/login"})

    with pytest.raises(NotAuthenticatedError):
        run_cli(stub, "classes", "list")
