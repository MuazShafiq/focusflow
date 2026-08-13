# Codex project instructions

## Project startup

For every coding task in this repository:

1. Activate the FocusFlow project with Serena.
2. Read Serena's `core` memory as the project entry point.
3. Follow only the memory references relevant to the module or task being
   changed. Do not preload every project memory.
4. Read `README.md` or documents under `docs/` only when the task specifically
   needs their setup, architecture, deployment, or product details.

## Serena

Use Serena like the Faask repository does: activate this project before coding
tasks and prefer Serena's semantic navigation, reference-aware refactoring, and
symbol-level editing tools when they fit the work.

Do not rerun onboarding or create, edit, rename, or delete Serena memories during
ordinary tasks. Memory maintenance requires an explicit user request.

## Repository boundaries

- `apps/web` is the responsive React client.
- `services/api` is the Express API and the only service that accesses MongoDB.
- `services/scheduler` is the isolated Flask/scikit-learn scheduler; it must not
  receive user credentials or connect directly to MongoDB.
- `packages/contracts` contains shared TypeScript domain contracts.

Preserve these service boundaries and never commit secrets or generated local
artifacts.
