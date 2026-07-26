# Free deployment guide

## Accounts

Create free MongoDB Atlas, Render, Vercel, and Expo accounts using the same
GitHub account where practical.

## 1. MongoDB Atlas

1. Create a Free cluster and a database user.
2. Add `0.0.0.0/0` to the network access list because Render does not provide a
   stable outbound IP on its free service. Use a long, unique database password.
3. Copy the Node.js connection string and set the database name to `focusflow`.

## 2. Render API and scheduler

1. In Render, create a Blueprint from this repository.
2. Confirm the `focusflow-api` Free service from `render.yaml`.
3. Enter `MONGODB_URI`.
4. Initially set `WEB_ORIGIN` to `http://localhost:5173`; replace it with the
   Vercel production URL after step 3.
5. Render generates the JWT and internal scheduler secrets automatically.
6. Wait for `/health` to report `status: ok` and `database: connected`.

Free Render services sleep after inactivity. The first request after sleep can
take about a minute.

## 3. Vercel web app

1. Import the repository into Vercel.
2. Set the project Root Directory to `apps/web`.
3. Set `VITE_API_URL` to `https://<render-service>.onrender.com/api`.
4. Deploy, then copy the production URL into Render's `WEB_ORIGIN` and redeploy
   the Render service.

## 4. Expo mobile app

From `apps/mobile`:

```sh
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --platform android --profile preview
```

Set `EXPO_PUBLIC_API_URL` to the Render URL ending in `/api` before building.
The preview profile produces an installable APK. Attach it to a GitHub Release
for free distribution.

On a physical device during local development, `localhost` points to the phone,
not the computer. Set `EXPO_PUBLIC_API_URL` to the computer's LAN IP.
