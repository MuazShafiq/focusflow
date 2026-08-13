# Task completion

Run targeted checks while iterating, then use the smallest complete set below before handoff.

## Any TypeScript change

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run format:check
```

## Scheduler/Python change

```powershell
.\.venv\Scripts\python.exe -m ruff check services\scheduler
.\.venv\Scripts\python.exe -m pytest services\scheduler\tests
npm test
npm run build
npm run format:check
```

## Behavioral/UI changes

- Start `npm run dev` and exercise the affected end-to-end flow.
- For phone/LAN behavior, start `npm run dev -- --host` and verify the printed phone URL on the target viewport/device.
- Confirm no secrets, local logs, virtualenv content, caches, or generated artifacts are included in the intended Git diff.
- Deployment claims require live verification; a passing local build is not evidence that production changed.