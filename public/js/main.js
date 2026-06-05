/* ══════════════════════════════════════════════
   DAGGY TECHS — Portfolio JS v4
   ══════════════════════════════════════════════ */

// ── Nav scroll ──
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('stuck', window.scrollY > 30);
}, { passive: true });

// ── Mobile burger ──
const burger  = document.getElementById('navBurger');
const mobileM = document.getElementById('navMobile');
if (burger && mobileM) {
  burger.addEventListener('click', () => mobileM.classList.toggle('open'));
  document.querySelectorAll('.mobile-link, .mobile-cta').forEach(l =>
    l.addEventListener('click', () => mobileM.classList.remove('open'))
  );
}

// ── Photo load error handling ──
window.addEventListener('DOMContentLoaded', () => {
  function handleImg(imgId, fallbackId) {
    const img      = document.getElementById(imgId);
    const fallback = document.getElementById(fallbackId);
    if (!img) return;
    const show = () => {
      img.style.display = 'none';
      if (fallback) { fallback.style.display = 'flex'; }
    };
    img.addEventListener('error', show);
    if (img.complete && img.naturalWidth === 0) show();
  }
  handleImg('heroPhoto',  'heroFallback');
  handleImg('aboutPhoto', 'aboutInitials');
});

// ── Hero entry animations ──
document.querySelectorAll('[data-anim]').forEach(el => {
  const delay = parseFloat(el.dataset.delay || 0) * 0.12;
  setTimeout(() => el.classList.add('go'), delay * 1000);
});

// ── Counter animation ──
function countUp(el, target, ms) {
  let start = null;
  (function step(ts) {
    if (!start) start = ts;
    const p = Math.min((ts - start) / ms, 1);
    el.textContent = Math.round(p * target);
    if (p < 1) requestAnimationFrame(step);
  })(0);
  requestAnimationFrame(function step(ts) {
    if (!start) start = ts;
    const p = Math.min((ts - start) / ms, 1);
    el.textContent = Math.round(p * target);
    if (p < 1) requestAnimationFrame(step);
  });
}
const cntObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const t = parseInt(e.target.dataset.count);
      if (!isNaN(t)) {
        let start = null;
        requestAnimationFrame(function step(ts) {
          if (!start) start = ts;
          const p = Math.min((ts - start) / 1500, 1);
          e.target.textContent = Math.round(p * t);
          if (p < 1) requestAnimationFrame(step);
        });
      }
      cntObs.unobserve(e.target);
    }
  });
}, { threshold: 0.6 });
document.querySelectorAll('[data-count]').forEach(el => cntObs.observe(el));

// ── Scroll reveal ──
const revObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const siblings = [...e.target.parentElement.querySelectorAll('[data-reveal]')];
      const idx = siblings.indexOf(e.target);
      e.target.style.transitionDelay = `${idx * 0.08}s`;
      e.target.classList.add('in');
      revObs.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });
document.querySelectorAll('[data-reveal]').forEach(el => revObs.observe(el));

// ── Active nav link on scroll ──
const sections = document.querySelectorAll('section[id]');
const navAs    = document.querySelectorAll('.nav-links a[data-nav]');
const actObs   = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navAs.forEach(a => a.classList.remove('active'));
      const a = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
      if (a) a.classList.add('active');
    }
  });
}, { rootMargin: '-35% 0px -55% 0px' });
sections.forEach(s => actObs.observe(s));

// ── Footer year ──
const yr = document.getElementById('yr');
if (yr) yr.textContent = new Date().getFullYear();

// ── Contact form ──
const form      = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const fbEl      = document.getElementById('formFeedback');

if (form && submitBtn && fbEl) {
  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const sbText = submitBtn.querySelector('.sb-text');
    const sbLoad = submitBtn.querySelector('.sb-load');
    const sbArr  = submitBtn.querySelector('.sb-arr');

    // Reset UI
    fbEl.hidden = true;
    fbEl.className = 'cform-fb';
    fbEl.textContent = '';
    submitBtn.disabled = true;
    if (sbText) sbText.hidden = true;
    if (sbLoad) sbLoad.hidden = false;
    if (sbArr)  sbArr.hidden  = true;

    // Collect values
    const payload = {
      name:    (document.getElementById('fname')?.value    || '').trim(),
      email:   (document.getElementById('femail')?.value   || '').trim(),
      subject: (document.getElementById('fsubject')?.value || '').trim(),
      message: (document.getElementById('fmsg')?.value     || '').trim()
    };

    // Client-side validation
    if (!payload.name || !payload.email || !payload.subject || !payload.message) {
      show('err', '✗ Please fill in all fields.');
      reset(); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      show('err', '✗ Please enter a valid email address.');
      reset(); return;
    }

    // Send
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 20000);

      let res;
      try {
        res = await fetch('/api/contact', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
          signal:  controller.signal
        });
      } finally {
        clearTimeout(tid);
      }

      // Parse response text safely
      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        console.error('Non-JSON response:', res.status, text.slice(0, 200));
        show('err', `✗ Server error (${res.status}). Please email mwebidouglas08@gmail.com directly.`);
        reset(); return;
      }

      if (json.success) {
        show('ok', '✓ ' + json.message);
        form.reset();
      } else {
        show('err', '✗ ' + (json.message || 'Something went wrong. Please try again.'));
      }

    } catch (err) {
      console.error('Fetch error:', err.name, err.message);
      if (err.name === 'AbortError') {
        show('err', '✗ Request timed out. Please check your connection and try again.');
      } else {
        show('err', '✗ Could not reach the server. Make sure the server is running, or email mwebidouglas08@gmail.com directly.');
      }
    } finally {
      reset();
    }

    function show(type, msg) {
      fbEl.hidden = false;
      fbEl.className = 'cform-fb ' + type;
      fbEl.textContent = msg;
    }
    function reset() {
      submitBtn.disabled = false;
      if (sbText) sbText.hidden = false;
      if (sbLoad) sbLoad.hidden = true;
      if (sbArr)  sbArr.hidden  = false;
    }
  });
}

// ── Smooth scroll ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
  });
});
