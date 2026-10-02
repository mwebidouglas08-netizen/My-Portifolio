document.addEventListener('DOMContentLoaded', function () {
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
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.links a[data-nav]'));
  var sections = ['work', 'patents', 'about', 'awards', 'contact']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  if ('IntersectionObserver' in window && navLinks.length && sections.length) {
    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id);
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { navObs.observe(s); });
  }

  // Subtle scroll reveal (elements hidden only via JS, so no-JS stays visible)
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealSel = '.work, .cap, .award, .quote, .steps li, .leader, .about-grid, .contact-grid, .w3-live';
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(revealSel));
  if ('IntersectionObserver' in window && revealEls.length) {
    revealEls.forEach(function (el) {
      var p = el.parentElement;
      var idx = p ? Array.prototype.indexOf.call(p.children, el) : 0;
      el.style.setProperty('--d', Math.min(idx, 6) * 0.07 + 's');
      el.classList.add('rv');
    });
    var rvObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        rvObs.unobserve(e.target);
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { rvObs.observe(el); });
  }

  // Typography motion: word-mask reveals + hero load choreography + role rotator
  function splitWords(el) {
    var index = 0;
    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var text = child.textContent;
          if (!text || !text.trim()) return;
          var frag = document.createDocumentFragment();
          text.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement('span'); w.className = 'w';
            var wi = document.createElement('span'); wi.className = 'wi';
            wi.textContent = part;
            wi.style.setProperty('--i', index++);
            w.appendChild(wi);
            frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && !child.classList.contains('flag') && !child.classList.contains('flag-patent')) {
          walk(child);
        }
      });
    }
    walk(el);
    el.classList.add('split');
  }

  var hero = document.querySelector('.hero');
  var heroH1 = document.querySelector('.hero-copy h1');
  if (!reduce && hero) {
    if (heroH1) splitWords(heroH1);
    hero.classList.add('anim');
    void hero.offsetWidth; // commit the initial hidden state before revealing
    var heroGo = function () {
      hero.classList.add('go');
      if (heroH1) heroH1.classList.add('go');
    };
    if (document.fonts && document.fonts.ready) {
      var fontsTimer = setTimeout(heroGo, 800);
      document.fonts.ready.then(function () {
        clearTimeout(fontsTimer);
        requestAnimationFrame(function () { requestAnimationFrame(heroGo); });
      });
    } else {
      requestAnimationFrame(heroGo);
    }
  }

  var splitTargets = Array.prototype.slice.call(document.querySelectorAll('.h2, .banner span'));
  if (!reduce && 'IntersectionObserver' in window && splitTargets.length) {
    var spObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('go');
        spObs.unobserve(e.target);
      });
    }, { threshold: 0.2 });
    splitTargets.forEach(function (el) {
      splitWords(el);
      spObs.observe(el);
    });
  }

  var rotTrack = document.getElementById('rotTrack');
  if (rotTrack && !reduce && rotTrack.children.length > 1) {
    var rotCount = rotTrack.children.length;
    var rotIdx = 0;
    setInterval(function () {
      rotIdx = (rotIdx + 1) % rotCount;
      rotTrack.style.transform = 'translateY(-' + rotIdx * (100 / rotCount) + '%)';
    }, 2600);
  }

  var progress = document.getElementById('progress');
  if (progress) {
    var updateProgress = function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      progress.style.transform = 'scaleX(' + p + ')';
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
  }

  // Cinematic hero parallax: the portrait backdrop lags the scroll (reduced-motion aware)
  var heroBg = document.querySelector('.hero-bg');
  if (heroBg && !reduce && window.matchMedia('(min-width: 701px)').matches) {
    var pTick = false;
    var parallax = function () {
      if (pTick) return;
      pTick = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y < 1400) heroBg.style.transform = 'translate3d(0,' + (y * 0.1) + 'px,0)';
        pTick = false;
      });
    };
    window.addEventListener('scroll', parallax, { passive: true });
    parallax();
  }

  // Project build-note expanders
  document.querySelectorAll('[data-more]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var card = btn.closest('.work-body');
      var more = card ? card.querySelector('.more') : null;
      if (!more) return;
      var willOpen = more.hidden;
      more.hidden = !willOpen;
      btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      btn.textContent = willOpen ? 'Build notes –' : 'Build notes +';
    });
  });

  // Animated metric counters (once, on first view; static values stay for reduced motion)
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  if (!reduce && 'IntersectionObserver' in window && counters.length) {
    var cObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        cObs.unobserve(e.target);
        var el = e.target;
        var target = parseInt(el.getAttribute('data-count'), 10);
        var suffix = el.getAttribute('data-suffix') || '';
        var comma = el.getAttribute('data-comma') === '1';
        if (!isFinite(target)) return;
        var start = null;
        var dur = 1200;
        function fmt(n) { return comma ? n.toLocaleString('en-US') : String(n); }
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = fmt(Math.round(eased * target)) + suffix;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cObs.observe(el); });
  }

  // Back to top
  var toTop = document.getElementById('toTop');
  if (toTop) {
    window.addEventListener('scroll', function () {
      toTop.classList.toggle('show', window.scrollY > 600);
    }, { passive: true });
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Portrait fallback to initials if photo missing
  ['heroPhoto', 'aboutPhoto'].forEach(function (id) {
    var img = document.getElementById(id);
    if (!img) return;
    img.addEventListener('error', function () {
      var box = document.createElement('div');
      box.textContent = 'DM';
      box.setAttribute('style', 'display:flex;align-items:center;justify-content:center;font-family:\'Instrument Serif\',Georgia,serif;font-size:64px;color:#0c0a08;background:#e4f222;aspect-ratio:4/4.2;width:100%;');
      img.replaceWith(box);
    });
  });

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

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
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (j) { return { res: res, json: j }; });
        })
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
          btn.textContent = 'Send message';
        });
    });
  }
});
