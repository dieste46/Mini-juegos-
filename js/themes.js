/* Temas: cada tema es SOLO datos y dibujo (fondo, mundo de recompensas y conjuntos de objetos).
   Los juegos piden lo que necesitan con Themes.current().sets.<conjunto> y no saben qué tema hay.
   Añadir un tema = añadir un objeto aquí con las mismas claves. Si a un tema le falta un conjunto,
   se usa el del tema por defecto (granja), así un tema nuevo puede empezar incompleto. */
const Themes = (() => {
  const list = {};
  const DEFAULT = 'granja';

  // ---------- Dibujos del tema espacio ----------
  const starDots = (n, seed = 1) => Array.from({ length: n }, (_, i) => {
    const x = (i * 73 * seed + 11) % 100, y = (i * 37 * seed + 7) % 100, r = (i % 3) * .25 + .35;
    return `<circle class="tw" cx="${x}" cy="${y}" r="${r}" fill="#fff" style="animation-delay:${(i % 7) * .5}s"/>`;
  }).join('');
  const planet = (cls) => `<svg class="${cls}" viewBox="0 0 120 80" aria-hidden="true">
    <defs><radialGradient id="pl" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#ffd6a1"/><stop offset=".6" stop-color="#ff9b6b"/><stop offset="1" stop-color="#d9607a"/></radialGradient></defs>
    <ellipse cx="60" cy="42" rx="56" ry="13" fill="none" stroke="#ffe6a8" stroke-width="5" opacity=".85" transform="rotate(-14 60 42)"/>
    <circle cx="60" cy="40" r="26" fill="url(#pl)"/>
    <path d="M10 49 Q60 70 110 35" stroke="#ffe6a8" stroke-width="5" fill="none" opacity=".9" transform="rotate(-6 60 42)"/></svg>`;
  const moonGround = (top) => `<svg class="moon-ground" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id="mg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9c3e6"/><stop offset="1" stop-color="#8f86c2"/></linearGradient></defs>
    <path d="M0 ${top} Q25 ${top - 6} 50 ${top - 1} T100 ${top - 3} V100 H0 Z" fill="url(#mg)"/>
    <ellipse cx="22" cy="${top + 12}" rx="7" ry="2.2" fill="#a79fd3"/><ellipse cx="70" cy="${top + 20}" rx="10" ry="3" fill="#a79fd3"/>
    <ellipse cx="45" cy="${top + 32}" rx="6" ry="2" fill="#a79fd3"/></svg>`;
  const stars = (n, seed) => `<svg class="stars-bg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${starDots(n, seed)}</svg>`;
  const earth = () => `<svg class="earth" viewBox="0 0 60 60" aria-hidden="true">
    <circle cx="30" cy="30" r="26" fill="#3d8bff"/><path d="M14 22 Q22 12 30 18 T44 20 Q40 30 30 28 T16 34 Z" fill="#43c36b"/>
    <path d="M30 40 Q38 36 46 42 Q40 50 32 48 Z" fill="#43c36b"/><circle cx="22" cy="20" r="8" fill="#fff" opacity=".18"/></svg>`;

  // =========================== GRANJA ===========================
  list.granja = {
    id: 'granja', name: 'Granja', emoji: '🚜', say: '¡Nos vamos a la granja!',
    background: () => Decor.cloud('c1') + Decor.cloud('c2') + Decor.cloud('c3') + Decor.hills(70),
    world: {
      name: 'Mi granja', icon: '🏡', full: '¡Tu granja está completa! ¡Qué bonita!',
      first: '¡Esta es tu granja! Gana estrellas jugando y vendrán más amigos.',
      many: '¡Mira cuántos amigos nuevos han llegado a tu granja! Tócalos.',
      scene: () => `<div class="farm-sky"></div>${Decor.hills(46, true)}${Decor.sun()}${Decor.cloud('c1')}${Decor.cloud('c2')}
        <div class="flowers">${Array.from({ length: 14 }, (_, i) =>
          `<span style="left:${(i * 37) % 100}%;top:${62 + ((i * 53) % 34)}%">${['🌼', '🌷', '🌱', '🌸'][i % 4]}</span>`).join('')}</div>`,
      // [emoji, nombre con artículo, lo que "dice", x %, y % (pies), tamaño, estrellas necesarias, notas]
      items: [
        ['🐮', 'La vaca', '¡Muuu!',                 50, 88, 16,   0, [147, 131]],
        ['🐔', 'La gallina', '¡Co, co, co!',        20, 93, 11,   3, [660, 660, 880]],
        ['🌻', 'El girasol', '¡Qué alto!',           8, 70, 11,   6, [523, 784]],
        ['🐷', 'El cerdito', '¡Oink, oink!',        78, 82, 14,  10, [330, 262]],
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
        ['🎈', 'El globo', '¡Arriba, arriba!',      84, 30, 13, 118, [262, 392, 523, 1047]]
      ]
    },
    sets: {
      // [emoji, plural, género]
      contables: [['🐮', 'vacas', 'f'], ['🐔', 'gallinas', 'f'], ['🐑', 'ovejas', 'f'], ['🐴', 'caballos', 'm'], ['🐶', 'perritos', 'm'],
                  ['🐱', 'gatitos', 'm'], ['🐰', 'conejos', 'm'], ['🍎', 'manzanas', 'f'], ['🌻', 'girasoles', 'm'], ['🐷', 'cerditos', 'm']],
      parejas: [['🦁', 'el león'], ['🐘', 'el elefante'], ['🐸', 'la rana'], ['🦒', 'la jirafa'], ['🐵', 'el mono'], ['🐧', 'el pingüino'],
                ['🐢', 'la tortuga'], ['🦊', 'el zorro'], ['🐙', 'el pulpo'], ['🦋', 'la mariposa'], ['🐝', 'la abeja'], ['🐳', 'la ballena']],
      pilla: { targets: ['🐹', '🐰', '🐭', '🐿️'], word: 'animalitos', avoid: '🐺', avoidName: 'el lobo', gold: '🌟',
               bg: 'linear-gradient(#9be15d,#6fbf3b)', hole: 'radial-gradient(#5b3a1c 55%, #7a5230 56%)' },
      rescate: { hero: '🦸', cape: true, rescued: '🐥', carrier: '🎈', plural: 'pollitos', hazard: '⛈️', hazardName: 'las nubes de tormenta',
                 heroName: 'Súper Héroe', bg: 'linear-gradient(#5cb8ff, #c9ecff 70%, #e9f9d8)', decor: '☁️' },
      carrera: { vehicle: '🏎️', sprite: () => Decor.carTop(), obstacles: ['🪨', '🚧', '🐄', '🛢️'], collect: '⭐', road: true, title: 'carrera',
                 verge: ['🌳', '🌲', '🏠', '🌳', '🌼', '🪨', '🌲', '🌻'] },
      escena: () => Decor.hills(80),
      laminas: ['casa', 'tractor', 'flor', 'mariposa'],
      series: [['🔴', '🔵', '🟡', '🟢'], ['🍎', '🍌', '🍇', '🍐'], ['🐮', '🐔', '🐑', '🐴'], ['⭐', '🌙', '☀️', '☁️'], ['🚗', '🚂', '✈️', '🚲']],
      piano: ['🐮', '🐔', '🐑', '🐸', '🐳', '🐦', '🐱', '🐶'],
      sellos: ['⭐', '🐮', '❤️', '🌸', '🚜', '🦋', '☀️'],
      letras: {}   // usa solo las palabras base
    }
  };

  // =========================== ESPACIO ===========================
  list.espacio = {
    id: 'espacio', name: 'Espacio', emoji: '🚀', say: '¡Despegamos! ¡Nos vamos al espacio!',
    background: () => stars(60, 1) + planet('planet') + earth() + moonGround(86),
    world: {
      name: 'Mi base espacial', icon: '🛰️', full: '¡Tu base espacial está completa! ¡Eres un astronauta de verdad!',
      first: '¡Esta es tu base espacial! Gana estrellas jugando y llegarán más amigos del espacio.',
      many: '¡Mira cuántas cosas nuevas han llegado a tu base espacial! Tócalas.',
      scene: () => `<div class="space-sky"></div>${stars(70, 3)}${planet('planet')}${moonGround(70)}`,
      items: [
        ['🧑‍🚀', 'El astronauta', '¡Hola desde el espacio!',  48, 90, 16,   0, [392, 523]],
        ['🚀', 'El cohete', '¡Tres, dos, uno, despegue!',      18, 78, 20,   3, [262, 392, 523, 1047]],
        ['⭐', 'La estrella', '¡Brillo, brillo!',              84, 14,  9,   6, [1047, 1319]],
        ['🌍', 'La Tierra', '¡Aquí vivimos nosotros!',         12, 26, 16,  10, [262, 330, 392]],
        ['🌙', 'La Luna', '¡Buenas noches!',                   60, 22, 13,  14, [523, 392]],
        ['🛰️', 'El satélite', '¡Bip, bip, bip!',               36, 14, 12,  19, [880, 880, 880]],
        ['👽', 'El marcianito', '¡Hola, terrícola!',           76, 88, 12,  24, [659, 784, 988]],
        ['🛸', 'El platillo volante', '¡Fiuuu!',               80, 40, 15,  30, [440, 880]],
        ['🤖', 'El robot', '¡Bip, bop, bip!',                  30, 95, 12,  36, [196, 262]],
        ['☄️', 'El cometa', '¡Qué cola tan larga!',            40, 34, 12,  43, [784, 523]],
        ['🔭', 'El telescopio', '¡Veo, veo las estrellas!',    92, 92, 12,  50, [523, 659, 784]],
        ['🪐', 'Saturno', '¡Mira mis anillos!',                62, 50, 14,  58, [330, 392]],
        ['🔴', 'Marte, el planeta rojo', '¡Soy rojo!',          22, 48,  9,  66, [220, 262]],
        ['👾', 'El monstruito', '¡Bloop, bloop!',              60, 97, 10,  75, [330, 294, 262]],
        ['🌠', 'La estrella fugaz', '¡Pide un deseo!',         50, 8,  10,  85, [1319, 1047, 784]],
        ['🐕', 'La perrita astronauta', '¡Guau en el espacio!', 8, 96, 11,  95, [392, 330]],
        ['🌞', 'El Sol', '¡Qué calor!',                        92, 62, 13, 106, [523, 659]],
        ['🌟', 'La estrella mágica', '¡Lo has conseguido todo!', 50, 62, 14, 118, [523, 659, 784, 1047]]
      ]
    },
    sets: {
      contables: [['🚀', 'cohetes', 'm'], ['⭐', 'estrellas', 'f'], ['👽', 'marcianitos', 'm'], ['🪐', 'planetas', 'm'], ['🛸', 'platillos volantes', 'm'],
                  ['🌙', 'lunas', 'f'], ['🧑‍🚀', 'astronautas', 'm'], ['☄️', 'cometas', 'm'], ['🛰️', 'satélites', 'm'], ['🤖', 'robots', 'm']],
      parejas: [['🚀', 'el cohete'], ['⭐', 'la estrella'], ['👽', 'el marcianito'], ['🪐', 'el planeta'], ['🛸', 'el platillo volante'], ['🌙', 'la luna'],
                ['🧑‍🚀', 'el astronauta'], ['☄️', 'el cometa'], ['🛰️', 'el satélite'], ['🤖', 'el robot'], ['🌍', 'la Tierra'], ['🔭', 'el telescopio']],
      pilla: { targets: ['👽', '👾'], word: 'marcianitos', avoid: '☄️', avoidName: 'el meteorito', gold: '🌟',
               bg: 'linear-gradient(#2a2370, #4b3a96)', hole: 'radial-gradient(#3a2f6e 55%, #8f86c2 56%)' },
      rescate: { hero: '🧑‍🚀', cape: false, rescued: '👽', carrier: '🫧', plural: 'marcianitos', hazard: '☄️', hazardName: 'los meteoritos',
                 heroName: 'Astronauta', bg: 'linear-gradient(#14163d, #2a2370 60%, #4b3a96)', decor: '✨' },
      carrera: { vehicle: '🚀', sprite: () => Decor.rocketTop(), obstacles: ['☄️', '🪨', '🛸'], collect: '⭐', road: false, title: 'carrera espacial',
                 verge: ['🪐', '⭐', '🌙', '✨', '🌍', '⭐', '☄️', '✨'] },
      escena: () => moonGround(86),
      laminas: ['cohete', 'astronauta', 'planeta', 'ovni'],
      series: [['🌍', '🌙', '⭐', '🪐'], ['🚀', '🛸', '🛰️', '☄️'], ['👽', '🧑‍🚀', '🤖', '👾'], ['🔴', '🔵', '🟡', '🟢']],
      piano: ['☀️', '🌍', '🌙', '⭐', '🪐', '🚀', '👽', '🛸'],
      sellos: ['⭐', '🚀', '🪐', '👽', '🌙', '🛸', '🌍'],
      // Palabras del espacio para el juego de letras (se mezclan con las de siempre)
      letras: { A: [['🧑‍🚀', 'astronauta']], E: [['⭐', 'estrella']], O: [['🛸', 'ovni']], L: [['🌙', 'luna']],
                P: [['🪐', 'planeta']], S: [['🛰️', 'satélite'], ['☀️', 'sol']], T: [['🌍', 'Tierra'], ['🔭', 'telescopio']],
                M: [['☄️', 'meteorito'], ['👽', 'marciano']] }
    }
  };

  const current = () => list[Store.profile.theme] || list[DEFAULT];
  // Conjunto de objetos del tema actual, con el de granja como respaldo.
  const set = (name) => (current().sets[name] !== undefined ? current().sets[name] : list[DEFAULT].sets[name]);
  function use(id) {
    if (!list[id]) return;
    Store.profile.theme = id; Store.save();
    apply();
  }
  function apply() {
    const t = current();
    document.body.className = document.body.className.replace(/\btheme-\S+/g, '').trim();
    document.body.classList.add('theme-' + t.id);
    const d = document.getElementById('decor');
    if (d) d.innerHTML = t.background();
  }
  return { list, current, set, use, apply };
})();
