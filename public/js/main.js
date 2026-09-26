document.addEventListener('DOMContentLoaded', function () {
  var header = document.getElementById('siteHeader');
  window.addEventListener('scroll', function () {
    if (header) header.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  var menuBtn = document.getElementById('menuBtn');
  var mobileNav = document.getElementById('mobileNav');
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', function () {
      var open = mobileNav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mobileNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobileNav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Active nav highlighting
  var links = Array.prototype.slice.call(document.querySelectorAll('.main-nav a'));
  var sections = ['home', 'about', 'skills', 'experience', 'projects', 'contact']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id);
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { obs.observe(s); });
  }

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  // Contact form
  var form = document.getElementById('contactForm');
  var note = document.getElementById('formFeedback');
  var btn = document.getElementById('submitBtn');
  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var name = form.name.value.trim();
      var email = form.email.value.trim();
      var subject = form.subject.value.trim();
      var message = form.message.value.trim();

      function show(cls, msg) {
        note.hidden = false;
        note.className = 'form-note ' + cls;
        note.textContent = msg;
      }

      if (!name || !email || !subject || !message) { show('err', 'Please fill in all fields.'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { show('err', 'Please enter a valid email address.'); return; }

      btn.disabled = true;
      btn.textContent = 'Sending…';

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, email: email, subject: subject, message: message })
      })
        .then(function (res) { return res.json().catch(function () { return {}; }).then(function (j) { return { res: res, json: j }; }); })
        .then(function (out) {
          if (out.res.ok && out.json.success !== false) {
            show('ok', out.json.message || 'Thank you. Your message has been received.');
            form.reset();
          } else {
            show('err', (out.json && out.json.message) || 'Sorry, something went wrong. Please email mwebidouglas08@gmail.com directly.');
          }
        })
        .catch(function () {
          show('err', 'Could not reach the server. Please email mwebidouglas08@gmail.com directly.');
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = 'Send Message';
        });
    });
  }
});
