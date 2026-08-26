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

  // STRICT APP PASSWORD VALIDATION (Must be 16 chars, typically 4 groups of 4)
  const cleanPass = EMAIL_PASS.replace(/\s/g, '');
  const hasRealCreds = EMAIL_USER.includes('@gmail.com') &&
    cleanPass.length === 16 && 
    /^[a-z0-9]{16}$/i.test(cleanPass);

  if (!hasRealCreds) {
    console.log('  [INFO] Invalid or missing Gmail App Password. Message logged only.');
    console.log('  [FIX] Go to Google Account > Security > 2-Step Verification > App Passwords.');
    return res.json({
      success: true,
      message: 'Message received! I will get back to you within 24 hours.'
    });
  }

  // EXPLICIT GMAIL SMTP CONFIGURATION (Prevents auto-config failures)
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: EMAIL_USER,
      pass: cleanPass // Use password without spaces
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });

  const ownerHtml = [
    '<div style="font-family:Arial,sans-serif;max-width:580px;background:#0a0a0f;color:#e0e0f0;border-radius:12px;border:1px solid #1a1a24;overflow:hidden;">',
    '<div style="background:#12121e;padding:20px 24px;border-bottom:1px solid #1a1a24;">',
    '<p style="font-family:monospace;font-size:11px;color:#14b8a6;letter-spacing:2px;margin:0 0 4px">[DT] DAGGY TECHS PORTFOLIO</p>',
    '<h2 style="margin:0;color:#eeeeff;font-size:18px;">New Contact Message</h2>',
    '</div>',
    '<div style="padding:20px 24px;">',
    '<table style="width:100%;border-collapse:collapse;">',
    `<tr><td style="padding:8px 0;border-bottom:1px solid #1a1a24;font-family:monospace;font-size:11px;color:#50506a;width:75px">FROM</td><td style="padding:8px 0;border-bottom:1px solid #1a1a24;color:#eeeeff">${esc(name)}</td></tr>`,
    `<tr><td style="padding:8px 0;border-bottom:1px solid #1a1a24;font-family:monospace;font-size:11px;color:#50506a">EMAIL</td><td style="padding:8px 0;border-bottom:1px solid #1a1a24"><a href="mailto:${esc(email)}" style="color:#14b8a6">${esc(email)}</a></td></tr>`,
    `<tr><td style="padding:8px 0;border-bottom:1px solid #1a1a24;font-family:monospace;font-size:11px;color:#50506a">SUBJECT</td><td style="padding:8px 0;border-bottom:1px solid #1a1a24;color:#eeeeff">${esc(subject)}</td></tr>`,
    `<tr><td style="padding:12px 0;font-family:monospace;font-size:11px;color:#50506a;vertical-align:top">MESSAGE</td><td style="padding:12px 0;color:#c0c0de;line-height:1.7">${esc(message).replace(/\n/g, '<br>')}</td></tr>`,
    '</table>',
    '</div>',
    `<div style="padding:10px 24px;background:#050507;border-top:1px solid #1a1a24;">`,
    `<p style="margin:0;font-family:monospace;font-size:10px;color:#50506a">Sent via daggy-portfolio &middot; ${new Date().toUTCString()}</p>`,
    '</div></div>'
  ].join('');

  const replyHtml = [
    '<div style="font-family:Arial,sans-serif;max-width:540px;background:#0a0a0f;color:#e0e0f0;border-radius:12px;border:1px solid #1a1a24;overflow:hidden;">',
    '<div style="background:#12121e;padding:20px 24px;border-bottom:1px solid #1a1a24;">',
    '<p style="font-family:monospace;font-size:11px;color:#14b8a6;letter-spacing:2px;margin:0 0 4px">[DT] DAGGY TECHS</p>',
    `<h2 style="margin:0;color:#eeeeff;font-size:17px;">Thanks for reaching out, ${esc(name)}!</h2>`,
    '</div>',
    '<div style="padding:20px 24px;color:#c0c0de;line-height:1.75;font-size:15px;">',
    '<p>I received your message and will get back to you within 24 hours.</p>',
    '<p style="margin-top:14px">Meanwhile, check out my work:</p>',
    '<p style="margin-top:6px"><a href="https://github.com/mwebidouglas08-netizen" style="color:#14b8a6">github.com/mwebidouglas08-netizen</a></p>',
    '<hr style="border:none;border-top:1px solid #1a1a24;margin:18px 0">',
    '<p style="font-size:13px;color:#50506a">Douglas Mwebi &middot; Full-Stack Engineer &middot; Kisii, Kenya<br>',
    '<a href="mailto:mwebidouglas08@gmail.com" style="color:#14b8a6">mwebidouglas08@gmail.com</a></p>',
    '</div></div>'
  ].join('');

  transporter.sendMail({
    from: `"Daggy Portfolio" <${EMAIL_USER}>`,
    to: TO_EMAIL,
    replyTo: `"${name}" <${email}>`,
    subject: `[Portfolio] ${subject} — from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
    html: ownerHtml
  }, function (err) {
    if (err) {
      console.error('  [ERROR] Notification failed:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Could not send your message right now. Please email mwebidouglas08@gmail.com directly.'
      });
    }

    console.log(`  [OK] Notification sent to ${TO_EMAIL}`);

    transporter.sendMail({
      from: `"Douglas Mwebi | Daggy Techs" <${EMAIL_USER}>`,
      to: `"${name}" <${email}>`,
      subject: "Got your message — I'll be in touch soon",
      text: `Hi ${name},\n\nThanks for reaching out! I will reply within 24 hours.\n\nDouglas Mwebi\nmwebidouglas08@gmail.com`,
      html: replyHtml
    }, function (replyErr) {
      if (replyErr) {
        console.warn('  [WARN] Auto-reply failed (non-critical):', replyErr.message);
      } else {
        console.log(`  [OK] Auto-reply sent to ${email}`);
      }
    });

    return res.json({
      success: true,
      message: "Message sent! I'll get back to you within 24 hours. Check your inbox for a confirmation."
    });
  });
});

app.get('/health', (_req, res) => {
  const p = (process.env.EMAIL_PASS || '').replace(/\s/g, '');
  const configured = p.length === 16 && /^[a-z0-9]{16}$/i.test(p);
  res.json({
    status: 'ok',
    email_configured: configured,
    timestamp: new Date().toISOString()
  });
});

app.use((_req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  const p = (process.env.EMAIL_PASS || '').replace(/\s/g, '');
  const ok = p.length === 16 && /^[a-z0-9]{16}$/i.test(p);
  console.log(`\n🚀  Daggy Portfolio running on http://localhost:${PORT}`);
  console.log(`📧  Email configured: ${ok}`);
  if (!ok) {
    console.log('\n  ⚠️  To enable email, set these in .env or Render dashboard:');
    console.log('  EMAIL_USER=mwebidouglas08@gmail.com');
    console.log('  EMAIL_PASS=<your 16-char Gmail App Password>');
    console.log('  TO_EMAIL=mwebidouglas08@gmail.com');
    console.log('  Get App Password: https://myaccount.google.com/apppasswords\n');
  }
});
