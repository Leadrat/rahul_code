const { Schema, model } = require('mongoose');

const MoveSchema = new Schema({
  player: { type: String, required: true },
  index: { type: Number, required: true, min: 0, max: 8 },
  commentary: { type: String },
  createdAt: { type: Date, default: () => new Date() }
});

const GameSchema = new Schema({
  players: { type: [String], default: [] },
  moves: { type: [MoveSchema], default: [] },
  result: { type: String, enum: ['X', 'O', 'draw', 'in-progress'], default: 'in-progress' },
  createdAt: { type: Date, default: () => new Date() }
});

module.exports = model('Game', GameSchema);
