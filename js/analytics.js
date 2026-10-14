/* Google Analytics 4 — yourrealpro.com
   One file, loaded in the <head> of every page: it loads the Google tag and sends the
   custom events below. Measurement ID lives in GA_ID. Tracking only runs on the live
   domain (yourrealpro.com / www) so local previews and test copies don't pollute the data;
   add ?ga_test=1 to any URL to force it on while testing.

   Events (GA4 name → what it means):
     click_to_call      tel: link clicked           (param: link_location)
     click_email        mailto: link clicked        (param: link_location)
     generate_lead      Contact form submitted      (param: form_id)
     sign_up            Local Insight monthly email signup completed (param: method)
     listing_click      A listing card/link clicked (params: listing, listing_status)
     select_content     Local Insight tab / buying-selling toggle / "full data" opened
     map_card_view      Map hover card shown        (param: community)
     map_card_click     "View full report" in a map card (param: community)
     cta_click          Homepage hero button, or any internal link to Contact (params: link_text, link_location)
     social_click       Instagram / Facebook / Google reviews (param: network)
     page_not_found     404 page viewed
   Built-in "enhanced measurement" (page views, scrolls, outbound clicks, file downloads) is on in GA. */
(function () {
  'use strict';

  var GA_ID = 'G-SSJ144XYRK';
  var host = location.hostname;
  var live = host === 'yourrealpro.com' || host === 'www.yourrealpro.com' || /[?&]ga_test=1/.test(location.search);
  if (!live) return;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);

  gtag('js', new Date());
  gtag('config', GA_ID);

  function send(name, params) {
    try { gtag('event', name, Object.assign({ transport_type: 'beacon' }, params || {})); } catch (e) { /* never break the page */ }
  }

  /* Where on the page a link lives, for readable reports. */
  function place(el) {
    if (el.closest('.nav, .nav__mobile-menu')) return 'header';
    if (el.closest('.footer')) return 'footer';
    if (el.closest('.hero, .ip-hero')) return 'hero';
    if (el.closest('.closing-cta')) return 'closing_cta';
    if (el.closest('.ct-primary, .ct-closing, .ct-form-wrap')) return 'contact_page';
    return 'body';
  }

  function text(el) {
    return (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  }

  /* ── Clicks ── */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (a) {
      var href = a.getAttribute('href') || '';

      if (/^tel:/i.test(href)) {
        send('click_to_call', { link_location: place(a) });
      } else if (/^mailto:/i.test(href)) {
        send('click_email', { link_location: place(a) });
      } else if (/instagram\.com|facebook\.com/i.test(href)) {
        send('social_click', { network: /instagram/i.test(href) ? 'instagram' : 'facebook' });
      } else if (/share\.google|google\.com\/maps|g\.page|search\.google/i.test(href)) {
        send('social_click', { network: 'google_reviews' });
      }

      if (/odyssey3d\.ca|73windhaven\.ca/i.test(href) || a.closest('.sp-card, .lp-feature')) {
        var card = a.closest('.sp-card, .lp-feature');
        var addr = card && card.querySelector('.sp-card__address, .lp-feature__address');
        var status = card && card.querySelector('.sp-card__status, .lp-feature__badge');
        send('listing_click', {
          listing: addr ? addr.textContent.trim() : text(a),
          listing_status: status ? status.textContent.trim() : 'featured'
        });
      }

      if (a.classList.contains('hero__cta-btn') ||
          (/(^|\/)contact\.html(\?|#|$)/.test(href) && !a.closest('.nav, .nav__mobile-menu, .footer'))) {
        send('cta_click', { link_text: text(a), link_location: place(a) });
      }

      if (a.classList.contains('cm-snap__link')) {
        var m = a.closest('.cm-map-marker');
        send('map_card_click', { community: m ? m.getAttribute('data-community') : '' });
      }
    }

    var tab = e.target.closest && e.target.closest('[role="tab"]');
    if (tab) {
      send('select_content', { content_type: 'market_report_tab', item_id: (tab.id || '').replace('tab-', '') });
    }

    var toggle = e.target.closest && e.target.closest('[data-meaning-btn]');
    if (toggle) {
      var panel = toggle.closest('[role="tabpanel"]');
      send('select_content', {
        content_type: 'audience_toggle',
        item_id: toggle.getAttribute('data-meaning-btn'),
        community: panel ? panel.id.replace('panel-', '') : ''
      });
    }
  }, true);

  /* ── Forms ── */
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f && f.classList && f.classList.contains('ct-form') && (!f.checkValidity || f.checkValidity())) {
      send('generate_lead', { form_id: 'contact' });
    }
  }, true);

  /* Local Insight signup: count it only once the success message actually appears
     (the page silently drops bot submissions and invalid emails before that). */
  function watchSignup() {
    var ok = document.getElementById('li-signup-success');
    if (!ok || !window.MutationObserver) return;
    var sent = false;
    new MutationObserver(function () {
      if (!ok.hidden && !sent) { sent = true; send('sign_up', { method: 'local_insight_mailchimp' }); }
    }).observe(ok, { attributes: true, attributeFilter: ['hidden'] });
  }

  /* "View the full data" disclosure on Local Insight. */
  function watchDeeper() {
    document.querySelectorAll('.li-intelligence__deeper').forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (!d.open) return;
        var panel = d.closest('[role="tabpanel"]');
        send('select_content', { content_type: 'full_market_data', item_id: panel ? panel.id.replace('panel-', '') : '' });
      });
    });
  }

  /* Map hover cards: count each community once per page view. */
  function watchMap() {
    var seen = {};
    document.addEventListener('mouseover', function (e) {
      var m = e.target.closest && e.target.closest('.cm-map-marker[data-has-snapshot]');
      if (!m) return;
      var c = m.getAttribute('data-community');
      if (seen[c]) return;
      seen[c] = true;
      send('map_card_view', { community: c });
    });
  }

  function ready() {
    watchSignup();
    watchDeeper();
    watchMap();
    if (document.body && document.body.classList.contains('error-page')) {
      send('page_not_found', { page_path: location.pathname });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
}());
