require('dotenv').config();  // <── lets async errors bubble to the handler

const express = require('express');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET is missing in .env');

const PORT = process.env.PORT || 8080;
const app  = express();
app.use(express.json());

const users = [];   // dev-only, in-memory

// ─────────────────────────────────────────────────────────
// GET /
app.get('/', (_req, res) => {
  res.send('API is working!');
});

// ─────────────────────────────────────────────────────────
// POST /signup
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: 'Username or password is required' });

  if (users.some(u => u.username === username))
    return res.status(409).json({ error: 'Username already exists' });

  // bcrypt.hash may reject → global error handler will return 500
  const hashed = await bcrypt.hash(password, 10);
  users.push({ username, password: hashed });

  res.status(201).json({ message: 'Signup successful' });
});

// ─────────────────────────────────────────────────────────
// POST /login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username);
  if (!user) return res.status(400).json({ error: 'Wrong credentials' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ error: 'Wrong credentials' });

  // jwt.sign can throw → global error handler will return 500
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ token });
});

// ─────────────────────────────────────────────────────────
// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
