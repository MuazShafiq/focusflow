# Shared contracts

- Location: `packages/contracts`; framework-free TypeScript package published internally as `@focusflow/contracts`.
- Defines shared domain types for auth sessions, users/preferences, tasks, commitments, plans, and schedule blocks.
- Build output is `dist`; consumers should import contract types instead of recreating API payload interfaces.
- Keep contract changes backward-compatible when possible; inspect and update web/API references together when shapes change.
- Validate contract changes through root typecheck/build checks in `mem:task_completion`.