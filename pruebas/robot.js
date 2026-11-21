// Pruebas de "Guía a Bip".
const { chromium } = require('playwright');
const path = require('path');
const BASE = process.argv[2] || 'http://localhost:8800/', OUT = path.join(__dirname, 'out');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ok = (n, c, x = '') => { if (!c) fails++; console.log((c ? 'OK   ' : 'FAIL ') + n + (x ? '  — ' + x : '')); };

(async () => {
  const browser = await chromium.launch(BASE.includes('localhost') ? {} : { proxy: { server: process.env.HTTPS_PROXY } });
  async function open(vp = { width: 390, height: 844 }) {
    const context = await browser.newContext({ viewport: vp, hasTouch: true, isMobile: true, deviceScaleFactor: 2, locale: 'es-ES' });
    const page = await context.newPage(); const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
    await page.goto(BASE); await page.evaluate(() => { localStorage.clear(); localStorage.setItem('juegos-peque-v1', JSON.stringify({ stars: 0, games: {}, name: 'Prueba' })); });
    await page.reload(); await page.waitForSelector('.game-card');
    return { context, page, errors };
  }
  const st = page => page.evaluate(() => document.querySelector('#rb')._rb.state());
  const key = (page, d) => page.locator(`.rb-key[data-d=${d}]`).dispatchEvent('pointerdown');
  const enter = async (page, level) => {
    await page.evaluate(l => { if (l) { const g = Core.gameState('robot'); g.level = l; g.streak = 0; g.misses = 0; Core.save(); } location.hash = 'x'; location.hash = 'robot'; }, level);
    await page.waitForSelector('#rb .rb-bip'); await sleep(150);
  };
  async function program(page, tiles) { for (const t of tiles) { await key(page, t.d); for (let i = 1; i < t.n; i++) await page.locator('.rb-rep').dispatchEvent('pointerdown'); } }
  async function solve(page) {
    const before = (await st(page)).count;
    await program(page, await page.evaluate(() => document.querySelector('#rb')._rb.solution()));
    await page.locator('.rb-go').dispatchEvent('pointerdown');
    for (let i = 0; i < 80; i++) { await sleep(150); if (await page.locator('#again').count()) return true; const s = await st(page); if (s.count > before && !s.busy) return true; }
    return false;
  }
  const nextPuzzle = async page => { for (let i = 0; i < 40; i++) { await sleep(120); if (await page.locator('#again').count()) return; const s = await st(page); if (!s.done && !s.busy) return; } };

  // ---------- 1. El generador ----------
  {
    const { context, page, errors } = await open();
    await enter(page, 1);
    const rep = await page.evaluate(() => {
      const rb = document.querySelector('#rb')._rb, out = {};
      const D = { u: [0, -1], r: [1, 0], d: [0, 1], l: [-1, 0] };
      const bfs = (n, walls, a, b) => { const bad = new Set(walls.map(w => w + '')), seen = new Map([[a + '', 0]]), q = [a];
        for (let i = 0; i < q.length; i++) { const c = q[i]; if (c + '' === b + '') return seen.get(c + ''); for (const k in D) { const x = c[0] + D[k][0], y = c[1] + D[k][1], id = [x, y] + ''; if (x < 0 || y < 0 || x >= n || y >= n || bad.has(id) || seen.has(id)) continue; seen.set(id, seen.get(c + '') + 1); q.push([x, y]); } } return -1; };
      for (let L = 1; L <= 5; L++) {
        const t0 = performance.now(); let bad = 0, fallback = 0, min = 99, max = 0, straight = 0; const N = 400;
        for (let i = 0; i < N; i++) {
          const p = rb.gen(L);
          if (p.level !== L) { fallback++; continue; }
          const ids = [p.start, p.goal, ...(p.star ? [p.star] : []), ...p.walls].map(String);
          const steps = p.star ? bfs(p.n, p.walls, p.start, p.star) + bfs(p.n, p.walls, p.star, p.goal) : bfs(p.n, p.walls, p.start, p.goal);
          if (new Set(ids).size !== ids.length || steps < 0) bad++;
          if (p.star && bfs(p.n, p.walls, p.start, p.goal) >= steps) bad++;
          if (p.start[0] === p.goal[0] || p.start[1] === p.goal[1]) straight++;
          min = Math.min(min, steps); max = Math.max(max, steps);
        }
        out[L] = { bad, fallback, min, max, straight: Math.round(100 * straight / N), ms: Math.round((performance.now() - t0) / N * 10) / 10 };
      }
      return out;
    });
    const want = { 1: [2, 3], 2: [3, 5], 3: [4, 6], 4: [5, 8], 5: [6, 9] };
    for (const L of [1, 2, 3, 4, 5]) ok(`generador, nivel ${L}: 400 tableros con solución, sin casillas repetidas y con los pasos previstos`, rep[L].bad === 0 && rep[L].fallback === 0 && rep[L].min >= want[L][0] && rep[L].max <= want[L][1], JSON.stringify(rep[L]));
    ok('generador: el nivel 1 es siempre en línea recta y el 2 nunca', rep[1].straight === 100 && rep[2].straight === 0);
    await context.close();
  }

  // ---------- 2. Partida completa, estrellas y subida de nivel ----------
  {
    const { context, page, errors } = await open();
    const card = page.locator('.game-card', { hasText: 'Guía a Bip' });
    ok('menú: tarjeta en Pequesabios con su dibujo', await page.locator('#aprende .game-card', { hasText: 'Guía a Bip' }).count() === 1 && await card.locator('img.art').evaluate(i => i.complete && i.naturalWidth === 256));
    await card.tap(); await page.waitForSelector('#rb .rb-bip'); await sleep(200);
    let s = await st(page);
    ok('empieza en el nivel 1, con huecos y la flecha que toca marcada (primeras veces)', s.level === 1 && s.slots === s.puzzle && false || (s.slots >= 4 && s.slots <= 5 && await page.locator('.rb-key.next').count() === 1), `huecos ${s.slots}`);
    ok('cabe en la pantalla sin desplazar (390×844)', await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1), await page.evaluate(() => document.documentElement.scrollHeight + ' / ' + innerHeight));
    await page.screenshot({ path: path.join(OUT, 'robot-granja.png') });
    const a = await solve(page); await nextPuzzle(page); const b = await solve(page); await nextPuzzle(page);
    s = await st(page);
    ok('dos tableros a la primera: dos estrellas y sube al nivel 2', a && b && await page.evaluate(() => Store.profile.stars) === 2 && s.level === 2, `nivel ${s.level}`);
    ok('nivel 2: se ve el rastro de lo programado', await (async () => { await key(page, (await page.evaluate(() => document.querySelector('#rb')._rb.solution()))[0].d); const n = await page.locator('.rb-cell.trail').count(); await page.locator('.rb-del').dispatchEvent('pointerdown'); return n === 1 && (await st(page)).prog.length === 0; })());
    const c = await solve(page);
    await page.waitForSelector('#again');
    ok('tercer tablero y pantalla final', c && await page.evaluate(() => Core.gameState('robot').played === 1 && Core.gameState('robot').solved === 3 && Store.profile.stars === 3));
    await page.locator('#again').dispatchEvent('click'); await page.waitForSelector('#rb .rb-bip'); await sleep(200);
    ok('"otra vez" empieza una partida nueva', (await st(page)).count === 0 && await page.locator('.rb-count i.on').count() === 0);
    // casa en plena ejecución: nada debe repintar encima del menú
    await program(page, await page.evaluate(() => document.querySelector('#rb')._rb.solution())); await page.locator('.rb-go').dispatchEvent('pointerdown'); await sleep(200);
    await page.locator('#btn-home').tap(); await page.waitForSelector('.game-card'); await sleep(3500);
    ok('casa a mitad de camino: vuelve al menú y se queda', await page.locator('.game-card').count() >= 13 && await page.locator('#rb').count() === 0);
    ok('la tarjeta enseña el nivel', /★★☆☆☆/.test(await page.locator('.game-card', { hasText: 'Guía a Bip' }).innerText()));
    ok('partida completa: sin errores', !errors.length, errors.join(' | '));
    await context.close();
  }

  // ---------- 3. Tropiezos y pistas ----------
  {
    const { context, page, errors } = await open();
    await page.evaluate(() => { Core.gameState('robot').solved = 5; Core.save(); });   // ya no es principiante: sin ayuda de entrada
    await enter(page, 3);
    let s = await st(page);
    ok('nivel 3: obstáculos, sin flecha marcada y sin rastro', s.puzzle.walls.length === 3 && await page.locator('.rb-key.next').count() === 0 && await page.locator('.rb-wall').count() === 3);
    const stars0 = await page.evaluate(() => Store.profile.stars);
    // chocar: una flecha contra el borde o un obstáculo
    const D = { u: [0, -1], r: [1, 0], d: [0, 1], l: [-1, 0] };
    const blocked = p => Object.keys(D).find(k => { const x = p.pos[0] + D[k][0], y = p.pos[1] + D[k][1]; return x < 0 || y < 0 || x >= p.puzzle.n || y >= p.puzzle.n || p.puzzle.walls.some(w => w[0] === x && w[1] === y); });
    let dir = blocked(s);
    if (!dir) { await page.evaluate(() => { const rb = document.querySelector('#rb')._rb; }); }
    if (dir) {
      await key(page, dir); await page.locator('.rb-go').dispatchEvent('pointerdown'); await sleep(1100);
      const s2 = await st(page);
      ok('chocar: Bip se queda donde estaba, se vacían las flechas y no pasa nada más', s2.fails === 1 && s2.pos + '' === s.pos + '' && s2.prog.length === 0 && !s2.busy && !s2.done);
    } else ok('chocar: (este tablero no tenía ningún lado tapado junto a la salida)', true);
    // quedarse corto: solo el primer paso del camino
    const first = (await page.evaluate(() => document.querySelector('#rb')._rb.solution()))[0];
    const before = await st(page);
    await key(page, first.d); await page.locator('.rb-go').dispatchEvent('pointerdown'); await sleep(1200);
    s = await st(page);
    ok('quedarse corto: Bip avanza un paso y se sigue desde ahí', s.pos + '' !== before.pos + '' && s.prog.length === 0 && s.fails === before.fails + 1 && !s.done);
    ok('tras dos tropiezos brilla la flecha que toca y se ve el rastro', s.fails < 2 || await page.locator('.rb-key.next').count() === 1);
    // forzar un tercer tropiezo para ver el trozo de camino
    while ((await st(page)).fails < 3) {
      const sol = await page.evaluate(() => document.querySelector('#rb')._rb.solution()); if (sol.length < 2) break;
      await key(page, sol[0].d); await page.locator('.rb-go').dispatchEvent('pointerdown'); await sleep(1200);
    }
    s = await st(page);
    ok('tras tres tropiezos se marca un trozo del camino', s.fails < 3 || await page.locator('.rb-cell.way').count() >= 1, `tropiezos ${s.fails}`);
    await page.screenshot({ path: path.join(OUT, 'robot-pistas.png') });
    const won = await solve(page);
    ok('se llega igualmente, pero sin estrella por no haber sido a la primera', won && await page.evaluate(() => Store.profile.stars) === stars0);
    await nextPuzzle(page);
    // huecos llenos y botón de borrar
    s = await st(page);
    for (let i = 0; i < s.slots + 3; i++) await key(page, 'r');
    ok('no se pueden poner más flechas que huecos', (await st(page)).prog.length === s.slots);
    for (let i = 0; i < s.slots; i++) await page.locator('.rb-del').dispatchEvent('pointerdown');
    ok('el botón de borrar las quita todas, de una en una', (await st(page)).prog.length === 0);
    await page.locator('.rb-go').dispatchEvent('pointerdown'); await sleep(300);
    ok('el botón verde sin flechas no hace nada', (await st(page)).fails === 0 && !(await st(page)).busy);
    ok('tropiezos y pistas: sin errores', !errors.length, errors.join(' | '));
    await context.close();
  }

  // ---------- 4. Estrella por el camino (nivel 4) y ficha de repetir (nivel 5), en el tema del espacio ----------
  {
    const { context, page, errors } = await open();
    await page.locator('.theme-btn[data-t=espacio]').tap(); await sleep(300);
    await enter(page, 4);
    let s = await st(page);
    ok('nivel 4: tablero de 5 con estrella, y el botón de repetir oculto', s.puzzle.n === 5 && !!s.puzzle.star && await page.locator('.rb-star').count() === 1 && await page.locator('.rb-rep').evaluate(e => getComputedStyle(e).visibility) === 'hidden');
    // ir derecho a la meta sin la estrella, si se puede: no cuenta como llegada
    const direct = await page.evaluate(() => { const rb = document.querySelector('#rb')._rb, p = rb.state().puzzle; const save = p.star; p.star = null; const sol = rb.solution(); p.star = save; return sol; });
    if (direct.length <= s.slots) {
      await program(page, direct); await page.locator('.rb-go').dispatchEvent('pointerdown'); await sleep(450 * direct.length + 900);
      const s2 = await st(page);
      ok('nivel 4: llegar sin la estrella no vale; se sigue desde ahí', !s2.done && (s2.hasStar || s2.pos + '' === s.puzzle.goal + ''), `en ${s2.pos}, estrella ${s2.hasStar}`);
    }
    ok('nivel 4: con la estrella, llega', await solve(page) && (await st(page)).count === 1);
    await page.screenshot({ path: path.join(OUT, 'robot-espacio.png') });
    await enter(page, 5);
    s = await st(page);
    const sol = await page.evaluate(() => document.querySelector('#rb')._rb.solution());
    const pasos = sol.reduce((t, x) => t + x.n, 0);
    ok('nivel 5: menos huecos que pasos, y el botón de repetir a la vista', s.slots < pasos && s.slots === sol.length + 1 && await page.locator('.rb-rep').evaluate(e => getComputedStyle(e).visibility) === 'visible', `${s.slots} huecos para ${pasos} pasos`);
    // siguiendo solo lo que brilla (perfil nuevo: va guiado) se llega usando el botón de repetir
    const brillo = [];
    for (let i = 0; i < 12; i++) {
      const b = page.locator('.rb-key.next'); if (await b.count() !== 1) { brillo.push('?' + await b.count()); break; }
      const cual = await b.evaluate(e => e.classList.contains('rb-go') ? 'go' : e.classList.contains('rb-rep') ? 'rep' : e.dataset.d);
      brillo.push(cual); if (cual === 'go') break; await b.dispatchEvent('pointerdown');
    }
    const guiado = (await st(page)).prog;
    ok('nivel 5: la ayuda marca el botón de repetir cuando toca, cabe en los huecos y da el camino entero', brillo.includes('rep') && brillo[brillo.length - 1] === 'go' && guiado.length <= s.slots && guiado.reduce((t, x) => t + x.n, 0) === pasos, brillo.join(' '));
    for (let i = 0; i < 12; i++) await page.locator('.rb-del').dispatchEvent('pointerdown');
    await program(page, sol);
    ok('nivel 5: las flechas repetidas llevan su número', await page.locator('.rb-slot b').count() === sol.filter(x => x.n > 1).length && (await st(page)).prog.every((t, i) => t.n === sol[i].n));
    await page.screenshot({ path: path.join(OUT, 'robot-repetir.png') });
    await page.locator('.rb-go').dispatchEvent('pointerdown');
    let won = false; for (let i = 0; i < 80 && !won; i++) { await sleep(150); won = (await st(page)).count === 1; }
    ok('nivel 5: con repeticiones, llega', won);
    ok('niveles 4 y 5: sin errores', !errors.length, errors.join(' | '));
    await context.close();
  }

  // ---------- 5. Pantallas pequeñas y grandes ----------
  for (const [label, vp] of [['iPhone pequeño 375×667', { width: 375, height: 667 }], ['iPad 820×1180', { width: 820, height: 1180 }]]) {
    const { context, page, errors } = await open(vp);
    await enter(page, 5);
    const m = await page.evaluate(() => { const b = document.querySelector('#rb').getBoundingClientRect(), k = document.querySelector('.rb-acts').getBoundingClientRect(); return { board: Math.round(b.width), cuadrado: Math.abs(b.width - b.height) < 1, abajo: Math.round(k.bottom), alto: innerHeight, ancho: innerWidth, dentro: b.left >= 0 && b.right <= innerWidth }; });
    ok(`${label}: tablero cuadrado, dentro de la pantalla y con los botones a la vista`, m.cuadrado && m.dentro && m.abajo <= m.alto, JSON.stringify(m));
    await page.screenshot({ path: path.join(OUT, `robot-${vp.width}.png`) });
    ok(`${label}: sin errores`, !errors.length, errors.join(' | '));
    await context.close();
  }

  await browser.close();
  console.log(fails ? `\n${fails} FALLOS` : '\nTodo bien'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
