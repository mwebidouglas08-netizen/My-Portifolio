/* ══════════════════════════════════════════════
   DAGGY TECHS — Portfolio JS v3
   ══════════════════════════════════════════════ */

// ── Photo load error handling ──
window.addEventListener('DOMContentLoaded', () => {
  const heroPhoto    = document.getElementById('heroPhoto');
  const heroFallback = document.getElementById('heroFallback');
  const aboutPhoto   = document.getElementById('aboutPhoto');
  const aboutInitials= document.getElementById('aboutInitials');

  if (heroPhoto) {
    heroPhoto.addEventListener('error', () => {
      heroPhoto.style.display = 'none';
      if (heroFallback) heroFallback.style.display = 'flex';
    });
    // If already errored before DOMContentLoaded (cached failure)
    if (!heroPhoto.complete || heroPhoto.naturalWidth === 0) {
      heroPhoto.dispatchEvent(new Event('error'));
    }
  }

  if (aboutPhoto) {
    aboutPhoto.addEventListener('error', () => {
      aboutPhoto.style.display = 'none';
      if (aboutInitials) aboutInitials.style.display = 'flex';
    });
    if (!aboutPhoto.complete || aboutPhoto.naturalWidth === 0) {
      aboutPhoto.dispatchEvent(new Event('error'));
    }
  }
});

// ── Nav scroll ──
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('stuck', window.scrollY > 30);
}, { passive: true });

// ── Mobile burger ──
const burger  = document.getElementById('navBurger');
const mobileM = document.getElementById('navMobile');
burger.addEventListener('click', () => mobileM.classList.toggle('open'));
document.querySelectorAll('.mobile-link, .mobile-cta').forEach(l =>
  l.addEventListener('click', () => mobileM.classList.remove('open'))
);

// ── Hero entry animations ──
document.querySelectorAll('[data-anim]').forEach(el => {
  const delay = parseFloat(el.dataset.delay || 0) * 0.12;
  setTimeout(() => el.classList.add('go'), delay * 1000);
});

// ── Counter animation ──
function countUp(el, target, ms) {
  let start = null;
  const step = ts => {
    if (!start) start = ts;
    const p = Math.min((ts - start) / ms, 1);
    el.textContent = Math.round(p * target);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const cntObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const t = parseInt(e.target.dataset.count);
      if (!isNaN(t)) countUp(e.target, t, 1500);
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

// ── Active nav ──
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

if (form) {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const sbText = submitBtn.querySelector('.sb-text');
    const sbLoad = submitBtn.querySelector('.sb-load');
    const sbArr  = submitBtn.querySelector('.sb-arrow');
    fbEl.hidden = true; fbEl.className = 'cform-fb';
    submitBtn.disabled = true;
    sbText.hidden = true; sbLoad.hidden = false;
    if (sbArr) sbArr.hidden = true;

    try {
      const res  = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    form.name.value.trim(),
          email:   form.email.value.trim(),
          subject: form.subject.value.trim(),
          message: form.message.value.trim()
        })
      });
      const json = await res.json();
      fbEl.hidden = false;
      if (json.success) {
        fbEl.textContent = '✓ ' + json.message;
        fbEl.classList.add('ok'); form.reset();
      } else {
        fbEl.textContent = '✗ ' + json.message;
        fbEl.classList.add('err');
      }
    } catch {
      fbEl.hidden = false;
      fbEl.textContent = '✗ Network error — email mwebidouglas08@gmail.com directly.';
      fbEl.classList.add('err');
    } finally {
      submitBtn.disabled = false;
      sbText.hidden = false; sbLoad.hidden = true;
      if (sbArr) sbArr.hidden = false;
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
