document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  const nav = $('#nav');
  if (nav) window.addEventListener('scroll', () => nav.classList.toggle('stuck', window.scrollY > 50), { passive: true });

  const burger = $('#navBurger');
  const mobileMenu = $('#navMobile');
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      burger.setAttribute('aria-expanded', isOpen);
    });
    $$('.mobile-link', mobileMenu).forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const handlePhoto = (imgId, fallbackId) => {
    const img = $(`#${imgId}`);
    const fallback = $(`#${fallbackId}`);
    if (!img) return;
    const showFallback = () => { img.style.display = 'none'; if (fallback) fallback.style.display = 'flex'; };
    img.addEventListener('error', showFallback);
    if (img.complete && img.naturalWidth === 0) showFallback();
  };
  handlePhoto('aboutPhoto', 'aboutInitials');

  const reveals = $$('[data-reveal]');
  if (reveals.length) {
    const revObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const siblings = Array.from(entry.target.parentElement.querySelectorAll('[data-reveal]'));
        entry.target.style.transitionDelay = `${siblings.indexOf(entry.target) * 0.1}s`;
        entry.target.classList.add('in');
        revObs.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    reveals.forEach(el => revObs.observe(el));
  }

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

  if (window.matchMedia('(hover: hover)').matches) {
    $$('.spotlight-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      });
    });

    $$('.magnetic-btn').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - (rect.left + rect.width / 2)) * 0.2}px, ${(e.clientY - (rect.top + rect.height / 2)) * 0.2}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = 'translate(0, 0)'; });
    });
  }

  const yr = $('#yr');
  if (yr) yr.textContent = new Date().getFullYear();

  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const target = $(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });

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

      const showFeedback = (type, msg) => { fbEl.hidden = false; fbEl.className = `form-feedback ${type}`; fbEl.textContent = msg; };
      const setLoading = (on) => {
        submitBtn.disabled = on;
        const sbText = $('.sb-text', submitBtn);
        const sbLoad = $('.sb-load', submitBtn);
        const sbArr = $('.sb-arrow', submitBtn);
        if (sbText) sbText.hidden = on;
        if (sbLoad) sbLoad.hidden = !on;
        if (sbArr) sbArr.hidden = on;
      };

      fbEl.hidden = true; fbEl.className = 'form-feedback';
      if (!name) return showFeedback('err', '✗ Please enter your name.');
      if (!email) return showFeedback('err', '✗ Please enter your email address.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showFeedback('err', '✗ Please enter a valid email address.');
      if (!subject) return showFeedback('err', '✗ Please enter a subject.');
      if (!message) return showFeedback('err', '✗ Please enter your message.');

      setLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      try {
        const res = await fetch('/api/contact', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, subject, message }), signal: controller.signal
        });
        clearTimeout(timeoutId);
        const text = await res.text();
        let json;
        try { json = JSON.parse(text); } catch { throw new Error('server_error_' + res.status); }

        if (json.success) { showFeedback('ok', '✓ ' + json.message); form.reset(); } 
        else { showFeedback('err', '✗ ' + (json.message || 'Something went wrong.')); }
      } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') showFeedback('err', '✗ Request timed out.');
        else showFeedback('err', '✗ Server error. Please email mwebidouglas08@gmail.com directly.');
      } finally { setLoading(false); }
    });
  }
});
