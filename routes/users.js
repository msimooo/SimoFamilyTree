const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAdmin);

router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT id, username, display_name, role, created_at FROM users ORDER BY created_at ASC')
    .all();
  res.json({ users: rows });
});

router.post('/', (req, res) => {
  const { username, password, display_name, role } = req.body || {};
  if (!username || !username.trim() || !password || !display_name || !display_name.trim()) {
    return res.status(400).json({ error: 'Username, password, and display name are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  if (!['admin', 'assistant'].includes(role)) {
    return res.status(400).json({ error: "Role must be 'admin' or 'assistant'" });
  }
  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim());
  if (exists) return res.status(409).json({ error: 'That username is already taken' });

  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare(
      `INSERT INTO users (username, password_hash, display_name, role, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(username.trim(), hash, display_name.trim(), role, Date.now());

  res.status(201).json({ id: info.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { display_name, role, password } = req.body || {};

  if (role && role !== user.role) {
    if (!['admin', 'assistant'].includes(role)) {
      return res.status(400).json({ error: "Role must be 'admin' or 'assistant'" });
    }
    if (user.role === 'admin' && role !== 'admin') {
      const adminCount = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'").get().c;
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot demote the last remaining administrator' });
      }
    }
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
  }

  if (display_name && display_name.trim()) {
    db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(display_name.trim(), id);
  }

  if (password) {
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(password, 10), id);
  }

  // keep the active session in sync if an admin edits their own account
  if (req.session.user.id === id) {
    const fresh = db.prepare('SELECT id, username, display_name, role FROM users WHERE id = ?').get(id);
    req.session.user = fresh;
  }

  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (req.session.user.id === id) {
    return res.status(400).json({ error: "You can't delete your own account while logged in" });
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.role === 'admin') {
    const adminCount = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'").get().c;
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last remaining administrator' });
    }
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ ok: true });
});

module.exports = router;
