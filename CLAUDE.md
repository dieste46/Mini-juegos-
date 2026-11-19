# Mini Juegos: guía de trabajo

Web de minijuegos para un niño de 5 años (3º de Infantil, todavía no lee). Publicada con GitHub Pages desde `main`:
https://dieste46.github.io/Mini-juegos-/

Antes de tocar nada, lee `docs/PLAN.md` (estado, prioridades y reparto de trabajo). Si existe `docs/privado/contexto.md`
(no se sube al repo), léelo también: tiene el contexto personal del niño.

**El repo es público.** No escribas en él nombres, fechas de nacimiento, datos del colegio ni nada de salud. Eso va en `docs/privado/`.

## Cómo trabajar con el autor

- Responde en español de España, directo y práctico. Si algo está mal enfocado, dilo.
- Sus propuestas se estudian y se valoran antes de actuar; no se aceptan todas porque sí. Compara opciones y termina con una recomendación.
- Di siempre qué has comprobado y qué no (lo típico: "probado en navegador simulando móvil, no en el iPhone real").

## Reglas pedagógicas (no negociables)

- Explicar, no castigar el error. Nada de cruces rojas, vidas ni cronómetros.
- No lee: toda instrucción va por voz (`Core.say`) o por dibujo. Cada pantalla de juego tiene un botón 🔊 para repetirla.
- Recompensa inmediata y partidas cortas con final claro; cortar cuando aún quiere más.
- Retos, no tareas. Dificultad que sube y baja sola (dos o tres aciertos seguidos suben, dos fallos seguidos bajan).
- Escalera de pistas antes que dar la solución: repetir más despacio, marcar lo siguiente, mostrar un trozo del camino.
- Personajes siempre originales: nada de personajes de series, películas o marcas (ni parecidos).
- La granja y el espacio conviven como temas. No meter el cerdito en todo con calzador.
- Lo que tenga que ver con pronunciación o logopedia sigue la pauta de su logopeda: no se inventa progresión de sonidos.

## Arquitectura

HTML, CSS y JS plano, sin build ni dependencias. Los módulos se cargan con `<script>` en `index.html`, en este orden:

`store.js` → `core.js` → `fx.js` → `scene.js` → `mascot.js` → `decor.js` → `themes.js` → `world.js` → `art.js` → `laminas.js` → `games/*.js` → `app.js`

| Módulo | Qué hace |
|---|---|
| `js/store.js` | Guardado v2 en `localStorage` (`mini-juegos-store`): perfiles `{id,name,avatar,theme,look,stars,games,worlds}`, migración desde v1, export/import JSON, guardado diferido |
| `js/core.js` | Voz (`say`), sonidos (`sfx`, `tone`), nivel adaptativo (`registerAnswer`), motor de preguntas (`runQuiz`), pantalla final (`endScreen`), iconos (`pic`, `pics`, `picSrc`) |
| `js/fx.js` | Partículas y sacudida: `Fx.system()` para canvas propio, `Fx.overlay(host)` para juegos DOM |
| `js/scene.js` | Dibujo compartido para canvas: nubes, árboles, casas, colinas, azar repetible |
| `js/mascot.js` | Bip, el robot mascota (SVG con estados de ánimo) |
| `js/themes.js` | Temas como datos: `Themes.list.granja`, `Themes.list.espacio`. Los juegos piden sus datos con `Themes.set('nombre')` |
| `js/world.js` | Mundo de recompensas que crece con las estrellas (Mi granja / Mi base espacial) |
| `js/app.js` | Menú, rutas por hash, zona de padres, protecciones táctiles de iOS |

El detalle de cada pieza está en `README.md`.

### Contrato de un juego

Un juego es un archivo en `js/games/` que hace `Games.push({...})`, más su `<script>` en `index.html`:

```js
Games.push({
  id: 'mijuego', section: 'recreo',          // 'recreo' (¡A jugar!) o 'aprende' (Aprende jugando)
  name: 'Mi juego',
  emoji: '🎯',                                // o t => ... según el tema; es el dibujo de reserva de la tarjeta
  art: t => 'nombre',                         // opcional: img/icons/nombre.webp (o null para usar el emoji)
  color: '#35D6E6', learns: 'Qué trabaja (se enseña en la zona de padres).',
  maxLevel: 4,                                // opcional: pinta estrellas de nivel en la tarjeta
  badge: s => (s.total ? `🏅 ${s.total}` : ''), // opcional: sustituye a las estrellas de nivel
  hidden: true,                               // opcional: sin tarjeta; se entra desde otro juego
  start(root, exit) {
    // pintar dentro de root; llamar a exit() para volver al menú
    return () => { /* limpieza: parar timers, rAF, observers */ };
  }
});
```

Estado por juego: `Core.gameState(id)` (`level`, `streak`, `misses`, `played` y lo que el juego añada). Guardar con `Core.save()`. Estrellas con `Core.addStar()`.

### Dos formas de pintar

- **DOM y CSS** para juegos de interfaz: preguntas, tableros, botones (Cuenta, Colores, Letras, Series, Parejas, Tres en raya, Simón, Piano, Pintar, Globos, Pilla).
- **Canvas 2D propio** para juegos de acción o con escenario (Súper Rescate, Carrera, Laberinto). Limitar `devicePixelRatio` a 2, usar `ResizeObserver`, parar el bucle en la limpieza.

No se usa Phaser ni Pixi: se valoró y se descartó. El salto visual viene del arte y de la escena dibujada, no del motor.

### Temas

Un tema nuevo es una entrada más en `Themes.list` con `background()`, `world` y `sets`. Todo lo que cambia entre granja y espacio debe salir de `sets` (personajes, colores de pista, parejas de laberinto...), no de `if (tema === ...)` dentro del juego. `cards` permite fijar el emoji de la tarjeta de un juego en ese tema.

### Estilo

Todo el estilo "arcade" está al final de `css/style.css` y se gobierna con variables por tema (`--ground`, `--panel`, `--edge`, `--title`...). `body.sticker` añade contorno negro (opción "Pegatina" por jugador). Tipografías locales: Lilita One (títulos) y Nunito (texto).

`css/style.css` ha ido creciendo por capas: las reglas del final pisan a las anteriores. Al cambiar algo, busca primero si ya hay una regla posterior que lo redefine.

### Arte

- Iconos en `img/icons/<nombre>.webp`, 256 px, fondo transparente, estilo 3D tipo juguete.
- Se generan fuera (hojas en cuadrícula) y se recortan. Para usarlos: copiar el `.webp` y apuntar el emoji al que sustituye en la tabla `PICS` de `js/core.js`.
- `Core.pic(emoji)` devuelve el icono si existe y vuelve al emoji si la imagen falla. `Core.pics(lista)` solo cambia si todos tienen icono, para no mezclar estilos.
- Los emojis que quedan son provisionales.

## Publicar

- **`main` es producción: es la versión con la que juega el niño.** Trabaja en una rama, prueba en el iPhone y solo entonces lleva a `main`.
- En cada publicación sube la versión de la caché en `sw.js` (`mini-juegos-vN`). **Hazlo con `sed -i`**, nunca reescribiendo el archivo sobre sí mismo: ya se publicó una vez vacío por eso.
- El service worker es "red primero" y solo borra cachés que empiezan por `mini-juegos-` (el dominio de GitHub Pages se comparte con otros proyectos).

## Probar

```bash
python3 -m http.server 8800        # desde la raíz del repo
```

- En el iPhone, por la wifi: `http://<ip-del-ordenador>:8800`. Para ver errores del móvil, inspector web de Safari desde un Mac.
- Automático con Playwright, emulando móvil (390×844, táctil). Recetas que funcionan:
  - Sembrar un perfil: `localStorage.setItem('juegos-peque-v1', JSON.stringify({stars:12, games:{}, name:'Prueba'}))` y recargar (se migra solo).
  - Elementos de juego con animación: `dispatch_event('pointerdown')` (un `click()` falla por "elemento no estable").
  - Navegación (casa, tarjetas): `.tap()` real, que detecta si algo tapa el botón.
  - Forzar situaciones: sustituir `Math.random` por una constante (todo estrellas, todo obstáculos...).
  - Laberinto: `document.querySelector('#maze')._lab.route()` da la ruta en píxeles para seguirla.
- Antes de dar algo por bueno: partida completa hasta la pantalla final, "otra vez", salir con la casa a mitad, y los dos temas.

## Trampas ya pisadas

- **iOS ignora `user-scalable=no`**: el zoom se bloquea por JS en `app.js`. No quitar esas protecciones.
- **En iOS el `click` no llega si hay otro dedo apoyado** (un niño sujetando el móvil). Los botones críticos responden a `pointerup`.
- **Rejillas CSS**: fijar filas y columnas con `minmax(0, 1fr)`. Con filas automáticas, la fila que recibe contenido crece y deforma el tablero (pasó en Tres en raya en iPhone y no en Chromium).
- **Transparencia en paneles**: deja ver el decorado del fondo a través. Atenuar el contenido, no el panel.
- **Audio en iOS**: solo arranca dentro de un toque del usuario (`Core.unlockAudio`). La voz elige la mejor voz es-ES instalada.
- **`pagehide`** solo guarda si hay cambios pendientes; si no, pisa datos recién migrados.
- **La barra superior** va por encima del juego (`z-index`), para que nada tape la casa.
- **Timers y bucles**: todo `setTimeout` de un juego debe comprobar que el juego sigue vivo, y la función de limpieza debe pararlo todo. Si no, un juego cerrado repinta encima del menú.

## Qué no hacer

- No añadir dependencias, bundlers ni frameworks sin hablarlo antes.
- No reorganizar carpetas "por orden": el tamaño actual no lo justifica.
- No tocar el service worker más allá de subir la versión.
- No añadir analítica de terceros ni enviar datos fuera del dispositivo.
