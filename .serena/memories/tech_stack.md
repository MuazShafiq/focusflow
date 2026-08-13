# Technology stack

- npm workspace monorepo; Node >=22 (`.nvmrc` pins 22), npm 10+.
- TypeScript: strict compiler settings, TS 6.x.
- Web: React 19, Vite 8, TanStack React Query, Lucide, ESLint 9.
- API: Node/Express 5, Mongoose 8/MongoDB, Zod 4, JWT/bcrypt, Pino, Vitest/Supertest.
- Contracts: framework-free TypeScript package built to `dist`.
- Scheduler: Python 3.11+, Flask 3.1, scikit-learn 1.7, NumPy/joblib; pytest and Ruff for development.
- Production topology: three Vercel projects (web/API/scheduler) plus MongoDB Atlas.
- Default local orchestration uses Vite, Express, Flask, and mongodb-memory-server; no local MongoDB install required.