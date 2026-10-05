/* Pilla al cerdito: los animales asoman por los agujeros y hay que tocarlos antes de que se escondan.
   El lobo no se toca (pequeño reto de control inhibitorio, sin quitar puntos: solo hace "bonk"). */
Games.push({
  id: 'topo', section: 'recreo',
  name: 'Pilla al cerdito', emoji: '🐽', color: '#c46a2b',
  learns: 'Reflejos y atención: tocar los cerditos y no tocar al lobo.',
  start(root, exit) {
    const TIME = 40;
    let timers = [], alive = true;
    const clearAll = () => { timers.forEach(clearTimeout); timers = []; };

    function play() {
      clearAll();
      let score = 0, left = TIME, stayMs = 1300, gapMs = 800, seq = 0;
      root.innerHTML = `<div class="hud"><span>🐽 <b id="sc">0</b></span><span>⏱️ <b id="tm">${TIME}</b></span></div>
        <div class="play" style="background:linear-gradient(#9be15d,#6fbf3b)"><div class="holes"></div></div>`;
      const holesEl = root.querySelector('.holes'), sc = root.querySelector('#sc'), tm = root.querySelector('#tm');
      Core.say('¡Toca los cerditos! Pero al lobo no.');

      const holes = Array.from({ length: 9 }, () => {
        const h = Core.el('<div class="hole"><div class="who"></div></div>');
        h.addEventListener('pointerdown', e => {
          e.preventDefault();
          if (!h.classList.contains('up') || h.dataset.hit) return;
          h.dataset.hit = '1'; h.classList.add('hit');
          if (h.dataset.kind === 'wolf') { Core.sfx.bonk(); Core.say('¡Uy, el lobo!'); }
          else {
            const pts = h.dataset.kind === 'gold' ? 3 : 1;
            score += pts; sc.textContent = score;
            pts > 1 ? (Core.sfx.ding(), Core.celebrate()) : Core.sfx.pop();
            stayMs = Math.max(650, stayMs - 15); gapMs = Math.max(350, gapMs - 10);
          }
          timers.push(setTimeout(() => down(h), 200));
        });
        holesEl.appendChild(h); return h;
      });

      function down(h) { h.classList.remove('up', 'hit'); delete h.dataset.hit; }

      function popUp() {
        if (!alive || left <= 0) return;
        const free = holes.filter(h => !h.classList.contains('up'));
        if (free.length) {
          const h = Core.pick(free), r = Math.random();
          const kind = r < 0.15 ? 'wolf' : r < 0.22 ? 'gold' : 'pig';
          h.dataset.kind = kind;
          h.querySelector('.who').textContent = { wolf: '🐺', gold: '🌟', pig: Core.pick(['🐷', '🐷', '🐽']) }[kind];
          h.classList.add('up');
          const tok = String(++seq); h.dataset.tok = tok;
          timers.push(setTimeout(() => { if (h.dataset.tok === tok) down(h); }, stayMs));
        }
        timers.push(setTimeout(popUp, gapMs));
      }
      popUp();

      const tick = () => {
        if (!alive) return;
        left--; tm.textContent = left;
        if (left <= 0) return finish();
        timers.push(setTimeout(tick, 1000));
      };
      timers.push(setTimeout(tick, 1000));

      function finish() {
        clearAll();
        const g = Core.gameState('topo'); g.played++; g.best = Math.max(g.best || 0, score);
        Core.addStar();
        const record = score >= g.best ? '<small>¡Récord!</small>' : `<small>Récord: ${g.best}</small>`;
        Core.endScreen(root, `🐷🏆<span>¡${score} cerditos!</span>${record}`, `¡Has pillado ${score} cerditos!`, play, exit);
      }
    }
    play();
    return () => { alive = false; clearAll(); };
  }
});
