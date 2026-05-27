/* ============================================================
   Smith Dobrowsky — Shared Navigation Component
   Include as first child of <body> on every page.
   ============================================================ */

(function () {

  /* ── 1. Inject nav HTML synchronously at parse time ── */
  document.write([
    '<nav class="nav nav--inverse" id="main-nav" role="navigation" aria-label="Main navigation">',
      '<!-- TEMPORARY CLIENT REVIEW MODE - INTERNAL LINKS DISABLED -->',
      '<a href="#" class="nav__logo" aria-label="The Smith Dobrowsky Team — Home">',
        '<img class="nav__logo-img" src="assets/logo-transparent-header.png" alt="The Smith Dobrowsky Team" width="212" height="42">',
      '</a>',
      '<ul class="nav__links" role="list">',
        '<li><a href="#" class="nav__link">Listings</a></li>',
        '<li><a href="#" class="nav__link">Buyers</a></li>',
        '<li><a href="#" class="nav__link">Sellers</a></li>',
        '<li><a href="#" class="nav__link">Local Insight</a></li>',
        '<li><a href="#" class="nav__link">Contact</a></li>',
      '</ul>',
      '<a href="tel:9056393355" class="nav__cta--phone" aria-label="Call The Smith Dobrowsky Team at 905-639-3355">905.639.3355</a>',
      '<button class="nav__toggle" id="nav-toggle" aria-label="Open navigation menu" aria-expanded="false">',
        '<span></span><span></span><span></span>',
      '</button>',
    '</nav>',
    '<div class="nav__mobile-menu" id="nav-mobile-menu" aria-label="Navigation menu" aria-hidden="true">',
      '<a href="#">Listings</a>',
      '<a href="#">Buyers</a>',
      '<a href="#">Sellers</a>',
      '<a href="#">Local Insight</a>',
      '<a href="#">Contact</a>',
      '<a href="tel:9056393355" class="nav__mobile-phone">905.639.3355</a>',
    '</div>'
  ].join(''));

  /* ── 2. Wire behaviour after DOM is ready — run exactly once ── */
  function initNav() {
    var toggle = document.getElementById('nav-toggle');
    if (!toggle || toggle.dataset.navInit) return; /* guard against double-init */
    toggle.dataset.navInit = '1';

    var nav  = document.getElementById('main-nav');
    var menu = document.getElementById('nav-mobile-menu');

    /* ── Active link — match filename ── */
    var current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav__link').forEach(function (link) {
      var href = link.getAttribute('href') || '';
      if (href === current || (current === '' && href === 'index.html')) {
        link.classList.add('is-active');
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
