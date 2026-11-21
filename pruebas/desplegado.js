// Comprobación contra una dirección ya publicada (vista previa o producción): node pruebas/desplegado.js https://…/
// Carga, service worker, manifest, 404, caché, importar una copia antigua, exportar y funcionamiento sin conexión.
const { chromium } = require('playwright');
const CACHE = require('fs').readFileSync(require('path').join(__dirname, '..', 'web', 'sw.js'), 'utf8').match(/mini-juegos-v\d+/)[0];   // la versión que toca, leída del repo
const fs = require('fs'), path = require('path');
const BASE = process.argv[2], OUT = path.join(__dirname, 'out');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ok = (n, c, x = '') => { if (!c) fails++; console.log((c ? 'OK   ' : 'FAIL ') + n + (x ? '  — ' + x : '')); };
(async () => {
  const browser = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY } });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, acceptDownloads: true, locale: 'es-ES' });
  const page = await context.newPage();
  const log = { errors: [], bad: [], dialogs: [] };
  page.on('console', m => { if (m.type() === 'error') log.errors.push(m.text()); });
  page.on('pageerror', e => log.errors.push('pageerror: ' + e.message));
  page.on('response', r => { if (r.status() >= 400) log.bad.push(r.status() + ' ' + r.url()); });
  page.on('dialog', async d => { log.dialogs.push({ type: d.type(), msg: d.message() }); if (d.type() === 'prompt') { const m = d.message().match(/(\d+) × (\d+)/); return d.accept(String(m[1] * m[2])); } return d.accept(); });
  await page.goto(BASE, { waitUntil: 'load' }); await page.waitForSelector('.game-card');
  const info = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready, murl = document.querySelector('link[rel=manifest]').href, m = await (await fetch(murl)).json();
    return { scope: reg.scope, start: new URL(m.start_url, murl).href, mscope: new URL(m.scope, murl).href, icons: await Promise.all(m.icons.map(async i => (await fetch(new URL(i.src, murl))).status)), falta: (await fetch('no-existe.js')).status };
  });
  ok('service worker registrado con ámbito ' + BASE, info.scope === BASE, info.scope);
  ok('manifest: start_url y scope en la portada, iconos 200', info.start === BASE && info.mscope === BASE && info.icons.every(s => s === 200), `${info.start} ${info.icons}`);
  ok('un archivo que falta da 404 (no la portada con un 200)', info.falta === 404, String(info.falta));
  log.bad = log.bad.filter(x => !x.includes('no-existe.js'));
  { const i = log.errors.findIndex(e => /404 \(Not Found\)/.test(e)); if (i >= 0) log.errors.splice(i, 1); }   // el 404 provocado a propósito
  await page.reload(); await page.waitForSelector('.game-card');
  await page.evaluate(() => (location.hash = 'contar')); await page.waitForSelector('.opt'); await page.evaluate(() => (location.hash = '')); await page.waitForSelector('.game-card'); await sleep(1500);
  const cache = await page.evaluate(async () => { const k = await caches.keys(); return { k, n: (await (await caches.open(k[0])).keys()).length }; });
  ok(`caché ${CACHE} con archivos`, cache.k.join() === CACHE && cache.n > 30, `${cache.k} (${cache.n})`);
  // importar la copia hecha con la versión de producción (formato antiguo)
  await page.evaluate(() => (location.hash = 'padres')); await page.waitForSelector('#import-file', { state: 'attached' });
  await page.setInputFiles('#import-file', path.join(__dirname, 'datos', 'copia-antigua.json'));
  for (let i = 0; i < 50 && !log.dialogs.some(d => d.type === 'alert'); i++) await sleep(100);
  ok('importar una copia de la versión antigua', log.dialogs.some(d => d.type === 'confirm' && /Prueba: ⭐ 12/.test(d.msg)) && log.dialogs.some(d => /Partidas importadas, con 2 dibujos/.test(d.msg)), log.dialogs.map(d => d.msg.replace(/\n/g, ' / ')).join(' || '));
  await sleep(300);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('#export').tap()]);
  const f = path.join(OUT, 'remota.json'); await dl.saveAs(f); const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  ok('exportar: sobre con formato 1 y el origen de la vista previa', j.app === 'mini-juegos' && j.format === 1 && j.origin === new URL(BASE).host && Object.keys(j.store.profiles).length === 2 && j.arte.length === 2, `${j.origin} ${dl.suggestedFilename()}`);
  ok('sin errores de consola ni respuestas 4xx/5xx', !log.errors.length && !log.bad.length, [...log.errors, ...log.bad].join(' | '));
  await context.setOffline(true); await page.evaluate(() => (location.hash = '')); await page.reload(); await page.waitForSelector('.game-card');
  ok('sin conexión: el menú carga desde la caché con el jugador importado', await page.locator('.game-card').count() >= 12 && /Prueba/.test(await page.locator('.bubble').innerText()));
  await context.setOffline(false);
  await page.screenshot({ path: path.join(OUT, 'vista-previa.png') });
  await browser.close();
  console.log(fails ? `\n${fails} FALLOS` : '\nTodo bien'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
