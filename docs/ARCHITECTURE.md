# FocusFlow architecture

## Runtime flow

1. The React web app and Expo mobile app authenticate through the Express API.
2. Express owns users, tasks, commitments, preferences, plans, and feedback in
   MongoDB.
3. Plan generation sends a bounded, user-scoped payload to Flask over the
   container's loopback interface.
4. Flask protects fixed commitments and locked blocks, adds enabled lifestyle
   targets, and searches feasible task slots.
5. A scikit-learn classifier scores candidate task blocks by expected completion
   fit. Express persists the result, making it available to both clients.

Flask never receives passwords or tokens and does not connect to MongoDB.

## Scheduling model

The first model is bootstrapped on reproducible synthetic data. Its inputs are:

- hour and weekday;
- the user's energy estimate for that time of day;
- task difficulty and priority;
- preferred-time match;
- deadline pressure;
- session length; and
- work already scheduled that day.

The constraint layer remains authoritative: an ML score can rank feasible slots
but can never create overlaps or move a locked commitment. Completion and skip
history immediately updates a per-user time-of-day success profile, which is
blended into the next plan. Richer feedback is retained for later model
retraining.

## Security boundaries

- Passwords use bcrypt with a cost factor of 12.
- Access and refresh JWTs use different secrets and token types.
- Logout increments a server-side token version, revoking refresh tokens.
- Every data query includes the authenticated user's identifier.
- Request bodies are validated before reaching persistence.
- Flask requires a timing-safe internal service token comparison.
- Helmet, narrow CORS configuration, body limits, and auth rate limits are
  enabled.

## Free deployment topology

Express and Flask run in one Render container. Flask binds only to `127.0.0.1`;
Express is the only public process. This preserves the logical service boundary
while consuming one Render free instance instead of two.

The web client deploys to Vercel. MongoDB Atlas provides the database, and Expo
EAS produces Android APKs for GitHub Releases.
