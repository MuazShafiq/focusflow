# FocusFlow

FocusFlow is an AI-assisted planner for desktop and mobile browsers. It turns
tasks, deadlines, recurring commitments, energy patterns, and lifestyle goals
into a realistic calendar. Its constraint-aware scheduling engine protects
fixed commitments and healthy routines while a lightweight machine-learning
model learns when each user is most likely to complete focused work.

**Live web app:** [focusflow-web-azure.vercel.app](https://focusflow-web-azure.vercel.app)

Use the same URL on a computer or phone—no native app or app-store installation
is required.

## Features

- One synchronized, responsive app for desktop and mobile browsers
- Recurring tasks and weekly fixed commitments
- Automatic 7- or 14-day planning around deadlines and existing commitments
- Day, three-day, and week calendar views with readable event details
- Protected breaks, exercise, leisure, lunch, and dinner scheduling
- User-controlled day boundaries, focus duration, energy levels, and 12/24-hour time
- Completion feedback that influences future scheduling recommendations
- Installable mobile-web experience with safe-area navigation and touch-friendly forms

## How scheduling works

The Flask scheduling service combines hard constraints with a completion-scoring
model. Fixed commitments and locked blocks are placed first. Candidate focus
slots are then ranked using task priority, difficulty, deadline pressure,
preferred study time, energy levels, workload balance, and the user's historical
completion pattern. The result remains explainable: every calendar block includes
a reason for its placement.

## Architecture

| Area       | Technology                         |
| ---------- | ---------------------------------- |
| Client     | Responsive React, TypeScript, Vite |
| API        | Node.js, Express, MongoDB          |
| Scheduling | Python, Flask, scikit-learn        |
| Deployment | Vercel Hobby, MongoDB Atlas        |

The web client, Express API, and Flask scheduler run as separate Vercel projects.
MongoDB Atlas provides the shared database. The same web client adapts to desktop
and phone layouts and can be installed from a supported mobile browser.

```text
apps/web                 desktop and mobile browser application
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

To expose that same development session to a phone on the local network, run:

```powershell
npm run dev -- --host
```

FocusFlow detects the computer's LAN address, configures the API and CORS, and
prints the exact phone URL. Keep the phone and computer on the same private
network, and allow Node.js through Windows Firewall if prompted.

The production app works directly in the browser at the live URL above. Supported
mobile browsers can add FocusFlow to the home screen from their browser menu.

## Deployment

The production setup is designed to stay within free tiers for a personal MVP.
See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the MongoDB Atlas and Vercel
setup.
