/* Fx: partículas y sacudida, sin librerías.
   - Fx.system(): lista de partículas para juegos que ya pintan en su propio canvas (update(dt) + draw(ctx)).
   - Fx.overlay(host): canvas transparente encima de un juego hecho con DOM; solo se anima mientras hay partículas.
   Con "reducir movimiento" activado salen muchas menos partículas y no hay sacudida. */
const Fx = (() => {
  const calm = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const COLORS = ['#FFD23F', '#FF5FA2', '#35D6E6', '#5BE38C', '#FF8A3D', '#FFFFFF'];
  const EMO = 'system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

  function system(max = 280) {
    let ps = [], shT = 0, shD = 1, shM = 0;

    function burst(x, y, o = {}) {
      const n = Math.max(1, Math.round((o.n || 12) * (calm() ? 0.35 : 1)));
      const colors = o.colors || COLORS, spread = o.spread ?? Math.PI * 2;
      for (let i = 0; i < n && ps.length < max; i++) {
        const a = (o.angle || 0) + spread * (Math.random() - 0.5), v = (o.speed ?? 220) * (0.35 + Math.random() * 0.65);
        ps.push({
          x: x + (Math.random() - 0.5) * (o.jitter || 0), y: y + (Math.random() - 0.5) * (o.jitter || 0),
          vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: o.gravity ?? 500, drag: o.drag ?? 1.6,
          life: 0, max: (o.life || 0.7) * (0.6 + Math.random() * 0.6), size: (o.size || 7) * (0.6 + Math.random() * 0.8),
          grow: o.grow || 0, color: colors[(i + (Math.random() * colors.length | 0)) % colors.length],
          shape: o.shape || 'dot', rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 12, text: o.text
        });
      }
    }
    // Onda que se abre (un solo aro)
    const ring = (x, y, color = '#FFFFFF', size = 10, grow = 260, life = 0.4) =>
      ps.push({ x, y, vx: 0, vy: 0, g: 0, drag: 0, life: 0, max: life, size, grow, color, shape: 'ring', rot: 0, vr: 0 });

    function shake(mag = 8, dur = 0.35) { if (calm()) return; shM = mag; shD = dur; shT = dur; }
    function offset() { if (shT <= 0) return [0, 0]; const k = shM * (shT / shD); return [(Math.random() - 0.5) * 2 * k, (Math.random() - 0.5) * 2 * k]; }

    function update(dt) {
      shT = Math.max(0, shT - dt);
      for (const p of ps) {
        p.life += dt; const d = Math.max(0, 1 - p.drag * dt);
        p.vx *= d; p.vy = p.vy * d + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.size += p.grow * dt;
      }
      ps = ps.filter(p => p.life < p.max);
    }

    function draw(ctx) {
      for (const p of ps) {
        const k = p.life / p.max, s = Math.max(0.1, p.size);
        ctx.globalAlpha = Math.max(0, 1 - k * k); ctx.fillStyle = p.color;
        if (p.shape === 'ring') { ctx.strokeStyle = p.color; ctx.lineWidth = 5 * (1 - k) + 1; ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, 6.2832); ctx.stroke(); }
        else if (p.shape === 'text') { ctx.font = `${s}px ${EMO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.text, p.x, p.y); }
        else if (p.shape === 'puff') { ctx.globalAlpha *= 0.75; ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, 6.2832); ctx.fill(); }
        else if (p.shape === 'dot') { ctx.beginPath(); ctx.arc(p.x, p.y, s / 2, 0, 6.2832); ctx.fill(); }
        else {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          if (p.shape === 'star') {
            ctx.beginPath();
            for (let i = 0; i < 10; i++) { const r = i % 2 ? s * 0.45 : s, a = i * Math.PI / 5; ctx.lineTo(Math.sin(a) * r, -Math.cos(a) * r); }
            ctx.closePath(); ctx.fill();
          } else ctx.fillRect(-s / 2, -s / 3, s, s * 0.66);   // 'shard': trocito que gira
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
    }
    return { burst, ring, shake, offset, update, draw, get count() { return ps.length; } };
  }

  function overlay(host) {
    const cv = document.createElement('canvas'), ctx = cv.getContext('2d'), sys = system(200);
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:40';
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    host.appendChild(cv);
    let raf = 0, last = 0, dead = false;
    function fit() {
      const d = Math.min(2, window.devicePixelRatio || 1), w = host.clientWidth, h = host.clientHeight;
      if (cv.width !== Math.round(w * d) || cv.height !== Math.round(h * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); }
      ctx.setTransform(d, 0, 0, d, 0, 0);
    }
    function loop(now) {
      raf = 0; if (dead) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      sys.update(dt); ctx.clearRect(0, 0, host.clientWidth, host.clientHeight); sys.draw(ctx);
      if (sys.count) raf = requestAnimationFrame(loop);
    }
    const kick = () => { if (!raf && !dead) { fit(); last = performance.now(); raf = requestAnimationFrame(loop); } };
    return {
      burst(x, y, o) { sys.burst(x, y, o); kick(); },
      ring(x, y, c, s, g, l) { sys.ring(x, y, c, s, g, l); kick(); },
      // Sacude el propio juego sin tocar sus estilos
      shake(mag = 8) { if (!calm() && host.animate) host.animate([0, 1, -1, 0.6, -0.6, 0].map(k => ({ transform: `translate(${k * mag}px, ${-k * mag * 0.5}px)` })), { duration: 320 }); },
      // Coordenadas de un elemento dentro del host (su centro)
      at(el) { const a = el.getBoundingClientRect(), b = host.getBoundingClientRect(); return [a.left - b.left + a.width / 2, a.top - b.top + a.height / 2]; },
      destroy() { dead = true; cancelAnimationFrame(raf); cv.remove(); }
    };
  }

  return { system, overlay, calm, COLORS, EMO };
})();
