/* ¡Pilla, pilla!: los personajes del tema asoman por los agujeros y hay que tocarlos antes de que se escondan.
   Objetivo: pillar 20. Sin reloj. Hay uno que NO se toca (control inhibitorio): si se toca, solo hace "bonk". */
Games.push({
  id: 'topo', section: 'recreo',
  name: '¡Pilla, pilla!', emoji: t => t.sets.pilla.targets[0], color: '#c46a2b',
  learns: 'Reflejos y atención: tocar a los que asoman y no tocar al que no toca.',
  badge: s => s.total ? `🏅 ${s.total}` : '',
  start(root, exit) {
    const GOAL = 20, T = Themes.set('pilla');
    let timers = [], alive = true;
    const clearAll = () => { timers.forEach(clearTimeout); timers = []; };

    function play() {
      clearAll();
      const g = Core.gameState('topo');
      // Empieza más lento cuantas menos partidas lleve; se acelera dentro de la partida.
      let score = 0, stayMs = Math.max(900, 1500 - g.played * 60), gapMs = 900, seq = 0, done = false;
      root.innerHTML = `<div class="hud"><span>${T.targets[0]} <b id="sc">0</b> / ${GOAL}</span><div class="goalbar"><div id="bar"></div></div><span>🏆</span></div>
        <div class="play" style="background:${T.bg};--hole:${T.hole}"><div class="holes"></div></div>`;
      const holesEl = root.querySelector('.holes'), sc = root.querySelector('#sc'), bar = root.querySelector('#bar');
      Core.say(`¡Toca a los ${T.word} cuando asomen! Pero a ${T.avoidName} no. A ver si pillas veinte.`);

      const holes = Array.from({ length: 9 }, () => {
        const h = Core.el('<div class="hole"><div class="who"></div></div>');
        h.addEventListener('pointerdown', e => {
          e.preventDefault();
          if (done || !h.classList.contains('up') || h.dataset.hit) return;
          h.dataset.hit = '1'; h.classList.add('hit');
          if (h.dataset.kind === 'wolf') { Core.sfx.bonk(); Core.say(`¡Uy, ${T.avoidName}! A ese no.`); }
          else {
            const pts = h.dataset.kind === 'gold' ? 3 : 1;
            score = Math.min(GOAL, score + pts); sc.textContent = score; bar.style.width = (100 * score / GOAL) + '%';
            g.total = (g.total || 0) + pts;
            pts > 1 ? (Core.sfx.ding(), Core.celebrate()) : Core.sfx.pop();
            stayMs = Math.max(700, stayMs - 20); gapMs = Math.max(450, gapMs - 15);
            if (score >= GOAL) { done = true; timers.push(setTimeout(finish, 600)); }
          }
          timers.push(setTimeout(() => down(h), 200));
        });
        holesEl.appendChild(h); return h;
      });

      function down(h) { h.classList.remove('up', 'hit'); delete h.dataset.hit; }

      function popUp() {
        if (!alive || done) return;
        const free = holes.filter(h => !h.classList.contains('up'));
        if (free.length) {
          const h = Core.pick(free), r = Math.random();
          const kind = r < 0.15 ? 'wolf' : r < 0.22 ? 'gold' : 'pig';
          h.dataset.kind = kind;
          h.querySelector('.who').textContent = { wolf: T.avoid, gold: T.gold, pig: Core.pick(T.targets) }[kind];
          h.classList.add('up');
          const tok = String(++seq); h.dataset.tok = tok;
          timers.push(setTimeout(() => { if (h.dataset.tok === tok) down(h); }, stayMs));
        }
        timers.push(setTimeout(popUp, gapMs));
      }
      popUp();

      function finish() {
        clearAll();
        g.played++; Core.addStar();
        Core.endScreen(root, `${T.targets[0]}🏆<span>¡Veinte ${T.word}!</span><small>Llevas ${g.total} en total</small>`, `¡Has pillado a los veinte ${T.word}! ¡Qué rápido eres!`, play, exit);
      }
    }
    play();
    return () => { alive = false; clearAll(); };
  }
});
