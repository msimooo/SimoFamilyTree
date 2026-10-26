const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAdmin);

router.get('/', async (req, res) => {
  const { rows } = await db.query(
    'SELECT id, username, display_name, role, created_at FROM users ORDER BY created_at ASC'
  );
  res.json({ users: rows });
});

router.post('/', async (req, res) => {
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

  try {
    const { rows } = await db.query(
      `INSERT INTO users (username, password_hash, display_name, role, created_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [username.trim(), bcrypt.hashSync(password, 10), display_name.trim(), role, Date.now()]
    );
    res.status(201).json({ id: rows[0].id });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'That username is already taken' });
    throw err;
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  const user = rows[0];
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { display_name, role, password } = req.body || {};
  if (role && role !== user.role) {
    if (!['admin', 'assistant'].includes(role)) {
      return res.status(400).json({ error: "Role must be 'admin' or 'assistant'" });
    }
    if (user.role === 'admin' && role !== 'admin') {
      const admins = await db.query("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'");
      if (Number(admins.rows[0].count) <= 1) {
        return res.status(400).json({ error: 'Cannot demote the last remaining administrator' });
      }
    }
    await db.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
  }

  if (display_name && display_name.trim()) {
    await db.query('UPDATE users SET display_name = $1 WHERE id = $2', [display_name.trim(), id]);
  }

  if (password) {
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [bcrypt.hashSync(password, 10), id]);
  }

  if (req.session.user.id === id) {
    const fresh = await db.query('SELECT id, username, display_name, role FROM users WHERE id = $1', [id]);
    req.session.user = fresh.rows[0];
  }

  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (req.session.user.id === id) {
    return res.status(400).json({ error: "You can't delete your own account while logged in" });
  }
  const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  const user = rows[0];
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.role === 'admin') {
    const admins = await db.query("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'");
    if (Number(admins.rows[0].count) <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last remaining administrator' });
    }
  }

  await db.query('DELETE FROM users WHERE id = $1', [id]);
  res.json({ ok: true });
});

module.exports = router;
