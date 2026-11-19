/* Art: galería de dibujos guardada en el dispositivo (IndexedDB, porque las imágenes no caben en localStorage).
   Cada dibujo: { id, profile, page, w, h, updated, paint: Blob PNG, thumb: dataURL }.
   Si IndexedDB no está disponible (navegación privada), se guarda en memoria mientras dure la sesión. */
const Art = (() => {
  const DB = 'mini-juegos-arte', STORE = 'dibujos';
  const mem = new Map();
  let dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise(resolve => {
      try {
        const rq = indexedDB.open(DB, 1);
        rq.onupgradeneeded = () => rq.result.createObjectStore(STORE, { keyPath: 'id' }).createIndex('profile', 'profile');
        rq.onsuccess = () => resolve(rq.result);
        rq.onerror = rq.onblocked = () => resolve(null);
      } catch { resolve(null); }
    });
    return dbp;
  }
  const run = (mode, fn) => db().then(d => d ? new Promise(res => {
    try {
      const tx = d.transaction(STORE, mode), rq = fn(tx.objectStore(STORE));
      tx.oncomplete = () => res(rq ? rq.result : undefined);
      tx.onerror = tx.onabort = () => res(undefined);
    } catch { res(undefined); }
  }) : null);

  async function list(profile) {
    const r = await run('readonly', s => s.index('profile').getAll(profile));
    const all = r || [...mem.values()].filter(e => e.profile === profile);
    return all.sort((a, b) => b.updated - a.updated);
  }
  async function put(entry) { mem.set(entry.id, entry); await run('readwrite', s => s.put(entry)); }
  async function get(id) { return (await run('readonly', s => s.get(id))) || mem.get(id) || null; }
  async function remove(id) { mem.delete(id); await run('readwrite', s => s.delete(id)); }
  // Copia de seguridad: los dibujos de todos los jugadores, con la imagen convertida a texto para que quepa en el JSON
  const toURL = blob => new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => res(null); r.readAsDataURL(blob); });
  function toBlob(url) {
    const [head, b64] = url.split(','), bin = atob(b64), bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: (head.match(/data:([^;]+)/) || [])[1] || 'image/png' });
  }
  async function exportAll() {
    const all = (await run('readonly', s => s.getAll())) || [...mem.values()], out = [];
    for (const e of all) { const paint = e.paint instanceof Blob ? await toURL(e.paint) : e.paint; if (paint) out.push({ ...e, paint }); }
    return out;
  }
  async function importAll(list) {
    let n = 0;
    for (const e of list || []) { try { await put({ ...e, paint: typeof e.paint === 'string' ? toBlob(e.paint) : e.paint }); n++; } catch {} }
    return n;
  }
  return { list, put, get, remove, exportAll, importAll };
})();
