const request = require('supertest');
const createApp = require('../../src/index');
const mongoHelper = require('../helpers/mongo');

describe('Games contract tests (integration)', () => {
  beforeAll(async () => {
    await mongoHelper.start();
  });

  afterAll(async () => {
    await mongoHelper.stop();
  });

  it('POST /api/games creates a game and returns 201 with game object', async () => {
    const app = createApp();
    const payload = { players: ['X', 'O'], moves: [{ player: 'X', index: 0 }] };
    const res = await request(app).post('/api/games').send(payload);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('players');
    expect(Array.isArray(res.body.moves)).toBe(true);
  });

  it('GET /api/games returns an array of games', async () => {
    const app = createApp();
    const res = await request(app).get('/api/games');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/games/:id returns 404 for unknown id', async () => {
    const app = createApp();
    const res = await request(app).get('/api/games/nonexistent');
    expect(res.status).toBe(404);
  });
});
