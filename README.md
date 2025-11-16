# Peek-a-Boo
Monitor your students the smart way

---

## Quick Start
1) Acquire an Ubuntu machine with docker.
2) Create a TLS certificate for your peek-a-boo domain and place it in ./utils/certs.
3) Pull / import the 3 images required.
4) Setup the environment.

```bash
py -3.11 -m venv .venv
source ./.venv/bin/activate
pip install PyHiveLMS dotenv requests
python ./setup.py

sudo docker-compose up
```


## Development Setup (Windows)
```powershell
$env:ALLOW_LOGIN_BYPASS = "true"
py -3.11 -m venv venv
.\venv\Scripts\activate
pip install PyHiveLMS dotenv requests
python .\setup.py

npm run dev
```
