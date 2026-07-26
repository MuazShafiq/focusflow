# FocusFlow

FocusFlow is an adaptive planner that turns deadlines, fixed commitments, energy
patterns, and lifestyle goals into a realistic weekly schedule. A constraint-aware
planner keeps schedules feasible, while a lightweight machine-learning model learns
which study blocks each user is most likely to complete.

## Architecture

| Area | Technology |
| --- | --- |
| Web | React, TypeScript, Vite |
| Mobile | React Native, Expo Router, TypeScript |
| API | Node.js, Express, MongoDB |
| Scheduling | Python, Flask, scikit-learn |
| Deployment | Vercel, Render, MongoDB Atlas, Expo EAS |

```text
apps/web                 responsive browser application
apps/mobile              Android/iOS Expo application
packages/contracts       shared TypeScript domain contracts
services/api             authentication and synchronized data API
services/scheduler       constraint-aware ML scheduling service
```

## Local development

Prerequisites: Node.js 22+, npm 10+, Python 3.11+, and MongoDB.

1. Copy `.env.example` to `.env` and replace the development secrets.
2. Run `npm install`.
3. Create a Python virtual environment and install
   `services/scheduler/requirements-dev.txt`.
4. Start Flask with `npm run dev:scheduler`.
5. Start the API and clients with `npm run dev`.

More detailed setup and deployment documentation will be added as the MVP is
completed.
