// Pruebas del botón "?" y la ventana "Cómo se juega".
const { chromium } = require('playwright');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:8800/', OUT = path.join(__dirname, 'out');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ok = (n, c, x = '') => { if (!c) fails++; console.log((c ? 'OK   ' : 'FAIL ') + n + (x ? '  — ' + x : '')); };
(async () => {
  const browser = await chromium.launch(BASE.includes('localhost') ? {} : { proxy: { server: process.env.HTTPS_PROXY } });
  async function open(vp) {
    const context = await browser.newContext({ viewport: vp, hasTouch: true, isMobile: true, deviceScaleFactor: 2, locale: 'es-ES' });
    await context.addInitScript(() => { window.__said = []; window.__cancel = 0; const P = window.SpeechSynthesis && SpeechSynthesis.prototype; if (P) { P.speak = function (u) { window.__said.push(u.text); }; const c = P.cancel; P.cancel = function () { window.__cancel++; return c.call(this); }; } });
    const page = await context.newPage(); const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('dialog', async d => { if (d.type() === 'prompt') { const m = d.message().match(/(\d+) × (\d+)/); return d.accept(String(m[1] * m[2])); } return d.accept(); });
    await page.goto(BASE); await page.evaluate(() => { localStorage.clear(); localStorage.setItem('juegos-peque-v1', JSON.stringify({ stars: 67, games: {}, name: 'Prueba' })); });
    await page.reload(); await page.waitForSelector('.game-card');
    return { context, page, errors };
  }
  const go = async (page, h) => { await page.evaluate(x => { location.hash = 'x'; location.hash = x; }, h); await sleep(350); };

  // ---------- 1. El botón sale en todos los juegos y el título sigue cabiendo ----------
  for (const vp of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) {
    const { context, page, errors } = await open(vp);
    const ids = await page.evaluate(() => Games.map(g => g.id));
    const mal = [];
    for (const look of ['normal', 'pegatina']) {
      await page.evaluate(l => { Store.profile.look = l; Store.save(); Themes.apply(); }, look);
      for (const id of ids) {
        await go(page, id);
        const m = await page.evaluate(() => { const h = document.getElementById('title'), b = document.getElementById('btn-help'), s = document.querySelector('.stars'), tb = document.querySelector('.topbar');
          return { visible: !b.hidden && b.getBoundingClientRect().width > 40, cabe: h.scrollWidth <= h.clientWidth + 1, alto: Math.round(tb.getBoundingClientRect().height), dentro: s.getBoundingClientRect().right <= innerWidth, txt: h.textContent }; });
        if (!m.visible || !m.cabe || m.alto > 80 || !m.dentro) mal.push(`${look}/${id}: ${JSON.stringify(m)}`);
      }
    }
    ok(`${vp.width}×${vp.height}: el "?" sale en los ${ids.length} juegos y el título cabe entero, con y sin pegatina`, !mal.length, mal.slice(0, 4).join(' ; '));
    for (const h of ['', 'padres', 'mundo', 'quien']) { await go(page, h); if (!(await page.evaluate(() => document.getElementById('btn-help').hidden))) mal.push('visible en #' + h); }
    ok(`${vp.width}×${vp.height}: fuera de los juegos (menú, zona de padres, mundo) no sale`, !mal.length, mal.join(' ; '));
    ok(`${vp.width}×${vp.height}: sin errores`, !errors.length, errors.join(' | '));
    await context.close();
  }

  // ---------- 2. La ventana, en Tres en raya ----------
  {
    const { context, page, errors } = await open({ width: 390, height: 844 });
    await go(page, 'raya');
    await page.locator('#btn-help').tap(); await page.waitForSelector('.help');
    const pasos = await page.locator('.help-card li').allInnerTexts();
    ok('Tres en raya: la ventana trae el nombre y cuatro pasos', await page.locator('.help-card h2').innerText() === 'Tres en raya' && pasos.length === 4 && /tres fichas/.test(pasos[1]) && /tres veces/.test(pasos[2]) && /Bip/.test(pasos[3]), pasos.join(' | '));
    ok('la ventana cabe en la pantalla y tapa el juego', await page.evaluate(() => { const c = document.querySelector('.help-card').getBoundingClientRect(), h = document.querySelector('.help').getBoundingClientRect(); return c.top >= 0 && c.bottom <= innerHeight && h.width === innerWidth && h.height === innerHeight; }));
    await page.screenshot({ path: path.join(OUT, 'ayuda-raya.png') });
    await page.evaluate(() => (window.__said = []));
    await page.locator('#help-say').tap(); await sleep(250);
    const dicho = await page.evaluate(() => window.__said.join(' / '));
    ok('el altavoz de la ventana lee el nombre y todos los pasos', dicho.startsWith('Tres en raya. ') && pasos.every(p => dicho.includes(p)), dicho.slice(0, 90) + '…');
    const c0 = await page.evaluate(() => window.__cancel);
    await page.locator('#help-ok').tap(); await sleep(200);
    ok('el botón de cerrar quita la ventana y calla la voz', await page.locator('.help').count() === 0 && await page.evaluate(c => window.__cancel > c, c0));
    ok('el juego sigue como estaba', await page.locator('#app button').count() > 0 && await page.locator('#title').getAttribute('aria-label') === 'Tres en raya');
    await page.locator('#btn-help').tap(); await page.waitForSelector('.help');
    await page.locator('.help').dispatchEvent('pointerdown'); await sleep(150);
    ok('tocar fuera de la ventana también la cierra', await page.locator('.help').count() === 0);
    await page.locator('#btn-help').tap(); await page.waitForSelector('.help'); await page.locator('#btn-help').dispatchEvent('click'); await sleep(100);
    ok('no se abren dos ventanas', await page.locator('.help').count() === 1);
    await page.evaluate(() => (location.hash = '')); await page.waitForSelector('.game-card'); await sleep(200);
    ok('al volver al menú con la ventana abierta, se cierra', await page.locator('.help').count() === 0 && await page.evaluate(() => document.getElementById('btn-help').hidden));

    // ---------- 3. Textos según el tema ----------
    const leer = async id => { await go(page, id); await page.locator('#btn-help').tap(); await page.waitForSelector('.help'); const t = (await page.locator('.help-card li').allInnerTexts()).join(' '); await page.locator('#help-ok').tap(); await sleep(120); return t; };
    const g1 = await leer('super'), g2 = await leer('topo'), g3 = await leer('carrera');
    await page.evaluate(() => { Themes.use('espacio'); });
    const e1 = await leer('super'), e2 = await leer('topo'), e3 = await leer('carrera');
    ok('los textos cambian con el tema', /helicóptero/.test(g1) && /pollitos/.test(g1) && /astronauta/.test(e1) && /marcianitos/.test(e1) && /cerditos/.test(g2) && /el lobo/.test(g2) && /el meteorito/.test(e2) && /el coche/.test(g3) && /el cohete/.test(e3), [g1, e2, e3].map(t => t.slice(0, 60)).join(' | '));
    await go(page, 'robot'); await page.locator('#btn-help').tap(); await page.waitForSelector('.help');
    await page.screenshot({ path: path.join(OUT, 'ayuda-robot.png') });
    await page.locator('#help-ok').tap();

    // ---------- 4. Zona de padres ----------
    await go(page, 'padres'); await page.waitForSelector('.parents table');
    const d = await page.evaluate(() => [...document.querySelectorAll('.parents details.how')].map(x => x.querySelectorAll('li').length));
    ok('zona de padres: "Cómo se juega" en los 15 juegos, con al menos tres pasos cada uno', d.length === 15 && d.every(n => n >= 3), d.join(','));
    await page.locator('.parents details.how summary').nth(4).tap(); await sleep(200);
    await page.locator('.parents details.how').nth(4).scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(OUT, 'ayuda-padres.png') });
    ok('ventana, temas y zona de padres: sin errores', !errors.length, errors.join(' | '));
    await context.close();
  }
  await browser.close();
  console.log(fails ? `\n${fails} FALLOS` : '\nTodo bien'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
