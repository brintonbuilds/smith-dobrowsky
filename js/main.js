/* The Smith Dobrowsky Team — main.js */

/* ── Hero video — smooth load, reduced motion, autoplay fallback ── */
(function () {
  const video = document.querySelector('.hero__video');
  if (!video) return;

  // Honour prefers-reduced-motion: freeze on poster, no animation
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    video.pause();
    video.removeAttribute('autoplay');
    return;
  }

  // Fade in once the browser has buffered enough to play without stutter
  const reveal = (function () {
    let done = false;
    return function () {
      if (done) return;
      done = true;
      video.classList.add('is-ready');
    };
  }());

  video.addEventListener('canplaythrough', reveal, { once: true });

  // Fallback: if canplaythrough hasn't fired within 2.8 s, reveal anyway
  // (poster image holds the frame cleanly until this point)
  const fallback = setTimeout(reveal, 2800);
  video.addEventListener('canplaythrough', function () {
    clearTimeout(fallback);
  }, { once: true });

  // Autoplay can be blocked by browser policy (e.g. low-power mode on iOS).
  // In that case keep the poster visible — do not force play.
  const playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise.catch(function () {
      // Autoplay blocked — poster stays, video stays hidden, no error thrown
    });
  }
}());


/* ── Listings filter ── */
(function () {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards      = document.querySelectorAll('.listing-card[data-type]');
  const countEl    = document.querySelector('.filter-bar__count');
  if (!filterBtns.length) return;

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      const filter = btn.dataset.filter;
      let visible = 0;

      cards.forEach((card) => {
        const show = filter === 'All' || card.dataset.type === filter;
        card.style.display = show ? '' : 'none';
        if (show) visible++;
      });

      if (countEl) countEl.textContent = `${visible} propert${visible === 1 ? 'y' : 'ies'}`;
    });
  });
})();

/* ── Contact form success state ── */
(function () {
  const form       = document.getElementById('contact-form');
  const successEl  = document.getElementById('contact-success');
  const formWrap   = document.getElementById('contact-form-wrap');
  const backBtn    = document.getElementById('back-btn');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (formWrap)  formWrap.style.display  = 'none';
    if (successEl) successEl.style.display = 'flex';
  });

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (successEl) successEl.style.display = 'none';
      if (formWrap)  formWrap.style.display  = '';
      if (form) form.reset();
    });
  }
})();

/* ── Pre-fill address from URL param ── */
(function () {
  const addressInput = document.getElementById('form-address');
  if (!addressInput) return;
  const params = new URLSearchParams(window.location.search);
  const addr   = params.get('address');
  if (addr) addressInput.value = addr;
})();

/* ── Hero lead capture — pass address to contact.html ── */
(function () {
  const heroForm  = document.getElementById('hero-eval-form');
  const heroInput = document.getElementById('hero-address');
  const heroBtn   = document.getElementById('hero-eval-btn');
  if (!heroBtn) return;

  const go = () => {
    const addr = heroInput ? heroInput.value.trim() : '';
    const dest = addr
      ? `contact.html?address=${encodeURIComponent(addr)}`
      : 'contact.html';
    window.location.href = dest;
  };

  heroBtn.addEventListener('click', go);
  if (heroInput) {
    heroInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  }
})();

/* ── Scroll-reveal via IntersectionObserver ── */
(function () {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
})();
