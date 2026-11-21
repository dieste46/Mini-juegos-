/* Bip: la mascota de Mundo Joor, un robot redondo dibujado en SVG (personaje propio).
   Sirve para cualquier tema: granja, espacio o los que vengan.
   Cada jugador lo viste a su gusto (profile.bip = { color, item }): el color es libre y los complementos
   se van abriendo con las estrellas ganadas. Nunca se gastan ni se pierden. */
const Mascot = (() => {
  const NAME = 'Bip';
  // color: [brazos y pies, sombra del cuerpo, borde del cuerpo]
  const COLORS = {
    azul: ['#7fc8ff', '#d9e6ff', '#b9c9f2'], rosa: ['#ff9ec4', '#ffe3ee', '#f2bdd3'], verde: ['#7be3a0', '#def7e7', '#b3e3c5'],
    naranja: ['#ffb36b', '#ffead4', '#f2cfa9'], morado: ['#b79cff', '#ebe3ff', '#cdbff2'], amarillo: ['#ffd84d', '#fff5cc', '#eedb93']
  };
  // Complementos, por orden de estrellas necesarias. name: cómo lo dice la voz.
  const ITEMS = [
    { id: 'nada', stars: 0, name: 'nada' }, { id: 'pajarita', stars: 5, name: 'la pajarita' }, { id: 'cascos', stars: 15, name: 'los cascos' },
    { id: 'capa', stars: 30, name: 'la capa' }, { id: 'gorro', stars: 50, name: 'el gorro de fiesta' }, { id: 'corona', stars: 80, name: 'la corona' }
  ];
  // Lo que va por detrás del cuerpo y lo que va por delante
  const BACK = {
    cascos: '<path d="M19 50 Q19 3 60 3 Q101 3 101 50" fill="none" stroke="#2d2552" stroke-width="6" stroke-linecap="round"/>',
    capa: '<path d="M26 44 Q2 82 10 114 Q38 104 60 111 Q82 104 110 114 Q118 82 94 44 Z" fill="#e8323c"/><path d="M26 44 Q14 80 22 108 Q34 104 42 106 Z" fill="#c2222c" opacity=".55"/>'
  };
  const FRONT = {
    pajarita: '<path d="M60 88 L45 79 V97 Z M60 88 L75 79 V97 Z" fill="#e8323c" stroke="#c2222c" stroke-width="1.5" stroke-linejoin="round"/><circle cx="60" cy="88" r="4.5" fill="#c2222c"/>',
    cascos: '<rect x="9" y="38" width="17" height="30" rx="8.5" fill="#ff5fa2"/><rect x="94" y="38" width="17" height="30" rx="8.5" fill="#ff5fa2"/><rect x="12" y="45" width="5" height="16" rx="2.5" fill="#fff" opacity=".5"/>',
    gorro: '<path d="M39 25 L60 -8 L81 25 Q60 33 39 25 Z" fill="#35d6e6"/><path d="M50 8 L70 8 M44 17 L76 17" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="60" cy="-9" r="7" fill="#ffd23f"/>',
    corona: '<path d="M36 26 V6 L48 16 L60 2 L72 16 L84 6 V26 Q60 33 36 26 Z" fill="#ffd23f" stroke="#e0a800" stroke-width="2" stroke-linejoin="round"/><circle cx="47" cy="22" r="3" fill="#e8323c"/><circle cx="60" cy="23" r="3.4" fill="#35d6e6"/><circle cx="73" cy="22" r="3" fill="#5be38c"/>'
  };
  const HAT = { gorro: true, corona: true };   // tapan la antena

  const lookOf = () => { try { return Store.profile.bip || {}; } catch { return {}; } };
  const itemOf = id => (ITEMS.some(i => i.id === id) ? id : 'nada');
  let n = 0;   // cada dibujo lleva sus propios degradados: así dos Bips de distinto color pueden convivir en pantalla

  // opt.item y opt.color permiten pintarlo con otro aspecto que el del jugador (para el vestidor)
  function svg(mood = 'happy', opt = {}) {
    const item = itemOf(opt.item !== undefined ? opt.item : lookOf().item), c = COLORS[opt.color], id = ++n;
    const vars = c ? ` style="--bip-a:${c[0]};--bip-b:${c[1]};--bip-c:${c[2]}"` : '';
    return `<svg class="mascot mood-${mood}" viewBox="0 0 120 124" aria-hidden="true"${vars}>
  <defs>
    <linearGradient id="bipBody${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" style="stop-color:var(--bip-b,#d9e6ff)"/></linearGradient>
    <linearGradient id="bipFace${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#25306b"/><stop offset="1" stop-color="#151b47"/></linearGradient>
  </defs>
  <ellipse cx="60" cy="118" rx="30" ry="5" fill="rgba(30,40,90,.18)"/>
  ${BACK[item] || ''}
  ${HAT[item] ? '' : '<line x1="60" y1="20" x2="60" y2="8" stroke="#8aa0d8" stroke-width="4" stroke-linecap="round"/><circle class="mascot-light" cx="60" cy="7" r="6" fill="#ffcd3c"/>'}
  <g style="fill:var(--bip-a,#7fc8ff)"><rect x="8" y="58" width="14" height="26" rx="7" transform="rotate(14 15 71)"/>
  <rect x="98" y="58" width="14" height="26" rx="7" transform="rotate(-14 105 71)"/>
  <rect x="38" y="100" width="16" height="14" rx="6"/><rect x="66" y="100" width="16" height="14" rx="6"/></g>
  <rect x="18" y="20" width="84" height="86" rx="38" fill="url(#bipBody${id})" style="stroke:var(--bip-c,#b9c9f2)" stroke-width="3"/>
  <rect x="28" y="34" width="64" height="44" rx="20" fill="url(#bipFace${id})"/>
  <g class="mo mo-happy">
    <g class="mascot-eyes"><ellipse cx="47" cy="54" rx="6.5" ry="8" fill="#6ef0ff"/><ellipse cx="73" cy="54" rx="6.5" ry="8" fill="#6ef0ff"/>
      <circle cx="49" cy="51" r="2.2" fill="#fff"/><circle cx="75" cy="51" r="2.2" fill="#fff"/></g>
    <path d="M52 66 Q60 72 68 66" stroke="#6ef0ff" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  </g>
  <g class="mo mo-joy">
    <path d="M40 56 Q47 46 54 56" stroke="#6ef0ff" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M66 56 Q73 46 80 56" stroke="#6ef0ff" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M50 63 Q60 77 70 63 Z" fill="#6ef0ff"/>
  </g>
  <g class="mo mo-wow">
    <circle cx="47" cy="52" r="7.5" fill="#6ef0ff"/><circle cx="73" cy="52" r="7.5" fill="#6ef0ff"/>
    <circle cx="47" cy="52" r="3" fill="#151b47"/><circle cx="73" cy="52" r="3" fill="#151b47"/>
    <ellipse cx="60" cy="68" rx="5" ry="6" fill="#6ef0ff"/>
  </g>
  <circle cx="32" cy="86" r="5" fill="#ff8fb1" opacity=".55"/><circle cx="88" cy="86" r="5" fill="#ff8fb1" opacity=".55"/>
  <rect x="50" y="84" width="20" height="8" rx="4" fill="#ffcd3c"/>
  <ellipse cx="40" cy="30" rx="12" ry="5" fill="#fff" opacity=".8" transform="rotate(-20 40 30)"/>
  ${FRONT[item] || ''}
</svg>`;
  }
  // Pone el color del Bip del jugador en toda la página. Los complementos van en el propio dibujo.
  function apply() {
    const c = COLORS[lookOf().color] || COLORS.azul, s = document.documentElement.style;
    s.setProperty('--bip-a', c[0]); s.setProperty('--bip-b', c[1]); s.setProperty('--bip-c', c[2]);
  }
  // Cambia el ánimo de una mascota ya pintada y, opcionalmente, vuelve a 'happy' al rato.
  function mood(holder, m, backMs) {
    const s = holder && holder.querySelector('.mascot'); if (!s) return;
    s.setAttribute('class', 'mascot mood-' + m);
    holder.classList.remove('react'); void holder.offsetWidth; holder.classList.add('react');
    if (backMs) setTimeout(() => { if (s.isConnected) s.setAttribute('class', 'mascot mood-happy'); }, backMs);
  }
  return { svg, mood, apply, NAME, COLORS, ITEMS };
})();
