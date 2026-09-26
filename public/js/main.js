document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  // Sticky nav + back-to-top
  const nav = $('#nav');
  const toTop = $('#toTop');
  const onScroll = () => {
    const y = window.scrollY;
    if (nav) nav.classList.toggle('stuck', y > 40);
    if (toTop) toTop.classList.toggle('show', y > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // Mobile menu
  const burger = $('#navBurger');
  const mobile = $('#navMobile');
  if (burger && mobile) {
    burger.addEventListener('click', () => {
      const open = mobile.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    $$('.mobile-link', mobile).forEach((l) =>
      l.addEventListener('click', () => {
        mobile.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      })
    );
  }

  // Image fallbacks (hero + about)
  const handlePhoto = (imgId, fbId) => {
    const img = document.getElementById(imgId);
    const fb = document.getElementById(fbId);
    if (!img) return;
    const show = () => {
      img.style.display = 'none';
      if (fb) { fb.hidden = false; fb.style.display = 'flex'; }
    };
    img.addEventListener('error', show);
    if (img.complete && img.naturalWidth === 0) show();
  };
  handlePhoto('heroPhoto', 'heroInitials');
  handlePhoto('aboutPhoto', 'aboutInitials');

  // Reveal on scroll
  const reveals = $$('[data-reveal]');
  if ('IntersectionObserver' in window && reveals.length) {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const sibs = Array.from(e.target.parentElement ? e.target.parentElement.querySelectorAll('[data-reveal]') : []);
          const idx = Math.max(0, sibs.indexOf(e.target));
          e.target.style.transitionDelay = `${Math.min(idx, 6) * 0.08}s`;
          e.target.classList.add('in');
          obs.unobserve(e.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    reveals.forEach((el) => obs.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }

  // Animated counters (supports 105K+ style via data-count + static suffix)
  const counters = $$('[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    const cObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          cObs.unobserve(el);
          const target = parseInt(el.getAttribute('data-count'), 10);
          if (!Number.isFinite(target)) return;
          let start = null;
          const dur = 1400;
          const step = (ts) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = String(Math.round(eased * target));
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => cObs.observe(el));
  }

  // Active nav link
  const sections = $$('main section[id]');
  const navLinks = $$('.nav-links a[data-nav]');
  if ('IntersectionObserver' in window && sections.length && navLinks.length) {
    const aObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((a) => a.classList.remove('active'));
          const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
          if (active) active.classList.add('active');
        });
      },
      { rootMargin: '-35% 0px -60% 0px' }
    );
    sections.forEach((s) => aObs.observe(s));
  }

  // Spotlight + magnetic (desktop hover only)
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.spotlight-card').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', `${e.clientX - r.left}px`);
        card.style.setProperty('--mouse-y', `${e.clientY - r.top}px`);
      });
    });
    $$('.magnetic-btn').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * 0.15;
        const y = (e.clientY - (r.top + r.height / 2)) * 0.15;
        btn.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  // Footer year
  const yr = $('#yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  // Smooth anchor scroll (native fallback)
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const t = document.querySelector(id);
      if (t) {
        e.preventDefault();
        t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', id);
      }
    });
  });

  // Contact form
  const form = $('#contactForm');
  const submitBtn = $('#submitBtn');
  const fb = $('#formFeedback');
  if (form && submitBtn && fb) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = String(form.elements['name'] ? form.elements['name'].value : '').trim();
      const email = String(form.elements['email'] ? form.elements['email'].value : '').trim();
      const subject = String(form.elements['subject'] ? form.elements['subject'].value : '').trim();
      const message = String(form.elements['message'] ? form.elements['message'].value : '').trim();

      const show = (type, msg) => {
        fb.hidden = false;
        fb.className = `form-feedback ${type}`;
        fb.textContent = msg;
      };
      const loading = (on) => {
        submitBtn.disabled = on;
        submitBtn.style.opacity = on ? '.75' : '';
        submitBtn.style.pointerEvents = on ? 'none' : '';
        const t1 = $('.sb-text', submitBtn);
        const t2 = $('.sb-load', submitBtn);
        const arr = $('.sb-arrow', submitBtn);
        if (t1) t1.hidden = on;
        if (t2) t2.hidden = !on;
        if (arr) arr.style.display = on ? 'none' : '';
      };

      fb.hidden = true;
      fb.className = 'form-feedback';
      if (!name) return show('err', '✗ Please enter your name.');
      if (!email) return show('err', '✗ Please enter your email address.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return show('err', '✗ Please enter a valid email address.');
      if (!subject) return show('err', '✗ Please enter a subject.');
      if (message.length < 10) return show('err', '✗ Please tell me a little more (min 10 characters).');

      loading(true);
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 20000);
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, subject, message }),
          signal: ctrl.signal,
        });
        clearTimeout(tid);
        const text = await res.text();
        let json = null;
        try { json = JSON.parse(text); } catch { /* noop */ }
        if (!json) throw new Error(`server_error_${res.status}`);
        if (json.success) { show('ok', `✓ ${json.message}`); form.reset(); }
        else show('err', `✗ ${json.message || 'Something went wrong.'}`);
      } catch (err) {
        clearTimeout(tid);
        if (err && err.name === 'AbortError') show('err', '✗ Request timed out. Please try again.');
        else show('err', '✗ Server error. Please email mwebidouglas08@gmail.com directly.');
      } finally {
        loading(false);
      }
    });
  }
});
