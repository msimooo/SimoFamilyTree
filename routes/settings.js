const express = require('express');
const { db, isPublicTreeEnabled } = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/public', async (req, res) => {
  res.json({ enabled: await isPublicTreeEnabled() });
});

router.put('/public', requireAdmin, async (req, res) => {
  const { enabled } = req.body || {};
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'Public access must be enabled or disabled' });
  }

  await db.query("UPDATE settings SET value = $1 WHERE key = 'public_tree_enabled'", [enabled ? '1' : '0']);
  res.json({ enabled });
});

module.exports = router;
