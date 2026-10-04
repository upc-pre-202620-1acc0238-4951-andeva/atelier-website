/**
 * Atelier Workshop - landing behaviour.
 * Sections: helpers, theme, i18n, mobile drawer, scroll effects,
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
    }

    apply(current);
    if (langToggle) langToggle.addEventListener('click', function () { apply(current === 'es' ? 'en' : 'es'); });
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
     BOOT
     ============================================================ */
  initTheme();
  initI18n();
  initMobileDrawer();
})();
