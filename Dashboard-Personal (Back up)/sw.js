// Incrementar CACHE_NAME manualmente con cada release que modifique archivos JS
// para que el Service Worker invalide el caché en todos los dispositivos.
const CACHE_NAME = 'apg-dashboard-v6';
const ASSETS = [
  './',
  './index.html',
  './dashboard.html',
  './dashboard.css',
  './dashboard.js',
  './manifest.json',
  './commitments-data.js',
  './icon.svg',
  './icon-512.svg',
  './js/core/constants.js',
  './js/core/utils.js',
  './js/modules/agenda.js',
  './js/modules/feedback.js',
  './js/modules/kpi-history.js',
  './js/modules/kpis.js',
  './js/modules/launch-mode.js',
  './js/modules/meeting-notes.js',
  './js/modules/meetings.js',
  './js/modules/pulse-check.js',
  './js/modules/reconocimientos.js',
  './js/modules/tasks.js',
  './js/modules/tb-sessions.js',
  './js/modules/team.js',
  './js/modules/voz-cliente.js',
  './js/modules/weekly-routine.js',
  './js/ui/notifications.js',
  './js/ui/tabs.js',
  './js/ui/theme.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async c => {
      await c.addAll(ASSETS);
      // config.js es opcional — no romper install si no existe
      try { await c.add('./config.js'); } catch(_) {}
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});