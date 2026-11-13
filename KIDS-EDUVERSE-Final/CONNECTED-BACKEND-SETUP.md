# KIDS EDUVERSE — Local and Vercel Setup

The frontend supports parent signup/login and syncs a learning summary and badges to the Express + MongoDB backend. Individual lesson events stay in browser storage; cloud progress is not merged across devices yet.

## Run locally

1. Install Node.js 20 or newer.
2. In `KIDS-EDUVERSE-Backend`, run `npm install`.
3. Copy `.env.example` to `.env`. Set the Atlas connection string, a random JWT secret of at least 32 characters, and the Live Server origin in `CLIENT_ORIGIN`.
4. Run `npm run dev` in the backend folder.
5. Open `KIDS-EDUVERSE-Final/index.html` with VS Code Live Server. Do not use a `file://` URL.

The local frontend uses `http://localhost:5000/api`. Add the exact Live Server origin to `CLIENT_ORIGIN` if its host or port differs from the example.

## Deploy to Vercel

The repository root is the Vercel project root. Vercel detects the root Express entrypoint in `server.js`. The `npm run build` command copies the frontend into `public/`; Vercel serves those files statically and sends API requests to Express. The deployed frontend calls `/api` on the same origin.

In Vercel, import this GitHub repository, keep the project root at the repository root, use `npm run build`, and leave Express framework detection enabled. Add environment variables for Production:

- `MONGODB_URI` — Atlas connection string.
- `JWT_SECRET` — a unique, random production secret of at least 32 characters.
- `CLIENT_ORIGIN` — the deployed HTTPS origin, such as `https://your-project.vercel.app`.
- `NODE_ENV` — `production`.

Configure Atlas Network Access for the Vercel function's outbound connections. Keep `.env` and `data/users.json` private; they are excluded from Git. Visit `/health` after deployment to confirm the API is responding.

## Privacy and security

Passwords are hashed and protected routes use JWTs. Before a public launch for children, review the parental-consent, privacy, and data-retention requirements that apply to your audience.
