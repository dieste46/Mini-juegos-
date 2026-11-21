/* Guía a Bip: se ponen las flechas del camino y luego Bip las ejecuta, una a una.
   - Flechas de dirección fija (arriba, abajo, izquierda, derecha): a los 5 años "gira a la izquierda" es mucho más difícil.
   - Si choca o se queda corto no pasa nada: Bip se para ahí y se sigue programando desde ese punto.
   - La estrella solo se gana llegando a la primera, con el camino pensado entero.
   - Pistas en escalera: primero brilla la flecha que toca y después se ve un trozo del camino.
   Cinco niveles: en línea recta, un giro, rodear obstáculos, pasar por la estrella y la ficha de repetir.
   Los tableros se generan solos. Tres por partida. */
{
  const DIR = { u: [0, -1, 'arriba'], r: [1, 0, 'derecha'], d: [0, 1, 'abajo'], l: [-1, 0, 'izquierda'] };
  const KEYS = ['l', 'u', 'd', 'r'];
  const COLOR = { u: '#35D6E6', r: '#FF5FA2', d: '#FF8A3D', l: '#B79CFF' };
  const TURN = { u: 0, r: 90, d: 180, l: 270 };
  const arrow = d => `<svg class="rb-ar" viewBox="0 0 48 48" style="transform:rotate(${TURN[d]}deg)" aria-hidden="true"><path d="M24 8 L40 26 H30.5 V40 H17.5 V26 H8 Z" fill="#fff" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg>`;
  const ICON = {
    go: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M17 11 L37 24 L17 37 Z" fill="#fff" stroke="#fff" stroke-width="5" stroke-linejoin="round"/></svg>',
    del: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M19 11 H39 A3 3 0 0 1 42 14 V34 A3 3 0 0 1 39 37 H19 L6 24 Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M22 18 L33 30 M33 18 L22 30" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>',
    rep: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M36 20 A13 13 0 1 0 37 28" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><path d="M38 9 V21 H26" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  // n: casillas por lado · walls: obstáculos · steps y turns: pasos y giros del camino más corto
  const LEVELS = [
    { n: 4, walls: 0, steps: [2, 3], turns: [0, 0] },                 // 1: en línea recta
    { n: 4, walls: 0, steps: [3, 5], turns: [1, 1] },                 // 2: un giro
    { n: 4, walls: 3, steps: [4, 6], turns: [2, 3] },                 // 3: hay que rodear algo
    { n: 5, walls: 5, steps: [5, 8], turns: [1, 4], star: true },     // 4: primero la estrella
    { n: 5, walls: 4, steps: [6, 9], turns: [1, 3], repeat: true }    // 5: pocos huecos; la ficha de repetir
  ];
  const MAX_REPEAT = 4;

  // Camino con menos pasos y, a igualdad, con menos giros, pasando por las metas en orden. Devuelve las flechas o null.
  function route(n, walls, from, targets, facing = null) {
    const blocked = new Set(walls.map(([x, y]) => x + ',' + y));
    let out = [], at = from, dir = facing;
    for (const to of targets) {
      const best = new Map(), start = at[0] + ',' + at[1] + ',' + (dir || '');
      const open = [{ x: at[0], y: at[1], d: dir, cost: 0, path: [] }]; best.set(start, 0);
      let found = null;
      while (open.length) {
        open.sort((a, b) => a.cost - b.cost);
        const cur = open.shift();
        if (cur.x === to[0] && cur.y === to[1]) { found = cur; break; }
        for (const k of KEYS) {
          const x = cur.x + DIR[k][0], y = cur.y + DIR[k][1];
          if (x < 0 || y < 0 || x >= n || y >= n || blocked.has(x + ',' + y)) continue;
          const cost = cur.cost + 100 + (cur.d && cur.d !== k ? 1 : 0), key = x + ',' + y + ',' + k;
          if (best.has(key) && best.get(key) <= cost) continue;
          best.set(key, cost); open.push({ x, y, d: k, cost, path: [...cur.path, k] });
        }
      }
      if (!found) return null;
      out = out.concat(found.path); at = to; dir = found.d || dir;
    }
    return out;
  }
  const turnsOf = p => p.reduce((t, d, i) => t + (i && d !== p[i - 1] ? 1 : 0), 0);
  // Tramos rectos: ['r','r','d'] -> [{d:'r',n:2},{d:'d',n:1}], partiendo los que pasen del máximo de repeticiones
  function runsOf(p) {
    const runs = [];
    p.forEach(d => { const last = runs[runs.length - 1]; if (last && last.d === d && last.n < MAX_REPEAT) last.n++; else runs.push({ d, n: 1 }); });
    return runs;
  }

  function gen(level) {
    const L = LEVELS[level - 1], n = L.n, all = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) all.push([x, y]);
    for (let t = 0; t < 600; t++) {
      const c = Core.shuffle(all), start = c[0], goal = c[1], star = L.star ? c[2] : null, walls = c.slice(3, 3 + L.walls);
      const path = route(n, walls, start, star ? [star, goal] : [goal]);
      if (!path || path.length < L.steps[0] || path.length > L.steps[1]) continue;
      const turns = turnsOf(path);
      if (turns < L.turns[0] || turns > L.turns[1]) continue;
      if (star && route(n, walls, start, [goal]).length === path.length) continue;        // la estrella tiene que obligar a desviarse
      if (L.repeat && path.length - runsOf(path).length < 2) continue;                    // que repetir ahorre de verdad
      return { level, n, start, goal, star, walls, repeat: !!L.repeat };
    }
    return { level: 1, n: 4, start: [0, 1], goal: [2, 1], star: null, walls: [], repeat: false };   // por si acaso: uno sencillo
  }

  Games.push({
    id: 'robot', section: 'aprende',
    name: 'Guía a Bip', emoji: '🤖', art: () => 'bip', color: '#35D6E6',
    learns: 'Pensar el camino antes de andarlo: ordenar pasos, arriba, abajo, izquierda y derecha, y corregir sobre la marcha (pensamiento computacional).',
    how: () => [`Mira dónde está ${Mascot.NAME} y adónde tiene que llegar.`, 'Toca las flechas del camino, en orden. Se van poniendo en los huecos.', `Pulsa el botón verde y ${Mascot.NAME} hará lo que le has dicho.`, 'Si choca o no llega, no pasa nada. Sigue desde donde se ha quedado.', 'Si hay una estrella, pasa primero por ella. El botón amarillo repite la última flecha.'],
    maxLevel: LEVELS.length,
    start(root, exit) {
      const g = Core.gameState('robot'), PER = 3;
      let alive = true, timers = [], fxo = null, toldRepeat = false;
      const later = (fn, ms) => { const id = setTimeout(() => alive && fn(), ms); timers.push(id); return id; };
      const clear = () => { timers.forEach(clearTimeout); timers = []; if (fxo) { fxo.destroy(); fxo = null; } };

      function play() {
        clear();
        const T = Themes.set('robot');
        let count = 0, P = null, pos = [0, 0], hasStar = false, prog = [], slots = 0, busy = false, done = false, fails = 0, clean = true, guided = false;

        root.innerHTML = `<div class="rb">
          <div class="prompt rb-top"><button class="speak-btn" id="sp" aria-label="Repetir">🔊</button><span class="rb-goal"></span>
            <span class="rb-count">${'<i>★</i>'.repeat(PER)}</span></div>
          <div class="rb-wrap"><div class="rb-board" id="rb"></div></div>
          <div class="rb-tray" aria-label="Flechas puestas"></div>
          <div class="rb-keys">${KEYS.map(k => `<button class="rb-key" data-d="${k}" style="--c:${COLOR[k]}" aria-label="${DIR[k][2]}">${arrow(k)}</button>`).join('')}</div>
          <div class="rb-acts"><button class="rb-key rb-del" aria-label="Quitar la última flecha">${ICON.del}</button>
            <button class="rb-key rb-go" aria-label="¡En marcha!">${ICON.go}</button>
            <button class="rb-key rb-rep" aria-label="Repetir la última flecha">${ICON.rep}</button></div></div>`;
        const board = root.querySelector('#rb'), wrap = root.querySelector('.rb-wrap'), tray = root.querySelector('.rb-tray');
        const goalEl = root.querySelector('.rb-goal'), countEl = [...root.querySelectorAll('.rb-count i')];
        const keyEl = Object.fromEntries(KEYS.map(k => [k, root.querySelector(`.rb-key[data-d=${k}]`)]));
        const goBtn = root.querySelector('.rb-go'), delBtn = root.querySelector('.rb-del'), repBtn = root.querySelector('.rb-rep');
        let bip = null;
        fxo = Fx.overlay(wrap);

        const cellAt = ([x, y]) => board.children[y * P.n + x];
        const same = (a, b) => a && b && a[0] === b[0] && a[1] === b[1];
        const isWall = (x, y) => x < 0 || y < 0 || x >= P.n || y >= P.n || P.walls.some(w => w[0] === x && w[1] === y);
        const targets = (star = hasStar) => (P.star && !star ? [P.star, P.goal] : [P.goal]);
        const place = () => { bip.style.setProperty('--x', pos[0]); bip.style.setProperty('--y', pos[1]); };
        // Dónde acabaría Bip con las flechas que ya hay puestas (null si alguna choca)
        function ahead() {
          let at = pos, star = hasStar; const cells = [];
          for (const { d, n } of prog) for (let i = 0; i < n; i++) {
            const nx = at[0] + DIR[d][0], ny = at[1] + DIR[d][1];
            if (isWall(nx, ny)) return { at, star, cells, ok: false };
            at = [nx, ny]; cells.push(at); if (same(at, P.star)) star = true;
          }
          return { at, star, cells, ok: true, home: same(at, P.goal) && (!P.star || star) };
        }

        function intro() {
          const goal = T.goal[1];
          if (P.star && !hasStar) Core.say(`Primero coge la estrella y después lleva a ${Mascot.NAME} hasta ${goal}.`);
          else if (P.repeat && !toldRepeat) { toldRepeat = true; Core.say(`Lleva a ${Mascot.NAME} hasta ${goal}. Hay pocos huecos: con el botón amarillo, la última flecha se repite.`); }
          else Core.say(count || g.solved ? `Lleva a ${Mascot.NAME} hasta ${goal}.` : `Lleva a ${Mascot.NAME} hasta ${goal}. Pon las flechas del camino y luego pulsa el botón verde.`);
        }
        root.querySelector('#sp').onclick = intro;

        // Huecos para flechas: los del camino más corto y un par de sobra; con la ficha de repetir, los justos y uno más.
        function resize() {
          const path = route(P.n, P.walls, pos, targets()) || [];
          slots = P.repeat ? runsOf(path).length + 1 : Math.min(path.length + 2, 9);
        }

        function paint() {
          const a = ahead();
          tray.style.setProperty('--slots', slots);
          tray.innerHTML = Array.from({ length: slots }, (_, i) => {
            const t = prog[i];
            return t ? `<span class="rb-slot full" style="--c:${COLOR[t.d]}">${arrow(t.d)}${t.n > 1 ? `<b>${t.n}</b>` : ''}</span>` : '<span class="rb-slot"></span>';
          }).join('');
          // Rastro de lo programado (en los dos primeros niveles, y después como ayuda) y pistas
          [...board.children].forEach(c => c.classList.remove('trail', 'way'));
          if (P.level <= 2 || fails >= 2) a.cells.forEach(c => !same(c, P.goal) && !same(c, P.star) && cellAt(c).classList.add('trail'));
          // Lo que falta, contando como giro cambiar respecto a la última flecha puesta: así la ayuda sigue recto mientras puede
          const rest = a.ok && !a.home ? route(P.n, P.walls, a.at, targets(a.star), prog.length ? prog[prog.length - 1].d : null) : null;
          if (fails >= 3 && rest) { let at = a.at; rest.slice(0, 3).forEach(d => { at = [at[0] + DIR[d][0], at[1] + DIR[d][1]]; cellAt(at).classList.add('way'); }); }
          const hint = guided && !busy && !done, last = prog[prog.length - 1];
          // Con la ficha de repetir, si el paso que toca es igual que la última flecha, lo que se marca es el botón de repetir
          const again = hint && P.repeat && !!rest && !!last && last.d === rest[0] && last.n < MAX_REPEAT;
          KEYS.forEach(k => keyEl[k].classList.toggle('next', hint && !again && !!rest && rest[0] === k && prog.length < slots));
          repBtn.classList.toggle('next', again);
          goBtn.classList.toggle('next', hint && (a.home || prog.length >= slots));   // sin ayuda no se chiva de que el camino ya está bien
          repBtn.style.visibility = P.repeat ? 'visible' : 'hidden';
        }

        function newPuzzle() {
          P = gen(g.level); pos = [...P.start]; hasStar = false; prog = []; busy = false; done = false; fails = 0; clean = true;
          guided = (g.solved || 0) < 2;      // las dos primeras veces se va marcando lo que toca
          board.style.setProperty('--n', P.n); board.style.setProperty('--f1', T.floor[0]); board.style.setProperty('--f2', T.floor[1]); board.style.setProperty('--edge', T.edge);
          const walls = Core.shuffle(T.walls);
          board.innerHTML = Array.from({ length: P.n * P.n }, (_, i) => {
            const x = i % P.n, y = Math.floor(i / P.n), w = P.walls.findIndex(q => q[0] === x && q[1] === y);
            const what = w >= 0 ? `<span class="rb-wall">${Core.pic(walls[w % walls.length])}</span>` : same([x, y], P.goal) ? `<span class="rb-home">${Core.pic(T.goal[0])}</span>` : same([x, y], P.star) ? '<span class="rb-star">⭐</span>' : '';
            return `<div class="rb-cell${(x + y) % 2 ? ' alt' : ''}">${what}</div>`;
          }).join('') + `<div class="rb-bip"><span>${Mascot.svg()}</span></div>`;
          bip = board.querySelector('.rb-bip'); place();
          goalEl.innerHTML = `<span class="rb-mini">${Mascot.svg()}</span><span class="rb-to">➜</span>${P.star ? '<span>⭐</span><span class="rb-to">➜</span>' : ''}<span>${Core.pic(T.goal[0])}</span>`;
          resize(); paint(); intro();
        }

        function add(d) {
          if (busy || done) return;
          if (prog.length >= slots) { Core.say('Ya no caben más flechas. Pulsa el botón verde.'); goBtn.classList.add('next'); return; }
          prog.push({ d, n: 1 }); Core.tone(520 + KEYS.indexOf(d) * 70, 0.09, 'triangle', 0.22); Core.say(DIR[d][2]); paint();
        }
        function del() {
          if (busy || done || !prog.length) return;
          const last = prog[prog.length - 1]; if (last.n > 1) last.n--; else prog.pop();
          Core.tone(300, 0.08, 'sine', 0.16); paint();
        }
        function rep() {
          if (busy || done || !P.repeat) return;
          const last = prog[prog.length - 1];
          if (!last) { Core.say('Primero pon una flecha.'); return; }
          if (last.n >= MAX_REPEAT) return;
          last.n++; Core.tone(660, 0.1, 'triangle', 0.22); Core.say(`${last.n} veces`); paint();
        }

        function run() {
          if (busy || done) return;
          if (!prog.length) { Core.say('Primero pon las flechas.'); return; }
          busy = true; paint(); board.classList.add('running');
          const steps = prog.flatMap((t, i) => Array(t.n).fill([t.d, i]));
          let i = 0;
          const stop = why => {
            board.classList.remove('running'); busy = false; fails++; clean = false; prog = []; if (fails >= 2) guided = true;
            Mascot.mood(bip, 'wow', 1200);
            Core.say(why === 'crash' ? '¡Uy! Por ahí no se puede pasar. Sigue desde aquí.'
              : why === 'star' ? 'Falta la estrella. Ve a por ella.'
              : fails >= 2 ? 'Te ayudo: toca el botón que brilla.' : '¡Bien! Todavía falta un poco. Sigue desde aquí.');
            resize(); paint();
          };
          const step = () => {
            if (i >= steps.length) return stop(same(pos, P.goal) ? 'star' : 'short');
            const [d, tile] = steps[i];
            [...tray.children].forEach((s, k) => s.classList.toggle('now', k === tile));
            const nx = pos[0] + DIR[d][0], ny = pos[1] + DIR[d][1];
            if (isWall(nx, ny)) {
              bip.style.setProperty('--bx', DIR[d][0]); bip.style.setProperty('--by', DIR[d][1]);
              bip.classList.remove('bonk'); void bip.offsetWidth; bip.classList.add('bonk'); Core.tone(196, 0.2, 'sine', 0.14);
              return later(() => stop('crash'), 650);
            }
            pos = [nx, ny]; place(); Core.tone(440 + i * 40, 0.1, 'triangle', 0.2); i++;
            later(() => {
              if (same(pos, P.star) && !hasStar) { hasStar = true; cellAt(P.star).classList.add('got'); Core.sfx.ding(); }
              if (same(pos, P.goal) && (!P.star || hasStar)) return win();
              step();
            }, 430);
          };
          step();
        }

        function win() {
          done = true; busy = false; board.classList.remove('running'); prog = []; paint();
          countEl[count].classList.add('on'); count++; g.solved = (g.solved || 0) + 1;
          // Nivel: dos seguidos a la primera lo suben; dos seguidos con tropiezos lo bajan
          if (clean) { Core.addStar(); g.streak++; g.misses = 0; if (g.streak >= 2 && g.level < LEVELS.length) { g.level++; g.streak = 0; } }
          else { g.streak = 0; g.misses++; if (g.misses >= 2 && g.level > 1) { g.level--; g.misses = 0; } }
          Core.save(); Core.sfx.ding(); Core.celebrate(); Mascot.mood(bip, 'joy'); cellAt(P.goal).classList.add('got');
          Core.say(Core.praise() + (clean ? ' ¡A la primera!' : ''));
          const [x, y] = fxo.at(cellAt(P.goal));
          fxo.burst(x, y, { n: 20, shape: 'star', colors: ['#FFD23F', '#FFFFFF', '#FF5FA2', '#35D6E6'], speed: 300, gravity: 380, size: 10, life: 0.8 });
          later(() => (count >= PER ? finish() : newPuzzle()), 1700);
        }

        function finish() {
          g.played++; Core.save(); clear();
          Core.endScreen(root, `<div>🤖🏁</div><span>¡Misión cumplida!</span>`, `¡Misión cumplida! ${Mascot.NAME} ha llegado gracias a ti.`, play, exit);
        }

        const press = (el, fn) => el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); });
        KEYS.forEach(k => press(keyEl[k], () => add(k)));
        press(delBtn, del); press(repBtn, rep); press(goBtn, run);
        // Para las pruebas: la solución desde donde está Bip y el estado
        board._rb = {
          gen, state: () => ({ level: P.level, pos: [...pos], prog: prog.map(t => ({ ...t })), slots, hasStar, busy, done, fails, count, puzzle: P }),
          solution: () => { const p = route(P.n, P.walls, pos, targets()) || []; return P.repeat ? runsOf(p) : p.map(d => ({ d, n: 1 })); }
        };
        newPuzzle();
      }

      play();
      return () => { alive = false; clear(); };
    }
  });
}
