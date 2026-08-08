const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db, UPLOAD_DIR } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, 'p_' + Date.now() + '_' + Math.round(Math.random() * 1e6) + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only PNG, JPG, WEBP, or GIF image files are allowed'));
  },
});

function removePhotoFile(photoPath) {
  if (!photoPath) return;
  const full = path.join(__dirname, '..', photoPath);
  if (fs.existsSync(full)) {
    try { fs.unlinkSync(full); } catch (e) { /* ignore */ }
  }
}

// ── list everyone (client builds the tree) ──
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM people ORDER BY id ASC').all();
  res.json({ people: rows });
});

// ── export the full tree as one portable, self-contained JSON file (photos embedded as base64) ──
router.get('/export', (req, res) => {
  const rows = db.prepare('SELECT * FROM people ORDER BY id ASC').all();

  const people = rows.map((p) => {
    let photo_data = null;
    if (p.photo_path) {
      try {
        const full = path.join(__dirname, '..', p.photo_path);
        if (fs.existsSync(full)) {
          let ext = path.extname(full).slice(1).toLowerCase() || 'jpg';
          if (ext === 'jpg') ext = 'jpeg';
          const b64 = fs.readFileSync(full).toString('base64');
          photo_data = `data:image/${ext};base64,${b64}`;
        }
      } catch (e) { /* skip an unreadable photo rather than failing the whole export */ }
    }
    return {
      id: p.id,
      first_name: p.first_name,
      gender: p.gender,
      father_id: p.father_id,
      photo_data,
    };
  });

  const payload = {
    format: 'rootline-family-tree-backup',
    version: 1,
    exported_at: new Date().toISOString(),
    people,
  };

  res.setHeader('Content-Disposition', 'attachment; filename="family-tree-backup.json"');
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(payload));
});

// ── import a backup file, replacing the entire current tree (admin only) ──
router.post('/import', requireAdmin, (req, res) => {
  const body = req.body || {};
  if (body.format !== 'rootline-family-tree-backup' || !Array.isArray(body.people)) {
    return res.status(400).json({ error: 'This file is not a valid Rootline backup' });
  }
  const incoming = body.people;
  for (const p of incoming) {
    if (!p || typeof p.first_name !== 'string' || !p.first_name.trim() || !['male', 'female'].includes(p.gender)) {
      return res.status(400).json({ error: 'Backup file contains invalid person records' });
    }
  }

  const existingPhotos = db.prepare('SELECT photo_path FROM people').all();

  const runImport = db.transaction((records) => {
    existingPhotos.forEach((r) => removePhotoFile(r.photo_path));
    db.prepare('DELETE FROM people').run();

    const now = Date.now();
    const oldToNew = new Map();
    const insertStmt = db.prepare(
      `INSERT INTO people (first_name, gender, father_id, photo_path, created_by, created_at, updated_at)
       VALUES (?, ?, NULL, ?, ?, ?, ?)`
    );

    records.forEach((p) => {
      let photoPath = null;
      if (typeof p.photo_data === 'string') {
        const match = p.photo_data.match(/^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/i);
        if (match) {
          const ext = /jpe?g/i.test(match[1]) ? 'jpg' : match[1].toLowerCase();
          const filename = 'p_' + Date.now() + '_' + Math.round(Math.random() * 1e6) + '.' + ext;
          fs.writeFileSync(path.join(UPLOAD_DIR, filename), Buffer.from(match[2], 'base64'));
          photoPath = '/uploads/' + filename;
        }
      }
      const info = insertStmt.run(p.first_name.trim(), p.gender, photoPath, req.session.user.id, now, now);
      oldToNew.set(p.id, info.lastInsertRowid);
    });

    const relinkStmt = db.prepare('UPDATE people SET father_id = ? WHERE id = ?');
    records.forEach((p) => {
      if (p.father_id != null && oldToNew.has(p.father_id) && oldToNew.has(p.id)) {
        relinkStmt.run(oldToNew.get(p.father_id), oldToNew.get(p.id));
      }
    });
  });

  try {
    runImport(incoming);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Import failed: ' + e.message });
  }

  const people = db.prepare('SELECT * FROM people ORDER BY id ASC').all();
  res.json({ ok: true, count: people.length, people });
});

// ── create a person: root ancestor, father, son, or daughter ──
router.post('/', (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, (req, res) => {
  const { first_name, gender, relation, relative_id } = req.body || {};

  if (!first_name || !first_name.trim()) {
    return res.status(400).json({ error: 'First name is required' });
  }
  if (!['male', 'female'].includes(gender)) {
    return res.status(400).json({ error: 'Gender must be male or female' });
  }
  if (!['root', 'father', 'son', 'daughter'].includes(relation)) {
    return res.status(400).json({ error: 'Lineage must be root, father, son, or daughter' });
  }

  let fatherIdForNew = null;
  let relativeToRepoint = null;

  if (relation === 'son' || relation === 'daughter') {
    const relId = Number(relative_id);
    const relative = db.prepare('SELECT * FROM people WHERE id = ?').get(relId);
    if (!relative) return res.status(400).json({ error: 'Relative not found' });
    fatherIdForNew = relId;
  } else if (relation === 'father') {
    const relId = Number(relative_id);
    const relative = db.prepare('SELECT * FROM people WHERE id = ?').get(relId);
    if (!relative) return res.status(400).json({ error: 'Relative not found' });
    if (relative.father_id) {
      return res.status(400).json({ error: 'This person already has a father recorded in the tree' });
    }
    fatherIdForNew = null;
    relativeToRepoint = relId;
  }
  // relation === 'root' → fatherIdForNew stays null, no relative needed

  const now = Date.now();
  const photoPath = req.file ? '/uploads/' + req.file.filename : null;

  const info = db
    .prepare(
      `INSERT INTO people (first_name, gender, father_id, photo_path, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(first_name.trim(), gender, fatherIdForNew, photoPath, req.session.user.id, now, now);

  const newId = info.lastInsertRowid;

  if (relativeToRepoint) {
    db.prepare('UPDATE people SET father_id = ?, updated_at = ? WHERE id = ?').run(newId, now, relativeToRepoint);
  }

  const created = db.prepare('SELECT * FROM people WHERE id = ?').get(newId);
  res.status(201).json({ person: created });
});

// ── edit a person's name / gender / photo ──
router.put('/:id', (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, (req, res) => {
  const id = Number(req.params.id);
  const person = db.prepare('SELECT * FROM people WHERE id = ?').get(id);
  if (!person) return res.status(404).json({ error: 'Person not found' });

  const { first_name, gender } = req.body || {};
  const now = Date.now();

  let photoPath = person.photo_path;
  if (req.file) {
    removePhotoFile(person.photo_path);
    photoPath = '/uploads/' + req.file.filename;
  }

  db.prepare('UPDATE people SET first_name = ?, gender = ?, photo_path = ?, updated_at = ? WHERE id = ?').run(
    first_name && first_name.trim() ? first_name.trim() : person.first_name,
    ['male', 'female'].includes(gender) ? gender : person.gender,
    photoPath,
    now,
    id
  );

  const updated = db.prepare('SELECT * FROM people WHERE id = ?').get(id);
  res.json({ person: updated });
});

// ── remove a person's photo only ──
router.delete('/:id/photo', (req, res) => {
  const id = Number(req.params.id);
  const person = db.prepare('SELECT * FROM people WHERE id = ?').get(id);
  if (!person) return res.status(404).json({ error: 'Person not found' });
  removePhotoFile(person.photo_path);
  db.prepare('UPDATE people SET photo_path = NULL, updated_at = ? WHERE id = ?').run(Date.now(), id);
  res.json({ ok: true });
});

// ── delete a person (optionally cascading to descendants) ──
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const person = db.prepare('SELECT * FROM people WHERE id = ?').get(id);
  if (!person) return res.status(404).json({ error: 'Person not found' });

  const childCount = db.prepare('SELECT COUNT(*) AS c FROM people WHERE father_id = ?').get(id).c;
  const cascade = req.query.cascade === 'true';

  if (childCount > 0 && !cascade) {
    return res.status(409).json({
      error: 'has_children',
      message: `${person.first_name} has ${childCount} direct descendant(s). Delete them first, or confirm a cascade delete of the whole branch.`,
      childCount,
    });
  }

  let idsToDelete = [id];
  if (cascade && childCount > 0) {
    const rows = db
      .prepare(
        `WITH RECURSIVE descendants(id) AS (
           SELECT id FROM people WHERE id = ?
           UNION ALL
           SELECT p.id FROM people p JOIN descendants d ON p.father_id = d.id
         )
         SELECT id FROM descendants`
      )
      .all(id);
    idsToDelete = rows.map((r) => r.id);
  }

  const placeholders = idsToDelete.map(() => '?').join(',');
  const photoRows = db.prepare(`SELECT photo_path FROM people WHERE id IN (${placeholders})`).all(...idsToDelete);
  photoRows.forEach((r) => removePhotoFile(r.photo_path));

  db.prepare(`DELETE FROM people WHERE id IN (${placeholders})`).run(...idsToDelete);

  res.json({ ok: true, deleted: idsToDelete });
});

module.exports = router;
