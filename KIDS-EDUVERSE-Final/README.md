# KIDS EDUVERSE

## Local development

1. Install Node.js 20 or newer.
2. In `KIDS-EDUVERSE-Backend`, run `npm install`.
3. Copy `KIDS-EDUVERSE-Backend/.env.example` to `.env` in that folder and set `MONGODB_URI`, a random `JWT_SECRET` of at least 32 characters, and `CLIENT_ORIGIN` for your local Live Server origin.
4. Run `npm run dev` from `KIDS-EDUVERSE-Backend`.
5. Open `KIDS-EDUVERSE-Final/index.html` with Live Server.

## Deploy to Vercel

The root `server.js` exports the Express app for Vercel. `npm run build` copies the frontend into `public/`, which Vercel serves as static assets. The frontend uses the same-origin `/api` URL on the deployed domain.

Connect this GitHub repository to Vercel with the repository root as the project root. Use the default Express detection and `npm run build` as the build command. Add `MONGODB_URI`, a production-only random `JWT_SECRET`, `CLIENT_ORIGIN` set to your Vercel production origin, and `NODE_ENV=production` in Vercel's environment settings. Configure MongoDB Atlas Network Access for the backend's outbound connections. Keep `.env` and `data/users.json` out of Git.

After deployment, visit `/` for the website and `/health` for the API health response.

## Features

Parent signup and login use the backend. The app keeps local learning progress in the browser and syncs a summary and badges to MongoDB while signed in. Individual activity events are not yet merged across devices.

The Rhyme Room contains 15 sing-along rhymes: 8 English and 7 Bangla. Before a public launch for children, review applicable parental-consent, privacy, and data-retention requirements.
