# Express API

- Location: `services/api`; Express 5 TypeScript service.
- `src/app.ts:createApp` composes security headers, CORS, JSON limits, redacted logging, database connection, rate-limited auth routes, authenticated domain routes, and central error handling.
- Routes: auth, tasks, commitments, preferences, plans. Domain data queries must always be scoped by authenticated user id.
- Mongoose models own users, tasks, commitments, plans, and feedback. This is the only service allowed to access MongoDB.
- Plan generation sends a bounded user-scoped request to the scheduler with `SCHEDULER_SERVICE_TOKEN`, then persists scheduler output.
- Environment values are parsed in `src/config.ts`; never weaken secret separation or pass JWTs/passwords to the scheduler.
- API tests use Vitest/Supertest and mongodb-memory-server.
- Service boundary details: `mem:scheduler/core`; shared shapes: `mem:contracts/core`.