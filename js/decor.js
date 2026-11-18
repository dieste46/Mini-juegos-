/* Decorado común: cielo con colinas y nubes de fondo, sol con cara, escena de la granja y títulos de colores. */
const Decor = (() => {
  const RAINBOW = ['#ff5a5f', '#ff9f1c', '#ffcd3c', '#2ebd6b', '#2fa4ff', '#8e6cff', '#ff6fa5'];

  function rainbow(text) {
    let i = 0;
    return [...text].map(ch => ch === ' ' ? ' ' : `<span style="color:${RAINBOW[i++ % RAINBOW.length]}">${ch}</span>`).join('');
  }

  const cloud = (cls) => `<svg class="cloud ${cls}" viewBox="0 0 120 60" aria-hidden="true">
    <path d="M22 50 Q4 50 6 37 Q8 25 22 27 Q24 10 44 12 Q56 0 72 10 Q90 4 96 22 Q116 22 114 38 Q112 50 98 50 Z" fill="#fff"/>
    <path d="M22 50 Q60 56 98 50" stroke="#dcecff" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`;

  const sun = () => `<svg class="sun" viewBox="0 0 100 100" aria-hidden="true">
    <g class="rays">${Array.from({ length: 12 }, (_, i) =>
      `<rect x="47" y="2" width="6" height="16" rx="3" fill="#ffcf3f" transform="rotate(${i * 30} 50 50)"/>`).join('')}</g>
    <circle cx="50" cy="50" r="28" fill="#ffd84d" stroke="#ffbf1f" stroke-width="3"/>
    <circle cx="41" cy="46" r="3.2" fill="#6b4a12"/><circle cx="59" cy="46" r="3.2" fill="#6b4a12"/>
    <circle cx="35" cy="56" r="4" fill="#ff9f6b" opacity=".6"/><circle cx="65" cy="56" r="4" fill="#ff9f6b" opacity=".6"/>
    <path d="M42 57 Q50 64 58 57" stroke="#6b4a12" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;

  // Colinas en capas (se estiran al ancho; son curvas suaves y no se nota).
  const hills = (horizon, path = false) => `<svg class="hills" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id="hFar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b7e48f"/><stop offset="1" stop-color="#94d26e"/></linearGradient>
      <linearGradient id="hMid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd567"/><stop offset="1" stop-color="#6cbd4c"/></linearGradient>
      <linearGradient id="hNear" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fcf58"/><stop offset="1" stop-color="#58a83c"/></linearGradient>
    </defs>
    <path d="M0 ${horizon - 4} Q14 ${horizon - 14} 30 ${horizon - 6} T62 ${horizon - 8} T100 ${horizon - 5} V100 H0 Z" fill="url(#hFar)"/>
    <path d="M0 ${horizon + 6} Q26 ${horizon - 6} 54 ${horizon + 4} T100 ${horizon + 1} V100 H0 Z" fill="url(#hMid)"/>
    <path d="M0 ${horizon + 16} Q42 ${horizon + 8} 100 ${horizon + 13} V100 H0 Z" fill="url(#hNear)"/>
    ${path ? `<path d="M44 100 Q49 ${horizon + 34} 61 ${horizon + 13} L65 ${horizon + 13} Q57 ${horizon + 36} 60 100 Z" fill="#ecd29b" opacity=".85"/>` : ''}
  </svg>`;

  // Fondo fijo de toda la web.
  function mount() {
    const d = document.getElementById('decor');
    if (!d) return;
    d.innerHTML = cloud('c1') + cloud('c2') + cloud('c3') + hills(70);
  }

  // Escena de la granja (tarjeta del menú y pantalla completa).
  function farmScene() {
    return `<div class="farm-sky"></div>${hills(46, true)}${sun()}${cloud('c1')}${cloud('c2')}
      <div class="flowers">${Array.from({ length: 14 }, (_, i) =>
        `<span style="left:${(i * 37) % 100}%;top:${62 + ((i * 53) % 34)}%">${['🌼', '🌷', '🌱', '🌸'][i % 4]}</span>`).join('')}</div>`;
  }

  return { rainbow, mount, farmScene };
})();
