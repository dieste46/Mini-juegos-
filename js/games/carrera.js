/* Carrera: el coche cambia de carril tocando a izquierda/derecha. Coge estrellas y esquiva obstáculos. */
Games.push({
  id: 'carrera', section: 'recreo',
  name: 'Carrera', emoji: '🏎️', color: '#555b6e',
  learns: 'Reflejos, anticipación y lateralidad (izquierda / derecha).',
  start(root, exit) {
    const GOAL = 15, LANES = [1 / 6, 3 / 6, 5 / 6];
    let raf, alive = true;

    function play() {
      cancelAnimationFrame(raf);
      let lane = 1, lives = 3, stars = 0, speed = 220, items = [], ghost = 0, spawnIn = 0.6, over = false;
      root.innerHTML = `<div class="hud"><span>⭐ <b id="st">0</b> / ${GOAL}</span><span class="lives" id="lv">❤️❤️❤️</span></div>
        <div class="play road" id="road">
          <div class="lane" style="left:calc(33.3% - 3px)"></div><div class="lane" style="left:calc(66.6% - 3px)"></div>
          <div class="sprite car" id="car">🏎️</div></div>`;
      const road = root.querySelector('#road'), car = root.querySelector('#car');
      const st = root.querySelector('#st'), lv = root.querySelector('#lv');
      Core.say('Toca a la izquierda o a la derecha para mover el coche. ¡Coge las estrellas!');

      const W = () => road.clientWidth, H = () => road.clientHeight;
      const placeCar = () => { car.style.left = (LANES[lane] * W() - 34) + 'px'; car.style.top = (H() - 90) + 'px'; };
      placeCar();

      road.addEventListener('pointerdown', e => {
        e.preventDefault();
        const x = e.clientX - road.getBoundingClientRect().left;
        const nl = x < W() / 2 ? Math.max(0, lane - 1) : Math.min(2, lane + 1);
        if (nl !== lane) { lane = nl; placeCar(); Core.sfx.whoosh(); }
      });

      function spawn() {
        const star = Math.random() < 0.45;
        const ch = star ? '⭐' : Core.pick(['🪨', '🚧', '🐄', '🛢️']);
        const el = Core.el(`<div class="sprite" style="font-size:3rem">${ch}</div>`);
        const it = { el, lane: Core.rand(0, 2), y: -60, star };
        el.style.left = (LANES[it.lane] * W() - 24) + 'px';
        road.appendChild(el); items.push(it);
      }

      let last = performance.now();
      function loop(now) {
        if (!alive || over) return;
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        spawnIn -= dt; if (spawnIn <= 0) { spawn(); spawnIn = Math.max(0.45, 1.1 - stars * 0.03); }
        ghost = Math.max(0, ghost - dt);
        car.style.opacity = ghost > 0 ? (Math.floor(ghost * 10) % 2 ? .3 : 1) : 1;
        const carY = H() - 90;
        items = items.filter(it => {
          it.y += speed * dt; it.el.style.transform = `translateY(${it.y}px)`;
          if (it.lane === lane && it.y > carY - 40 && it.y < carY + 50) {
            if (it.star) {
              stars++; st.textContent = stars; Core.sfx.ding(); speed += 8;
              it.el.remove(); if (stars >= GOAL) finish(true); return false;
            }
            if (ghost <= 0) {
              lives--; lv.textContent = '❤️'.repeat(lives) + '🤍'.repeat(3 - lives);
              Core.sfx.bonk(); ghost = 1.2;
              it.el.remove(); if (lives <= 0) finish(false); return false;
            }
          }
          if (it.y > H() + 20) { it.el.remove(); return false; }
          return true;
        });
        raf = requestAnimationFrame(loop);
      }
      raf = requestAnimationFrame(loop);

      function finish(win) {
        over = true; cancelAnimationFrame(raf);
        Core.gameState('carrera').played++; Core.addStar();
        if (win) Core.endScreen(root, `🏁🏆<span>¡Has ganado la carrera!</span>`, '¡Has ganado la carrera! ¡Campeón!', play, exit);
        else Core.endScreen(root, `🏎️⭐<span>¡${stars} estrellas!</span>`, `¡Muy bien! Has cogido ${stars} estrellas. ¿Otra carrera?`, play, exit);
      }
    }
    play();
    return () => { alive = false; cancelAnimationFrame(raf); };
  }
});
