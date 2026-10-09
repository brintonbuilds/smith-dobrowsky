/* Community map callouts shared by the Home and Buyers pages. */
(function () {
  'use strict';

  var communities = {
    burlington: { x: 0.530, y: 0.440, snap: 'right', labelX: 14, labelY: -12, name: 'Burlington', href: '' },
    hamilton: { x: 0.275, y: 0.760, snap: 'rightup', labelX: 14, labelY: -12, name: 'Hamilton', href: '' },
    waterdown: { x: 0.415, y: 0.265, labelX: 14, labelY: -12, name: 'Waterdown', href: '' }
  };

  var snapshot = null;

  function esc(text) {
    var el = document.createElement('div');
    el.textContent = text == null ? '' : String(text);
    return el.innerHTML;
  }

  /* Hover card built from data/market-snapshot.json (edited monthly). */
  function cardHtml(key, name, pos) {
    var data = snapshot && snapshot.communities && snapshot.communities[key];
    if (!data) return '';
    var score = Math.max(0, Math.min(100, Number(data.score) || 0));
    // Needle sweeps the same 180° arc as the Local Insight gauge: 0 = left, 100 = right.
    var angle = -90 + score * 1.8;
    var ticks = [0, 25, 50, 75, 100].map(function (v) {
      var t = Math.PI - (v / 100) * Math.PI;
      var x1 = 100 + 90 * Math.cos(t), y1 = 100 - 90 * Math.sin(t);
      var x2 = 100 + 97 * Math.cos(t), y2 = 100 - 97 * Math.sin(t);
      return '<line class="cm-snap__tick' + (v === 50 ? ' cm-snap__tick--mid' : '') + '" x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '"/>';
    }).join('');
    return '<span class="cm-snap cm-snap--' + (pos || 'above') + '" role="tooltip">'
      + '<span class="cm-snap__eyebrow">' + esc(name) + ' &middot; ' + esc(snapshot.month) + '</span>'
      + '<span class="cm-snap__gauge" aria-hidden="true">'
      + '<svg viewBox="0 0 200 108">' + ticks
      + '<path class="cm-snap__track" d="M20,100 A80,80 0 0 1 180,100" pathLength="100"/>'
      + '<path class="cm-snap__fill" d="M20,100 A80,80 0 0 1 180,100" pathLength="100" style="stroke-dasharray:' + score + ' 100"/>'
      + '<g style="transform-origin:100px 100px;transform:rotate(' + angle + 'deg)"><line class="cm-snap__needle" x1="100" y1="100" x2="100" y2="30"/>'
      + '<circle class="cm-snap__hub" cx="100" cy="100" r="5"/></g></svg></span>'
      + '<span class="cm-snap__scale" aria-hidden="true"><span class="cm-snap__end">Buyer&rsquo;s</span>'
      + '<span class="cm-snap__score">' + score + '<small> / 100</small></span>'
      + '<span class="cm-snap__end">Seller&rsquo;s</span></span>'
      + '<span class="cm-snap__rule" aria-hidden="true"></span>'
      + '<span class="cm-snap__headline">' + esc(data.headline) + '</span>'
      + '<span class="cm-snap__sub">' + esc(data.sublabel) + '</span>'
      + '<span class="cm-snap__note">' + esc(data.note) + '</span>'
      + '<a class="cm-snap__link" href="local-insight.html?community=' + encodeURIComponent(key) + '#community-guide">'
      + 'View full report <span aria-hidden="true">&rarr;</span></a>'
      + '</span>';
  }

  function isMobile() {
    return window.matchMedia('(max-width: 850px)').matches;
  }

  /* Phones: show one compact card centred over the map; tap it to dismiss. */
  function showDock(section, marker) {
    var dock = section.querySelector('.cm-snap-dock');
    var card = marker.querySelector('.cm-snap');
    if (!dock || !card || !isMobile()) return;
    dock.innerHTML = card.outerHTML;
    dock.hidden = false;
  }

  function activate(section, markerEls, marker) {
    showDock(section, marker);
    Object.values(markerEls).forEach(function (item) {
      item.classList.remove('is-active');
    });
    marker.classList.add('is-active');
    section.classList.add('has-active');
  }

  function clearActive(section, markerEls) {
    Object.values(markerEls).forEach(function (item) {
      item.classList.remove('is-active');
    });
    section.classList.remove('has-active');
  }

  function initSection(section) {
    var markerLayer = section.querySelector('.cm-map-marker-layer');
    var markerEls = {};

    if (!markerLayer || markerLayer.dataset.mapReady === 'true') return;

    markerLayer.dataset.mapReady = 'true';

    if (markerLayer.hasAttribute('data-snapshot') && !section.querySelector('.cm-snap-dock')) {
      var panel = section.querySelector('.cm-map-panel');
      if (panel) {
        var dock = document.createElement('div');
        dock.className = 'cm-snap-dock';
        dock.setAttribute('aria-live', 'polite');
        dock.hidden = true;
        dock.addEventListener('click', function (e) {
          if (e.target.closest('a')) return;
          dock.hidden = true;
        });
        panel.appendChild(dock);
      }
    }
    markerLayer.innerHTML = '';

    var allowedCommunities = (markerLayer.getAttribute('data-communities') || '')
      .split(',')
      .map(function (key) { return key.trim(); })
      .filter(Boolean);
    var communityKeys = Object.keys(communities).filter(function (key) {
      return allowedCommunities.length === 0 || allowedCommunities.indexOf(key) !== -1;
    });

    communityKeys.forEach(function (key) {
      var community = communities[key];
      // A div (not a button) so the hover card can hold a real link.
      var marker = document.createElement('div');

      marker.setAttribute('role', 'button');
      marker.tabIndex = 0;
      marker.className = 'cm-map-marker';
      marker.setAttribute('data-community', key);
      marker.setAttribute('aria-label', 'Learn about ' + community.name);
      marker.style.setProperty('--marker-x', (community.x * 100).toFixed(2) + '%');
      marker.style.setProperty('--marker-y', (community.y * 100).toFixed(2) + '%');
      marker.style.setProperty('--label-x', community.labelX + 'px');
      marker.style.setProperty('--label-y', community.labelY + 'px');
      marker.innerHTML = '<span class="cm-map-marker__dot" aria-hidden="true"></span>'
        + '<span class="cm-map-marker__label">' + community.name + '</span>';

      if (markerLayer.hasAttribute('data-snapshot')) {
        marker.setAttribute('data-has-snapshot', 'true');
        marker.insertAdjacentHTML('beforeend', cardHtml(key, community.name, community.snap));
      }

      markerEls[key] = marker;
      markerLayer.appendChild(marker);

      marker.addEventListener('click', function () {
        if (!community.href || community.href === '#') {
          activate(section, markerEls, marker);
          return;
        }

        window.location.href = community.href;
      });

      marker.addEventListener('keydown', function (e) {
        if (e.target !== marker || (e.key !== 'Enter' && e.key !== ' ')) return;
        e.preventDefault();
        marker.click();
      });

      marker.addEventListener('mouseenter', function () {
        activate(section, markerEls, marker);
      });

      marker.addEventListener('mouseleave', function () {
        clearActive(section, markerEls);
      });

      marker.addEventListener('focus', function () {
        activate(section, markerEls, marker);
      });

      marker.addEventListener('blur', function () {
        clearActive(section, markerEls);
      });
    });
  }

  function init() {
    snapshot = window.MARKET_SNAPSHOT || null;
    Array.from(document.querySelectorAll('.cm-section, .buyers-local-map')).forEach(initSection);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
