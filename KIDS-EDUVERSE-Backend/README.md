# KIDS EDUVERSE Backend

Express and MongoDB API for parent accounts, child profiles, learning progress, results, XP, and badges.

## Local development

1. Install Node.js 20 or newer.
2. Run `npm install` in this folder.
3. Copy `.env.example` to `.env` and set `MONGODB_URI`, a random `JWT_SECRET` of at least 32 characters, and `CLIENT_ORIGIN` to your local Live Server origin.
4. Run `npm run dev`.
5. Open `http://localhost:5000/health` to check the backend. Local static hosting through this server is available at `http://localhost:5000/`.

## Vercel

Vercel uses the repository-root `server.js` as its Express entrypoint. The root build script copies the frontend source into `public/`; Vercel serves `public/` from its static CDN and routes API requests to Express.

Configure the repository root as the Vercel project root, use `npm run build` as the build command, and keep the default Express framework detection. Add these environment variables in Vercel:

- `MONGODB_URI`: MongoDB Atlas application connection string.
- `JWT_SECRET`: a unique production random secret at least 32 characters long.
- `CLIENT_ORIGIN`: the deployed Vercel site origin, for example `https://your-project.vercel.app`.
- `NODE_ENV`: `production`.

Configure Atlas Network Access for the Vercel backend's outbound connections. Do not upload `.env` or put secrets in frontend files. Use HTTPS.

## API routes

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `POST /api/children`, `GET /api/children`, `DELETE /api/children/:childId`
- `GET /api/progress/:childId`, `POST /api/progress/:childId`
- `GET /api/results/:childId`, `POST /api/results/:childId`
- `GET /api/rewards/:childId`, `POST /api/rewards/:childId/badges`
- `GET /health`
