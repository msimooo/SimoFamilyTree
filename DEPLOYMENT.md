# Deployment Guide for SimoFamilyTree

Your Rootline Family Tree project is now on GitHub and ready to deploy! Follow the guide below for your preferred platform.

## ✅ GitHub Repository

Your code is pushed to: **https://github.com/msimooo/SimoFamilyTree**

---

## 🚀 Deployment Options

### **Option 1: Railway.app (Recommended - Easiest)**

Railway is the fastest option with excellent Node.js support.

1. Go to [https://railway.app](https://railway.app)
2. Click **"Create New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize and select **`SimoFamilyTree`** repository
5. Railway auto-detects Node.js. Wait for it to build (2-3 minutes)
6. Go to the **Variables** tab and add:
   - Key: `SESSION_SECRET`
   - Value: Generate a random string at https://www.random.org/strings/ (or use: `super-secret-key-change-me-in-production-12345`)
7. Deploy completes automatically
8. Your app is live at the URL shown in Railway dashboard (looks like: `https://simofamilytree.up.railway.app`)

**Cost**: ~$5-10/month after free credits ($5)

---

### **Option 2: Render.com**

Another great option with similar features to Railway.

1. Go to [https://render.com](https://render.com)
2. Sign up/Login with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your **SimoFamilyTree** repository
5. Fill in details:
   - **Name**: `simofamilytree` (or your choice)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
6. Scroll down to **Environment** and add:
   - Key: `SESSION_SECRET`
   - Value: (generate random string as above)
7. Add a **persistent disk** to the service with mount path `/var/data`.
8. Add these environment variables:
   - `DATA_DIR` = `/var/data`
   - `UPLOAD_DIR` = `/var/data/uploads`
9. Click **"Create Web Service"**
10. Wait 3-5 minutes for deployment

The service's default filesystem is temporary. Without a persistent disk, a restart or
redeploy can reset the SQLite database and remove accounts, family-tree data, and photos.
Persistent disks require a Render plan that supports them; the free service is not suitable
for persistent SQLite storage.

If you already have data on Render, back up `data/familytree.db` and `uploads/` before
switching to the new disk. A new disk starts empty; restore those files to `/var/data` and
`/var/data/uploads` before relying on it. The app will create a fresh database if no database
file exists at the configured path.

**Cost**: Free tier (temporary storage; app sleeps after inactivity) or a paid plan with persistent storage

---

### **Option 3: Vercel (Advanced)**

Vercel works but requires a small configuration change.

1. Go to [https://vercel.com](https://vercel.com)
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. In **Project Settings**:
   - Framework: **Other**
   - Build Command: `npm install`
   - Output Directory: Leave blank
   - Install Command: `npm install`
5. Add Environment Variable:
   - `SESSION_SECRET`: (random string)
6. Deploy

---

### **Option 4: Self-Hosted VPS (Full Control)**

For total control, use a VPS from DigitalOcean, Linode, or similar.

**Setup (Ubuntu/Debian Linux):**

```bash
# SSH into your server, then run:
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# Install Git
sudo apt install git -y

# Clone your repository
git clone https://github.com/msimooo/SimoFamilyTree.git
cd SimoFamilyTree

# Install dependencies
npm install

# Install PM2 to keep the app running
sudo npm install -g pm2

# Start the app
SESSION_SECRET="your-random-secret-here" pm2 start server.js --name family-tree

# Make it restart on reboot
pm2 startup
pm2 save

# Optional: Set up a domain with automatic HTTPS using Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.caddy.community/packaging/caddy/debian/pubkey.gpg' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-archive-keyring.gpg
sudo curl -1sLf 'https://dl.caddy.community/packaging/caddy/debian/sources.list' | sudo tee /etc/apt/sources.list.d/caddy-caddy.list
sudo apt update && sudo apt install caddy -y

# Create Caddyfile at /etc/caddy/Caddyfile with:
# yourdomain.com {
#     reverse_proxy localhost:3000
# }

sudo systemctl restart caddy
```

**Cost**: $5-20/month depending on server specs

---

## 📋 Post-Deployment Checklist

- [ ] App is accessible at your deployed URL
- [ ] Login works (default: `admin` / `admin123`)
- [ ] **Change default admin password immediately** (click name → "Change password")
- [ ] Test adding a family member
- [ ] Test uploading a photo
- [ ] Test exporting to PDF/JPG
- [ ] Set up backups of `data/familytree.db` and `uploads/` directory

---

## 🔐 Security Reminders

✅ **Already done:**
- `SESSION_SECRET` set via environment variables (not hardcoded)
- Passwords hashed with bcryptjs
- HTTPS recommended in production

⚠️ **You should do:**
- Use HTTPS (Railway, Render do this automatically)
- Change default admin password on first login
- Set a strong, random `SESSION_SECRET`
- Periodically backup `data/` and `uploads/` folders

---

## 🐛 Troubleshooting

**App won't start?**
- Check that `NODE_ENV` is not set to `production` locally
- Verify `SESSION_SECRET` is set (even with a simple value for testing)
- Check logs in your deployment platform's dashboard

**Database errors?**
- `data/familytree.db` is created automatically on first run
- If corrupted, delete it and restart the app

**Photo uploads not working?**
- Ensure `uploads/` directory exists and is writable
- Check file size limits (set to 60MB by default in `server.js`)

**Can't access deployed app?**
- Wait a few minutes after deploy
- Check deployment logs in Railway/Render dashboard
- Verify `SESSION_SECRET` environment variable is set

---

## 📞 Need Help?

- Railway docs: https://docs.railway.app
- Render docs: https://render.com/docs
- Node.js Express: https://expressjs.com/

Good luck! 🎉
