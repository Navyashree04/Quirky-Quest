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

The source code is in [`quirky-quest.zip`](quirky-quest.zip). Unzip it, then run the backend and frontend in two terminals.

```bash
# Terminal 1: backend (http://localhost:5000)
cd quirky-quest/server
cp .env.example .env          # set MONGO_URI and the two token secrets
npm install
node scripts/seedGames.js     # optional: populates the game menu
npm run dev

# Terminal 2: frontend (http://localhost:5173)
cd quirky-quest/client
cp .env.example .env
npm install
npm run dev

# Tests
cd quirky-quest/server && npm test
```

---

<div align="center">

**Navyashree J** · BTech CSE (AI/ML), PES University

<a href="https://github.com/Navyashree04"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" /></a>
<a href="https://linkedin.com/in/navyashreej1"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" /></a>

</div>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:2c5364,50:203a43,100:0f2027&height=100&section=footer" width="100%"/>
