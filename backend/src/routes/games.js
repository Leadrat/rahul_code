const express = require('express');
const Game = require('../models/game.model');
const router = express.Router();

// Create a new game
router.post('/', async (req, res) => {
  try {
    const payload = req.body || {};
    const game = new Game(payload);
    await game.save();
    res.status(201).json(game);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List games
router.get('/', async (req, res) => {
  try {
    const games = await Game.find().sort({ createdAt: -1 }).limit(100);
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Aggregated statistics (wins, draws, totals)
router.get('/stats', async (_req, res) => {
  try {
    const totalGames = await Game.countDocuments();
    const winsX = await Game.countDocuments({ result: 'X' });
    const winsO = await Game.countDocuments({ result: 'O' });
    const draws = await Game.countDocuments({ result: 'draw' });

    // per-player wins (simple aggregation: counts where result equals player id)
    const wins = { X: winsX, O: winsO };

    res.json({ totalGames, wins, draws, perPlayer: wins });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single game
router.get('/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Not found' });
    res.json(game);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
