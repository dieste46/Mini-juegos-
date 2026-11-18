/* Láminas para colorear (dibujos propios). Lienzo lógico de 300 x 400.
   Cada lámina es una lista de formas de atrás hacia delante: una forma cerrada tapa lo que tiene detrás
   (se borra su interior y se traza su borde), así se pueden solapar sin dejar líneas cruzadas.
   Una forma con { open: true } es solo una línea. */
const Laminas = (() => {
  const c = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
  const e = (x, y, rx, ry) => `M${x - rx} ${y}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
  const r = (x, y, w, h, q = 0) => `M${x + q} ${y}H${x + w - q}Q${x + w} ${y} ${x + w} ${y + q}V${y + h - q}Q${x + w} ${y + h} ${x + w - q} ${y + h}H${x + q}Q${x} ${y + h} ${x} ${y + h - q}V${y + q}Q${x} ${y} ${x + q} ${y}Z`;
  const star = (x, y, R) => 'M' + Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? R * 0.45 : R;
    return `${(x + q * Math.cos(a)).toFixed(1)} ${(y + q * Math.sin(a)).toFixed(1)}`;
  }).join('L') + 'Z';
  const o = d => ({ d, open: true });
  const cloud = (x, y) => `M${x} ${y}c0 -20 30 -22 35 -8c15 -12 37 0 30 16c13 7 5 24 -10 22h-45c-18 2 -24 -20 -10 -30Z`;
  const petals = (x, y, d, pr, n) => Array.from({ length: n }, (_, i) => c(x + d * Math.cos(i * 2 * Math.PI / n), y + d * Math.sin(i * 2 * Math.PI / n), pr));

  const PAGES = {
    cohete: { name: 'El cohete', shapes: [
      star(48, 80, 17), star(252, 60, 13), star(258, 165, 11), c(46, 190, 14), star(60, 320, 12), star(245, 330, 14),
      'M120 290C112 335 150 378 150 378C150 378 188 335 180 290Z', 'M135 290C132 315 150 342 150 342C150 342 168 315 165 290Z',
      'M101 200L52 288L104 262Z', 'M199 200L248 288L196 262Z', 'M118 258L110 292H190L182 258Z',
      'M150 38C200 90 210 170 200 262H100C90 170 100 90 150 38Z', o('M112 112Q150 130 188 112'),
      c(150, 172, 27), c(150, 172, 15), o('M108 232H192')
    ] },
    astronauta: { name: 'El astronauta', shapes: [
      star(40, 62, 14), star(262, 84, 12), star(254, 335, 13), c(44, 330, 11), star(52, 200, 9),
      o('M150 42V22'), c(150, 15, 7),
      'M96 200C60 205 44 246 54 272C62 288 83 284 85 269C81 252 88 241 97 239Z', 'M204 200C240 205 256 246 246 272C238 288 217 284 215 269C219 252 212 241 203 239Z',
      r(104, 280, 40, 78, 15), r(156, 280, 40, 78, 15), o('M104 334H144'), o('M156 334H196'),
      r(94, 176, 112, 116, 30), r(124, 214, 52, 36, 7), c(140, 232, 6), c(160, 232, 6),
      c(150, 110, 70), e(150, 116, 47, 39), o('M124 104Q134 90 150 88')
    ] },
    planeta: { name: 'El planeta', shapes: [
      star(50, 72, 17), star(248, 62, 14), star(58, 335, 13), star(244, 326, 16), c(150, 48, 8), c(262, 220, 7), c(34, 215, 6),
      'M29 222A125 32 -15 1 0 271 158A125 32 -15 1 0 29 222Z',
      c(150, 190, 80), o('M74 168Q150 146 226 168'), o('M71 205Q150 232 229 205'),
      o('M71 205C40 214 24 226 30 236C40 252 110 244 180 222C240 203 280 172 272 156C268 148 250 148 228 153')
    ] },
    ovni: { name: 'El platillo volante', shapes: [
      star(45, 70, 15), star(252, 92, 13), star(268, 262, 10), star(36, 270, 10), c(240, 40, 7),
      'M106 216L58 372H242L194 216Z', o('M150 222V372'),
      e(150, 190, 112, 33), 'M98 172A52 52 0 0 1 202 172Z', c(150, 150, 15),
      c(84, 192, 9), c(128, 203, 9), c(172, 203, 9), c(216, 192, 9)
    ] },
    casa: { name: 'La casa', shapes: [
      c(52, 62, 26), o('M52 22V8'), o('M88 62H102'), o('M80 34L90 24'), o('M24 34L14 24'), o('M16 62H2'),
      cloud(188, 62), o('M0 332H300'),
      r(196, 104, 26, 62), 'M48 192L150 100L252 192Z', c(150, 156, 15),
      'M70 190H230V332H70Z', 'M130 332V266A20 20 0 0 1 170 266V332Z', c(162, 296, 4),
      'M85 215H121V251H85Z', o('M103 215V251'), o('M85 233H121'), 'M179 215H215V251H179Z', o('M197 215V251'), o('M179 233H215'),
      o('M36 332V300'), ...petals(36, 288, 9, 6, 5), c(36, 288, 5), o('M264 332V304'), ...petals(264, 292, 9, 6, 5), c(264, 292, 5)
    ] },
    tractor: { name: 'El tractor', shapes: [
      c(250, 62, 25), cloud(40, 70), o('M0 322H300'),
      r(226, 150, 13, 54, 4), r(94, 106, 104, 16, 6), 'M104 120H188V208H104Z', 'M118 134H174V186H118Z',
      r(150, 198, 114, 62, 9), c(250, 222, 7), o('M168 214H226'), o('M168 228H226'), r(98, 236, 150, 30, 6),
      c(95, 266, 56), c(95, 266, 23), c(228, 288, 34), c(228, 288, 12)
    ] },
    flor: { name: 'La flor', shapes: [
      c(48, 56, 24), cloud(196, 50),
      'M145 306C140 250 146 220 145 190H156C156 220 150 250 156 306Z',
      'M146 262C110 252 94 226 94 226C120 222 141 236 146 256Z', 'M155 246C191 236 207 210 207 210C181 206 160 220 155 240Z',
      'M110 322H190L180 384H120Z', r(101, 304, 98, 20, 7),
      ...petals(150, 130, 46, 30, 8), c(150, 130, 28), c(140, 124, 3), c(160, 124, 3), o('M140 138Q150 146 160 138')
    ] },
    mariposa: { name: 'La mariposa', shapes: [
      ...petals(50, 350, 10, 7, 5), c(50, 350, 6), ...petals(250, 350, 10, 7, 5), c(250, 350, 6), cloud(30, 50), cloud(196, 44),
      o('M144 118C136 96 122 86 113 83'), o('M156 118C164 96 178 86 187 83'), c(111, 81, 5), c(189, 81, 5),
      'M140 190C90 90 20 92 25 162C28 212 100 226 140 216Z', 'M160 190C210 90 280 92 275 162C272 212 200 226 160 216Z',
      'M140 215C80 220 40 262 60 312C80 352 135 322 142 250Z', 'M160 215C220 220 260 262 240 312C220 352 165 322 158 250Z',
      c(76, 152, 19), c(224, 152, 19), c(96, 282, 15), c(204, 282, 15), c(112, 188, 9), c(188, 188, 9),
      c(150, 130, 17), e(150, 212, 13, 70)
    ] }
  };

  // Dibuja la lámina en un canvas transparente (solo líneas), centrada y a escala.
  function draw(ctx, id, W, H) {
    ctx.clearRect(0, 0, W, H);
    const page = PAGES[id]; if (!page) return;
    const s = Math.min(W / 300, H / 400);
    ctx.save();
    ctx.translate((W - 300 * s) / 2, (H - 400 * s) / 2); ctx.scale(s, s);
    ctx.lineWidth = 5; ctx.lineJoin = ctx.lineCap = 'round'; ctx.strokeStyle = '#2d2552';
    page.shapes.forEach(sh => {
      const p = new Path2D(typeof sh === 'string' ? sh : sh.d);
      if (typeof sh === 'string') { ctx.globalCompositeOperation = 'destination-out'; ctx.fill(p); ctx.globalCompositeOperation = 'source-over'; }
      ctx.stroke(p);
    });
    ctx.restore();
  }

  const thumbs = {};
  function thumb(id) {
    if (!thumbs[id]) {
      const cv = document.createElement('canvas'); cv.width = 225; cv.height = 300;
      const x = cv.getContext('2d'); draw(x, id, 225, 300);
      const out = document.createElement('canvas'); out.width = 225; out.height = 300;
      const o2 = out.getContext('2d'); o2.fillStyle = '#fff'; o2.fillRect(0, 0, 225, 300); o2.drawImage(cv, 0, 0);
      thumbs[id] = out.toDataURL('image/png');
    }
    return thumbs[id];
  }
  return { PAGES, draw, thumb };
})();
