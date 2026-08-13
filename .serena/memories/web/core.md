# Web client

- Location: `apps/web`; React 19 + TypeScript + Vite.
- `src/App.tsx` owns lightweight pathname routing among landing, login/register, and dashboard; authenticated root redirects to dashboard.
- `src/auth/AuthContext.tsx` owns session persistence and authenticated API actions.
- `src/lib/api.ts` is the API boundary. Keep database and scheduler access out of the client.
- `DashboardPage` owns task/commitment/preferences/planning interactions and responsive calendar views.
- Must remain one responsive desktop/mobile browser app with touch-friendly, safe-area-aware behavior.
- Shared payload/domain shapes belong in `mem:contracts/core`.
- Global practices and checks: `mem:conventions`, `mem:task_completion`.