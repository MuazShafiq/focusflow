# Suggested commands

Run from repository root in PowerShell unless noted.

## Initial setup

```powershell
npm install
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r services\scheduler\requirements-dev.txt
```

## Development

- Full local stack with isolated in-memory MongoDB: `npm run dev`
- Full stack exposed to a phone on the LAN: `npm run dev -- --host`
- Individual services: `npm run dev:web`, `npm run dev:api`, `npm run dev:api:local`, `npm run dev:scheduler`
- Web URL: `http://localhost:5173`; API defaults to port 4000; scheduler defaults to `127.0.0.1:5001`.

## Checks

- Build all workspaces: `npm run build`
- API plus scheduler tests: `npm test`
- TypeScript type checks: `npm run typecheck`
- TypeScript lint: `npm run lint`
- Formatting check/write: `npm run format:check` / `npm run format`
- Python lint: `.\.venv\Scripts\python.exe -m ruff check services\scheduler`
- Scheduler tests only: `.\.venv\Scripts\python.exe -m pytest services\scheduler\tests`
- API tests only: `npm run test -w @focusflow/api`

Use `rg` / `rg --files` for fast repository search on Windows.