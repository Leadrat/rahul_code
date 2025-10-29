const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'missing token' });
  const token = auth.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // attach full payload for downstream handlers to inspect (supports admin tokens)
    req.jwtPayload = payload;
    // attach user id when present
    if (payload && payload.sub) req.userId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'invalid token' });
  }
}

module.exports = authMiddleware;
