/* Carrera: el coche cambia de carril tocando a la izquierda o a la derecha de la pantalla.
   Objetivo: coger 15 estrellas. Chocar no quita nada: el coche da un bote, se frena un poco y seguimos. */
Games.push({
  id: 'carrera', section: 'recreo',
  name: 'Carrera', emoji: '🏎️', color: '#555b6e',
  learns: 'Reflejos, anticipación y lateralidad (izquierda / derecha).',
  badge: s => s.wins ? `🏁 ${s.wins}` : '',
  start(root, exit) {
    const GOAL = 15, LANES = [1 / 6, 3 / 6, 5 / 6], BASE_SPEED = 220;
    let raf, alive = true, over = false, currentTap = null;

    function play() {
      cancelAnimationFrame(raf);
      let lane = 1, stars = 0, speed = BASE_SPEED, items = [], ghost = 0, spawnIn = 0.6;
      over = false;
      root.innerHTML = `<div class="hud"><span>⭐ <b id="st">0</b> / ${GOAL}</span><div class="goalbar"><div id="bar"></div></div><span>🏁</span></div>
        <div class="play road" id="road">
          <div class="lane" style="left:calc(33.3% - 3px)"></div><div class="lane" style="left:calc(66.6% - 3px)"></div>
          <div class="sprite car" id="car">🏎️</div></div>`;
      const road = root.querySelector('#road'), car = root.querySelector('#car');
      const st = root.querySelector('#st'), bar = root.querySelector('#bar');
      Core.say('Toca a la izquierda o a la derecha para mover el coche. ¡Coge quince estrellas!');

      const W = () => road.clientWidth, H = () => road.clientHeight;
      const placeCar = () => { car.style.left = (LANES[lane] * W() - 34) + 'px'; car.style.top = (H() - 90) + 'px'; };
      placeCar();

      // Se puede tocar en cualquier parte de la pantalla, no solo en la carretera.
      const onTap = e => {
        if (over) return;
        e.preventDefault();
        const nl = e.clientX < window.innerWidth / 2 ? Math.max(0, lane - 1) : Math.min(2, lane + 1);
        if (nl !== lane) { lane = nl; placeCar(); Core.sfx.whoosh(); }
      };
      if (currentTap) root.removeEventListener('pointerdown', currentTap);
      currentTap = onTap; root.addEventListener('pointerdown', onTap);

      function spawn() {
        const star = Math.random() < 0.5;
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
        spawnIn -= dt; if (spawnIn <= 0) { spawn(); spawnIn = Math.max(0.5, 1.1 - stars * 0.03); }
        ghost = Math.max(0, ghost - dt);
        car.style.opacity = ghost > 0 ? (Math.floor(ghost * 10) % 2 ? .35 : 1) : 1;
        const carY = H() - 90;
        items = items.filter(it => {
          it.y += speed * dt; it.el.style.transform = `translateY(${it.y}px)`;
          if (it.lane === lane && it.y > carY - 40 && it.y < carY + 50) {
            if (it.star) {
              stars++; st.textContent = stars; bar.style.width = (100 * stars / GOAL) + '%';
              Core.sfx.ding(); speed += 8;
              it.el.remove(); if (stars >= GOAL) finish(); return false;
            }
            if (ghost <= 0) {
              // Choque: bote, sonido y se pierde la velocidad extra. Nada más.
              Core.sfx.bonk(); ghost = 1.2; speed = BASE_SPEED;
              car.classList.remove('crash'); void car.offsetWidth; car.classList.add('crash');
              it.el.remove(); return false;
            }
          }
          if (it.y > H() + 20) { it.el.remove(); return false; }
          return true;
        });
        raf = requestAnimationFrame(loop);
      }
      raf = requestAnimationFrame(loop);

      function finish() {
        over = true; cancelAnimationFrame(raf);
        root.removeEventListener('pointerdown', onTap);
        const g = Core.gameState('carrera'); g.played++; g.wins = (g.wins || 0) + 1; Core.addStar();
        Core.endScreen(root, `🏁🏆<span>¡Has ganado la carrera!</span>`, '¡Has ganado la carrera! ¡Campeón!', play, exit);
      }
    }
    play();
    return () => { alive = false; over = true; cancelAnimationFrame(raf); if (currentTap) root.removeEventListener('pointerdown', currentTap); };
  }
});
