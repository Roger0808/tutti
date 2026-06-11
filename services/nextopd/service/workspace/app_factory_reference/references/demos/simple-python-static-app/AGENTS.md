# Simple Python Static Demo

Package layout:

- `nextop.app.json`: app manifest.
- `bootstrap.sh`: launches `server.py`.
- `server.py`: serves `/healthz`, static HTML, and JSON endpoints.
- `static/`: browser assets.

Runtime:

- Nextop starts `bootstrap.sh` with no arguments from `NEXTOP_APP_RUNTIME_DIR`.
- Launch `server.py` with `NEXTOP_APP_PYTHON`.
- Bind `NEXTOP_APP_HOST` and `NEXTOP_APP_PORT`.
- Read package assets from `NEXTOP_APP_PACKAGE_DIR`.
- Store durable JSON data in `NEXTOP_APP_DATA_DIR`.
- Use `NEXTOP_APP_RUNTIME_DIR` for scratch files and `NEXTOP_APP_LOG_DIR` for logs.

Local run example:

```sh
APP_DIR="$PWD"
RUN_DIR="$(mktemp -d)"
NEXTOP_APP_HOST=127.0.0.1 \
NEXTOP_APP_PORT=8787 \
NEXTOP_APP_BASE_URL=http://127.0.0.1:8787 \
NEXTOP_APP_PACKAGE_DIR="$APP_DIR" \
NEXTOP_APP_RUNTIME_DIR="$RUN_DIR/runtime" \
NEXTOP_APP_DATA_DIR="$RUN_DIR/data" \
NEXTOP_APP_LOG_DIR="$RUN_DIR/logs" \
NEXTOP_APP_PYTHON="$(command -v python3)" \
./bootstrap.sh
```

Endpoints:

- `GET /healthz`: healthcheck.
- `GET /api/state`: reads durable JSON state from `NEXTOP_APP_DATA_DIR`.

Modification guidance:

- Keep package files self-contained.
- Keep runtime writes out of the package directory.
- Read locale from the optional host app context or browser locale APIs.
- Use CSS `prefers-color-scheme` for theme rendering.
