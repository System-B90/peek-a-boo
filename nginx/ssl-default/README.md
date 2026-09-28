# Default dev TLS cert

`star.crt` (leaf + root chain) and `star.key` are signed by the
[System-B90 Dev Root CA](https://github.com/System-B90/.github/tree/main/dev-ca).
Trust that root once and `https://peekaboo.dev` loads without warnings.

- CN `peekaboo.dev`; SANs `peekaboo.dev`, `*.peekaboo.dev`, `peekaboo.test`,
  `peekaboo.localhost`, `localhost`, `127.0.0.1`, `127.0.0.4`, `127.0.0.5`, `::1`
- Valid until 2028-12-30

`scripts/setup.py` copies these into `nginx/ssl/` when it is empty; e2e CI does the same.
**The key is public and dev-only.** Release bundles don't include this directory,
so production always gets its own cert.
