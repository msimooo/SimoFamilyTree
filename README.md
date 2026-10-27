# Rootline — Family Tree

A self-hosted family tree application. Add your first ancestors, branch out sons and
daughters generation by generation, attach photos, and explore the whole tree as a visual,
pan-and-zoom diagram — ancestors at the top ("roots"), descendants branching down.

## Tech stack

- **Backend:** Node.js + Express
- **Database:** PostgreSQL (Neon or another PostgreSQL provider)
- **Auth:** Session cookies + hashed passwords (`bcryptjs`)
- **Photo uploads:** `multer`; image bytes are stored in PostgreSQL
- **Frontend:** Plain HTML/CSS/JavaScript, tree rendered with [D3.js](https://d3js.org/). D3
  and [jsPDF](https://github.com/parallax/jsPDF) (used for the PDF export) are bundled locally
  under `public/vendor/` rather than loaded from a CDN, so the app works fully offline and
  isn't dependent on a third-party CDN being reachable.

No build step, no framework tooling required — just Node.

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer
- A PostgreSQL database (for example, a free Neon project)

## Setup

1. Create a PostgreSQL database and copy its connection string.
2. Copy `.env.example` to `.env`, then fill in `DATABASE_URL` and a private `SESSION_SECRET`.
3. Install the dependencies once, then start the app:

```bash
npm install
npm start
```

Run `npm install` once after downloading/cloning the project (or when its dependencies change). For later runs, use `npm start`.

Then open **http://localhost:3002** in your browser.

On first run with an empty database, the app creates an administrator account:

```
username: admin
password: admin123
```

**Sign in and change this password immediately** (click your name in the top-right corner →
"Change password").

The app uses port **3002** by default. Hosting platforms can override this with the `PORT` environment variable.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for Render + Neon setup and the SQLite migration procedure.

## Roles

- **Administrator** — everything an Assistant can do, plus creating, editing, deleting user
  accounts, and assigning the Assistant role.
- **Assistant** — can add, edit, and delete people in the tree and upload photos, but cannot
  manage user accounts.

## Languages

Use the language button on the sign-in screen or in the app header to switch between English
and Arabic. The choice is saved in your browser, and Arabic uses a right-to-left layout.

## Public viewing

Public viewing is off by default. Administrators can turn it on under **Manage Users → Public
access**. When enabled, anyone with the site link can view names, family relationships, and
photos without an account; public visitors cannot edit the tree or manage accounts. Turning
public viewing off requires visitors to sign in again. Keep in mind that enabling this exposes
family information and photos to anyone who can access the site.

## Using the tree

- **Add Ancestor** (bottom-right button) starts a brand new family line — useful for your very
  first entry, or for adding an unconnected branch of the family.
- Click any person's card to open their detail panel. From there you can:
  - Edit their first name and gender
  - Upload or remove their photo
  - **Add Son** / **Add Daughter** — adds a new child underneath them
  - **Add Father** — extends the tree upward (only available if they don't already have a
    father recorded)
  - Delete them (if they have descendants, you'll be asked whether to delete the entire
    branch or trim the children first)
- Drag to pan, use the **+ / − / ⤢** controls (bottom-left) to zoom and re-center.
- Use **Top to bottom / Left to right / Classic** above the tree to switch between compact
  family diagrams with right-angle connectors and the original diagram. Top to bottom puts
  the oldest ancestor at the top, with later generations below. Your layout choice is saved
  in this browser.

## Exporting, printing, and moving your tree to another device

The **Export** button in the top bar has two groups of options:

- **Share & print** — "Export as PDF" and "Export as JPG" render a full, print-ready snapshot
  of the whole tree (not just what's currently visible on screen) as a downloadable file.
  These are ordinary PDF/JPG files — anyone you send them to can open, print, or share them
  without needing a Rootline account or logging in at all.
- **Backup & transfer** — "Save Tree to File" downloads a single self-contained
  `family-tree-backup.json` file with every person, their relationships, and their photos
  (embedded as base64, so it's one portable file — no separate folder of images to keep track
  of). "Import Tree from File" (administrators only) lets you load that file back in — handy
  for moving your tree to a new computer or server. **Importing replaces the entire current
  tree**, so you'll be asked to confirm first.

## Project structure

```
server.js              Express app entry point
db.js                   PostgreSQL schema + first-run admin seed
middleware/auth.js       requireAuth / requireAdmin guards
routes/auth.js           login, logout, session check, self password change
routes/users.js          admin-only user management (CRUD)
routes/people.js         family tree CRUD + photo upload + cascade delete
scripts/migrate-sqlite-to-postgres.js  one-time SQLite migration utility
public/index.html        app shell (login screen + main UI)
public/css/styles.css    styling
public/js/app.js         all frontend logic: auth flow, D3 tree rendering, panels, admin UI
public/vendor/            self-hosted D3 and jsPDF bundles (no CDN dependency)
```

## Data & backups

The PostgreSQL database stores accounts, settings, people, relationships, and photo bytes.
Use the in-app tree backup for people/photos/relationships. To move an existing SQLite
installation including accounts and settings, run
`npm run migrate:sqlite -- <sqlite-file> <uploads-folder>` with `DATABASE_URL` set to the
destination PostgreSQL database. Migration refuses to overwrite existing tree data and
requires the photo files referenced by SQLite.

## Notes on production use

This is set up for local or small-team/self-hosted use. Before exposing it on the public
internet, you should at minimum:
- Set a strong, random `SESSION_SECRET` environment variable (see `server.js`)
- Serve it behind HTTPS (e.g. via a reverse proxy like Caddy or nginx)
- Change the default admin password immediately after first login
