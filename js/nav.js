/* ============================================================
   Smith Dobrowsky — Shared Navigation Behaviour
   Navigation markup lives in each page so links remain crawlable.
   ============================================================ */

(function () {
  /* Wire behaviour after DOM is ready — run exactly once. */
  function initNav() {
    var toggle = document.getElementById('nav-toggle');
    if (!toggle || toggle.dataset.navInit) return; /* guard against double-init */
    toggle.dataset.navInit = '1';

    var nav  = document.getElementById('main-nav');
    var menu = document.getElementById('nav-mobile-menu');

    /* ── Active link — match filename ── */
    var current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav__link, .nav__mobile-menu a[href]').forEach(function (link) {
      var href = link.getAttribute('href') || '';
      if (href === current || (current === '' && href === 'index.html')) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      }
    });

    /* ── Scroll state — compress nav after 24 px ── */
    if (nav) {
      var updateScroll = function () {
        nav.classList.toggle('nav--scrolled', window.scrollY > 24);
      };
      updateScroll();
      window.addEventListener('scroll', updateScroll, { passive: true });
    }

    /* ── Mobile menu open / close helpers ── */
    function openMenu() {
      menu.classList.add('is-open');
      toggle.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close navigation menu');
      menu.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      menu.classList.remove('is-open');
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation menu');
      menu.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    /* ── Mobile toggle ── */
    if (toggle && menu) {
      toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        if (menu.classList.contains('is-open')) {
          closeMenu();
        } else {
          openMenu();
        }
      });

      /* Close when a menu link is tapped */
      menu.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', closeMenu);
      });

      /* Close on outside click */
      document.addEventListener('click', function (e) {
        if (
          menu.classList.contains('is-open') &&
          !toggle.contains(e.target) &&
          !menu.contains(e.target)
        ) {
          closeMenu();
        }
      });

      /* Close on Escape */
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeMenu();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }

}());
