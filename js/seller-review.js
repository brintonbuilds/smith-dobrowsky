/* ═══════════════════════════════════════════════════════════
   Seller Home Value Review — /sellers/home-value/
   - Captures campaign attribution (UTMs, referrer, first touch)
   - Validates the two-field review request
   - Sends it to the endpoint in data-endpoint (Formspree-compatible JSON)
   - Shows the confirmation ONLY when the endpoint confirms receipt
   - Keeps newsletter consent separate: ticking the box never subscribes
     anyone here; the visitor finishes through Mailchimp's double opt-in.
   No personal details are stored in the browser or sent to analytics.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var form = document.getElementById('sr-review-form');
  if (!form) return;

  var card       = document.getElementById('review');
  var formPanel  = card.querySelector('[data-sr-panel="form"]');
  var donePanel  = card.querySelector('[data-sr-panel="done"]');
  var address    = document.getElementById('sr-address');
  var email      = document.getElementById('sr-email');
  var optin      = document.getElementById('sr-newsletter');
  var optinText  = document.getElementById('sr-newsletter-text');
  var honeypot   = form.querySelector('input[name="_gotcha"]');
  var submitBtn  = form.querySelector('.sr-form__submit');
  var submitText = form.querySelector('.sr-form__submit-text');
  var statusEl   = document.getElementById('sr-form-status');
  var notice     = document.getElementById('sr-review-notice');

  var endpoint = (form.getAttribute('data-endpoint') || '').trim();
  var loadedAt = Date.now();
  var MIN_FILL_MS = 3000;
  var TIMEOUT_MS = 15000;
  var ATTR_KEY = 'sr_attribution_v1';
  var ATTR_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var FALLBACK = 'Please call or text Geoff at <a href="tel:9055120301">905.512.0301</a> or email <a href="mailto:geoff@yourrealpro.com">geoff@yourrealpro.com</a>.';

  var isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  var submitted = false;
  var previewMode = false;

  /* ── Attribution ──────────────────────────────────────────
     A QR scan or email click sets UTMs. Keep the first tagged visit
     (90 days) so a homeowner who comes back later, untagged, is still
     credited to the campaign that brought them. */
  function readStore() {
    try {
      var raw = window.localStorage.getItem(ATTR_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !data.at || Date.now() - Date.parse(data.at) > ATTR_MAX_AGE_MS) return null;
      return data;
    } catch (e) { return null; }
  }

  function writeStore(data) {
    try { window.localStorage.setItem(ATTR_KEY, JSON.stringify(data)); } catch (e) { /* storage blocked: fine */ }
  }

  function externalReferrer() {
    var ref = document.referrer || '';
    if (!ref) return '';
    try { if (new URL(ref).hostname === location.hostname) return ''; } catch (e) { return ''; }
    return ref.slice(0, 300);
  }

  var params = new URLSearchParams(location.search);
  var current = {};
  var hasUtm = false;
  UTM_KEYS.forEach(function (k) {
    var v = (params.get(k) || '').trim().slice(0, 120);
    current[k] = v;
    if (v) hasUtm = true;
  });

  var stored = readStore();
  var attribution;
  if (hasUtm) {
    attribution = Object.assign({}, current, {
      referrer: externalReferrer(),
      at: new Date().toISOString(),
      page: location.pathname + location.search
    });
    if (!stored) writeStore(attribution);
    else attribution.first = stored; // a newer campaign visit; keep both
  } else if (stored) {
    attribution = stored;
  } else {
    attribution = { referrer: externalReferrer(), at: new Date().toISOString(), page: location.pathname };
    UTM_KEYS.forEach(function (k) { attribution[k] = ''; });
    if (attribution.referrer) writeStore(attribution);
  }

  function setField(name, value) {
    var input = form.querySelector('input[type="hidden"][name="' + name + '"]');
    if (input) input.value = value == null ? '' : String(value);
  }

  /* ── Validation ── */
  function fieldError(input, msg) {
    var err = document.getElementById(input.id + '-error');
    if (msg) {
      input.setAttribute('aria-invalid', 'true');
      if (err) { err.textContent = msg; err.hidden = false; input.setAttribute('aria-errormessage', err.id); }
    } else {
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-errormessage');
      if (err) { err.textContent = ''; err.hidden = true; }
    }
  }

  function validate() {
    var firstBad = null;
    address.value = address.value.replace(/\s+/g, ' ').trim();
    email.value = email.value.trim();

    if (!address.value) {
      fieldError(address, 'Please enter the property address.'); firstBad = firstBad || address;
    } else if (address.value.length < 6 || !/[a-z]/i.test(address.value)) {
      fieldError(address, 'Please include the street address and city, like 123 Main Street, Burlington.'); firstBad = firstBad || address;
    } else {
      fieldError(address, '');
    }

    if (!email.value) {
      fieldError(email, 'Please enter your email address.'); firstBad = firstBad || email;
    } else if (!email.checkValidity() || !/\.[a-z]{2,}$/i.test(email.value)) {
      fieldError(email, 'Please enter a valid email address, like name@example.com.'); firstBad = firstBad || email;
    } else {
      fieldError(email, '');
    }

    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  [address, email].forEach(function (input) {
    input.addEventListener('input', function () {
      if (input.hasAttribute('aria-invalid')) fieldError(input, '');
      hideStatus();
    });
  });

  function showStatus(html) {
    statusEl.innerHTML = html;
    statusEl.hidden = false;
  }

  function hideStatus() {
    statusEl.hidden = true;
    statusEl.innerHTML = '';
  }

  function setBusy(busy) {
    submitBtn.disabled = busy;
    submitText.textContent = busy ? 'Sending…' : 'Get Geoff’s Perspective';
  }

  /* ── Confirmation (only after a confirmed receipt) ── */
  function showDone(isPreview, wantsNewsletter) {
    submitted = true;
    previewMode = !!isPreview;
    formPanel.hidden = true;
    donePanel.hidden = false;
    donePanel.querySelector('[data-sr-preview-label]').hidden = !isPreview;
    donePanel.querySelector('[data-sr-newsletter-finish]').hidden = !wantsNewsletter;
    var top = card.getBoundingClientRect().top;
    if (top < 80 || top > window.innerHeight * 0.6) card.scrollIntoView({ block: 'start' });
    donePanel.focus({ preventScroll: true });
  }

  /* Newsletter signup: same Mailchimp audience, form and interest group as
     Local Insight. Only runs when the visitor ticked the box. It posts to
     Mailchimp in a new tab, where Mailchimp's own reCAPTCHA and double
     opt-in run, so nobody is subscribed without confirming by email. */
  var newsletterSent = false;

  function sendToMailchimp() {
    var src = document.getElementById('sr-news-form');
    if (!src || !src.dataset.action) return false;
    var f = document.createElement('form');
    f.method = 'post';
    f.target = '_blank';
    f.action = src.dataset.action;
    f.style.display = 'none';
    [['EMAIL', email.value], ['b_9d96d60cfc2b644eef2985b6f_edaf826e86', ''], ['group[48155][2]', '1']].forEach(function (pair) {
      var i = document.createElement('input');
      i.type = 'hidden'; i.name = pair[0]; i.value = pair[1];
      f.appendChild(i);
    });
    document.body.appendChild(f);
    f.submit();
    f.remove();
    newsletterSent = true;
    return true;
  }

  /* Fallback if the browser blocked the new tab */
  var newsBtn = donePanel.querySelector('[data-sr-newsletter-btn]');
  if (newsBtn) {
    newsBtn.addEventListener('click', function () {
      newsBtn.disabled = true;
      if (previewMode) {
        newsBtn.textContent = 'Preview only: nothing was sent to Mailchimp.';
        return;
      }
      sendToMailchimp();
      newsBtn.textContent = 'Opened again in a new tab.';
    });
  }

  /* ── Submit ── */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (submitted || submitBtn.disabled) return;
    hideStatus();

    // Bots fill the hidden field. Send nothing and show nothing.
    if (honeypot && honeypot.value) return;

    if (!validate()) return;

    if (Date.now() - loadedAt < MIN_FILL_MS) {
      showStatus('One moment, then press the button again.');
      return;
    }

    var now = new Date();
    var wantsNewsletter = !!(optin && optin.checked);
    var first = attribution.first || null;

    setField('_subject', 'Seller Home Value Review: ' + address.value);
    setField('submitted_at', now.toISOString() + ' (' + now.toLocaleString('en-CA', { timeZone: 'America/Toronto' }) + ' Toronto)');
    setField('landing_page', location.origin + location.pathname + location.search);
    setField('referrer', attribution.referrer || '');
    UTM_KEYS.forEach(function (k) { setField(k, attribution[k] || ''); });
    setField('first_touch_at', (first || attribution).at || '');
    setField('first_touch_page', (first || attribution).page || '');
    setField('newsletter_consent', wantsNewsletter ? 'Yes: ticked the box; sent to Mailchimp signup (subscribed only after confirming by email)' : 'No');
    setField('newsletter_consent_text', wantsNewsletter ? optinText.textContent.replace(/\s+/g, ' ').trim() : '');
    setField('newsletter_consent_at', wantsNewsletter ? now.toISOString() : '');
    setField('review_notice', notice ? notice.textContent.replace(/\s+/g, ' ').trim() : '');

    if (!endpoint) {
      showStatus('This form is not connected to Geoff&rsquo;s inbox yet, so nothing was sent. ' + FALLBACK);
      return;
    }

    // Newsletter first, while this click still counts as the visitor's own
    // action (browsers allow a new tab then, not after the network wait).
    // Consent is separate from the review, so it goes even if the review fails.
    if (wantsNewsletter && !newsletterSent) sendToMailchimp();

    setBusy(true);
    var data = new FormData(form);
    if (!wantsNewsletter) data.set('newsletter_opt_in', 'no');

    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS) : null;

    fetch(endpoint, {
      method: 'POST',
      body: data,
      headers: { Accept: 'application/json' },
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      if (timer) clearTimeout(timer);
      if (res.ok) {
        showDone(false, wantsNewsletter);
        try {
          if (typeof window.gtag === 'function') {
            window.gtag('event', 'generate_lead', {
              form_id: 'seller_home_value_review',
              campaign: attribution.utm_campaign || '(none)',
              transport_type: 'beacon'
            });
          }
        } catch (err) { /* never break the page */ }
        return;
      }
      return res.json().catch(function () { return {}; }).then(function (body) {
        var detail = body && body.errors && body.errors[0] && body.errors[0].message;
        throw new Error(detail || ('HTTP ' + res.status));
      });
    }).catch(function () {
      if (timer) clearTimeout(timer);
      setBusy(false);
      showStatus('Sorry, your request didn&rsquo;t go through, and nothing was received. Please try again in a moment, or ' + FALLBACK.charAt(0).toLowerCase() + FALLBACK.slice(1));
    });
  });

  /* In-page links to the form: move focus to the first field */
  document.querySelectorAll('[data-sr-jump]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      var target = donePanel.hidden ? address : donePanel;
      setTimeout(function () { target.focus({ preventScroll: true }); }, reduce ? 0 : 450);
    });
  });

  /* Draft safety: while no endpoint is set, say so on screen */
  if (!endpoint) {
    var bar = document.createElement('div');
    bar.className = 'sr-draftbar';
    bar.setAttribute('role', 'note');
    bar.textContent = 'Private draft: the review form is not connected yet. Nothing is sent.';
    document.body.appendChild(bar);
  }

  /* Local-only QA states (never on the live domain):
     ?sr_state=success | newsletter | error */
  if (isLocal) {
    var qa = params.get('sr_state');
    if (qa === 'success' || qa === 'newsletter') {
      showDone(true, qa === 'newsletter');
    } else if (qa === 'error') {
      showStatus('Sorry, your request didn&rsquo;t go through, and nothing was received. Please try again in a moment, or p' + FALLBACK.slice(1));
    }
  }
}());
