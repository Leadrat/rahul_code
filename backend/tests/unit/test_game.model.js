const mongoose = require('mongoose');
const Game = require('../../src/models/game.model');

describe('Game model validation', () => {
  it('validates a correct game instance', () => {
    const g = new Game({ players: ['X','O'], moves: [{ player: 'X', index: 0 }] });
    const err = g.validateSync();
    expect(err).toBeUndefined();
  });

  it('requires move.index to be between 0 and 8', () => {
    const g = new Game({ players: ['X','O'], moves: [{ player: 'X', index: 9 }] });
    const err = g.validateSync();
    expect(err).toBeDefined();
    // Ensure the error references the moves.0.index path
    expect(err.errors).toBeDefined();
    const hasIndexError = Object.keys(err.errors).some((k) => k.includes('index'));
    expect(hasIndexError).toBe(true);
  });
});
