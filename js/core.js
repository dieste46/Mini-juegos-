/* Núcleo compartido: voz, progreso, nivel adaptativo, celebración y motor de preguntas. */
const Core = (() => {
  const STORE_KEY = 'juegos-peque-v1';
  const ROUND_SIZE = 5;

  // ---------- Persistencia (solo en este dispositivo) ----------
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || { stars: 0, games: {} }; }
    catch { return { stars: 0, games: {} }; }
  }
  let state = load();
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch {} }

  function gameState(id) {
    if (!state.games[id]) state.games[id] = { level: 1, streak: 0, misses: 0, played: 0, firstTry: 0, answered: 0 };
    return state.games[id];
  }

  function addStar() {
    state.stars++; save();
    document.getElementById('star-count').textContent = state.stars;
  }

  // ---------- Voz (Web Speech API, es-ES) ----------
  let voice = null;
  function pickVoice() {
    const vs = speechSynthesis.getVoices();
    voice = vs.find(v => v.lang === 'es-ES' && /google|mónica|monica|lucia|elvira/i.test(v.name))
         || vs.find(v => v.lang === 'es-ES')
         || vs.find(v => v.lang.startsWith('es')) || null;
  }
  if ('speechSynthesis' in window) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }
  function say(text) {
    if (!('speechSynthesis' in window) || !text) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-ES'; u.rate = 0.9; u.pitch = 1.1;
    if (voice) u.voice = voice;
    speechSynthesis.speak(u);
  }

  // ---------- Utilidades ----------
  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sample = (arr, n) => shuffle(arr).slice(0, n);
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

  const PRAISE = ['¡Muy bien!', '¡Genial!', '¡Lo has conseguido!', '¡Bravo!', '¡Qué listo!', '¡Fenomenal!'];
  const RETRY  = ['Casi. Prueba otra vez.', 'Uy, esa no. ¡Tú puedes!', 'Mira bien y vuelve a probar.'];

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

    function renderProgress() {
      return `<div class="progress">${Array.from({ length: ROUND_SIZE }, (_, i) => `<span class="${i < qIndex ? 'on' : ''}"></span>`).join('')}</div>`;
    }

    function next() {
      if (qIndex >= ROUND_SIZE) return finish();
      const q = game.makeQuestion(gameState(game.id).level);
      let errors = 0, locked = false;

      root.innerHTML = '';
      const prompt = el(`<div class="prompt"><button class="speak-btn" aria-label="Repetir">🔊</button><span>${q.text}</span></div>`);
      prompt.querySelector('button').onclick = () => say(q.say);
      root.appendChild(prompt);

      const stage = el('<div class="stage"></div>');
      if (typeof q.stage === 'string') stage.innerHTML = q.stage; else if (q.stage) stage.appendChild(q.stage);
      if (q.stage) root.appendChild(stage);

      const opts = el('<div class="options"></div>');
      q.options.forEach(o => {
        const b = el(`<button class="opt">${o.html}</button>`);
        b.onclick = () => {
          if (locked || b.classList.contains('wrong')) return;
          if (o.value === q.answer) {
            locked = true;
            b.classList.add('right');
            registerAnswer(game.id, errors === 0, game.maxLevel);
            if (errors === 0) addStar();
            celebrate(); sfx.ding();
            say(pick(PRAISE) + (q.explain ? ' ' + q.explain : ''));
            qIndex++;
            setTimeout(next, q.explain ? 2600 : 1500);
          } else {
            errors++;
            b.classList.add('wrong');
            if (o.sayLabel) say(`Eso es ${o.sayLabel}. ${pick(RETRY)}`); else say(pick(RETRY));
            // Tras dos fallos, se ilumina la correcta: nunca se queda atascado.
            if (errors >= 2) [...opts.children].forEach((btn, i) => { if (q.options[i].value === q.answer) btn.classList.add('hint'); });
          }
        };
        opts.appendChild(b);
      });
      root.appendChild(opts);
      root.insertAdjacentHTML('beforeend', renderProgress());
      setTimeout(() => say(q.say), 250);
    }

    function finish() {
      g.played++; save();
      celebrate(true); sfx.fanfare();
      say('¡Has terminado! ¿Jugamos otra vez?');
      root.innerHTML = `
        <div class="prompt" style="flex-direction:column;font-size:2rem">🏆<span>¡Has terminado!</span></div>
        <div class="options">
          <button class="opt" id="again">🔁</button>
          <button class="opt" id="out">🏠</button>
        </div>`;
      root.querySelector('#again').onclick = () => { qIndex = 0; next(); };
      root.querySelector('#out').onclick = onExit;
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
    root.innerHTML = `<div class="prompt" style="flex-direction:column;font-size:2rem">${html}</div>
      <div class="options"><button class="opt" id="again">🔁</button><button class="opt" id="out">🏠</button></div>`;
    root.querySelector('#again').onclick = again;
    root.querySelector('#out').onclick = exit;
  }

  return { say, rand, sfx, tone, endScreen, pick, shuffle, sample, el, celebrate, addStar, gameState, registerAnswer, runQuiz, PRAISE, RETRY,
           get state() { return state; }, reset() { state = { stars: 0, games: {} }; save(); } };
})();

const Games = [];
