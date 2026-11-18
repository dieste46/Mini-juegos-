# Mini Juegos

Web de minijuegos para niños de 4–6 años, inspirada en juegapop.com. Lo principal es pasarlo bien (sección **¡A jugar!**); hay además una sección **Aprende jugando** con juegos educativos que se adaptan a su nivel.

Sin registro, sin anuncios, sin dependencias ni build: HTML + CSS + JS plano. Se instala como app en la tablet o el móvil (PWA) y funciona offline tras la primera visita.

## Principios de diseño

- **No hace falta saber leer.** Todas las instrucciones se dicen en voz alta (Web Speech API, voz es-ES) y el botón 🔊 las repite. Las respuestas son dibujos, cifras o letras grandes.
- **Equivocarse no castiga.** Un fallo no quita nada: se dice qué ha tocado ("Eso es la ele") y se anima a reintentar. Tras dos fallos se ilumina la respuesta correcta para que nunca se quede atascado.
- **Estrellas solo por acierto a la primera**, para premiar la atención y no el ensayo-error a lo loco.
- **Nivel adaptativo por juego.** Sube tras 3 aciertos seguidos a la primera; baja tras 2 preguntas seguidas con fallos.
- **Rondas cortas** (5 preguntas), pensadas para sesiones de 5–10 minutos.
- **Zona de padres** (protegida con una multiplicación) con nivel, % de acierto a la primera y partidas por juego, y el nombre del niño para que la voz le salude y le anime. Los datos se guardan solo en el dispositivo (localStorage).

## ¡A jugar! (recreo)

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

## Aprende jugando

| Juego | Qué trabaja | Niveles |
|---|---|---|
| 🐷 Cuenta | Conteo 1–10, cantidad ↔ cifra, primeras sumas | 1–3 · 1–5 · 3–10 · sumas hasta 10 |
| 🧠 Parejas | Memoria de trabajo, atención, vocabulario | 3 · 4 · 6 · 8 parejas |
| 🎨 Colores | Colores, formas, instrucciones con dos condiciones | color · forma · forma + color |
| 🔤 Letras | Sonido inicial (conciencia fonológica), vocales y consonantes | vocales · consonantes · letra → dibujo |
| 🧩 Series | Patrones lógicos (base del pensamiento computacional) | AB · AAB/ABB/ABC · AABB/ABCB/ABAC/ABCD |

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
| `emoji` | Texto o función `t => ...` que lo saca del tema |
| `maxLevel` | Solo si usa nivel adaptativo (`Core.registerAnswer`) |
| `badge(state)` | Opcional: marca a mostrar en la tarjeta |
| `start(root, exit)` | Pinta el juego en `root`; devuelve una función de limpieza (parar bucles y temporizadores) |

Reglas: un juego nunca escribe emojis ni frases del tema a mano; los pide con `Themes.set('<conjunto>')`. Guarda su progreso solo en `Core.gameState(id)` y llama a `Core.save()` (o `Core.addStar()`).

**Contrato de un tema** (`themes.js`): `id`, `name`, `emoji`, `say`, `background()`, `world` (nombre, escena e `items`) y `sets` (`contables`, `parejas`, `pilla`, `rescate`, `carrera`, `series`, `piano`, `sellos`, `letras`, `laminas`, `escena`). Si a un tema le falta un conjunto, se usa el de granja.

**Datos** (`localStorage`, clave `mini-juegos-store`):

```
{ v: 2, active: 'p…', device: { voiceURI },
  profiles: { 'p…': { id, name, avatar, theme, stars, games: { <id>: {...} }, worlds: { granja: { seen } }, created, updated } } }
```

- Cambiar el formato = subir `v` y añadir el paso en `migrate()`. Lo antiguo (`juegos-peque-v1`) se migra solo y se deja como copia.
- Guardado agrupado (400 ms) y forzado al salir de la app; `navigator.storage.persist()` para que el navegador no lo borre.
- Copia de seguridad en la zona de padres (exportar / importar JSON). Los dibujos de Pintar van aparte, en IndexedDB (`mini-juegos-arte`), y no entran en esa copia: se sacan con el botón de enviar.
- Sincronizar en la nube más adelante = otro adaptador con `load()`/`save()` en `store.js` (p. ej. Supabase, una fila por perfil con `updated` para resolver conflictos). El resto del código no cambia.

## iPhone / iPad

- Safari ignora `user-scalable=no`, así que el zoom por pellizco (dos pulgares jugando) se bloquea por JS en `app.js` (`gesturestart`, `touchmove` multitáctil, doble toque) y, si aun así la página queda ampliada, se fuerza la vuelta a escala 1 tocando el `meta viewport`.
- El audio y la voz solo arrancan tras el primer toque (`Core.unlockAudio`). Si no suena, revisar el interruptor de silencio del iPhone.
- Icono de pantalla de inicio: `apple-touch-icon.png` (iOS no usa el SVG del manifest). Añadir a pantalla de inicio para ir a pantalla completa.
- Guardar dibujo: en iOS se usa la hoja de compartir (`navigator.share`), porque el atributo `download` no guarda en Fotos.

## Probar en local

```bash
python3 -m http.server 8000
# abre http://localhost:8000
```

## Publicar

El workflow `.github/workflows/pages.yml` publica en GitHub Pages en cada push a `main`. En el repo: *Settings → Pages → Source: GitHub Actions*.

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
