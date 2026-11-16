/* Mi granja: crece con las estrellas ganadas en cualquier juego.
   Cada cierto número de estrellas aparece un amigo o un edificio nuevo. Nada se pierde nunca. */
const Farm = (() => {
  // [emoji, nombre con artículo, lo que "dice", x %, y % (pies), tamaño, estrellas necesarias, notas del sonido]
  const ITEMS = [
    ['🐷', 'El cerdito', '¡Oink, oink!',        50, 88, 15,   0, [330, 262]],
    ['🐔', 'La gallina', '¡Co, co, co!',        20, 93, 11,   3, [660, 660, 880]],
    ['🌻', 'El girasol', '¡Qué alto!',           8, 70, 11,   6, [523, 784]],
    ['🐮', 'La vaca', '¡Muuu!',                 78, 80, 16,  10, [147, 131]],
    ['🌳', 'El árbol', '¡Cuánta sombra!',       90, 62, 20,  14, [392, 494]],
    ['🐑', 'La oveja', '¡Beee!',                34, 74, 12,  19, [440, 415, 440]],
    ['🏠', 'La casa', '¡Toc, toc!',             26, 56, 22,  24, [262, 262]],
    ['🐶', 'El perro', '¡Guau, guau!',          64, 95, 11,  30, [392, 330]],
    ['🚜', 'El tractor', '¡Brrrum!',            58, 64, 17,  36, [98, 110, 98]],
    ['🐴', 'El caballo', '¡Hiii!',              12, 84, 15,  43, [880, 587]],
    ['🦆', 'El pato', '¡Cua, cua!',             88, 94, 10,  50, [494, 494]],
    ['🐱', 'El gato', '¡Miau!',                 40, 96, 10,  58, [784, 988, 659]],
    ['🐰', 'El conejo', '¡Boing, boing!',       72, 68,  9,  66, [523, 784, 1047]],
    ['🐐', 'La cabra', '¡Meee!',                43, 60, 11,  75, [466, 440]],
    ['🐝', 'La abeja', '¡Bzzz!',                16, 40,  7,  85, [220, 233, 220]],
    ['🦃', 'El pavo', '¡Glu, glu, glu!',        91, 79, 12,  95, [349, 392, 349]],
    ['🌈', 'El arcoíris', '¡Qué colores!',      62, 34, 30, 106, [523, 587, 659, 784]],
    ['🚀', 'El cohete', '¡Tres, dos, uno, despegue!', 84, 30, 14, 118, [262, 392, 523, 1047]]
  ];
  const stars = () => Core.state.stars || 0;
  const unlockedCount = () => ITEMS.filter(it => stars() >= it[6]).length;
  const seen = () => Core.state.farmSeen || 0;
  const next = () => ITEMS[unlockedCount()] || null;       // siguiente regalo, o null si ya está todo
  const hasNew = () => unlockedCount() > seen();

  function giftHTML() {
    const n = next();
    if (!n) return `<span class="gift">🏆 ¡Granja completa!</span>`;
    const prev = ITEMS[unlockedCount() - 1][6], need = n[6] - stars();
    const pct = Math.round(100 * (stars() - prev) / (n[6] - prev));
    return `<span class="gift">🎁</span><div class="goalbar"><div style="width:${pct}%"></div></div><span class="gift">⭐ ${need}</span>`;
  }

  // Dibuja la escena. Devuelve los elementos por índice.
  function scene(container, count) {
    container.classList.add('farm');
    container.innerHTML = '<span class="sun">☀️</span><span class="cloud c1">☁️</span><span class="cloud c2">☁️</span><div class="hill"></div>';
    return ITEMS.slice(0, count).map((it, i) => {
      const e = document.createElement('span');
      e.className = 'fitem';
      e.textContent = it[0];
      e.style.cssText = `left:${it[3]}%;top:${it[4]}%;--s:${it[5]};z-index:${Math.round(it[4])};animation-delay:${-(i * 0.37) % 2}s`;
      container.appendChild(e);
      return e;
    });
  }

  function play(it) {
    it[7].forEach((f, i) => Core.tone(f, 0.22, 'triangle', 0.25, null, i * 0.16));
    Core.say(`${it[1]}. ${it[2]}`);
  }

  // Tarjeta del menú: escena en pequeño + progreso al siguiente regalo.
  function banner() {
    const b = Core.el(`<button class="farm-banner${hasNew() ? ' new' : ''}">
        <div class="mini"></div>
        <div class="farm-foot"><b>🏡 Mi granja</b>${hasNew() ? '<span class="gift bounce">🎁 ¡Nuevo!</span>' : giftHTML()}</div></button>`);
    scene(b.querySelector('.mini'), Math.min(seen() || 1, unlockedCount()));
    b.onclick = () => { Core.say('Mi granja'); location.hash = 'granja'; };
    return b;
  }

  // Pantalla completa de la granja.
  function start(root) {
    let timers = [];
    const total = unlockedCount(), before = Math.min(seen(), total);
    root.innerHTML = `<div class="hud farm-hud">${giftHTML()}</div><div class="play" id="farm"></div>`;
    const els = scene(root.querySelector('#farm'), total);
    els.forEach((e, i) => {
      e.addEventListener('pointerdown', ev => {
        ev.preventDefault();
        e.classList.remove('jump'); void e.offsetWidth; e.classList.add('jump');
        play(ITEMS[i]);
      });
    });

    const fresh = els.slice(before);
    if (fresh.length) {
      // Los nuevos aparecen de uno en uno con fiesta.
      fresh.forEach(e => (e.style.visibility = 'hidden'));
      fresh.forEach((e, k) => timers.push(setTimeout(() => {
        e.style.visibility = ''; e.classList.add('arrive');
        Core.sfx.ding(); if (k === fresh.length - 1) Core.celebrate();
      }, 500 + k * (fresh.length > 3 ? 350 : 900))));
      const last = ITEMS[total - 1];
      timers.push(setTimeout(() => Core.say(before === 0 && total === 1
        ? '¡Esta es tu granja! Gana estrellas jugando y vendrán más amigos.'
        : fresh.length === 1 ? `¡Un regalo nuevo! ${last[1]}. Tócalo.` : '¡Mira cuántos amigos nuevos han llegado a tu granja! Tócalos.'), 600));
      Core.state.farmSeen = total; Core.save();
    } else {
      const n = next();
      Core.say(n ? `Esta es tu granja. Te faltan ${n[6] - stars()} estrellas para el próximo regalo.` : '¡Tu granja está completa! ¡Qué bonita!');
    }
    return () => timers.forEach(clearTimeout);
  }

  return { banner, start, hasNew, ITEMS };
})();
