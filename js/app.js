/* Menú, navegación, zona de padres y protecciones para móvil (iOS). */
(() => {
  const app = document.getElementById('app');
  const title = document.getElementById('title');
  const btnHome = document.getElementById('btn-home');
  document.getElementById('star-count').textContent = Core.state.stars;

  // ---------- Protecciones táctiles ----------
  // Safari iOS ignora user-scalable=no: el pellizco con dos dedos (dos pulgares jugando) hace zoom y se queda.
  // Se bloquean los gestos de zoom por JS y, si aun así la página queda ampliada, se fuerza la vuelta a escala 1.
  const VIEWPORT = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(t =>
    document.addEventListener(t, e => e.preventDefault(), { passive: false }));
  document.addEventListener('touchmove', e => {
    if (e.touches.length > 1 || (e.scale !== undefined && e.scale !== 1)) e.preventDefault();
  }, { passive: false });
  let lastTouchEnd = 0;
  document.addEventListener('touchend', e => {
    const now = Date.now();
    // Doble toque rápido fuera de un botón: evitar el zoom de Safari. En botones ya lo evita touch-action.
    if (now - lastTouchEnd < 350 && !e.target.closest('button')) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });
  let unzoomTimer = null;
  function unzoom() {
    const vv = window.visualViewport;
    if (!vv || vv.scale <= 1.02) return;
    const m = document.querySelector('meta[name=viewport]');
    if (!m) return;
    m.setAttribute('content', VIEWPORT + ', minimum-scale=1');
    setTimeout(() => m.setAttribute('content', VIEWPORT), 60);
  }
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => { clearTimeout(unzoomTimer); unzoomTimer = setTimeout(unzoom, 250); });
  }

  // El audio (efectos y voz) en iOS solo arranca dentro de un toque del usuario.
  const unlock = () => { Core.unlockAudio(); document.removeEventListener('pointerdown', unlock); document.removeEventListener('touchend', unlock); };
  document.addEventListener('pointerdown', unlock);
  document.addEventListener('touchend', unlock);

  // ---------- Menú ----------
  let greeted = false;
  function menu() {
    window.speechSynthesis?.cancel();
    title.textContent = 'Mini Juegos';
    btnHome.hidden = true;
    document.body.classList.remove('in-game');
    const name = Core.getName();
    app.innerHTML = `
      ${name ? `<div class="hello">👋 ¡Hola, ${name}!</div>` : ''}
      <h2 class="section-title">🎮 ¡A jugar!</h2><div class="menu-grid" id="recreo"></div>
      <h2 class="section-title">📚 Aprende jugando</h2><div class="menu-grid" id="aprende"></div>
      <button class="parents-link" id="parents">Zona de padres</button>`;
    Games.forEach(g => {
      const s = Core.gameState(g.id);
      const badge = g.badge ? g.badge(s) : g.maxLevel ? '★'.repeat(s.level) + '☆'.repeat(g.maxLevel - s.level) : '';
      const b = Core.el(`<button class="game-card" style="--c:${g.color}">
          <span class="emoji">${g.emoji}</span><span>${g.name}</span><span class="lvl">${badge}</span></button>`);
      b.onclick = () => { Core.say(g.name); location.hash = g.id; };
      app.querySelector('#' + (g.section || 'aprende')).appendChild(b);
    });
    app.querySelector('#parents').onclick = () => (location.hash = 'padres');
    if (name && !greeted) { greeted = true; setTimeout(() => Core.say(`¡Hola, ${name}! ¿A qué jugamos?`), 300); }
  }

  // ---------- Zona de padres ----------
  function parents() {
    // Puerta sencilla para que el niño no entre por accidente.
    const a = Core.rand(3, 9), b = Core.rand(3, 9);
    const r = prompt(`Zona de padres: ¿cuánto es ${a} × ${b}?`);
    if (Number(r) !== a * b) { location.hash = ''; return; }
    title.textContent = 'Zona de padres';
    btnHome.hidden = false;
    document.body.classList.remove('in-game');
    const rows = Games.map(g => {
      const s = Core.gameState(g.id);
      const pct = s.answered ? Math.round(100 * s.firstTry / s.answered) + ' %' : '—';
      const lvl = g.maxLevel ? `${s.level}/${g.maxLevel}` : (g.badge ? g.badge(s) || '—' : '—');
      return `<tr><td>${g.emoji} ${g.name}<br><small>${g.learns}</small></td><td>${lvl}</td><td>${pct}</td><td>${s.played}</td></tr>`;
    }).join('');
    app.innerHTML = `<div class="parents">
      <label>Nombre del niño (la voz le saludará y le animará por su nombre)<br>
        <input id="name" type="text" maxlength="20" value="${Core.getName().replace(/"/g, '&quot;')}" placeholder="Nombre"> <button id="save-name">Guardar</button></label>
      <p>El nivel se ajusta solo: sube tras 3 aciertos seguidos a la primera y baja si falla dos preguntas seguidas. Los datos se guardan solo en este dispositivo.</p>
      <table><tr><th>Juego</th><th>Nivel / marca</th><th>Acierto a la 1ª</th><th>Partidas</th></tr>${rows}</table>
      <p>⭐ Estrellas totales: ${Core.state.stars}</p>
      <p><small>En iPhone o iPad: Compartir → "Añadir a pantalla de inicio" para que vaya a pantalla completa, sin barras del navegador.</small></p>
      <button id="reset">Borrar progreso</button></div>`;
    app.querySelector('#save-name').onclick = () => { Core.setName(app.querySelector('#name').value); greeted = false; Core.say(`Hola, ${Core.getName() || 'campeón'}`); };
    app.querySelector('#reset').onclick = () => { if (confirm('¿Borrar todo el progreso?')) { const n = Core.getName(); Core.reset(); Core.setName(n); document.getElementById('star-count').textContent = 0; location.hash = ''; } };
  }

  // ---------- Navegación por hash ----------
  let cleanup = null;
  function route() {
    if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
    unzoom();
    const id = location.hash.slice(1);
    if (id === 'padres') return parents();
    const game = Games.find(g => g.id === id);
    if (!game) return menu();
    title.textContent = game.name;
    btnHome.hidden = false;
    document.body.classList.toggle('in-game', game.section === 'recreo');
    app.innerHTML = '';
    window.scrollTo(0, 0);
    cleanup = game.start(app, () => (location.hash = '')) || null;
  }

  btnHome.onclick = () => (location.hash = '');
  window.addEventListener('hashchange', route);
  route();

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
