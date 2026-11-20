/* Store: todo lo que se guarda, en un solo sitio.
   - Varios perfiles (un niño = un perfil); cada perfil lleva su progreso, su tema y sus mundos.
   - Ajustes del dispositivo aparte (la voz depende del aparato, no del niño).
   - Esquema versionado con migraciones: añadir campos nuevos no rompe lo guardado.
   - Guardado diferido (se agrupan cambios) y forzado al cerrar o salir de la app.
   - Se guarda en este dispositivo (localStorage) y este módulo es la única puerta: nadie más lee ni escribe.
     La sincronización prevista (docs/PLAN.md, 4.0) irá en un módulo aparte que observa estos cambios y los
     envía a la API; lo local sigue mandando y el resto del código no cambia. */
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

  // ---------- Copia de seguridad (exportar / importar partidas) ----------
  // El archivo lleva su propia versión de formato, distinta de la del guardado (v), para poder migrarlo:
  //   { app: 'mini-juegos', format: 1, exportedAt, origin, store: { v, active, profiles, device }, arte: [dibujos] }
  // Las copias anteriores no llevaban sobre: eran el propio guardado con "arte" dentro. Se siguen aceptando,
  // porque así sale la copia de la web antigua.
  const APP = 'mini-juegos', FORMAT = 1;
  const PREV_KEY = KEY + '-anterior';      // lo que había antes de la última importación, por si se importa el archivo equivocado

  const fail = code => Object.assign(new Error('Copia no válida: ' + code), { code });
  const isObj = x => !!x && typeof x === 'object' && !Array.isArray(x);
  const isId = x => typeof x === 'string' && /^[\w-]{1,40}$/.test(x) && x !== '__proto__';
  const IMG = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/;
  // Los textos de una copia acaban pintados en pantalla: fuera lo que podría colarse como HTML.
  const txt = (x, max, def = '') => (typeof x === 'string' ? x.replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, max) : def);
  const date = (x, def) => (typeof x === 'string' && !isNaN(Date.parse(x)) ? x : def);
  const num = x => (Number.isFinite(x) ? x : 0);
  // Los datos de un juego son libres ("lo que el juego añada"): se conserva la forma y se limpia lo que podría romper la pantalla.
  function clean(x, depth = 0) {
    if (typeof x === 'number') return num(x);
    if (typeof x === 'boolean' || x === null) return x;
    if (typeof x === 'string') return txt(x, 200);
    if (depth > 5) return null;
    if (Array.isArray(x)) return x.slice(0, 500).map(v => clean(v, depth + 1));
    if (isObj(x)) { const o = {}; Object.keys(x).slice(0, 200).forEach(k => { if (k.length <= 60 && k !== '__proto__') o[k] = clean(x[k], depth + 1); }); return o; }
    return null;
  }
  const count = x => Math.max(0, Math.floor(Number(x) || 0));
  const cleanArt = e => (isObj(e) && isId(e.id) && isId(e.profile) && IMG.test(e.paint) && IMG.test(e.thumb)
    ? { id: e.id, profile: e.profile, page: isId(e.page) ? e.page : '', w: num(e.w), h: num(e.h), updated: num(e.updated), paint: e.paint, thumb: e.thumb }
    : null);
  function cleanProfile(id, p) {
    const now = new Date().toISOString(), games = {};
    Object.keys(isObj(p.games) ? p.games : {}).forEach(g => {
      if (!isId(g) || !isObj(p.games[g])) return;
      const s = clean(p.games[g]);
      ['streak', 'misses', 'played', 'firstTry', 'answered'].forEach(k => (s[k] = count(s[k])));
      s.level = Math.min(9, Math.max(1, count(s.level)));
      games[g] = s;
    });
    return {
      id, name: txt(p.name, 20), avatar: txt(p.avatar, 8, '🙂') || '🙂',
      theme: isId(p.theme) ? p.theme : 'granja', look: p.look === 'pegatina' ? 'pegatina' : 'normal',
      stars: count(p.stars), games, worlds: isObj(p.worlds) ? clean(p.worlds) : {},
      created: date(p.created, now), updated: date(p.updated, now)
    };
  }

  const exportBackup = (arte = []) => ({
    app: APP, format: FORMAT, exportedAt: new Date().toISOString(), origin: location.host,
    store: JSON.parse(JSON.stringify(data)), arte
  });

  // Lee y valida una copia sin tocar nada de lo guardado. Devuelve lo que se va a importar y un resumen para enseñarlo
  // antes de confirmar. Lanza un error con code 'nueva' (copia de una versión posterior) o 'invalida'.
  function readBackup(raw) {
    if (!isObj(raw)) throw fail('invalida');
    let src, arte, exportedAt = null;
    if (raw.format !== undefined || raw.store !== undefined) {
      if (raw.app !== APP || !Number.isInteger(raw.format) || raw.format < 1) throw fail('invalida');
      if (raw.format > FORMAT) throw fail('nueva');
      // if (raw.format === 1) { ...cambios para el formato 2... }
      src = raw.store; arte = raw.arte; exportedAt = date(raw.exportedAt, null);
    } else {
      src = raw; arte = raw.arte;                                   // copia sin sobre
      if (isObj(src) && !src.profiles && isObj(src.games)) src = fromV1(src);   // guardado de un solo niño
    }
    if (!isObj(src) || !isObj(src.profiles)) throw fail('invalida');
    if (Number(src.v) > VERSION) throw fail('nueva');
    const profiles = {};
    Object.keys(src.profiles).forEach(id => { if (isId(id) && isObj(src.profiles[id])) profiles[id] = cleanProfile(id, src.profiles[id]); });
    const ids = Object.keys(profiles);
    if (!ids.length) throw fail('invalida');
    const store = migrate({
      v: VERSION, active: ids.includes(src.active) ? src.active : ids[0], profiles,
      device: { voiceURI: txt(isObj(src.device) ? src.device.voiceURI : '', 200) }
    });
    arte = (Array.isArray(arte) ? arte : []).map(cleanArt).filter(Boolean);
    return {
      store, arte, exportedAt,
      resumen: { jugadores: ids.map(id => ({ name: profiles[id].name, stars: profiles[id].stars })), dibujos: arte.length }
    };
  }

  // Sustituye lo guardado por una copia ya validada con readBackup().
  // Devuelve false si el dispositivo no deja guardar; en ese caso todo sigue como estaba.
  function importBackup(copy) {
    flush();                                                   // lo pendiente, a disco: es lo que queda como "anterior"
    try { localStorage.setItem(PREV_KEY, JSON.stringify(data)); } catch {}
    if (!local.save(copy.store)) {                             // sin sitio: se intenta sin guardar lo anterior
      try { localStorage.removeItem(PREV_KEY); } catch {}
      if (!local.save(copy.store)) { local.save(data); return false; }
    }
    data = copy.store;
    return true;
  }

  return {
    get profile() { return profile(); }, get device() { return data.device; },
    profiles, addProfile, switchProfile, removeProfile, resetProgress,
    save, flush, exportBackup, readBackup, importBackup
  };
})();
