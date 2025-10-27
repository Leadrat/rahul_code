const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const gamesRoutes = require('./routes/games');
const authMiddleware = require('./middleware/auth');
const { init } = require('./db');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send({ ok: true, version: '0.1.0' }));

app.use('/api/auth', authRoutes);
// games routes (protected)
app.use('/api/games', authMiddleware, gamesRoutes);

const PORT = process.env.PORT || 4001;

async function start() {
  try {
    await init();
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Auth server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = app;
