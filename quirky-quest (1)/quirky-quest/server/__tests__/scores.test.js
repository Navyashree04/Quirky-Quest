const request = require('supertest');
const createApp = require('../app');

const app = createApp();

async function registerAndLogin(email) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Player One', email, password: 'supersecret123' });
  return res.body.accessToken;
}

describe('Score submission and leaderboards', () => {
  test('rejects score submission without auth', async () => {
    const res = await request(app)
      .post('/api/scores')
      .send({ game: 'rock-paper-scissors', score: 10 });
    expect(res.status).toBe(401);
  });

  test('rejects an invalid game slug', async () => {
    const token = await registerAndLogin('p1@example.com');
    const res = await request(app)
      .post('/api/scores')
      .set('Authorization', `Bearer ${token}`)
      .send({ game: 'not-a-real-game', score: 10 });
    expect(res.status).toBe(400);
  });

  test('rejects a negative score', async () => {
    const token = await registerAndLogin('p2@example.com');
    const res = await request(app)
      .post('/api/scores')
      .set('Authorization', `Bearer ${token}`)
      .send({ game: 'rock-paper-scissors', score: -5 });
    expect(res.status).toBe(400);
  });

  test('submits a valid score and returns computed rank', async () => {
    const token = await registerAndLogin('p3@example.com');
    const res = await request(app)
      .post('/api/scores')
      .set('Authorization', `Bearer ${token}`)
      .send({ game: 'quick-math-quiz', score: 42, durationSeconds: 30 });

    expect(res.status).toBe(201);
    expect(res.body.score.score).toBe(42);
    expect(res.body.rank).toBe(1); // first score for this game
  });

  test('leaderboard reflects submitted scores in descending order', async () => {
    const tokenA = await registerAndLogin('a@example.com');
    const tokenB = await registerAndLogin('b@example.com');

    await request(app)
      .post('/api/scores')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ game: 'whack-a-mole', score: 50 });

    await request(app)
      .post('/api/scores')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ game: 'whack-a-mole', score: 90 });

    const res = await request(app).get('/api/scores/leaderboard/whack-a-mole');
    expect(res.status).toBe(200);
    expect(res.body.entries[0].score).toBe(90);
    expect(res.body.entries[1].score).toBe(50);
  });

  test('overall leaderboard sums each user\'s best score per game', async () => {
    const token = await registerAndLogin('c@example.com');

    await request(app)
      .post('/api/scores')
      .set('Authorization', `Bearer ${token}`)
      .send({ game: 'tic-tac-toe', score: 10 });
    await request(app)
      .post('/api/scores')
      .set('Authorization', `Bearer ${token}`)
      .send({ game: 'simon-says', score: 20 });

    const res = await request(app).get('/api/scores/leaderboard/overall');
    expect(res.status).toBe(200);
    const entry = res.body.entries.find((e) => e.gamesPlayed === 2);
    expect(entry).toBeDefined();
    expect(entry.totalScore).toBe(30);
  });

  test('games list endpoint returns metadata when seeded', async () => {
    const res = await request(app).get('/api/games');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.games)).toBe(true);
  });
});
