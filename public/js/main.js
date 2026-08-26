/* ══════════════════════════════════════════════
   DAGGY TECHS — Premium Portfolio JS v4.0
   Web3 Animations · Spotlight Effects · Magnetic Buttons
   ══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  /* ── Navigation ── */
  const nav = $('#nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('stuck', window.scrollY > 50);
    }, { passive: true });
  }

  const burger = $('#navBurger');
  const mobileMenu = $('#navMobile');
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      burger.setAttribute('aria-expanded', isOpen);
    });
    $$('.mobile-link, .mobile-cta', mobileMenu).forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ── Image Fallbacks ── */
  const handlePhoto = (imgId, fallbackId) => {
    const img = $(`#${imgId}`);
    const fallback = $(`#${fallbackId}`);
    if (!img) return;
    const showFallback = () => {
      img.style.display = 'none';
      if (fallback) fallback.style.display = 'flex';
    };
    img.addEventListener('error', showFallback);
    if (img.complete && img.naturalWidth === 0) showFallback();
  };
  handlePhoto('aboutPhoto', 'aboutInitials');

  /* ── Scroll Reveal ── */
  const reveals = $$('[data-reveal]');
  if (reveals.length) {
    const revObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const siblings = Array.from(entry.target.parentElement.querySelectorAll('[data-reveal]'));
        const idx = siblings.indexOf(entry.target);
        entry.target.style.transitionDelay = `${idx * 0.1}s`;
        entry.target.classList.add('in');
        revObs.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    reveals.forEach(el => revObs.observe(el));
  }

  /* ── Counter Animation ── */
  const counters = $$('[data-count]');
  if (counters.length) {
    const cntObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-count'), 10);
        cntObs.unobserve(el);
        let start = null;
        const step = (ts) => {
          if (!start) start = ts;
          const progress = Math.min((ts - start) / 1500, 1);
          el.textContent = Math.round(progress * target);
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach(el => cntObs.observe(el));
  }

  /* ── Active Nav on Scroll ── */
  const sections = $$('section[id]');
  const navLinks = $$('.nav-links a[data-nav]');
  if (sections.length && navLinks.length) {
    const actObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(a => a.classList.remove('active'));
        const active = $(`.nav-links a[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      });
    }, { rootMargin: '-40% 0px -60% 0px' });
    sections.forEach(s => actObs.observe(s));
  }

  /* ── Spotlight Hover Effect ─ */
  if (window.matchMedia('(hover: hover)').matches) {
    $$('.spotlight-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    });
  }

  /* ── Magnetic Buttons ── */
  if (window.matchMedia('(hover: hover)').matches) {
    $$('.magnetic-btn').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - (rect.left + rect.width / 2);
        const y = e.clientY - (rect.top + rect.height / 2);
        btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0, 0)';
      });
    });
  }

  /* ── Footer Year ── */
  const yr = $('#yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ── Smooth Scroll ── */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const target = $(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ── Contact Form ─ */
  const form = $('#contactForm');
  const submitBtn = $('#submitBtn');
  const fbEl = $('#formFeedback');

  if (form && submitBtn && fbEl) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = form.elements['name'].value.trim();
      const email = form.elements['email'].value.trim();
      const subject = form.elements['subject'].value.trim();
      const message = form.elements['message'].value.trim();

      const showFeedback = (type, msg) => {
        fbEl.hidden = false;
        fbEl.className = `form-feedback ${type}`;
        fbEl.textContent = msg;
      };

      const setLoading = (on) => {
        const sbText = $('.sb-text', submitBtn);
        const sbLoad = $('.sb-load', submitBtn);
        const sbArr = $('.sb-arrow', submitBtn);
        submitBtn.disabled = on;
        if (sbText) sbText.hidden = on;
        if (sbLoad) sbLoad.hidden = !on;
        if (sbArr) sbArr.hidden = on;
      };

      fbEl.hidden = true;
      fbEl.className = 'form-feedback';

      if (!name) return showFeedback('err', '✗ Please enter your name.');
      if (!email) return showFeedback('err', '✗ Please enter your email address.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showFeedback('err', ' Please enter a valid email address.');
      if (!subject) return showFeedback('err', '✗ Please enter a subject.');
      if (!message) return showFeedback('err', '✗ Please enter your message.');

      setLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, subject, message }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        const text = await res.text();
        let json;
        try { json = JSON.parse(text); } catch { throw new Error('server_error_' + res.status); }

        if (json.success) {
          showFeedback('ok', '✓ ' + json.message);
          form.reset();
        } else {
          showFeedback('err', '✗ ' + (json.message || 'Something went wrong. Please try again.'));
        }
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('Contact form error:', err.message);
        if (err.name === 'AbortError') {
          showFeedback('err', ' Request timed out. Please try again.');
        } else if (err.message.includes('server_error')) {
          showFeedback('err', '✗ Server error. Please email mwebidouglas08@gmail.com directly.');
        } else {
          showFeedback('err', '✗ Could not reach the server. Please email mwebidouglas08@gmail.com directly.');
        }
      } finally {
        setLoading(false);
      }
    });
  }
});
