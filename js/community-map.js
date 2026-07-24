/* Community map callouts shared by the Home and Buyers pages. */
(function () {
  'use strict';

  var communities = {
    burlington: { x: 0.530, y: 0.440, labelX: 14, labelY: -12, name: 'Burlington', href: '' },
    hamilton: { x: 0.275, y: 0.760, labelX: 14, labelY: -12, name: 'Hamilton', href: '' },
    waterdown: { x: 0.415, y: 0.265, labelX: 14, labelY: -12, name: 'Waterdown', href: '' }
  };

  function activate(section, markerEls, marker) {
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
      var marker = document.createElement('button');

      marker.type = 'button';
      marker.className = 'cm-map-marker';
      marker.setAttribute('data-community', key);
      marker.setAttribute('aria-label', 'Learn about ' + community.name);
      marker.style.setProperty('--marker-x', (community.x * 100).toFixed(2) + '%');
      marker.style.setProperty('--marker-y', (community.y * 100).toFixed(2) + '%');
      marker.style.setProperty('--label-x', community.labelX + 'px');
      marker.style.setProperty('--label-y', community.labelY + 'px');
      marker.innerHTML = '<span class="cm-map-marker__dot" aria-hidden="true"></span>'
        + '<span class="cm-map-marker__label">' + community.name + '</span>';

      markerEls[key] = marker;
      markerLayer.appendChild(marker);

      marker.addEventListener('click', function () {
        if (!community.href || community.href === '#') {
          activate(section, markerEls, marker);
          return;
        }

        window.location.href = community.href;
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
    Array.from(document.querySelectorAll('.cm-section, .buyers-local-map')).forEach(initSection);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
