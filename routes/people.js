const express = require('express');
const multer = require('multer');
const { db, isPublicTreeEnabled } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PHOTO_SIZE },
  fileFilter: (req, file, cb) => {
    if (MIME_TYPES.has(file.mimetype)) cb(null, true);
    else cb(new Error('Only PNG, JPG, WEBP, or GIF image files are allowed'));
  },
});

function personSelect(includeAuditFields, where = '') {
  const auditFields = includeAuditFields ? ', created_by, created_at, updated_at' : '';
  return `SELECT id, first_name, gender, father_id,
                 CASE WHEN photo_data IS NOT NULL THEN '/api/people/' || id || '/photo' END AS photo_path
                 ${auditFields}
          FROM people ${where} ORDER BY id ASC`;
}

function parsePhotoData(photoData) {
  if (photoData == null) return null;
  if (typeof photoData !== 'string') throw new Error('Backup contains invalid photo data');
  const match = /^data:(image\/(?:png|jpe?g|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/i.exec(photoData);
  if (!match) throw new Error('Backup contains invalid photo data');
  const data = Buffer.from(match[2], 'base64');
  if (!data.length || data.length > MAX_PHOTO_SIZE) {
    throw new Error('Backup photos must be no larger than 5 MB');
  }
  const mimeType = match[1].toLowerCase().replace('image/jpg', 'image/jpeg');
  return { data, mimeType };
}

function parseId(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

router.get('/', async (req, res) => {
  const authenticated = req.session && req.session.user;
  if (!authenticated && !(await isPublicTreeEnabled())) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { rows } = await db.query(personSelect(Boolean(authenticated)));
  res.json({ people: rows });
});

router.get('/:id/photo', async (req, res) => {
  const authenticated = req.session && req.session.user;
  if (!authenticated && !(await isPublicTreeEnabled())) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const id = parseId(req.params.id);
  if (!id) return res.sendStatus(404);
  const { rows } = await db.query(
    'SELECT photo_data, photo_mime FROM people WHERE id = $1',
    [id]
  );
  if (!rows[0] || !rows[0].photo_data) return res.sendStatus(404);

  res.set({
    'Content-Type': rows[0].photo_mime,
    'Content-Length': rows[0].photo_data.length,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(rows[0].photo_data);
});

router.use(requireAuth);

router.get('/export', async (req, res) => {
  const { rows } = await db.query(
    'SELECT id, first_name, gender, father_id, photo_data, photo_mime FROM people ORDER BY id ASC'
  );

  const people = rows.map((person) => ({
    id: person.id,
    first_name: person.first_name,
    gender: person.gender,
    father_id: person.father_id,
    photo_data: person.photo_data
      ? `data:${person.photo_mime};base64,${person.photo_data.toString('base64')}`
      : null,
  }));

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

router.post('/import', requireAdmin, async (req, res) => {
  const body = req.body || {};
  if (body.format !== 'rootline-family-tree-backup' || !Array.isArray(body.people)) {
    return res.status(400).json({ error: 'This file is not a valid Rootline backup' });
  }
  const incomingIds = new Set();
  const parentById = new Map();
  for (const person of body.people) {
    const id = person && parseId(person.id);
    const fatherId = person && person.father_id != null ? parseId(person.father_id) : null;
    if (
      !person ||
      !id ||
      incomingIds.has(id) ||
      typeof person.first_name !== 'string' ||
      !person.first_name.trim() ||
      !['male', 'female'].includes(person.gender) ||
      (person.father_id != null && !fatherId)
    ) {
      return res.status(400).json({ error: 'Backup file contains invalid person records' });
    }
    incomingIds.add(id);
    parentById.set(id, fatherId);
  }
  try {
    for (const person of body.people) parsePhotoData(person.photo_data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
  for (const person of body.people) {
    const id = parseId(person.id);
    const fatherId = parentById.get(id);
    if (fatherId != null && !incomingIds.has(fatherId)) {
      return res.status(400).json({ error: 'Backup contains a missing parent reference' });
    }
    if (fatherId === id) {
      return res.status(400).json({ error: 'A person cannot be their own parent' });
    }
  }
  const completed = new Set();
  for (const id of incomingIds) {
    const path = new Set();
    let currentId = id;
    while (currentId != null && !completed.has(currentId)) {
      if (path.has(currentId)) {
        return res.status(400).json({ error: 'Backup contains a circular family relationship' });
      }
      path.add(currentId);
      currentId = parentById.get(currentId);
    }
    path.forEach((pathId) => completed.add(pathId));
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM people');

    const oldToNew = new Map();
    const now = Date.now();
    for (const person of body.people) {
      const photo = parsePhotoData(person.photo_data);
      const result = await client.query(
        `INSERT INTO people (first_name, gender, photo_data, photo_mime, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $6)
         RETURNING id`,
        [
          person.first_name.trim(),
          person.gender,
          photo ? photo.data : null,
          photo ? photo.mimeType : null,
          req.session.user.id,
          now,
        ]
      );
      oldToNew.set(parseId(person.id), result.rows[0].id);
    }

    for (const person of body.people) {
      const id = parseId(person.id);
      const fatherId = parentById.get(id);
      if (fatherId != null) {
        await client.query(
          'UPDATE people SET father_id = $1 WHERE id = $2',
          [oldToNew.get(fatherId), oldToNew.get(id)]
        );
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Family tree import failed:', err);
    return res.status(500).json({ error: 'Import failed' });
  } finally {
    client.release();
  }

  const { rows } = await db.query(personSelect(true));
  res.json({ ok: true, count: rows.length, people: rows });
});

router.post('/', (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
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

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    let fatherId = null;
    let relativeToRepoint = null;

    if (relation !== 'root') {
      const relativeResult = await client.query(
        'SELECT id, father_id FROM people WHERE id = $1 FOR UPDATE',
        [parseId(relative_id)]
      );
      const relative = relativeResult.rows[0];
      if (!relative) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Relative not found' });
      }
      if (relation === 'son' || relation === 'daughter') fatherId = relative.id;
      if (relation === 'father') {
        if (relative.father_id) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'This person already has a father recorded in the tree' });
        }
        relativeToRepoint = relative.id;
      }
    }

    const now = Date.now();
    const photo = req.file || null;
    const result = await client.query(
      `INSERT INTO people (first_name, gender, father_id, photo_data, photo_mime, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
       RETURNING id`,
      [
        first_name.trim(),
        gender,
        fatherId,
        photo ? photo.buffer : null,
        photo ? photo.mimetype : null,
        req.session.user.id,
        now,
      ]
    );
    const newId = result.rows[0].id;

    if (relativeToRepoint) {
      await client.query(
        'UPDATE people SET father_id = $1, updated_at = $2 WHERE id = $3',
        [newId, now, relativeToRepoint]
      );
    }

    await client.query('COMMIT');
    const created = await db.query(personSelect(true, 'WHERE id = $1'), [newId]);
    res.status(201).json({ person: created.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

router.put('/:id', (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(404).json({ error: 'Person not found' });
  const { rows } = await db.query('SELECT first_name, gender FROM people WHERE id = $1', [id]);
  const person = rows[0];
  if (!person) return res.status(404).json({ error: 'Person not found' });

  const { first_name, gender } = req.body || {};
  const photo = req.file || null;
  await db.query(
    `UPDATE people
     SET first_name = $1, gender = $2,
         photo_data = CASE WHEN $3::boolean THEN $4::bytea ELSE photo_data END,
         photo_mime = CASE WHEN $3::boolean THEN $5::text ELSE photo_mime END,
         updated_at = $6
     WHERE id = $7`,
    [
      first_name && first_name.trim() ? first_name.trim() : person.first_name,
      ['male', 'female'].includes(gender) ? gender : person.gender,
      Boolean(photo),
      photo ? photo.buffer : null,
      photo ? photo.mimetype : null,
      Date.now(),
      id,
    ]
  );

  const updated = await db.query(personSelect(true, 'WHERE id = $1'), [id]);
  res.json({ person: updated.rows[0] });
});

router.delete('/:id/photo', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(404).json({ error: 'Person not found' });
  const result = await db.query(
    'UPDATE people SET photo_data = NULL, photo_mime = NULL, updated_at = $1 WHERE id = $2',
    [Date.now(), id]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: 'Person not found' });
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(404).json({ error: 'Person not found' });
  const { rows } = await db.query('SELECT id, first_name FROM people WHERE id = $1', [id]);
  const person = rows[0];
  if (!person) return res.status(404).json({ error: 'Person not found' });

  const children = await db.query('SELECT COUNT(*) AS count FROM people WHERE father_id = $1', [id]);
  const childCount = Number(children.rows[0].count);
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
    const descendants = await db.query(
      `WITH RECURSIVE descendants(id) AS (
         SELECT id FROM people WHERE id = $1
         UNION
         SELECT person.id FROM people person JOIN descendants d ON person.father_id = d.id
       )
       SELECT id FROM descendants`,
      [id]
    );
    idsToDelete = descendants.rows.map((row) => row.id);
  }

  await db.query('DELETE FROM people WHERE id = ANY($1::bigint[])', [idsToDelete]);
  res.json({ ok: true, deleted: idsToDelete });
});

module.exports = router;
