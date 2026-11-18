/* Bip: la mascota de Mini Juegos, un robot redondo dibujado en SVG (personaje propio).
   Sirve para cualquier tema: granja, espacio o los que vengan. */
const Mascot = (() => {
  const NAME = 'Bip';
  function svg() {
    return `<svg class="mascot" viewBox="0 0 120 124" aria-hidden="true">
  <defs>
    <linearGradient id="bipBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d9e6ff"/></linearGradient>
    <linearGradient id="bipFace" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#25306b"/><stop offset="1" stop-color="#151b47"/></linearGradient>
  </defs>
  <ellipse cx="60" cy="118" rx="30" ry="5" fill="rgba(30,40,90,.18)"/>
  <line x1="60" y1="20" x2="60" y2="8" stroke="#8aa0d8" stroke-width="4" stroke-linecap="round"/>
  <circle class="mascot-light" cx="60" cy="7" r="6" fill="#ffcd3c"/>
  <rect x="8" y="58" width="14" height="26" rx="7" fill="#7fc8ff" transform="rotate(14 15 71)"/>
  <rect x="98" y="58" width="14" height="26" rx="7" fill="#7fc8ff" transform="rotate(-14 105 71)"/>
  <rect x="38" y="100" width="16" height="14" rx="6" fill="#7fc8ff"/><rect x="66" y="100" width="16" height="14" rx="6" fill="#7fc8ff"/>
  <rect x="18" y="20" width="84" height="86" rx="38" fill="url(#bipBody)" stroke="#b9c9f2" stroke-width="3"/>
  <rect x="28" y="34" width="64" height="44" rx="20" fill="url(#bipFace)"/>
  <g class="mascot-eyes">
    <ellipse cx="47" cy="54" rx="6.5" ry="8" fill="#6ef0ff"/><ellipse cx="73" cy="54" rx="6.5" ry="8" fill="#6ef0ff"/>
    <circle cx="49" cy="51" r="2.2" fill="#fff"/><circle cx="75" cy="51" r="2.2" fill="#fff"/>
  </g>
  <path d="M52 66 Q60 72 68 66" stroke="#6ef0ff" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <circle cx="32" cy="86" r="5" fill="#ff8fb1" opacity=".55"/><circle cx="88" cy="86" r="5" fill="#ff8fb1" opacity=".55"/>
  <rect x="50" y="84" width="20" height="8" rx="4" fill="#ffcd3c"/>
  <ellipse cx="40" cy="30" rx="12" ry="5" fill="#fff" opacity=".8" transform="rotate(-20 40 30)"/>
</svg>`;
  }
  return { svg, NAME };
})();
