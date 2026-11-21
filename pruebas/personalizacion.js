// Pruebas de personalización: juegos del menú, favoritos, Mi Bip, nivel a mano y letras trabajadas.
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const BASE = process.argv[2] || 'http://localhost:8800/', OUT = path.join(__dirname, 'out'); const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ok = (n, c, x = '') => { if (!c) fails++; console.log((c ? 'OK   ' : 'FAIL ') + n + (x ? '  — ' + x : '')); };
(async () => {
  const browser = await chromium.launch(BASE.includes('localhost') ? {} : { proxy: { server: process.env.HTTPS_PROXY } });
  async function open(stars = 67) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, acceptDownloads: true, locale: 'es-ES' });
    await context.addInitScript(() => { window.__said = []; const P = window.SpeechSynthesis && SpeechSynthesis.prototype; if (P) P.speak = function (u) { window.__said.push(u.text); }; });
    const page = await context.newPage(); const errors = [], dialogs = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('dialog', async d => { dialogs.push(d.message()); if (d.type() === 'prompt') { const m = d.message().match(/(\d+) × (\d+)/); return d.accept(String(m[1] * m[2])); } return d.accept(); });
    await page.goto(BASE); await page.evaluate(s => { localStorage.clear(); localStorage.setItem('juegos-peque-v1', JSON.stringify({ stars: s, games: {}, name: 'Prueba' })); }, stars);
    await page.reload(); await page.waitForSelector('.game-card');
    return { context, page, errors, dialogs };
  }
  const go = async (page, h, sel) => { await page.evaluate(x => { location.hash = 'x'; location.hash = x; }, h); if (sel) await page.waitForSelector(sel); await sleep(250); };
  const names = (page, sec) => page.locator(`#${sec} .game-card .gname`).allInnerTexts();
  const prof = page => page.evaluate(() => { Store.flush(); const d = JSON.parse(localStorage.getItem('mini-juegos-store')); return d.profiles[d.active]; });

  // ---------- 1 y 2. Juegos del menú: ocultar minijuegos y favoritos primero ----------
  {
    const { context, page, errors, dialogs } = await open();
    const antes = { r: await names(page, 'recreo'), a: await names(page, 'aprende') };
    await go(page, 'padres', '.pick-games');
    ok('zona de padres: todos los juegos con ★, y "Se ve" solo en los minijuegos', await page.locator('.pg-fav').count() === antes.r.length + antes.a.length && await page.locator('.pg-see').count() === antes.r.length, `${antes.r.length} minijuegos, ${antes.a.length} de aprender`);
    await page.locator('.pg-see[data-g=globos]').tap(); await sleep(150); await page.locator('.pg-see[data-g=carrera]').tap(); await sleep(150);
    ok('al quitar dos, el botón pasa a "Oculto"', await page.locator('.pg-see[data-g=globos]').innerText() === 'Oculto' && await page.locator('.pg-see[data-g=topo]').innerText() === 'Se ve');
    await page.locator('.pg-fav[data-g=pintar]').tap(); await sleep(150); await page.locator('.pg-fav[data-g=raya]').tap(); await sleep(150); await page.locator('.pg-fav[data-g=robot]').tap(); await sleep(150);
    await page.locator('.pg-fav[data-g=pintar]').scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(OUT, 'perso-padres.png') });
    await go(page, '', '.game-card');
    const r = await names(page, 'recreo'), a = await names(page, 'aprende');
    ok('menú: los dos ocultos no salen', !r.includes('Globos') && !r.includes('Carrera') && r.length === antes.r.length - 2, r.join(', '));
    ok('menú: los favoritos van primero, en el orden en que se marcaron, y el resto como estaba', r[0] === 'Pintar' && r[1] === 'Tres en raya' && a[0] === 'Guía a Bip' && JSON.stringify(r.slice(2)) === JSON.stringify(antes.r.filter(n => !['Globos', 'Carrera', 'Pintar', 'Tres en raya'].includes(n))) && JSON.stringify(a.slice(1)) === JSON.stringify(antes.a.filter(n => n !== 'Guía a Bip')), r.join(', ') + ' | ' + a.join(', '));
    await page.screenshot({ path: path.join(OUT, 'perso-menu.png'), fullPage: true });
    let p = await prof(page);
    ok('se guarda con el jugador', JSON.stringify(p.hide) === '["globos","carrera"]' && JSON.stringify(p.fav) === '["pintar","raya","robot"]');
    // Tres en raya oculto: Repite con Bip sigue siendo un juego (no tiene tarjeta propia); un minijuego oculto sigue abriéndose por su dirección
    await go(page, 'padres', '.pick-games');
    for (const id of await page.evaluate(() => Games.filter(g => !g.hidden && g.section === 'recreo').map(g => g.id))) { if (await page.locator(`.pg-see[data-g=${id}]`).innerText() === 'Se ve') { await page.locator(`.pg-see[data-g=${id}]`).tap(); await sleep(120); } }
    await go(page, '', '.game-card');
    ok('con todos los minijuegos ocultos desaparece la sección entera, y Pequesabios sigue', await page.locator('#recreo').count() === 0 && (await page.locator('.section-title').allInnerTexts()).join().includes('Pequesabios') && !(await page.locator('.section-title').allInnerTexts()).join().includes('Minijuegos') && await page.locator('#aprende .game-card').count() === antes.a.length && await page.locator('.world-banner').count() === 1);
    // exportar e importar conservan todo; una copia con valores raros se limpia
    await go(page, 'padres', '#export'); await sleep(300);
    const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('#export').tap()]); const f = path.join(OUT, 'perso.json'); await dl.saveAs(f);
    const j = JSON.parse(fs.readFileSync(f, 'utf8')), id = Object.keys(j.store.profiles)[0];
    Object.assign(j.store.profiles[id], { hide: ['globos', '<b>', 7, 'globos'], fav: 'no es una lista', letters: ['A', 'zz', 'M', 'A'], bip: { color: 'verde', item: '"><img src=x>' } });
    fs.writeFileSync(f, JSON.stringify(j)); await page.setInputFiles('#import-file', f); for (let i = 0; i < 40 && !dialogs.some(d => /Partidas importadas/.test(d)); i++) await sleep(100);
    p = await prof(page);
    ok('importar: se conserva lo válido y se descarta lo demás', JSON.stringify(p.hide) === '["globos"]' && p.fav === undefined && JSON.stringify(p.letters) === '["A","M"]' && JSON.stringify(p.bip) === '{"color":"verde"}', JSON.stringify({ hide: p.hide, fav: p.fav, letters: p.letters, bip: p.bip }));
    ok('menú y zona de padres: sin errores', !errors.length, errors.join(' | '));
    await context.close();
  }

  // ---------- 3. Mi Bip ----------
  {
    const { context, page, errors } = await open(67);
    await page.locator('#bip-edit').tap(); await page.waitForSelector('.dress'); await sleep(300);
    ok('el botón del menú abre "Mi Bip" y la voz lo explica', await page.locator('#title').getAttribute('aria-label') === 'Mi Bip' && await page.evaluate(() => /Elige un color/.test(window.__said.slice(-1)[0]) && /80 estrellas se abre la corona/.test(window.__said.slice(-1)[0])), await page.evaluate(() => window.__said.slice(-1)[0]));
    ok('seis colores y seis complementos; con 67 estrellas solo la corona está cerrada', await page.locator('.dc').count() === 6 && await page.locator('.di').count() === 6 && await page.locator('.di.locked').count() === 1 && await page.locator('.di.locked .di-lock').innerText() === '⭐ 80');
    await page.locator('.dc[data-c=verde]').tap(); await sleep(250);
    ok('al elegir color cambia Bip en toda la página', await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bip-a').trim()) === '#7be3a0' && await page.locator('.dc.on').getAttribute('data-c') === 'verde');
    await page.locator('.di[data-i=capa]').tap(); await sleep(250);
    ok('al ponerle la capa, la lleva y la voz lo dice', await page.locator('.dress-bip path[fill="#e8323c"]').count() >= 1 && await page.locator('.di.on').getAttribute('data-i') === 'capa' && await page.evaluate(() => /capa/.test(window.__said.slice(-1)[0])));
    await page.screenshot({ path: path.join(OUT, 'perso-bip.png') });
    await page.locator('.di[data-i=corona]').tap(); await sleep(250);
    ok('un complemento cerrado no se pone: la voz dice cuántas estrellas faltan', await page.locator('.di.on').getAttribute('data-i') === 'capa' && await page.evaluate(() => /Te faltan 13/.test(window.__said.slice(-1)[0])), await page.evaluate(() => window.__said.slice(-1)[0]));
    ok('cabe en la pantalla sin desplazar', await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1), await page.evaluate(() => document.documentElement.scrollHeight + ' / ' + innerHeight));
    await page.locator('#btn-home').tap(); await page.waitForSelector('.game-card');
    ok('de vuelta en el menú, Bip lleva la capa y el color', await page.locator('.hello-mascot path[fill="#e8323c"]').count() >= 1 && JSON.stringify((await prof(page)).bip) === '{"color":"verde","item":"capa"}');
    await go(page, 'robot', '#rb .rb-bip');
    ok('en Guía a Bip también la lleva', await page.locator('.rb-bip path[fill="#e8323c"]').count() >= 1);
    await go(page, '', '.game-card'); await page.reload(); await page.waitForSelector('.game-card');
    ok('tras recargar sigue igual', await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bip-a').trim()) === '#7be3a0' && await page.locator('.hello-mascot path[fill="#e8323c"]').count() >= 1);
    ok('Mi Bip: sin errores', !errors.length, errors.join(' | '));
    await context.close();
    const pocas = await open(3);
    await go(pocas.page, 'bip', '.dress');
    ok('con 3 estrellas solo está abierto "nada"', await pocas.page.locator('.di.locked').count() === 5 && await pocas.page.locator('.di:not(.locked)').getAttribute('data-i') === 'nada');
    await pocas.context.close();
  }

  // ---------- 4. Nivel a mano ----------
  {
    const { context, page, errors } = await open();
    await go(page, 'padres', '.lvb');
    const con = await page.evaluate(() => Games.filter(g => g.maxLevel).length);
    ok('un − y un + por cada juego con niveles', await page.locator('.lvb').count() === con * 2 && await page.locator('.lvb[data-g=contar][data-d="-1"]').isDisabled(), `${con} juegos`);
    for (let i = 0; i < 5; i++) { await page.locator('.lvb[data-g=contar][data-d="1"]').dispatchEvent('click'); await sleep(80); }
    ok('+ sube hasta el máximo del juego y ahí se apaga', await page.evaluate(() => Core.gameState('contar').level) === 4 && await page.locator('.lvb[data-g=contar][data-d="1"]').isDisabled());
    await page.locator('.lvb[data-g=contar][data-d="-1"]').tap(); await sleep(100);
    ok('− baja uno y se guarda', (await prof(page)).games.contar.level === 3);
    await go(page, '', '.game-card');
    ok('la tarjeta enseña el nivel puesto', /★★★☆/.test(await page.locator('.game-card', { hasText: 'Cuenta' }).innerText()));
    await go(page, 'contar', '.opt');
    ok('y el juego arranca en ese nivel', /hay\?$/.test(await page.locator('.prompt span').innerText()) && await page.locator('.stage span').count() >= 3, await page.locator('.prompt span').innerText());
    ok('nivel a mano: sin errores', !errors.length, errors.join(' | '));
    await context.close();
  }

  // ---------- 5. Letras trabajadas ----------
  {
    const { context, page, errors } = await open();
    const reparto = async (nivel, N = 60) => { const n = {}; for (let i = 0; i < N; i++) {
      await page.evaluate(l => { const g = Core.gameState('letras'); g.level = l; g.streak = 0; g.misses = 0; location.hash = 'x'; location.hash = 'letras'; }, nivel); await page.waitForSelector('.opt');
      const q = await page.evaluate(() => { const t = document.querySelector('.prompt span').textContent, s = document.querySelector('.stage').textContent.trim(); const m = t.match(/empieza (\S+?)\?/);
        return { L: m ? m[1][0].toUpperCase().normalize('NFD')[0] : s[0], o: [...document.querySelectorAll('.opt')].map(x => x.textContent.trim()).filter(x => x.length === 1) }; });
      n[q.L] = (n[q.L] || 0) + 1; q.o.forEach(x => (n['op:' + x] = 1)); } return n; };
    await go(page, 'padres', '.wl');
    ok('zona de padres: once letras, con las diez del cole marcadas y la T sin marcar', await page.locator('.wl').count() === 11 && await page.locator('.wl.on').count() === 10 && !(await page.locator('.wl[data-l=T]').getAttribute('class')).includes('on'));
    for (const l of ['S', 'D']) { await page.locator(`.wl[data-l=${l}]`).tap(); await sleep(120); }
    let r = await reparto(2);
    ok('al desmarcar la S y la D, el nivel 2 no pregunta por ellas ni las ofrece', !r.S && !r.D && !r['op:S'] && !r['op:D'] && r.M && r.P && r.L, JSON.stringify(Object.keys(r).sort()));
    await go(page, 'padres', '.wl'); await page.locator('.wk[data-l=T]').tap(); await sleep(150);
    ok('elegir la T como letra de la semana la marca también como trabajada', (await page.locator('.wl[data-l=T]').getAttribute('class')).includes('on') && JSON.stringify((await prof(page)).letters) === '["A","E","I","O","U","M","P","L","T"]');
    r = await reparto(3);
    ok('y entonces la T sale en el juego', r.T >= 12 && !r.S && !r.D, JSON.stringify(Object.fromEntries(Object.entries(r).filter(([k]) => k.length === 1))));
    await go(page, 'padres', '.wl'); await page.locator('.wk[data-l=""]').tap(); await sleep(120);
    for (const l of ['E', 'I', 'O', 'U', 'M', 'P', 'L', 'T']) { await page.locator(`.wl[data-l=${l}]`).tap(); await sleep(100); }
    r = await reparto(1, 30);
    ok('con menos de tres letras marcadas, el juego sigue funcionando con las de siempre', Object.keys(r).filter(k => k.length === 1).every(l => 'AEIOU'.includes(l)), JSON.stringify(Object.keys(r).sort()));
    ok('letras trabajadas: sin errores', !errors.length, errors.join(' | '));
    await context.close();
  }
  await browser.close();
  console.log(fails ? `\n${fails} FALLOS` : '\nTodo bien'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
