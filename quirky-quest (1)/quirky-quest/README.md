# Quirky Quest

A full-stack MERN gaming platform: 6 browser games, user accounts, and real-time leaderboards.

```
quirky-quest/
├── client/   React (Vite) frontend — see client/README.md is folded into this file below
└── server/   Express + MongoDB backend — see server/README.md for full API docs
```

## Quick start (both halves, local dev)

You need two terminals open at once — the backend and frontend run as separate processes.

**Terminal 1 — backend**
```bash
cd server
cp .env.example .env      # fill in MONGO_URI + generate ACCESS/REFRESH_TOKEN_SECRET
npm install
node scripts/seedGames.js # optional — populates the game menu with titles/descriptions
npm run dev                # http://localhost:5000
```

**Terminal 2 — frontend**
```bash
cd client
cp .env.example .env      # defaults already point at localhost:5000, only change if needed
npm install
npm run dev                # http://localhost:5173
```

Open `http://localhost:5173` in your browser. Register an account, then play Rock Paper Scissors — your score will hit the leaderboard live.

See `server/README.md` for the full API reference, auth flow details, and deployment notes. See `client/.env.example` for the two env vars the frontend needs (API URL and Socket.IO URL).

## What's built vs. what's next

**Done:**
- Auth (register/login/refresh/logout) end-to-end, frontend and backend
- Score submission + per-game and overall leaderboards, with real-time push via Socket.IO
- User profiles (stats, display name editing)
- Rock Paper Scissors, fully playable, wired to the score/leaderboard pipeline
- Shared `GameShell` component so the remaining 5 games can be built quickly following the same pattern

**Not yet built:**
- The other 5 games (Quick Math Quiz, Memory Match, Whack-a-Mole, Tic-Tac-Toe, Simon Says) — the menu shows them as "Coming soon"; each just needs a component added to `client/src/games/` and registered in `client/src/games/index.js`, following `RockPaperScissors.jsx` as the template
- Dockerfile + GitHub Actions CI/CD
- AWS deployment (S3/CloudFront for the frontend, EC2/Elastic Beanstalk + ALB for the backend, MongoDB Atlas for the DB) — see the deployment section of the original project brief for the target architecture
