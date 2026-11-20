/* Piezas de decorado reutilizables (nubes, sol, colinas) y títulos de colores. Los temas las combinan. */
const Decor = (() => {
  const RAINBOW = ['#ff5a5f', '#ff9f1c', '#ffcd3c', '#2ebd6b', '#2fa4ff', '#8e6cff', '#ff6fa5'];

  function rainbow(text) {
    let i = 0;
    const esc = ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch] || ch);   // el título puede llevar el nombre del jugador
    return [...text].map(ch => ch === ' ' ? ' ' : `<span style="color:${RAINBOW[i++ % RAINBOW.length]}">${esc(ch)}</span>`).join('');
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
      <linearGradient id="hFar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fd47c"/><stop offset="1" stop-color="#4cc96b"/></linearGradient>
      <linearGradient id="hMid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#46c665"/><stop offset="1" stop-color="#3fbf5f"/></linearGradient>
      <linearGradient id="hNear" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#36b257"/><stop offset="1" stop-color="#2fa44e"/></linearGradient>
    </defs>
    <path d="M0 ${horizon - 4} Q14 ${horizon - 14} 30 ${horizon - 6} T62 ${horizon - 8} T100 ${horizon - 5} V100 H0 Z" fill="url(#hFar)"/>
    <path d="M0 ${horizon + 6} Q26 ${horizon - 6} 54 ${horizon + 4} T100 ${horizon + 1} V100 H0 Z" fill="url(#hMid)"/>
    <path d="M0 ${horizon + 16} Q42 ${horizon + 8} 100 ${horizon + 13} V100 H0 Z" fill="url(#hNear)"/>
    ${path ? `<path d="M44 100 Q49 ${horizon + 34} 61 ${horizon + 13} L65 ${horizon + 13} Q57 ${horizon + 36} 60 100 Z" fill="#ecd29b" opacity=".85"/>` : ''}
  </svg>`;

  // Vehículos vistos desde arriba (dibujos propios) para la carrera.
  const carTop = () => `<svg viewBox="0 0 60 104" aria-hidden="true">
    <rect x="2" y="16" width="10" height="20" rx="4" fill="#2b2b3a"/><rect x="48" y="16" width="10" height="20" rx="4" fill="#2b2b3a"/>
    <rect x="2" y="68" width="10" height="20" rx="4" fill="#2b2b3a"/><rect x="48" y="68" width="10" height="20" rx="4" fill="#2b2b3a"/>
    <rect x="7" y="4" width="46" height="96" rx="18" fill="#ff5a4d" stroke="#c43a30" stroke-width="2.5"/>
    <rect x="25" y="5" width="10" height="94" fill="#fff" opacity=".9"/>
    <path d="M14 34 Q30 24 46 34 L43 48 Q30 43 17 48 Z" fill="#8fd8ff" stroke="#3a86c8" stroke-width="2"/>
    <path d="M17 70 Q30 75 43 70 L45 82 Q30 88 15 82 Z" fill="#8fd8ff" stroke="#3a86c8" stroke-width="2"/>
    <rect x="15" y="50" width="30" height="18" rx="5" fill="#ff7a6e"/>
    <ellipse cx="16" cy="10" rx="5" ry="3.5" fill="#fff3a6"/><ellipse cx="44" cy="10" rx="5" ry="3.5" fill="#fff3a6"/></svg>`;
  const rocketTop = () => `<svg viewBox="0 0 60 104" aria-hidden="true">
    <path class="flame" d="M20 78 Q30 112 40 78 Z" fill="#ffb02e"/><path class="flame" d="M25 78 Q30 98 35 78 Z" fill="#fff3a6"/>
    <path d="M14 56 L2 84 L18 76 Z" fill="#ff5a4d" stroke="#c43a30" stroke-width="2"/><path d="M46 56 L58 84 L42 76 Z" fill="#ff5a4d" stroke="#c43a30" stroke-width="2"/>
    <path d="M30 2 C48 22 48 58 42 80 H18 C12 58 12 22 30 2 Z" fill="#f4f6ff" stroke="#b9c2e8" stroke-width="2.5"/>
    <path d="M30 2 C38 11 42 20 44 30 H16 C18 20 22 11 30 2 Z" fill="#ff5a4d"/>
    <circle cx="30" cy="46" r="9" fill="#8fd8ff" stroke="#3a86c8" stroke-width="2.5"/><circle cx="27" cy="43" r="2.5" fill="#fff"/></svg>`;

  // Fondo fijo de toda la web: lo dibuja el tema activo.
  function mount() { Themes.apply(); }

  return { rainbow, mount, cloud, sun, hills, carTop, rocketTop };
})();
