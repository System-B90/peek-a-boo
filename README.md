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
    pip install git+https://github.com/System-B90/pyhive.git@main dotenv requests cryptography
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
pip install git+https://github.com/System-B90/pyhive.git@main dotenv requests
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

## Contributing

Segel students are welcome to contribute! Browse [open issues](https://github.com/System-B90/peek-a-boo/issues), especially those labeled `NEWBIES WELCOME`, then fork the repo and open a pull request against `master`.
