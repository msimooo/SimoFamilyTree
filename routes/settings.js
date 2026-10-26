const express = require('express');
const { db, isPublicTreeEnabled } = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/public', (req, res) => {
  res.json({ enabled: isPublicTreeEnabled() });
});

router.put('/public', requireAdmin, (req, res) => {
  const { enabled } = req.body || {};
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'Public access must be enabled or disabled' });
  }

  db.prepare("UPDATE settings SET value = ? WHERE key = 'public_tree_enabled'").run(enabled ? '1' : '0');
  res.json({ enabled });
});

module.exports = router;
