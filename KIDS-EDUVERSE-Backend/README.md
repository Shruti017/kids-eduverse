# KIDS EDUVERSE Backend

Express and MongoDB API for parent accounts, child profiles, learning progress, results, XP, and badges.

## Local development

1. Install Node.js 18 or newer.
2. Run `npm install` in this folder.
3. Copy `.env.example` to `.env` and set `MONGODB_URI`, a random `JWT_SECRET` of at least 32 characters, and `CLIENT_ORIGIN` to the local Live Server origins.
4. Run `npm run dev`.
5. Visit `http://localhost:5000/health` to check the API. The website is served at `http://localhost:5000/` if you want to test the combined deployment layout.

## Deployment

Deploy the repository root as one Node service so the backend can serve `KIDS-EDUVERSE-Final` on the same HTTPS origin as the API.

- Build/install command: `npm install --prefix KIDS-EDUVERSE-Backend`
- Start command: `npm start --prefix KIDS-EDUVERSE-Backend`
- Configure host environment variables: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, and `NODE_ENV=production`. The hosting service should provide `PORT`.
- Set `CLIENT_ORIGIN` to the deployed HTTPS site origin. Never upload `.env`; enter values in the hosting service's secret/environment settings.
- Configure Atlas network access for the backend host's outbound IP addresses.
- Use HTTPS and review privacy, consent, and data-retention requirements before a public launch for children.

The frontend defaults to the same-origin `/api` route outside localhost. `window.EDUVERSE_API_BASE` can override this when needed. Local development on localhost or 127.0.0.1 continues to use `http://localhost:5000/api`.

## API routes

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `POST /api/children`, `GET /api/children`, `DELETE /api/children/:childId`
- `GET /api/progress/:childId`, `POST /api/progress/:childId`
- `GET /api/results/:childId`, `POST /api/results/:childId`
- `GET /api/rewards/:childId`, `POST /api/rewards/:childId/badges`
- `GET /health`
