/* Piano de animales: tocar libre o escuchar una canción que se ilumina en las teclas para imitarla. */
Games.push({
  id: 'piano', section: 'recreo',
  name: 'Piano', emoji: '🎹', color: '#2f80ff',
  learns: 'Música, ritmo y memoria auditiva.',
  start(root, exit) {
    const KEYS = [
      [262, '#e8323c', '🐷'], [294, '#ff8a1c', '🐮'], [330, '#ffd23f', '🐔'], [349, '#2ebd6b', '🐸'],
      [392, '#00b4c6', '🐳'], [440, '#2f80ff', '🐦'], [494, '#8e4ad8', '🐱'], [523, '#ff6fa5', '🐶']
    ];
    // Canciones como índices de tecla (0 = do ... 7 = do agudo)
    const SONGS = {
      '⭐': [0, 0, 4, 4, 5, 5, 4, -1, 3, 3, 2, 2, 1, 1, 0],          // Estrellita
      '🐥': [0, 1, 2, 3, 4, 4, 5, 5, 5, 5, 4, -1, 3, 3, 3, 3, 2, 2, 1, 1, 1, 1, 0], // Los pollitos dicen
      '🐘': [0, 1, 2, 0, 0, 1, 2, 0, 2, 3, 4, -1, 2, 3, 4]           // Frère Jacques
    };
    let timers = [];
    root.innerHTML = `<div class="hud"><span>🎵</span><span id="songs" style="display:flex;gap:8px"></span></div>
      <div class="play" style="background:#fff3d6"><div class="keys"></div></div>`;
    Core.say('¡Toca las teclas! O pulsa una canción para escucharla.');
    const keysEl = root.querySelector('.keys');

    const btns = KEYS.map(([f, c, a]) => {
      const b = Core.el(`<button class="key" style="background:${c}"><span>${a}</span></button>`);
      b.addEventListener('pointerdown', e => { e.preventDefault(); press(b, f); });
      keysEl.appendChild(b); return b;
    });
    function press(b, f) {
      Core.sfx.note(f); b.classList.add('on');
      setTimeout(() => b.classList.remove('on'), 180);
    }
    const songsEl = root.querySelector('#songs');
    Object.entries(SONGS).forEach(([icon, notes]) => {
      const s = Core.el(`<button class="speak-btn" style="background:#8e4ad8">${icon}</button>`);
      s.onclick = () => {
        timers.forEach(clearTimeout); timers = [];
        notes.forEach((k, i) => { if (k >= 0) timers.push(setTimeout(() => press(btns[k], KEYS[k][0]), i * 420)); });
      };
      songsEl.appendChild(s);
    });

    Core.gameState('piano').played++;
    return () => timers.forEach(clearTimeout);
  }
});
