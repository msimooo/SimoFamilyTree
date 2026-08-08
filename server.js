const path = require('path');
const express = require('express');
const session = require('express-session');

const { UPLOAD_DIR } = require('./db'); // also runs schema init / admin seed
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const peopleRoutes = require('./routes/people');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

app.use(
  session({
    name: 'familytree.sid',
    secret: process.env.SESSION_SECRET || 'family-tree-dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      sameSite: 'lax',
    },
  })
);

app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/people', peopleRoutes);

app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// central error handler (e.g. multer upload errors that slipped through)
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: err.message || 'Something went wrong' });
});

app.listen(PORT, () => {
  console.log(`Family Tree app running → http://localhost:${PORT}`);
});
