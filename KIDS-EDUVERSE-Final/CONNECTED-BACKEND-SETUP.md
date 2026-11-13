# KIDS EDUVERSE — Local and Deployment Setup

The frontend supports parent signup/login and syncs a learning summary and badges to the Express + MongoDB backend. Detailed lesson events stay in browser storage; cloud progress is not merged across devices yet.

## Run locally

1. Install Node.js 18 or newer.
2. In `KIDS-EDUVERSE-Backend`, run `npm install`.
3. Copy `.env.example` to `.env`. Set your Atlas connection string, a random JWT secret (at least 32 characters), and local Live Server origins in `CLIENT_ORIGIN`.
4. Start the backend with `npm run dev` from the backend folder.
5. Open `KIDS-EDUVERSE-Final/index.html` with VS Code Live Server. Do not open it as a `file://` URL.

The local frontend uses `http://localhost:5000/api`. If Live Server is on a different local host or port, include its exact origin in `CLIENT_ORIGIN`.

## Deploy as one HTTPS service

The Express backend serves the frontend files and `/api` from the same origin, so visitors do not need a browser-console command to configure the API.

From the repository root, configure your Node host with:

- Install/build: `npm install --prefix KIDS-EDUVERSE-Backend`
- Start: `npm start --prefix KIDS-EDUVERSE-Backend`
- Environment variables: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, and `NODE_ENV=production`. Let the host set `PORT`.

Use the public HTTPS origin of your deployed site for `CLIENT_ORIGIN`. Add the backend host's outbound IP addresses to Atlas Network Access. Store secrets in the host's environment settings; do not upload `.env` or put credentials in frontend files.

Visit `/health` on the deployed service to check backend health. The site itself is served at `/`.

## Security and privacy

The backend hashes passwords and protects API routes with JWTs. Use a unique, random production JWT secret and HTTPS. This is a technical setup guide, not a privacy/compliance review; before making the app public for children, review applicable parental-consent, privacy, and data-retention requirements.

## Current limits

- Cloud sync saves an overall progress summary and badges, not every lesson/game event.
- Cloud progress is not downloaded and merged on a new device; browser local storage remains active.
