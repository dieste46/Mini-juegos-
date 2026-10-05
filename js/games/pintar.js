/* Pintar libre: pinceles de colores, arcoíris, sellos y guardar el dibujo. */
Games.push({
  id: 'pintar', section: 'recreo',
  name: 'Pintar', emoji: '🖍️', color: '#ff8a1c',
  learns: 'Creatividad y motricidad fina.',
  start(root, exit) {
    const COLORS = ['#e8323c', '#ff8a1c', '#ffd23f', '#2ebd6b', '#2f80ff', '#8e4ad8', '#ff6fa5', '#7a5230', '#2b2b3a'];
    const STAMPS = ['⭐', '🐷', '❤️', '🌸', '🚗', '🦋', '☀️'];
    let tool = { kind: 'color', value: COLORS[0] }, size = 14, hue = 0;

    root.innerHTML = `<div class="paint-tools" id="tools"></div><div class="play paint" style="height:calc(100dvh - 250px)"><canvas></canvas></div>`;
    Core.say('¡A pintar! Elige un color y dibuja con el dedo.');
    const tools = root.querySelector('#tools'), canvas = root.querySelector('canvas'), ctx = canvas.getContext('2d');

    function fit() {
      const r = canvas.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      const old = canvas.width ? ctx.getImageData(0, 0, canvas.width, canvas.height) : null;
      canvas.width = r.width * dpr; canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, r.width, r.height);
      if (old) ctx.putImageData(old, 0, 0);
      ctx.lineCap = ctx.lineJoin = 'round';
    }
    fit();
    window.addEventListener('resize', fit);

    const addTool = (html, style, onPick, sel) => {
      const b = Core.el(`<button class="swatch" style="${style}">${html}</button>`);
      b.onclick = () => { tools.querySelectorAll('.swatch.sel').forEach(x => x.classList.remove('sel')); if (sel) b.classList.add('sel'); onPick(); Core.sfx.pop(); };
      tools.appendChild(b); return b;
    };
    COLORS.forEach((c, i) => { const b = addTool('', `background:${c}`, () => (tool = { kind: 'color', value: c }), true); if (!i) b.classList.add('sel'); });
    addTool('🌈', 'background:conic-gradient(red,orange,yellow,lime,cyan,blue,magenta,red)', () => (tool = { kind: 'rainbow' }), true);
    STAMPS.forEach(s => addTool(s, '', () => (tool = { kind: 'stamp', value: s }), true));
    addTool('🧽', '', () => (tool = { kind: 'color', value: '#ffffff' }), true);
    const sizeBtn = addTool('●', 'font-size:1rem', () => { size = size === 14 ? 30 : size === 30 ? 6 : 14; sizeBtn.style.fontSize = { 6: '.6rem', 14: '1rem', 30: '1.8rem' }[size]; }, false);
    addTool('🗑️', '', () => { if (confirm('¿Borrar el dibujo?')) { canvas.width = 0; fit(); Core.sfx.whoosh(); } }, false);
    addTool('💾', '', () => {
      const a = document.createElement('a'); a.download = 'mi-dibujo.png'; a.href = canvas.toDataURL('image/png'); a.click();
      Core.sfx.ding(); Core.say('¡Dibujo guardado!');
    }, false);

    const strokes = new Map();
    const pos = e => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    function stamp([x, y]) {
      ctx.font = `${size * 3}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(tool.value, x, y); Core.sfx.pop();
    }
    canvas.addEventListener('pointerdown', e => {
      e.preventDefault(); canvas.setPointerCapture(e.pointerId);
      const p = pos(e);
      if (tool.kind === 'stamp') return stamp(p);
      strokes.set(e.pointerId, p);
      ctx.beginPath(); ctx.arc(p[0], p[1], size / 2, 0, Math.PI * 2);
      ctx.fillStyle = tool.kind === 'rainbow' ? `hsl(${hue},90%,55%)` : tool.value; ctx.fill();
    });
    canvas.addEventListener('pointermove', e => {
      const prev = strokes.get(e.pointerId); if (!prev) return;
      const p = pos(e);
      hue = (hue + 4) % 360;
      ctx.strokeStyle = tool.kind === 'rainbow' ? `hsl(${hue},90%,55%)` : tool.value;
      ctx.lineWidth = size; ctx.beginPath(); ctx.moveTo(...prev); ctx.lineTo(...p); ctx.stroke();
      strokes.set(e.pointerId, p);
    });
    const end = e => strokes.delete(e.pointerId);
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);

    Core.gameState('pintar').played++;
    return () => window.removeEventListener('resize', fit);
  }
});
