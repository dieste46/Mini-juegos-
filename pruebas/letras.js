// ¿Qué letras pregunta el juego Letras en cada nivel? (muchas preguntas, forzando el nivel)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const tema of ['granja', 'espacio']) {
    const c = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); const p = await c.newPage();
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto(process.argv[2] || 'http://localhost:8800/'); await p.waitForSelector('.game-card');
    await p.evaluate(t => Themes.use(t), tema);
    for (const L of [1, 2, 3]) {
      const letras = new Set(), opciones = new Set(), palabras = new Set();
      for (let i = 0; i < 70; i++) {
        await p.evaluate(l => { const g = Core.gameState('letras'); g.level = l; g.streak = 0; g.misses = 0; location.hash = 'x'; location.hash = 'letras'; }, L);
        await p.waitForSelector('.opt');
        const q = await p.evaluate(() => ({ t: document.querySelector('.prompt span').textContent, o: [...document.querySelectorAll('.opt')].map(x => x.textContent.trim()), s: document.querySelector('.stage').textContent.trim() }));
        if (L < 3) { q.o.forEach(x => opciones.add(x)); palabras.add(q.t.replace(/^.*empieza /, '').replace('?', '')); }
        else letras.add(q.s[0]);
      }
      console.log(`${tema}, nivel ${L}:`, L < 3 ? `letras entre las opciones: ${[...opciones].sort().join(' ')} · palabras vistas: ${palabras.size} (${[...palabras].filter(w => /^d/.test(w)).join(', ') || 'ninguna con d'})` : `letras preguntadas: ${[...letras].sort().join(' ')}`);
    }
    await c.close();
  }
  console.log('errores:', errs.length ? errs.join(' | ') : 'ninguno');
  await b.close();
})();
