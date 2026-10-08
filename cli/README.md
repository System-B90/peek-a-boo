# peekaboo

Drive Peek-a-boo from the terminal: everything the web UI does, scriptable.

```bash
pip install peekaboo --extra-index-url https://system-b90.github.io/.github/pypi/
peekaboo login                 # opens the browser, hands the session back to the CLI
peekaboo students list --mine  # your mentees
```

## Commands

| Command                                                                           | UI equivalent                                   |
| --------------------------------------------------------------------------------- | ----------------------------------------------- |
| `peekaboo login` / `logout` / `auth config` / `auth whoami`                       | Log in with Hive (browser hand-off)             |
| `peekaboo students list [--mine\|--mentor U] [--program P] [--status S] [--wide]` | Dashboard / mentees page                        |
| `peekaboo students get <username>`                                                | Student tile details                            |
| `peekaboo students avatar <hiveId> -o file`                                       | Student avatar                                  |
| `peekaboo classes list`                                                           | Class filter                                    |
| `peekaboo vnc open <username> [--fullscreen] [--print]`                           | VNC page / full-screen view                     |
| `peekaboo vnc info <username> [--reveal]`                                         | Host, port and password for a native VNC viewer |
| `peekaboo vnc install-command [--computer C \| --search-scope S]`                 | Settings → VNC admin pane                       |
| `peekaboo tweet "message" [--attach shot.png]`                                    | Tweet bot (screenshot / recording)              |
| `peekaboo settings show [--defaults] [--reveal]` / `set K=V ...` / `reset`        | Settings page                                   |
| `peekaboo env`                                                                    | Client environment the UI boots from            |
| `peekaboo open [dashboard\|mentees\|fullscreen\|settings]`                        | Open a page in the browser                      |
| `peekaboo health`                                                                 | Container liveness probe                        |
| `peekaboo interactive`                                                            | Menu over every command above                   |

Global flags work in any position: `--json`, `-q/--quiet`, `--url`, `--insecure`,
`--timeout`. Configuration resolves flags > `PEEKABOO_URL` / `PEEKABOO_TOKEN` /
`PEEKABOO_INSECURE` (env or a cwd `.env`) > the config file `peekaboo login` writes.

## Development

```bash
pip install -e ./cli
pytest cli/tests -q
```

The version lives in `peekaboo/__init__.py` and is bumped together with the app by
`python -m sb90_deploy publish` (see `deploy/app.json` `release.manifests`).
