'use strict';

const gardenSelect = document.querySelector('#garden');
const refresh = document.querySelector('#refresh');
const feedStatus = document.querySelector('#feed-status');
const share = document.querySelector('#share');
const shareStatus = document.querySelector('#share-status');
const feed = {
  gardens: [
    { id: 'MG-001', name: 'TMSA Apex', lat: 35.719, lng: -78.904, approximate: true },
    { id: 'MG-002', name: 'TMSA Triangle High School', lat: 35.717, lng: -78.907, approximate: true },
    { id: 'MG-003', name: 'TMSA Triangle Cary', lat: 35.766, lng: -78.78, approximate: true },
    { id: 'MG-004', name: 'TMSA Triangle Durham', lat: 35.903, lng: -78.897, approximate: true },
    { id: 'MG-005', name: 'TMSA Triad Greensboro Elementary', lat: 36.034, lng: -79.779, approximate: true },
    { id: 'MG-006', name: 'TMSA Triad Greensboro Secondary', lat: 36.026, lng: -79.75, approximate: true },
    { id: 'MG-007', name: 'TMSA Triad McLeansville', lat: 36.083, lng: -79.65, approximate: true },
    { id: 'MG-008', name: 'TMSA Charlotte Elementary', lat: 35.331, lng: -80.786, approximate: true },
    { id: 'MG-009', name: 'TMSA Charlotte Secondary', lat: 35.377, lng: -80.712, approximate: true },
    { id: 'MG-010', name: 'TMSA Concord Elementary', lat: 35.4, lng: -80.69, approximate: true }
  ],
  // Privacy-filtered snapshot from Form Responses 1, 2026-11-18.
  reports: [{
    gardenId: 'MG-001', date: '2026-11-18', sunlight: 'Enough sunlight',
    sighting: 'Butterflies', soil: 'Dry', plants: 'Healthy',
    care: 'No care needed', urgency: 'Low urgency'
  }]
};
const requested = new URL(location.href).searchParams.get('garden');
let selected = requested || '';
let loaded = false;
let map;
let markers;

function gardenUrl(id) {
  const url = new URL('./', location.href);
  if (id) {
    url.searchParams.set('garden', id);
    url.hash = 'history';
  }
  return url;
}

function buildSelector() {
  gardenSelect.replaceChildren(new Option('All gardens', ''));
  for (const garden of feed.gardens) gardenSelect.add(new Option(garden.name, garden.id));
  gardenSelect.value = feed.gardens.some(garden => garden.id === selected) ? selected : '';
}

function drawMap() {
  if (!window.L) {
    document.querySelector('#map').replaceChildren(Object.assign(document.createElement('p'), {
      textContent: 'The map could not load. Use the garden list below.'
    }));
    return;
  }
  if (!map) {
    map = L.map('map').setView([35.63, -79.44], 7);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    markers = L.layerGroup().addTo(map);
  }

  markers.clearLayers();
  const points = [];
  const placed = [];
  for (const garden of feed.gardens) {
    if (!Number.isFinite(garden.lat) || !Number.isFinite(garden.lng)) continue;
    const point = [garden.lat, garden.lng];
    points.push(point);
    const latest = feed.reports.find(report => report.gardenId === garden.id);
    const color = latest?.plants === 'Healthy' ? '#247657' :
      latest?.plants === 'Needs attention' ? '#a94917' : '#5e6c62';

    const marker = L.marker(point, {
      title: garden.name, alt: garden.name, zIndexOffset: garden.id === selected ? 100 : 0,
      icon: L.divIcon({
        className: '',
        html: '<span style="display:block;width:18px;height:18px;background:' + color +
          ';border:3px solid white;border-radius:50%;box-shadow:0 1px 5px #333"></span>',
        iconSize: [18, 18]
      })
    }).addTo(markers);
    const popup = document.createElement('div');
    const link = document.createElement('a');
    link.href = gardenUrl(garden.id);
    link.textContent = garden.name;
    popup.append(link, document.createElement('br'), latest ? latest.date : 'No observation yet');
    if (garden.approximate) popup.append(document.createElement('br'), 'Approximate campus area');
    marker.bindPopup(popup);
    placed.push({ marker, point });
  }
  if (points.length && !map.atlasBoundsSet) {
    map.fitBounds(points, { padding: [30, 30], maxZoom: 10 });
    map.atlasBoundsSet = true;
  }
  const spreadPins = () => {
    const pixels = [];
    for (const { marker, point } of placed) {
      const position = map.latLngToLayerPoint(point);
      while (pixels.some(previous => previous.distanceTo(position) < 22)) position.x += 22;
      pixels.push(position);
      marker.setLatLng(map.layerPointToLatLng(position));
    }
  };
  if (map.atlasSpreadPins) map.off('zoomend', map.atlasSpreadPins);
  map.atlasSpreadPins = spreadPins;
  map.on('zoomend', spreadPins);
  spreadPins();
}

function render() {
  const garden = feed.gardens.find(item => item.id === selected);
  const reports = garden ? feed.reports.filter(report => report.gardenId === garden.id) : feed.reports;
  const names = new Map(feed.gardens.map(item => [item.id, item.name]));
  document.querySelector('#history-heading').textContent = garden ? garden.name + ' observations' : 'Garden observations';
  const historyNote = reports.length ?
    reports.length + (reports.length === 1 ? ' submitted observation.' : ' submitted observations.') :
    (loaded ? 'No observations submitted yet.' : 'No observations in the saved snapshot for this school.');
  document.querySelector('#history-note').textContent = loaded ? historyNote :
    historyNote + ' Snapshot from Nov 18, 2026. Live updates are pending.';

  const entries = reports.map(report => {
    const item = document.createElement('li');
    const heading = document.createElement('h3');
    heading.textContent = names.get(report.gardenId);
    const date = document.createElement('time');
    date.dateTime = report.date;
    date.textContent = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' })
      .format(new Date(report.date + 'T00:00:00Z'));
    const details = document.createElement('p');
    const sighting = report.sighting && (report.count === undefined ? report.sighting : report.sighting + ' (' + report.count + ')');
    details.textContent = [report.plants && 'Plants: ' + report.plants, report.soil && 'Soil: ' + report.soil,
      report.sunlight, sighting, report.care, report.urgency && 'Urgency: ' + report.urgency]
      .filter(Boolean).join(' · ');
    item.append(heading, date, details);
    return item;
  });
  document.querySelector('#observations').replaceChildren(...entries);
  share.hidden = !garden;
  shareStatus.textContent = '';
  const prefilled = garden && Object.hasOwn(window.ATLAS_PREFILLED_FORMS, garden.id) &&
    window.ATLAS_PREFILLED_FORMS[garden.id];
  for (const link of document.querySelectorAll('.report-link')) {
    link.href = prefilled || window.ATLAS_FORM_URL;
    link.hidden = false;
  }
  document.querySelector('#report-help').textContent = (garden ?
    (prefilled ? 'Confirm ' + garden.name + ' in the Google Form.' : 'Select ' + garden.name + ' in the Google Form.') :
    'Choose the school in the Google Form.') + ' Leave names and contact details out of your observation.';
  const cards = feed.gardens.map(item => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    const matching = feed.reports.filter(report => report.gardenId === item.id);
    link.href = gardenUrl(item.id);
    if (item.id === selected) link.setAttribute('aria-current', 'page');
    const title = document.createElement('h3');
    title.textContent = item.name;
    const subtitle = document.createElement('p');
    subtitle.textContent = matching.length ?
      matching.length + (matching.length === 1 ? ' observation' : ' observations') : 'View garden';
    link.append(title, subtitle);
    li.append(link);
    return li;
  });
  document.querySelector('#garden-cards').replaceChildren(...cards);
  document.querySelector('.hero').hidden = Boolean(garden);
  document.querySelector('.garden-directory').hidden = Boolean(garden);
  drawMap();
}

function loadFeed() {
  if (!window.ATLAS_FEED_URL) {
    feedStatus.textContent = 'Showing saved observations. Live spreadsheet updates are pending.';
    return;
  }
  refresh.hidden = false;
  refresh.disabled = true;
  feedStatus.textContent = 'Loading submitted observations…';
  let endpoint;
  try {
    endpoint = new URL(window.ATLAS_FEED_URL);
    if (endpoint.origin !== 'https://script.google.com' || !endpoint.pathname.endsWith('/exec')) throw new Error();
  } catch {
    refresh.disabled = false;
    feedStatus.textContent = 'The spreadsheet feed needs a valid Apps Script deployment URL.';
    return;
  }
  const request = String(Date.now());
  endpoint.searchParams.set('format', 'jsonp');
  endpoint.searchParams.set('request', request);
  const script = document.createElement('script');

  function finish(payload) {
    clearTimeout(timeout);
    delete window.milkweedAtlasFeed;
    script.remove();
    refresh.disabled = false;
    if (!payload?.ok || !Array.isArray(payload.gardens) || !Array.isArray(payload.reports)) {
      feedStatus.textContent = loaded ? 'Could not refresh. Showing the last loaded observations.' :
        'Could not load the live feed. Showing saved observations.';
      return;
    }
    feed.gardens = feed.gardens.map(garden => {
      const liveGarden = payload.gardens.find(item => item.id === garden.id);
      return liveGarden ? { ...garden, ...liveGarden } : garden;
    });
    feed.reports = payload.reports;
    loaded = true;
    feedStatus.textContent = selected && !feed.gardens.some(garden => garden.id === selected) ?
      'Garden link unavailable. Showing all gardens.' : 'Marker colors reflect the latest reported plant condition.';
    buildSelector();
    render();
  }

  const timeout = setTimeout(finish, 12000);
  window.milkweedAtlasFeed = (responseRequest, payload) => {
    if (responseRequest === request) finish(payload);
  };
  script.src = endpoint.href;
  script.onerror = () => finish();
  document.head.append(script);
}

gardenSelect.addEventListener('change', () => {
  selected = gardenSelect.value;
  history.replaceState(null, '', gardenUrl(selected));
  render();
  if (selected) document.querySelector('#history').scrollIntoView();
});
refresh.addEventListener('click', loadFeed);
share.addEventListener('click', async () => {
  const url = gardenUrl(selected).href;
  try {
    await navigator.clipboard.writeText(url);
    shareStatus.textContent = 'Garden link copied.';
  } catch {
    shareStatus.textContent = url;
  }
});
buildSelector();
render();
loadFeed();

// Refresh from the spreadsheet while this page is visible.
setInterval(() => {
  if (!document.hidden && !refresh.disabled && window.ATLAS_FEED_URL) loadFeed();
}, 60000);
