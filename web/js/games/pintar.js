/* Pintar: hoja en blanco o láminas para colorear, con bote de pintura, pinceles mágicos, sellos, espejo,
   deshacer, música al pintar y galería propia. Nada se pierde: cada dibujo se guarda solo al salir.
   Dos capas: la pintura debajo y las líneas de la lámina encima, para que el color nunca tape el dibujo. */
Games.push({
  id: 'pintar', section: 'recreo',
  name: 'Pintar', emoji: '🎨', art: () => 'pintar', color: '#ff8a1c',
  learns: 'Creatividad, motricidad fina y simetría.',
  start(root, exit) {
    const COLORS = ['#e8323c', '#ff8a1c', '#ffd23f', '#8bd450', '#2ebd6b', '#35c9d6', '#2f80ff', '#8e4ad8', '#ff6fa5', '#b9773f', '#2d2552', '#ffffff'];
    const NOTES = [262, 294, 330, 392, 440, 523, 587, 659, 784, 880];
    const profile = Store.profile.id;
    let leave = () => {};

    // ---------------- Elegir qué pintar ----------------
    async function picker() {
      leave = () => {};
      document.body.classList.remove('in-game');
      const mine = Themes.set('laminas'), ids = [...mine, ...Object.keys(Laminas.PAGES).filter(k => !mine.includes(k))];
      const saved = await Art.list(profile);
      root.innerHTML = `<div class="prompt"><button class="speak-btn">🔊</button><span>¿Qué quieres pintar?</span></div>
        <div class="pick-grid">
          <button class="pick blank" data-page=""><span>✏️</span></button>
          ${ids.map(id => `<button class="pick" data-page="${id}"><img src="${Laminas.thumb(id)}" alt="${Laminas.PAGES[id].name}"></button>`).join('')}
        </div>
        ${saved.length ? `<h2 class="section-title"><span>🖼️</span> Mis dibujos</h2>
        <div class="pick-grid">${saved.map(s => `<div class="pick mine"><button class="open" data-id="${s.id}"><img src="${s.thumb}" alt="Mi dibujo"></button><button class="del" data-id="${s.id}" aria-label="Borrar">✕</button></div>`).join('')}</div>` : ''}`;
      const ask = () => Core.say('¿Qué quieres pintar? Elige un dibujo o la hoja en blanco.');
      root.querySelector('.speak-btn').onclick = ask; ask();
      root.querySelectorAll('.pick[data-page]').forEach(b => b.onclick = () => { Core.sfx.pop(); editor({ page: b.dataset.page }); });
      root.querySelectorAll('.open').forEach(b => b.onclick = async () => { Core.sfx.pop(); const entry = await Art.get(b.dataset.id); if (entry) editor({ page: entry.page, entry }); });
      root.querySelectorAll('.del').forEach(b => b.onclick = async () => { if (confirm('¿Borrar este dibujo?')) { await Art.remove(b.dataset.id); picker(); } });
    }

    // ---------------- Pintar ----------------
    function editor({ page, entry }) {
      document.body.classList.add('in-game'); window.scrollTo(0, 0);
      const land = entry ? entry.w > entry.h : innerWidth > innerHeight * 1.1;
      const W = entry ? entry.w : (land ? 1200 : 900), H = entry ? entry.h : (land ? 900 : 1200);
      const STAMPS = Themes.set('sellos');
      let tool = page ? 'bote' : 'pincel', color = COLORS[0], stamp = STAMPS[0], size = 30, hue = 0;
      let mirror = false, sound = true, dirty = false, lastNote = 0, id = entry ? entry.id : null;
      const undo = [];

      root.innerHTML = `<div class="paint-bar" id="acts"></div>
        <div class="paper-wrap"><div class="paper"><canvas class="p-paint" width="${W}" height="${H}"></canvas><canvas class="p-lines" width="${W}" height="${H}"></canvas><i class="mirror-line" hidden></i></div></div>
        <div class="paint-bar" id="tools"></div><div class="paint-bar wrap" id="palette"></div>`;
      const cv = root.querySelector('.p-paint'), ctx = cv.getContext('2d', { willReadFrequently: true });
      const lcv = root.querySelector('.p-lines'), lctx = lcv.getContext('2d', { willReadFrequently: true });
      const paper = root.querySelector('.paper'), wrap = root.querySelector('.paper-wrap');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.lineCap = ctx.lineJoin = 'round';
      if (page) Laminas.draw(lctx, page, W, H);
      // Alfa de las líneas: lo que frena al bote de pintura.
      const L = new Uint8Array(W * H);
      { const ld = lctx.getImageData(0, 0, W, H).data; for (let i = 0; i < W * H; i++) L[i] = ld[i * 4 + 3]; }
      if (entry && entry.paint) {
        const url = URL.createObjectURL(entry.paint), im = new Image();
        im.onload = () => { ctx.drawImage(im, 0, 0, W, H); URL.revokeObjectURL(url); };
        im.src = url;
      }

      // El papel ocupa todo el hueco entre las barras, manteniendo su proporción.
      function fit() {
        const below = root.querySelector('#tools').offsetHeight + root.querySelector('#palette').offsetHeight + 30;
        const aw = wrap.clientWidth, ah = Math.max(200, innerHeight - wrap.getBoundingClientRect().top - below);
        const s = Math.min(aw / W, ah / H);
        paper.style.width = W * s + 'px'; paper.style.height = H * s + 'px';
      }

      // ---------- Barras ----------
      const btn = (bar, icon, label, on) => { const b = Core.el(`<button class="pbtn" aria-label="${label}">${icon}</button>`); b.onclick = () => on(b); root.querySelector(bar).appendChild(b); return b; };
      btn('#acts', '📄', 'Otro dibujo', async () => { await close(); picker(); });
      btn('#acts', '↩️', 'Deshacer', () => { const s = undo.pop(); if (!s) return Core.sfx.bonk(); ctx.putImageData(s, 0, 0); dirty = true; Core.sfx.whoosh(); });
      btn('#acts', '🪞', 'Espejo', b => { mirror = !mirror; b.classList.toggle('on', mirror); root.querySelector('.mirror-line').hidden = !mirror; Core.sfx.pop(); Core.say(mirror ? 'Espejo. Lo que pintes sale en los dos lados.' : 'Sin espejo.'); });
      btn('#acts', '🎵', 'Música', b => { sound = !sound; b.classList.toggle('on', sound); if (sound) Core.sfx.ding(); }).classList.add('on');
      const sizeBtn = btn('#acts', '<i class="dot"></i>', 'Tamaño', () => { size = size === 30 ? 60 : size === 60 ? 14 : 30; sizeBtn.style.setProperty('--d', { 14: '8px', 30: '16px', 60: '28px' }[size]); Core.sfx.pop(); });
      btn('#acts', '📤', 'Enviar', share);

      const TOOLS = [['pincel', '🖌️', 'Pincel'], ['bote', '🪣', 'Bote de pintura'], ['arcoiris', '🌈', 'Arcoíris'], ['purpurina', '✨', 'Purpurina'],
                     ['luz', '💡', 'Rotulador de luz'], ['sello', stamp, 'Sellos'], ['goma', '🧽', 'Goma']];
      const toolBtns = {};
      TOOLS.forEach(([k, icon, label]) => { toolBtns[k] = btn('#tools', icon, label, () => { tool = k; Core.sfx.pop(); Core.say(label); refresh(); }); });
      const pal = root.querySelector('#palette');
      function refresh() {
        Object.entries(toolBtns).forEach(([k, b]) => b.classList.toggle('on', k === tool));
        pal.innerHTML = '';
        if (tool === 'sello') STAMPS.forEach(s => { const b = Core.el(`<button class="pbtn${s === stamp ? ' on' : ''}">${s}</button>`); b.onclick = () => { stamp = s; toolBtns.sello.textContent = s; Core.sfx.pop(); refresh(); }; pal.appendChild(b); });
        else COLORS.forEach(c => { const b = Core.el(`<button class="swatch${c === color ? ' sel' : ''}" style="background:${c}"></button>`); b.onclick = () => { color = c; if (tool === 'goma' || tool === 'sello' || tool === 'arcoiris') tool = 'pincel'; Core.sfx.pop(); refresh(); }; pal.appendChild(b); });
        fit();
      }
      refresh();
      addEventListener('resize', fit);
      Core.say(page ? 'Toca cada trozo del dibujo para llenarlo de color.' : '¡A pintar! Elige un color y dibuja con el dedo.');

      // ---------- Pintura ----------
      const snap = () => { undo.push(ctx.getImageData(0, 0, W, H)); if (undo.length > 6) undo.shift(); dirty = true; };
      const pos = ev => { const r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) * W / r.width, (ev.clientY - r.top) * H / r.height]; };
      const sides = fn => { fn(1); if (mirror) fn(-1); };            // dibuja y, si hay espejo, repite reflejado
      const mx = (x, s) => s === 1 ? x : W - x;

      function seg(a, b) {
        hue = (hue + 5) % 360;
        const col = tool === 'goma' ? '#ffffff' : tool === 'arcoiris' ? `hsl(${hue},90%,55%)` : color;
        sides(s => {
          const ax = mx(a[0], s), bx = mx(b[0], s);
          if (tool === 'purpurina') {
            for (let i = 0; i < 7; i++) {
              const x = bx + (Math.random() - .5) * size * 1.6, y = b[1] + (Math.random() - .5) * size * 1.6, q = 2 + Math.random() * size * .22;
              ctx.globalAlpha = .5 + Math.random() * .5; ctx.fillStyle = Core.pick([color, color, '#fff3a6', '#ffffff', '#ffd23f']);
              ctx.beginPath();
              if (i % 3) ctx.arc(x, y, q, 0, 7); else { ctx.moveTo(x, y - q * 2.4); ctx.lineTo(x + q * .6, y - q * .6); ctx.lineTo(x + q * 2.4, y); ctx.lineTo(x + q * .6, y + q * .6); ctx.lineTo(x, y + q * 2.4); ctx.lineTo(x - q * .6, y + q * .6); ctx.lineTo(x - q * 2.4, y); ctx.lineTo(x - q * .6, y - q * .6); }
              ctx.fill();
            }
            ctx.globalAlpha = 1; return;
          }
          ctx.beginPath(); ctx.moveTo(ax, a[1]); ctx.lineTo(bx, b[1]);
          if (tool === 'luz') {
            ctx.shadowColor = color; ctx.shadowBlur = size * .9; ctx.strokeStyle = color; ctx.lineWidth = size * .55; ctx.stroke();
            ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = size * .18; ctx.stroke();
          } else { ctx.strokeStyle = col; ctx.lineWidth = size; ctx.stroke(); }
        });
      }

      function putStamp(p) {
        sides(s => { ctx.font = `${size * 3.2}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(stamp, mx(p[0], s), p[1]); });
        Core.sfx.pop();
      }

      // Bote de pintura: rellena la zona tocada hasta las líneas de la lámina o hasta otro color.
      function bucket(px, py) {
        let x = Math.round(px), y = Math.round(py);
        if (x < 0 || y < 0 || x >= W || y >= H) return false;
        if (L[y * W + x] > 140) {           // ha tocado justo una línea: se busca el hueco más cercano
          let found = false;
          for (let rad = 2; rad <= 14 && !found; rad += 2) for (let k = 0; k < 8 && !found; k++) {
            const nx = Math.round(x + rad * Math.cos(k * Math.PI / 4)), ny = Math.round(y + rad * Math.sin(k * Math.PI / 4));
            if (nx >= 0 && ny >= 0 && nx < W && ny < H && L[ny * W + nx] <= 140) { x = nx; y = ny; found = true; }
          }
          if (!found) return false;
        }
        const img = ctx.getImageData(0, 0, W, H), d = img.data, p0 = (y * W + x) * 4;
        const sr = d[p0], sg = d[p0 + 1], sb = d[p0 + 2];
        const fr = parseInt(color.slice(1, 3), 16), fg = parseInt(color.slice(3, 5), 16), fb = parseInt(color.slice(5, 7), 16);
        if (Math.abs(sr - fr) + Math.abs(sg - fg) + Math.abs(sb - fb) < 12) return false;
        const ok = i => { if (L[i] > 140) return false; const q = i * 4; return Math.abs(d[q] - sr) + Math.abs(d[q + 1] - sg) + Math.abs(d[q + 2] - sb) <= 96; };
        const seen = new Uint8Array(W * H), stack = [y * W + x];
        let x0 = W, x1 = 0, y0 = H, y1 = 0;
        while (stack.length) {
          let i = stack.pop(); if (seen[i] || !ok(i)) continue;
          const row = Math.floor(i / W), base = row * W;
          let l = i; while (l > base && !seen[l - 1] && ok(l - 1)) l--;
          let r2 = i; while (r2 < base + W - 1 && !seen[r2 + 1] && ok(r2 + 1)) r2++;
          for (let j = l; j <= r2; j++) {
            seen[j] = 1;
            if (row > 0 && !seen[j - W]) stack.push(j - W);
            if (row < H - 1 && !seen[j + W]) stack.push(j + W);
          }
          if (l - base < x0) x0 = l - base; if (r2 - base > x1) x1 = r2 - base; if (row < y0) y0 = row; if (row > y1) y1 = row;
        }
        // Dos pasadas de "engorde" para tapar el borde difuminado bajo las líneas.
        for (let pass = 1; pass <= 2; pass++) {
          x0 = Math.max(1, x0 - 1); y0 = Math.max(1, y0 - 1); x1 = Math.min(W - 2, x1 + 1); y1 = Math.min(H - 2, y1 + 1);
          for (let yy = y0; yy <= y1; yy++) for (let xx = x0, i = yy * W + x0; xx <= x1; xx++, i++)
            if (!seen[i] && (seen[i - 1] === pass || seen[i + 1] === pass || seen[i - W] === pass || seen[i + W] === pass)) seen[i] = pass + 1;
        }
        for (let yy = y0; yy <= y1; yy++) for (let xx = x0, i = yy * W + x0; xx <= x1; xx++, i++)
          if (seen[i]) { const q = i * 4; d[q] = fr; d[q + 1] = fg; d[q + 2] = fb; d[q + 3] = 255; }
        ctx.putImageData(img, 0, 0);
        return true;
      }

      const strokes = new Map();
      cv.addEventListener('pointerdown', ev => {
        ev.preventDefault(); try { cv.setPointerCapture(ev.pointerId); } catch {}
        const p = pos(ev);
        if (tool === 'bote') {
          const before = ctx.getImageData(0, 0, W, H);
          if (bucket(p[0], p[1])) { undo.push(before); if (undo.length > 6) undo.shift(); dirty = true; if (sound) { Core.tone(523, .1, 'triangle', .2, 1047); } }
          else Core.sfx.bonk();
          return;
        }
        snap();
        if (tool === 'sello') return putStamp(p);
        strokes.set(ev.pointerId, p); seg(p, [p[0] + .1, p[1] + .1]);
      });
      cv.addEventListener('pointermove', ev => {
        const prev = strokes.get(ev.pointerId); if (!prev) return;
        const p = pos(ev); seg(prev, p); strokes.set(ev.pointerId, p);
        const now = performance.now();
        if (sound && now - lastNote > 140) {   // cada trazo suena: arriba agudo, abajo grave
          lastNote = now;
          Core.tone(NOTES[Math.max(0, Math.min(NOTES.length - 1, Math.floor((1 - p[1] / H) * NOTES.length)))], .25, tool === 'purpurina' ? 'triangle' : 'sine', .1);
        }
      });
      const end = ev => strokes.delete(ev.pointerId);
      cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);

      // ---------- Guardar y enviar ----------
      function flat(w, h) {
        const out = document.createElement('canvas'); out.width = w; out.height = h;
        const o = out.getContext('2d'); o.fillStyle = '#fff'; o.fillRect(0, 0, w, h); o.drawImage(cv, 0, 0, w, h); o.drawImage(lcv, 0, 0, w, h);
        return out;
      }
      async function save() {
        if (!dirty) return;
        dirty = false;
        id = id || 'd' + Date.now().toString(36);
        const paint = await new Promise(res => cv.toBlob(res, 'image/png'));
        await Art.put({ id, profile, page: page || '', w: W, h: H, updated: Date.now(), paint, thumb: flat(Math.round(W / 4), Math.round(H / 4)).toDataURL('image/jpeg', .8) });
      }
      function share() {
        flat(W, H).toBlob(async blob => {
          const file = new File([blob], 'mi-dibujo.png', { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: 'Mi dibujo' }); } catch {} return; }
          const a = document.createElement('a'); a.download = 'mi-dibujo.png'; a.href = URL.createObjectURL(blob); a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        }, 'image/png');
      }
      const onHide = () => { if (document.hidden) save(); };
      document.addEventListener('visibilitychange', onHide);
      const close = () => { removeEventListener('resize', fit); document.removeEventListener('visibilitychange', onHide); return save(); };
      leave = () => { close(); };
      requestAnimationFrame(fit);
    }

    Core.gameState('pintar').played++; Core.save();
    picker();
    return () => leave();
  }
});
