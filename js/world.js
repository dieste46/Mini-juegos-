/* Mundo de recompensas: crece con las estrellas ganadas en cualquier juego.
   Lo que aparece lo decide el tema (granja, base espacial...). Las estrellas son del niño, no del tema:
   al cambiar de tema, su otro mundo ya tiene lo que corresponde a sus estrellas. Nada se pierde nunca. */
const World = (() => {
  const W = () => Themes.current().world;
  const tid = () => Themes.current().id;
  const stars = () => Core.state.stars || 0;
  const unlockedCount = () => W().items.filter(it => stars() >= it[6]).length;
  const seen = () => (Core.state.worlds[tid()] || {}).seen || 0;
  const markSeen = (n) => { Core.state.worlds[tid()] = { seen: n }; Core.save(); };
  const next = () => W().items[unlockedCount()] || null;
  const hasNew = () => unlockedCount() > seen();

  function giftHTML() {
    const n = next();
    if (!n) return `<span class="gift">🏆 ¡Completo!</span>`;
    const prev = W().items[unlockedCount() - 1][6], need = n[6] - stars();
    const pct = Math.round(100 * (stars() - prev) / (n[6] - prev));
    return `<span class="gift">🎁</span><div class="goalbar"><div style="width:${pct}%"></div></div><span class="gift">⭐ ${need}</span>`;
  }

  function scene(container, count) {
    container.classList.add('world', 'world-' + tid());
    container.innerHTML = W().scene();
    return W().items.slice(0, count).map((it, i) => {
      const e = document.createElement('span');
      e.className = 'fitem';
      e.textContent = it[0];
      e.style.cssText = `left:${it[3]}%;top:${it[4]}%;--s:${it[5]};z-index:${Math.round(it[4])};animation-delay:${-(i * 0.37) % 2}s`;
      container.appendChild(e);
      return e;
    });
  }

  function play(it) {
    it[7].forEach((f, i) => Core.tone(f, 0.22, 'triangle', 0.25, null, i * 0.16));
    Core.say(`${it[1]}. ${it[2]}`);
  }

  function banner() {
    const b = Core.el(`<button class="world-banner${hasNew() ? ' new' : ''}">
        <div class="mini"></div>
        <div class="farm-foot"><b>${W().icon} ${W().name}</b>${hasNew() ? '<span class="gift bounce">🎁 ¡Nuevo!</span>' : giftHTML()}</div></button>`);
    scene(b.querySelector('.mini'), Math.min(seen() || 1, unlockedCount()));
    b.onclick = () => { Core.say(W().name); location.hash = 'mundo'; };
    return b;
  }

  function start(root) {
    let timers = [];
    const items = W().items, total = unlockedCount(), before = Math.min(seen(), total);
    root.innerHTML = `<div class="hud farm-hud">${giftHTML()}</div><div class="play" id="world"></div>`;
    const els = scene(root.querySelector('#world'), total);
    els.forEach((e, i) => e.addEventListener('pointerdown', ev => {
      ev.preventDefault();
      e.classList.remove('jump'); void e.offsetWidth; e.classList.add('jump');
      play(items[i]);
    }));
    const fresh = els.slice(before);
    if (fresh.length) {
      fresh.forEach(e => (e.style.visibility = 'hidden'));
      fresh.forEach((e, k) => timers.push(setTimeout(() => {
        e.style.visibility = ''; e.classList.add('arrive');
        Core.sfx.ding(); if (k === fresh.length - 1) Core.celebrate();
      }, 500 + k * (fresh.length > 3 ? 350 : 900))));
      const last = items[total - 1];
      timers.push(setTimeout(() => Core.say(before === 0 && total === 1 ? W().first
        : fresh.length === 1 ? `¡Un regalo nuevo! ${last[1]}. Tócalo.` : W().many), 600));
      markSeen(total);
    } else {
      const n = next();
      Core.say(n ? `Te faltan ${n[6] - stars()} estrellas para el próximo regalo.` : W().full);
    }
    return () => timers.forEach(clearTimeout);
  }

  return { banner, start, hasNew, get name() { return W().name; } };
})();
