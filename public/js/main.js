/* ══════════════════════════════════════════════
   DAGGY TECHS — Portfolio JS v5 (clean)
   ══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function () {

  /* ── Nav scroll ── */
  var nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', function () {
      nav.classList.toggle('stuck', window.scrollY > 30);
    }, { passive: true });
  }

  /* ── Mobile burger ── */
  var burger = document.getElementById('navBurger');
  var mMenu  = document.getElementById('navMobile');
  if (burger && mMenu) {
    burger.addEventListener('click', function () {
      mMenu.classList.toggle('open');
    });
    mMenu.querySelectorAll('.mobile-link, .mobile-cta').forEach(function (l) {
      l.addEventListener('click', function () { mMenu.classList.remove('open'); });
    });
  }

  /* ── Photo error handlers ── */
  function handlePhoto(imgId, fallbackId) {
    var img      = document.getElementById(imgId);
    var fallback = document.getElementById(fallbackId);
    if (!img) return;
    function showFallback() {
      img.style.display = 'none';
      if (fallback) fallback.style.display = 'flex';
    }
    img.addEventListener('error', showFallback);
    if (img.complete && img.naturalWidth === 0) showFallback();
  }
  handlePhoto('heroPhoto',  'heroFallback');
  handlePhoto('aboutPhoto', 'aboutInitials');

  /* ── Hero entry animations ── */
  document.querySelectorAll('[data-anim]').forEach(function (el) {
    var delay = parseFloat(el.getAttribute('data-delay') || 0) * 0.12;
    setTimeout(function () { el.classList.add('go'); }, delay * 1000);
  });

  /* ── Counter animation ── */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    var cntObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el     = e.target;
        var target = parseInt(el.getAttribute('data-count'), 10);
        cntObs.unobserve(el);
        var start = null;
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / 1500, 1);
          el.textContent = Math.round(p * target);
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cntObs.observe(el); });
  }

  /* ── Scroll reveal ── */
  var reveals = document.querySelectorAll('[data-reveal]');
  if (reveals.length) {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var siblings = Array.from(e.target.parentElement.querySelectorAll('[data-reveal]'));
        var idx = siblings.indexOf(e.target);
        e.target.style.transitionDelay = (idx * 0.08) + 's';
        e.target.classList.add('in');
        revObs.unobserve(e.target);
      });
    }, { threshold: 0.08 });
    reveals.forEach(function (el) { revObs.observe(el); });
  }

  /* ── Active nav on scroll ── */
  var sections = document.querySelectorAll('section[id]');
  var navLinks = document.querySelectorAll('.nav-links a[data-nav]');
  if (sections.length && navLinks.length) {
    var actObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.remove('active'); });
        var active = document.querySelector('.nav-links a[href="#' + e.target.id + '"]');
        if (active) active.classList.add('active');
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    sections.forEach(function (s) { actObs.observe(s); });
  }

  /* ── Footer year ── */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ── Smooth scroll ── */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    });
  });

  /* ════════════════════════════════════════
     CONTACT FORM
  ════════════════════════════════════════ */
  var form      = document.getElementById('contactForm');
  var submitBtn = document.getElementById('submitBtn');
  var fbEl      = document.getElementById('formFeedback');

  if (!form || !submitBtn || !fbEl) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    /* Read by name attribute — works on all browsers, no ID dependency */
    var nameVal    = (form.elements['name']    ? form.elements['name'].value    : '').trim();
    var emailVal   = (form.elements['email']   ? form.elements['email'].value   : '').trim();
    var subjectVal = (form.elements['subject'] ? form.elements['subject'].value : '').trim();
    var messageVal = (form.elements['message'] ? form.elements['message'].value : '').trim();

    function showFeedback(type, msg) {
      fbEl.hidden = false;
      fbEl.className = 'cform-fb ' + type;
      fbEl.textContent = msg;
    }

    function setLoading(on) {
      var sbText = submitBtn.querySelector('.sb-text');
      var sbLoad = submitBtn.querySelector('.sb-load');
      var sbArr  = submitBtn.querySelector('.sb-arr');
      submitBtn.disabled = on;
      if (sbText) sbText.hidden = on;
      if (sbLoad) sbLoad.hidden = !on;
      if (sbArr)  sbArr.hidden  = on;
    }

    /* Reset */
    fbEl.hidden = true;
    fbEl.className = 'cform-fb';
    fbEl.textContent = '';

    /* Validate one field at a time with specific messages */
    if (!nameVal) {
      showFeedback('err', '✗ Please enter your name.');
      return;
    }
    if (!emailVal) {
      showFeedback('err', '✗ Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      showFeedback('err', '✗ Please enter a valid email address.');
      return;
    }
    if (!subjectVal) {
      showFeedback('err', '✗ Please enter a subject.');
      return;
    }
    if (!messageVal) {
      showFeedback('err', '✗ Please write your message.');
      return;
    }

    /* All valid — send */
    setLoading(true);

    var controller = new AbortController();
    var tid = setTimeout(function () { controller.abort(); }, 20000);

    fetch('/api/contact', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        name:    nameVal,
        email:   emailVal,
        subject: subjectVal,
        message: messageVal
      }),
      signal: controller.signal
    })
    .then(function (res) {
      clearTimeout(tid);
      return res.text().then(function (text) {
        try { return JSON.parse(text); }
        catch (_) { throw new Error('server_error_' + res.status); }
      });
    })
    .then(function (json) {
      if (json.success) {
        showFeedback('ok', '✓ ' + json.message);
        form.reset();
      } else {
        showFeedback('err', '✗ ' + (json.message || 'Something went wrong. Please try again.'));
      }
    })
    .catch(function (err) {
      clearTimeout(tid);
      console.error('Contact form error:', err.name, err.message);
      if (err.name === 'AbortError') {
        showFeedback('err', '✗ Request timed out. Please try again.');
      } else if (err.message.indexOf('server_error') === 0) {
        showFeedback('err', '✗ Server error. Please email mwebidouglas08@gmail.com directly.');
      } else {
        showFeedback('err', '✗ Could not reach the server. Please email mwebidouglas08@gmail.com directly.');
      }
    })
    .finally(function () {
      setLoading(false);
    });
  });

}); // end DOMContentLoaded
