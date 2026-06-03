/* ══════════════════════════════════════════════
   DAGGY TECHS — Portfolio JS
   ══════════════════════════════════════════════ */

// ── Animated canvas background (particles + lines) ──
(function () {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], RAF;

  const COLORS = ['#6ee7f7', '#a78bfa', '#38bdf8'];
  const COUNT = 70;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function Particle() {
    this.reset = function () {
      this.x  = Math.random() * W;
      this.y  = Math.random() * H;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.r  = Math.random() * 1.5 + 0.4;
      this.c  = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.a  = Math.random() * 0.5 + 0.15;
    };
    this.reset();
  }

  function init() {
    particles = [];
    for (let i = 0; i < COUNT; i++) {
      const p = new Particle();
      particles.push(p);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // draw connecting lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(110,231,247,${0.06 * (1 - dist / 130)})`;
          ctx.lineWidth = 0.8;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // draw particles
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.c + Math.round(p.a * 255).toString(16).padStart(2, '0');
      ctx.fill();

      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;
    });

    RAF = requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); });
  resize();
  init();
  draw();
})();


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
function runHeroAnims() {
  const items = document.querySelectorAll('[data-anim]');
  items.forEach(el => {
    const delay = parseFloat(el.dataset.delay || 0) * 0.13;
    const anim  = el.dataset.anim;
    const nameMap = {
      'fade-up'  : 'animFadeUp',
      'fade-left': 'animFadeLeft',
      'pop'      : 'animPop'
    };
    el.style.setProperty('--anim-name', nameMap[anim] || 'animFadeUp');
    setTimeout(() => el.classList.add('visible'), delay * 1000);
  });
}
runHeroAnims();


// ── Counter animation for hero stats ──
function animCount(el, target, duration) {
  let start = null;
  function step(ts) {
    if (!start) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    el.textContent = Math.round(progress * target);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const target = parseInt(e.target.dataset.count);
      if (!isNaN(target)) animCount(e.target, target, 1400);
      counterObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));


// ── Scroll reveal ──
const revealObs = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      const siblings = [...e.target.parentElement.querySelectorAll('[data-reveal]')];
      const idx = siblings.indexOf(e.target);
      e.target.style.transitionDelay = `${idx * 0.07}s`;
      e.target.classList.add('in');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('[data-reveal]').forEach(el => revealObs.observe(el));


// ── Active nav link ──
const sections = document.querySelectorAll('section[id]');
const navAs    = document.querySelectorAll('.nav-links a[data-nav]');
const activeObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navAs.forEach(a => a.classList.remove('active'));
      const active = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { rootMargin: '-35% 0px -55% 0px' });
sections.forEach(s => activeObs.observe(s));


// ── Footer year ──
const yrEl = document.getElementById('yr');
if (yrEl) yrEl.textContent = new Date().getFullYear();


// ── Contact form ──
const form     = document.getElementById('contactForm');
const submitBtn= document.getElementById('submitBtn');
const feedback = document.getElementById('formFeedback');

if (form) {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const sbText = submitBtn.querySelector('.sb-text');
    const sbLoad = submitBtn.querySelector('.sb-load');
    const sbArr  = submitBtn.querySelector('.sb-arrow');

    feedback.hidden = true;
    feedback.className = 'cform-feedback';
    submitBtn.disabled = true;
    sbText.hidden = true;
    sbLoad.hidden = false;
    if (sbArr) sbArr.hidden = true;

    const body = {
      name:    form.name.value.trim(),
      email:   form.email.value.trim(),
      subject: form.subject.value.trim(),
      message: form.message.value.trim()
    };

    try {
      const res  = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      feedback.hidden = false;
      if (json.success) {
        feedback.textContent = '✓ ' + json.message;
        feedback.classList.add('ok');
        form.reset();
      } else {
        feedback.textContent = '✗ ' + json.message;
        feedback.classList.add('err');
      }
    } catch {
      feedback.hidden = false;
      feedback.textContent = '✗ Network error — email mwebidouglas08@gmail.com directly.';
      feedback.classList.add('err');
    } finally {
      submitBtn.disabled = false;
      sbText.hidden = false;
      sbLoad.hidden = true;
      if (sbArr) sbArr.hidden = false;
    }
  });
}


// ── Smooth anchor scroll ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
  });
});
