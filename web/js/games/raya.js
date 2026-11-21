/* Tres en raya de tres fichas: cada jugador solo tiene tres. Al poner la cuarta, la más antigua se va,
   así que nunca hay empate y siempre hay algo que pensar. La ficha que se irá parpadea para que se vea venir.
   - Contra Bip: la máquina se equivoca a propósito según el nivel, que sube y baja solo.
     En los niveles bajos se marca el hueco que hay que tapar (pista, no castigo).
   - Dos jugadores en el mismo móvil.
   Gana la partida quien hace tres veces tres en raya. */
{
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const winLine = (b, p) => LINES.find(l => l.every(i => b[i] === p)) || null;
  // Estado: b = las 9 casillas (0 vacía, 1 o 2), q = orden en que puso cada uno sus fichas
  const fresh = () => ({ b: Array(9).fill(0), q: { 1: [], 2: [] } });
  const legal = s => s.b.map((v, i) => (v ? -1 : i)).filter(i => i >= 0);
  function apply(s, p, c) {
    const b = s.b.slice(), q = { 1: s.q[1].slice(), 2: s.q[2].slice() };
    if (q[p].length === 3) b[q[p].shift()] = 0;
    b[c] = p; q[p].push(c); return { b, q };
  }
  const winners = (s, p) => legal(s).filter(c => winLine(apply(s, p, c).b, p));
  // Lo buena que es la posición para quien mueve, mirando unas jugadas por delante
  function score(s, p, depth) {
    const moves = legal(s);
    for (const c of moves) if (winLine(apply(s, p, c).b, p)) return 1 + depth * 0.01;
    if (!depth) return 0;
    let best = -2;
    for (const c of moves) best = Math.max(best, -score(apply(s, p, c), 3 - p, depth - 1));
    return best;
  }
  // Jugada de la máquina (ficha 2). Por nivel: [probabilidad de rematar, de tapar, jugadas que mira por delante]
  const SKILL = [[0.2, 0.05, 0], [0.75, 0.5, 0], [1, 0.9, 0], [1, 1, 3]];
  function think(s, level) {
    const [pWin, pBlock, deep] = SKILL[level - 1] || SKILL[0], moves = legal(s);
    const wins = winners(s, 2);
    if (wins.length && Math.random() < pWin) return Core.pick(wins);
    let cand = moves.filter(c => !wins.includes(c));            // si "no la ve", tampoco gana de casualidad
    if (!cand.length) cand = moves;
    const safe = cand.filter(c => !winners(apply(s, 2, c), 1).length);
    if (safe.length && Math.random() < pBlock) cand = safe;
    if (deep) {
      const scored = cand.map(c => [c, -score(apply(s, 2, c), 1, deep)]), top = Math.max(...scored.map(x => x[1]));
      cand = scored.filter(x => x[1] > top - 0.005).map(x => x[0]);
    }
    return Core.pick(cand);
  }

  // Fichas clásicas, dibujadas con el estilo de la web
  const XO = { a: ['x', 'las equis'], b: ['o', 'los círculos'] };
  const XO_SVG = {
    x: '<svg class="xo" viewBox="0 0 100 100" aria-hidden="true"><path d="M25 25 L75 75 M75 25 L25 75" stroke="#B8185F" stroke-width="27" stroke-linecap="round"/><path d="M25 25 L75 75 M75 25 L25 75" stroke="#FF5FA2" stroke-width="17" stroke-linecap="round"/></svg>',
    o: '<svg class="xo" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="29" fill="none" stroke="#0E8FA0" stroke-width="27"/><circle cx="50" cy="50" r="29" fill="none" stroke="#35D6E6" stroke-width="17"/></svg>'
  };

  Games.push({
    id: 'raya', section: 'recreo',
    name: 'Tres en raya', emoji: '⭕', color: '#35D6E6',
    learns: 'Pensar antes de mover, anticipar la jugada del otro y esperar el turno.',
    how: () => ['Por turnos, cada uno pone una ficha en una casilla vacía.', 'Solo hay tres fichas por jugador. Al poner la cuarta, se va la más antigua, que es la que parpadea.', 'Pon tus tres fichas en fila. Gana la partida quien lo consigue tres veces.', `Puedes jugar contra ${Mascot.NAME} o contra otra persona.`],
    maxLevel: 4,
    start(root, exit) {
      const T = Themes.set('raya'), g = Core.gameState('raya'), GOAL = 3;
      let timers = [], alive = true, fxo = null, told = false;
      const later = (fn, ms) => { const id = setTimeout(() => alive && fn(), ms); timers.push(id); return id; };
      const clear = () => { timers.forEach(clearTimeout); timers = []; if (fxo) { fxo.destroy(); fxo = null; } };
      // g.skin: 'xo' (equis y círculos) o 'tema' (los personajes del tema)
      const themed = () => g.skin === 'tema', side = p => (themed() ? T : XO)[p === 1 ? 'a' : 'b'];
      const piece = p => (themed() ? Core.pic(side(p)[0]) : XO_SVG[side(p)[0]]);

      // ---------- Elegir: contra Bip o dos jugadores ----------
      function choose(quiet) {
        clear();
        const skin = (id, a, b) => `<button class="raya-skin${(g.skin || 'xo') === id ? ' on' : ''}" data-s="${id}" aria-label="${id === 'xo' ? 'Equis y círculos' : 'Personajes'}">${a}${b}</button>`;
        root.innerHTML = `<div class="prompt"><button class="speak-btn">🔊</button><span>¿Cómo jugamos?</span></div>
          <div class="raya-skins">${skin('xo', XO_SVG.x, XO_SVG.o)}${skin('tema', Core.pic(T.a[0]), Core.pic(T.b[0]))}</div>
          <div class="raya-modes">
            <button class="raya-mode" data-m="1" aria-label="Jugar contra Bip"><span class="me">${piece(1)}</span><i>⚡</i><span class="bip">${Mascot.svg()}</span></button>
            <button class="raya-mode" data-m="2" aria-label="Dos jugadores"><span class="me">${piece(1)}</span><i>⚡</i><span class="me">${piece(2)}</span></button>
            <button class="raya-mode simon" data-go="simon" aria-label="Repite con Bip">${(Games.find(x => x.id === 'simon') || { icon: () => '🎵' }).icon()}<i>🎵</i><span class="bip">${Mascot.svg()}</span></button></div>`;
        const say = () => Core.say(`Tres en raya. Toca el robot para jugar contra ${Mascot.NAME}, o las dos fichas para jugar dos. Y los colores, para repetir lo que hace ${Mascot.NAME}.`);
        root.querySelector('.speak-btn').onclick = say; if (!quiet) say();
        root.querySelectorAll('.raya-skin').forEach(b => b.onclick = () => { g.skin = b.dataset.s; Core.save(); Core.sfx.pop(); choose(true); Core.say(`Con ${side(1)[1]} y ${side(2)[1]}.`); });
        root.querySelectorAll('.raya-mode').forEach(b => b.onclick = () => { Core.sfx.pop(); b.dataset.go ? (location.hash = b.dataset.go) : play(+b.dataset.m); });
      }

      function play(mode) {
        clear();
        let s = fresh(), turn = 1, starter = 1, busy = false, idle = 0;
        const pts = { 1: 0, 2: 0 };
        root.innerHTML = `<div class="raya-score">
            <span class="side s1"><span class="pc">${piece(1)}</span><span class="pips">${'<i></i>'.repeat(GOAL)}</span></span>
            <button class="speak-btn" id="sp">🔊</button>
            <span class="side s2"><span class="pips">${'<i></i>'.repeat(GOAL)}</span><span class="pc">${piece(2)}</span>${mode === 1 ? `<span class="bipmini">${Mascot.svg()}</span>` : ''}</span></div>
          <div class="raya-wrap"><div class="raya-board">${Array.from({ length: 9 }, (_, i) => `<button class="rcell" data-i="${i}" aria-label="Casilla ${i + 1}"></button>`).join('')}</div></div>`;
        const cells = [...root.querySelectorAll('.rcell')], sides = { 1: root.querySelector('.s1'), 2: root.querySelector('.s2') };
        fxo = Fx.overlay(root.querySelector('.raya-wrap'));
        const intro = () => Core.say(mode === 1
          ? `Pon tres iguales en fila. Tú llevas ${side(1)[1]} y ${Mascot.NAME} lleva ${side(2)[1]}. Solo hay tres fichas: al poner otra, la que parpadea se va.`
          : `Pon tres iguales en fila. Empiezan ${side(1)[1]}. Solo hay tres fichas: al poner otra, la que parpadea se va.`);
        root.querySelector('#sp').onclick = intro; intro();

        // Marca de quién es el turno, qué ficha se irá y las pistas
        function mark() {
          sides[1].classList.toggle('on', turn === 1); sides[2].classList.toggle('on', turn === 2);
          const old = s.q[turn].length === 3 ? s.q[turn][0] : -1;
          const danger = mode === 1 && turn === 1 && g.level <= 2 ? winners(s, 2) : [];
          cells.forEach((c, i) => { c.classList.toggle('old', i === old); c.classList.toggle('danger', danger.includes(i)); c.classList.remove('hint'); });
          if (danger.length && !told) { told = true; later(() => Core.say(`¡Ojo! ${Mascot.NAME} va a hacer tres. Tápale el hueco que brilla.`), 400); }
          clearTimeout(idle);   // si se queda parado un rato, parpadean las casillas libres (ayuda, no prisa)
          if (mode === 2 || turn === 1) idle = later(() => cells.forEach((c, i) => c.classList.toggle('hint', !s.b[i])), 8000);
        }

        function move(c) {
          const p = turn, old = s.q[p].length === 3 ? s.q[p][0] : -1;
          s = apply(s, p, c);
          if (old >= 0) { const o = cells[old]; o.className = 'rcell gone'; later(() => { if (!s.b[old]) { o.innerHTML = ''; o.className = 'rcell'; } }, 240); }
          cells[c].className = 'rcell p' + p; cells[c].innerHTML = `<span class="pz">${piece(p)}</span>`;
          Core.sfx.pop(); const [x, y] = fxo.at(cells[c]); fxo.ring(x, y, '#FFFFFF', 14, 200, 0.28);
          const line = winLine(s.b, p);
          if (line) return won(p, line);
          turn = 3 - p; mark();
          if (mode === 1 && turn === 2) botTurn();
        }
        function botTurn() {
          busy = true; Mascot.mood(sides[2], 'wow', 900);
          later(() => { busy = false; move(think(s, g.level)); }, 750 + Math.random() * 500);
        }

        function won(p, line) {
          busy = true; clearTimeout(idle);
          cells.forEach(c => c.classList.remove('old', 'danger', 'hint'));
          line.forEach((i, k) => later(() => {
            cells[i].classList.add('win'); const [x, y] = fxo.at(cells[i]);
            fxo.burst(x, y, { n: 12, shape: 'star', colors: ['#FFD23F', '#FFFFFF', '#FF5FA2'], speed: 260, gravity: 380, size: 9, life: 0.7 });
          }, k * 140));
          pts[p]++; sides[p].querySelectorAll('.pips i').forEach((d, i) => d.classList.toggle('on', p === 1 ? i < pts[p] : i >= GOAL - pts[p]));
          if (mode === 1) {   // nivel: dos victorias seguidas lo suben, dos derrotas seguidas lo bajan
            if (p === 1) { g.streak++; g.misses = 0; if (g.streak >= 2 && g.level < 4) { g.level++; g.streak = 0; } Core.addStar(); Core.celebrate(); Mascot.mood(sides[2], 'joy', 1500); }
            else { g.streak = 0; g.misses++; if (g.misses >= 2 && g.level > 1) { g.level--; g.misses = 0; } }
            Core.save();
            Core.say(p === 1 ? `¡Tres en raya! ${Core.praise()}` : `¡Tres en raya de ${Mascot.NAME}! Mira la fila que ha hecho.`);
          } else { Core.celebrate(); Core.say(`¡Tres en raya! Punto para ${side(p)[1]}.`); }
          Core.sfx.ding();
          later(() => (pts[p] >= GOAL ? matchEnd(p) : newRound()), 2100);
        }

        function newRound() {
          s = fresh(); cells.forEach(c => { c.className = 'rcell'; c.innerHTML = ''; });
          // Contra Bip empieza siempre el niño hasta que el nivel es alto; entre dos, se alterna
          starter = mode === 2 || g.level >= 3 ? 3 - starter : 1;
          turn = starter; busy = false; mark();
          if (mode === 1 && turn === 2) botTurn();
        }

        function matchEnd(p) {
          g.played++; Core.save();
          const again = () => play(mode);
          if (mode === 1 && p === 2) {   // gana Bip: sin fanfarria ni castigo, y a por la revancha
            clear();
            root.innerHTML = `<div class="endcard"><div class="end-mascot">${Mascot.svg('joy')}</div>
              <div class="end-title"><span>¡Buena partida!</span></div>
              <div class="end-btns"><button class="round again" id="again" aria-label="Otra vez">🔁</button><button class="round home" id="out" aria-label="Salir">🏠</button></div></div>`;
            Core.say(`Esta vez ha ganado ${Mascot.NAME}. ¡Has jugado muy bien! ¿Jugamos la revancha?`);
            root.querySelector('#again').onclick = again; root.querySelector('#out').onclick = exit;
            return;
          }
          Core.addStar(); clear();
          if (mode === 1) Core.endScreen(root, `<div>${piece(1)}🏆</div><span>¡Has ganado a ${Mascot.NAME}!</span>`, '¡Has ganado la partida! ¡Qué bien piensas!', again, exit);
          else Core.endScreen(root, `<div>${piece(p)}🏆</div><span>¡Ganan ${side(p)[1]}!</span>`, `¡Ganan ${side(p)[1]}! ¡Buena partida!`, again, exit);
        }

        cells.forEach((c, i) => c.addEventListener('pointerdown', e => {
          e.preventDefault();
          if (busy || s.b[i] || (mode === 1 && turn === 2)) return;
          move(i);
        }));
        mark();
      }

      choose();
      return () => { alive = false; clear(); };
    }
  });
}
