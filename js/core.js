/* Núcleo compartido: voz, progreso, nivel adaptativo, celebración y motor de preguntas. */
const Core = (() => {
  const ROUND_SIZE = 5;

  // ---------- Persistencia: delega en Store (perfil activo + ajustes del dispositivo) ----------
  const P = () => Store.profile;
  function save() { Store.save(); }

  function gameState(id) {
    const state = P();
    if (!state.games[id]) state.games[id] = { level: 1, streak: 0, misses: 0, played: 0, firstTry: 0, answered: 0 };
    return state.games[id];
  }

  function addStar() {
    const state = P();
    state.stars++; save();
    document.getElementById('star-count').textContent = state.stars;
  }

  const PRAISE = ['¡Muy bien!', '¡Genial!', '¡Lo has conseguido!', '¡Bravo!', '¡Qué listo!', '¡Fenomenal!'];
  const RETRY  = ['Casi. Prueba otra vez.', 'Uy, esa no. ¡Tú puedes!', 'Mira bien y vuelve a probar.'];

  // ---------- Voz (Web Speech API, es-ES) ----------
  let voice = null;
  // Puntúa las voces instaladas: primero español de España y calidad alta; fuera las voces "robot".
  const plain = t => (t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function voiceScore(v) {
    const lang = (v.lang || '').replace('_', '-').toLowerCase();
    if (!lang.startsWith('es')) return -1;
    const id = plain(v.name) + ' ' + plain(v.voiceURI);
    let sc = lang === 'es-es' ? 100 : 50;
    if (/premium/.test(id)) sc += 40;
    if (/natural|neural|online/.test(id)) sc += 35;
    if (/enhanced|mejorada/.test(id)) sc += 30;
    if (/google/.test(id)) sc += 25;
    if (/monica|marisol|elvira|lucia|helena|laura|paulina/.test(id)) sc += 10;
    if (/compact/.test(id)) sc -= 5;
    // Voces sintéticas antiguas y de broma de iOS/macOS: suenan a robot.
    if (/eloquence|speech\.synthesis|eddy|flo\b|grandma|grandpa|reed|rocko|sandy|shelley|abuel/.test(id)) sc -= 90;
    return sc;
  }
  function spanishVoices() {
    if (!('speechSynthesis' in window)) return [];
    return speechSynthesis.getVoices().map(v => ({ v, sc: voiceScore(v) })).filter(x => x.sc >= 0).sort((a, b) => b.sc - a.sc).map(x => x.v);
  }
  function pickVoice() {
    const vs = spanishVoices();
    voice = vs.find(v => v.voiceURI === Store.device.voiceURI) || vs[0] || null;
  }
  function setVoice(uri) { Store.device.voiceURI = uri || ''; save(); pickVoice(); }
  if ('speechSynthesis' in window) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }
  let sayTimer = null;
  function say(text) {
    if (!('speechSynthesis' in window) || !text) return;
    const u = new SpeechSynthesisUtterance(text);
    if (!voice) pickVoice();   // en iOS la lista de voces puede llegar tarde y sin avisar
    // Tono natural (subirlo artificialmente la hace sonar rara) y un pelín más despacio.
    u.lang = voice ? voice.lang : 'es-ES'; u.rate = 0.95; u.pitch = 1;
    if (voice) u.voice = voice;
    clearTimeout(sayTimer);
    // iOS Safari pierde la frase si se llama a speak() justo después de cancel(): pequeña espera.
    if (speechSynthesis.speaking || speechSynthesis.pending) {
      speechSynthesis.cancel();
      sayTimer = setTimeout(() => speechSynthesis.speak(u), 80);
    } else {
      speechSynthesis.speak(u);
    }
  }

  // Nombre del niño (opcional, se pone en la zona de padres).
  const getName = () => (P().name || '').trim();
  function setName(n) { P().name = (n || '').trim().slice(0, 20); save(); }
  // Elogio, a veces con el nombre.
  const praise = () => { const n = getName(); return pick(PRAISE) + (n && Math.random() < 0.35 ? ` ¡${n}!` : ''); };

  // ---------- Utilidades ----------
  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sample = (arr, n) => shuffle(arr).slice(0, n);
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };


  function celebrate(big = false) {
    const c = document.getElementById('celebration');
    c.hidden = false; c.textContent = big ? '🏆' : '⭐';
    c.style.animation = 'none'; void c.offsetWidth; c.style.animation = '';
    setTimeout(() => (c.hidden = true), 1200);
    const n = big ? 30 : 10;
    for (let i = 0; i < n; i++) {
      const f = document.createElement('div');
      f.className = 'confetti';
      f.textContent = pick(['🎉', '⭐', '🎈', '✨', '🟡', '🔵', '🔴']);
      f.style.left = Math.random() * 100 + 'vw';
      f.style.animationDelay = Math.random() * .4 + 's';
      document.body.appendChild(f);
      setTimeout(() => f.remove(), 2000);
    }
  }

  // ---------- Nivel adaptativo ----------
  // 3 aciertos seguidos a la primera => sube nivel. 2 preguntas seguidas con fallos => baja.
  function registerAnswer(id, firstTry, maxLevel) {
    const g = gameState(id);
    g.answered++;
    if (firstTry) {
      g.firstTry++; g.streak++; g.misses = 0;
      if (g.streak >= 3 && g.level < maxLevel) { g.level++; g.streak = 0; }
    } else {
      g.streak = 0; g.misses++;
      if (g.misses >= 2 && g.level > 1) { g.level--; g.misses = 0; }
    }
    save();
  }

  // ---------- Motor genérico de preguntas de opción múltiple ----------
  // game = { id, maxLevel, makeQuestion(level) -> { say, text, stage (html|node), options:[{html, value, sayLabel}], answer } }
  function runQuiz(root, game, onExit) {
    let qIndex = 0;
    const g = gameState(game.id);

    const BLOCKS = ['#ec5b7c', '#f09a3e', '#5fbb6d', '#4f9bf5', '#9b6cf2'];
    const isShort = h => typeof h === 'number' || (typeof h === 'string' && h.length <= 2 && !h.includes('<'));

    function next() {
      if (qIndex >= ROUND_SIZE) return finish();
      const q = game.makeQuestion(gameState(game.id).level);
      let errors = 0, locked = false;

      root.innerHTML = `<div class="progress">${Array.from({ length: ROUND_SIZE }, (_, i) => `<span class="${i < qIndex ? 'on' : ''}">★</span>`).join('')}</div>`;
      const prompt = el(`<div class="prompt"><button class="speak-btn" aria-label="Repetir">🔊</button><span>${q.text}</span></div>`);
      prompt.querySelector('button').onclick = () => say(q.say);
      root.appendChild(prompt);

      const stage = el('<div class="stage"></div>');
      if (typeof q.stage === 'string') stage.innerHTML = q.stage; else if (q.stage) stage.appendChild(q.stage);
      if (q.stage) root.appendChild(stage);

      const buddy = el(`<div class="buddy">${Mascot.svg()}</div>`);
      const opts = el('<div class="options"></div>');
      const off = rand(0, 4);
      q.options.forEach((o, i) => {
        const b = el(`<button class="opt${isShort(o.html) ? ' blk' : ''}" style="--b:${BLOCKS[(i + off) % 5]}">${o.html}</button>`);
        b.onclick = () => {
          if (locked || b.classList.contains('wrong')) return;
          if (o.value === q.answer) {
            locked = true;
            b.classList.add('right');
            registerAnswer(game.id, errors === 0, game.maxLevel);
            if (errors === 0) addStar();
            celebrate(); sfx.ding(); Mascot.mood(buddy, 'joy');
            const st = root.querySelectorAll('.progress span')[qIndex]; if (st) st.classList.add('on', 'new');
            say(praise() + (q.explain ? ' ' + q.explain : ''));
            qIndex++;
            setTimeout(next, q.explain ? 2600 : 1500);
          } else {
            errors++;
            b.classList.add('wrong'); Mascot.mood(buddy, 'wow', 1300);
            if (o.sayLabel) say(`Eso es ${o.sayLabel}. ${pick(RETRY)}`); else say(pick(RETRY));
            // Tras dos fallos, se ilumina la correcta: nunca se queda atascado.
            if (errors >= 2) [...opts.children].forEach((btn, i) => { if (q.options[i].value === q.answer) btn.classList.add('hint'); });
          }
        };
        opts.appendChild(b);
      });
      root.appendChild(opts);
      root.appendChild(buddy);
      setTimeout(() => say(q.say), 250);
    }

    function finish() {
      g.played++; save();
      endScreen(root, '<span>¡Has terminado!</span>', '¡Has terminado! ¿Jugamos otra vez?', () => { qIndex = 0; next(); }, onExit);
    }

    next();
  }

  // ---------- Efectos de sonido sintetizados (sin archivos de audio) ----------
  let actx = null;
  function tone(freq, dur = 0.15, type = 'sine', vol = 0.25, slideTo = null, delay = 0) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      const t = actx.currentTime + delay;
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch {}
  }
  // iOS solo arranca el audio dentro de un gesto del usuario: se llama en el primer toque/click.
  function unlockAudio() {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      const b = actx.createBuffer(1, 1, 22050), src = actx.createBufferSource();
      src.buffer = b; src.connect(actx.destination); src.start(0);
    } catch {}
  }
  const sfx = {
    pop:   () => tone(700, 0.12, 'triangle', 0.3, 1400),
    ding:  () => { tone(880, 0.12, 'sine', 0.25); tone(1320, 0.2, 'sine', 0.2, null, 0.1); },
    bonk:  () => tone(180, 0.25, 'square', 0.15, 70),
    whoosh:() => tone(300, 0.2, 'sawtooth', 0.06, 900),
    fanfare: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'triangle', 0.22, null, i * 0.12)),
    note:  (f) => tone(f, 0.5, 'triangle', 0.3)
  };

  // Pantalla de fin reutilizable para los juegos de recreo.
  function endScreen(root, html, phrase, again, exit) {
    celebrate(true); sfx.fanfare(); say(phrase);
    root.innerHTML = `<div class="endcard">
        <div class="end-stars"><span>⭐</span><span>⭐</span><span>⭐</span></div>
        <div class="end-mascot">${Mascot.svg('joy')}</div>
        <div class="end-title">${html}</div>
        <div class="end-btns"><button class="round again" id="again" aria-label="Otra vez">🔁</button><button class="round home" id="out" aria-label="Salir">🏠</button></div></div>`;
    root.querySelector('#again').onclick = again;
    root.querySelector('#out').onclick = exit;
  }

  return { say, spanishVoices, setVoice, get voiceURI() { return voice ? voice.voiceURI : ''; }, save, praise, getName, setName, unlockAudio, rand, sfx, tone, endScreen, pick, shuffle, sample, el, celebrate, addStar, gameState, registerAnswer, runQuiz, PRAISE, RETRY,
           get state() { return P(); }, reset() { Store.resetProgress(); } };
})();

const Games = [];
