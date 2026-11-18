/* Menú, navegación, zona de padres y protecciones para móvil (iOS). */
(() => {
  const app = document.getElementById('app');
  const titleEl = document.getElementById('title');
  // Título con letras de colores (estilo cartel infantil).
  const title = { set textContent(t) { titleEl.innerHTML = Decor.rainbow(t); titleEl.setAttribute('aria-label', t); } };
  Decor.mount();
  const btnHome = document.getElementById('btn-home');

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
  const emojiOf = g => typeof g.emoji === 'function' ? g.emoji(Themes.current()) : g.emoji;
  // Dibujo de la tarjeta: imagen si el juego la tiene para este tema; si no, su emoji.
  const artOf = g => { const a = g.art && g.art(Themes.current()); return a ? `<img class="art" src="img/icons/${a}.webp" alt="" data-e="${emojiOf(g)}" onerror="this.outerHTML='<span class=emoji>'+this.dataset.e+'</span>'">` : `<span class="emoji">${emojiOf(g)}</span>`; };
  const TILES = ['#FF5FA2', '#FFD23F', '#5BE38C', '#FF8A3D', '#35D6E6', '#B79CFF'];
  let greeted = false;
  function menu() {
    window.speechSynthesis?.cancel();
    title.textContent = 'Mini Juegos';
    btnHome.hidden = true;
    document.body.classList.remove('in-game');
      const name = Core.getName(), multi = Store.profiles().length > 1;
    const themes = Object.values(Themes.list);
    app.innerHTML = `
      <div class="hello"><div class="hello-mascot">${Mascot.svg()}</div>
        <div class="bubble">${name ? `¡Hola, ${name}!` : '¡Hola!'}<br><small>¿A qué jugamos?</small></div>
        ${multi ? `<button class="who-btn" id="who" aria-label="Cambiar de jugador">${Store.profile.avatar}</button>` : ''}</div>
      <div class="theme-pick">${themes.map(t => `<button class="theme-btn${t.id === Themes.current().id ? ' on' : ''}" data-t="${t.id}"><span>${t.emoji}</span>${t.name}</button>`).join('')}</div>
      <h2 class="section-title"><span>🎮</span> ¡A jugar!</h2><div class="menu-grid" id="recreo"></div>
      <h2 class="section-title"><img src="img/icons/libros.webp" alt=""> Aprende jugando</h2><div class="menu-grid" id="aprende"></div>
      <button class="parents-link" id="parents">Zona de padres</button>`;
    const nth = {};
    Games.forEach(g => {
      const s = Core.gameState(g.id), sec = g.section || 'aprende';
      nth[sec] = (nth[sec] || 0) + 1;
      const badge = g.badge ? g.badge(s) : g.maxLevel ? '★'.repeat(s.level) + '☆'.repeat(g.maxLevel - s.level) : '';
      const b = Core.el(`<button class="game-card" style="--c:${TILES[(nth[sec] - 1 + (sec === 'aprende' ? 3 : 0)) % TILES.length]}">
          <span class="cover">${artOf(g)}</span><span class="gname">${g.name}</span>${badge ? `<span class="lvl">${badge}</span>` : ''}</button>`);
      b.onclick = () => { Core.say(g.name); location.hash = g.id; };
      app.querySelector('#' + (g.section || 'aprende')).appendChild(b);
    });
    app.querySelector('#parents').onclick = () => (location.hash = 'padres');
    app.querySelectorAll('.theme-btn').forEach(b => b.onclick = () => {
      if (b.dataset.t === Themes.current().id) return;
      Themes.use(b.dataset.t); Core.sfx.whoosh(); greeted = true; menu(); Core.say(Themes.current().say);
    });
    if (multi) app.querySelector('#who').onclick = () => (location.hash = 'quien');
    // Mundo de recompensas del tema: crece con las estrellas. Si hay regalo nuevo, se avisa por voz.
    app.querySelector('.section-title').before(World.banner());
    const m = app.querySelector('.hello-mascot');
    m.onclick = () => { m.classList.remove('jump'); void m.offsetWidth; m.classList.add('jump'); Core.sfx.pop(); Core.say(`¡Hola${name ? ', ' + name : ''}! Soy ${Mascot.NAME}.`); };
    if (World.hasNew() && Core.state.stars > 0) { greeted = true; setTimeout(() => Core.say(`¡Tienes un regalo nuevo en ${World.name.replace(/^Mi /, 'tu ')}! Tócalo.`), 300); }
    else if (name && !greeted) { greeted = true; setTimeout(() => Core.say(`¡Hola, ${name}! ¿A qué jugamos?`), 300); }
  }

  // ---------- ¿Quién juega? (solo si hay varios perfiles) ----------
  function who() {
    title.textContent = '¿Quién juega?';
    btnHome.hidden = false;
    app.innerHTML = `<div class="who-grid">${Store.profiles().map(p =>
      `<button class="game-card who-card" data-id="${p.id}" style="--c:#3d7bff"><span class="cover"><span class="emoji">${p.avatar}</span></span><span class="gname">${p.name || 'Sin nombre'}</span><span class="lvl">⭐ ${p.stars}</span></button>`).join('')}</div>`;
    Core.say('¿Quién juega?');
    app.querySelectorAll('.who-card').forEach(b => b.onclick = () => { Store.switchProfile(b.dataset.id); Themes.apply(); greeted = false; location.hash = ''; });
  }

  // ---------- Zona de padres ----------
  const AVATARS = ['🙂', '🦁', '🐯', '🐼', '🦊', '🐸', '🦄', '🐙', '🚀', '⚽', '🌈', '🦖'];
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let parentsOk = 0;
  function parents() {
    // Puerta sencilla para que el niño no entre por accidente (no se vuelve a pedir en 5 minutos).
    if (Date.now() - parentsOk > 5 * 60 * 1000) {
      const a = Core.rand(3, 9), b = Core.rand(3, 9);
      const r = prompt(`Zona de padres: ¿cuánto es ${a} × ${b}?`);
      if (Number(r) !== a * b) { location.hash = ''; return; }
      parentsOk = Date.now();
    }
    title.textContent = 'Zona de padres';
    btnHome.hidden = false;
    document.body.classList.remove('in-game');
    const P = Store.profile;
    document.getElementById('star-count').textContent = P.stars;
    const rows = Games.map(g => {
      const s = Core.gameState(g.id);
      const pct = s.answered ? Math.round(100 * s.firstTry / s.answered) + ' %' : '—';
      const lvl = g.maxLevel ? `${s.level}/${g.maxLevel}` : (g.badge ? g.badge(s) || '—' : '—');
      return `<tr><td>${emojiOf(g)} ${g.name}<br><small>${g.learns}</small></td><td>${lvl}</td><td>${pct}</td><td>${s.played}</td></tr>`;
    }).join('');
    app.innerHTML = `<div class="parents">
      <h3>Jugador</h3>
      <label>Nombre (la voz le saludará y le animará por su nombre)<br>
        <input id="name" type="text" maxlength="20" value="${esc(P.name)}" placeholder="Nombre"> <button id="save-name">Guardar</button></label>
      <div class="avatars">${AVATARS.map(a => `<button class="av${a === P.avatar ? ' on' : ''}" data-a="${a}">${a}</button>`).join('')}</div>
      <p class="profiles">${Store.profiles().map(p => `<button class="pf${p.id === P.id ? ' on' : ''}" data-id="${p.id}">${p.avatar} ${esc(p.name || 'Sin nombre')}</button>`).join('')}
        <button id="add-profile">＋ Otro jugador</button></p>
      ${Store.profiles().length > 1 ? '<button id="del-profile">Eliminar este jugador</button>' : ''}

      <h3>Estilo</h3>
      <p class="profiles"><button class="look${P.look !== 'pegatina' ? ' on' : ''}" data-l="normal">Normal</button><button class="look${P.look === 'pegatina' ? ' on' : ''}" data-l="pegatina">Pegatina (contorno negro)</button></p>

      <h3>Voz</h3>
      <label><select id="voice"></select> <button id="test-voice">Probar</button><br>
        <small>Si suena a robot, descarga una voz mejor en el dispositivo (iPhone: Ajustes → Accesibilidad → Contenido leído → Voces → Español) y elígela aquí.</small></label>

      <h3>Progreso de ${esc(P.name || 'este jugador')}</h3>
      <p>El nivel se ajusta solo: sube tras 3 aciertos seguidos a la primera y baja si falla dos preguntas seguidas.</p>
      <table><tr><th>Juego</th><th>Nivel / marca</th><th>Acierto a la 1ª</th><th>Partidas</th></tr>${rows}</table>
      <p>⭐ Estrellas: ${P.stars}</p>

      <h3>Datos</h3>
      <p><small>Todo se guarda solo en este dispositivo. Haz una copia de vez en cuando: si se borran los datos del navegador o cambias de tablet, con la copia lo recuperas.
        En iPhone o iPad, añádela a la pantalla de inicio (Compartir → "Añadir a pantalla de inicio"): así va a pantalla completa y Safari no borra los datos por no usarla unos días.</small></p>
      <p><button id="export">Guardar copia</button> <button id="import">Recuperar copia</button> <input id="import-file" type="file" accept=".json,application/json" hidden></p>
      <button id="reset">Borrar progreso de este jugador</button></div>`;

    const sel = app.querySelector('#voice');
    const fillVoices = () => {
      const vs = Core.spanishVoices();
      sel.innerHTML = vs.length ? vs.map(v => `<option value="${esc(v.voiceURI)}">${esc(v.name)} (${v.lang})</option>`).join('') : '<option value="">Voz del sistema</option>';
      sel.value = Core.voiceURI;
    };
    fillVoices(); setTimeout(fillVoices, 600);
    const sample = () => Core.say(`¡Hola${Core.getName() ? ', ' + Core.getName() : ''}! ¿Cuántas estrellas hay? ¡Muy bien!`);
    sel.onchange = () => { Core.setVoice(sel.value); sample(); };
    app.querySelector('#test-voice').onclick = sample;
    app.querySelector('#save-name').onclick = () => { Core.setName(app.querySelector('#name').value); greeted = false; Core.say(`Hola, ${Core.getName() || 'campeón'}`); parents(); };
    app.querySelectorAll('.look').forEach(b => b.onclick = () => { P.look = b.dataset.l; Store.save(); Themes.apply(); parents(); });
    app.querySelectorAll('.av').forEach(b => b.onclick = () => { P.avatar = b.dataset.a; Store.save(); parents(); });
    app.querySelectorAll('.pf').forEach(b => b.onclick = () => { Store.switchProfile(b.dataset.id); Themes.apply(); greeted = false; parents(); });
    app.querySelector('#add-profile').onclick = () => {
      const n = prompt('Nombre del nuevo jugador'); if (n === null) return;
      Store.addProfile(n.trim().slice(0, 20)); Themes.apply(); greeted = false; parents();
    };
    const del = app.querySelector('#del-profile');
    if (del) del.onclick = () => { if (confirm(`¿Eliminar a ${P.name || 'este jugador'} y todo su progreso?`)) { Store.removeProfile(P.id); Themes.apply(); parents(); } };
    app.querySelector('#export').onclick = async () => {
      const blob = new Blob([Store.exportJSON()], { type: 'application/json' });
      const file = new File([blob], `mini-juegos-copia-${new Date().toISOString().slice(0, 10)}.json`, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: 'Copia de Mini Juegos' }); } catch {} return; }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    };
    const fileIn = app.querySelector('#import-file');
    app.querySelector('#import').onclick = () => fileIn.click();
    fileIn.onchange = async () => {
      const f = fileIn.files[0]; if (!f) return;
      try { if (!confirm('¿Sustituir los datos de este dispositivo por los de la copia?')) return; Store.importJSON(await f.text()); Themes.apply(); alert('Copia recuperada'); parents(); }
      catch { alert('Ese archivo no es una copia válida de Mini Juegos.'); }
    };
    app.querySelector('#reset').onclick = () => { if (confirm(`¿Borrar todo el progreso de ${P.name || 'este jugador'}?`)) { Core.reset(); document.getElementById('star-count').textContent = 0; location.hash = ''; } };
  }

  // ---------- Navegación por hash ----------
  let cleanup = null;
  function route() {
    if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
    unzoom();
    document.getElementById('star-count').textContent = Core.state.stars;
    const id = location.hash.slice(1);
    if (id === 'padres') return parents();
    if (id === 'quien') return who();
    if (id === 'mundo' || id === 'granja') {
      title.textContent = World.name; btnHome.hidden = false;
      document.body.classList.add('in-game'); app.innerHTML = ''; window.scrollTo(0, 0);
      cleanup = World.start(app) || null; return;
    }
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
