/* Súper Cerdito: un superhéroe propio. Vuela siguiendo el dedo y rescata a los pollitos que se han
   escapado colgados de un globo. Las nubes de tormenta solo le hacen dar vueltas: no se pierde nada. */
Games.push({
  id: 'super', section: 'recreo',
  name: 'Súper Cerdito', emoji: '🦸', color: '#d7263d',
  learns: 'Seguimiento con el dedo, anticipación y control del movimiento.',
  badge: s => s.total ? `🐥 ${s.total}` : '',
  start(root, exit) {
    const GOAL = 10;
    let raf, alive = true, over = false;

    function play() {
      cancelAnimationFrame(raf); over = false;
      let saved = 0, speed = 130, items = [], spawnIn = 1, spin = 0, trail = [];
      root.innerHTML = `<div class="hud"><span>🐥 <b id="n">0</b> / ${GOAL}</span><div class="goalbar"><div id="bar"></div></div><button class="speak-btn" id="sp">🔊</button></div>
        <div class="play sky" id="sky">
          <span class="cloud c1">☁️</span><span class="cloud c2">☁️</span><span class="cloud c3">☁️</span>
          <div class="sprite hero" id="hero"><span class="cape"></span><span class="pig">🐷</span></div>
        </div>`;
      const sky = root.querySelector('#sky'), hero = root.querySelector('#hero');
      const n = root.querySelector('#n'), bar = root.querySelector('#bar');
      const intro = () => Core.say('¡Súper Cerdito al rescate! Mueve el dedo para volar y rescata a los diez pollitos. ¡Cuidado con las nubes de tormenta!');
      root.querySelector('#sp').onclick = intro; intro();

      const W = () => sky.clientWidth, H = () => sky.clientHeight;
      const px = () => W() * 0.3;
      let py = H() / 2, target = py;
      const follow = e => { if (over) return; e.preventDefault(); const r = sky.getBoundingClientRect(); target = Math.max(40, Math.min(H() - 40, e.clientY - r.top)); };
      sky.addEventListener('pointerdown', follow);
      sky.addEventListener('pointermove', follow);

      const chicks = [0, 1, 2, 3].map(() => { const c = Core.el('<div class="sprite follower">🐥</div>'); c.style.display = 'none'; sky.appendChild(c); return c; });

      function spawn() {
        const storm = Math.random() < 0.3;
        const el = Core.el(storm ? '<div class="sprite storm">⛈️</div>' : '<div class="sprite lost"><span>🎈</span><span>🐥</span></div>');
        const it = { el, x: W() + 40, y: Core.rand(60, Math.max(61, H() - 70)), storm, wob: Math.random() * 6 };
        sky.appendChild(el); items.push(it);
      }

      let last = performance.now(), t = 0;
      function loop(now) {
        if (!alive || over) return;
        const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
        py += (target - py) * Math.min(1, dt * 7);
        spin = Math.max(0, spin - dt);
        hero.style.transform = `translate(${px() - 40}px, ${py - 40}px) rotate(${spin > 0 ? spin * 900 : (target - py) * 0.15}deg)`;
        trail.unshift(py); if (trail.length > 60) trail.pop();
        chicks.forEach((c, i) => {
          if (i < Math.min(saved, 4)) { c.style.display = ''; c.style.transform = `translate(${px() - 92 - i * 24}px, ${(trail[(i + 1) * 9] ?? py) - 8}px)`; }
        });
        spawnIn -= dt; if (spawnIn <= 0) { spawn(); spawnIn = Math.max(0.8, 1.5 - saved * 0.05); }
        items = items.filter(it => {
          it.x -= speed * dt;
          const y = it.y + Math.sin(t * 2 + it.wob) * 12;
          it.el.style.transform = `translate(${it.x - 30}px, ${y - 40}px)`;
          if (Math.abs(it.x - px()) < 48 && Math.abs(y - py) < 52) {
            if (it.storm) {
              if (spin <= 0) { spin = 0.8; Core.sfx.bonk(); it.el.remove(); return false; }
            } else {
              saved++; n.textContent = saved; bar.style.width = (100 * saved / GOAL) + '%';
              Core.sfx.ding(); speed += 6;
              const f = Core.el(`<div class="floating" style="left:${px()}px;top:${py - 50}px">💛</div>`);
              sky.appendChild(f); setTimeout(() => f.remove(), 800);
              it.el.remove(); if (saved >= GOAL) finish(); return false;
            }
          }
          if (it.x < -60) { it.el.remove(); return false; }
          return true;
        });
        raf = requestAnimationFrame(loop);
      }
      raf = requestAnimationFrame(loop);

      function finish() {
        over = true; cancelAnimationFrame(raf);
        const g = Core.gameState('super'); g.played++; g.total = (g.total || 0) + GOAL; Core.addStar();
        Core.endScreen(root, `🦸🐥🏆<span>¡Pollitos rescatados!</span><small>Llevas ${g.total} en total</small>`,
          '¡Has rescatado a los diez pollitos! ¡Eres un superhéroe!', play, exit);
      }
    }
    play();
    return () => { alive = false; over = true; cancelAnimationFrame(raf); };
  }
});
