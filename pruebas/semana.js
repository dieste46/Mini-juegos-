// Letra de la semana: se elige en la zona de padres, sale más veces en Letras y viaja en la copia.
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const OUT = path.join(__dirname, 'out'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ok = (n, c, x = '') => { if (!c) fails++; console.log((c ? 'OK   ' : 'FAIL ') + n + (x ? '  — ' + x : '')); };
(async () => {
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, acceptDownloads: true }); const p = await c.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const dialogs = []; p.on('dialog', async d => { dialogs.push(d.message()); if (d.type() === 'prompt') { const m = d.message().match(/(\d+) × (\d+)/); return d.accept(String(m[1] * m[2])); } return d.accept(); });
  await p.goto('http://localhost:8800/'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('juegos-peque-v1', JSON.stringify({ stars: 3, games: {}, name: 'Prueba' })); }); await p.reload(); await p.waitForSelector('.game-card');
  // cuántas preguntas tratan de cada letra, en N entradas al juego con un nivel dado
  const reparto = async (nivel, N = 80) => { const n = {}; for (let i = 0; i < N; i++) {
      await p.evaluate(l => { const g = Core.gameState('letras'); g.level = l; g.streak = 0; g.misses = 0; location.hash = 'x'; location.hash = 'letras'; }, nivel); await p.waitForSelector('.opt');
      const L = await p.evaluate(() => { const t = document.querySelector('.prompt span').textContent, s = document.querySelector('.stage').textContent.trim(); const m = t.match(/empieza (\S+?)\?/); return m ? m[1][0].toUpperCase().normalize('NFD')[0] : s[0]; });
      n[L] = (n[L] || 0) + 1; } return n; };
  let r = await reparto(1);
  ok('sin letra de la semana, el nivel 1 solo pregunta vocales', Object.keys(r).every(l => 'AEIOU'.includes(l)), JSON.stringify(r));
  await p.evaluate(() => (location.hash = 'padres')); await p.waitForSelector('.wk');
  ok('zona de padres: once letras para elegir y "Ninguna" marcada', await p.locator('.wk').count() === 12 && await p.locator('.wk.on').innerText() === 'Ninguna');
  await p.locator('.wk[data-l=D]').tap(); await sleep(200);
  ok('al elegir la D queda marcada y guardada en el perfil', await p.locator('.wk.on').innerText() === 'D' && await p.evaluate(() => { Store.flush(); return JSON.parse(localStorage.getItem('mini-juegos-store')).profiles[Store.profile.id].letter; }) === 'D');
  await p.locator('.wk[data-l=D]').scrollIntoViewIfNeeded(); await p.screenshot({ path: path.join(OUT, 'semana-padres.png') });
  for (const nivel of [1, 2, 3]) { r = await reparto(nivel); const d = r.D || 0;
    ok(`con la D de letra de la semana, nivel ${nivel}: la D sale en torno al 40 % y siguen saliendo otras`, d >= 20 && d <= 52 && Object.keys(r).length >= 4, JSON.stringify(r)); }
  // la copia exportada la lleva y al importarla se conserva
  await p.evaluate(() => (location.hash = 'padres')); await p.waitForSelector('#export'); await sleep(300);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.locator('#export').tap()]); const f = path.join(OUT, 'semana.json'); await dl.saveAs(f);
  const j = JSON.parse(fs.readFileSync(f, 'utf8')); const id = Object.keys(j.store.profiles)[0];
  await p.locator('.wk[data-l=""]').tap(); await sleep(200);
  ok('"Ninguna" la quita', await p.evaluate(() => Store.profile.letter === undefined));
  await p.setInputFiles('#import-file', f); for (let i = 0; i < 40 && !dialogs.some(d => /Partidas importadas/.test(d)); i++) await sleep(100);
  ok('exportar e importar conservan la letra de la semana', j.store.profiles[id].letter === 'D' && await p.evaluate(() => Store.profile.letter) === 'D');
  j.store.profiles[id].letter = '<b>'; fs.writeFileSync(f, JSON.stringify(j)); dialogs.length = 0;
  await p.setInputFiles('#import-file', f); for (let i = 0; i < 40 && !dialogs.some(d => /Partidas importadas/.test(d)); i++) await sleep(100);
  ok('una letra rara en una copia se descarta', await p.evaluate(() => Store.profile.letter === undefined));
  ok('sin errores', !errs.length, errs.join(' | '));
  await b.close(); console.log(fails ? `\n${fails} FALLOS` : '\nTodo bien'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
