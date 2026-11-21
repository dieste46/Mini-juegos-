/* Laberinto: llevar al personaje hasta su meta arrastrando el dedo por los pasillos.
   - El personaje sigue al dedo pero no atraviesa paredes: se queda pegado y sigue cuando el dedo vuelve al camino.
   - Deja rastro, para ver por dónde ya ha pasado.
   - Si se atasca un rato, brillan unas pocas baldosas del camino bueno (pista, no solución entera).
   Los laberintos se generan solos y crecen con el nivel (de 3 a 8 casillas de ancho). Tres por partida. */
{
  const { TAU, circle } = Scene;
  const N = 1, E = 2, S = 4, W = 8;
  const DIRS = [[0, -1, N, S], [1, 0, E, W], [0, 1, S, N], [-1, 0, W, E]];

  // Laberinto perfecto (un solo camino entre dos casillas) por búsqueda en profundidad. 1 = hay pared.
  function make(cols, rows) {
    const w = Array.from({ length: rows }, () => Array(cols).fill(15)), seen = Array.from({ length: rows }, () => Array(cols).fill(false));
    const stack = [[Core.rand(0, cols - 1), Core.rand(0, rows - 1)]]; seen[stack[0][1]][stack[0][0]] = true;
    while (stack.length) {
      const [x, y] = stack[stack.length - 1];
      const opts = DIRS.filter(([dx, dy]) => { const nx = x + dx, ny = y + dy; return nx >= 0 && ny >= 0 && nx < cols && ny < rows && !seen[ny][nx]; });
      if (!opts.length) { stack.pop(); continue; }
      const [dx, dy, a, b] = Core.pick(opts);
      w[y][x] &= ~a; w[y + dy][x + dx] &= ~b; seen[y + dy][x + dx] = true; stack.push([x + dx, y + dy]);
    }
    return w;
  }
  const exits = (w, x, y) => DIRS.filter(d => !(w[y][x] & d[2])).map(([dx, dy]) => [x + dx, y + dy]);
  // Distancia en pasos desde una casilla a todas las demás
  function flood(w, sx, sy) {
    const d = w.map(r => r.map(() => -1)), q = [[sx, sy]]; d[sy][sx] = 0;
    for (let i = 0; i < q.length; i++) { const [x, y] = q[i]; for (const [nx, ny] of exits(w, x, y)) if (d[ny][nx] < 0) { d[ny][nx] = d[y][x] + 1; q.push([nx, ny]); } }
    return d;
  }

  const SIZES = [3, 4, 5, 6, 7, 8];
  const imgs = {};
  const imageOf = ch => { const src = Core.picSrc(ch); if (!src) return null; if (!imgs[ch]) { imgs[ch] = new Image(); imgs[ch].src = src; } return imgs[ch]; };
  function glyph(ctx, ch, x, y, size) {
    const im = imageOf(ch);
    if (im && im.complete && im.naturalWidth) ctx.drawImage(im, x - size / 2, y - size / 2, size, size);
    else { ctx.font = `${size * 0.82}px ${Fx.EMO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000'; ctx.fillText(ch, x, y + size * 0.05); }
  }

  Games.push({
    id: 'laberinto', section: 'recreo',
    name: 'Laberinto', emoji: t => t.sets.laberinto.pairs[0][0], color: '#5BE38C',
    learns: 'Planificar un camino, orientación espacial y trazo con el dedo (preescritura).',
    how: ['Arrastra el dedo por los pasillos para llevar al personaje hasta su meta.', 'No atraviesa las paredes. Si se queda parado, vuelve con el dedo al camino.', 'Si te atascas, se iluminan unas baldosas del camino.'],
    badge: s => s.solved ? `🏁 ${s.solved}` : '',
    start(root, exit) {
      const T = Themes.set('laberinto'), g = Core.gameState('laberinto'), PER = 3;
      let raf = 0, alive = true, ro = null, timers = [], lastPair = null, toldHint = false;
      const later = (fn, ms) => timers.push(setTimeout(() => alive && fn(), ms));

      function play() {
        cancelAnimationFrame(raf); if (ro) ro.disconnect(); timers.forEach(clearTimeout); timers = [];
        root.innerHTML = `<div class="hud"><span>🏁 <b id="n">0</b> / ${PER}</span><div class="goalbar"><div id="bar"></div></div><button class="speak-btn" id="sp">🔊</button></div>
          <div class="play" id="maze" style="touch-action:none"><canvas style="position:absolute;inset:0;width:100%;height:100%;display:block"></canvas></div>`;
        const host = root.querySelector('#maze'), cv = host.querySelector('canvas'), ctx = cv.getContext('2d');
        const nEl = root.querySelector('#n'), bar = root.querySelector('#bar'), fx = Fx.system();
        let Wd = 1, Hd = 1, cell = 40, ox = 0, oy = 0, cols = 3, rows = 3;
        let w = null, toGoal = null, pair = null, goal = [0, 0], at = [0, 0], draw = { x: 0, y: 0 }, path = [], seen = null;
        let t = 0, lastGain = 0, best = 0, hints = [], hintUntil = 0, usedHint = false, solved = false, count = 0, pop = 0;

        function layout() {
          const d = Math.min(2, window.devicePixelRatio || 1);
          Wd = Math.max(1, host.clientWidth); Hd = Math.max(1, host.clientHeight);
          cv.width = Math.round(Wd * d); cv.height = Math.round(Hd * d); ctx.setTransform(d, 0, 0, d, 0, 0);
          cell = Math.floor(Math.min((Wd - 28) / cols, (Hd - 28) / rows)); ox = (Wd - cell * cols) / 2; oy = (Hd - cell * rows) / 2;
        }
        const cx = x => ox + (x + 0.5) * cell, cy = y => oy + (y + 0.5) * cell;
        const say = () => pair && Core.say(`Lleva ${pair[2]} hasta ${pair[3]}. Arrastra el dedo por el camino.`);
        root.querySelector('#sp').onclick = say;

        function newMaze() {
          cols = SIZES[g.level - 1] || 3;
          const d0 = Math.max(1, host.clientWidth), h0 = Math.max(1, host.clientHeight);
          rows = Math.max(cols, Math.min(cols + (cols <= 4 ? 1 : cols <= 5 ? 2 : 3), Math.round(cols * h0 / d0)));   // en vertical, alguna fila más que columnas
          layout();
          w = make(cols, rows);
          const start = Core.pick([[0, 0], [cols - 1, 0], [0, rows - 1], [cols - 1, rows - 1]]), far = flood(w, start[0], start[1]);
          let mx = 0; for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (far[y][x] > mx) { mx = far[y][x]; goal = [x, y]; }
          toGoal = flood(w, goal[0], goal[1]);
          at = start.slice(); draw = { x: cx(at[0]), y: cy(at[1]) }; path = [];
          seen = w.map(r => r.map(() => false)); seen[at[1]][at[0]] = true;
          do { pair = Core.pick(T.pairs); } while (T.pairs.length > 1 && pair === lastPair); lastPair = pair;
          best = toGoal[at[1]][at[0]]; lastGain = t; hints = []; usedHint = false; solved = false;
          host._lab = { route: () => { const r = []; let [x, y] = at; while (toGoal[y][x] > 0) { [x, y] = exits(w, x, y).find(([a, b]) => toGoal[b][a] === toGoal[y][x] - 1); r.push([cx(x), cy(y)]); } return r; } };   // para las pruebas automáticas
          say();
        }

        // El personaje avanza hacia el dedo casilla a casilla, solo por donde no hay pared
        function chase(px, py) {
          if (solved) return;
          for (let k = 0; k < 14; k++) {
            let pick = null, bd = Math.hypot(cx(at[0]) - px, cy(at[1]) - py) - cell * 0.3;
            for (const [nx, ny] of exits(w, at[0], at[1])) { const d = Math.hypot(cx(nx) - px, cy(ny) - py); if (d < bd) { bd = d; pick = [nx, ny]; } }
            if (!pick) break;
            at = pick; path.push(pick); seen[pick[1]][pick[0]] = true;
            const left = toGoal[pick[1]][pick[0]];
            if (left < best) { best = left; lastGain = t; hints = []; }
            if (!left) { solved = true; break; }
          }
        }
        const point = e => { e.preventDefault(); const r = host.getBoundingClientRect(); chase(e.clientX - r.left, e.clientY - r.top); };
        host.addEventListener('pointerdown', point);
        host.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && !e.buttons) return; point(e); });

        function arrive() {   // ha llegado a la meta
          count++; nEl.textContent = count; bar.style.width = (100 * count / PER) + '%'; g.solved = (g.solved || 0) + 1; pop = 1;
          // Nivel: dos seguidos sin pista lo suben; dos seguidos con pista lo bajan
          if (!usedHint) { Core.addStar(); g.streak++; g.misses = 0; if (g.streak >= 2 && g.level < SIZES.length) { g.level++; g.streak = 0; } }
          else { g.streak = 0; g.misses++; if (g.misses >= 2 && g.level > 1) { g.level--; g.misses = 0; } }
          Core.save(); Core.sfx.ding(); Core.celebrate(); Core.say(Core.praise());
          const gx = cx(goal[0]), gy = cy(goal[1]);
          fx.ring(gx, gy, '#FFFFFF', cell * 0.2, cell * 3, 0.4);
          fx.burst(gx, gy, { n: 22, shape: 'star', colors: ['#FFD23F', '#FFFFFF', '#FF5FA2', '#35D6E6'], speed: 320, gravity: 380, size: 10, life: 0.8 });
          later(() => (count >= PER ? finish() : newMaze()), 1500);
        }

        function update(dt) {
          t += dt; pop = Math.max(0, pop - dt * 2);
          // Animación: el dibujo recorre las casillas pendientes
          let move = cell * 13 * dt;
          while (path.length && move > 0) {
            const tx = cx(path[0][0]), ty = cy(path[0][1]), d = Math.hypot(tx - draw.x, ty - draw.y);
            if (d <= move) { draw.x = tx; draw.y = ty; move -= d; path.shift(); if (!Fx.calm()) fx.burst(tx, ty, { n: 2, colors: [T.spark, '#FFFFFF'], speed: 60, gravity: 0, size: 5, life: 0.4 }); }
            else { draw.x += (tx - draw.x) / d * move; draw.y += (ty - draw.y) / d * move; move = 0; }
          }
          if (solved && !path.length && pop === 0 && solved !== 'done') { solved = 'done'; arrive(); }
          // Pista: si lleva un rato sin acercarse, se iluminan los tres pasos siguientes
          if (!solved && t - lastGain > 9) {
            let [x, y] = at; hints = [];
            for (let k = 0; k < 3 && toGoal[y][x] > 0; k++) { [x, y] = exits(w, x, y).find(([a, b]) => toGoal[b][a] === toGoal[y][x] - 1); hints.push([x, y]); }
            hintUntil = t + 5; lastGain = t; usedHint = true;
            if (!toldHint) { toldHint = true; Core.say('Mira, prueba por las baldosas que brillan.'); }
          }
          if (t > hintUntil) hints = [];
          fx.update(dt);
        }

        function paint() {
          ctx.clearRect(0, 0, Wd, Hd);
          const bw = cell * cols, bh = cell * rows, r = cell * 0.22;
          // Suelo en damero suave
          ctx.save(); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(ox - 6, oy - 6, bw + 12, bh + 12, r) : ctx.rect(ox - 6, oy - 6, bw + 12, bh + 12); ctx.clip();
          for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
            ctx.fillStyle = T.floor[(x + y) % 2]; ctx.fillRect(ox + x * cell - (x ? 0 : 6), oy + y * cell - (y ? 0 : 6), cell + 6, cell + 6);
            if (seen[y][x]) { ctx.fillStyle = T.trail; circle(ctx, cx(x), cy(y), cell * 0.17); }   // rastro
          }
          ctx.restore();
          hints.forEach(([x, y], k) => { ctx.fillStyle = `rgba(255,210,63,${0.55 + 0.35 * Math.sin(t * 7 - k)})`; circle(ctx, cx(x), cy(y), cell * (0.26 + 0.04 * Math.sin(t * 7 - k))); });
          // Paredes: dos pasadas (base oscura y brillo por encima) para que tengan volumen
          ctx.lineCap = 'round';
          for (const [color, lw, dy] of [[T.wall, cell * 0.16, 0], [T.wallTop, cell * 0.07, -cell * 0.03]]) {
            ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, lw); ctx.beginPath();
            for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
              const x0 = ox + x * cell, y0 = oy + y * cell + dy;
              if (w[y][x] & N) { ctx.moveTo(x0, y0); ctx.lineTo(x0 + cell, y0); }
              if (w[y][x] & W) { ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + cell); }
              if (y === rows - 1) { ctx.moveTo(x0, y0 + cell); ctx.lineTo(x0 + cell, y0 + cell); }
              if (x === cols - 1) { ctx.moveTo(x0 + cell, y0); ctx.lineTo(x0 + cell, y0 + cell); }
            }
            ctx.stroke();
          }
          // Meta con un aro que late, y el personaje
          const gx = cx(goal[0]), gy = cy(goal[1]), beat = 0.5 + 0.5 * Math.sin(t * 4);
          ctx.fillStyle = `rgba(255,255,255,${0.25 + 0.2 * beat})`; circle(ctx, gx, gy, cell * (0.36 + 0.05 * beat));
          glyph(ctx, pair[1], gx, gy, cell * 0.62);
          ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(draw.x, draw.y + cell * 0.3, cell * 0.24, cell * 0.07, 0, 0, TAU); ctx.fill();
          glyph(ctx, pair[0], draw.x, draw.y - Math.abs(Math.sin(t * (path.length ? 14 : 3))) * cell * (path.length ? 0.07 : 0.03), cell * (0.72 + pop * 0.25));
          fx.draw(ctx);
        }

        newMaze();
        if (window.ResizeObserver) { ro = new ResizeObserver(() => { const a = [cx(at[0]), cy(at[1])]; layout(); if (!path.length) { draw.x = cx(at[0]); draw.y = cy(at[1]); } }); ro.observe(host); }
        let last = performance.now();
        function loop(now) {
          if (!alive || !cv.isConnected) return;
          const dt = Math.min(0.05, (now - last) / 1000); last = now;
          update(dt); if (cv.isConnected) paint();
          raf = requestAnimationFrame(loop);
        }
        raf = requestAnimationFrame(loop);

        function finish() {
          cancelAnimationFrame(raf); if (ro) ro.disconnect();
          g.played++; Core.save();
          Core.endScreen(root, `<div>${Core.pic(pair[0])}🏁🏆</div><span>¡Has salido de todos!</span><small>Llevas ${g.solved} laberintos</small>`, '¡Has resuelto todos los laberintos! ¡Qué bien te orientas!', play, exit);
        }
      }
      play();
      return () => { alive = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); timers.forEach(clearTimeout); };
    }
  });
}
