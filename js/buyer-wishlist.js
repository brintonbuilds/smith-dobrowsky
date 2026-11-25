/* ═══════════════════════════════════════════════════════════
   Buyer Wish List — /buyers/home-wish-list/
   Progressive enhancement over plain HTML:
   - Section CTAs are ordinary #wish-list anchors. With JS they also
     preselect the buyer's situation and show that path's prompt.
   - The situation stays editable; changing it never clears typed text.
   - Sends to data-endpoint (Formspree-compatible JSON). The confirmation
     shows only on a confirmed 2xx; errors keep every value for retry.
   - Market-update consent is optional, unticked and independent.
   - Analytics get the path and outcome only: never email, free text
     or listing links.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var form = document.getElementById('bw-form');
  if (!form) return;

  var card      = document.getElementById('bw-card');
  var section   = document.getElementById('wish-list');
  var formPanel = card.querySelector('[data-bw-panel="form"]');
  var donePanel = card.querySelector('[data-bw-panel="done"]');
  var notes     = document.getElementById('bw-priorities');
  var email     = document.getElementById('bw-email');
  var listing   = document.getElementById('bw-listing');
  var area      = document.getElementById('bw-area');
  var otherWrap = form.querySelector('[data-bw-other-area]');
  var otherArea = document.getElementById('bw-other-area');
  var prompt    = document.getElementById('bw-prompt');
  var optin     = document.getElementById('bw-newsletter');
  var optinText = document.getElementById('bw-newsletter-text');
  var honeypot  = form.querySelector('input[name="_gotcha"]');
  var submitBtn = form.querySelector('.sr-form__submit');
  var submitTxt = form.querySelector('.sr-form__submit-text');
  var statusEl  = document.getElementById('bw-status');
  var radios    = Array.prototype.slice.call(form.querySelectorAll('input[name="buyer_situation"]'));

  var endpoint = (form.getAttribute('data-endpoint') || '').trim();
  var loadedAt = Date.now();
  var MIN_FILL_MS = 3000;
  var TIMEOUT_MS = 15000;
  var SUBMIT_LABEL = 'Send my wish list to Geoff';
  var ATTR_KEY = 'bw_attribution_v1';
  var ATTR_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var FALLBACK = 'Please call or text Geoff at <a href="tel:9055120301">905.512.0301</a> or email <a href="mailto:geoff@yourrealpro.com">geoff@yourrealpro.com</a>.';
  var isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

  var PROMPTS = {
    'first-home': 'What would you like to understand before your first showing?',
    'moving-up':  'What does your current home make difficult?',
    'downsizing': 'What are you ready to give up, and what needs to come with you?',
    'lifestyle':  'Which places or routines do you want closer to home?',
    'unsure':     'A few lines about the home, the area and what you want it to make easier.',
    '':           'A few lines about the home, the area and what you want it to make easier.'
  };

  var submitted = false;
  var previewMode = false;
  var newsletterSent = false;
  var ctaPath = '';

  function track(name, params) {
    try { if (typeof window.gtag === 'function') window.gtag('event', name, Object.assign({ transport_type: 'beacon' }, params)); } catch (e) { /* never break the page */ }
  }

  /* ── Attribution (first tagged visit kept 90 days; no personal data) ── */
  function readStore() {
    try {
      var data = JSON.parse(window.localStorage.getItem(ATTR_KEY) || 'null');
      if (!data || !data.at || Date.now() - Date.parse(data.at) > ATTR_MAX_AGE_MS) return null;
      return data;
    } catch (e) { return null; }
  }
  function writeStore(data) {
    try { window.localStorage.setItem(ATTR_KEY, JSON.stringify(data)); } catch (e) { /* blocked: fine */ }
  }
  function externalReferrer() {
    var ref = document.referrer || '';
    try { if (!ref || new URL(ref).hostname === location.hostname) return ''; } catch (e) { return ''; }
    return ref.slice(0, 300);
  }

  var params = new URLSearchParams(location.search);
  var current = {}, hasUtm = false;
  UTM_KEYS.forEach(function (k) {
    var v = (params.get(k) || '').trim().slice(0, 120);
    current[k] = v;
    if (v) hasUtm = true;
  });
  var stored = readStore();
  var attribution;
  if (hasUtm) {
    attribution = Object.assign({}, current, { referrer: externalReferrer(), at: new Date().toISOString(), page: location.pathname + location.search });
    if (!stored) writeStore(attribution); else attribution.first = stored;
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

  /* ── Situation: preselect, prompt, stay editable ── */
  function currentSituation() {
    var r = radios.filter(function (x) { return x.checked; })[0];
    return r ? r.getAttribute('data-bw-value') : '';
  }

  function updatePrompt() {
    prompt.textContent = PROMPTS[currentSituation()] || PROMPTS[''];
  }

  function selectPath(key) {
    radios.forEach(function (r) { r.checked = r.getAttribute('data-bw-value') === key; });
    updatePrompt();
  }

  radios.forEach(function (r) { r.addEventListener('change', updatePrompt); });

  function goToForm(focusEl) {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var target = donePanel.hidden ? card : donePanel;
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    var el = donePanel.hidden ? focusEl : donePanel;
    setTimeout(function () { el.focus({ preventScroll: true }); }, reduce ? 0 : 500);
    if (history.replaceState) history.replaceState(null, '', '#wish-list');
  }

  // Section CTAs: preselect that path, then move to the form
  document.querySelectorAll('[data-bw-path]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var key = link.getAttribute('data-bw-path');
      ctaPath = key;
      selectPath(key);
      track('select_content', { content_type: 'buyer_path_cta', item_id: key });
      goToForm(notes);
    });
  });

  // Hero and "not sure" links: go to the form without choosing for them
  document.querySelectorAll('[data-bw-jump]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      ctaPath = ctaPath || 'direct';
      track('select_content', { content_type: 'buyer_path_cta', item_id: 'direct' });
      goToForm(radios[0]);
    });
  });

  // The four first-choice tiles stay plain anchors; just count which one
  document.querySelectorAll('[data-bw-choice]').forEach(function (link) {
    link.addEventListener('click', function () {
      track('select_content', { content_type: 'buyer_path_choice', item_id: link.getAttribute('data-bw-choice') });
    });
  });

  // Campaign links can preselect: ?situation=first-home|moving-up|downsizing|lifestyle
  var preset = (params.get('situation') || '').toLowerCase();
  if (PROMPTS.hasOwnProperty(preset) && preset) { selectPath(preset); ctaPath = 'link:' + preset; }
  else updatePrompt();

  /* ── "Another area" reveals its own field ── */
  function syncOtherArea() {
    var show = area.value === 'Another area';
    otherWrap.hidden = !show;
    if (!show) otherArea.value = '';
  }
  area.addEventListener('change', syncOtherArea);
  syncOtherArea();

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
    var bad = null;
    notes.value = notes.value.trim();
    email.value = email.value.trim();
    listing.value = listing.value.trim();

    if (notes.value.length < 3) {
      fieldError(notes, 'Please add a short note about what matters to you.'); bad = bad || notes;
    } else fieldError(notes, '');

    if (!email.value) {
      fieldError(email, 'Please enter your email address.'); bad = bad || email;
    } else if (!email.checkValidity() || !/\.[a-z]{2,}$/i.test(email.value)) {
      fieldError(email, 'Please enter a valid email address, like name@example.com.'); bad = bad || email;
    } else fieldError(email, '');

    if (listing.value && !/^https?:\/\/\S+\.\S+/i.test(listing.value)) {
      var details = form.querySelector('.bw-more');
      if (details) details.open = true;
      fieldError(listing, 'Please paste the full link, starting with https://'); bad = bad || listing;
    } else fieldError(listing, '');

    if (bad) bad.focus();
    return !bad;
  }

  [notes, email, listing].forEach(function (input) {
    input.addEventListener('input', function () {
      if (input.hasAttribute('aria-invalid')) fieldError(input, '');
      hideStatus();
    });
  });

  function showStatus(html) { statusEl.innerHTML = html; statusEl.hidden = false; }
  function hideStatus() { statusEl.hidden = true; statusEl.innerHTML = ''; }

  function setBusy(busy, label) {
    submitBtn.disabled = busy;
    submitTxt.textContent = busy ? 'Sending…' : (label || SUBMIT_LABEL);
  }

  /* ── Market updates: same Mailchimp audience/form/group as Local Insight ── */
  function sendToMailchimp() {
    var src = document.getElementById('bw-mc-source');
    if (!src || !src.dataset.action) return;
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
  }

  var newsBtn = donePanel.querySelector('[data-bw-newsletter-btn]');
  if (newsBtn) {
    newsBtn.addEventListener('click', function () {
      newsBtn.disabled = true;
      if (previewMode) { newsBtn.textContent = 'Preview only: nothing was sent to Mailchimp.'; return; }
      sendToMailchimp();
      newsBtn.textContent = 'Opened again in a new tab.';
    });
  }

  /* ── Confirmation (only after a confirmed receipt) ── */
  function showDone(isPreview, wantsNewsletter) {
    submitted = true;
    previewMode = !!isPreview;
    formPanel.hidden = true;
    donePanel.hidden = false;
    donePanel.querySelector('[data-bw-preview-label]').hidden = !isPreview;
    donePanel.querySelector('[data-bw-newsletter-finish]').hidden = !wantsNewsletter;
    var top = card.getBoundingClientRect().top;
    if (top < 80 || top > window.innerHeight * 0.6) card.scrollIntoView({ block: 'start' });
    donePanel.focus({ preventScroll: true });
  }

  /* ── Submit ── */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (submitted || submitBtn.disabled) return;
    hideStatus();

    if (honeypot && honeypot.value) return; // bots: send nothing, show nothing
    if (!validate()) return;

    if (Date.now() - loadedAt < MIN_FILL_MS) {
      showStatus('One moment, then press the button again.');
      return;
    }

    var now = new Date();
    var situationInput = radios.filter(function (x) { return x.checked; })[0];
    var situation = situationInput ? situationInput.value : '';
    var wantsNewsletter = !!(optin && optin.checked);
    var first = attribution.first || null;

    setField('_subject', 'Buyer Wish List: ' + (situation || 'Situation not given'));
    setField('cta_path', ctaPath || 'none');
    setField('submitted_at', now.toISOString() + ' (' + now.toLocaleString('en-CA', { timeZone: 'America/Toronto' }) + ' Toronto)');
    setField('landing_page', location.origin + location.pathname + location.search);
    setField('referrer', attribution.referrer || '');
    UTM_KEYS.forEach(function (k) { setField(k, attribution[k] || ''); });
    setField('first_touch_at', (first || attribution).at || '');
    setField('first_touch_page', (first || attribution).page || '');
    setField('newsletter_consent', wantsNewsletter ? 'Yes: ticked the box; sent to Mailchimp signup (subscribed only after confirming by email)' : 'No');
    setField('newsletter_consent_text', wantsNewsletter ? optinText.textContent.replace(/\s+/g, ' ').trim() : '');
    setField('newsletter_consent_at', wantsNewsletter ? now.toISOString() : '');

    if (!endpoint) {
      showStatus('This form is not connected to Geoff&rsquo;s inbox yet, so nothing was sent. Your wish list is still here. ' + FALLBACK);
      return;
    }

    // Newsletter while this click still counts as the visitor's own action.
    if (wantsNewsletter && !newsletterSent) sendToMailchimp();

    setBusy(true);
    var data = new FormData(form);
    if (!situation) data.set('buyer_situation', 'Not given');
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
        track('generate_lead', {
          form_id: 'buyer_wish_list',
          buyer_situation: currentSituation() || 'not_given',
          cta_path: ctaPath || 'none',
          campaign: attribution.utm_campaign || '(none)'
        });
        return;
      }
      throw new Error('HTTP ' + res.status);
    }).catch(function () {
      if (timer) clearTimeout(timer);
      setBusy(false, 'Try again');
      showStatus('Sorry, your wish list didn&rsquo;t go through, and nothing was received. Everything you typed is still here, so you can try again, or ' + FALLBACK.charAt(0).toLowerCase() + FALLBACK.slice(1));
      submitBtn.focus();
    });
  });

  /* Draft safety: while no endpoint is set, say so on screen */
  if (!endpoint) {
    var bar = document.createElement('div');
    bar.className = 'sr-draftbar';
    bar.setAttribute('role', 'note');
    bar.textContent = 'Preview: the wish list is not connected yet. Nothing is sent.';
    document.body.appendChild(bar);
  }

  /* Local-only QA states: ?bw_state=success | newsletter | error */
  if (isLocal) {
    var qa = params.get('bw_state');
    if (qa === 'success' || qa === 'newsletter') {
      showDone(true, qa === 'newsletter');
    } else if (qa === 'error') {
      setBusy(false, 'Try again');
      showStatus('Sorry, your wish list didn&rsquo;t go through, and nothing was received. Everything you typed is still here, so you can try again, or p' + FALLBACK.slice(1));
    }
  }
}());
