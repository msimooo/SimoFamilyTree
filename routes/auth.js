const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  const { rows } = await db.query('SELECT * FROM users WHERE username = $1', [username.trim()]);
  const user = rows[0];
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  req.session.user = {
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    role: user.role,
  };
  res.json({ user: req.session.user });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('familytree.sid');
    res.json({ ok: true });
  });
});

router.get('/me', (req, res) => {
  res.json({ user: (req.session && req.session.user) || null });
});

router.put('/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }
  const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [req.session.user.id]);
  const user = rows[0];
  if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, user.id]);
  res.json({ ok: true });
});

module.exports = router;
