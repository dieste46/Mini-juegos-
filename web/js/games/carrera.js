/* Carrera: el coche (o el cohete) cambia de carril tocando a la izquierda o a la derecha de la pantalla.
   Objetivo: coger 15 estrellas. Chocar no quita nada: da un bote, pierde la velocidad extra y seguimos.
   Se pinta en canvas 2D visto desde detrás: la pista viene del horizonte y todo crece al acercarse.
   Las reglas son las de siempre; cada tema elige su pista con sets.carrera.scene. */
{
  const { TAU, rnd, mod, circle, cloud, tree, house, hillY, ridge } = Scene;
  const K = 3;                               // cuánto encoge la distancia
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); ctx.fill(); };
  const oval = (ctx, x, y, rx, ry) => { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU); ctx.fill(); };
  const shadow = (ctx, x, y, w) => { ctx.fillStyle = 'rgba(0,0,0,.2)'; oval(ctx, x, y, w * 0.5, w * 0.1); };

  // ---------- Pistas: colores del suelo, cielo del horizonte, obstáculos y adornos ----------
  const TRACKS = {
    campo: {
      ground: ['#5FD47C', '#54CB71'], road: ['#5B6072', '#555A6B'], kerb: ['#E5484D', '#FFFFFF'], dash: '#FFFFFF', haze: 'rgba(255,255,255,.35)',
      sky(ctx, W, hy, t, shift) {
        const g = ctx.createLinearGradient(0, 0, 0, hy); g.addColorStop(0, '#4FB3FF'); g.addColorStop(1, '#D4F1FF'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, hy + 2);
        const sx = W * 0.8 - shift * 0.15, sy = hy * 0.34, sr = hy * 0.15;
        ctx.save(); ctx.translate(sx, sy); ctx.rotate(t * 0.12); ctx.fillStyle = 'rgba(255,233,138,.75)';
        for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); ctx.beginPath(); ctx.moveTo(-sr * 0.16, -sr * 1.15); ctx.lineTo(0, -sr * 1.7); ctx.lineTo(sr * 0.16, -sr * 1.15); ctx.fill(); }
        ctx.restore(); ctx.fillStyle = '#FFD23F'; circle(ctx, sx, sy, sr); ctx.fillStyle = '#FFE98A'; circle(ctx, sx - sr * 0.25, sy - sr * 0.25, sr * 0.45);
        const P = W + 260;
        for (let k = 0; k < 5; k++) cloud(ctx, mod(rnd(k, 1) * P - t * (4 + rnd(k, 4) * 6) - shift * 0.3, P) - 130, hy * (0.16 + rnd(k, 3) * 0.5), hy * (0.14 + rnd(k, 2) * 0.12), k < 2 ? '#D6F0FF' : '#FFFFFF');
        ridge(ctx, W, hy + 2, shift * 0.2 + 40, '#A6E6B2', wx => hillY(wx, hy - hy * 0.05, hy * 0.13, 110, hy * 0.05, 43));
        const f = wx => hillY(wx, hy + 2, hy * 0.07, 90, hy * 0.03, 31);
        ridge(ctx, W, hy + 2, shift * 0.4, '#6FD98A', f);
        for (let k = Math.floor((shift * 0.4) / 70) - 1; k <= Math.floor((shift * 0.4 + W) / 70) + 1; k++) if (rnd(k, 5) < 0.6) tree(ctx, k * 70 + rnd(k, 6) * 40 - shift * 0.4, f(k * 70 + rnd(k, 6) * 40) + 2, hy * (0.09 + rnd(k, 7) * 0.06));
      },
      obstacles: ['cono', 'roca', 'paca', 'barril'],
      prop(ctx, x, y, u, r, far) {   // adornos de los lados
        if (r < 0.46) tree(ctx, x, y, u * (1.5 + r * 2));
        else if (r < 0.6) { ctx.fillStyle = '#2FA44E'; circle(ctx, x - u * 0.2, y - u * 0.16, u * 0.24); circle(ctx, x + u * 0.16, y - u * 0.2, u * 0.28); ctx.fillStyle = '#4CC96B'; circle(ctx, x, y - u * 0.3, u * 0.2); }
        else if (r < 0.7 && far) house(ctx, x, y, u * 1.7, false);
        else if (r < 0.78 && far) house(ctx, x, y, u * 1.9, true);
        else if (r < 0.88) OBJ.paca(ctx, x, y, u * 0.9);
        else for (let i = 0; i < 4; i++) { const fx = x + (i - 1.5) * u * 0.22, fy = y - (i % 2) * u * 0.08; ctx.fillStyle = '#2FA44E'; ctx.fillRect(fx - u * 0.012, fy - u * 0.16, u * 0.024, u * 0.16); ctx.fillStyle = ['#FF5FA2', '#FFD23F', '#FFFFFF', '#FF8A3D'][i]; circle(ctx, fx, fy - u * 0.18, u * 0.065); }
      },
      edge(ctx, x, y, u, x2, y2, u2, on) {   // valla junto a la pista
        if (!on) return;
        ctx.fillStyle = '#F3E2B8'; ctx.fillRect(x - u * 0.03, y - u * 0.32, u * 0.06, u * 0.34);
        ctx.strokeStyle = '#F3E2B8'; ctx.lineWidth = Math.max(1, u * 0.045);
        ctx.beginPath(); ctx.moveTo(x, y - u * 0.25); ctx.lineTo(x2, y2 - u2 * 0.25); ctx.moveTo(x, y - u * 0.13); ctx.lineTo(x2, y2 - u2 * 0.13); ctx.stroke();
      }
    },
    espacio: {
      ground: ['#231E5C', '#272264'], road: ['rgba(53,214,230,.16)', 'rgba(53,214,230,.24)'], kerb: ['#35D6E6', '#B79CFF'], dash: '#FFD23F', haze: 'rgba(183,156,255,.3)', grid: 'rgba(183,156,255,.28)',
      sky(ctx, W, hy, t, shift) {
        const g = ctx.createLinearGradient(0, 0, 0, hy); g.addColorStop(0, '#0F1038'); g.addColorStop(1, '#3A2C86'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, hy + 2);
        for (let k = 0; k < 46; k++) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 2 + k * 1.7); ctx.fillStyle = k % 5 ? '#FFFFFF' : '#FFE98A'; circle(ctx, mod(rnd(k, 1) * (W + 40) - shift * 0.08, W + 40) - 20, rnd(k, 2) * hy * 0.95, 0.8 + rnd(k, 3) * 1.6); }
        ctx.globalAlpha = 1;
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, hy + 1); ctx.clip();   // planeta asomando por el horizonte
        const px = W * 0.72 - shift * 0.2, pr = hy * 0.5;
        ctx.strokeStyle = '#FFD8A8'; ctx.lineWidth = pr * 0.1; ctx.beginPath(); ctx.ellipse(px, hy - pr * 0.25, pr * 1.6, pr * 0.4, -0.3, Math.PI, TAU); ctx.stroke();
        ctx.fillStyle = '#FF9A62'; circle(ctx, px, hy + pr * 0.1, pr); ctx.fillStyle = '#FFB98C'; circle(ctx, px - pr * 0.3, hy - pr * 0.35, pr * 0.4);
        ctx.fillStyle = '#35A7FF'; circle(ctx, W * 0.16 - shift * 0.1, hy * 0.3, hy * 0.08); ctx.fillStyle = '#5BE38C'; circle(ctx, W * 0.16 - shift * 0.1 - hy * 0.02, hy * 0.28, hy * 0.035);
        ctx.restore();
        ridge(ctx, W, hy + 2, shift * 0.4, '#4A3FA0', wx => hillY(wx, hy + 2, hy * 0.06, 80, hy * 0.035, 29));
      },
      obstacles: ['asteroide', 'ovni', 'cristal'],
      prop(ctx, x, y, u, r) {
        if (r < 0.35) OBJ.cristal(ctx, x, y, u * (0.8 + r * 2));
        else if (r < 0.62) { ctx.fillStyle = '#8A6F63'; circle(ctx, x, y - u * 0.2, u * 0.26); ctx.fillStyle = '#A88B7D'; circle(ctx, x - u * 0.08, y - u * 0.28, u * 0.11); ctx.fillStyle = '#6A534A'; circle(ctx, x + u * 0.08, y - u * 0.14, u * 0.06); }
        else if (r < 0.8) {   // antena con luz
          ctx.fillStyle = '#8FA3C8'; ctx.fillRect(x - u * 0.03, y - u * 1.3, u * 0.06, u * 1.3); ctx.fillRect(x - u * 0.2, y - u * 0.06, u * 0.4, u * 0.06);
          ctx.fillStyle = '#FF5FA2'; circle(ctx, x, y - u * 1.34, u * 0.09); ctx.globalAlpha *= 0.35; circle(ctx, x, y - u * 1.34, u * 0.2);
        } else { ctx.fillStyle = '#1B1750'; oval(ctx, x, y, u * 0.5, u * 0.1); ctx.fillStyle = '#3A3280'; oval(ctx, x, y - u * 0.02, u * 0.42, u * 0.07); }
      },
      edge(ctx, x, y, u) {   // balizas de luz
        ctx.fillStyle = 'rgba(53,214,230,.3)'; circle(ctx, x, y - u * 0.08, u * 0.14); ctx.fillStyle = '#BFF4FF'; circle(ctx, x, y - u * 0.08, u * 0.055);
      }
    }
  };

  // ---------- Cosas de la pista: draw(ctx, x, y del suelo, u = ancho de un carril a esa distancia, tiempo) ----------
  const OBJ = {
    estrella(ctx, x, y, u, t) {
      shadow(ctx, x, y, u * 0.5);
      const cy = y - u * 0.5 - Math.sin(t * 4) * u * 0.05, R = u * 0.34;
      ctx.save(); ctx.translate(x, cy); ctx.scale(0.55 + 0.45 * Math.abs(Math.cos(t * 2.6)), 1);
      ctx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? R * 0.48 : R, a = i * Math.PI / 5; ctx.lineTo(Math.sin(a) * r, -Math.cos(a) * r); } ctx.closePath();
      ctx.fillStyle = '#FFD23F'; ctx.fill(); ctx.strokeStyle = '#F0A500'; ctx.lineWidth = Math.max(1, u * 0.04); ctx.lineJoin = 'round'; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.75)'; circle(ctx, -R * 0.2, -R * 0.25, R * 0.14);
      ctx.restore();
    },
    cono(ctx, x, y, u) {
      shadow(ctx, x, y, u * 0.6); ctx.fillStyle = '#E06A1B'; rr(ctx, x - u * 0.27, y - u * 0.1, u * 0.54, u * 0.1, u * 0.03);
      ctx.fillStyle = '#FF8A3D'; ctx.beginPath(); ctx.moveTo(x - u * 0.19, y - u * 0.09); ctx.lineTo(x - u * 0.05, y - u * 0.62); ctx.lineTo(x + u * 0.05, y - u * 0.62); ctx.lineTo(x + u * 0.19, y - u * 0.09); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(x - u * 0.135, y - u * 0.3); ctx.lineTo(x - u * 0.1, y - u * 0.43); ctx.lineTo(x + u * 0.1, y - u * 0.43); ctx.lineTo(x + u * 0.135, y - u * 0.3); ctx.closePath(); ctx.fill();
    },
    roca(ctx, x, y, u) {
      shadow(ctx, x, y, u * 0.7); ctx.fillStyle = '#7C8397'; oval(ctx, x, y - u * 0.2, u * 0.32, u * 0.23);
      ctx.fillStyle = '#9AA1B4'; oval(ctx, x - u * 0.06, y - u * 0.27, u * 0.22, u * 0.15); ctx.fillStyle = '#C3C9D8'; oval(ctx, x - u * 0.12, y - u * 0.32, u * 0.08, u * 0.045);
    },
    paca(ctx, x, y, u) {
      shadow(ctx, x, y, u * 0.7); ctx.fillStyle = '#F2C14E'; rr(ctx, x - u * 0.3, y - u * 0.46, u * 0.6, u * 0.46, u * 0.1);
      ctx.strokeStyle = '#D9A12E'; ctx.lineWidth = Math.max(1, u * 0.03);
      ctx.beginPath(); ctx.arc(x, y - u * 0.23, u * 0.15, 0, TAU); ctx.moveTo(x + u * 0.07, y - u * 0.23); ctx.arc(x, y - u * 0.23, u * 0.07, 0, TAU); ctx.stroke();
    },
    barril(ctx, x, y, u) {
      shadow(ctx, x, y, u * 0.55); ctx.fillStyle = '#3E8BFF'; rr(ctx, x - u * 0.2, y - u * 0.52, u * 0.4, u * 0.52, u * 0.06);
      ctx.fillStyle = '#2B6BD1'; ctx.fillRect(x - u * 0.2, y - u * 0.4, u * 0.4, u * 0.05); ctx.fillRect(x - u * 0.2, y - u * 0.18, u * 0.4, u * 0.05);
      ctx.fillStyle = '#7FB4FF'; oval(ctx, x, y - u * 0.52, u * 0.2, u * 0.05);
    },
    asteroide(ctx, x, y, u, t) {
      const cy = y - u * 0.36 - Math.sin(t * 2) * u * 0.04; ctx.fillStyle = 'rgba(0,0,0,.25)'; oval(ctx, x, y, u * 0.24, u * 0.05);
      ctx.fillStyle = '#8A6F63'; circle(ctx, x, cy, u * 0.3); ctx.fillStyle = '#A88B7D'; circle(ctx, x - u * 0.09, cy - u * 0.09, u * 0.13);
      ctx.fillStyle = '#6A534A'; circle(ctx, x + u * 0.1, cy + u * 0.06, u * 0.07); circle(ctx, x - u * 0.07, cy + u * 0.14, u * 0.045);
    },
    ovni(ctx, x, y, u, t) {
      const cy = y - u * 0.4 - Math.sin(t * 3) * u * 0.05; ctx.fillStyle = 'rgba(53,214,230,.18)';
      ctx.beginPath(); ctx.moveTo(x - u * 0.12, cy); ctx.lineTo(x + u * 0.12, cy); ctx.lineTo(x + u * 0.26, y); ctx.lineTo(x - u * 0.26, y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#7FE9F5'; circle(ctx, x, cy - u * 0.08, u * 0.16); ctx.fillStyle = '#B9B3E6'; oval(ctx, x, cy, u * 0.36, u * 0.12); ctx.fillStyle = '#8C84D0'; oval(ctx, x, cy + u * 0.04, u * 0.3, u * 0.07);
      for (let i = -1; i <= 1; i++) { ctx.fillStyle = Math.sin(t * 8 + i * 2) > 0 ? '#FFD23F' : '#FF5FA2'; circle(ctx, x + i * u * 0.2, cy + u * 0.01, u * 0.035); }
    },
    cristal(ctx, x, y, u) {
      ctx.fillStyle = 'rgba(0,0,0,.22)'; oval(ctx, x, y, u * 0.22, u * 0.05);
      ctx.fillStyle = '#35D6E6'; ctx.beginPath(); ctx.moveTo(x, y - u * 0.66); ctx.lineTo(x + u * 0.2, y - u * 0.34); ctx.lineTo(x + u * 0.1, y); ctx.lineTo(x - u * 0.1, y); ctx.lineTo(x - u * 0.2, y - u * 0.34); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#BFF4FF'; ctx.beginPath(); ctx.moveTo(x, y - u * 0.66); ctx.lineTo(x - u * 0.2, y - u * 0.34); ctx.lineTo(x - u * 0.04, y - u * 0.3); ctx.closePath(); ctx.fill();
    }
  };

  // Coche de carreras visto desde detrás (w = ancho; y = suelo)
  function drawCar(ctx, x, y, w, roll) {
    shadow(ctx, x, y, w * 1.15);
    ctx.save(); ctx.translate(x, y); ctx.rotate(roll);
    ctx.fillStyle = '#22232E'; rr(ctx, -w * 0.52, -w * 0.32, w * 0.22, w * 0.32, w * 0.07); rr(ctx, w * 0.3, -w * 0.32, w * 0.22, w * 0.32, w * 0.07);
    ctx.fillStyle = '#FF5A4D'; rr(ctx, -w * 0.31, -w * 0.78, w * 0.62, w * 0.4, w * 0.14);                    // cabina
    ctx.fillStyle = '#8FD8FF'; rr(ctx, -w * 0.24, -w * 0.72, w * 0.48, w * 0.2, w * 0.08);                    // luneta
    ctx.fillStyle = 'rgba(255,255,255,.6)'; rr(ctx, -w * 0.2, -w * 0.7, w * 0.16, w * 0.05, w * 0.025);
    ctx.fillStyle = '#E5383F'; rr(ctx, -w * 0.45, -w * 0.52, w * 0.9, w * 0.42, w * 0.12);                    // carrocería
    ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.fillRect(-w * 0.07, -w * 0.52, w * 0.14, w * 0.4);           // franja
    ctx.fillStyle = '#A9262C'; ctx.fillRect(-w * 0.3, -w * 0.66, w * 0.05, w * 0.16); ctx.fillRect(w * 0.25, -w * 0.66, w * 0.05, w * 0.16);
    rr(ctx, -w * 0.5, -w * 0.7, w, w * 0.09, w * 0.04);                                                        // alerón
    ctx.fillStyle = '#FFD23F'; circle(ctx, -w * 0.33, -w * 0.36, w * 0.06); circle(ctx, w * 0.33, -w * 0.36, w * 0.06);   // pilotos
    ctx.fillStyle = '#FF8A3D'; circle(ctx, -w * 0.33, -w * 0.36, w * 0.03); circle(ctx, w * 0.33, -w * 0.36, w * 0.03);
    ctx.fillStyle = '#C9CED9'; rr(ctx, -w * 0.42, -w * 0.19, w * 0.84, w * 0.08, w * 0.04);                   // parachoques
    ctx.fillStyle = '#FFFFFF'; rr(ctx, -w * 0.11, -w * 0.33, w * 0.22, w * 0.11, w * 0.02);
    ctx.fillStyle = '#FFD23F'; circle(ctx, 0, -w * 0.275, w * 0.035);
    ctx.restore();
  }
  // El cohete reutiliza el dibujo vectorial que ya había (visto desde arriba, que en el espacio encaja)
  const rocket = new Image();
  rocket.src = 'data:image/svg+xml,' + encodeURIComponent(Decor.rocketTop().replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="208" '));

  Games.push({
    id: 'carrera', section: 'recreo',
    name: 'Carrera', art: t => (t.id === 'granja' ? 'coche' : null), emoji: t => t.sets.carrera.vehicle, color: '#555b6e',
    learns: 'Reflejos, anticipación y lateralidad (izquierda / derecha).',
    badge: s => s.wins ? `🏁 ${s.wins}` : '',
    start(root, exit) {
      const T = Themes.set('carrera'), TR = TRACKS[T.scene] || TRACKS.campo, isCar = T.road;
      const GOAL = 15, BASE = 0.5, Z0 = 2.4, ZFAR = 8, ZPROP = 4.6;
      let raf = 0, alive = true, ro = null, currentTap = null;

      function play() {
        cancelAnimationFrame(raf); if (ro) ro.disconnect();
        root.innerHTML = `<div class="hud"><span>⭐ <b id="st">0</b> / ${GOAL}</span><div class="goalbar"><div id="bar"></div></div><span>🏁</span></div>
          <div class="play" id="road" style="touch-action:none"><canvas style="position:absolute;inset:0;width:100%;height:100%;display:block"></canvas></div>`;
        const host = root.querySelector('#road'), cv = host.querySelector('canvas'), ctx = cv.getContext('2d');
        const st = root.querySelector('#st'), bar = root.querySelector('#bar'), fx = Fx.system();
        Core.say(`Toca a la izquierda o a la derecha para mover ${isCar ? 'el coche' : 'el cohete'}. ¡Coge quince estrellas!`);

        let W = 1, H = 1, hy = 1, carY = 1, cx = 1, RH = 1, LW = 1, zNear = -0.1;
        function fit() {
          const d = Math.min(2, window.devicePixelRatio || 1);
          W = Math.max(1, host.clientWidth); H = Math.max(1, host.clientHeight);
          cv.width = Math.round(W * d); cv.height = Math.round(H * d); ctx.setTransform(d, 0, 0, d, 0, 0);
          hy = H * 0.3; carY = H * 0.82; cx = W / 2; RH = Math.min(W * 0.4, H * 0.42); LW = RH * 2 / 3;
          zNear = (1 / ((H + 60 - hy) / (carY - hy)) - 1) / K;
        }
        fit();
        if (window.ResizeObserver) { ro = new ResizeObserver(fit); ro.observe(host); }

        let lane = 1, lat = 0, cam = 0, stars = 0, speed = BASE, dist = 0, t = 0, ghost = 0, hop = 0, spawnIn = 0.6, puff = 0;
        let items = [], props = [], nextProp = 0, ending = 0, flagZ = null, carZ = 0;
        const sc = z => 1 / (1 + K * z), Y = z => hy + (carY - hy) * sc(z), X = (l, z) => cx + (l - cam) * sc(z);
        const laneLat = l => (l - 1) * LW;

        // Se puede tocar en cualquier parte de la pantalla, no solo en la pista.
        const onTap = e => {
          if (ending) return;
          e.preventDefault();
          const nl = e.clientX < window.innerWidth / 2 ? Math.max(0, lane - 1) : Math.min(2, lane + 1);
          if (nl !== lane) { lane = nl; Core.sfx.whoosh(); }
        };
        if (currentTap) root.removeEventListener('pointerdown', currentTap);
        currentTap = onTap; root.addEventListener('pointerdown', onTap);

        const addProp = z => { const side = Math.random() < 0.5 ? -1 : 1, r = Math.random(), off = 1.6 + Math.pow(Math.random(), 1.4) * 4; props.push({ z, lat: side * RH * off, r, far: off > 2.1 }); };
        for (let z = 0.2; z < ZPROP; z += 0.11) addProp(z);   // el paisaje ya está puesto al empezar

        function update(dt) {
          t += dt; const v = speed * (ending ? 1.25 : 1); dist += v * dt;
          lat += (laneLat(lane) - lat) * Math.min(1, dt * 12); cam += (lat * 0.45 - cam) * Math.min(1, dt * 6);
          ghost = Math.max(0, ghost - dt); hop = Math.max(0, hop - dt * 2.4);
          nextProp -= v * dt; while (nextProp <= 0) { addProp(ZPROP); nextProp += 0.11; }
          props = props.filter(p => (p.z -= v * dt) > zNear - 0.05);

          if (!ending) {
            spawnIn -= dt;
            if (spawnIn <= 0) { const star = Math.random() < 0.5; items.push({ z: Z0, lane: Core.rand(0, 2), star, kind: star ? 'estrella' : Core.pick(TR.obstacles) }); spawnIn = Math.max(0.5, 1.1 - stars * 0.03); }
          }
          items = items.filter(it => {
            it.z -= v * dt;
            if (!ending && !it.gone && it.lane === lane && it.z < 0.07 && it.z > -0.08) {
              const hx = X(lat, 0), hyy = carY - LW * 0.4;
              if (it.star) {
                stars++; st.textContent = stars; bar.style.width = (100 * stars / GOAL) + '%';
                Core.sfx.ding(); speed += 0.018;
                fx.ring(hx, hyy, '#FFE98A', LW * 0.15, LW * 2.6, 0.32);
                fx.burst(hx, hyy, { n: 12, shape: 'star', colors: ['#FFD23F', '#FFE98A', '#FFFFFF'], speed: 300, gravity: 260, size: 9, life: 0.6 });
                if (stars >= GOAL) { ending = 0.001; flagZ = Z0; }
                return false;
              }
              if (ghost <= 0) {
                // Choque: bote, sonido y se pierde la velocidad extra. Nada más.
                Core.sfx.bonk(); ghost = 1.2; hop = 1; speed = BASE; fx.shake(9, 0.35);
                fx.burst(hx, hyy, { n: 10, shape: 'puff', colors: isCar ? ['#D9D9DE', '#A9ABB6', '#FF8A3D'] : ['#B79CFF', '#35D6E6', '#FFFFFF'], speed: 170, gravity: -30, size: 13, grow: 28, life: 0.55 });
                return false;
              }
            }
            return it.z > zNear - 0.05;
          });

          // Polvo de las ruedas o chorro del cohete
          puff -= dt;
          if (puff <= 0 && !Fx.calm()) {
            puff = isCar ? 0.07 : 0.03; const s = sc(carZ), bx = X(lat, carZ), by = Y(carZ);
            if (isCar) fx.burst(bx + (Math.random() < 0.5 ? -1 : 1) * LW * 0.3 * s, by - 2, { n: 1, shape: 'puff', colors: ['rgba(255,255,255,.38)'], speed: 30, angle: Math.PI / 2, spread: 1, gravity: 0, size: 3 * s, grow: 13 * s, life: 0.28 });
            else fx.burst(bx, by + LW * 0.1 * s, { n: 1, colors: ['#FFD23F', '#FF8A3D', '#FFFFFF'], speed: 160 * s, angle: Math.PI / 2, spread: 0.5, gravity: 0, size: 9 * s, life: 0.3 });
          }
          // Final: llega la meta y el coche se va hacia el horizonte entre confeti
          if (ending) {
            ending += dt;
            if (flagZ !== null) { flagZ -= v * dt; if (flagZ <= 0) { flagZ = null; ending = 10; Core.sfx.fanfare(); } }
            if (ending >= 10) {
              carZ += dt * (0.5 + (ending - 10) * 2.2);
              if (Math.random() < dt * 10) fx.burst(Math.random() * W, H * (0.1 + Math.random() * 0.45), { n: 12, shape: 'shard', speed: 240, gravity: 380, size: 9, life: 0.9 });
            }
          }
          fx.update(dt);
        }

        const quad = (l1, l2, za, zb) => { ctx.beginPath(); ctx.moveTo(X(l1, zb), Y(zb)); ctx.lineTo(X(l2, zb), Y(zb)); ctx.lineTo(X(l2, za), Y(za) + 0.7); ctx.lineTo(X(l1, za), Y(za) + 0.7); ctx.closePath(); ctx.fill(); };

        function drawGround() {
          ctx.fillStyle = TR.ground[0]; ctx.fillRect(0, hy, W, H - hy);
          const L = 0.24, k0 = Math.floor((zNear + dist) / L), k1 = Math.ceil((ZFAR + dist) / L);
          // Franjas del suelo: al pasar dan la sensación de velocidad
          for (let k = k0; k <= k1; k++) if (mod(k, 2)) { const za = Math.max(zNear, k * L - dist), zb = Math.min(ZFAR, (k + 1) * L - dist); ctx.fillStyle = TR.ground[1]; ctx.fillRect(0, Y(zb), W, Y(za) - Y(zb) + 0.7); }
          if (TR.grid) {   // cuadrícula luminosa en el espacio
            ctx.strokeStyle = TR.grid; ctx.lineWidth = 1.5; ctx.beginPath();
            for (let k = k0; k <= k1; k++) { const y = Y(Math.max(zNear, k * L - dist)); ctx.moveTo(0, y); ctx.lineTo(W, y); }
            for (let i = -12; i <= 12; i++) { if (Math.abs(i * LW * 1.5) < RH * 1.1) continue; ctx.moveTo(X(i * LW * 1.5, ZFAR), Y(ZFAR)); ctx.lineTo(X(i * LW * 1.5, zNear), Y(zNear)); }
            ctx.stroke();
          }
          ctx.fillStyle = TR.road[0]; ctx.beginPath(); ctx.moveTo(X(0, 60), hy); ctx.lineTo(X(RH, zNear), Y(zNear)); ctx.lineTo(X(-RH, zNear), Y(zNear)); ctx.closePath(); ctx.fill();
          for (let k = k0; k <= k1; k++) {
            const za = Math.max(zNear, k * L - dist), zb = Math.min(ZFAR, (k + 1) * L - dist), odd = mod(k, 2);
            if (odd) { ctx.fillStyle = TR.road[1]; quad(-RH, RH, za, zb); }
            ctx.fillStyle = TR.kerb[odd]; quad(-RH * 1.09, -RH, za, zb); quad(RH, RH * 1.09, za, zb);
            if (!odd) { ctx.fillStyle = TR.dash; quad(-LW / 2 - RH * 0.022, -LW / 2 + RH * 0.022, za, zb); quad(LW / 2 - RH * 0.022, LW / 2 + RH * 0.022, za, zb); }
          }
          const g = ctx.createLinearGradient(0, hy, 0, hy + (carY - hy) * 0.22); g.addColorStop(0, TR.haze); g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = g; ctx.fillRect(0, hy, W, (carY - hy) * 0.22);   // bruma del horizonte
          // Borde de la pista (valla o balizas), repetido a distancia fija
          const E = 0.2;
          for (let k = Math.ceil((ZPROP + dist) / E); k >= Math.floor((zNear + dist) / E); k--) {
            const z = k * E - dist, z2 = (k - 1) * E - dist; if (z < zNear || z > ZPROP) continue;
            const on = rnd(Math.floor(k / 12), 3) < 0.6 && mod(k, 12) !== 0;
            ctx.globalAlpha = Math.min(1, (ZPROP - z) * 2.5);
            for (const s of [-1, 1]) TR.edge(ctx, X(s * RH * 1.22, z), Y(z), LW * sc(z), X(s * RH * 1.22, Math.max(z2, zNear)), Y(Math.max(z2, zNear)), LW * sc(Math.max(z2, zNear)), on);
          }
          ctx.globalAlpha = 1;
        }

        function drawFlag(z) {   // meta: suelo a cuadros y arco
          const s = sc(z), y = Y(z), u = LW * s, n = 8, cw = RH * 2 / n;
          for (let r = 0; r < 2; r++) for (let i = 0; i < n; i++) { ctx.fillStyle = (i + r) % 2 ? '#1B1846' : '#FFFFFF'; quad(-RH + i * cw, -RH + (i + 1) * cw, z + r * 0.035, z + (r + 1) * 0.035); }
          const xl = X(-RH * 1.14, z), xr = X(RH * 1.14, z), top = y - u * 2.3;
          ctx.fillStyle = '#FF5FA2'; ctx.fillRect(xl - u * 0.07, top, u * 0.14, y - top); ctx.fillRect(xr - u * 0.07, top, u * 0.14, y - top);
          const bw = (xr - xl) / 12, bh = u * 0.24;
          for (let r = 0; r < 2; r++) for (let i = 0; i < 12; i++) { ctx.fillStyle = (i + r) % 2 ? '#1B1846' : '#FFFFFF'; ctx.fillRect(xl + i * bw, top + r * bh, bw + 0.6, bh + 0.6); }
          ctx.fillStyle = '#FFD23F'; circle(ctx, xl, top, u * 0.14); circle(ctx, xr, top, u * 0.14);
        }

        function drawHero() {
          const s = sc(carZ), x = X(lat, carZ), y = Y(carZ) - Math.sin(hop * Math.PI) * LW * 0.35 * s;
          const roll = (laneLat(lane) - lat) / LW * 0.3 + (hop > 0 ? Math.sin(hop * 14) * 0.18 : 0);
          ctx.globalAlpha = ghost > 0 && Math.floor(ghost * 10) % 2 ? 0.4 : 1;
          if (isCar) drawCar(ctx, x, y + Math.sin(t * 40) * 0.6, LW * 0.86 * s, roll);
          else {
            const w = LW * 0.62 * s, h = w * 104 / 60;
            ctx.fillStyle = 'rgba(0,0,0,.25)'; oval(ctx, x, Y(carZ) + LW * 0.12 * s, w * 0.5, w * 0.12);
            ctx.save(); ctx.translate(x, y - h * 0.42 + Math.sin(t * 5) * 2); ctx.rotate(roll);
            if (rocket.complete && rocket.naturalWidth) ctx.drawImage(rocket, -w / 2, -h / 2, w, h);
            else { ctx.font = `${w}px ${Fx.EMO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(T.vehicle, 0, 0); }
            ctx.restore();
          }
          ctx.globalAlpha = 1;
        }

        function draw() {
          const [ox, oy] = fx.offset();
          ctx.save(); ctx.translate(ox, oy);
          TR.sky(ctx, W, hy, t, cam);
          drawGround();
          // Todo lo que hay sobre el suelo, de lejos a cerca
          const list = [{ z: carZ, hero: true }];
          props.forEach(p => list.push(p)); items.forEach(i => list.push(i));
          if (flagZ !== null) list.push({ z: flagZ, flag: true });
          list.sort((a, b) => b.z - a.z);
          for (const o of list) {
            if (o.hero) { drawHero(); continue; }
            if (o.flag) { drawFlag(o.z); continue; }
            const s = sc(o.z), y = Y(o.z);
            if (o.kind) { ctx.globalAlpha = Math.min(1, (Z0 - o.z) * 4) * (ending && !o.star ? 0.35 : 1); OBJ[o.kind](ctx, X(laneLat(o.lane), o.z), y, LW * s, t + o.lane); }
            else { ctx.globalAlpha = Math.min(1, (ZPROP - o.z) * 2.5); TR.prop(ctx, X(o.lat, o.z), y, LW * s, o.r, o.far); }
            ctx.globalAlpha = 1;
          }
          fx.draw(ctx);
          ctx.restore();
        }

        let last = performance.now();
        function loop(now) {
          if (!alive) return;
          const dt = Math.min(0.05, (now - last) / 1000); last = now;
          update(dt); draw();
          if (ending > 11.3) return finish();
          raf = requestAnimationFrame(loop);
        }
        raf = requestAnimationFrame(loop);

        function finish() {
          if (ro) ro.disconnect();
          root.removeEventListener('pointerdown', onTap);
          const g = Core.gameState('carrera'); g.played++; g.wins = (g.wins || 0) + 1; Core.addStar();
          Core.endScreen(root, `🏁🏆<span>¡Has ganado la carrera!</span>`, '¡Has ganado la carrera! ¡Campeón!', play, exit);
        }
      }
      play();
      return () => { alive = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); if (currentTap) root.removeEventListener('pointerdown', currentTap); };
    }
  });
}
