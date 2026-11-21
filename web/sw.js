// Caché sencilla "red primero": funciona offline tras la primera visita y siempre coge lo último si hay conexión.
const CACHE = 'mini-juegos-v27';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  // Solo se borran cachés propias: en GitHub Pages el dominio se comparte con otros proyectos (p. ej. "bloques-v1").
  caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('mini-juegos-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return r; })
      .catch(() => caches.match(e.request))
  );
});
