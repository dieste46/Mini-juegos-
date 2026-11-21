# Mundo Joor

Web de minijuegos para niños de 4–6 años, inspirada en juegapop.com. Lo principal es pasarlo bien (sección **Minijuegos**); hay además una sección **Pequesabios** con juegos educativos que se adaptan a su nivel.

Sin registro, sin anuncios, sin dependencias ni build: HTML + CSS + JS plano. Se instala como app en la tablet o el móvil (PWA) y funciona offline tras la primera visita.

> La web está en la carpeta `web/`, que es lo único que se publica. Las rutas de este documento son relativas a ella.

## Principios de diseño

- **No hace falta saber leer.** Todas las instrucciones se dicen en voz alta (Web Speech API, voz es-ES) y el botón 🔊 las repite. Las respuestas son dibujos, cifras o letras grandes.
- **Equivocarse no castiga.** Un fallo no quita nada: se dice qué ha tocado ("Eso es la ele") y se anima a reintentar. Tras dos fallos se ilumina la respuesta correcta para que nunca se quede atascado.
- **Estrellas solo por acierto a la primera**, para premiar la atención y no el ensayo-error a lo loco.
- **Nivel adaptativo por juego.** Sube tras 3 aciertos seguidos a la primera; baja tras 2 preguntas seguidas con fallos.
- **Rondas cortas** (5 preguntas), pensadas para sesiones de 5–10 minutos.
- **Zona de padres** (protegida con una multiplicación) con nivel, % de acierto a la primera y partidas por juego, y el nombre del niño para que la voz le salude y le anime. Los datos se guardan solo en el dispositivo (localStorage).

## Minijuegos (recreo)

| Juego | Cómo se juega |
|---|---|
| 🦸 Súper Rescate | El héroe del tema vuela siguiendo el dedo y rescata a 10 (pollitos en la granja, marcianitos en el espacio); lo que se esquiva solo le hace girar |
| 🎈 Globos | Explotar 25 globos que suben; los dorados valen 3 |
| 🐹 ¡Pilla, pilla! | Topo con un solo personaje (cerdito / marcianito): pillar 20. Desde la tercera partida aparecen el que no se toca (lobo / meteorito) y la estrella que vale tres. Sin reloj; cuenta el total acumulado |
| 🏎️ Carrera | Tocar a la izquierda o derecha de la pantalla para cambiar de carril y coger 15 estrellas. Chocar solo frena, no hay vidas |
| 🎨 Pintar | Hoja en blanco o 8 láminas propias para colorear (4 por tema). Bote de pintura, pincel, arcoíris, purpurina, rotulador de luz, sellos, goma, espejo, deshacer y música al pintar. Galería propia: cada dibujo se guarda solo |
| 🎹 Piano | Ocho teclas con cara que cantan. Cuatro canciones con notas que caen y esperan sobre su tecla hasta que la toca (sin ritmo ni fallo); botón de oreja para escucharla sola |

Ningún juego castiga: no hay vidas, cronómetros ni cruces rojas; lo que se escapa no resta, chocar solo frena y la pantalla final siempre es positiva. Los sonidos se sintetizan con Web Audio, sin archivos.

## Mi granja

Tarjeta fija arriba del menú (`js/farm.js`). Las estrellas de cualquier juego hacen crecer la granja: 18 amigos y edificios que llegan a las 0, 3, 6, 10, 14, 19, 24, 30, 36, 43, 50, 58, 66, 75, 85, 95, 106 y 118 estrellas. Al tocar cada uno salta, suena y la voz dice su nombre. Cuando hay regalo nuevo la tarjeta late y la voz avisa. Nunca se pierde nada.

## Pequesabios (aprende)

| Juego | Qué trabaja | Niveles |
|---|---|---|
| 🐷 Cuenta | Conteo 1–10, cantidad ↔ cifra, primeras sumas | 1–3 · 1–5 · 3–10 · sumas hasta 10 |
| 🧠 Parejas | Memoria de trabajo, atención, vocabulario | 3 · 4 · 6 · 8 parejas |
| 🎨 Colores | Colores, formas, instrucciones con dos condiciones | color · forma · forma + color |
| 🔤 Letras | Sonido inicial (conciencia fonológica), vocales y consonantes | vocales · consonantes · letra → dibujo |
| 🧩 Series | Patrones lógicos (base del pensamiento computacional) | AB · AAB/ABB/ABC · AABB/ABCB/ABAC/ABCD |
| 🤖 Guía a Bip | Planificar una secuencia de pasos con flechas, lateralidad y corregir sobre la marcha | en línea recta · un giro · rodear obstáculos · pasar por la estrella · ficha de repetir |

**Guía a Bip** (`js/games/robot.js`): se ponen las flechas del camino y Bip las ejecuta una a una. Las flechas son de dirección fija (arriba, abajo, izquierda, derecha), no giros. Si choca o se queda corto, se para ahí y se sigue desde ese punto. La estrella solo se gana llegando a la primera. Tras dos tropiezos brilla la flecha que toca; tras tres, se marca un trozo del camino. Los tableros se generan solos (`gen(nivel)`) y se comprueba que tienen solución; en el nivel 5 hay menos huecos que pasos, para que haga falta repetir.

## Arquitectura (para crecer sin rehacer)

Sin build ni dependencias: cada archivo se carga con un `<script>` en `index.html`, en este orden.

```
js/store.js     Guardado: perfiles, ajustes del dispositivo, versiones y migraciones, copia de seguridad
js/core.js      Servicios comunes: voz, sonidos, estrellas, nivel adaptativo, motor de preguntas
js/mascot.js    Bip, la mascota (SVG)
js/decor.js     Piezas de decorado (nubes, sol, colinas) y títulos de colores
js/themes.js    Temas: fondo, mundo de recompensas y conjuntos de objetos (granja, espacio)
js/world.js     Mundo de recompensas que crece con las estrellas (lo dibuja el tema)
js/art.js       Galería de dibujos en IndexedDB (por jugador)
js/laminas.js   Láminas para colorear: formas en un lienzo de 300 x 400, de atrás hacia delante
js/games/*.js   Un archivo por juego
js/app.js       Menú, navegación por #hash, zona de padres
```

**Contrato de un juego** (`Games.push({...})`):

| Campo | Para qué |
|---|---|
| `id` | Ruta `#id` y clave de su progreso |
| `section` | `'recreo'` o `'aprende'` (sección del menú) |
| `name`, `color`, `learns` | Tarjeta del menú y zona de padres |
| `how` | Cómo se juega: lista de frases cortas, o función que la devuelve según el tema. Se enseña en la ventana del botón "?" de la barra (con altavoz que la lee) y en la zona de padres |
| `emoji` | Texto o función `t => ...` que lo saca del tema |
| `maxLevel` | Solo si usa nivel adaptativo (`Core.registerAnswer`) |
| `badge(state)` | Opcional: marca a mostrar en la tarjeta |
| `start(root, exit)` | Pinta el juego en `root`; devuelve una función de limpieza (parar bucles y temporizadores) |

Reglas: un juego nunca escribe emojis ni frases del tema a mano; los pide con `Themes.set('<conjunto>')`. Guarda su progreso solo en `Core.gameState(id)` y llama a `Core.save()` (o `Core.addStar()`).

**Contrato de un tema** (`themes.js`): `id`, `name`, `emoji`, `say`, `background()`, `world` (nombre, escena e `items`) y `sets` (`contables`, `parejas`, `pilla`, `rescate`, `carrera`, `robot`, `series`, `piano`, `sellos`, `letras`, `laminas`, `escena`). Si a un tema le falta un conjunto, se usa el de granja.

**Datos** (`localStorage`, clave `mini-juegos-store`):

```
{ v: 2, active: 'p…', device: { voiceURI },
  profiles: { 'p…': { id, name, avatar, theme, look, letter, stars, games: { <id>: {...} }, worlds: { granja: { seen } }, created, updated } } }
// letter: la letra de la semana (opcional). Se elige en la zona de padres y en el juego Letras sale en torno al 40 % de las preguntas.
```

- Cambiar el formato = subir `v` y añadir el paso en `migrate()`. Lo antiguo (`juegos-peque-v1`) se migra solo y se deja como copia.
- Guardado agrupado (400 ms) y forzado al salir de la app; `navigator.storage.persist()` para que el navegador no lo borre.
- Copia de seguridad en la zona de padres: "Exportar partidas" e "Importar partidas". El archivo lleva su propia versión de formato, distinta de la del guardado:

```
{ app: 'mini-juegos', format: 1, exportedAt, origin,
  store: { v, active, device, profiles },      // el guardado entero
  arte:  [ { id, profile, page, w, h, updated, paint, thumb } ] }   // dibujos de Pintar (IndexedDB `mini-juegos-arte`), con la imagen como data URL
```

- Importar (`Store.readBackup` → confirmación → `Store.importBackup`): primero se valida y se limpia el archivo sin tocar nada, luego se enseña qué trae y solo al aceptar se sustituye lo guardado. Lo anterior queda en `mini-juegos-store-anterior`. Los dibujos se añaden por `id`; no se borran los que hubiera. También se aceptan las copias antiguas, que eran el guardado sin sobre con `arte` dentro.
- Cambiar el formato del archivo = subir `FORMAT` en `store.js` y añadir el paso en `readBackup()`. Una copia con un formato o un guardado más nuevo que el de la app se rechaza con un aviso.
- Sincronizar en la nube: diseñado en `docs/PLAN.md`, apartado 4.0 (un Worker aparte, `mundo-api`, y un módulo `js/sync.js`). `store.js` seguirá siendo la única puerta al guardado.

## iPhone / iPad

- Safari ignora `user-scalable=no`, así que el zoom por pellizco (dos pulgares jugando) se bloquea por JS en `app.js` (`gesturestart`, `touchmove` multitáctil, doble toque) y, si aun así la página queda ampliada, se fuerza la vuelta a escala 1 tocando el `meta viewport`.
- El audio y la voz solo arrancan tras el primer toque (`Core.unlockAudio`). Si no suena, revisar el interruptor de silencio del iPhone.
- Icono de pantalla de inicio: `apple-touch-icon.png` (iOS no usa el SVG del manifest). Añadir a pantalla de inicio para ir a pantalla completa.
- El icono es Bip sobre el cielo del espacio, dibujo propio. `icon.svg` es la fuente; los PNG (`icon-512.png`, `icon-192.png` y `apple-touch-icon.png`, de 180 px) son ese mismo dibujo a sangre, sin el recorte redondeado y sin transparencia: las esquinas las recorta el sistema.
- Guardar dibujo: en iOS se usa la hoja de compartir (`navigator.share`), porque el atributo `download` no guarda en Fotos.

## Probar en local

```bash
python3 -m http.server 8800 --directory web     # desde la raíz del repo
# abre http://localhost:8800
```

## Publicar

Cloudflare Pages publica la carpeta `web/` en cada push a `main` (https://mundojoor.pages.dev), sin compilación, y crea una vista previa por cada rama. Todas las rutas de la web son relativas, para que funcione servida desde la raíz o desde una subcarpeta.

Mientras dure la mudanza, el workflow `.github/workflows/pages.yml` sigue publicando lo mismo en GitHub Pages (https://dieste46.github.io/mundojoor/).

## Ideas siguientes

- Más recreo: Flappy-cerdito, burbujas de jabón, puzle de piezas arrastrables, laberinto con el dedo, granja que se va ampliando con las estrellas ganadas.
- Trazar letras y números con el dedo (canvas).
- Reloj: en punto / y media.
- Dinero: monedas de 1 y 2 €.
- Mini-programación: guiar a un cerdito por una cuadrícula con flechas (secuencias, tipo Bee-Bot).
- Inglés: colores, números y animales con audio.
- Emociones: reconocer caras y situaciones.
- Grabar la voz del padre para las instrucciones en lugar de la voz sintética.

## Estilo visual

- **Arcade**: la granja usa "Día arcade" (fondo azul, paneles blancos) y el espacio "Noche arcade" (fondo añil, paneles oscuros). Los dos comparten CSS; cada tema solo cambia variables (`--ground`, `--panel`, `--edge`, `--title`…) al final de `css/style.css`.
- **Pegatina**: opción por jugador en la zona de padres (`profile.look = 'normal' | 'pegatina'`). Añade la clase `body.sticker`: contorno negro y sombra dura en ambos temas.
- **Iconos**: `img/icons/<nombre>.webp` (256 px, fondo transparente). Un juego lo usa con `art: t => 'nombre'` (o `null` para caer al emoji del tema).
- Tipografías locales: Lilita One (títulos) y Nunito (texto), en `fonts/`.
- **Iconos dentro de los juegos**: `Core.pic(emoji)` devuelve el icono ilustrado si el emoji está en la tabla `PICS` de `js/core.js` (y vuelve al emoji si la imagen falla). `Core.pics(lista)` solo cambia si todos tienen icono, para no mezclar estilos. Añadir un dibujo = copiar el `.webp` a `img/icons/` y apuntarlo en `PICS`.

## Efectos y juegos en canvas

- `js/fx.js`: partículas y sacudida sin librerías. `Fx.system()` para juegos que pintan en su propio canvas; `Fx.overlay(host)` pone un canvas transparente encima de un juego hecho con DOM (lo usan Globos, ¡Pilla, pilla! y Carrera). Respeta "reducir movimiento".
- **Súper Rescate** se pinta entero en canvas 2D: escenario por capas (`SCENES.campo`, `SCENES.espacio`), lo que se esquiva (`HAZARDS`) y el héroe con su cesta. Cada tema lo configura con datos en `sets.rescate` (`scene`, `hazardKind`, `carry`, `heroArt`). El helicóptero son dos imágenes alineadas (`heli-cuerpo.webp` y `heli-rotor.webp`) para poder girar las palas.
- **Carrera** también va en canvas 2D, vista desde detrás: la pista sale del horizonte y todo crece al acercarse (`sc(z) = 1 / (1 + K·z)`). Cada pista (`TRACKS.campo`, `TRACKS.espacio`) define colores, cielo, obstáculos y adornos; el tema la elige con `sets.carrera.scene`. Los obstáculos y la estrella están en `OBJ`.
- `js/scene.js`: utilidades de dibujo compartidas por los juegos en canvas (nubes, árboles, casas, colinas, azar repetible).
- **Tres en raya** (`js/games/raya.js`): variante de tres fichas por jugador (la más antigua desaparece, no hay empates). Modo contra Bip con cuatro niveles que suben y bajan solos (tabla `SKILL`: probabilidad de rematar, de tapar y jugadas que mira por delante) y modo dos jugadores. Las fichas de cada tema están en `sets.raya`.
- **Fichas de Tres en raya**: equis y círculos por defecto (`XO_SVG`) o los personajes del tema; se elige en la pantalla de modo y se guarda en `games.raya.skin`.
- **Repite con Bip** (`js/games/simon.js`): Simón de cuatro botones. Es un juego oculto (`hidden: true`): no tiene tarjeta en el menú y se entra desde Tres en raya. Quitar `hidden` le da tarjeta propia.
- **Laberinto** (`js/games/laberinto.js`): laberintos generados por búsqueda en profundidad, de 3 a 8 casillas de ancho según el nivel. El personaje sigue al dedo sin atravesar paredes (`chase`), deja rastro y hay pista si se atasca. Parejas personaje-meta y colores por tema en `sets.laberinto`.
