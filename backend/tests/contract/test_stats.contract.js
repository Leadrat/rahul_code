const request = require('supertest');
const createApp = require('../../src/index');
const mongoHelper = require('../helpers/mongo');

describe('GET /api/games/stats - contract (integration)', () => {
  beforeAll(async () => {
    await mongoHelper.start();
  });

  afterAll(async () => {
    await mongoHelper.stop();
  });

  it('returns 200 and a stats object with totalGames', async () => {
    const app = createApp();
    // create a game so stats are non-zero
    await request(app).post('/api/games').send({ players: ['X','O'], moves: [{ player: 'X', index: 0 }] });
    const res = await request(app).get('/api/games/stats');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalGames');
    expect(res.body.totalGames).toBeGreaterThanOrEqual(1);
    expect(res.body).toHaveProperty('wins');
    expect(res.body).toHaveProperty('draws');
  });
});
