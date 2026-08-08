const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'familytree.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name  TEXT NOT NULL,
    role          TEXT NOT NULL CHECK(role IN ('admin','assistant')),
    created_at    INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS people (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name  TEXT NOT NULL,
    gender      TEXT NOT NULL CHECK(gender IN ('male','female')),
    father_id   INTEGER REFERENCES people(id) ON DELETE SET NULL,
    photo_path  TEXT,
    created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_people_father ON people(father_id);
`);

// ── seed a default administrator on first run ──
const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
if (userCount === 0) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(
    `INSERT INTO users (username, password_hash, display_name, role, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run('admin', hash, 'Administrator', 'admin', Date.now());

  console.log('─────────────────────────────────────────────────');
  console.log('  Default administrator account created:');
  console.log('    username: admin');
  console.log('    password: admin123');
  console.log('  Please log in and change this password.');
  console.log('─────────────────────────────────────────────────');
}

module.exports = { db, DATA_DIR, UPLOAD_DIR };
