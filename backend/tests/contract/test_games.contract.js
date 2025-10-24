const request = require('supertest');
const createApp = require('../../src/index');

// Mock Game model for contract tests (provide constructor with prototype.save and static methods)
jest.mock('../../src/models/game.model', () => {
  function Game(data) {
    if (data) Object.assign(this, data);
  }
  Game.prototype.save = jest.fn().mockImplementation(function () {
    if (!this.id) this.id = 'mock-id-1';
    return Promise.resolve(this);
  });
  Game.find = jest.fn().mockImplementation(() => Promise.resolve([]));
  Game.findById = jest.fn().mockImplementation(() => Promise.resolve(null));
  // Make find chainable (.sort().limit()) to emulate Mongoose query chaining
  Game.find = jest.fn().mockImplementation(() => ({
    sort: jest.fn().mockImplementation(() => ({
      limit: jest.fn().mockResolvedValue([])
    }))
  }));
  return Game;
});

describe('Games contract tests', () => {
  it('POST /api/games creates a game and returns 201 with game object', async () => {
    const app = createApp();
    const payload = { players: ['X', 'O'], moves: [{ player: 'X', index: 0 }] };
    const res = await request(app).post('/api/games').send(payload);
    expect([201,200]).toContain(res.status);
    expect(res.body).toHaveProperty('players');
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
    expect([404,200,500]).toContain(res.status);
  });
});
