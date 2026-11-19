/* Repite con Bip (el Simón de toda la vida): Bip enciende una secuencia de luces con su sonido y hay que repetirla.
   Cada ronda añade un paso. Equivocarse no hace perder: Bip la repite más despacio y, a la segunda,
   va marcando el botón que toca (pista). Cinco rondas y se acaba, para cortar cuando aún quiere más.
   No tiene tarjeta propia en el menú: se entra desde Tres en raya (hidden). */
{
  const PADS = [['#FF5FA2', 262, 'circle'], ['#FFD23F', 330, 'star'], ['#5BE38C', 392, 'square'], ['#35D6E6', 523, 'tri']];
  const SHAPE = {
    circle: '<circle cx="50" cy="50" r="27"/>', square: '<rect x="25" y="25" width="50" height="50" rx="11"/>', tri: '<path d="M50 21 L82 75 H18 Z" stroke-linejoin="round"/>',
    star: '<path d="M50 18 L59 40 L83 42 L64 57 L70 80 L50 67 L30 80 L36 57 L17 42 L41 40 Z" stroke-linejoin="round"/>'
  };
  const icon = () => `<span class="simon-ico">${PADS.map(p => `<i style="background:${p[0]}"></i>`).join('')}</span>`;

  Games.push({
    id: 'simon', section: 'recreo', hidden: true, icon,
    name: 'Repite con Bip', emoji: '🎵', color: '#B79CFF',
    learns: 'Memoria de trabajo: recordar y repetir una secuencia que va creciendo.',
    badge: s => s.best ? `🎵 ${s.best}` : '',
    start(root, exit) {
      const g = Core.gameState('simon'), ROUNDS = 5;
      let timers = [], alive = true, fxo = null, saidTurn = false;
      const later = (fn, ms) => { const id = setTimeout(() => alive && fn(), ms); timers.push(id); return id; };
      const clear = () => { timers.forEach(clearTimeout); timers = []; if (fxo) { fxo.destroy(); fxo = null; } };

      function play() {
        clear();
        let seq = [], pos = 0, misses = 0, clean = true, done = 0, phase = 'show', guided = false;
        root.innerHTML = `<div class="simon-top"><span class="simon-bip">${Mascot.svg()}</span><span class="simon-say">👀</span><div class="simon-dots"></div><button class="speak-btn" id="sp">🔊</button></div>
          <div class="simon-wrap"><div class="simon-pads">${PADS.map(([c, , s], i) => `<button class="spad" data-i="${i}" style="--c:${c}" aria-label="Botón ${i + 1}"><svg viewBox="0 0 100 100" aria-hidden="true">${SHAPE[s]}</svg></button>`).join('')}</div></div>`;
        const pads = [...root.querySelectorAll('.spad')], wrap = root.querySelector('.simon-wrap'), bip = root.querySelector('.simon-bip');
        const dotsEl = root.querySelector('.simon-dots'), sayEl = root.querySelector('.simon-say');
        fxo = Fx.overlay(wrap);
        const intro = () => Core.say(`Mira lo que hace ${Mascot.NAME} y luego repítelo tú, en el mismo orden.`);
        root.querySelector('#sp').onclick = intro; intro();

        const flash = (i, ms) => { pads[i].classList.add('on'); Core.tone(PADS[i][1], ms / 1000, 'triangle', 0.3); later(() => pads[i].classList.remove('on'), ms); };
        const dots = () => { dotsEl.innerHTML = seq.map((_, k) => `<i class="${k < pos ? 'on' : ''}"></i>`).join(''); };
        const hint = () => pads.forEach((p, i) => p.classList.toggle('next', guided && phase === 'play' && i === seq[pos]));

        // Bip enseña la secuencia; después le toca al niño
        function show(slow) {
          phase = 'show'; pos = 0; dots(); hint(); wrap.classList.add('watch'); sayEl.textContent = '👀'; Mascot.mood(bip, 'wow');
          const step = slow ? 950 : Math.max(520, 800 - seq.length * 40);
          seq.forEach((p, k) => later(() => flash(p, step * 0.6), 900 + k * step));
          later(() => {
            phase = 'play'; wrap.classList.remove('watch'); sayEl.textContent = '👉'; Mascot.mood(bip, 'happy'); hint();
            if (!saidTurn) { saidTurn = true; Core.say('¡Te toca!'); }
          }, 900 + seq.length * step);
        }
        function next() {
          let n; do { n = Core.rand(0, 3); } while (seq.length >= 2 && seq[seq.length - 1] === n && seq[seq.length - 2] === n);
          seq.push(n); misses = 0; guided = false; clean = true; show(false);
        }

        function tap(i) {
          if (phase !== 'play') return;
          if (i === seq[pos]) {
            flash(i, 280); pos++; dots(); hint();
            if (pos === seq.length) roundWon();
            return;
          }
          // Fallo: sonido suave, sin castigo, y se vuelve a enseñar más despacio
          phase = 'wait'; misses++; clean = false; guided = misses >= 2;
          pads[i].classList.add('nope'); later(() => pads[i].classList.remove('nope'), 420); Core.tone(196, 0.22, 'sine', 0.14);
          Core.say(guided ? 'Te ayudo: toca el que brilla.' : 'Casi. Mira otra vez.');
          later(() => show(true), 1500);
        }

        function roundWon() {
          phase = 'wait'; done++; hint();
          if (clean) { Core.addStar(); if (seq.length > (g.best || 0)) g.best = seq.length; }
          Core.save(); Core.sfx.ding(); Mascot.mood(bip, 'joy', 1100); sayEl.textContent = '🎉';
          pads.forEach((p, i) => later(() => { const [x, y] = fxo.at(p); fxo.burst(x, y, { n: 8, shape: 'star', colors: [PADS[i][0], '#FFFFFF'], speed: 240, gravity: 360, size: 9, life: 0.6 }); }, i * 70));
          later(() => (done >= ROUNDS ? finish() : next()), 1400);
        }

        function finish() {
          g.played++; Core.save(); clear();
          Core.endScreen(root, `<div>🎵🏆</div><span>¡Qué memoria!</span>${g.best ? `<small>Tu récord: ${g.best} seguidos</small>` : ''}`, '¡Qué memoria tienes! ¡Lo has repetido todo!', play, exit);
        }

        pads.forEach((p, i) => p.addEventListener('pointerdown', e => { e.preventDefault(); tap(i); }));
        // Quien ya llega lejos empieza con tres pasos; el resto, con dos
        seq = Array.from({ length: (g.best || 0) >= 5 ? 2 : 1 }, () => Core.rand(0, 3));
        later(next, 1600);
      }

      play();
      return () => { alive = false; clear(); };
    }
  });
}
