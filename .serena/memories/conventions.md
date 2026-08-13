# Conventions

- Formatting: UTF-8, LF, final newline, trailing whitespace removed; 2-space indentation except Python uses 4; Prettier is repository formatter.
- TypeScript is strict with unchecked indexed access enabled. Prefer typed domain values from `@focusflow/contracts`.
- React uses function components and hooks; component names are PascalCase, helpers/callbacks camelCase. UI must remain responsive for desktop and mobile browsers.
- API modules use ESM, route-specific Express routers, `asyncHandler`, Zod validation, and `ApiError`/central error middleware. Protected data access must include the authenticated user id.
- Secrets/config come from validated environment variables. Preserve narrow CORS, body limits, rate limits, security headers, auth redaction, and distinct access/refresh token behavior.
- Mongoose models use PascalCase model exports and schema fields aligned with shared contracts.
- Python uses `from __future__ import annotations`, type hints, snake_case functions, PascalCase classes, and slotted dataclasses where suitable; Ruff line length is 88.
- Scheduler validation happens at the service boundary. Constraint placement precedes ML scoring; feedback may alter ranking but not feasibility.
- TypeScript tests use Vitest `describe`/`it`; Python tests use pytest `test_*`. Cover user isolation, recurrence/expansion, non-overlap, capacity reporting, and feedback-sensitive ranking when relevant.