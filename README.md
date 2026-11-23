<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f2027,50:203a43,100:2c5364&height=180&section=header&text=Quirky%20Quest&fontSize=48&fontColor=ffffff&fontAlignY=38&desc=Full-stack%20MERN%20gaming%20platform%20with%20live%20leaderboards&descAlignY=60&descSize=16" width="100%"/>

<div align="center">

<img src="https://skillicons.dev/icons?i=mongodb,express,react,nodejs,vite,tailwind&theme=dark" />
<br/><br/>
<img src="https://img.shields.io/badge/Auth-JWT%20%2B%20rotating%20refresh%20tokens-00E5FF?style=flat-square" />
<img src="https://img.shields.io/badge/Real--time-Socket.IO-black?style=flat-square" />
<img src="https://img.shields.io/badge/Tests-Jest%20%2B%20Supertest-C21325?style=flat-square" />

</div>

---

## 🎮 ᴏᴠᴇʀᴠɪᴇᴡ

Quirky Quest is a browser gaming platform. Players register, play games, and see their scores climb the leaderboards in real time. The backend handles auth, score submission and leaderboard queries; the React frontend subscribes to live leaderboard updates over Socket.IO.

```diff
+ Playable now: Rock Paper Scissors, wired end to end to scores and live leaderboards
! In progress: Quick Math Quiz, Memory Match, Whack-a-Mole, Tic-Tac-Toe, Simon Says
!   (each plugs into the shared GameShell component and the game registry)
```

---

## ⚙️ ꜰᴇᴀᴛᴜʀᴇꜱ

### 🔐 Auth
- Short-lived JWT access token kept in memory on the client
- Long-lived refresh token in an httpOnly `SameSite=Lax` cookie, **rotated on every refresh**
- bcrypt password hashing (cost 12), Zod request validation, rate limiting on auth routes
- `requireAuth` / `optionalAuth` middleware and a centralized error handler

### 🏆 Scores and leaderboards
- `POST /api/scores`: authenticated, rate-limited and validated; updates player stats and returns the score's rank
- Per-game leaderboards: paginated, lean queries with a single populate (no N+1)
- Overall leaderboard computed in a MongoDB aggregation pipeline (best score per user per game, summed and ranked)
- Compound indexes on `{game, score}` and `{userId, game, score}` so leaderboard reads are index scans
- In-memory TTL cache for leaderboard reads, invalidated on new scores, with a Redis-shaped interface

### ⚡ Real-time
- Clients join a Socket.IO room per leaderboard (`leaderboard:subscribe`)
- The server pushes `leaderboard:update` whenever a new score enters that board's top 10

### 🧪 Testing
- Jest + Supertest suites for register, login, refresh, protected routes, validation, health, score submission and leaderboard ordering

---

## 🏗️ ᴀʀᴄʜɪᴛᴇᴄᴛᴜʀᴇ

```text
React (Vite) client ──REST──►  Express API ──► MongoDB (Mongoose)
        ▲                          │
        └──── Socket.IO ◄──────────┘  leaderboard:update pushes
```

| Endpoint | What it does |
|:--|:--|
| `POST /api/auth/register` · `login` · `refresh` · `logout` | Account and session management |
| `GET /api/users/me` · `PUT /api/users/me` | Profile and stats |
| `GET /api/games` | Game catalogue |
| `POST /api/scores` | Submit a score |
| `GET /api/scores/leaderboard/:game` · `/overall` | Leaderboards |
| `GET /api/health` | Uptime and DB connection state |

---

## 🚀 ʀᴜɴ ɪᴛ ʟᴏᴄᴀʟʟʏ

Run the backend and frontend in two terminals.

```bash
# Terminal 1: backend (http://localhost:5000)
cd server
cp .env.example .env          # set MONGO_URI and the two token secrets
npm install
node scripts/seedGames.js     # optional: populates the game menu
npm run dev

# Terminal 2: frontend (http://localhost:5173)
cd client
cp .env.example .env
npm install
npm run dev

# Tests
cd server && npm test
```

---

<details>
<summary><b>📚 Deep dive: interview notes (click to expand)</b></summary>

### 1. Elevator pitch (30 seconds)
Quirky Quest is a MERN gaming platform built around a production-style backend: secure JWT auth with refresh-token rotation, score submission, leaderboards computed efficiently inside MongoDB, and **live leaderboard pushes over Socket.IO**. Rock Paper Scissors is playable end to end. The other five games plug into a shared `GameShell` component and a game registry, so adding one is just a new component.

### 2. Architecture and request flow
```text
React (Vite) ──axios (access token in memory)──► Express ──► MongoDB
     │  refresh cookie (httpOnly, path /api/auth) ──┘             ▲
     └── socket.io-client: leaderboard:subscribe ◄── leaderboard:update
```
**Submitting a score:**
1. The client posts `POST /api/scores` with the access token.
2. `requireAuth` → rate limiter → Zod validation.
3. The score is saved, the player's `gamesPlayed` and playtime stats are updated, and the rank is computed with a `countDocuments` on the compound index.
4. The leaderboard cache is invalidated.
5. If the score made the **top 10**, the server emits `leaderboard:update` to that game's room and to the overall room.
6. Every client viewing that board re-renders instantly; nobody polls.

**Auth flow:** login returns a short-lived **access token** (kept in memory, never in localStorage) and sets a long-lived **refresh token** as an `httpOnly`, `SameSite=Lax` cookie scoped to `/api/auth`. When an API call returns `401 TOKEN_EXPIRED`, an axios interceptor calls `/refresh` **once**, even if several requests failed together (the refresh promise is shared), then retries them. Each refresh issues a new refresh token (rotation).

### 3. Key design decisions and trade-offs
| Decision | Why | Trade-off |
|:--|:--|:--|
| Access token in memory + refresh token in an httpOnly cookie | JavaScript can't read the cookie (XSS-safe); the cookie path limits where it's sent | Needs the refresh dance on page reload |
| Compound indexes `{game, score}`, `{userId, game, score}` | Leaderboard reads become index scans, not collection scans | Slightly slower writes |
| Overall leaderboard as an aggregation pipeline | Best score per user per game, summed and ranked **inside the DB**, not in Node memory | More complex query |
| Single `populate` + `.lean()` + projection | Avoids N+1 queries and Mongoose document overhead | None |
| TTL cache invalidated on new scores | Cuts DB reads for hot leaderboards | In-memory, so per instance (interface is Redis-shaped to swap later) |
| Socket.IO **rooms per leaderboard**, push only on top-10 changes | Only interested clients get messages, and only when something visible changed | Clients must subscribe and unsubscribe correctly |
| Zod validation + centralized error handler | One consistent JSON error shape; bad input never reaches the DB | None |

### 4. Where the important code lives
- `server/controllers/authController.js` · `utils/tokens.js` · `middleware/auth.js`: auth and rotation
- `server/controllers/scoreController.js`: submission, rank, leaderboards, cache, top-10 broadcast
- `server/sockets/index.js`: rooms and `leaderboard:update`
- `server/models/Score.js`: compound indexes
- `server/utils/cache.js`: TTL cache
- `client/src/api/axios.js`: interceptor with a single shared refresh
- `client/src/hooks/useLeaderboardSocket.js` · `client/src/components/GameShell.jsx` · `client/src/games/index.js`
- `server/__tests__/`: Jest + Supertest (auth, scores, leaderboard ordering, aggregation)

### 5. Limitations and what I'd do next
- Build the remaining 5 games on `GameShell`.
- **Refresh-token reuse detection:** today an old refresh token stays valid until it expires, and logout only clears the cookie. Fix: store a token family or `jti`, bump `tokenVersion` on logout and on reuse.
- Replace the in-memory cache with Redis and add the Socket.IO Redis adapter, so it works across multiple server instances.
- Server-side score validation (anti-cheat): today the client reports the score.
- Docker, CI/CD and cloud deployment.

### 6. Likely interview questions
- **Why not store the JWT in localStorage?** Any XSS can read localStorage. The refresh token is in an httpOnly cookie, and the short-lived access token is only in memory.
- **What is refresh-token rotation, and what's missing here?** A new refresh token on every use, which narrows the replay window. Missing: invalidating the old one and detecting reuse.
- **How does the overall leaderboard work?** An aggregation pipeline: group by user and game taking the max score, then group by user summing, then sort and paginate, all in MongoDB.
- **Why rooms in Socket.IO?** So a score in game A doesn't push messages to people watching game B.
- **How would you scale to many servers?** A Redis cache, the Socket.IO Redis adapter (so emits reach clients on other nodes), and stateless JWT auth (already the case).
- **How do you avoid 10 refresh calls when 10 requests expire together?** The interceptor shares a single in-flight refresh promise.

</details>

---

<div align="center">

**Navyashree J** · BTech CSE (AI/ML), PES University

<a href="https://github.com/Navyashree04"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" /></a>
<a href="https://linkedin.com/in/navyashreej1"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" /></a>

</div>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:2c5364,50:203a43,100:0f2027&height=100&section=footer" width="100%"/>
