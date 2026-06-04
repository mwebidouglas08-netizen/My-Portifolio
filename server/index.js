require('dotenv').config();
const express    = require('express');
const path       = require('path');
const nodemailer = require('nodemailer');
const rateLimit  = require('express-rate-limit');
const helmet     = require('helmet');
const cors       = require('cors');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── Security middleware ── */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      styleSrc:    ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:     ["'self'", "https://fonts.gstatic.com"],
      scriptSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:      ["'self'", "data:", "https:"],
      connectSrc:  ["'self'"]
    }
  }
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

/* ── Rate limit: max 5 contact submissions per 15 min per IP ── */
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many messages sent. Please try again in 15 minutes.' }
});

/* ── Serve portfolio ── */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

/* ══════════════════════════════════════════
   CONTACT FORM ENDPOINT
══════════════════════════════════════════ */
app.post('/api/contact', contactLimiter, async (req, res) => {
  const { name, email, subject, message } = req.body;

  /* ── Validate fields ── */
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
  }
  if (name.length > 100 || subject.length > 200 || message.length > 5000) {
    return res.status(400).json({ success: false, message: 'Input exceeds allowed length.' });
  }

  const EMAIL_USER = process.env.EMAIL_USER;
  const EMAIL_PASS = process.env.EMAIL_PASS;
  const TO_EMAIL   = process.env.TO_EMAIL || EMAIL_USER;

  /* ── Log every submission to console (always works) ── */
  console.log('==============================');
  console.log('📩 NEW CONTACT FORM SUBMISSION');
  console.log('==============================');
  console.log(`From:    ${name} <${email}>`);
  console.log(`Subject: ${subject}`);
  console.log(`Message: ${message}`);
  console.log(`Time:    ${new Date().toISOString()}`);
  console.log('==============================');

  /* ── If no credentials set, still return success + log ── */
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.warn('⚠️  EMAIL_USER / EMAIL_PASS not set in .env — message logged only.');
    return res.json({
      success: true,
      message: 'Message received! I will get back to you shortly.'
    });
  }

  /* ── Create Gmail transporter ── */
  const transporter = nodemailer.createTransport({
    host:   'smtp.gmail.com',
    port:   587,
    secure: false,           // STARTTLS
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS       // Must be a Gmail App Password (16 chars, no spaces)
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  /* ── Verify SMTP connection before sending ── */
  try {
    await transporter.verify();
  } catch (verifyErr) {
    console.error('❌ SMTP verify failed:', verifyErr.message);
    return res.status(500).json({
      success: false,
      message: 'Email service is currently unavailable. Please contact me directly at mwebidouglas08@gmail.com'
    });
  }

  /* ── Build email ── */
  const htmlBody = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0c0c14;color:#e0e0f0;border-radius:12px;overflow:hidden;border:1px solid #2c2c48;">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#12121e,#1a1a2e);padding:28px 32px;border-bottom:1px solid #2c2c48;">
        <p style="font-family:'Courier New',monospace;font-size:0.75rem;color:#5eead4;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 6px;">[DT] Daggy Techs Portfolio</p>
        <h2 style="margin:0;font-size:1.4rem;color:#eeeeff;">New Contact Message</h2>
      </div>
      <!-- Body -->
      <div style="padding:28px 32px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #1e1e30;font-family:'Courier New',monospace;font-size:0.72rem;color:#50506a;text-transform:uppercase;letter-spacing:0.1em;width:90px;">From</td>
            <td style="padding:10px 0;border-bottom:1px solid #1e1e30;color:#eeeeff;font-size:0.95rem;">${escapeHtml(name)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #1e1e30;font-family:'Courier New',monospace;font-size:0.72rem;color:#50506a;text-transform:uppercase;letter-spacing:0.1em;">Email</td>
            <td style="padding:10px 0;border-bottom:1px solid #1e1e30;color:#5eead4;font-size:0.95rem;"><a href="mailto:${escapeHtml(email)}" style="color:#5eead4;">${escapeHtml(email)}</a></td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #1e1e30;font-family:'Courier New',monospace;font-size:0.72rem;color:#50506a;text-transform:uppercase;letter-spacing:0.1em;">Subject</td>
            <td style="padding:10px 0;border-bottom:1px solid #1e1e30;color:#eeeeff;font-size:0.95rem;">${escapeHtml(subject)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-family:'Courier New',monospace;font-size:0.72rem;color:#50506a;text-transform:uppercase;letter-spacing:0.1em;vertical-align:top;padding-top:16px;">Message</td>
            <td style="padding:16px 0;color:#c0c0de;font-size:0.95rem;line-height:1.75;">${escapeHtml(message).replace(/\n/g, '<br/>')}</td>
          </tr>
        </table>
      </div>
      <!-- Footer -->
      <div style="padding:16px 32px;background:#06060a;border-top:1px solid #1e1e30;">
        <p style="margin:0;font-family:'Courier New',monospace;font-size:0.7rem;color:#50506a;">
          Sent via daggy-portfolio · ${new Date().toUTCString()}
        </p>
      </div>
    </div>
  `;

  /* ── Send to you ── */
  const mailToYou = {
    from:    `"Daggy Techs Portfolio" <${EMAIL_USER}>`,
    to:      TO_EMAIL,
    replyTo: `"${name}" <${email}>`,
    subject: `[Portfolio] ${subject} — from ${name}`,
    html:    htmlBody,
    text:    `New portfolio contact\n\nFrom: ${name} <${email}>\nSubject: ${subject}\n\n${message}`
  };

  /* ── Auto-reply to sender ── */
  const autoReply = {
    from:    `"Douglas Mwebi | Daggy Techs" <${EMAIL_USER}>`,
    to:      `"${name}" <${email}>`,
    subject: `Got your message — I'll be in touch soon`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#0c0c14;color:#e0e0f0;border-radius:12px;overflow:hidden;border:1px solid #2c2c48;">
        <div style="background:linear-gradient(135deg,#12121e,#1a1a2e);padding:24px 28px;border-bottom:1px solid #2c2c48;">
          <p style="font-family:'Courier New',monospace;font-size:0.72rem;color:#5eead4;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 5px;">[DT] Daggy Techs</p>
          <h2 style="margin:0;font-size:1.25rem;color:#eeeeff;">Thanks for reaching out, ${escapeHtml(name)}!</h2>
        </div>
        <div style="padding:24px 28px;line-height:1.75;color:#c0c0de;font-size:0.95rem;">
          <p>I've received your message and will get back to you as soon as possible — usually within 24 hours.</p>
          <p style="margin-top:16px;">In the meantime, feel free to check out my work on GitHub:</p>
          <p style="margin-top:8px;"><a href="https://github.com/mwebidouglas08-netizen" style="color:#5eead4;">github.com/mwebidouglas08-netizen</a></p>
          <hr style="border:none;border-top:1px solid #1e1e30;margin:24px 0;"/>
          <p style="font-size:0.85rem;color:#50506a;">Douglas Mwebi · Full-Stack Engineer · Kisii, Kenya<br/>
          <a href="mailto:mwebidouglas08@gmail.com" style="color:#5eead4;">mwebidouglas08@gmail.com</a></p>
        </div>
      </div>
    `,
    text: `Hi ${name},\n\nThanks for reaching out! I received your message and will reply within 24 hours.\n\nDouglas Mwebi\nFull-Stack Engineer · Daggy Techs\nmwebidouglas08@gmail.com`
  };

  try {
    await transporter.sendMail(mailToYou);
    console.log(`✅ Email delivered to ${TO_EMAIL}`);

    /* Auto-reply — don't fail the whole request if this errors */
    try {
      await transporter.sendMail(autoReply);
      console.log(`✅ Auto-reply sent to ${email}`);
    } catch (replyErr) {
      console.warn('⚠️  Auto-reply failed (non-critical):', replyErr.message);
    }

    return res.json({
      success: true,
      message: 'Message sent! Check your inbox — I\'ve also sent you a confirmation.'
    });

  } catch (sendErr) {
    console.error('❌ Send failed:', sendErr.message);
    console.error('   Code:', sendErr.code);
    return res.status(500).json({
      success: false,
      message: `Failed to send. Please email me directly at mwebidouglas08@gmail.com`
    });
  }
});

/* ── Health check ── */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    email_configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
    timestamp: new Date().toISOString()
  });
});

/* ── Utility: escape HTML ── */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

app.listen(PORT, () => {
  console.log(`🚀 Daggy Portfolio running on http://localhost:${PORT}`);
  console.log(`📧 Email configured: ${!!(process.env.EMAIL_USER && process.env.EMAIL_PASS)}`);
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️  Set EMAIL_USER and EMAIL_PASS in your .env to enable email delivery');
  }
});
