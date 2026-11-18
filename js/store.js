/* Store: todo lo que se guarda, en un solo sitio.
   - Varios perfiles (un niño = un perfil); cada perfil lleva su progreso, su tema y sus mundos.
   - Ajustes del dispositivo aparte (la voz depende del aparato, no del niño).
   - Esquema versionado con migraciones: añadir campos nuevos no rompe lo guardado.
   - Guardado diferido (se agrupan cambios) y forzado al cerrar o salir de la app.
   - Hoy se guarda en este dispositivo (localStorage). Para sincronizar en el futuro basta con
     otro "adaptador" con load()/save() (p. ej. Supabase): el resto del código no cambia. */
const Store = (() => {
  const KEY = 'mini-juegos-store';
  const OLD_KEY = 'juegos-peque-v1';      // versión 1, un solo niño
  const VERSION = 2;

  const newProfile = (name = '') => ({
    id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name, avatar: '🙂', theme: 'granja', look: 'normal',
    stars: 0, games: {}, worlds: {},
    created: new Date().toISOString(), updated: new Date().toISOString()
  });

  // ---------- Adaptador local ----------
  const local = {
    load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } },
    save(data) { try { localStorage.setItem(KEY, JSON.stringify(data)); return true; } catch { return false; } },
    loadOld() { try { return JSON.parse(localStorage.getItem(OLD_KEY)); } catch { return null; } }
  };

  // ---------- Migraciones ----------
  function fromV1(old) {
    const p = newProfile(old.name || '');
    p.stars = old.stars || 0;
    p.games = old.games || {};
    if (old.farmSeen) p.worlds.granja = { seen: old.farmSeen };
    return { v: VERSION, active: p.id, profiles: { [p.id]: p }, device: { voiceURI: old.voiceURI || '' } };
  }
  function migrate(d) {
    if (!d || typeof d !== 'object') return null;
    // if (d.v === 2) { ...cambios para v3...; d.v = 3; }
    d.device = d.device || {};
    d.profiles = d.profiles || {};
    Object.values(d.profiles).forEach(p => { p.games = p.games || {}; p.worlds = p.worlds || {}; p.theme = p.theme || 'granja'; p.look = p.look || 'normal'; });
    return d;
  }

  let data = migrate(local.load());
  if (!data) {
    const old = local.loadOld();
    data = old ? fromV1(old) : (() => { const p = newProfile(); return { v: VERSION, active: p.id, profiles: { [p.id]: p }, device: {} }; })();
    local.save(data);   // la clave antigua se deja como copia de seguridad
  }
  if (!data.profiles[data.active]) data.active = Object.keys(data.profiles)[0];

  // ---------- Guardado diferido ----------
  let timer = null;
  function flush() { clearTimeout(timer); timer = null; local.save(data); }
  function save() {
    const p = data.profiles[data.active]; if (p) p.updated = new Date().toISOString();
    clearTimeout(timer); timer = setTimeout(flush, 400);
  }
  addEventListener('pagehide', () => { if (timer) flush(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && timer) flush(); });

  // Pide al navegador que no borre los datos por falta de espacio o por no usar la web unos días.
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  // ---------- Perfiles ----------
  const profile = () => data.profiles[data.active];
  const profiles = () => Object.values(data.profiles).sort((a, b) => a.created.localeCompare(b.created));
  function addProfile(name) { const p = newProfile(name); data.profiles[p.id] = p; data.active = p.id; flush(); return p; }
  function switchProfile(id) { if (data.profiles[id]) { data.active = id; flush(); } }
  function removeProfile(id) {
    if (Object.keys(data.profiles).length < 2) return false;
    delete data.profiles[id];
    if (data.active === id) data.active = Object.keys(data.profiles)[0];
    flush(); return true;
  }
  function resetProgress() {
    const p = profile(); Object.assign(p, { stars: 0, games: {}, worlds: {} }); flush();
  }

  // ---------- Copia de seguridad ----------
  const exportJSON = () => JSON.stringify(data, null, 1);
  function importJSON(text) {
    const d = migrate(JSON.parse(text));
    if (!d || !d.profiles || !Object.keys(d.profiles).length) throw new Error('Copia no válida');
    data = d; if (!data.profiles[data.active]) data.active = Object.keys(data.profiles)[0];
    flush();
  }

  return {
    get profile() { return profile(); }, get device() { return data.device; },
    profiles, addProfile, switchProfile, removeProfile, resetProgress,
    save, flush, exportJSON, importJSON
  };
})();
