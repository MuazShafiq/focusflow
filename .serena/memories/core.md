# FocusFlow core

- Adaptive planning monorepo: responsive browser client, persistence/auth API, isolated scheduling service, shared contracts.
- Module ownership:
  - `apps/web`: React client only; see `mem:web/core`.
  - `services/api`: Express API, authentication, user-scoped persistence, scheduler orchestration; see `mem:api/core`.
  - `services/scheduler`: Flask constraint/ML scheduler; see `mem:scheduler/core`.
  - `packages/contracts`: shared TypeScript domain types; see `mem:contracts/core`.
- Hard scheduling constraints are authoritative. ML ranks feasible slots; it must not introduce overlaps or move locked commitments.
- Express is the only MongoDB owner. Scheduler receives bounded scheduling data plus an internal service token, never credentials/JWTs, and never connects to MongoDB.
- One responsive web client serves desktop and mobile browsers.
- Toolchain and version boundaries: `mem:tech_stack`.
- Code and architecture patterns: `mem:conventions`.
- Local workflows: `mem:suggested_commands`.
- Required validation before handoff: `mem:task_completion`.