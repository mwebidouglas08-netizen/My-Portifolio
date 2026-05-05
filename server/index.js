require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Rate limiting for contact form
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Contact form endpoint
app.post('/api/contact', contactLimiter, async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address.' });
  }

  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      await transporter.sendMail({
        from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        replyTo: email,
        subject: `[Portfolio] ${subject} — from ${name}`,
        html: `
          <div style="font-family: monospace; background: #09090b; color: #e4e4e7; padding: 32px; border-radius: 8px; border: 1px solid #27272a;">
            <h2 style="color: #22d3ee; margin-bottom: 24px;">New Contact Message</h2>
            <p><strong style="color:#71717a;">From:</strong> <span style="color:#f4f4f5;">${name}</span></p>
            <p><strong style="color:#71717a;">Email:</strong> <span style="color:#f4f4f5;">${email}</span></p>
            <p><strong style="color:#71717a;">Subject:</strong> <span style="color:#f4f4f5;">${subject}</span></p>
            <hr style="border-color:#27272a; margin: 24px 0;">
            <p style="color:#d4d4d8; line-height:1.6;">${message.replace(/\n/g, '<br>')}</p>
          </div>
        `
      });
    }

    console.log(`Contact form submission from ${name} <${email}>: ${subject}`);
    res.json({ success: true, message: 'Message received! I will get back to you shortly.' });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ success: false, message: 'Failed to send message. Please email me directly at daggytechs@gmail.com' });
  }
});

// Health check for Render
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Daggy Portfolio running on port ${PORT}`);
});
