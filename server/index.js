require('dotenv').config();
const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

/* ── Security & Middleware ── */
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── Rate Limiting for Contact Form ── */
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ── Static Assets ── */
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: '1d',
  etag: true
}));

/* ── HTML Escape Helper ── */
function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ── Routes ── */
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.post('/api/contact', contactLimiter, (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim();
  const subject = String(req.body.subject || '').trim();
  const message = String(req.body.message || '').trim();

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address.' });
  }

  console.log('\n===========================================');
  console.log('  NEW CONTACT FORM SUBMISSION');
  console.log('===========================================');
  console.log(`  Name    : ${name}`);
  console.log(`  Email   : ${email}`);
  console.log(`  Subject : ${subject}`);
  console.log(`  Message : ${message}`);
  console.log(`  Time    : ${new Date().toUTCString()}`);
  console.log('===========================================\n');

  const EMAIL_USER = String(process.env.EMAIL_USER || '').trim();
  const EMAIL_PASS = String(process.env.EMAIL_PASS || '').trim();
  const TO_EMAIL = String(process.env.TO_EMAIL || EMAIL_USER).trim();

  // VALIDATE APP PASSWORD FORMAT
  const hasRealCreds = EMAIL_USER.includes('@gmail.com') &&
    EMAIL_PASS.length === 16 && 
    /^[a-z]{4} [a-z]{4} [a-z]{4} [a-z]{4}$/.test(EMAIL_PASS.toLowerCase().
