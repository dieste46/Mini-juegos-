/* Súper Rescate: el héroe del tema (helicóptero en la granja, astronauta en el espacio) vuela siguiendo el dedo
   y recoge en su cesta a los que se han escapado. Lo que hay que esquivar solo le hace dar vueltas: no se pierde nada.
   Todo se pinta en un canvas 2D: escenario por capas que se mueven a distinta velocidad, personajes y partículas (Fx).
   Las reglas son las de siempre; lo que cada tema cambia son sus datos en Themes (sets.rescate). */
{
  const TAU = Math.PI * 2;
  const rnd = (k, s = 0) => { const x = Math.sin(k * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };   // azar repetible
  const mod = (a, n) => ((a % n) + n) % n;
  const circle = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, TAU); ctx.fill(); };
  const hillY = (wx, base, a1, l1, a2, l2) => base - a1 * Math.sin(wx / l1) - a2 * Math.sin(wx / l2 + 1.7);
  function ridge(ctx, W, H, off, fill, f) {
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W + 16; x += 16) ctx.lineTo(x, f(x + off));
    ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  }
  // Coloca adornos repetidos a lo largo de una capa: llama a draw(k, x en pantalla, x en el mundo)
  function along(W, off, gap, draw) {
    for (let k = Math.floor(off / gap) - 1; k <= Math.floor((off + W) / gap) + 1; k++) { const wx = k * gap + rnd(k, 7) * gap * 0.6; draw(k, wx - off, wx); }
  }
  function cloud(ctx, x, y, s, color) {   // color sólido (no transparente) para que no se noten las uniones
    ctx.fillStyle = color; ctx.beginPath();
    ctx.arc(x - s * 0.5, y, s * 0.34, 0, TAU); ctx.arc(x - s * 0.08, y - s * 0.2, s * 0.46, 0, TAU); ctx.arc(x + s * 0.46, y - s * 0.02, s * 0.36, 0, TAU);
    ctx.arc(x + s * 0.12, y + s * 0.1, s * 0.3, 0, TAU); ctx.arc(x - s * 0.3, y + s * 0.12, s * 0.26, 0, TAU); ctx.fill();
  }
  function tree(ctx, x, y, s) {
    ctx.fillStyle = '#8A5A2B'; ctx.fillRect(x - s * 0.08, y - s * 0.5, s * 0.16, s * 0.55);
    ctx.fillStyle = '#2FA44E'; circle(ctx, x, y - s * 0.78, s * 0.42);
    ctx.fillStyle = '#4CC96B'; circle(ctx, x - s * 0.12, y - s * 0.9, s * 0.22);
  }
  function house(ctx, x, y, s, barn) {
    const w = s * 1.1, h = s * 0.7;
    ctx.fillStyle = barn ? '#D9383F' : '#FFF3D6'; ctx.fillRect(x - w / 2, y - h, w, h + 4);
    ctx.fillStyle = barn ? '#A9262C' : '#E5484D';
    ctx.beginPath(); ctx.moveTo(x - w * 0.62, y - h); ctx.lineTo(x, y - h - s * 0.5); ctx.lineTo(x + w * 0.62, y - h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = barn ? '#FFF3D6' : '#8A5A2B'; ctx.fillRect(x - s * 0.14, y - h * 0.62, s * 0.28, h * 0.62 + 4);
    if (!barn) { ctx.fillStyle = '#7CC6FF'; ctx.fillRect(x + w * 0.2, y - h * 0.7, s * 0.2, s * 0.2); }
  }

  // ---------- Escenarios: paint(ctx, W, H, avance en px, tiempo) ----------
  const SCENES = {
    campo(ctx, W, H, sc, t) {
      const u = Math.max(0.8, Math.min(1.5, H / 620));
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#4FB3FF'); g.addColorStop(0.62, '#BFE8FF'); g.addColorStop(1, '#E9F9D8');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // Sol con rayos que giran despacio
      const sx = W * 0.84, sy = H * 0.13, sr = 30 * u;
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(t * 0.12); ctx.fillStyle = 'rgba(255,233,138,.75)';
      for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); ctx.beginPath(); ctx.moveTo(-sr * 0.16, -sr * 1.15); ctx.lineTo(0, -sr * 1.7); ctx.lineTo(sr * 0.16, -sr * 1.15); ctx.fill(); }
      ctx.restore();
      ctx.fillStyle = '#FFD23F'; circle(ctx, sx, sy, sr); ctx.fillStyle = '#FFE98A'; circle(ctx, sx - sr * 0.25, sy - sr * 0.25, sr * 0.45);
      // Nubes: las de lejos, más pequeñas, claras y lentas
      const P = W + 320;
      for (let k = 0; k < 7; k++) {
        const far = k < 4, s = (far ? 38 : 54) * u * (0.8 + rnd(k, 2) * 0.5);
        cloud(ctx, mod(rnd(k, 1) * P - sc * (far ? 0.05 : 0.12) - t * (far ? 4 : 9), P) - 160, H * (0.07 + rnd(k, 3) * (far ? 0.3 : 0.42)), s, far ? '#D6F0FF' : '#FFFFFF');
      }
      // Colinas lejanas (aclaradas por la distancia)
      const f1 = wx => hillY(wx, H * 0.72, H * 0.07, 190, H * 0.03, 83);
      ridge(ctx, W, H, sc * 0.18, '#A6E6B2', f1);
      // Colinas medias, con árboles, casas y graneros
      const o2 = sc * 0.42, f2 = wx => hillY(wx, H * 0.82, H * 0.055, 150, H * 0.022, 61);
      ridge(ctx, W, H, o2, '#5FD47C', f2);
      along(W, o2, 190 * u, (k, x, wx) => {
        const r = rnd(k, 3), y = f2(wx) + 3, s = (34 + rnd(k, 4) * 22) * u;
        if (r < 0.42) tree(ctx, x, y, s); else if (r < 0.56) house(ctx, x, y, s * 1.1, false); else if (r < 0.68) house(ctx, x, y, s * 1.2, true);
        else if (r < 0.86) { tree(ctx, x - s * 0.4, y, s * 0.8); tree(ctx, x + s * 0.35, y + 2, s); }
      });
      // Primer plano: prado con valla y flores, lo que más corre
      const f3 = wx => hillY(wx, H * 0.935, H * 0.022, 120, H * 0.01, 47);
      ridge(ctx, W, H, sc, '#36B257', f3);
      along(W, sc, 46 * u, (k, x, wx) => {
        const y = f3(wx);
        if (rnd(Math.floor(k / 9), 5) < 0.5) {   // tramos de valla
          ctx.fillStyle = '#F3E2B8'; ctx.fillRect(x - 3 * u, y - 26 * u, 6 * u, 30 * u); ctx.fillRect(x - 3 * u, y - 20 * u, 50 * u, 4 * u); ctx.fillRect(x - 3 * u, y - 11 * u, 50 * u, 4 * u);
        } else if (rnd(k, 6) < 0.7) {
          ctx.fillStyle = '#2FA44E'; ctx.fillRect(x - 1.5 * u, y - 13 * u, 3 * u, 14 * u);
          ctx.fillStyle = ['#FF5FA2', '#FFD23F', '#FFFFFF', '#FF8A3D'][Math.floor(rnd(k, 8) * 4)]; circle(ctx, x, y - 15 * u, 5.5 * u);
          ctx.fillStyle = '#FFE98A'; circle(ctx, x, y - 15 * u, 2.2 * u);
        }
      });
      SCENES.streaks(ctx, W, H, sc, 'rgba(255,255,255,.45)');
    },

    espacio(ctx, W, H, sc, t) {
      const u = Math.max(0.8, Math.min(1.5, H / 620));
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0F1038'); g.addColorStop(0.6, '#2A2370'); g.addColorStop(1, '#4B3A96');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // Tres capas de estrellas
      [[0.04, 30, 1.1], [0.1, 20, 1.8], [0.2, 12, 2.6]].forEach(([par, n, r], L) => {
        const P = W + 40;
        for (let k = 0; k < n; k++) {
          ctx.globalAlpha = 0.55 + 0.45 * Math.sin(t * 2 + k * 1.7 + L);
          ctx.fillStyle = k % 5 ? '#FFFFFF' : '#FFE98A'; circle(ctx, mod(rnd(k, L + 1) * P - sc * par, P) - 20, rnd(k, L + 9) * H * 0.86, r * u);
        }
      });
      ctx.globalAlpha = 1;
      // Planeta con anillo y la Tierra, muy lejos
      const px = mod(W * 0.75 - sc * 0.03, W + 300) - 150, py = H * 0.2, pr = 34 * u;
      ctx.strokeStyle = '#FFD8A8'; ctx.lineWidth = 5 * u; ctx.beginPath(); ctx.ellipse(px, py, pr * 1.7, pr * 0.45, -0.35, Math.PI * 0.05, Math.PI * 0.95); ctx.stroke();
      ctx.fillStyle = '#FF9A62'; circle(ctx, px, py, pr); ctx.fillStyle = '#FFB98C'; circle(ctx, px - pr * 0.3, py - pr * 0.3, pr * 0.45);
      ctx.beginPath(); ctx.ellipse(px, py, pr * 1.7, pr * 0.45, -0.35, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      const ex = mod(W * 0.22 - sc * 0.05, W + 300) - 150, ey = H * 0.46, er = 20 * u;
      ctx.fillStyle = '#35A7FF'; circle(ctx, ex, ey, er); ctx.fillStyle = '#5BE38C'; circle(ctx, ex - er * 0.3, ey - er * 0.2, er * 0.42); circle(ctx, ex + er * 0.35, ey + er * 0.3, er * 0.3);
      // Montañas de la luna y suelo con cráteres
      const f2 = wx => hillY(wx, H * 0.84, H * 0.05, 140, H * 0.03, 53);
      ridge(ctx, W, H, sc * 0.4, '#5A4FB0', f2);
      const f3 = wx => hillY(wx, H * 0.93, H * 0.018, 130, H * 0.008, 41);
      ridge(ctx, W, H, sc, '#B9B3E6', f3);
      along(W, sc, 120 * u, (k, x, wx) => { ctx.fillStyle = '#9D95D8'; ctx.beginPath(); ctx.ellipse(x, f3(wx) + 16 * u, (14 + rnd(k, 2) * 16) * u, (4 + rnd(k, 2) * 4) * u, 0, 0, TAU); ctx.fill(); });
      SCENES.streaks(ctx, W, H, sc, 'rgba(255,255,255,.22)');
    },

    // Rayitas de viento: dan sensación de velocidad
    streaks(ctx, W, H, sc, color) {
      if (Fx.calm()) return;
      ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = 'round';
      const P = W + 240;
      for (let k = 0; k < 6; k++) {
        const x = mod(rnd(k, 11) * P - sc * 1.7, P) - 120, y = H * (0.1 + rnd(k, 12) * 0.62), l = 36 + rnd(k, 13) * 60;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + l, y); ctx.stroke();
      }
    }
  };

  // ---------- Lo que se esquiva ----------
  const HAZARDS = {
    tormenta(ctx, x, y, s, t) {
      ctx.save(); ctx.translate(x, y);
      if (Math.sin(t * 9 + x * 0.02) > 0.1) {   // rayo que parpadea
        ctx.fillStyle = '#FFD23F'; ctx.beginPath();
        [[-0.04, 0.2], [0.14, 0.2], [0.03, 0.46], [0.17, 0.46], [-0.12, 0.92], [-0.02, 0.56], [-0.16, 0.56]].forEach(([a, b]) => ctx.lineTo(a * s, b * s));
        ctx.closePath(); ctx.fill();
      }
      ctx.strokeStyle = '#7CC6FF'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) { const d = mod(t * 1.6 + i * 0.37, 1), rx = (-0.36 + i * 0.33) * s; ctx.globalAlpha = 1 - d; ctx.beginPath(); ctx.moveTo(rx, (0.3 + d * 0.4) * s); ctx.lineTo(rx - 3, (0.4 + d * 0.4) * s); ctx.stroke(); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#56627F'; circle(ctx, -s * 0.34, s * 0.04, s * 0.24); circle(ctx, 0, -s * 0.1, s * 0.33); circle(ctx, s * 0.34, s * 0.04, s * 0.26); ctx.fillRect(-s * 0.34, 0, s * 0.68, s * 0.28);
      ctx.fillStyle = '#6F7DA0'; circle(ctx, -s * 0.1, -s * 0.2, s * 0.17);
      // Cara de nube gruñona (se entiende que a esa no)
      ctx.fillStyle = '#FFFFFF'; circle(ctx, -s * 0.13, s * 0.02, s * 0.075); circle(ctx, s * 0.13, s * 0.02, s * 0.075);
      ctx.fillStyle = '#1B1846'; circle(ctx, -s * 0.12, s * 0.03, s * 0.036); circle(ctx, s * 0.12, s * 0.03, s * 0.036);
      ctx.strokeStyle = '#1B1846'; ctx.lineWidth = Math.max(2, s * 0.035);
      ctx.beginPath(); ctx.moveTo(-s * 0.22, -s * 0.1); ctx.lineTo(-s * 0.06, -s * 0.05); ctx.moveTo(s * 0.22, -s * 0.1); ctx.lineTo(s * 0.06, -s * 0.05); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, s * 0.2, s * 0.07, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      ctx.restore();
    },
    meteorito(ctx, x, y, s, t) {
      ctx.save(); ctx.translate(x, y);
      const l = s * (1.15 + 0.15 * Math.sin(t * 22)), g = ctx.createLinearGradient(0, 0, l, 0);   // la cola queda detrás (viene de la derecha)
      g.addColorStop(0, 'rgba(255,210,63,.95)'); g.addColorStop(0.45, 'rgba(255,138,61,.7)'); g.addColorStop(1, 'rgba(255,95,162,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -s * 0.34); ctx.quadraticCurveTo(l * 0.6, -s * 0.2, l, 0); ctx.quadraticCurveTo(l * 0.6, s * 0.2, 0, s * 0.34); ctx.closePath(); ctx.fill();
      ctx.rotate(t * 2.5);
      ctx.fillStyle = '#8A6F63'; circle(ctx, 0, 0, s * 0.32); ctx.fillStyle = '#A88B7D'; circle(ctx, -s * 0.1, -s * 0.1, s * 0.14);
      ctx.fillStyle = '#6A534A'; circle(ctx, s * 0.1, s * 0.06, s * 0.08); circle(ctx, -s * 0.08, s * 0.15, s * 0.05); circle(ctx, s * 0.02, -s * 0.18, s * 0.045);
      ctx.restore();
    }
  };

  Games.push({
    id: 'super', section: 'recreo',
    name: 'Súper Rescate', art: t => (t.id === 'granja' ? 'rescate' : null), emoji: t => t.sets.rescate.hero, color: '#d7263d',
    learns: 'Seguimiento con el dedo, anticipación y control del movimiento.',
    badge: s => s.total ? `🏅 ${s.total}` : '',
    start(root, exit) {
      const GOAL = 10, T = Themes.set('rescate');
      const scene = SCENES[T.scene] || SCENES.campo, hazard = HAZARDS[T.hazardKind] || HAZARDS.tormenta;
      const load = src => { if (!src) return null; const i = new Image(); i.src = src; return i; };
      const ok = i => !!i && i.complete && i.naturalWidth > 0;
      const IMG = {
        body: load(T.heroArt && `img/icons/${T.heroArt}-cuerpo.webp`), rotor: load(T.heroArt && `img/icons/${T.heroArt}-rotor.webp`),
        hero: load(Core.picSrc(T.hero)), rescued: load(Core.picSrc(T.rescued)), carrier: load(Core.picSrc(T.carrier))
      };
      // Dibuja el icono ilustrado si existe y, si no, el emoji
      const glyph = (ctx, ch, x, y, size, im) => {
        if (ok(im)) ctx.drawImage(im, x - size / 2, y - size / 2, size, size);
        else { ctx.font = `${size * 0.86}px ${Fx.EMO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000'; ctx.fillText(ch, x, y + size * 0.05); }
      };
      let raf = 0, alive = true, ro = null;

      function play() {
        cancelAnimationFrame(raf); if (ro) ro.disconnect();
        root.innerHTML = `<div class="hud"><span>${Core.pic(T.rescued)} <b id="n">0</b> / ${GOAL}</span><div class="goalbar"><div id="bar"></div></div><button class="speak-btn" id="sp">🔊</button></div>
          <div class="play sky" id="sky" style="touch-action:none"><canvas style="position:absolute;inset:0;width:100%;height:100%;display:block"></canvas></div>`;
        const sky = root.querySelector('#sky'), cv = sky.querySelector('canvas'), ctx = cv.getContext('2d');
        const n = root.querySelector('#n'), bar = root.querySelector('#bar'), fx = Fx.system();
        const intro = () => Core.say(`¡${T.heroName} al rescate! Mueve el dedo para volar y rescata a los diez ${T.plural}. ¡Cuidado con ${T.hazardName}!`);
        root.querySelector('#sp').onclick = intro; intro();

        let W = 1, H = 1, S = 100;
        function fit() {
          const d = Math.min(2, window.devicePixelRatio || 1);
          W = Math.max(1, sky.clientWidth); H = Math.max(1, sky.clientHeight);
          cv.width = Math.round(W * d); cv.height = Math.round(H * d); ctx.setTransform(d, 0, 0, d, 0, 0);
          S = Math.max(88, Math.min(150, Math.min(W, H) * 0.27));   // tamaño del héroe
        }
        fit();
        if (window.ResizeObserver) { ro = new ResizeObserver(fit); ro.observe(sky); }

        let saved = 0, inBasket = 0, speed = 130, items = [], flying = [], spawnIn = 1, spin = 0, scroll = 0, t = 0, ending = 0, away = 0;
        let py = H / 2, target = py, swing = 0, swingV = 0, bounce = 0, flame = 0;
        const px = () => W * 0.3 + away;
        const lim = y => Math.max(S * 0.6, Math.min(H - S * 1.0, y));
        const follow = e => { if (ending) return; e.preventDefault(); target = lim(e.clientY - sky.getBoundingClientRect().top); };
        sky.addEventListener('pointerdown', follow);
        sky.addEventListener('pointermove', follow);

        function spawn() {
          const storm = Math.random() < 0.3;
          items.push({ x: W + S * 0.6, y: Core.rand(Math.round(S * 0.7), Math.max(Math.round(S * 0.7) + 1, Math.round(H - S * 1.1))), storm, wob: Math.random() * 6 });
        }
        // Dónde cuelga la cesta ahora mismo
        function basket() {
          const L = S * 0.5, ax = px(), ay = py + S * 0.34;
          return { ax, ay, x: ax + Math.sin(swing) * L, y: ay + Math.cos(swing) * L + bounce * S * 0.06 };
        }

        function update(dt) {
          t += dt; scroll += speed * dt * (ending ? 1.6 : 1);
          if (ending) { ending += dt; target = lim(H * 0.38); if (ending > 0.55) away += (W * 1.1) * dt * Math.min(1, (ending - 0.55) * 2.2); }
          const before = py;
          py += (target - py) * Math.min(1, dt * 7);
          const vy = (py - before) / Math.max(dt, 0.001);
          spin = Math.max(0, spin - dt); bounce = Math.max(0, bounce - dt * 3.5);
          // La cesta cuelga y se balancea con retraso respecto al helicóptero
          const want = Math.max(-0.5, Math.min(0.5, -vy * 0.0011)) + (spin > 0 ? Math.sin(t * 22) * 0.5 : 0);
          swingV += ((want - swing) * 60 - swingV * 7) * dt; swing += swingV * dt;

          if (!ending) {
            spawnIn -= dt; if (spawnIn <= 0) { spawn(); spawnIn = Math.max(0.8, 1.5 - saved * 0.05); }
          }
          const k = S / 84;
          items = items.filter(it => {
            it.x -= speed * dt; it.yy = it.y + Math.sin(t * 2 + it.wob) * 12;
            if (!ending && Math.abs(it.x - px()) < 48 * k && Math.abs(it.yy - py) < 52 * k) {
              if (it.storm) {
                if (spin <= 0) {   // Choque: vueltas, sacudida y humo. Nada más.
                  spin = 0.8; Core.sfx.bonk(); fx.shake(10, 0.4);
                  fx.burst(it.x, it.yy, { n: 10, shape: 'puff', colors: T.scene === 'espacio' ? ['#8A6F63', '#A88B7D', '#FF8A3D'] : ['#56627F', '#6F7DA0', '#9AA6C4'], speed: 140, gravity: -30, size: 16, grow: 26, life: 0.6 });
                  fx.burst(it.x, it.yy, { n: 9, shape: 'star', colors: ['#FFD23F', '#FFFFFF'], speed: 300, gravity: 300, size: 8, life: 0.5 });
                  return false;
                }
              } else {
                saved++; n.textContent = saved; bar.style.width = (100 * saved / GOAL) + '%';
                Core.sfx.pop(); Core.sfx.ding(); speed += 6;
                // El globo (o la burbuja) explota y el rescatado vuela a la cesta
                const cy = it.yy - S * 0.36;
                fx.ring(it.x, cy, '#FFFFFF', S * 0.12, S * 2.2, 0.35);
                fx.burst(it.x, cy, { n: 14, shape: T.carry === 'burbuja' ? 'dot' : 'shard', colors: T.carry === 'burbuja' ? ['#BFF4FF', '#FFFFFF', '#35D6E6'] : ['#FF4F6D', '#FF8FA3', '#FFD23F'], speed: 260, gravity: 520, size: 8, life: 0.6 });
                flying.push({ x0: it.x, y0: it.yy + S * 0.2, k: 0 });
                if (saved >= GOAL) ending = 0.001;
                return false;
              }
            }
            return it.x > -S;
          });
          flying = flying.filter(f => {
            f.k += dt / 0.42;
            if (f.k >= 1) {
              const b = basket(); inBasket++; bounce = 1; swingV += 1.2;
              fx.burst(b.x, b.y - S * 0.2, { n: 7, shape: 'star', colors: ['#FFD23F', '#FFFFFF', '#FF5FA2'], speed: 170, gravity: 260, size: 7, life: 0.5, spread: Math.PI, angle: -Math.PI / 2 });
              fx.burst(b.x, b.y - S * 0.42, { n: 1, shape: 'text', text: '💛', speed: 70, angle: -Math.PI / 2, spread: 0.3, gravity: -40, size: S * 0.26, life: 0.8, drag: 0.5 });
              return false;
            }
            return true;
          });
          // Chorro del propulsor (solo cuando el héroe no es el helicóptero)
          if (!IMG.body) { flame -= dt; if (flame <= 0) { flame = 0.04; fx.burst(px() - S * 0.34, py + S * 0.18, { n: 1, colors: ['#FFD23F', '#FF8A3D', '#FFFFFF'], angle: Math.PI, spread: 0.5, speed: 150, gravity: 60, size: 7, life: 0.35 }); } }
          // Fiesta final mientras se marcha volando
          if (ending && Math.random() < dt * 9) fx.burst(Math.random() * W, H * (0.15 + Math.random() * 0.5), { n: 12, shape: 'shard', speed: 240, gravity: 380, size: 9, life: 0.9 });
          fx.update(dt);
        }

        function drawItem(it) {
          const s = S * 0.62, x = it.x, y = it.yy, tilt = Math.sin(t * 2.3 + it.wob) * 0.1;
          if (it.storm) return hazard(ctx, x, y, S * 0.92, t + it.wob);
          ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
          if (T.carry === 'burbuja') {   // dentro de una burbuja
            glyph(ctx, T.rescued, 0, 0, s * 0.9, IMG.rescued);
            ctx.fillStyle = 'rgba(180,240,255,.22)'; circle(ctx, 0, 0, s * 0.72);
            ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, s * 0.72, 0, TAU); ctx.stroke();
            ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, s * 0.56, Math.PI * 1.12, Math.PI * 1.42); ctx.stroke();
          } else {                       // colgando de un globo
            ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -s * 0.12); ctx.lineTo(0, s * 0.2); ctx.stroke();
            if (ok(IMG.carrier)) ctx.drawImage(IMG.carrier, -s * 0.55, -s * 1.2, s * 1.1, s * 1.1);
            else { ctx.fillStyle = '#FF4F6D'; ctx.beginPath(); ctx.ellipse(0, -s * 0.62, s * 0.38, s * 0.47, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.55)'; circle(ctx, -s * 0.12, -s * 0.78, s * 0.09); }
            glyph(ctx, T.rescued, 0, s * 0.42, s * 0.72, IMG.rescued);
          }
          ctx.restore();
        }

        function drawHero() {
          const x = px(), b = basket();
          const rot = spin > 0 ? spin * 15.7 : Math.max(-0.3, Math.min(0.3, (target - py) * 0.0028)), bob = Math.sin(t * 5) * 2;
          // Cuerdas
          ctx.strokeStyle = '#7A5230'; ctx.lineWidth = Math.max(2, S * 0.022); ctx.lineCap = 'round';
          const bw = S * 0.56, bh = S * 0.3;
          ctx.beginPath(); ctx.moveTo(x - S * 0.1, b.ay + bob); ctx.lineTo(b.x - bw * 0.42, b.y - bh * 0.5); ctx.moveTo(x + S * 0.1, b.ay + bob); ctx.lineTo(b.x + bw * 0.42, b.y - bh * 0.5); ctx.stroke();
          // Rescatados asomando (dos filas de cinco) y, delante, la cesta
          ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(swing * 0.6);
          const hs = S * 0.27, sq = 1 + bounce * 0.12;
          for (let i = Math.min(inBasket, 10) - 1; i >= 0; i--) {
            const row = i < 5 ? 0 : 1, j = i % 5, hop = Math.abs(Math.sin(t * 6 + i * 1.3)) * 2.5;
            glyph(ctx, T.rescued, (j - 2) * bw * 0.2 + (row ? bw * 0.1 : 0), -bh * (0.62 + row * 0.42) - hop, hs * (row ? 0.9 : 1), IMG.rescued);
          }
          ctx.scale(sq, 1 / sq);
          const metal = T.scene === 'espacio';
          ctx.fillStyle = metal ? '#8FA3C8' : '#C98A3C';
          ctx.beginPath(); ctx.moveTo(-bw * 0.5, -bh * 0.5); ctx.lineTo(bw * 0.5, -bh * 0.5); ctx.lineTo(bw * 0.38, bh * 0.5); ctx.quadraticCurveTo(0, bh * 0.66, -bw * 0.38, bh * 0.5); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = metal ? '#6E82A8' : '#A86E28'; ctx.lineWidth = Math.max(1.5, S * 0.016);
          for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * bw * 0.17, -bh * 0.4); ctx.lineTo(i * bw * 0.14, bh * 0.5); ctx.stroke(); }
          ctx.beginPath(); ctx.moveTo(-bw * 0.46, -bh * 0.05); ctx.lineTo(bw * 0.46, -bh * 0.05); ctx.stroke();
          ctx.fillStyle = metal ? '#C4D2EC' : '#E3A857'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-bw * 0.55, -bh * 0.62, bw * 1.1, bh * 0.24, bh * 0.12) : ctx.rect(-bw * 0.55, -bh * 0.62, bw * 1.1, bh * 0.24); ctx.fill();
          ctx.restore();
          // Héroe
          ctx.save(); ctx.translate(x, py + bob); ctx.rotate(rot);
          if (ok(IMG.body)) {
            ctx.scale(-1, 1);   // el dibujo mira a la izquierda y aquí vuela hacia la derecha
            ctx.drawImage(IMG.body, -S / 2, -S / 2, S, S);
            if (ok(IMG.rotor)) {
              const hx = (0.433 - 0.5) * S, hy = (0.187 - 0.5) * S;
              let sx = Math.cos(t * 30); if (Math.abs(sx) < 0.14) sx = sx < 0 ? -0.14 : 0.14;   // las palas giran
              ctx.save(); ctx.translate(hx, 0); ctx.scale(sx, 1); ctx.translate(-hx, 0); ctx.drawImage(IMG.rotor, -S / 2, -S / 2, S, S); ctx.restore();
              ctx.globalAlpha = 0.16; ctx.fillStyle = '#39405A'; ctx.beginPath(); ctx.ellipse(hx, hy, S * 0.47, S * 0.05, -0.06, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
            }
          } else glyph(ctx, T.hero, 0, 0, S * 0.9, IMG.hero);
          ctx.restore();
        }

        function draw() {
          const [ox, oy] = fx.offset();
          ctx.save(); ctx.translate(ox, oy);
          scene(ctx, W, H, scroll, t);
          items.forEach(drawItem);
          flying.forEach(f => {   // arco hacia la cesta
            const b = basket(), e = f.k * f.k * (3 - 2 * f.k), x = f.x0 + (b.x - f.x0) * e, y = f.y0 + (b.y - S * 0.2 - f.y0) * e - Math.sin(e * Math.PI) * S * 0.5;
            glyph(ctx, T.rescued, x, y, S * 0.36 * (1.25 - 0.25 * e), IMG.rescued);
          });
          drawHero();
          fx.draw(ctx);
          ctx.restore();
        }

        let last = performance.now();
        function loop(now) {
          if (!alive) return;
          const dt = Math.min(0.05, (now - last) / 1000); last = now;
          update(dt); draw();
          if (ending > 1.7) return finish();
          raf = requestAnimationFrame(loop);
        }
        raf = requestAnimationFrame(loop);

        function finish() {
          if (ro) ro.disconnect();
          const g = Core.gameState('super'); g.played++; g.total = (g.total || 0) + GOAL; Core.addStar();
          Core.endScreen(root, `<div>${Core.pic(T.hero)}${Core.pic(T.rescued)}🏆</div><span>¡${T.plural[0].toUpperCase() + T.plural.slice(1)} rescatados!</span><small>Llevas ${g.total} en total</small>`,
            `¡Has rescatado a los diez ${T.plural}! ¡Eres un héroe!`, play, exit);
        }
      }
      play();
      return () => { alive = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); };
    }
  });
}
