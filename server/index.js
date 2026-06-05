require('dotenv').config();
const express    = require('express');
const path       = require('path');
const nodemailer = require('nodemailer');
const rateLimit  = require('express-rate-limit');
const helmet     = require('helmet');
const cors       = require('cors');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ─── Middleware ─── */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:    ["'self'", "https://fonts.gstatic.com"],
      scriptSrc:  ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}));
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.static(path.join(__dirname, '../public')));

/* ─── Rate limiter ─── */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many messages. Please try again in 15 minutes.' }
});

/* ─── HTML escape ─── */
function esc(s) {
  return String(s || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

/* ─── Promise with timeout wrapper ─── */
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
    )
  ]);
}

/* ─── Serve portfolio ─── */
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

/* ══════════════════════════════════════════════
   POST /api/contact
══════════════════════════════════════════════ */
app.post('/api/contact', limiter, async (req, res) => {

  /* 1 ── Parse & validate ── */
  const name    = (req.body.name    || '').trim();
  const email   = (req.body.email   || '').trim();
  const subject = (req.body.subject || '').trim();
  const message = (req.body.message || '').trim();

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address.' });
  }

  /* 2 ── Always log to console (visible in Render dashboard) ── */
  console.log('\n=========================================');
  console.log('📩  NEW PORTFOLIO CONTACT MESSAGE');
  console.log('=========================================');
  console.log('Name    :', name);
  console.log('Email   :', email);
  console.log('Subject :', subject);
  console.log('Message :', message);
  console.log('Time    :', new Date().toUTCString());
  console.log('=========================================\n');

  /* 3 ── Check env credentials ── */
  const EMAIL_USER = (process.env.EMAIL_USER || '').trim();
  const EMAIL_PASS = (process.env.EMAIL_PASS || '').trim();
  const TO_EMAIL   = (process.env.TO_EMAIL   || EMAIL_USER).trim();

  const credsSet = EMAIL_USER && EMAIL_PASS &&
    !EMAIL_PASS.includes('your_') &&
    !EMAIL_PASS.includes('app_password') &&
    EMAIL_PASS.length >= 16;

  if (!credsSet) {
    console.warn('⚠️  Email credentials not configured — message logged only.');
    return res.json({
      success: true,
      message: 'Message received! I will get back to you within 24 hours.'
    });
  }

  /* 4 ── Build transporter (NO verify call — it hangs on some hosts) ── */
  const transporter = nodemailer.createTransport({
    host:   'smtp.gmail.com',
    port:   587,
    secure: false,
    auth:   { user: EMAIL_USER, pass: EMAIL_PASS },
    tls:    { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout:   10000,
    socketTimeout:     15000
  });

  /* 5 ── Build emails ── */
  const toOwner = {
    from:    `"Daggy Portfolio" <${EMAIL_USER}>`,
    to:      TO_EMAIL,
    replyTo: `"${name}" <${email}>`,
    subject: `[Portfolio] ${subject} — from ${name}`,
    text:    `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:580px;background:#0c0c14;color:#e0e0f0;border-radius:10px;border:1px solid #2c2c48;overflow:hidden;">
  <div style="background:#12121e;padding:22px 26px;border-bottom:1px solid #2c2c48;">
    <p style="font-family:monospace;font-size:11px;color:#5eead4;letter-spacing:2px;text-transform:uppercase;margin:0 0 5px">[DT] Daggy Techs Portfolio</p>
    <h2 style="margin:0;color:#eeeeff;font-size:19px;">New Contact Message</h2>
  </div>
  <div style="padding:22px 26px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;border-bottom:1px solid #1e1e30;font-family:monospace;font-size:11px;color:#50506a;text-transform:uppercase;width:80px">From</td><td style="padding:8px 0;border-bottom:1px solid #1e1e30;color:#eeeeff">${esc(name)}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #1e1e30;font-family:monospace;font-size:11px;color:#50506a;text-transform:uppercase">Email</td><td style="padding:8px 0;border-bottom:1px solid #1e1e30"><a href="mailto:${esc(email)}" style="color:#5eead4">${esc(email)}</a></td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #1e1e30;font-family:monospace;font-size:11px;color:#50506a;text-transform:uppercase">Subject</td><td style="padding:8px 0;border-bottom:1px solid #1e1e30;color:#eeeeff">${esc(subject)}</td></tr>
      <tr><td style="padding:14px 0;font-family:monospace;font-size:11px;color:#50506a;text-transform:uppercase;vertical-align:top">Message</td><td style="padding:14px 0;color:#c0c0de;line-height:1.7">${esc(message).replace(/\n/g,'<br>')}</td></tr>
    </table>
  </div>
  <div style="padding:12px 26px;background:#06060a;border-top:1px solid #1e1e30;">
    <p style="margin:0;font-family:monospace;font-size:10px;color:#50506a">Sent via daggy-portfolio · ${new Date().toUTCString()}</p>
  </div>
</div>`
  };

  const autoReply = {
    from:    `"Douglas Mwebi | Daggy Techs" <${EMAIL_USER}>`,
    to:      `"${name}" <${email}>`,
    subject: `Got your message — I'll be in touch soon`,
    text:    `Hi ${name},\n\nThanks for reaching out! I received your message and will reply within 24 hours.\n\nDouglas Mwebi\nFull-Stack Engineer · Daggy Techs\nmwebidouglas08@gmail.com`,
    html: `<div style="font-family:Arial,sans-serif;max-width:540px;background:#0c0c14;color:#e0e0f0;border-radius:10px;border:1px solid #2c2c48;overflow:hidden;">
  <div style="background:#12121e;padding:22px 26px;border-bottom:1px solid #2c2c48;">
    <p style="font-family:monospace;font-size:11px;color:#5eead4;letter-spacing:2px;text-transform:uppercase;margin:0 0 5px">[DT] Daggy Techs</p>
    <h2 style="margin:0;color:#eeeeff;font-size:17px;">Thanks for reaching out, ${esc(name)}!</h2>
  </div>
  <div style="padding:22px 26px;color:#c0c0de;line-height:1.75;font-size:15px;">
    <p>I've received your message and will get back to you within 24 hours.</p>
    <p style="margin-top:14px">Check out my work on GitHub:</p>
    <p style="margin-top:6px"><a href="https://github.com/mwebidouglas08-netizen" style="color:#5eead4">github.com/mwebidouglas08-netizen</a></p>
    <hr style="border:none;border-top:1px solid #1e1e30;margin:20px 0"/>
    <p style="font-size:13px;color:#50506a">Douglas Mwebi · Full-Stack Engineer · Kisii, Kenya<br>
    <a href="mailto:mwebidouglas08@gmail.com" style="color:#5eead4">mwebidouglas08@gmail.com</a></p>
  </div>
</div>`
  };

  /* 6 ── Send notification to Douglas (with timeout) ── */
  try {
    await withTimeout(transporter.sendMail(toOwner), 15000);
    console.log(`✅ Notification sent → ${TO_EMAIL}`);
  } catch (err) {
    console.error('❌ Notification send failed:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Could not send your message right now. Please email mwebidouglas08@gmail.com directly.'
    });
  }

  /* 7 ── Send auto-reply (non-critical — don't fail request) ── */
  withTimeout(transporter.sendMail(autoReply), 10000)
    .then(() => console.log(`✅ Auto-reply sent → ${email}`))
    .catch(err => console.warn('⚠️  Auto-reply failed (non-critical):', err.message));

  return res.json({
    success: true,
    message: "Message sent! I'll get back to you within 24 hours. Check your inbox for a confirmation."
  });
});

/* ─── Health check ─── */
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    email_configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS &&
      !String(process.env.EMAIL_PASS).includes('your_')),
    timestamp: new Date().toISOString()
  });
});

/* ─── 404 → portfolio ─── */
app.use((_req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../public/index.html'));
});

/* ─── Start ─── */
app.listen(PORT, () => {
  const emailOk = process.env.EMAIL_USER && process.env.EMAIL_PASS &&
    !String(process.env.EMAIL_PASS).includes('your_');
  console.log(`\n🚀  Daggy Portfolio → http://localhost:${PORT}`);
  console.log(`📧  Email configured: ${!!emailOk}`);
  if (!emailOk) {
    console.warn('⚠️   Set EMAIL_USER + EMAIL_PASS in .env to enable email sending');
    console.warn('⚠️   Get App Password at: https://myaccount.google.com/apppasswords\n');
  }
});
