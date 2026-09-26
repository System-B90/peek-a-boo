# Peek-a-Boo

Monitor your students the smart way

---

## Install (release bundle)

Every `v*` tag publishes two bundles on the [releases page](https://github.com/System-B90/peek-a-boo/releases),
both extracting into a versionless `peekaboo/` directory:

| Bundle                          | Contains                                                                    |
| ------------------------------- | --------------------------------------------------------------------------- |
| `peekaboo-online-<tag>.tar.gz`  | scripts, compose files, nginx template, `VERSION` — images pulled from GHCR |
| `peekaboo-offline-<tag>.tar.gz` | the same, plus `images/*.tar` and vendored Python `wheels/` (air-gapped)    |

```bash
tar -xzf peekaboo-online-v1.2.3.tar.gz && cd peekaboo
./install.sh            # Windows: .\install.ps1
```

`install.sh` preflights Docker/Compose/ports, runs the `setup.py` wizard on first
run (writes `.env`, `nginx/ssl/` certs signed by a local System-B90 CA, and
`websock/websocket_token_source.txt` from Hive's student list), loads offline
images if present, pins `PEEKABOO_VERSION` from `VERSION`, and brings the stack up.
To use your own certificate, place it at `nginx/ssl/star.crt` / `nginx/ssl/star.key`.

| Script         | Purpose                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| `update.sh`    | In-place upgrade: `./update.sh` (latest), `--version <tag>`, or `--package <offline.tar.gz>`           |
| `link-hive.sh` | Co-located Hive on the same Docker host: aliases Hive's nginx and adds `docker-compose.hive-local.yml` |

## Repository layout

| Path       | Contains                                                                                                                    |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| `scripts/` | `setup.py` wizard, `install.sh`/`install.ps1`, `update.sh`, `link-hive.sh`, CI helpers                                      |
| `deploy/`  | Compose files: `docker-compose.yml` (base), `.dev.yml`, `.test.yml`, `.hive-local.yml`, `.release.yml` (shipped in bundles) |
| `nginx/`   | `nginx.conf.template`; `ssl/` holds certs (gitignored)                                                                      |
| `websock/` | Python websockify VNC bridge                                                                                                |

## Development Setup (Windows)

```powershell
$env:ALLOW_LOGIN_BYPASS = "true"
py -3.11 -m venv venv
.\venv\Scripts\activate
pip install -r scripts\requirements.txt
python scripts\setup.py      # run from the repo root

pushd .\websock\
py -3.11 -m venv venv
.\venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r .\requirements.txt
python .\start_websockify.py &
popd

npm run dev
```

Containerised: `npm run docker:dev` (see CLAUDE.md). Co-located Hive: `scripts/link-hive.sh`.

## Lint & Test

```bash
npm run lint         # ESLint over the whole repo
npm run lint:fix      # ...with --fix
npm run test:unit     # Vitest unit tests (tests/backend/*.test.ts)
ruff check .           # Python lint
ruff format --check .  # Python format check
```

A Husky pre-commit hook runs `lint-staged` (ESLint on JS/TS, Prettier on JSON/CSS/MD).
CI (`.github/workflows/ci.yml`) runs lint, unit tests, and a build check on every push and pull request.

## E2E Tests

Playwright drives the app against a real, locally-booted Hive instance —
Peek-a-boo has no OAuth flow, so `tests/e2e/auth.setup.ts` logs in as Hive's
`admin`/`Password1` superuser through the real `/login` form and saves the
session to `tests/.auth/user.json`, which the rest of the suite reuses.

Locally:

```bash
# Boot Hive yourself (see hivelms/Hive), then generate a CI-style .env and
# verify the 'api' service account:
python scripts/ci_setup.py

npm run docker:test          # builds & starts nginx/nextjs/websock on 127.0.0.5
npx playwright install chromium
npm run test:e2e             # or test:e2e:ui
npm run docker:test:down
```

CI (`.github/workflows/e2e.yml`) is fully hermetic: it clones
`hivelms/Hive`'s `feature/sso` branch with the `ACCESS_TOKEN` repo secret,
builds/boots Hive, pins the `api` service account's password, generates a
self-signed cert + `.env`, builds the Peek-a-boo stack via
`deploy/docker-compose.test.yml` (nginx bound to `127.0.0.5` so it doesn't collide
with Hive on `127.0.0.1`), then runs the Playwright suite — uploading the
HTML report, test results, and container logs on failure.

## Contributing

Segel students are welcome to contribute! Browse [open issues](https://github.com/System-B90/peek-a-boo/issues), especially those labeled `NEWBIES WELCOME`, then fork the repo and open a pull request against `master`.
