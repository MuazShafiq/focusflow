# Free, no-card deployment guide

## Accounts

Create free MongoDB Atlas and Vercel accounts using the same GitHub account where
practical. Vercel Hobby is for personal, non-commercial projects.

## 1. MongoDB Atlas

1. Create a Free cluster and a database user.
2. Add `0.0.0.0/0` to the network access list because Vercel Hobby does not
   provide a stable outbound IP. Use a long, unique database password.
3. Copy the Node.js connection string and set the database name to `focusflow`.

## 2. Vercel Flask scheduler

1. Import this repository as a Vercel project.
2. Set its Root Directory to `services/scheduler`.
3. Create `SCHEDULER_SERVICE_TOKEN` as a secret with at least 32 random
   characters.
4. Deploy and verify that `/health` reports `status: ok`.

## 3. Vercel Express API

1. Import the same repository as a second Vercel project.
2. Set its Root Directory to `services/api`.
3. Add `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
   `SCHEDULER_SERVICE_TOKEN`, `SCHEDULER_URL`, and `WEB_ORIGIN`.
4. Use the same scheduler token in both backend projects.
5. Set `SCHEDULER_URL` to the scheduler URL without a trailing slash.
6. Initially set `WEB_ORIGIN` to `http://localhost:5173`.
7. Deploy and verify that `/health` reports `database: connected`.

## 4. Vercel web app

1. Import the repository into Vercel.
2. Set the project Root Directory to `apps/web`.
3. Set `VITE_API_URL` to `https://<api-project>.vercel.app/api`.
4. Deploy, then copy the production URL into the API project's `WEB_ORIGIN` and
   redeploy the API.

The deployed web URL is the desktop and mobile application. On supported mobile
browsers, users can add it to their home screen without a store build.
