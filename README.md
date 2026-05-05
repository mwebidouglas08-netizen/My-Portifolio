# Douglas Mwebi — Daggy Techs Portfolio

Personal portfolio website for **Douglas Mwebi** (Daggy Techs), a full-stack software engineer based in Kisii, Kenya.

**Stack:** Node.js · Express.js · Vanilla JS · CSS3 · Nodemailer

---

## 🚀 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env and add your Gmail credentials

# 3. Start dev server (with auto-reload)
npm run dev

# 4. Open http://localhost:3000
```

---

## ☁️ Deploy to Render

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit — Daggy Portfolio"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/daggy-portfolio.git
git push -u origin main
```

### Step 2 — Create Render Web Service

1. Go to [https://render.com](https://render.com) and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo
4. Render will auto-detect `render.yaml` — confirm these settings:
   - **Build Command:** `npm install`
   - **Start Command:** `node server/index.js`
   - **Environment:** Node
5. Add Environment Variables:
   | Key | Value |
   |-----|-------|
   | `EMAIL_USER` | `daggytechs@gmail.com` |
   | `EMAIL_PASS` | Your Gmail App Password |
6. Click **"Create Web Service"**

### Step 3 — Gmail App Password (for contact form)

1. Enable 2-Factor Authentication on your Google account
2. Go to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Create an App Password for "Mail"
4. Use that 16-character password as `EMAIL_PASS` in Render

---

## 📁 Project Structure

```
daggy-portfolio/
├── server/
│   └── index.js          # Express server + API routes
├── public/
│   ├── index.html        # Main portfolio page
│   ├── css/
│   │   └── style.css     # All styles
│   └── js/
│       └── main.js       # Client-side JS
├── .env.example          # Environment variable template
├── .gitignore
├── render.yaml           # Render deployment config
├── package.json
└── README.md
```

---

## ✉️ Contact Form

The `/api/contact` endpoint:
- Validates all fields server-side
- Rate-limited to 5 requests per 15 minutes per IP
- Sends email via Gmail SMTP using Nodemailer
- Returns JSON `{ success, message }`

If `EMAIL_USER` / `EMAIL_PASS` are not set, submissions are logged to console only (no crash).

---

## 📞 Contact

- **Email:** daggytechs@gmail.com
- **Phone:** +254 796 820 013
- **GitHub:** [mwebidouglas08-netizen](https://github.com/mwebidouglas08-netizen)
- **Location:** Kisii Town, Kenya
