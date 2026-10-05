/* Menú, navegación y zona de padres. */
(() => {
  const app = document.getElementById('app');
  const title = document.getElementById('title');
  const btnHome = document.getElementById('btn-home');
  document.getElementById('star-count').textContent = Core.state.stars;

  function menu() {
    speechSynthesis?.cancel?.();
    title.textContent = 'Juegos Peque';
    btnHome.hidden = true;
    app.innerHTML = '<div class="menu-grid"></div><button class="parents-link" id="parents">Zona de padres</button>';
    const grid = app.querySelector('.menu-grid');
    Games.forEach(g => {
      const lvl = Core.gameState(g.id).level;
      const b = Core.el(`<button class="game-card" style="--c:${g.color}">
          <span class="emoji">${g.emoji}</span><span>${g.name}</span>
          <span class="lvl">${'★'.repeat(lvl)}${'☆'.repeat(g.maxLevel - lvl)}</span></button>`);
      b.onclick = () => { Core.say(g.name); location.hash = g.id; };
      grid.appendChild(b);
    });
    app.querySelector('#parents').onclick = () => (location.hash = 'padres');
  }

  function parents() {
    // Puerta sencilla para que el niño no entre por accidente.
    const a = Core.rand(3, 9), b = Core.rand(3, 9);
    const r = prompt(`Zona de padres: ¿cuánto es ${a} × ${b}?`);
    if (Number(r) !== a * b) { location.hash = ''; return; }
    title.textContent = 'Zona de padres';
    btnHome.hidden = false;
    const rows = Games.map(g => {
      const s = Core.gameState(g.id);
      const pct = s.answered ? Math.round(100 * s.firstTry / s.answered) + ' %' : '—';
      return `<tr><td>${g.emoji} ${g.name}<br><small>${g.learns}</small></td><td>${s.level}/${g.maxLevel}</td><td>${pct}</td><td>${s.played}</td></tr>`;
    }).join('');
    app.innerHTML = `<div class="parents">
      <p>El nivel se ajusta solo: sube tras 3 aciertos seguidos a la primera y baja si falla dos preguntas seguidas. Los datos se guardan solo en este dispositivo.</p>
      <table><tr><th>Juego</th><th>Nivel</th><th>Acierto a la 1ª</th><th>Partidas</th></tr>${rows}</table>
      <p>⭐ Estrellas totales: ${Core.state.stars}</p>
      <button id="reset">Borrar progreso</button></div>`;
    app.querySelector('#reset').onclick = () => { if (confirm('¿Borrar todo el progreso?')) { Core.reset(); document.getElementById('star-count').textContent = 0; menu(); location.hash = ''; } };
  }

  function route() {
    const id = location.hash.slice(1);
    if (id === 'padres') return parents();
    const game = Games.find(g => g.id === id);
    if (!game) return menu();
    title.textContent = game.name;
    btnHome.hidden = false;
    app.innerHTML = '';
    game.start(app, () => (location.hash = ''));
  }

  btnHome.onclick = () => (location.hash = '');
  window.addEventListener('hashchange', route);
  route();

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
