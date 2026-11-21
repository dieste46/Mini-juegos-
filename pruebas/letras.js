// Qué letras pregunta el juego Letras en cada nivel, en los dos temas (muchas preguntas, forzando el nivel).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs = []; let fallos = 0;
  for (const tema of ['granja', 'espacio']) {
    const c = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); const p = await c.newPage();
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto(process.argv[2] || 'http://localhost:8800/'); await p.waitForSelector('.game-card');
    await p.evaluate(t => Themes.use(t), tema);
    const trabajadas = await p.evaluate(() => Games.find(g => g.id === 'letras').worked.join(''));
    for (const L of [1, 2, 3]) {
      const letras = new Set(), opciones = new Set(), palabras = new Set();
      for (let i = 0; i < 70; i++) {
        await p.evaluate(l => { const g = Core.gameState('letras'); g.level = l; g.streak = 0; g.misses = 0; location.hash = 'x'; location.hash = 'letras'; }, L);
        await p.waitForSelector('.opt');
        const q = await p.evaluate(() => ({ t: document.querySelector('.prompt span').textContent, o: [...document.querySelectorAll('.opt')].map(x => x.textContent.trim()), s: document.querySelector('.stage').textContent.trim() }));
        if (L < 3) { q.o.forEach(x => opciones.add(x)); palabras.add(q.t.replace(/^.*empieza /, '').replace('?', '')); }
        else letras.add(q.s[0]);
      }
      // Sin tocar nada en la zona de padres: el nivel 1 solo usa vocales, y los demás solo las letras trabajadas por defecto
      const vistas = [...(L < 3 ? opciones : letras)].sort(), bien = vistas.length >= 3 && vistas.every(l => (L === 1 ? 'AEIOU' : trabajadas).includes(l));
      if (!bien) fallos++;
      console.log(`${bien ? 'OK  ' : 'FAIL'} ${tema}, nivel ${L}: letras ${vistas.join(' ')}` + (L < 3 ? ` · ${palabras.size} palabras distintas` : ''));
    }
    await c.close();
  }
  if (errs.length) fallos++;
  console.log(`${errs.length ? 'FAIL' : 'OK  '} sin errores` + (errs.length ? '  — ' + errs.join(' | ') : ''));
  await b.close();
  console.log(fallos ? `\n${fallos} FALLOS` : '\nTodo bien'); process.exit(fallos ? 1 : 0);
})();
