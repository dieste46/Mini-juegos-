// Nivel 4: llegar a la meta sin la estrella y, desde ahí, programar de una vez todo lo que falta. ¿Cabe siempre y se llega?
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); const p = await c.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8800/'); await p.waitForSelector('.game-card');
  await p.evaluate(() => { window.setTimeout = (o => (f, ms, ...a) => o(f, Math.min(ms, 25), ...a))(window.setTimeout); });   // todo deprisa: solo interesa la lógica
  const st = () => p.evaluate(() => document.querySelector('#rb')._rb.state());
  const press = (sel) => p.evaluate(s => document.querySelector(s).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })), sel);
  let ok = 0, mal = [], largos = 0, maxSlots = 0, filas2 = 0; const N = 60;
  for (let i = 0; i < N; i++) {
    await p.evaluate(() => { const g = Core.gameState('robot'); g.level = 4; g.streak = 0; g.misses = 0; location.hash = 'x'; location.hash = 'robot'; }); await p.waitForSelector('#rb .rb-bip');
    const s0 = await st();
    const direct = await p.evaluate(() => { const rb = document.querySelector('#rb')._rb, P = rb.state().puzzle, save = P.star; P.star = null; const sol = rb.solution(); P.star = save; return sol; });
    for (const t of direct) await press(`.rb-key[data-d=${t.d}]`); await press('.rb-go');
    for (let k = 0; k < 60; k++) { await new Promise(r => setTimeout(r, 40)); const s = await st(); if (!s.busy && s.fails >= 1) break; }
    const s1 = await st(), sol = await p.evaluate(() => document.querySelector('#rb')._rb.solution());
    if (sol.length > 9) largos++; maxSlots = Math.max(maxSlots, s1.slots);
    for (const t of sol) await press(`.rb-key[data-d=${t.d}]`);
    const s2 = await st(); const filas = await p.evaluate(() => { const tops = new Set([...document.querySelectorAll('.rb-slot')].map(x => Math.round(x.getBoundingClientRect().top))); const k = document.querySelector('.rb-acts').getBoundingClientRect(); window.__bajo = Math.max(window.__bajo || 0, Math.round(k.bottom)); return tops.size; }); if (filas >= 2) filas2++;
    await press('.rb-go');
    let won = false; for (let k = 0; k < 80 && !won; k++) { await new Promise(r => setTimeout(r, 40)); won = (await st()).count >= 1; }
    if (won && s2.prog.length === sol.length) ok++; else mal.push(JSON.stringify({ pasos: sol.length, puestas: s2.prog.length, huecos: s1.slots, en: s1.pos, meta: s0.puzzle.goal }));
  }
  console.log(`${ok}/${N} tableros: tras llegar sin estrella, lo que falta cabe entero y se llega · con más de 9 pasos por delante: ${largos} · máximo de huecos visto: ${maxSlots} · veces con dos filas: ${filas2}` + (mal.length ? '\nFALLAN: ' + mal.slice(0, 4).join(' ; ') : ''));
  console.log('borde inferior de los botones en el peor caso:', await p.evaluate(() => window.__bajo + ' px de ' + innerHeight));
  console.log('errores:', errs.length ? errs.join(' | ') : 'ninguno');
  await b.close();
})();
