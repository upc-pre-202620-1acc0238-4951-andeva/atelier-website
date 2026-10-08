/**
 * Atelier Workshop - landing behaviour.
 * Sections: helpers, theme, i18n, install links, scroll effects,
 * live telemetry, intro animation, boot.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');
  // Capture mode for tests: ?shot shows all content, no intro, no reveal
  if (location.search.indexOf('shot') !== -1) root.classList.add('is-shot', 'is-ready');

  var BLUE = '#0071eb';
  var EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
  var EASE_IO = 'cubic-bezier(0.77, 0, 0.175, 1)';
  var HAS_IO = 'IntersectionObserver' in window;

  var renderPricing = function () {};
  var currentLang = function () { return root.getAttribute('lang') || 'es'; };

  /* ---------- Helpers ---------- */
  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) {}
    return null;
  }

  function wrapWords(text, extraClass) {
    return text.replace(/(\S+)/g, '<span class="lit-word' + (extraClass ? ' ' + extraClass : '') + '">$1</span>');
  }

  /* ============================================================
     THEME (light / dark)
     ============================================================ */
  function initTheme() {
    var toggle = document.getElementById('themeToggle');
    var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

    function apply(theme) {
      root.setAttribute('data-theme', theme);
      store('atelier-theme', theme);
      if (toggle) toggle.setAttribute('aria-label', theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    }

    // ?theme=light|dark forces a theme (useful for captures and QA)
    var forced = (location.search.match(/[?&]theme=(light|dark)/) || [])[1];
    apply(forced || store('atelier-theme') || (mq && mq.matches ? 'dark' : 'light'));

    if (toggle) {
      toggle.addEventListener('click', function () {
        apply(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
      });
    }
    if (mq) {
      mq.addEventListener('change', function (e) {
        if (!store('atelier-theme')) apply(e.matches ? 'dark' : 'light');
      });
    }
  }

  /* ============================================================
     i18n (ES / EN) - dictionary lives in i18n.js
     ============================================================ */
  function initI18n() {
    if (typeof ATELIER_I18N === 'undefined') return;
    var langToggle = document.getElementById('langToggle');
    var current = store('atelier-lang') || 'es';

    function apply(lang) {
      current = lang;
      root.setAttribute('lang', lang);
      store('atelier-lang', lang);

      var dict = ATELIER_I18N[lang] || ATELIER_I18N.es;
      document.querySelectorAll('[data-i18n]').forEach(function (el) {
        var text = dict[el.getAttribute('data-i18n')];
        if (text) el.textContent = text;
      });

      document.querySelector('.lang-opt--es').classList.toggle('is-active', lang === 'es');
      document.querySelector('.lang-opt--en').classList.toggle('is-active', lang === 'en');

      // The hero lead is split in words for the lit-text effect: rebuild it
      var lit = document.querySelector('.lit-text');
      if (lit && dict['hero.lead']) lit.innerHTML = wrapWords(dict['hero.lead'], 'lit');
      renderPricing();
    }

    apply(current);
    if (langToggle) langToggle.addEventListener('click', function () { apply(current === 'es' ? 'en' : 'es'); });
  }

  /* ============================================================
     INSTALL LINKS & PWA - URLs come from config.js (ATELIER_CONFIG)
     ============================================================ */
  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    document.querySelectorAll('[data-install="web"]').forEach(function (btn) {
      btn.classList.remove('is-soon');
      btn.removeAttribute('aria-disabled');
    });
  });

  function initInstallLinks() {
    var cfg = window.ATELIER_CONFIG || {};
    document.querySelectorAll('[data-install]').forEach(function (a) {
      var type = a.getAttribute('data-install');
      var url = cfg[type + 'Url'];
      if (url) {
        a.setAttribute('href', url);
        if (/^https?:/i.test(url)) { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); }
      } else if (type === 'web') {
        a.addEventListener('click', function (e) {
          if (deferredPrompt) {
            e.preventDefault();
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(function () { deferredPrompt = null; });
          } else {
            // Si no hay PWA prompt ni URL, abre el modal de demo
            e.preventDefault();
            openModal('pro');
          }
        });
      } else {
        // Not published yet: keep the button but make it inert
        a.setAttribute('aria-disabled', 'true');
        a.classList.add('is-soon');
        a.addEventListener('click', function (e) { e.preventDefault(); });
      }
    });
  }

  function initServiceWorker() {
    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('./sw.js').catch(function (err) {
          console.warn('SW registration failed:', err);
        });
      });
    }
  }

  /* ============================================================
     DRAWER MÓVIL
     ============================================================ */
  function initMobileDrawer() {
    var menuBtn = document.getElementById('mobileMenuBtn');
    var drawer = document.getElementById('mobileDrawer');
    var closeBtn = document.getElementById('mobileDrawerClose');
    var backdrop = document.getElementById('drawerBackdrop');
    if (!menuBtn || !drawer || !backdrop) return;

    function openDrawer() {
      drawer.classList.add('is-open');
      backdrop.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      menuBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
      drawer.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      menuBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    menuBtn.addEventListener('click', openDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    backdrop.addEventListener('click', closeDrawer);

    drawer.querySelectorAll('.drawer-link').forEach(function (link) {
      link.addEventListener('click', closeDrawer);
    });

    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
    });
  }

  /* ============================================================
     MODAL DEMO
     ============================================================ */
  var demoModal = document.getElementById('demoModal');
  var formView = document.getElementById('modalFormView');
  var successView = document.getElementById('modalSuccessView');
  var planSelect = document.getElementById('demoPlan');

  function openModal(plan) {
    if (!demoModal) return;
    if (plan && planSelect) planSelect.value = plan;
    if (formView) formView.style.display = 'block';
    if (successView) successView.style.display = 'none';
    demoModal.classList.add('is-open');
    demoModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var firstInput = demoModal.querySelector('input');
    if (firstInput) setTimeout(function () { firstInput.focus(); }, 100);
  }

  function closeModal() {
    if (!demoModal) return;
    demoModal.classList.remove('is-open');
    demoModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function initDemoModal() {
    if (!demoModal) return;
    var closeBtn = document.getElementById('modalCloseBtn');
    var successCloseBtn = document.getElementById('modalSuccessCloseBtn');
    var form = document.getElementById('demoForm');

    document.querySelectorAll('[data-open-modal="demo"]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var plan = btn.getAttribute('data-plan') || 'pro';
        openModal(plan);
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (successCloseBtn) successCloseBtn.addEventListener('click', closeModal);

    demoModal.addEventListener('click', function (e) {
      if (e.target === demoModal) closeModal();
    });

    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && demoModal.classList.contains('is-open')) closeModal();
    });

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var submitBtn = document.getElementById('modalSubmitBtn');
        if (submitBtn) {
          submitBtn.setAttribute('disabled', 'true');
          submitBtn.style.opacity = '0.7';
        }
        setTimeout(function () {
          if (formView) formView.style.display = 'none';
          if (successView) successView.style.display = 'flex';
          form.reset();
          if (submitBtn) {
            submitBtn.removeAttribute('disabled');
            submitBtn.style.opacity = '';
          }
        }, 600);
      });
    }
  }

  /* ============================================================
     PRICING - monthly / annual toggle and free-trial links
     ============================================================ */
  function initPricing() {
    var billing = 'monthly';
    var opts = document.querySelectorAll('[data-billing]');

    renderPricing = function () {
      var dict = (typeof ATELIER_I18N !== 'undefined' && (ATELIER_I18N[currentLang()] || ATELIER_I18N.es)) || {};
      document.querySelectorAll('.price-card .val[data-monthly]').forEach(function (el) {
        el.textContent = el.getAttribute(billing === 'annual' ? 'data-annual' : 'data-monthly');
      });
      document.querySelectorAll('[data-note]').forEach(function (el) {
        var kind = el.getAttribute('data-note');
        var text = '';
        if (kind === 'custom') text = dict['pricing.note_custom'] || '';
        else if (billing === 'annual') {
          text = (dict['pricing.note_annual'] || '').replace('{total}', el.getAttribute('data-total')).replace('{save}', el.getAttribute('data-save'));
        } else text = dict['pricing.note_monthly'] || '';
        el.textContent = text;
      });
      opts.forEach(function (b) {
        var on = b.getAttribute('data-billing') === billing;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    };

    opts.forEach(function (b) {
      b.addEventListener('click', function () {
        billing = b.getAttribute('data-billing');
        renderPricing();
      });
    });

    // Free trial: sends the visitor to the main app keeping plan and billing frequency
    document.querySelectorAll('[data-trial]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var plan = btn.getAttribute('data-plan');
        var base = (window.ATELIER_CONFIG || {}).signupUrl;
        if (!base) { openModal(plan); return; }
        var url = base + (base.indexOf('?') === -1 ? '?' : '&') +
          'plan=' + encodeURIComponent(plan) + '&billing=' + billing + '&trial=14';
        window.open(url, '_blank', 'noopener');
      });
    });

    renderPricing();
  }

  /* ============================================================
     WHATSAPP FLOAT
     ============================================================ */
  function initWhatsApp() {
    var waBtn = document.getElementById('waFloat');
    if (!waBtn) return;
    var cfg = window.ATELIER_CONFIG || {};
    var num = cfg.whatsappNumber || '51999999999';
    var msg = encodeURIComponent(cfg.whatsappMessage || 'Hola, me interesa conocer más sobre Atelier Workshop para mi taller.');
    waBtn.setAttribute('href', 'https://wa.me/' + num + '?text=' + msg);
  }

  /* ============================================================
     FAQ ACCORDION (Ultra-Smooth Animation)
     ============================================================ */
  function initFAQ() {
    var items = document.querySelectorAll('.faq__item');
    items.forEach(function (item) {
      var btn = item.querySelector('.faq__q');
      if (!btn) return;

      btn.addEventListener('click', function () {
        var isOpen = item.classList.contains('is-open');

        // Close other open FAQ items for a clean single-open accordion feel
        items.forEach(function (other) {
          if (other !== item && other.classList.contains('is-open')) {
            other.classList.remove('is-open');
            var otherBtn = other.querySelector('.faq__q');
            if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          }
        });

        if (isOpen) {
          item.classList.remove('is-open');
          btn.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ============================================================
     SCROLL EFFECTS
     ============================================================ */
  function initReveal() {
    var items = document.querySelectorAll('.reveal:not([data-hero])');
    if (!HAS_IO) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* Decorative hexagon that rotates with scroll (1 degree per ~40px) */
  function initScrollHex() {
    var hex = document.getElementById('scrollHex');
    if (!hex) return;
    var lastY = 0, angle = 0, raf = null;
    function tick() {
      var y = window.scrollY;
      angle += (y - lastY) * 0.025;
      lastY = y;
      hex.style.transform = 'rotate(' + angle + 'deg)';
      raf = null;
    }
    window.addEventListener('scroll', function () {
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
  }

  /* Hero lead: words light up one by one when it enters the viewport */
  function initLitText() {
    var els = document.querySelectorAll('.lit-text');
    els.forEach(function (el) {
      if (!el.querySelector('.lit-word')) el.innerHTML = wrapWords(el.innerHTML);
      var words = Array.prototype.slice.call(el.querySelectorAll('.lit-word'));
      if (!HAS_IO) {
        words.forEach(function (w) { w.classList.add('lit'); });
        return;
      }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          words.forEach(function (w, i) { setTimeout(function () { w.classList.add('lit'); }, i * 38); });
        });
      }, { threshold: 0.3 });
      io.observe(el);
    });
  }

  /* Stats: count from 0 to data-count-to */
  function initCounters() {
    if (!HAS_IO) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var el = e.target;
        var target = parseFloat(el.getAttribute('data-count-to'));
        var suffix = el.getAttribute('data-count-suffix') || '';
        var isFloat = target % 1 !== 0;
        var duration = 1200;
        var start = performance.now();
        function frame(now) {
          var progress = Math.min((now - start) / duration, 1);
          var value = target * (1 - Math.pow(1 - progress, 3)); // ease-out cubic
          if (progress < 1) {
            el.textContent = (isFloat ? value.toFixed(1) : Math.floor(value)) + suffix;
            requestAnimationFrame(frame);
          } else {
            el.textContent = (isFloat ? target.toFixed(1) : target) + suffix;
          }
        }
        requestAnimationFrame(frame);
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-count-to]').forEach(function (el) { io.observe(el); });
  }

  function initNav() {
    var nav = document.getElementById('nav');
    function onScroll() { nav.classList.toggle('is-scrolled', window.scrollY > 8); }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ============================================================
     LIVE TELEMETRY (decorative, fake data)
     ============================================================ */
  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function initLiveTelemetry() {
    // Work-order timer on the phone mockup (starts at 01:24:10)
    var timer = document.querySelector('.ps-timer');
    if (timer) {
      var seconds = 84 * 60 + 10;
      setInterval(function () {
        seconds++;
        timer.textContent = pad(Math.floor(seconds / 3600)) + ':' + pad(Math.floor((seconds % 3600) / 60)) + ':' + pad(seconds % 60);
      }, 1000);
    }

    // OBD-II bars on the phone
    var bars = document.querySelectorAll('.ps-bars i');
    if (bars.length) {
      setInterval(function () {
        bars.forEach(function (bar) { bar.style.height = Math.floor(Math.random() * 55 + 30) + '%'; });
      }, 950);
    }

    // Readout tile: RPM, coolant, battery
    var rpm  = document.querySelector('.readout div:nth-child(2) b');
    var temp = document.querySelector('.readout div:nth-child(3) b');
    var volt = document.querySelector('.readout div:nth-child(4) b');
    if (rpm || temp || volt) {
      setInterval(function () {
        if (rpm) rpm.textContent = 775 + Math.floor(Math.random() * 18);
        if (temp && Math.random() > 0.6) temp.textContent = (92 + (Math.random() > 0.5 ? 1 : 0)) + ' °C';
        if (volt && Math.random() > 0.5) volt.textContent = (13.7 + Math.random() * 0.2).toFixed(1) + ' V';
      }, 1400);
    }
  }

  /* ============================================================
     INTRO
     wheel appears -> slides left -> spins 180 + letters come out ->
     lockup flies to the nav -> wheel spins 180 more, fades, real logo enters
     ============================================================ */
  function revealHero() {
    document.querySelectorAll('[data-hero]').forEach(function (el) {
      var i = Number(el.getAttribute('data-hero')) || 0;
      setTimeout(function () { el.classList.add('in'); }, i * 90);
    });
  }

  function finish() {
    root.classList.add('is-ready');
    revealHero();
  }

  function playIntro() {
    var logo = document.getElementById('introLogo');
    var bg   = document.getElementById('introBg');
    var intro = document.getElementById('intro');
    if (!logo || !bg || !intro) { finish(); return; }

    var inner   = logo.querySelector('.logo__inner');
    var hex     = logo.querySelector('.logo__hex');
    var letters = Array.prototype.slice.call(logo.querySelectorAll('.ltr'));
    if (!hex || !inner || letters.length === 0) { finish(); return; }

    /* Scale the 1020x263 lockup to the viewport and centre it */
    var vw = window.innerWidth, vh = window.innerHeight;
    var k = Math.min(vw * (vw < 700 ? 0.8 : 0.62), 760) / 1020;
    logo.style.setProperty('--k', k);
    logo.style.left = (vw - 1020 * k) / 2 + 'px';
    logo.style.top  = (vh - 263 * k) / 2 + 'px';

    /* Animation bookkeeping */
    var anims = [];
    function run(el, keyframes, opts) {
      var a = el.animate(keyframes, Object.assign({ fill: 'both' }, opts));
      anims.push(a);
      return a;
    }

    var done = false;
    var safety = setTimeout(skip, 8000);
    function complete() {
      if (done) return;
      done = true;
      clearTimeout(safety);
      finish();
    }
    function skip() {
      anims.forEach(function (a) { try { a.finish(); } catch (e) {} });
      complete();
    }
    intro.addEventListener('click', skip);
    window.addEventListener('keydown', skip, { once: true });

    /* Wheel starts centred: shift the inner box by (lockup centre - wheel centre) */
    var shift = 1020 / 2 - 240 / 2;
    function innerAt(x) { return 'scale(' + k + ') translateX(' + x + 'px)'; }

    letters.forEach(function (l) { l.style.opacity = '0'; });

    /* Timings (ms) */
    var D_IN    = 500;
    var T_SLIDE = 500,  D_SLIDE = 520;
    var T_ROT   = T_SLIDE + D_SLIDE, D_ROT = 1000;
    var T_LET   = T_ROT + D_ROT - 150, D_LET = 680, STAG = 70;
    var T_FLY   = T_LET + 6 * STAG + D_LET + 160, D_FLY = 800;
    var T_LAND  = T_FLY + D_FLY, D_SPIN = 800, D_FADE = 500;

    /* 1) Wheel appears still, in the centre */
    run(inner, [{ transform: innerAt(shift) }, { transform: innerAt(shift) }],
      { duration: T_SLIDE + 10, easing: 'linear' });
    run(hex, [
      { opacity: 0, transform: 'rotate(0deg) scale(.6)' },
      { opacity: 1, transform: 'rotate(0deg) scale(1)' }
    ], { duration: D_IN, easing: EASE_OUT });

    /* 2) Wheel slides to the left */
    run(inner, [{ transform: innerAt(shift) }, { transform: innerAt(0) }],
      { duration: D_SLIDE, delay: T_SLIDE, easing: EASE_IO });

    /* 3) Spins 180 degrees, then the letters come out one by one */
    run(hex, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(180deg)' }],
      { duration: D_ROT, delay: T_ROT, easing: EASE_IO, fill: 'forwards' });

    letters.forEach(function (l, i) {
      var x = Number(l.style.getPropertyValue('--x'));
      run(l, [
        { transform: 'translateX(' + -(140 + x) + 'px)', opacity: 0 },
        { transform: 'translateX(0px)', opacity: 1 }
      ], { duration: D_LET, delay: T_LET + i * STAG, easing: EASE_OUT });
    });

    /* 4) Lockup flies to the nav position; the blue layer retracts */
    var navLogo = document.querySelector('.nav__brand');
    var from = logo.getBoundingClientRect();
    var to   = navLogo ? navLogo.getBoundingClientRect() : { width: from.width * 0.13, left: 24, top: 16 };
    var scale = (to.width || from.width * 0.13) / from.width;
    var dx = to.left - from.left;
    var dy = to.top  - from.top;

    if (navLogo) { navLogo.style.transition = 'none'; navLogo.style.opacity = '0'; }

    run(logo, [
      { transform: 'translate(0px,0px) scale(1)', color: '#ffffff', offset: 0 },
      { color: '#ffffff', offset: 0.62 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + scale + ')', color: BLUE, offset: 1 }
    ], { duration: D_FLY, delay: T_FLY, easing: EASE_IO });

    run(bg, [{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 0 100% 0)' }],
      { duration: D_FLY, delay: T_FLY, easing: EASE_IO });

    /* 5) In place: wheel spins 180 more and fades; the real logo enters rotating */
    var T_SWAP = T_LAND + Math.round(D_SPIN * 0.55);
    run(hex, [{ transform: 'rotate(180deg)' }, { transform: 'rotate(360deg)' }],
      { duration: D_SPIN, delay: T_LAND, easing: EASE_IO, fill: 'forwards' });
    var last = run(logo, [{ opacity: 1 }, { opacity: 0 }],
      { duration: D_FADE, delay: T_SWAP, easing: 'ease', fill: 'forwards' });

    setTimeout(function () {
      if (!navLogo || done) return;
      navLogo.style.transition = 'opacity ' + D_FADE + 'ms ease, transform ' + D_SPIN + 'ms ' + EASE_IO;
      navLogo.style.transform  = 'rotate(-180deg)';
      navLogo.style.opacity    = '0';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          navLogo.style.transform = 'rotate(0deg)';
          navLogo.style.opacity   = '1';
        });
      });
    }, T_SWAP);

    last.finished.then(function () {
      if (navLogo) { navLogo.style.transition = ''; navLogo.style.opacity = ''; navLogo.style.transform = ''; }
      complete();
    }, complete);

    /* Debug: ?t=1200 freezes the intro at that time (ms) */
    var freeze = new URLSearchParams(location.search).get('t');
    if (freeze !== null) {
      clearTimeout(safety);
      document.getAnimations().forEach(function (a) { a.pause(); a.currentTime = Number(freeze); });
    }
  }

  /* ============================================================
     BOOT
     ============================================================ */
  initTheme();
  initI18n();
  initInstallLinks();
  initServiceWorker();
  initMobileDrawer();
  initDemoModal();
  initPricing();
  initWhatsApp();
  initFAQ();
  initNav();
  initReveal();
  initLiveTelemetry();
  initScrollHex();
  initLitText();
  initCounters();
  

  if (root.classList.contains('is-shot')) root.classList.remove('intro-on');
  else if (root.classList.contains('intro-on')) {
    /* Wait for fonts, hex mask and nav logo so the first load measures real sizes */
    var started = false;
    var startIntro = function () { if (!started) { started = true; playIntro(); } };
    if (document.readyState === 'complete') startIntro();
    else {
      window.addEventListener('load', startIntro);
      setTimeout(startIntro, 2500);
    }
  }
  else revealHero();
})();
