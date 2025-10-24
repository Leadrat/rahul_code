const request = require('supertest');
const createApp = require('../../src/index');

// Mock the Game model to avoid requiring a real DB during contract tests
jest.mock('../../src/models/game.model', () => ({
  countDocuments: (query) => {
    // return sample numbers based on query
    if (!query || Object.keys(query).length === 0) return Promise.resolve(10);
    if (query.result === 'X') return Promise.resolve(6);
    if (query.result === 'O') return Promise.resolve(3);
    if (query.result === 'draw') return Promise.resolve(1);
    return Promise.resolve(0);
  }
}));

describe('GET /api/games/stats - contract', () => {
  it('returns 200 and a stats object with totalGames', async () => {
    const app = createApp();
    const res = await request(app).get('/api/games/stats');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalGames');
    expect(res.body.totalGames).toBeGreaterThanOrEqual(0);
    expect(res.body).toHaveProperty('wins');
    expect(res.body).toHaveProperty('draws');
  });
});
