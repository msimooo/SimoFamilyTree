const fs = require('fs');
const path = require('path');
require('dotenv').config();
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { db, createSchema } = require('../db');

const projectDir = path.resolve(__dirname, '..');
const sqlitePath = path.resolve(
  process.argv[2] || path.join(process.env.DATA_DIR || path.join(projectDir, 'data'), 'familytree.db')
);
const uploadDir = path.resolve(process.argv[3] || process.env.UPLOAD_DIR || path.join(projectDir, 'uploads'));
const mimeTypes = {
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

function readPhoto(photoPath) {
  if (!photoPath) return { data: null, mime: null };

  const filename = path.basename(String(photoPath));
  const extension = path.extname(filename).toLowerCase();
  const mime = mimeTypes[extension];
  if (!filename || !mime) {
    throw new Error(`Unsupported photo file reference in the SQLite database: ${photoPath}`);
  }
  const fullPath = path.join(uploadDir, filename);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Photo file is missing: ${fullPath}`);
  }

  return { data: fs.readFileSync(fullPath), mime };
}

function loadSource() {
  if (!fs.existsSync(sqlitePath)) throw new Error(`SQLite database file not found: ${sqlitePath}`);

  const source = new Database(sqlitePath, { readonly: true, fileMustExist: true });
  try {
    const users = source.prepare(
      'SELECT id, username, password_hash, display_name, role, created_at FROM users ORDER BY id'
    ).all();
    const hasSettingsTable = source.prepare(
      "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'settings'"
    ).get();
    const settings = hasSettingsTable
      ? source.prepare('SELECT key, value FROM settings').all()
      : [];
    const people = source.prepare(
      `SELECT id, first_name, gender, father_id, photo_path, created_by, created_at, updated_at
       FROM people ORDER BY id`
    ).all().map((person) => {
      const photo = readPhoto(person.photo_path);
      return { ...person, photo_data: photo.data, photo_mime: photo.mime };
    });

    if (!users.length) throw new Error('The SQLite database has no accounts to migrate.');
    return { users, people, settings };
  } finally {
    source.close();
  }
}

async function ensureEmptyTarget(client) {
  const existing = await client.query(`
    SELECT
      (SELECT COUNT(*) FROM users) AS user_count,
      (SELECT COUNT(*) FROM people) AS people_count
  `);
  const userCount = Number(existing.rows[0].user_count);
  const peopleCount = Number(existing.rows[0].people_count);
  const settings = await client.query('SELECT key, value FROM settings');

  if (peopleCount !== 0) throw new Error('The Neon database already contains people; migration stopped without changing it.');
  if (userCount > 1) throw new Error('The Neon database already contains accounts; migration stopped without changing it.');
  if (userCount === 1) {
    const { rows } = await client.query('SELECT id, username, role, password_hash FROM users');
    const seededAdmin = rows[0];
    if (
      seededAdmin.username !== 'admin' ||
      seededAdmin.role !== 'admin' ||
      !bcrypt.compareSync('admin123', seededAdmin.password_hash)
    ) {
      throw new Error('The Neon database contains a non-default account; migration stopped without changing it.');
    }
  }
  if (
    settings.rows.some((setting) =>
      setting.key !== 'public_tree_enabled' || !['0', '1'].includes(setting.value)
    )
  ) {
    throw new Error('The Neon database contains custom settings; migration stopped without changing it.');
  }
}

async function migrate() {
  const source = loadSource();
  await createSchema(db);

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('LOCK TABLE users, people, settings IN ACCESS EXCLUSIVE MODE');
    await ensureEmptyTarget(client);

    await client.query('DELETE FROM people');
    await client.query('DELETE FROM users');

    for (const user of source.users) {
      await client.query(
        `INSERT INTO users (id, username, password_hash, display_name, role, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.id, user.username, user.password_hash, user.display_name, user.role, user.created_at]
      );
    }

    for (const setting of source.settings) {
      await client.query(
        `INSERT INTO settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [setting.key, setting.value]
      );
    }

    for (const person of source.people) {
      await client.query(
        `INSERT INTO people
           (id, first_name, gender, father_id, photo_data, photo_mime, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, NULL, $4, $5, $6, $7, $8)`,
        [
          person.id,
          person.first_name,
          person.gender,
          person.photo_data,
          person.photo_mime,
          person.created_by,
          person.created_at,
          person.updated_at,
        ]
      );
    }

    for (const person of source.people) {
      if (person.father_id != null) {
        await client.query('UPDATE people SET father_id = $1 WHERE id = $2', [person.father_id, person.id]);
      }
    }

    for (const table of ['users', 'people']) {
      await client.query(
        `SELECT setval(
           pg_get_serial_sequence('${table}', 'id'),
           COALESCE((SELECT MAX(id) FROM ${table}), 1),
           EXISTS (SELECT 1 FROM ${table})
         )`
      );
    }

    await client.query('COMMIT');
    console.log(`Migration complete: ${source.users.length} account(s), ${source.people.length} person record(s).`);
    console.log('Stop the app before migration and verify the Neon database before directing users to it.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

migrate()
  .catch((err) => {
    console.error('SQLite-to-PostgreSQL migration failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());
