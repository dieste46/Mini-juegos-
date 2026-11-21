// Batería general: servir desde la raíz y desde una subcarpeta, sin conexión, exportar e importar partidas (formato nuevo,
// antiguo, archivos no válidos, copia retocada), y humo de los juegos (partida completa, otra vez, casa a mitad, dos temas).
// Necesita la web en :8800 y en :8801/mundojoor/ (lo monta pasar.sh).
const { chromium } = require('playwright');
const CACHE = require('fs').readFileSync(require('path').join(__dirname, '..', 'web', 'sw.js'), 'utf8').match(/mini-juegos-v\d+/)[0];   // la versión que toca, leída del repo
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'out');
const ROOT = 'http://localhost:8800/', SUB = 'http://localhost:8801/mundojoor/';
let fails = 0;
const ok = (name, cond, extra = '') => { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (extra ? '  — ' + extra : '')); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
// Perfiles iguales a los del origen. Un juego que el origen no conocía (la copia es de una versión anterior) puede aparecer
// con su estado inicial, porque se crea al pintar el menú; cualquier otra diferencia cuenta.
const INICIAL = JSON.stringify({ level: 1, streak: 0, misses: 0, played: 0, firstTry: 0, answered: 0 });
function igual(ahora, origen) {
  const a = JSON.parse(JSON.stringify(ahora));
  for (const id of Object.keys(a)) for (const g of Object.keys(a[id].games || {})) if (origen[id] && !(g in origen[id].games) && JSON.stringify(a[id].games[g]) === INICIAL) delete a[id].games[g];
  return JSON.stringify(a) === JSON.stringify(origen);
}

async function open(browser, url, opts = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, acceptDownloads: true, locale: 'es-ES' });
  const page = await context.newPage();
  const log = { errors: [], bad: [], dialogs: [], confirm: true };
  page.on('console', m => { if (m.type() === 'error') log.errors.push(m.text()); });
  page.on('pageerror', e => log.errors.push('pageerror: ' + e.message));
  page.on('response', r => { if (r.status() >= 400) log.bad.push(r.status() + ' ' + r.url()); });
  page.on('dialog', async d => {
    log.dialogs.push({ type: d.type(), msg: d.message() });
    if (d.type() === 'prompt') { const m = d.message().match(/(\d+) × (\d+)/); return d.accept(m ? String(m[1] * m[2]) : 'Dos'); }
    if (d.type() === 'confirm') return log.confirm ? d.accept() : d.dismiss();
    return d.accept();
  });
  await page.goto(url);
  if (opts.seed) {
    await page.evaluate(s => { localStorage.clear(); localStorage.setItem('juegos-peque-v1', JSON.stringify(s)); }, opts.seed);
    await page.reload();
  }
  await page.waitForSelector('.game-card');
  return { context, page, log };
}

// Dos jugadores con progreso y dos dibujos de verdad (PNG en IndexedDB).
async function fill(page) {
  await page.evaluate(async () => {
    const a = Store.profile;
    Core.gameState('contar').level = 3; Core.gameState('contar').played = 7; Core.gameState('contar').answered = 35; Core.gameState('contar').firstTry = 30;
    Core.gameState('super').total = 40; Core.gameState('raya').skin = 'tema';
    a.worlds.granja = { seen: 4 }; a.look = 'pegatina';
    Store.flush();
    const b = Store.addProfile('Dos'); b.avatar = '🦊'; b.stars = 5; b.theme = 'espacio'; Core.gameState('letras').level = 2;
    Store.device.voiceURI = 'voz-de-prueba';
    Store.switchProfile(a.id); Store.flush();
    for (const [i, pid] of [a.id, b.id].entries()) {
      const cv = document.createElement('canvas'); cv.width = 60; cv.height = 80;
      const c = cv.getContext('2d'); c.fillStyle = i ? '#f0f' : '#0a0'; c.fillRect(5, 5, 40, 40);
      const paint = await new Promise(res => cv.toBlob(res, 'image/png'));
      await Art.put({ id: 'dprueba' + i, profile: pid, page: '', w: 60, h: 80, updated: Date.now(), paint, thumb: cv.toDataURL('image/jpeg', .8) });
    }
  });
}
const stored = page => page.evaluate(() => { Store.flush(); return JSON.parse(localStorage.getItem('mini-juegos-store')); });
const drawings = page => page.evaluate(async () => (await Art.exportAll()).map(e => ({ id: e.id, profile: e.profile, n: e.paint.length })));

async function exportFrom(page, file) {
  await page.evaluate(() => (location.hash = 'padres'));
  await page.waitForSelector('#export');
  await sleep(300);   // la zona de padres prepara los dibujos al abrirse
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('#export').tap()]);
  await dl.saveAs(file);
  return { name: dl.suggestedFilename(), json: JSON.parse(fs.readFileSync(file, 'utf8')) };
}
async function importInto(page, log, file) {
  await page.evaluate(() => (location.hash = 'padres'));
  await page.waitForSelector('#import-file', { state: 'attached' });
  const before = log.dialogs.length;
  await page.setInputFiles('#import-file', file);
  for (let i = 0; i < 40 && !log.dialogs.slice(before).some(d => d.type === 'alert' || (d.type === 'confirm' && !log.confirm)); i++) await sleep(100);
  await sleep(300);
  return log.dialogs.slice(before);
}

(async () => {
  const browser = await chromium.launch();
  const SEED = { stars: 12, games: {}, name: 'Prueba' };

  // ---------- 1. Servida desde la raíz y desde una subcarpeta ----------
  for (const [label, base] of [['raíz', ROOT], ['subcarpeta', SUB]]) {
    const { context, page, log } = await open(browser, base, { seed: SEED });
    const info = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.ready;
      const murl = document.querySelector('link[rel=manifest]').href;
      const m = await (await fetch(murl)).json();
      const icons = await Promise.all(m.icons.map(async i => (await fetch(new URL(i.src, murl))).status));
      return { scope: reg.scope, start: new URL(m.start_url, murl).href, mscope: new URL(m.scope, murl).href, icons, touch: (await fetch(document.querySelector('link[rel=apple-touch-icon]').href)).status };
    });
    ok(`[${label}] service worker con ámbito ${base}`, info.scope === base, info.scope);
    ok(`[${label}] manifest: start_url y scope apuntan a la portada`, info.start === base && info.mscope === base, `${info.start} ${info.mscope}`);
    ok(`[${label}] iconos del manifest y apple-touch-icon responden 200`, info.icons.every(s => s === 200) && info.touch === 200, info.icons.join(','));
    await page.reload(); await page.waitForSelector('.game-card');     // segunda carga con red: llena la caché nueva
    await page.evaluate(() => (location.hash = 'contar')); await page.waitForSelector('.opt');
    await page.evaluate(() => (location.hash = '')); await page.waitForSelector('.game-card');
    await sleep(800);
    const cache = await page.evaluate(async () => { const k = await caches.keys(); const c = await caches.open(k[0]); return { keys: k, n: (await c.keys()).length }; });
    ok(`[${label}] caché ${CACHE} con archivos`, cache.keys.join() === CACHE && cache.n > 30, `${cache.keys} (${cache.n})`);
    ok(`[${label}] sin errores de consola ni respuestas 4xx/5xx`, !log.errors.length && !log.bad.length, [...log.errors, ...log.bad].join(' | '));
    await context.setOffline(true);
    await page.reload(); await page.waitForSelector('.game-card');
    const cards = await page.locator('.game-card').count();
    const imgs = await page.evaluate(() => [...document.images].filter(i => !i.complete || !i.naturalWidth).length);
    ok(`[${label}] sin conexión: el menú carga desde la caché`, cards >= 12 && imgs === 0, `${cards} tarjetas, ${imgs} imágenes rotas`);
    await context.close();
  }
  {
    const { context, page } = await open(browser, ROOT);
    await page.goto(ROOT + '404.html');
    ok('404.html carga y enlaza a la portada', await page.locator('#home').getAttribute('href') === '/');
    await context.close();
  }

  // ---------- 2. Exportar con la versión nueva ----------
  const NEW = path.join(OUT, 'nueva.json'), LEGACY = path.join(__dirname, 'datos', 'copia-antigua.json');
  let source;
  {
    const { context, page, log } = await open(browser, ROOT, { seed: SEED });
    await fill(page);
    const { name, json } = await exportFrom(page, NEW);
    source = await stored(page);
    ok('exportar: nombre del archivo', /^mundojoor-partidas-\d{4}-\d\d-\d\d\.json$/.test(name), name);
    ok('exportar: sobre con app, format, exportedAt y origin', json.app === 'mini-juegos' && json.format === 1 && !isNaN(Date.parse(json.exportedAt)) && json.origin === 'localhost:8800', JSON.stringify({ app: json.app, format: json.format, exportedAt: json.exportedAt, origin: json.origin }));
    ok('exportar: el guardado va entero dentro de "store"', JSON.stringify(json.store) === JSON.stringify(source));
    ok('exportar: perfiles, estrellas, estadísticas y ajustes', Object.keys(json.store.profiles).length === 2 && json.store.device.voiceURI === 'voz-de-prueba' && Object.values(json.store.profiles).some(p => p.stars === 12 && p.games.contar.firstTry === 30));
    ok('exportar: dos dibujos en PNG', json.arte.length === 2 && json.arte.every(e => e.paint.startsWith('data:image/png;base64,')));
    ok('exportar: sin errores', !log.errors.length, log.errors.join(' | '));
    await context.close();
  }

  // ---------- 3. Copia de referencia en el formato antiguo (sin sobre): así salían de la web anterior a la mudanza ----------
  const legacyJson = JSON.parse(fs.readFileSync(LEGACY, 'utf8')), legacySource = { ...legacyJson }; delete legacySource.arte;
  ok('copia de referencia: formato antiguo, sin sobre y con dos dibujos', legacyJson.format === undefined && legacyJson.v === 2 && legacyJson.arte.length === 2);

  // ---------- 4. Importar en un dispositivo limpio ----------
  for (const [label, file, src] of [['formato nuevo', NEW, source], ['formato antiguo', LEGACY, legacySource]]) {
    const { context, page, log } = await open(browser, ROOT, { seed: { stars: 1, games: {}, name: 'Otro' } });
    await page.evaluate(() => (location.hash = 'padres')); await page.waitForSelector('#export');
    const prev = await stored(page);
    const dialogs = await importInto(page, log, file);
    const conf = dialogs.find(d => d.type === 'confirm'), done = dialogs.find(d => d.type === 'alert');
    ok(`importar ${label}: la confirmación dice qué trae`, conf && /Prueba: ⭐ 12/.test(conf.msg) && /Dos: ⭐ 5/.test(conf.msg) && /2 dibujos/.test(conf.msg) && /Sustituir/.test(conf.msg), conf && conf.msg.replace(/\n/g, ' / '));
    ok(`importar ${label}: aviso final con los dibujos`, done && /Partidas importadas, con 2 dibujos/.test(done.msg), done && done.msg);
    const now = await stored(page);
    ok(`importar ${label}: perfiles idénticos a los del origen`, igual(now.profiles, src.profiles) && now.active === src.active && now.device.voiceURI === 'voz-de-prueba');
    ok(`importar ${label}: dibujos recuperados`, (await drawings(page)).length === 2);
    ok(`importar ${label}: lo anterior queda en mini-juegos-store-anterior`, await page.evaluate(p => localStorage.getItem('mini-juegos-store-anterior') === JSON.stringify(p), prev));
    await page.evaluate(() => (location.hash = '')); await page.waitForSelector('.game-card');
    ok(`importar ${label}: el menú saluda al jugador importado y aplica su estilo`, await page.locator('#title').getAttribute('aria-label') === 'Mundo Joor' && /Prueba/.test(await page.locator('.bubble').innerText()) && await page.evaluate(() => document.body.classList.contains('sticker')) && await page.locator('#star-count').innerText() === '12');
    await page.reload(); await page.waitForSelector('.game-card');
    ok(`importar ${label}: sigue ahí tras recargar`, igual((await stored(page)).profiles, src.profiles));
    // Pintar enseña el dibujo importado del jugador activo
    await page.evaluate(() => (location.hash = 'pintar')); await page.waitForSelector('.pick.mine');
    ok(`importar ${label}: el dibujo aparece en la galería de Pintar`, await page.locator('.pick.mine').count() === 1);
    ok(`importar ${label}: sin errores`, !log.errors.length, log.errors.join(' | '));
    await context.close();
  }

  // ---------- 5. Cancelar y archivos que no valen ----------
  {
    const { context, page, log } = await open(browser, ROOT, { seed: { stars: 3, games: {}, name: 'Intacto' } });
    await fill(page);
    await page.evaluate(() => (location.hash = 'padres')); await page.waitForSelector('#export');
    const before = JSON.stringify(await stored(page));
    log.confirm = false;
    let d = await importInto(page, log, NEW);
    ok('cancelar la confirmación: no cambia nada', d.some(x => x.type === 'confirm') && !d.some(x => x.type === 'alert') && JSON.stringify(await stored(page)) === before && await page.evaluate(() => localStorage.getItem('mini-juegos-store-anterior') === null));
    log.confirm = true;
    const good = JSON.parse(fs.readFileSync(NEW, 'utf8'));
    const cases = {
      'no es JSON': ['esto no es json', /no es una copia válida/],
      'JSON de otra cosa': [JSON.stringify({ hola: 1 }), /no es una copia válida/],
      'una lista': [JSON.stringify([1, 2]), /no es una copia válida/],
      'otra app': [JSON.stringify({ ...good, app: 'otra' }), /no es una copia válida/],
      'sin perfiles': [JSON.stringify({ ...good, store: { ...good.store, profiles: {} } }), /no es una copia válida/],
      'formato futuro': [JSON.stringify({ ...good, format: 2 }), /versión más nueva/],
      'guardado futuro': [JSON.stringify({ ...good, store: { ...good.store, v: 3 } }), /versión más nueva/]
    };
    for (const [label, [text, re]] of Object.entries(cases)) {
      const f = path.join(OUT, 'mal.json'); fs.writeFileSync(f, text);
      d = await importInto(page, log, f);
      ok(`archivo no válido (${label}): avisa y no toca nada`, d.length === 1 && d[0].type === 'alert' && re.test(d[0].msg) && JSON.stringify(await stored(page)) === before, d.map(x => x.type + ': ' + x.msg).join(' / '));
    }
    // El dispositivo no deja guardar (sin espacio): avisa y todo sigue como estaba, en disco y en memoria.
    await page.evaluate(() => { const o = Storage.prototype.setItem; window.__o = o; Storage.prototype.setItem = function (k, v) { if (k === 'mini-juegos-store' && JSON.parse(v).profiles && !Object.values(JSON.parse(v).profiles).some(p => p.name === 'Intacto')) throw new Error('lleno'); return o.call(this, k, v); }; });
    d = await importInto(page, log, NEW);
    await page.evaluate(() => { Storage.prototype.setItem = window.__o; });
    ok('sin espacio para guardar: avisa y no cambia nada', d.some(x => x.type === 'alert' && /No se ha podido guardar/.test(x.msg)) && JSON.stringify(await stored(page)) === before && await page.evaluate(() => Store.profiles().some(p => p.name === 'Intacto')), d.map(x => x.type + ': ' + x.msg.replace(/\n/g, ' / ')).join(' || '));
    ok('archivos no válidos: sin errores de consola', !log.errors.length, log.errors.join(' | '));
    await context.close();
  }

  // ---------- 6. Copia retocada a mano: no rompe ni cuela HTML ----------
  {
    const good = JSON.parse(fs.readFileSync(NEW, 'utf8'));
    const [idA, idB] = Object.keys(good.store.profiles);
    const A = good.store.profiles[idA];
    A.name = '<img src=x onerror="window.__xss=1">Ana'; A.avatar = '<b onclick="window.__xss=2">x</b>'; A.theme = '"><script>'; A.stars = '12abc';
    A.games.contar.level = 99; A.games.memoria = { level: 7, streak: -5, played: 'x' }; A.games.super.total = '<i>'; A.games.letras = 'no es un objeto';
    delete A.created;
    good.store.profiles['p"x'] = { ...good.store.profiles[idB], id: 'p"x' };
    good.arte[0].thumb = '"><img src=x onerror="window.__xss=3">';
    good.store.active = 'constructor';
    const raw = JSON.stringify(good).replace('"worlds":{', '"__proto__":{"contaminado":1},"worlds":{"__proto__":{"contaminado":1},');
    good.arte.push({ id: 'ok"id', profile: idA, paint: good.arte[1].paint, thumb: good.arte[1].thumb });
    const f = path.join(OUT, 'retocada.json'); fs.writeFileSync(f, raw);
    const { context, page, log } = await open(browser, ROOT);
    const d = await importInto(page, log, f);
    ok('copia retocada: se importa lo válido', d.some(x => x.type === 'alert' && /Partidas importadas, con 1 dibujo\./.test(x.msg)), d.map(x => x.msg.replace(/\n/g, ' / ')).join(' || '));
    const now = await stored(page), P = now.profiles[idA];
    ok('copia retocada: textos limpios y valores acotados', P.name === 'img src=x onerror="window.__xss=1"'.slice(0, 20) && !/[<>]/.test(P.avatar) && P.theme === 'granja' && P.stars === 0 && P.games.contar.level === 4 && P.games.memoria.level === 4 && P.games.memoria.streak === 0 && P.games.memoria.played === 0 && P.games.super.total === 'i' && P.games.letras.level === 1 && typeof P.created === 'string' && !now.profiles['p"x'],
      JSON.stringify({ name: P.name, avatar: P.avatar, theme: P.theme, stars: P.stars, contar: P.games.contar.level, memoria: P.games.memoria, total: P.games.super.total }));
    for (const h of ['', 'quien', 'padres', 'pintar', 'memoria', '']) { await page.evaluate(x => (location.hash = x), h); await sleep(400); }
    await page.waitForSelector('.game-card');
    ok('copia retocada: todas las pantallas pintan y no se ejecuta nada', await page.evaluate(() => window.__xss === undefined) && !log.errors.length, log.errors.join(' | '));
    ok('copia retocada: perfil activo válido y sin contaminar prototipos', raw.includes('__proto__') && now.active === idA && await page.evaluate(() => ({}).contaminado === undefined && Store.profile.contaminado === undefined && Store.profile.worlds.contaminado === undefined));
    await context.close();
  }

  // ---------- 7. Humo: partida completa, otra vez, casa a mitad y los dos temas ----------
  {
    const { context, page, log } = await open(browser, ROOT, { seed: SEED });
    await importInto(page, log, NEW);
    for (const theme of ['granja', 'espacio']) {
      await page.evaluate(() => (location.hash = '')); await page.waitForSelector('.game-card');
      if (await page.evaluate(t => Themes.current().id !== t, theme)) { await page.locator(`.theme-btn[data-t=${theme}]`).tap(); await sleep(300); }
      ok(`[${theme}] menú con sus tarjetas`, await page.evaluate(t => document.body.className.includes('theme-' + t), theme) && await page.locator('.game-card').count() >= 12, await page.evaluate(() => document.body.className));
      await page.locator('.game-card', { hasText: 'Cuenta' }).tap();
      await page.waitForSelector('.opt');
      const round = async () => {
        for (let i = 0; i < 80; i++) {
          if (await page.locator('#again').count()) return true;
          const b = page.locator('.opt:not(.wrong):not(.right)').first();
          if (await b.count()) { await b.dispatchEvent('click'); await sleep(250); } else await sleep(300);
        }
        return false;
      };
      ok(`[${theme}] Cuenta: partida completa hasta la pantalla final`, await round());
      await page.locator('#again').dispatchEvent('click'); await page.waitForSelector('.opt');
      ok(`[${theme}] Cuenta: "otra vez" empieza otra ronda`, await page.locator('.progress span.on').count() === 0);
      await page.locator('.opt:not(.wrong)').first().dispatchEvent('click'); await sleep(200);
      await page.locator('#btn-home').tap(); await page.waitForSelector('.game-card');
      await sleep(3000);   // un temporizador del juego cerrado no debe repintar encima del menú
      ok(`[${theme}] casa a mitad de partida: vuelve al menú y se queda`, await page.locator('.game-card').count() >= 12 && await page.locator('.opt').count() === 0);
    }
    // Acierto y casa enseguida, en los cuatro juegos de preguntas: la siguiente pregunta no debe pintarse encima del menú.
    for (const game of ['contar', 'colores', 'letras', 'series']) {
      await page.evaluate(g => (location.hash = g), game); await page.waitForSelector('.opt');
      for (let i = 0; i < 6 && !(await page.locator('.opt.right').count()); i++) { await page.locator('.opt:not(.wrong)').first().dispatchEvent('click'); await sleep(60); }
      await page.locator('#btn-home').tap(); await page.waitForSelector('.game-card');
      await sleep(3200);
      ok(`${game}: acierto y casa enseguida, el menú se queda`, await page.locator('.game-card').count() >= 12 && await page.locator('.opt').count() === 0);
    }
    // Entrar y salir de cada juego (también el oculto): a los 3,5 s el menú sigue ahí.
    const ids = await page.evaluate(() => Games.map(g => g.id));
    const zombis = [];
    for (const id of ids) {
      await page.evaluate(g => (location.hash = g), id); await sleep(900);
      for (const b of (await page.locator('#app button').all()).slice(0, 2)) { try { await b.dispatchEvent('click'); } catch {} await sleep(150); }
      await page.locator('#btn-home').tap(); await sleep(3500);
      const st = await page.evaluate(() => ({ cards: document.querySelectorAll('.game-card').length, hash: location.hash, hidden: document.getElementById('btn-home').hidden }));
      if (st.hash === '' ? st.cards < 12 : false) zombis.push(id);
      if (st.hash !== '') { await page.evaluate(() => (location.hash = '')); await sleep(300); }
    }
    ok(`entrar y salir de los ${ids.length} juegos: ninguno repinta encima del menú`, !zombis.length, zombis.join(', '));
    // Título del menú y nombres de sección
    await page.evaluate(() => (location.hash = '')); await page.waitForSelector('.game-card');
    const secciones = await page.locator('.section-title').allInnerTexts();
    ok('menú: secciones "Minijuegos" y "Pequesabios"', secciones.map(s => s.replace(/[^\p{L}]/gu, '')).join() === 'Minijuegos,Pequesabios', secciones.join(' | '));
    ok('menú: título y pestaña "Mundo Joor", y saludo con el nombre', await page.locator('#title').getAttribute('aria-label') === 'Mundo Joor' && await page.title() === 'Mundo Joor' && /Hola, Prueba/.test(await page.locator('.bubble').innerText()));
    await page.evaluate(() => { Core.setName('<b>Ana</b>'); location.hash = 'x'; location.hash = ''; }); await sleep(400);
    ok('menú: un nombre con símbolos se pinta como texto', await page.evaluate(() => document.querySelector('.bubble').textContent.includes('<b>Ana</b>') && !document.querySelector('.bubble b')));
    await page.evaluate(() => { Core.setName('Prueba'); location.hash = 'x'; location.hash = ''; }); await sleep(300);
    // Prueba temporal de la franja de arriba: los tres modos, con el menú siempre utilizable
    await page.evaluate(() => (location.hash = 'padres')); await page.waitForSelector('#export');
    const hayPrueba = await page.locator('.barm').count() > 0;
    if (!hayPrueba) ok('la prueba temporal de la franja no está en esta versión', await page.evaluate(() => !document.querySelector('.barm') && !/barra-fija|pagina-quieta/.test([...document.styleSheets].map(s => [...s.cssRules].map(r => r.cssText).join('')).join(''))));
    for (const [modo, clase] of hayPrueba ? [['fija', 'body.barra-fija'], ['quieta', 'html.pagina-quieta'], ['normal', null]] : []) {
      await page.evaluate(() => (location.hash = 'padres')); await page.waitForSelector('.barm');
      await page.locator(`.barm[data-m=${modo}]`).tap(); await sleep(200);
      await page.evaluate(() => (location.hash = '')); await page.waitForSelector('.game-card'); await sleep(300);
      const st = await page.evaluate(async c => {
        const tb = document.querySelector('.topbar'), main = document.querySelector('main'), first = document.querySelector('.hello');
        const scroller = document.documentElement.classList.contains('pagina-quieta') ? main : document.scrollingElement;
        const tapa = first.getBoundingClientRect().top >= tb.getBoundingClientRect().bottom - 1;      // la barra no pisa el saludo
        scroller.scrollTop = 600; await new Promise(r => setTimeout(r, 150));
        const r = { activa: c ? !!document.querySelector(c) : !document.querySelector('body.barra-fija, html.pagina-quieta'), tapa, baja: scroller.scrollTop > 300, barraArriba: Math.round(tb.getBoundingClientRect().top) };
        scroller.scrollTop = 0; return r;
      }, clase);
      ok(`prueba de la franja, modo "${modo}": se aplica, la barra no pisa el saludo y el menú se desplaza`, st.activa && st.tapa && st.baja && (modo === 'normal' ? st.barraArriba < 0 : st.barraArriba === 0), JSON.stringify(st));
      if (modo !== 'normal') {
        await page.locator('.game-card', { hasText: 'Cuenta' }).tap(); await page.waitForSelector('.opt');
        await page.locator('#btn-home').tap(); await page.waitForSelector('.game-card');
        ok(`prueba de la franja, modo "${modo}": se entra en un juego y la casa vuelve al menú`, await page.locator('.game-card').count() >= 12);
      }
    }
    await page.screenshot({ path: path.join(OUT, 'menu.png') });
    ok('humo: sin errores', !log.errors.length, log.errors.join(' | '));
    await page.evaluate(() => (location.hash = 'padres')); await page.waitForSelector('#export');
    await page.locator('#export').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(OUT, 'padres.png') });
    await context.close();
  }

  await browser.close();
  console.log(fails ? `\n${fails} FALLOS` : '\nTodo bien');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
