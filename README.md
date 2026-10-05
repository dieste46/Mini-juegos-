# Mini Juegos

Web de minijuegos para niños de 4–6 años, inspirada en juegapop.com. Lo principal es pasarlo bien (sección **¡A jugar!**); hay además una sección **Aprende jugando** con juegos educativos que se adaptan a su nivel.

Sin registro, sin anuncios, sin dependencias ni build: HTML + CSS + JS plano. Se instala como app en la tablet o el móvil (PWA) y funciona offline tras la primera visita.

## Principios de diseño

- **No hace falta saber leer.** Todas las instrucciones se dicen en voz alta (Web Speech API, voz es-ES) y el botón 🔊 las repite. Las respuestas son dibujos, cifras o letras grandes.
- **Equivocarse no castiga.** Un fallo no quita nada: se dice qué ha tocado ("Eso es la ele") y se anima a reintentar. Tras dos fallos se ilumina la respuesta correcta para que nunca se quede atascado.
- **Estrellas solo por acierto a la primera**, para premiar la atención y no el ensayo-error a lo loco.
- **Nivel adaptativo por juego.** Sube tras 3 aciertos seguidos a la primera; baja tras 2 preguntas seguidas con fallos.
- **Rondas cortas** (5 preguntas), pensadas para sesiones de 5–10 minutos.
- **Zona de padres** (protegida con una multiplicación) con nivel, % de acierto a la primera y partidas por juego. Los datos se guardan solo en el dispositivo (localStorage).

## ¡A jugar! (recreo)

| Juego | Cómo se juega |
|---|---|
| 🎈 Globos | Explotar 25 globos que suben; los dorados valen 3 |
| 🐽 Pilla al cerdito | Topo de 40 s: tocar cerditos y no tocar al lobo. Guarda récord |
| 🏎️ Carrera | Cambiar de carril tocando izquierda/derecha, coger 15 estrellas y esquivar obstáculos (3 vidas) |
| 🖍️ Pintar | Dibujo libre con colores, pincel arcoíris, sellos y guardar el dibujo |
| 🎹 Piano | Piano de animales; tres canciones que se iluminan para imitarlas |

Ningún juego castiga: lo que se escapa no resta, chocar solo quita una vida y la pantalla final siempre es positiva. Los sonidos se sintetizan con Web Audio, sin archivos.

## Aprende jugando

| Juego | Qué trabaja | Niveles |
|---|---|---|
| 🐷 Cuenta | Conteo 1–10, cantidad ↔ cifra, primeras sumas | 1–3 · 1–5 · 3–10 · sumas hasta 10 |
| 🧠 Parejas | Memoria de trabajo, atención, vocabulario | 3 · 4 · 6 · 8 parejas |
| 🎨 Colores | Colores, formas, instrucciones con dos condiciones | color · forma · forma + color |
| 🔤 Letras | Sonido inicial (conciencia fonológica), vocales y consonantes | vocales · consonantes · letra → dibujo |
| 🧩 Series | Patrones lógicos (base del pensamiento computacional) | AB · AAB/ABB/ABC · AABB/ABCB/ABAC/ABCD |

## Estructura

```
index.html          shell y menú
css/style.css       estilos (botones grandes, táctil)
js/core.js          voz, progreso, nivel adaptativo, celebración, motor de preguntas
js/app.js           navegación por hash y zona de padres
js/games/*.js       un archivo por juego (section: 'recreo' | 'aprende')
sw.js, manifest.json  PWA / offline
```

Un juego de recreo es un `Games.push({ id, section: 'recreo', name, emoji, color, start(root, exit) })` cuyo `start` devuelve una función de limpieza (parar bucles y temporizadores).

Añadir un juego de preguntas = un archivo nuevo en `js/games/` que haga `Games.push({...})` con una función `makeQuestion(level)` y llamar a `Core.runQuiz`. Luego añadir su `<script>` en `index.html`.

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
