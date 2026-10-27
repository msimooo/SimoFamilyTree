# Deploy Rootline with Neon and Render

The app uses PostgreSQL for accounts, family-tree records, settings, and photo bytes. It
does not require a Render persistent disk. Neon free-tier limits and availability can change;
check the provider's current pricing before relying on it for production data.

## 1. Create a Neon database

1. Create a project at [neon.tech](https://neon.tech).
2. Copy the **pooled** connection string from the Neon dashboard. It should include
   `sslmode=require`.
3. Keep the connection string private. It grants access to your database.

## 2. Deploy the app on Render

1. Create a Render **Web Service** from the GitHub repository.
2. Set **Build Command** to `npm install` and **Start Command** to `npm start`.
3. Add these environment variables:
   - `DATABASE_URL`: the Neon pooled connection string.
   - `SESSION_SECRET`: a long, randomly generated secret.
4. Deploy. The app creates its PostgreSQL tables on startup and creates the default
   `admin` / `admin123` account only if the database has no users. Change this password
   immediately.

Signed-in sessions are stored in PostgreSQL and last up to 30 days while the user remains
active. The app does not store passwords in the browser. Logging out ends the session.

Render supplies `PORT` automatically; local runs use port `3002`. Do not set `DATA_DIR` or
`UPLOAD_DIR` for this PostgreSQL version.

## 3. Move existing SQLite data (optional)

The tree backup in the app includes people, relationships, and photos, but not user
accounts. To migrate the complete SQLite installation—including account password hashes,
settings, family relationships, and local photo files—use the migration script.

First obtain the **authoritative** `familytree.db` and its matching `uploads` directory from
the server that currently holds your data. Do not assume a copy on your computer matches
the live Render data. Stop writes to the old app during migration and keep an untouched
backup of both source items.

For a local migration, create a `.env` file from `.env.example` and set `DATABASE_URL` to
the destination Neon connection string. Then run:

```powershell
npm install
npm run migrate:sqlite -- "C:\path\to\familytree.db" "C:\path\to\uploads"
```

The script reads the SQLite database without modifying it, stores photos in PostgreSQL,
and refuses to overwrite existing people or non-default accounts in Neon. It permits a
fresh database, including the default `admin` account created at first app startup. If a
referenced photo file is missing, the migration stops rather than silently dropping it.
Older SQLite databases without a `settings` table retain the default private-tree setting.
Verify the migrated accounts, people, and photos in the app before changing Render's
`DATABASE_URL` or directing users to the new deployment.

If the old Render SQLite data was on a temporary filesystem and has already disappeared,
the migration cannot recover it. The JSON tree backup can restore people and photos, but
accounts must be recreated.

## Local setup

Install dependencies once, create `.env` using `.env.example`, and provide a PostgreSQL
database URL plus a session secret:

```powershell
npm install
npm start
```

Then open [http://localhost:3002](http://localhost:3002). `.env` is ignored by Git; never
commit database credentials or session secrets.

## Backups and security

- Back up the Neon database regularly using Neon or PostgreSQL backup/export tools.
- The in-app tree backup is useful for moving family-tree records, but it does not include
  accounts or settings.
- Keep `DATABASE_URL` and `SESSION_SECRET` private and use HTTPS.
- Public viewing is disabled by default. Enabling it exposes names, relationships, and
  photos to anyone with the site URL.
