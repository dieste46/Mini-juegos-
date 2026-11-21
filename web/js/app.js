/* Menú, navegación, zona de padres y protecciones para móvil (iOS). */
(() => {
  const app = document.getElementById('app');
  const titleEl = document.getElementById('title');
  // Título con letras de colores (estilo cartel infantil).
  const title = { set textContent(t) { titleEl.innerHTML = Decor.rainbow(t); titleEl.setAttribute('aria-label', t); } };
  const APP_NAME = 'Mundo Joor';   // nombre de la app y título del menú
  Decor.mount();
  const btnHome = document.getElementById('btn-home'), btnHelp = document.getElementById('btn-help');

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
  // Emoji de la tarjeta: el que el tema fije para ese juego (cards), o el del propio juego
  const emojiOf = g => (Themes.current().cards || {})[g.id] || (typeof g.emoji === 'function' ? g.emoji(Themes.current()) : g.emoji);
  // Dibujo de la tarjeta: imagen si el juego la tiene para este tema; si no, su emoji.
  const artOf = g => { const a = g.art && g.art(Themes.current()); return a ? `<img class="art" src="img/icons/${a}.webp" alt="" data-e="${emojiOf(g)}" onerror="this.outerHTML='<span class=emoji>'+this.dataset.e+'</span>'">` : `<span class="emoji">${emojiOf(g)}</span>`; };
  const TILES = ['#FF5FA2', '#FFD23F', '#5BE38C', '#FF8A3D', '#35D6E6', '#B79CFF'];
  let greeted = false, hello = 0;
  // Juegos que salen en el menú de este jugador y en qué orden. Se decide en la zona de padres:
  // los minijuegos se pueden apagar (los de aprender, no) y los favoritos van primero.
  const section = g => g.section || 'aprende';
  function menuGames() {
    const P = Store.profile, hide = P.hide || [], fav = P.fav || [];
    const rank = g => (fav.includes(g.id) ? fav.indexOf(g.id) : 1000 + Games.indexOf(g));
    return Games.filter(g => !g.hidden && !(section(g) === 'recreo' && hide.includes(g.id))).sort((a, b) => rank(a) - rank(b));
  }
  function menu() {
    window.speechSynthesis?.cancel();
    const name = Core.getName(), multi = Store.profiles().length > 1;
    title.textContent = APP_NAME;
    btnHome.hidden = true;
    document.body.classList.remove('in-game');
    const themes = Object.values(Themes.list);
    app.innerHTML = `
      <div class="hello"><div class="hello-mascot">${Mascot.svg()}</div><button class="bip-edit" id="bip-edit" aria-label="Cambiar a ${Mascot.NAME}">🎨</button>
        <div class="bubble">${name ? `¡Hola, ${esc(name)}!` : '¡Hola!'}<br><small>¿A qué jugamos?</small></div>
        ${multi ? `<button class="who-btn" id="who" aria-label="Cambiar de jugador">${esc(Store.profile.avatar)}</button>` : ''}</div>
      <div class="theme-pick">${themes.map(t => `<button class="theme-btn${t.id === Themes.current().id ? ' on' : ''}" data-t="${t.id}"><span>${t.emoji}</span>${t.name}</button>`).join('')}</div>
      <h2 class="section-title" data-s="recreo"><span>🎮</span> Minijuegos</h2><div class="menu-grid" id="recreo"></div>
      <h2 class="section-title" data-s="aprende"><img src="img/icons/libros.webp" alt=""> Pequesabios</h2><div class="menu-grid" id="aprende"></div>
      <button class="parents-link" id="parents">Zona de padres</button>`;
    const nth = {};
    menuGames().forEach(g => {
      const s = Core.gameState(g.id), sec = g.section || 'aprende';
      nth[sec] = (nth[sec] || 0) + 1;
      const lv = Math.max(0, Math.min(g.maxLevel || 0, Math.floor(s.level) || 0));
      const badge = g.badge ? g.badge(s) : g.maxLevel ? '★'.repeat(lv) + '☆'.repeat(g.maxLevel - lv) : '';
      const b = Core.el(`<button class="game-card" style="--c:${TILES[(nth[sec] - 1 + (sec === 'aprende' ? 3 : 0)) % TILES.length]}">
          <span class="cover">${artOf(g)}</span><span class="gname">${g.name}</span>${badge ? `<span class="lvl">${badge}</span>` : ''}</button>`);
      b.onclick = () => { Core.say(g.name); location.hash = g.id; };
      app.querySelector('#' + (g.section || 'aprende')).appendChild(b);
    });
    // Una sección sin tarjetas (todos sus juegos apagados) no enseña ni el título
    app.querySelectorAll('.section-title').forEach(h => { if (!nth[h.dataset.s]) { h.nextElementSibling.remove(); h.remove(); } });
    app.querySelector('#parents').onclick = () => (location.hash = 'padres');
    app.querySelector('#bip-edit').onclick = () => (location.hash = 'bip');
    app.querySelectorAll('.theme-btn').forEach(b => b.onclick = () => {
      if (b.dataset.t === Themes.current().id) return;
      Themes.use(b.dataset.t); Core.sfx.whoosh(); greeted = true; menu(); Core.say(Themes.current().say);
    });
    if (multi) app.querySelector('#who').onclick = () => (location.hash = 'quien');
    // Mundo de recompensas del tema: crece con las estrellas. Si hay regalo nuevo, se avisa por voz.
    app.querySelector('.section-title').before(World.banner());
    const m = app.querySelector('.hello-mascot');
    m.onclick = () => { m.classList.remove('jump'); void m.offsetWidth; m.classList.add('jump'); Core.sfx.pop(); Core.say(`¡Hola${name ? ', ' + name : ''}! Soy ${Mascot.NAME}.`); };
    // El saludo va con un pequeño retraso; si antes se sale del menú, se anula (pisaría la voz de la pantalla siguiente).
    if (World.hasNew() && Core.state.stars > 0) { greeted = true; hello = setTimeout(() => Core.say(`¡Tienes un regalo nuevo en ${World.name.replace(/^Mi /, 'tu ')}! Tócalo.`), 300); }
    else if (name && !greeted) { greeted = true; hello = setTimeout(() => Core.say(`¡Hola, ${name}! ¿A qué jugamos?`), 300); }
  }

  // ---------- Mi Bip: el niño elige su color y le pone un complemento ----------
  // Los complementos se abren al llegar a un número de estrellas. No se gastan: lo abierto se queda abierto.
  function dresser() {
    title.textContent = `Mi ${Mascot.NAME}`;
    btnHome.hidden = false;
    document.body.classList.remove('in-game');
    const P = Store.profile, look = P.bip || {}, color = Mascot.COLORS[look.color] ? look.color : 'azul', item = Mascot.ITEMS.some(i => i.id === look.item) ? look.item : 'nada';
    const next = Mascot.ITEMS.find(i => i.stars > P.stars);
    app.innerHTML = `<div class="dress">
      <div class="prompt"><button class="speak-btn" id="sp" aria-label="Repetir">🔊</button><span>⭐ ${P.stars}</span></div>
      <div class="dress-bip">${Mascot.svg('joy')}</div>
      <div class="dress-colors">${Object.keys(Mascot.COLORS).map(c => `<button class="dc${c === color ? ' on' : ''}" data-c="${c}" style="--c:${Mascot.COLORS[c][0]}" aria-label="Color ${c}"></button>`).join('')}</div>
      <div class="dress-items">${Mascot.ITEMS.map(i => `<button class="di${i.id === item ? ' on' : ''}${i.stars > P.stars ? ' locked' : ''}" data-i="${i.id}" aria-label="${i.id === 'nada' ? 'Sin nada' : i.name}">
        <span class="di-bip">${Mascot.svg('happy', { item: i.id })}</span>${i.stars > P.stars ? `<span class="di-lock">⭐ ${i.stars}</span>` : ''}</button>`).join('')}</div></div>`;
    const intro = () => Core.say(`Elige un color para ${Mascot.NAME} y ponle lo que más te guste.` + (next ? ` Con ${next.stars} estrellas se abre ${next.name}.` : ''));
    app.querySelector('#sp').onclick = intro;
    const wear = change => { P.bip = { color, item, ...change }; Store.save(); Mascot.apply(); Core.sfx.pop(); dresser(); };
    app.querySelectorAll('.dc').forEach(b => b.onclick = () => { wear({ color: b.dataset.c }); Core.say(b.dataset.c); });
    app.querySelectorAll('.di').forEach(b => b.onclick = () => {
      const it = Mascot.ITEMS.find(i => i.id === b.dataset.i);
      if (it.stars > P.stars) { Core.tone(330, 0.14, 'sine', 0.16); b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope'); Core.say(`Para ${it.name} hacen falta ${it.stars} estrellas. Te faltan ${it.stars - P.stars}.`); return; }
      wear({ item: it.id }); Core.say(it.id === 'nada' ? 'Sin nada.' : `¡Qué bien le queda ${it.name}!`);
    });
    return intro;
  }

  // ---------- ¿Quién juega? (solo si hay varios perfiles) ----------
  function who() {
    title.textContent = '¿Quién juega?';
    btnHome.hidden = false;
    app.innerHTML = `<div class="who-grid">${Store.profiles().map(p =>
      `<button class="game-card who-card" data-id="${p.id}" style="--c:#3d7bff"><span class="cover"><span class="emoji">${esc(p.avatar)}</span></span><span class="gname">${esc(p.name || 'Sin nombre')}</span><span class="lvl">⭐ ${p.stars}</span></button>`).join('')}</div>`;
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
    const P = Store.profile, LETRAS = Games.find(g => g.id === 'letras'), worked = P.letters || LETRAS.worked;
    // Favoritos de una sección, en su orden: el número que se enseña es el puesto dentro de ella
    const favIn = sec => (P.fav || []).filter(id => { const g = Games.find(x => x.id === id); return g && section(g) === sec; });
    document.getElementById('star-count').textContent = P.stars;
    const rows = Games.map(g => {
      const s = Core.gameState(g.id);
      const pct = s.answered ? Math.round(100 * s.firstTry / s.answered) + ' %' : '—';
      const lvl = g.maxLevel ? `<span class="lv"><button class="lvb" data-g="${g.id}" data-d="-1" aria-label="Bajar el nivel de ${g.name}"${s.level <= 1 ? ' disabled' : ''}>−</button><b>${s.level}/${g.maxLevel}</b><button class="lvb" data-g="${g.id}" data-d="1" aria-label="Subir el nivel de ${g.name}"${s.level >= g.maxLevel ? ' disabled' : ''}>+</button></span>` : (g.badge ? g.badge(s) || '—' : '—');
      const how = howOf(g);
      return `<tr><td>${emojiOf(g)} ${g.name}<br><small>${g.learns}</small>${how.length ? `<details class="how"><summary>Cómo se juega</summary><ol>${how.map(t => `<li>${esc(t)}</li>`).join('')}</ol></details>` : ''}</td><td>${lvl}</td><td>${pct}</td><td>${s.played}</td></tr>`;
    }).join('');
    app.innerHTML = `<div class="parents">
      <h3>Jugador</h3>
      <label>Nombre (la voz le saludará y le animará por su nombre)<br>
        <input id="name" type="text" maxlength="20" value="${esc(P.name)}" placeholder="Nombre"> <button id="save-name">Guardar</button></label>
      <div class="avatars">${AVATARS.map(a => `<button class="av${a === P.avatar ? ' on' : ''}" data-a="${a}">${a}</button>`).join('')}</div>
      <p class="profiles">${Store.profiles().map(p => `<button class="pf${p.id === P.id ? ' on' : ''}" data-id="${p.id}">${esc(p.avatar)} ${esc(p.name || 'Sin nombre')}</button>`).join('')}
        <button id="add-profile">＋ Otro jugador</button></p>
      ${Store.profiles().length > 1 ? '<button id="del-profile">Eliminar este jugador</button>' : ''}

      <h3>Estilo</h3>
      <p class="profiles"><button class="look${P.look !== 'pegatina' ? ' on' : ''}" data-l="normal">Normal</button><button class="look${P.look === 'pegatina' ? ' on' : ''}" data-l="pegatina">Pegatina (contorno negro)</button></p>

      <h3>Letras del cole</h3>
      <p><small>Marca las que ya ha trabajado en clase: el juego Letras solo pregunta por esas.</small></p>
      <p class="profiles">${LETRAS.letters.map(l => `<button class="wl${worked.includes(l) ? ' on' : ''}" data-l="${l}">${l}</button>`).join('')}</p>
      <p><small>Letra de la semana: sale más veces, sea cual sea su nivel.</small></p>
      <p class="profiles">${LETRAS.letters.map(l => `<button class="wk${P.letter === l ? ' on' : ''}" data-l="${l}">${l}</button>`).join('')}<button class="wk${P.letter ? '' : ' on'}" data-l="">Ninguna</button></p>

      <h3>Juegos del menú</h3>
      <p><small>Los minijuegos se pueden quitar del menú; los de aprender se ven siempre. Los marcados con ★ salen los primeros de su sección, en el orden en que los marques.</small></p>
      <div class="pick-games">${['recreo', 'aprende'].map(sec => `<p class="pg-sec">${sec === 'recreo' ? 'Minijuegos' : 'Pequesabios'}</p>` + Games.filter(g => !g.hidden && section(g) === sec).map(g => `<div class="pg">
        <span class="pg-name">${emojiOf(g)} ${g.name}</span>
        ${sec === 'recreo' ? `<button class="pg-see${(P.hide || []).includes(g.id) ? '' : ' on'}" data-g="${g.id}" aria-pressed="${!(P.hide || []).includes(g.id)}">${(P.hide || []).includes(g.id) ? 'Oculto' : 'Se ve'}</button>` : ''}
        <button class="pg-fav${(P.fav || []).includes(g.id) ? ' on' : ''}" data-g="${g.id}" aria-pressed="${(P.fav || []).includes(g.id)}" aria-label="${g.name}: primero en el menú">★${(P.fav || []).includes(g.id) ? ' ' + (favIn(sec).indexOf(g.id) + 1) : ''}</button></div>`).join('')).join('')}</div>

      <h3>Voz</h3>
      <label><select id="voice"></select> <button id="test-voice">Probar</button><br>
        <small>Si suena a robot, descarga una voz mejor en el dispositivo (iPhone: Ajustes → Accesibilidad → Contenido leído → Voces → Español) y elígela aquí.</small></label>

      <h3>Progreso de ${esc(P.name || 'este jugador')}</h3>
      <p>El nivel se ajusta solo: sube tras 3 aciertos seguidos a la primera y baja si falla dos preguntas seguidas. Con − y + lo pones tú donde quieras, y desde ahí sigue ajustándose.</p>
      <table><tr><th>Juego</th><th>Nivel / marca</th><th>Acierto a la 1ª</th><th>Partidas</th></tr>${rows}</table>
      <p>⭐ Estrellas: ${P.stars}</p>

      <h3>Datos</h3>
      <p><small>Todo se guarda solo en este dispositivo. Exporta las partidas de vez en cuando: si se borran los datos del navegador o cambias de móvil o de tablet, las recuperas importando ese archivo.
        La copia lleva los jugadores, sus estrellas, el progreso de cada juego, los ajustes y los dibujos de Pintar. Importar sustituye las partidas que haya en este dispositivo.</small></p>
      <p><small>En iPhone o iPad, añade la app a la pantalla de inicio (Compartir → "Añadir a pantalla de inicio") y haz la importación desde ese icono: va a pantalla completa, guarda sus datos aparte de Safari y no se borran por no usarla unos días.</small></p>
      <p><button id="export">Exportar partidas</button> <button id="import">Importar partidas</button> <input id="import-file" type="file" accept=".json,application/json" hidden></p>
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
    // La letra de la semana cuenta como trabajada: al elegirla se marca también arriba.
    app.querySelectorAll('.wk').forEach(b => b.onclick = () => { if (b.dataset.l) { P.letter = b.dataset.l; if (!worked.includes(P.letter)) P.letters = LETRAS.letters.filter(l => worked.includes(l) || l === P.letter); } else delete P.letter; Store.save(); parents(); });
    app.querySelectorAll('.wl').forEach(b => b.onclick = () => { const l = b.dataset.l; P.letters = LETRAS.letters.filter(x => (x === l ? !worked.includes(l) : worked.includes(x))); Store.save(); parents(); });
    const flip = (key, id) => { const list = P[key] || []; P[key] = list.includes(id) ? list.filter(x => x !== id) : [...list, id]; Store.save(); parents(); };
    app.querySelectorAll('.pg-see').forEach(b => b.onclick = () => flip('hide', b.dataset.g));
    app.querySelectorAll('.pg-fav').forEach(b => b.onclick = () => flip('fav', b.dataset.g));
    app.querySelectorAll('.lvb').forEach(b => b.onclick = () => {
      const g = Games.find(x => x.id === b.dataset.g), s = Core.gameState(g.id);
      s.level = Math.max(1, Math.min(g.maxLevel, s.level + Number(b.dataset.d))); s.streak = 0; s.misses = 0; Core.save(); parents();
    });
    app.querySelectorAll('.look').forEach(b => b.onclick = () => { P.look = b.dataset.l; Store.save(); Themes.apply(); parents(); });
    app.querySelectorAll('.av').forEach(b => b.onclick = () => { P.avatar = b.dataset.a; Store.save(); parents(); });
    app.querySelectorAll('.pf').forEach(b => b.onclick = () => { Store.switchProfile(b.dataset.id); Themes.apply(); greeted = false; parents(); });
    app.querySelector('#add-profile').onclick = () => {
      const n = prompt('Nombre del nuevo jugador'); if (n === null) return;
      Store.addProfile(n.trim().slice(0, 20)); Themes.apply(); greeted = false; parents();
    };
    const del = app.querySelector('#del-profile');
    if (del) del.onclick = () => { if (confirm(`¿Eliminar a ${P.name || 'este jugador'} y todo su progreso?`)) { Store.removeProfile(P.id); Themes.apply(); parents(); } };
    // Los dibujos de Pintar viajan en la misma copia. Se preparan al abrir esta pantalla para que, al pulsar,
    // compartir sea inmediato (en iOS, si se espera entre el toque y el "compartir", el sistema lo bloquea).
    let arte = null; Art.exportAll().then(a => (arte = a));
    app.querySelector('#export').onclick = async () => {
      const copy = Store.exportBackup(arte || await Art.exportAll());
      const blob = new Blob([JSON.stringify(copy)], { type: 'application/json' });
      const file = new File([blob], `mundojoor-partidas-${new Date().toISOString().slice(0, 10)}.json`, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: `Partidas de ${APP_NAME}` }); } catch {} return; }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    };
    const fileIn = app.querySelector('#import-file');
    app.querySelector('#import').onclick = () => fileIn.click();
    fileIn.onchange = async () => {
      const f = fileIn.files[0]; fileIn.value = '';   // vaciar: así se puede volver a elegir el mismo archivo
      if (!f) return;
      // Primero se lee y se valida; solo después se pregunta, enseñando qué trae la copia. Hasta el "Aceptar" no se toca nada.
      let copy;
      try { copy = Store.readBackup(JSON.parse(await f.text())); }
      catch (e) {
        alert(e && e.code === 'nueva'
          ? `Esa copia está hecha con una versión más nueva de ${APP_NAME}. Abre la app con conexión para que se actualice y vuelve a probar.`
          : `Ese archivo no es una copia válida de ${APP_NAME}.`);
        return;
      }
      // Un nivel por encima del máximo que esta versión conoce para ese juego se queda en el máximo.
      Object.values(copy.store.profiles).forEach(p => Games.forEach(g => { const s = p.games[g.id]; if (s && g.maxLevel && s.level > g.maxLevel) s.level = g.maxLevel; }));
      const { jugadores, dibujos } = copy.resumen;
      const cuando = copy.exportedAt ? ` del ${new Date(copy.exportedAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}` : '';
      const quien = jugadores.map(j => `· ${j.name || 'Sin nombre'}: ⭐ ${j.stars}`).join('\n');
      const cuantos = n => (n === 1 ? '1 dibujo' : `${n} dibujos`);
      if (!confirm(`Copia${cuando}\n${quien}\n${dibujos ? `· ${cuantos(dibujos)}\n` : ''}\n¿Sustituir las partidas de este dispositivo por las de la copia?`)) return;
      if (!Store.importBackup(copy)) { alert('No se ha podido guardar la copia en este dispositivo.'); return; }
      const n = await Art.importAll(copy.arte);
      Core.refreshVoice(); Themes.apply(); greeted = false;   // sin guardar nada más: la copia entra tal cual, con sus fechas
      alert(n ? `Partidas importadas, con ${cuantos(n)}.` : 'Partidas importadas.');
      parents();
    };
    app.querySelector('#reset').onclick = () => { if (confirm(`¿Borrar todo el progreso de ${P.name || 'este jugador'}?`)) { Core.reset(); document.getElementById('star-count').textContent = 0; location.hash = ''; } };
  }

  // ---------- Cómo se juega ----------
  // Cada juego trae su explicación en `how` (lista de frases, o función que la da según el tema). Se enseña en una
  // ventana desde el botón "?" de la barra, con un altavoz que la lee, y también en la zona de padres.
  const howOf = g => (typeof g.how === 'function' ? g.how() : g.how) || [];
  let helpEl = null, helpGame = null;
  function closeHelp() { if (!helpEl) return; helpEl.remove(); helpEl = null; window.speechSynthesis?.cancel(); }
  function openHelp() {
    if (!helpGame || helpEl) return;
    const steps = howOf(helpGame), name = helpGame.name;
    helpEl = Core.el(`<div class="help" role="dialog" aria-modal="true" aria-label="Cómo se juega">
      <div class="help-card"><h2>${esc(name)}</h2><ol>${steps.map(t => `<li>${esc(t)}</li>`).join('')}</ol>
        <div class="help-btns"><button class="speak-btn" id="help-say" aria-label="Leer en voz alta">🔊</button><button class="round again" id="help-ok" aria-label="Cerrar">👍</button></div></div></div>`);
    document.body.appendChild(helpEl);
    helpEl.querySelector('#help-say').onclick = () => Core.say(`${name}. ${steps.join(' ')}`);
    helpEl.querySelector('#help-ok').onclick = closeHelp;
    helpEl.addEventListener('pointerdown', e => { if (e.target === helpEl) closeHelp(); });   // tocar fuera también cierra
  }
  let helpAt = 0;   // como la casa: responde al levantar el dedo, aunque haya otro apoyado
  btnHelp.addEventListener('pointerup', e => { e.preventDefault(); helpAt = Date.now(); openHelp(); });
  btnHelp.onclick = () => { if (Date.now() - helpAt > 500) openHelp(); };

  // ---------- Navegación por hash ----------
  let cleanup = null;
  function route() {
    if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
    closeHelp(); helpGame = null; btnHelp.hidden = true; clearTimeout(hello);
    unzoom();
    document.getElementById('star-count').textContent = Core.state.stars;
    const id = location.hash.slice(1);
    if (id === 'padres') return parents();
    if (id === 'quien') return who();
    if (id === 'bip') { dresser()(); return; }
    if (id === 'mundo' || id === 'granja') {
      title.textContent = World.name; btnHome.hidden = false;
      document.body.classList.add('in-game'); app.innerHTML = ''; window.scrollTo(0, 0);
      cleanup = World.start(app) || null; return;
    }
    const game = Games.find(g => g.id === id);
    if (!game) return menu();
    title.textContent = game.name;
    btnHome.hidden = false;
    helpGame = game; btnHelp.hidden = !howOf(game).length;
    document.body.classList.toggle('in-game', game.section === 'recreo');
    app.innerHTML = '';
    window.scrollTo(0, 0);
    cleanup = game.start(app, goHome) || null;
  }

  // Volver al menú. Si la dirección ya está vacía (no habría cambio que detectar), se repinta igualmente.
  function goHome() { if (location.hash.length > 1) location.hash = ''; else route(); }
  // La casa responde al levantar el dedo, no solo al "clic": en iOS el clic no llega si hay otro dedo apoyado en la pantalla.
  let homeAt = 0;
  btnHome.addEventListener('pointerup', e => { e.preventDefault(); homeAt = Date.now(); goHome(); });
  btnHome.onclick = () => { if (Date.now() - homeAt > 500) goHome(); };
  window.addEventListener('hashchange', route);
  route();

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
