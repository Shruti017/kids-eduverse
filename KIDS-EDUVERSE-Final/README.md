# KIDS EDUVERSE

## Run locally

1. Install Node.js 18 or newer.
2. In `KIDS-EDUVERSE-Backend`, run `npm install`.
3. Copy `.env.example` to `.env` and set `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_ORIGIN` for your local Live Server origin.
4. Start the backend with `npm run dev` from the backend folder.
5. Open `KIDS-EDUVERSE-Final/index.html` with VS Code Live Server.

The backend serves the frontend itself in a deployed single-service setup. Locally, Live Server remains supported and the frontend calls `http://localhost:5000/api`.

## Connected features

Parent signup and login use the backend. The app stores its local progress in the browser and syncs a learning summary and badges to MongoDB while signed in. See `CONNECTED-BACKEND-SETUP.md` for deployment steps and current sync limits.

The Rhyme Room contains 15 sing-along rhymes: 8 English and 7 Bangla.
