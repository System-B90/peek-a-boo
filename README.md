# Peek-a-Boo

Monitor your students the smart way

---

## Quick Start

1. Acquire an Ubuntu machine with docker.
2. Clone the repository.
3. Create a TLS certificate for your peek-a-boo domain (and the "wss." domain) and place it in ./utils/certs.
    1. Your certificate should look like this:
    ```
    DOMAIN NAME: peek-a-boo.my-domain.dom
    ALT NAME: wss.peek-a-boo.my-domain.dom
    ```
    2. Place it in `./utils/certs/` as `star.key` and `star.crt`.
4. Pull / import the 3 images required.
    1. nginx
    2. peekaboo_nextjs _(from releases tab)_
    3. peekaboo_websock _(from releases tab)_
5. Setup the environment.
    ```bash
    py -3.11 -m venv .venv
    source ./.venv/bin/activate
    pip install PyHiveLMS dotenv requests cryptography
    python ./setup.py
    ```
6. Boot up the environment.
    ```bash
    sudo docker-compose up
    ```

## Development Setup (Windows)

```powershell
$env:ALLOW_LOGIN_BYPASS = "true"
py -3.11 -m venv venv
.\venv\Scripts\activate
pip install PyHiveLMS dotenv requests
python .\setup.py

pushd .\websock\
py -3.11 -m venv venv
.\venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r .\requirements.txt
python .\start_websockify.py &
popd

npm run dev
```

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

npm run docker:test          # builds & starts nginx/nextjs/websock on 127.0.0.3
npx playwright install chromium
npm run test:e2e             # or test:e2e:ui
npm run docker:test:down
```

CI (`.github/workflows/e2e.yml`) is fully hermetic: it clones
`hivelms/Hive`'s `feature/sso` branch with the `ACCESS_TOKEN` repo secret,
builds/boots Hive, pins the `api` service account's password, generates a
self-signed cert + `.env`, builds the Peek-a-boo stack via
`docker-compose.test.yml` (nginx bound to `127.0.0.3` so it doesn't collide
with Hive on `127.0.0.1`), then runs the Playwright suite — uploading the
HTML report, test results, and container logs on failure.

## Contributing

Segel students are welcome to contribute! Browse [open issues](https://github.com/System-B90/peek-a-boo/issues), especially those labeled `NEWBIES WELCOME`, then fork the repo and open a pull request against `master`.
