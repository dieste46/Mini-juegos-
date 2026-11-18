/* Piano: ocho teclas con cara que cantan al tocarlas.
   - Libre: cada tecla suena y suelta notas de colores.
   - Canciones: las notas caen por su carril y la de abajo ESPERA sobre su tecla hasta que él la toca
     (sin ritmo que cumplir ni forma de fallar: una tecla equivocada simplemente suena).
   - Oreja: la canción se toca sola para escucharla. */
Games.push({
  id: 'piano', section: 'recreo',
  name: 'Piano', emoji: '🎹', art: () => 'piano', color: '#2f80ff',
  learns: 'Música, memoria auditiva y seguir una secuencia.',
  badge: s => s.songs ? `🎵 ${s.songs}` : '',
  start(root, exit) {
    const FREQ = [262, 294, 330, 349, 392, 440, 494, 523];
    const COLORS = ['#e8323c', '#ff8a1c', '#f2b705', '#2ebd6b', '#00b4c6', '#2f80ff', '#8e4ad8', '#ff6fa5'];
    const ICONS = Themes.set('piano');
    // Canciones como índices de tecla (0 = do ... 7 = do agudo)
    const SONGS = [
      ['⭐', 'Estrellita', [0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0]],
      ['🐥', 'Los pollitos dicen', [0, 1, 2, 3, 4, 4, 5, 5, 5, 5, 4, 3, 3, 3, 3, 2, 2, 1, 1, 1, 1, 0]],
      ['🔔', 'Fray Santiago', [0, 1, 2, 0, 0, 1, 2, 0, 2, 3, 4, 2, 3, 4]],
      ['🎻', 'Himno de la alegría', [2, 2, 3, 4, 4, 3, 2, 1, 0, 0, 1, 2, 2, 1, 1]]
    ];
    const GAP = 62;
    const FACE = `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="12" cy="14" r="6" fill="#fff"/><circle cx="28" cy="14" r="6" fill="#fff"/>
      <circle cx="13" cy="15" r="2.8" fill="#2d2552"/><circle cx="29" cy="15" r="2.8" fill="#2d2552"/>
      <path class="m-closed" d="M12 28 Q20 35 28 28" stroke="#2d2552" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <ellipse class="m-open" cx="20" cy="30" rx="7" ry="8" fill="#2d2552"/></svg>`;
    let song = null, done = 0, shown = 0, noteEls = [], raf = 0, demo = null, alive = true, endT = null;

    root.innerHTML = `<div class="paint-bar" id="songs"></div>
      <div class="play piano"><div class="fall">${COLORS.map((c, i) => `<i class="lane" style="left:${i * 12.5}%;--k:${c}"></i>`).join('')}</div><div class="pkeys"></div></div>`;
    const fall = root.querySelector('.fall'), keysEl = root.querySelector('.pkeys'), songsEl = root.querySelector('#songs');
    Core.say('¡Toca las teclas! O elige una canción y toca las notas que caen.');

    const keys = FREQ.map((f, i) => {
      const b = Core.el(`<button class="pkey" style="--k:${COLORS[i]}"><span class="ic">${ICONS[i]}</span>${FACE}</button>`);
      b.addEventListener('pointerdown', e => { e.preventDefault(); press(i, true); });
      keysEl.appendChild(b); return b;
    });

    function press(i, byHand) {
      Core.tone(FREQ[i], 0.55, 'triangle', 0.28); Core.tone(FREQ[i] * 2, 0.3, 'sine', 0.07);
      const b = keys[i]; b.classList.add('on'); setTimeout(() => b.classList.remove('on'), 200);
      const n = Core.el(`<span class="rise" style="left:${i * 12.5 + 6.25}%;color:${COLORS[i]}">${Core.pick(['♪', '♫', '♪'])}</span>`);
      fall.appendChild(n); setTimeout(() => n.remove(), 1100);
      if (song && done < song.length && song[done] === i) hit();
      else if (byHand && song && done < song.length) { const h = keys[song[done]]; h.classList.remove('nudge'); void h.offsetWidth; h.classList.add('nudge'); }
    }

    // ---------- Canción con notas que caen ----------
    function hint() { keys.forEach((k, i) => k.classList.toggle('hint', !!song && done < song.length && song[done] === i)); }
    function startSong(idx, auto) {
      stopSong();
      const [icon, name, notes] = SONGS[idx];
      song = notes; done = 0; shown = -7;
      noteEls = notes.map((k, i) => { const e = Core.el(`<span class="fnote" style="left:${k * 12.5 + 6.25}%;--k:${COLORS[k]}">♪</span>`); fall.appendChild(e); return e; });
      songsEl.querySelectorAll('.pbtn').forEach((b, j) => b.classList.toggle('on', j === idx));
      songsEl.querySelector('#ear').classList.toggle('on', !!auto);
      Core.say(auto ? name : `${name}. Toca la tecla que brilla.`);
      hint(); song.idx = idx;
      if (auto) demo = setInterval(() => { if (song && done < song.length) press(song[done], false); }, 430);
      cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    }
    function stopSong() {
      clearInterval(demo); demo = null; clearTimeout(endT);
      noteEls.forEach(e => e.remove()); noteEls = []; song = null;
      songsEl.querySelectorAll('.pbtn').forEach(b => b.classList.remove('on')); hint();
    }
    function hit() {
      const e = noteEls[done]; e.classList.add('boom'); setTimeout(() => e.remove(), 350);
      done++; hint();
      if (done >= song.length) {
        const wasDemo = !!demo; clearInterval(demo); demo = null;
        endT = setTimeout(() => {
          if (!alive) return;
          if (!wasDemo) {
            const g = Core.gameState('piano'); g.songs = (g.songs || 0) + 1; Core.addStar();
            Core.celebrate(true); Core.sfx.fanfare(); Core.say(`¡Has tocado ${SONGS[song.idx][1]}! ¡Qué artista!`);
          }
          stopSong();
        }, 500);
      }
    }
    let last = performance.now();
    function loop(now) {
      if (!alive || !song) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      shown += (done - shown) * Math.min(1, dt * 9);
      noteEls.forEach((e, i) => { if (i >= done) e.style.bottom = (8 + (i - shown) * GAP) + 'px'; e.classList.toggle('wait', i === done && Math.abs(done - shown) < 0.15); });
      raf = requestAnimationFrame(loop);
    }

    SONGS.forEach(([icon, name], idx) => { const b = Core.el(`<button class="pbtn" aria-label="${name}">${icon}</button>`); b.onclick = () => startSong(idx, false); songsEl.appendChild(b); });
    const ear = Core.el('<button class="pbtn" id="ear" aria-label="Escuchar">👂</button>');
    ear.onclick = () => startSong(song ? song.idx : 0, true); songsEl.appendChild(ear);
    const free = Core.el('<button class="pbtn" aria-label="Tocar libre">✋</button>');
    free.onclick = () => { stopSong(); Core.say('Toca lo que quieras.'); }; songsEl.appendChild(free);

    Core.gameState('piano').played++; Core.save();
    return () => { alive = false; clearInterval(demo); clearTimeout(endT); cancelAnimationFrame(raf); };
  }
});
