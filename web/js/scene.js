/* Scene: utilidades de dibujo compartidas por los juegos que pintan en canvas (Súper Rescate, Carrera).
   Azar repetible, colinas, nubes, árboles y casas con el mismo estilo en todos. */
const Scene = (() => {
  const TAU = Math.PI * 2;
  const rnd = (k, s = 0) => { const x = Math.sin(k * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };   // azar repetible
  const mod = (a, n) => ((a % n) + n) % n;
  const circle = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, TAU); ctx.fill(); };
  const hillY = (wx, base, a1, l1, a2, l2) => base - a1 * Math.sin(wx / l1) - a2 * Math.sin(wx / l2 + 1.7);
  function ridge(ctx, W, H, off, fill, f) {
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W + 16; x += 16) ctx.lineTo(x, f(x + off));
    ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  }
  // Coloca adornos repetidos a lo largo de una capa: llama a draw(k, x en pantalla, x en el mundo)
  function along(W, off, gap, draw) {
    for (let k = Math.floor(off / gap) - 1; k <= Math.floor((off + W) / gap) + 1; k++) { const wx = k * gap + rnd(k, 7) * gap * 0.6; draw(k, wx - off, wx); }
  }
  function cloud(ctx, x, y, s, color) {   // color sólido (no transparente) para que no se noten las uniones
    ctx.fillStyle = color; ctx.beginPath();
    ctx.arc(x - s * 0.5, y, s * 0.34, 0, TAU); ctx.arc(x - s * 0.08, y - s * 0.2, s * 0.46, 0, TAU); ctx.arc(x + s * 0.46, y - s * 0.02, s * 0.36, 0, TAU);
    ctx.arc(x + s * 0.12, y + s * 0.1, s * 0.3, 0, TAU); ctx.arc(x - s * 0.3, y + s * 0.12, s * 0.26, 0, TAU); ctx.fill();
  }
  function tree(ctx, x, y, s) {
    ctx.fillStyle = '#8A5A2B'; ctx.fillRect(x - s * 0.08, y - s * 0.5, s * 0.16, s * 0.55);
    ctx.fillStyle = '#2FA44E'; circle(ctx, x, y - s * 0.78, s * 0.42);
    ctx.fillStyle = '#4CC96B'; circle(ctx, x - s * 0.12, y - s * 0.9, s * 0.22);
  }
  function house(ctx, x, y, s, barn) {
    const w = s * 1.1, h = s * 0.7;
    ctx.fillStyle = barn ? '#D9383F' : '#FFF3D6'; ctx.fillRect(x - w / 2, y - h, w, h + 4);
    ctx.fillStyle = barn ? '#A9262C' : '#E5484D';
    ctx.beginPath(); ctx.moveTo(x - w * 0.62, y - h); ctx.lineTo(x, y - h - s * 0.5); ctx.lineTo(x + w * 0.62, y - h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = barn ? '#FFF3D6' : '#8A5A2B'; ctx.fillRect(x - s * 0.14, y - h * 0.62, s * 0.28, h * 0.62 + 4);
    if (!barn) { ctx.fillStyle = '#7CC6FF'; ctx.fillRect(x + w * 0.2, y - h * 0.7, s * 0.2, s * 0.2); }
  }
  return { TAU, rnd, mod, circle, hillY, ridge, along, cloud, tree, house };
})();
