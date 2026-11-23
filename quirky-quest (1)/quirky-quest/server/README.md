# Quirky Quest — Backend

Express + MongoDB API for the Quirky Quest gaming platform. Milestones 1 & 2 done: **auth flow** + **score submission / real-time leaderboards**. React client and the 6 games come next.

## What's implemented

**Auth (milestone 1)**
- Express app with CORS, JSON body parsing, cookie parsing, request logging (morgan → winston)
- MongoDB connection via Mongoose
- JWT auth: short-lived access token (returned in the response body, meant to live in memory on the client) + long-lived refresh token (httpOnly, `SameSite=Lax` cookie, scoped to `/api/auth`, rotated on every refresh)
- bcrypt password hashing (cost factor 12)
- Zod request validation
- `requireAuth` / `optionalAuth` middleware for protecting routes
- express-rate-limit on auth endpoints
- Centralized error handler (`ApiError`, Mongoose validation errors, duplicate-key errors all normalized to consistent JSON)
- `/api/health` endpoint reporting uptime + DB connection state

**Scores, leaderboards & real-time (milestone 2)**
- `User` and `Score` models, with compound indexes `{game, score}` and `{userId, game, score}` on `Score` so leaderboard reads are index-scans, not collection scans
- `GameMeta` model + seed script (`scripts/seedGames.js`) for the 6 games
- `POST /api/scores` — auth required, rate-limited, validated with Zod; updates the user's `gamesPlayed`/`totalPlaytimeSeconds` stats; computes rank via a cheap `countDocuments` against the compound index
- `GET /api/scores/leaderboard/:game` — paginated, `.lean()`, projected fields, single populate query (not N+1)
- `GET /api/scores/leaderboard/overall` — aggregation pipeline: best score per user per game, summed, ranked — computed in the DB, not in app memory
- In-memory TTL cache (`utils/cache.js`) for leaderboard reads, invalidated on new submissions; interface is intentionally Redis-shaped so swapping in `ioredis` for a multi-instance prod deployment is a small diff
- Socket.IO server (`sockets/`): clients `leaderboard:subscribe` to a game (or `'overall'`), and get a `leaderboard:update` push whenever a new score cracks the top 10 for that board — verified with a real client/server round-trip test, not just unit-level
- Jest + Supertest test suites covering register/login/refresh/protected-route/validation/health **and** score submission/validation/leaderboard ordering/overall aggregation

## Setup

```bash
cd server
npm install
cp .env.example .env   # then fill in real secrets + a real MONGO_URI
npm run dev             # nodemon, requires a reachable MongoDB (local or Atlas)
```

Generate strong secrets for `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET`, e.g.:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Running tests

```bash
npm test
```

The test suite uses `mongodb-memory-server`, which downloads a MongoDB binary on first run. **This requires outbound internet access** — if you're running in a network-restricted sandbox (like the one this scaffold was built in), the download will hang/fail. It works normally in a standard dev machine or CI runner. As a sanity check without a live DB, the validation, JWT-guard, error-handling, health-check, and token/bcrypt logic were smoke-tested directly and confirmed working — see the commit history / build notes if you want the exact commands.

## Seeding game metadata

```bash
node scripts/seedGames.js   # requires a reachable MONGO_URI, safe to re-run (upsert)
```

## API surface so far

```
GET    /api/health
POST   /api/auth/register              { name, email, password }
POST   /api/auth/login                 { email, password }
POST   /api/auth/refresh               (reads httpOnly cookie, rotates it, returns new accessToken)
POST   /api/auth/logout                (clears the refresh cookie)
GET    /api/users/me                   (Bearer token required)
PUT    /api/users/me                   { name?, avatar? }  (Bearer token required)
GET    /api/games                      list of game metadata
POST   /api/scores                     { game, score, durationSeconds? }  (Bearer token required)
GET    /api/scores/leaderboard/:game   ?limit=10&page=1
GET    /api/scores/leaderboard/overall ?limit=10&page=1
```

## Real-time leaderboard events (Socket.IO)

Client → server:
- `leaderboard:subscribe` (payload: game slug, or `'overall'`)
- `leaderboard:unsubscribe` (same payload)

Server → client:
- `leaderboard:update` — `{ game, leaderboard }`, pushed to subscribers whenever a new score lands in that board's top 10

## Auth flow on the client (for when we build the frontend)

1. On register/login, store `accessToken` in memory (e.g. React context) — **not** localStorage, to reduce XSS token-theft risk.
2. Attach `Authorization: Bearer <accessToken>` to API calls.
3. Send requests with `credentials: 'include'` so the refresh cookie travels automatically.
4. On a 401 with `code: "TOKEN_EXPIRED"`, call `POST /api/auth/refresh` once, retry the original request with the new token.
5. On logout, call `POST /api/auth/logout` to clear the server-side cookie.

## Next steps

1. Wire up the React client (Vite) starting with the auth pages, then Rock Paper Scissors end-to-end (client → API → leaderboard, including the socket subscription) as the template for the other five games.
2. Dockerfile + GitHub Actions CI (lint/test on push).
3. Swap the in-memory leaderboard cache for Redis once there's a real multi-instance deployment target.
