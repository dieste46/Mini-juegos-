/* Memoria de parejas: atención y memoria de trabajo. Cada pareja dice el nombre del animal (vocabulario). */
Games.push({
  id: 'memoria',
  name: 'Parejas',
  emoji: '🧠',
  color: '#8e6cff',
  learns: 'Memoria de trabajo, atención y vocabulario de animales.',
  maxLevel: 4,
  start(root, exit) {
    const CARDS = [['🦁', 'el león'], ['🐘', 'el elefante'], ['🐸', 'la rana'], ['🦒', 'la jirafa'], ['🐵', 'el mono'], ['🐧', 'el pingüino'],
                   ['🐢', 'la tortuga'], ['🦊', 'el zorro'], ['🐙', 'el pulpo'], ['🦋', 'la mariposa'], ['🐝', 'la abeja'], ['🐳', 'la ballena']];
    const LEVELS = { 1: [3, 3], 2: [4, 4], 3: [6, 4], 4: [8, 4] }; // [parejas, columnas]
    const g = Core.gameState(this.id);
    const maxLevel = this.maxLevel, id = this.id;

    function play() {
      const [pairs, cols] = LEVELS[g.level];
      const deck = Core.shuffle(Core.sample(CARDS, pairs).flatMap(c => [c, c]));
      let open = [], found = 0, moves = 0, busy = false;

      root.innerHTML = `<div class="prompt"><button class="speak-btn">🔊</button><span>Encuentra las parejas</span></div>
                        <div class="memory-grid" style="--cols:${cols}"></div>`;
      const say = () => Core.say('Busca dos cartas iguales. Toca dos cartas.');
      root.querySelector('.speak-btn').onclick = say; say();

      const grid = root.querySelector('.memory-grid');
      deck.forEach(([emoji, name]) => {
        const b = Core.el(`<button class="mcard">${emoji}</button>`);
        b.onclick = () => {
          if (busy || b.classList.contains('open') || b.classList.contains('done')) return;
          b.classList.add('open'); open.push({ b, emoji, name });
          if (open.length < 2) return;
          moves++;
          const [x, y] = open; open = [];
          if (x.emoji === y.emoji) {
            x.b.classList.add('done'); y.b.classList.add('done');
            found++; Core.addStar(); Core.celebrate();
            Core.say(`¡Pareja! ${name}.`);
            if (found === pairs) setTimeout(finish, 1300);
          } else {
            busy = true;
            setTimeout(() => { x.b.classList.remove('open'); y.b.classList.remove('open'); busy = false; }, 900);
          }
        };
        grid.appendChild(b);
      });

      function finish() {
        // Nivel: si lo resuelve con pocos intentos sube; si le cuesta mucho, baja.
        // Buena (≤2 intentos/pareja) = racha completa; mala (>3 intentos/pareja) = dos fallos; intermedia no cambia nada.
        g.played++;
        if (moves <= pairs * 2) for (let i = 0; i < 3; i++) Core.registerAnswer(id, true, maxLevel);
        else if (moves > pairs * 3) for (let i = 0; i < 2; i++) Core.registerAnswer(id, false, maxLevel);
        Core.celebrate(true);
        Core.say('¡Has encontrado todas las parejas!');
        root.innerHTML = `<div class="prompt" style="flex-direction:column;font-size:2rem">🏆<span>¡Todas las parejas!</span></div>
          <div class="options"><button class="opt" id="again">🔁</button><button class="opt" id="out">🏠</button></div>`;
        root.querySelector('#again').onclick = play;
        root.querySelector('#out').onclick = exit;
      }
    }
    play();
  }
});
