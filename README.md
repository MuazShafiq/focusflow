# FocusFlow

FocusFlow is an AI-assisted planner that turns tasks, deadlines, recurring
commitments, energy patterns, and lifestyle goals into a realistic calendar.
Its constraint-aware scheduling engine protects fixed commitments and healthy
routines while a lightweight machine-learning model learns when each user is
most likely to complete focused work.

**Live web app:** [focusflow-web-azure.vercel.app](https://focusflow-web-azure.vercel.app)

## Features

- Synchronized accounts, tasks, preferences, and plans across web and mobile
- Recurring tasks and weekly fixed commitments
- Automatic 7- or 14-day planning around deadlines and existing commitments
- Day, three-day, and week calendar views with readable event details
- Protected breaks, exercise, leisure, lunch, and dinner scheduling
- User-controlled day boundaries, focus duration, energy levels, and 12/24-hour time
- Completion feedback that influences future scheduling recommendations
- Dark, responsive React web interface and an Expo-powered React Native client

## How scheduling works

The Flask scheduling service combines hard constraints with a completion-scoring
model. Fixed commitments and locked blocks are placed first. Candidate focus
slots are then ranked using task priority, difficulty, deadline pressure,
preferred study time, energy levels, workload balance, and the user's historical
completion pattern. The result remains explainable: every calendar block includes
a reason for its placement.

## Architecture

| Area | Technology |
| --- | --- |
| Web | React, TypeScript, Vite |
| Mobile | React Native, Expo Router, TypeScript |
| API | Node.js, Express, MongoDB |
| Scheduling | Python, Flask, scikit-learn |
| Deployment | Vercel Hobby, MongoDB Atlas, Expo/EAS |

The web client, Express API, and Flask scheduler run as separate Vercel projects.
MongoDB Atlas provides the shared database, and Expo is used for mobile development
and installable Android builds.

```text
apps/web                 responsive browser application
apps/mobile              Android/iOS Expo application
packages/contracts       shared TypeScript domain contracts
services/api             authentication and synchronized data API
services/scheduler       constraint-aware ML scheduling service
```

## Local development

Prerequisites: Node.js 22+, npm 10+, and Python 3.11+. A local MongoDB install
is not required for the default development workflow.

From the repository root in PowerShell:

```powershell
npm install
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r services\scheduler\requirements-dev.txt
npm run dev
```

Open `http://localhost:5173`. The command starts the web app, API, scheduler,
and an isolated in-memory MongoDB instance. Local accounts and data reset when
the command stops, so local testing cannot alter the deployed Atlas database.

To run the mobile app, leave `npm run dev` running and use a second terminal:

```powershell
npm run dev:mobile
```

Expo on a physical phone needs `EXPO_PUBLIC_API_URL` set to the computer's LAN
address. FocusFlow detects the LAN address from Expo automatically; use
`EXPO_PUBLIC_API_URL` only when you need to override it.

### Expo Go on an Android phone

FocusFlow uses Expo SDK 57. During Expo's SDK 57 transition, the Play Store
version of Expo Go still targets SDK 54. Download Expo's matching Android client:

```powershell
cd apps\mobile
npx expo-go download android 57
```

Install the downloaded APK on the phone, allowing installation from the browser
or file manager when Android asks. If Android reports that the app cannot be
installed, uninstall the Play Store copy of Expo Go first and retry the APK.
Then leave `npm run dev` running, start `npm run dev:mobile` in a second
terminal, and scan its QR code while the phone and computer are on the same
network.

Expo Go does not load FocusFlow's notification module on Android because recent
Expo Go clients do not support remote push notifications. The planner still
works there; notification scheduling is enabled in FocusFlow development and
standalone builds.

## Deployment

The production setup is designed to stay within free tiers for a personal MVP.
See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the MongoDB Atlas, Vercel, and
Expo setup.
