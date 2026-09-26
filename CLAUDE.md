# CLAUDE.md — peek-a-boo

Org-wide conventions (repo list, Hive-org boundary, package scopes, git workflow, commit
format, CI secrets) live in
[System-B90/.github CLAUDE.md](https://github.com/System-B90/.github/blob/main/CLAUDE.md).
This file covers what's specific to peek-a-boo.

## What peek-a-boo is

Student monitoring app ("Monitor your students the smart way"). Next.js frontend + a
Python **websockify** component (`websock/`) that proxies **VNC** connections to student
machines into the browser via `react-vnc`. Auth is **Hive SSO only**, via NextAuth
(`@system-b90/hive-nextauth`'s `buildHiveAuthOptions()`).

Three deployable pieces, each its own Docker image: `nginx` (proxy), `peekaboo_nextjs`
(this app), `peekaboo_websock` (the VNC-over-websocket bridge in `websock/`).

## Run locally (Windows dev)

```powershell
$env:ALLOW_LOGIN_BYPASS = "true"
py -3.11 -m venv venv
.\venv\Scripts\activate
pip install -r scripts\requirements.txt
python scripts\setup.py   # from the repo root; writes .env, nginx/ssl/, websock token file

pushd .\websock\
py -3.11 -m venv venv
.\venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r .\requirements.txt
python .\start_websockify.py &
popd

npm run dev
```

`ALLOW_LOGIN_BYPASS=true` skips real auth for local dev — never set it outside a local
environment.

Containerised dev (Bluz-style): `npm run docker:dev` layers `deploy/docker-compose.dev.yml`
over `deploy/docker-compose.yml` � builds the `dev` Dockerfile target, live-syncs `src/`
via `compose --watch`, nginx on `127.0.0.4:80/443` (needs `.env` with `NPM_TOKEN`).
`docker:down` / `docker:nuke` tear it down.

For the release-bundle install (`./install.sh` / `.\install.ps1`, `./update.sh`, `./link-hive.sh`; TLS certs in `nginx/ssl/` as `star.key` /
`star.crt`), see [README.md](README.md). Bundles are built by the shared
[sb90-deploy](https://github.com/System-B90/deploy-py) (org `craft-release` action) from
`deploy/app.json`: its `bundle.files` lists what ships next to the generated launchers,
`bootstrap.py` and `app.json`; images are read from `deploy/docker-compose.release.yml`.
Add a bundle file there, not in `release.yml`. The install/update/link-hive logic lives in
sb90-deploy — only `scripts/setup.py` (the wizard's peek-a-boo questions) stays here.

## Tests

```bash
npm run lint            # ESLint over the whole repo (lint:fix to autofix)
npm run test:unit       # Vitest (tests/backend/*.test.ts)
ruff check .             # Python lint (websock/, scripts/)
ruff format --check .    # Python format check
```

A Husky pre-commit hook runs `lint-staged` (ESLint on JS/TS, Prettier on JSON/CSS/MD) —
don't bypass it. CI (`.github/workflows/ci.yml`) runs lint, unit tests, and a build check
on every push and PR.

**Regression tests for bugs:** Every closed bug issue must have a dedicated regression test committed alongside the fix. The test must fail on the pre-fix code and pass after. This prevents bugs from silently resurfacing.

## Key directories

| Path                             | Contains                                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `src/client-api/`                | Client-side fetch wrappers. Browser-only.                                                                       |
| `src/app/api/`                   | Route handlers: `avatar`, `class`, `env`, `install-client`, `login`, `logout`, `settings`, `students`, `tweet`. |
| `src/server-api/`                | Server-only: Hive client, NextAuth options, session/auth logic.                                                 |
| `src/shared-api/`                | Shared types/contracts and error classes, pure utils.                                                           |
| `src/components/search`          | React UI.                                                                                                       |
| `src/interfaces/`, `src/glyphs/` | Shared TS interfaces; icon/glyph assets.                                                                        |
| `websock/`                       | Standalone Python websockify service — VNC bridge, own `requirements.txt` + venv.                               |
| `nginx/`                         | `nginx.conf.template`; `ssl/` holds TLS certs (`star.key`, `star.crt`, `ca.crt`) — gitignored, never commit.    |
| `deploy/`                        | Compose: base, `.dev`, `.test` (e2e), `.hive-local` (co-located Hive), `.release` (shipped in bundles).         |
| `scripts/`                       | `setup.py` wizard (on sb90-deploy), `ci_setup.py`, `bump_version.py`.                                           |
| `tests/backend/`                 | Vitest: `enc.test.ts`, `error-classes.test.ts`, `network-error-parsing.test.ts`.                                |

## Gotchas

- **Two runtimes in one repo**: the Next.js app (`npm run dev`) and the Python websockify
  bridge (`websock/`, its own venv) are separate processes — both need to be running for
  VNC features to work locally.
- **Auth is Hive SSO only** (via NextAuth + `@system-b90/hive-nextauth`'s
  `buildHiveAuthOptions()`) — LDAP support was removed. `src/app/api/auth/[...nextauth]/`
  is the NextAuth route; `src/app/api/common.tsx` reads the session server-side.
- `ALLOW_LOGIN_BYPASS` is a real security bypass — local-dev only, never in a committed
  config or deployed environment.
- Only `master` exists as a long-lived branch (no `dev`) — PR against `master`, per the
  README's own contributing note. Open issues labeled `NEWBIES WELCOME` are meant for
  external/student contributors, not a signal to skip normal review.
