/* Explota globos: suben globos y hay que tocarlos. Sin penalización por los que se escapan. */
Games.push({
  id: 'globos', section: 'recreo',
  name: 'Globos', emoji: '🎈', art: () => 'globos', color: '#ff4f6d',
  learns: 'Coordinación ojo-mano y rapidez de reacción.',
  start(root, exit) {
    const GOAL = 25;
    const KINDS = ['🎈', '🎈', '🎈', '🎈', '🫧'];
    let raf, spawnT, alive = true, fxo = null;

    function play() {
      let popped = 0, speed = 110, items = [];
      root.innerHTML = `<div class="hud"><span>🎈 <b id="n">0</b> / ${GOAL}</span><button class="speak-btn" id="sp">🔊</button></div><div class="play" id="area">${Themes.set('escena')()}</div>`;
      const area = root.querySelector('#area'), n = root.querySelector('#n'); fxo = Fx.overlay(area);
      const intro = () => Core.say('¡Explota los globos! Si sale uno dorado, vale tres.');
      root.querySelector('#sp').onclick = intro; intro();

      function spawn() {
        const gold = Math.random() < 0.08;
        const s = Core.el(`<div class="sprite balloon">${gold ? '🌟' : Core.pick(KINDS)}</div>`);
        const hue = Core.rand(0, 360);
        if (!gold) s.style.filter = `hue-rotate(${hue}deg) drop-shadow(0 4px 2px rgba(0,0,0,.15))`;
        const it = { el: s, hue, x: Core.rand(5, 80), y: area.clientHeight - 40, v: speed * (0.8 + Math.random() * 0.5), wob: Math.random() * 6, gold };
        s.style.left = it.x + '%';
        s.addEventListener('pointerdown', e => { e.preventDefault(); hit(it); });
        area.appendChild(s); items.push(it);
      }

      function hit(it) {
        if (it.dead) return; it.dead = true;
        const pts = it.gold ? 3 : 1;
        popped = Math.min(GOAL, popped + pts); n.textContent = popped;
        it.gold ? Core.sfx.ding() : Core.sfx.pop();
        const r = it.el.getBoundingClientRect(), a = area.getBoundingClientRect();
        const cx = r.left - a.left + r.width / 2, cy = r.top - a.top + r.height * 0.4, c = `hsl(${(350 + it.hue) % 360} 90% 62%)`;
        fxo.ring(cx, cy, '#FFFFFF', 10, 300, 0.3);
        fxo.burst(cx, cy, it.gold ? { n: 22, shape: 'star', colors: ['#FFD23F', '#FFE98A', '#FFFFFF'], speed: 340, size: 10, life: 0.8 }
                                  : { n: 14, shape: 'shard', colors: [c, c, '#FFFFFF'], speed: 280, size: 9, life: 0.6 });
        const f = Core.el(`<div class="floating" style="left:${r.left - a.left + 20}px;top:${r.top - a.top}px">+${pts}</div>`);
        area.append(f); setTimeout(() => f.remove(), 800);
        it.el.remove();
        speed = 110 + popped * 4; // poco a poco más rápido
        if (it.gold) Core.celebrate();
        if (popped >= GOAL) finish();
      }

      let last = performance.now(), t = 0;
      function loop(now) {
        if (!alive) return;
        const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
        items = items.filter(it => {
          if (it.dead) return false;
          it.y -= it.v * dt;
          it.el.style.transform = `translate(${Math.sin(t * 2 + it.wob) * 10}px, ${it.y}px)`;
          if (it.y < -90) { it.el.remove(); return false; }
          return true;
        });
        raf = requestAnimationFrame(loop);
      }
      raf = requestAnimationFrame(loop);
      clearInterval(spawnT);
      spawnT = setInterval(() => { if (items.length < 7) spawn(); }, 700);
      spawn();

      function finish() {
        clearInterval(spawnT); cancelAnimationFrame(raf);
        Core.addStar(); Core.gameState('globos').played++;
        Core.endScreen(root, `🎈🏆🎈<span>¡${GOAL} globos!</span>`, '¡Has explotado todos los globos! ¡Genial!', () => { raf = 0; play(); }, exit);
      }
    }
    play();
    return () => { alive = false; clearInterval(spawnT); cancelAnimationFrame(raf); };
  }
});
