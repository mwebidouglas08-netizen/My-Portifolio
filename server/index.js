require('dotenv').config();
const express    = require('express');
const path       = require('path');
const nodemailer = require('nodemailer');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── Body parsing ── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── Serve static files ── */
app.use(express.static(path.join(__dirname, '../public')));

/* ── HTML escape helper ── */
function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ════════════════════════════════════════
   GET /  — serve portfolio
════════════════════════════════════════ */
app.get('/', function (_req, res) {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

/* ════════════════════════════════════════
   POST /api/contact
════════════════════════════════════════ */
app.post('/api/contact', function (req, res) {

  var name    = String(req.body.name    || '').trim();
  var email   = String(req.body.email   || '').trim();
  var subject = String(req.body.subject || '').trim();
  var message = String(req.body.message || '').trim();

  /* Validate */
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address.' });
  }

  /* Always log — visible in Render dashboard logs */
  console.log('');
  console.log('===========================================');
  console.log('  NEW CONTACT FORM SUBMISSION');
  console.log('===========================================');
  console.log('  Name    : ' + name);
  console.log('  Email   : ' + email);
  console.log('  Subject : ' + subject);
  console.log('  Message : ' + message);
  console.log('  Time    : ' + new Date().toUTCString());
  console.log('===========================================');
  console.log('');

  var EMAIL_USER = String(process.env.EMAIL_USER || '').trim();
  var EMAIL_PASS = String(process.env.EMAIL_PASS || '').trim();
  var TO_EMAIL   = String(process.env.TO_EMAIL   || EMAIL_USER).trim();

  /* If no real credentials — log only, still return success */
  var hasRealCreds = EMAIL_USER.length > 0 &&
    EMAIL_PASS.length >= 16 &&
    EMAIL_PASS.indexOf('your_') === -1 &&
    EMAIL_PASS.indexOf('PASTE') === -1 &&
    EMAIL_PASS.indexOf('app_password') === -1;

  if (!hasRealCreds) {
    console.log('  [INFO] No email credentials set — message logged only.');
    return res.json({
      success: true,
      message: 'Message received! I will get back to you within 24 hours.'
    });
  }

  /* Build emails */
  var ownerHtml = [
    '<div style="font-family:Arial,sans-serif;max-width:580px;background:#0c0c14;color:#e0e0f0;border-radius:10px;border:1px solid #2c2c48;overflow:hidden;">',
    '<div style="background:#12121e;padding:20px 24px;border-bottom:1px solid #2c2c48;">',
    '<p style="font-family:monospace;font-size:11px;color:#5eead4;letter-spacing:2px;margin:0 0 4px">[DT] DAGGY TECHS PORTFOLIO</p>',
    '<h2 style="margin:0;color:#eeeeff;font-size:18px;">New Contact Message</h2>',
    '</div>',
    '<div style="padding:20px 24px;">',
    '<table style="width:100%;border-collapse:collapse;">',
    '<tr><td style="padding:8px 0;border-bottom:1px solid #1e1e30;font-family:monospace;font-size:11px;color:#50506a;width:75px">FROM</td><td style="padding:8px 0;border-bottom:1px solid #1e1e30;color:#eeeeff">' + esc(name) + '</td></tr>',
    '<tr><td style="padding:8px 0;border-bottom:1px solid #1e1e30;font-family:monospace;font-size:11px;color:#50506a">EMAIL</td><td style="padding:8px 0;border-bottom:1px solid #1e1e30"><a href="mailto:' + esc(email) + '" style="color:#5eead4">' + esc(email) + '</a></td></tr>',
    '<tr><td style="padding:8px 0;border-bottom:1px solid #1e1e30;font-family:monospace;font-size:11px;color:#50506a">SUBJECT</td><td style="padding:8px 0;border-bottom:1px solid #1e1e30;color:#eeeeff">' + esc(subject) + '</td></tr>',
    '<tr><td style="padding:12px 0;font-family:monospace;font-size:11px;color:#50506a;vertical-align:top">MESSAGE</td><td style="padding:12px 0;color:#c0c0de;line-height:1.7">' + esc(message).replace(/\n/g, '<br>') + '</td></tr>',
    '</table>',
    '</div>',
    '<div style="padding:10px 24px;background:#06060a;border-top:1px solid #1e1e30;">',
    '<p style="margin:0;font-family:monospace;font-size:10px;color:#50506a">Sent via daggy-portfolio &middot; ' + new Date().toUTCString() + '</p>',
    '</div></div>'
  ].join('');

  var replyHtml = [
    '<div style="font-family:Arial,sans-serif;max-width:540px;background:#0c0c14;color:#e0e0f0;border-radius:10px;border:1px solid #2c2c48;overflow:hidden;">',
    '<div style="background:#12121e;padding:20px 24px;border-bottom:1px solid #2c2c48;">',
    '<p style="font-family:monospace;font-size:11px;color:#5eead4;letter-spacing:2px;margin:0 0 4px">[DT] DAGGY TECHS</p>',
    '<h2 style="margin:0;color:#eeeeff;font-size:17px;">Thanks for reaching out, ' + esc(name) + '!</h2>',
    '</div>',
    '<div style="padding:20px 24px;color:#c0c0de;line-height:1.75;font-size:15px;">',
    '<p>I received your message and will get back to you within 24 hours.</p>',
    '<p style="margin-top:14px">Meanwhile, check out my work:</p>',
    '<p style="margin-top:6px"><a href="https://github.com/mwebidouglas08-netizen" style="color:#5eead4">github.com/mwebidouglas08-netizen</a></p>',
    '<hr style="border:none;border-top:1px solid #1e1e30;margin:18px 0">',
    '<p style="font-size:13px;color:#50506a">Douglas Mwebi &middot; Full-Stack Engineer &middot; Kisii, Kenya<br>',
    '<a href="mailto:mwebidouglas08@gmail.com" style="color:#5eead4">mwebidouglas08@gmail.com</a></p>',
    '</div></div>'
  ].join('');

  var transporter = nodemailer.createTransport({
    host:               'smtp.gmail.com',
    port:               587,
    secure:             false,
    auth:               { user: EMAIL_USER, pass: EMAIL_PASS },
    tls:                { rejectUnauthorized: false },
    connectionTimeout:  10000,
    greetingTimeout:    10000,
    socketTimeout:      15000
  });

  /* Send notification to Douglas */
  transporter.sendMail({
    from:    '"Daggy Portfolio" <' + EMAIL_USER + '>',
    to:      TO_EMAIL,
    replyTo: '"' + name + '" <' + email + '>',
    subject: '[Portfolio] ' + subject + ' — from ' + name,
    text:    'Name: ' + name + '\nEmail: ' + email + '\nSubject: ' + subject + '\n\n' + message,
    html:    ownerHtml
  }, function (err) {
    if (err) {
      console.error('  [ERROR] Notification failed:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Could not send your message right now. Please email mwebidouglas08@gmail.com directly.'
      });
    }

    console.log('  [OK] Notification sent to ' + TO_EMAIL);

    /* Send auto-reply (non-critical) */
    transporter.sendMail({
      from:    '"Douglas Mwebi | Daggy Techs" <' + EMAIL_USER + '>',
      to:      '"' + name + '" <' + email + '>',
      subject: "Got your message — I'll be in touch soon",
      text:    'Hi ' + name + ',\n\nThanks for reaching out! I will reply within 24 hours.\n\nDouglas Mwebi\nmwebidouglas08@gmail.com',
      html:    replyHtml
    }, function (replyErr) {
      if (replyErr) {
        console.warn('  [WARN] Auto-reply failed (non-critical):', replyErr.message);
      } else {
        console.log('  [OK] Auto-reply sent to ' + email);
      }
    });

    return res.json({
      success: true,
      message: "Message sent! I'll get back to you within 24 hours. Check your inbox for a confirmation."
    });
  });
});

/* ════════════════════════════════════════
   GET /health
════════════════════════════════════════ */
app.get('/health', function (_req, res) {
  var p = process.env.EMAIL_PASS || '';
  var configured = p.length >= 16 && p.indexOf('your_') === -1 && p.indexOf('PASTE') === -1;
  res.json({
    status:           'ok',
    email_configured: configured,
    timestamp:        new Date().toISOString()
  });
});

/* ── 404 fallback ── */
app.use(function (_req, res) {
  res.status(404).sendFile(path.join(__dirname, '../public/index.html'));
});

/* ── Start ── */
app.listen(PORT, function () {
  var p = process.env.EMAIL_PASS || '';
  var ok = p.length >= 16 && p.indexOf('your_') === -1 && p.indexOf('PASTE') === -1;
  console.log('\n🚀  Daggy Portfolio running on http://localhost:' + PORT);
  console.log('📧  Email configured: ' + ok);
  if (!ok) {
    console.log('');
    console.log('  To enable email, set these in .env or Render dashboard:');
    console.log('  EMAIL_USER=mwebidouglas08@gmail.com');
    console.log('  EMAIL_PASS=<your 16-char Gmail App Password>');
    console.log('  TO_EMAIL=mwebidouglas08@gmail.com');
    console.log('  Get App Password: https://myaccount.google.com/apppasswords');
    console.log('');
  }
});
