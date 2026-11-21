// Seguir solo lo que brilla, en 60 tableros de cada nivel: ¿siempre se llega, a la primera y sin pasarse de huecos?
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); const p = await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8800/'); await p.waitForSelector('.game-card');
  for (const L of [1, 2, 3, 4, 5]) {
    let ok = 0, mal = [], N = 60;
    for (let i = 0; i < N; i++) {
      await p.evaluate(l => { const g = Core.gameState('robot'); g.level = l; g.streak = 0; g.misses = 0; g.solved = 0; location.hash = 'x'; location.hash = 'robot'; }, L);
      await p.waitForSelector('#rb .rb-bip');
      const r = await p.evaluate(() => {
        const rb = document.querySelector('#rb')._rb, press = el => el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })), seq = [];
        const need = rb.solution().reduce((t, x) => t + x.n, 0);
        for (let k = 0; k < 14; k++) {
          const n = document.querySelectorAll('.rb-key.next'); if (n.length !== 1) return { fin: 'brillan ' + n.length, seq };
          const e = n[0], w = e.classList.contains('rb-go') ? 'go' : e.classList.contains('rb-rep') ? 'rep' : e.dataset.d; seq.push(w);
          if (w === 'go') { const s = rb.state(); return { fin: 'go', seq, pasos: s.prog.reduce((t, x) => t + x.n, 0), need, fichas: s.prog.length, slots: s.slots, rep: s.puzzle.repeat }; }
          press(e);
        }
        return { fin: 'sin fin', seq };
      });
      if (r.fin === 'go' && r.pasos === r.need && r.fichas <= r.slots && (!r.rep || r.seq.includes('rep'))) ok++; else mal.push(JSON.stringify(r));
    }
    console.log(`nivel ${L}: ${ok}/${N} tableros resueltos siguiendo solo lo que brilla` + (mal.length ? '  — FALLAN: ' + mal.slice(0, 3).join(' ; ') : ''));
  }
  console.log('errores:', errs.length ? errs.join(' | ') : 'ninguno');
  await b.close();
})();
