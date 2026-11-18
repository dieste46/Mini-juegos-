/* Cerdi: la mascota de Mini Juegos, dibujada en SVG (personaje propio).
   Mascot.svg(mood) devuelve el SVG; mood: 'happy' | 'wow'. */
const Mascot = (() => {
  function svg(mood = 'happy') {
    const mouth = mood === 'wow'
      ? '<ellipse cx="60" cy="82" rx="6" ry="7" fill="#7a2341"/>'
      : '<path d="M50 80 Q60 90 70 80" stroke="#7a2341" stroke-width="3.5" fill="none" stroke-linecap="round"/>';
    return `<svg class="cerdi" viewBox="0 0 120 120" aria-hidden="true">
  <defs>
    <radialGradient id="cerdiBody" cx="40%" cy="32%" r="70%">
      <stop offset="0" stop-color="#ffd3e1"/><stop offset=".55" stop-color="#ff9cbc"/><stop offset="1" stop-color="#f0779f"/>
    </radialGradient>
    <radialGradient id="cerdiSnout" cx="45%" cy="35%" r="70%">
      <stop offset="0" stop-color="#ffc0d3"/><stop offset="1" stop-color="#f27aa1"/>
    </radialGradient>
  </defs>
  <ellipse cx="60" cy="113" rx="30" ry="5" fill="rgba(60,40,80,.15)"/>
  <path d="M30 34 L24 10 L48 24 Z" fill="#f27aa1" stroke="#e0628c" stroke-width="2" stroke-linejoin="round"/>
  <path d="M90 34 L96 10 L72 24 Z" fill="#f27aa1" stroke="#e0628c" stroke-width="2" stroke-linejoin="round"/>
  <ellipse cx="44" cy="104" rx="9" ry="7" fill="#f0779f"/><ellipse cx="76" cy="104" rx="9" ry="7" fill="#f0779f"/>
  <circle cx="60" cy="62" r="44" fill="url(#cerdiBody)"/>
  <ellipse cx="44" cy="36" rx="14" ry="8" fill="#fff" opacity=".45" transform="rotate(-25 44 36)"/>
  <circle cx="30" cy="70" r="7" fill="#ff6f96" opacity=".45"/><circle cx="90" cy="70" r="7" fill="#ff6f96" opacity=".45"/>
  <g class="cerdi-eyes">
    <ellipse cx="44" cy="52" rx="8.5" ry="10" fill="#fff"/><ellipse cx="76" cy="52" rx="8.5" ry="10" fill="#fff"/>
    <circle cx="45.5" cy="54" r="5.5" fill="#2b2140"/><circle cx="77.5" cy="54" r="5.5" fill="#2b2140"/>
    <circle cx="47.5" cy="51.5" r="2" fill="#fff"/><circle cx="79.5" cy="51.5" r="2" fill="#fff"/>
  </g>
  <ellipse cx="60" cy="70" rx="15" ry="10.5" fill="url(#cerdiSnout)" stroke="#e0628c" stroke-width="1.5"/>
  <ellipse cx="55" cy="70" rx="2.6" ry="3.6" fill="#b8436c"/><ellipse cx="65" cy="70" rx="2.6" ry="3.6" fill="#b8436c"/>
  ${mouth}
</svg>`;
  }
  return { svg };
})();
