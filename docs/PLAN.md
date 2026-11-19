# Plan de Mini Juegos

Actualizado: 19/11/2026. Quien cierre algo actualiza los apartados 2, 3 y 6.

## 1. Para quién y para qué

Un niño de 5 años, en 3º de Infantil; el curso que viene empieza Primaria. Todavía no lee.

- En clase: abecedario completo (una letra por semana, con una ficha de cinco partes: ver 4.2), números hasta 100 y sumas sencillas.
- Suma bien dos números menores de 5; con dos números menores de 10 puede; más allá se le complica.
- En inglés cuenta hasta 20 y conoce los colores.
- Le gustan pintar, los laberintos, los juegos de bloques y los de correr por carriles.

Objetivo de fondo: que llegue a Primaria con la base de lectura hecha, para que pueda hacer solo los deberes. Leer no es exigible para empezar Primaria (Orden ECD/853/2022 de Aragón, art. 4.7), así que no hay prisa de calendario: se trata de autonomía, no de un listón.

El contexto personal (nombre, pautas de logopedia, etc.) no está en este repo, que es público. Va en `docs/privado/contexto.md`, que no se sube.

## 2. Qué hay hecho

| Juego | id | Sección | Pintado | Notas |
|---|---|---|---|---|
| Súper Rescate | `super` | recreo | canvas | Helicóptero (granja) o astronauta (espacio) con cesta; escenario por capas |
| Globos | `globos` | recreo | DOM + Fx | |
| ¡Pilla, pilla! | `topo` | recreo | DOM + Fx | Un solo personaje; el que no se toca sale desde la 3ª partida |
| Carrera | `carrera` | recreo | canvas | Tres carriles, vista desde detrás, meta al llegar a 15 estrellas |
| Tres en raya | `raya` | recreo | DOM | Tres fichas por jugador; contra Bip (4 niveles) o dos jugadores; fichas X/O o del tema |
| Repite con Bip | `simon` | recreo, oculto | DOM | Simón de cuatro botones; se entra desde Tres en raya |
| Laberinto | `laberinto` | recreo | canvas | Generado, de 3 a 8 casillas de ancho; arrastre con el dedo; pista por atasco |
| Pintar | `pintar` | recreo | canvas | Láminas, bote, pincel, sellos, galería en IndexedDB |
| Piano | `piano` | recreo | DOM | Cuatro canciones con notas que caen y esperan |
| Cuenta | `contar` | aprende | preguntas | Hasta 10 y sumas con dibujos (4 niveles) |
| Parejas | `memoria` | aprende | DOM | |
| Colores | `colores` | aprende | preguntas | 3 niveles |
| Letras | `letras` | aprende | preguntas | Sonido inicial con 10 letras (3 niveles). Se queda corto: ver 4.2 |
| Series | `series` | aprende | preguntas | Patrones hasta 4 elementos (3 niveles) |

Además: temas granja y espacio, estilo arcade con opción pegatina, perfiles con guardado versionado, mundo de recompensas, mascota Bip, zona de padres (voz, estilo, perfiles, exportar e importar), PWA sin conexión.

## 3. Pendiente conocido

- **Casa que no respondía en iPhone** tras un juego. No se pudo reproducir en Chromium. Se blindó (responde a `pointerup`, barra por encima del juego, repinta si la dirección ya está vacía), pero la causa no está confirmada. Verificar en el iPhone con el inspector de Safari.
- **Service worker**: tras actualizarse, la caché nueva queda vacía hasta la siguiente carga con red. Sin conexión justo después de una actualización, puede faltar algún archivo.
- **Nada de lo hecho en canvas está probado a fondo en iPhone.** En Carrera hay que validar la dificultad de la vista desde detrás: se ajusta con `BASE` (velocidad) y `Z0` (distancia de aparición).
- **Repite con Bip sin tarjeta propia**: decidir tras observar si lo encuentra. Sacarlo al menú es quitar `hidden`.
- **Arte**: faltan las hojas de iconos de granja (gallina, girasol, árbol, oveja, casa, perro, tractor, sol, caballo, gato, pato, pollito, nube de tormenta y un cerdito nuevo, que el actual no convence) y de espacio (astronauta, cohete, estrella, Tierra, Luna, satélite, marcianito, platillo, robot), más iconos de tarjeta para Tres en raya y Laberinto.
- **CSS por capas**: `css/style.css` acumula reglas que se pisan. Limpieza pendiente, no urgente.

## 4. Línea a seguir

Por orden. Los tres primeros son bloques grandes; el resto, mejoras sueltas.

### 4.1 Registro de uso (local)

Para decidir con datos qué reforzar. Todo se queda en el dispositivo.

- Módulo `js/usage.js` (`Usage`). `app.js` abre y cierra la sesión de cada juego al entrar y salir; los juegos solo avisan de lo propio: `Usage.event('acierto' | 'fallo', { item, elegido })`, `Usage.event('pista')`, `Usage.event('otra')`.
- Tiempo real de juego: solo cuenta con la pestaña visible y con algún toque en los últimos 30 segundos.
- Por perfil y por día, para cada juego: sesiones, segundos, partidas terminadas, abandonadas a mitad, "otra vez", pistas y pulsaciones del altavoz. Se conservan 90 días.
- En los juegos de aprender, tabla de confusiones (qué se pedía y qué eligió), para ver qué letras o números mezcla.
- Últimos 20 errores de JavaScript con el juego en el que ocurrieron y la versión de la app.
- Zona de padres: panel "Qué juega" (7 y 30 días), "Dónde se atasca" y un botón "Copiar informe" en texto plano, para pegarlo en el chat y analizarlo.
- Límite de tamaño: unos 200 KB. Dejar un único punto de salida (`Usage.flush(destino)`) por si algún día se sincroniza con un servidor; ahora no.

### 4.2 Mi abecedario

Sustituye con el tiempo al juego Letras. Copia la ficha semanal del colegio, que tiene cinco partes:

1. **Repaso**: repasar la letra punteada, en mayúscula de imprenta y en minúscula ligada.
2. **Escribo**: escribirla sin guía.
3. **Escucho**: cómo suena (en la ficha, una foto de la boca).
4. **Construyo**: formar la letra con materiales (cuerda, limpiapipas).
5. **Escribo palabras**: palabras que empiezan por esa letra, en mayúsculas.

En la web, un juego `abecedario` en "Aprende jugando":

- **Entrada**: rejilla del abecedario. La "letra de la semana" (se fija en la zona de padres) aparece destacada; las demás están abiertas. Cada letra completada gana un sello.
- **Cinco estaciones cortas por letra**, todas acaban en acierto:
  1. *Repaso*: trazar con el dedo sobre la guía punteada, con punto de inicio y flecha de dirección. Primero mayúscula, luego minúscula ligada. Tolerante: avanza al cubrir la guía; salirse no penaliza. En la primera versión basta con medir cuánto de la letra se ha cubierto, sin exigir orden de trazos.
  2. *Escribo*: lienzo libre junto al modelo. No se evalúa; se puede guardar en la galería.
  3. *Escucho*: la voz alarga el sonido ("mmm… mono") y hay que elegir, entre tres dibujos, el que empieza por la letra. Nivel 2: ¿suena al principio o al final?
  4. *Construyo*: formar la letra con bloques en una rejilla de 5×7, rellenando las casillas marcadas. Nivel 2: sin marcas.
  5. *Escribo palabras*: dibujo y voz dicen la palabra; se ordenan fichas de letras en mayúsculas. Nivel 1: solo las letras de la palabra, con la primera puesta. Nivel 2: fichas de sílabas. Nivel 3: con letras de sobra.
- **Letra**: mayúscula de imprenta grande con la minúscula ligada al lado. Para la ligada, la fuente Playwrite ES (licencia OFL), servida desde `fonts/`.
- **Palabras**: salen de `docs/contenido/abecedario.md`, que se revisa en el chat.
- **Fuera de la primera versión**: orden estricto de trazos y reconocimiento de escritura.
- Los dibujos de la boca solo con material validado por la familia.

### 4.3 Sumas con bloques y panel del 100

Material: ábaco de dos filas (cinco bolas de un color y cinco de otro) hasta 20; bloques de base 10 (barras de diez y cubos sueltos) hasta 100. Los bloques, con aspecto de cubos de construcción.

- **Construye el número**: la voz dice un número y se forma arrastrando barras y cubos. Niveles: hasta 10, hasta 20, decenas exactas, hasta 99.
- **Suma con bloques**: dos torres que se juntan. Niveles: sumandos hasta 5; resultado hasta 10; amigos del 10 (¿cuánto falta?); cruzar la decena con un marco de diez; decenas más unidades.
- **Panel del 100**: tabla de 10×10. Encontrar el número que dice la voz, rellenar huecos, contar de 10 en 10, vecinos (uno más, uno menos, diez más).
- El nivel 4 de Cuenta (sumas con dibujos) pasa a usar bloques.

### 4.4 Inglés

- Primera versión: modo inglés de Cuenta (hasta 20) y Colores. Misma mecánica; la instrucción corta en español y la palabra en inglés.
- Técnico: `Core.say(texto, { lang: 'en-GB' })` con elección de voz inglesa como se hace con la española. Si el dispositivo no tiene voz inglesa, el modo no se ofrece.
- Después: animales, cuerpo y familia, siempre de oído con dibujo.

### 4.5 Carrera: saltar

- Deslizar hacia arriba salta. Tocar a un lado, o deslizar a un lado, cambia de carril. El gesto se decide por la dirección de los primeros 24 px; si no hay desplazamiento, es un toque.
- Obstáculo nuevo que cruza los tres carriles: valla baja en la granja, aro de energía en el espacio.
- Las primeras partidas no tienen vallas. La voz lo explica la primera vez que aparecen.

### 4.6 Laberinto con flechas

Mini-programación sobre el laberinto actual: se colocan las flechas por adelantado y luego el personaje las ejecuta. Si choca, se para ahí y se corrige desde ese punto. Empieza con caminos de tres pasos.

### 4.7 Más adelante

Invasores con números o colores (solo cuentan los que dice la voz), cuatro en raya, rompeladrillos, pong para dos, el que sobra, clasificar, juego de escenario propio para Globos y Pilla.

## 5. Reparto del trabajo

- **Chat (proyecto "Aprendizaje Jr" en Claude)**: ideas, mecánicas, contenido (listas de palabras, frases de voz, orden de letras), valorar propuestas, decisiones y arreglos pequeños desde el móvil. Lo que se decide allí se escribe en `docs/`, para que quede en el repo.
- **Claude Code**: los bloques grandes de código (4.1 a 4.3), las pruebas en el iPhone real, las ramas y la limpieza técnica.
- **El autor**: probar con el niño, generar las hojas de iconos y decir cada semana qué letra toca.

## 6. Decisiones tomadas

- Primero entretenimiento; lo educativo va ganando peso con progresión real, no con más juegos sueltos.
- Se amplía "Aprende jugando" en esta web. La app de aprendizaje aparte, descartada.
- Lectoescritura antes que el resto, siguiendo el método del colegio (mayúscula de imprenta, minúscula ligada, una letra por semana).
- Sin motor de juegos: canvas 2D propio para la acción, DOM para la interfaz.
- Estilo: Día arcade en la granja, Noche arcade en el espacio, opción Pegatina por jugador.
- Iconos 3D tipo juguete generados fuera; los packs de assets externos, descartados por choque de estilo.
- Tres en raya: solo variante de tres fichas; X/O por defecto. Simón dentro de Tres en raya.
- Registro de uso solo local; nada de analítica de terceros.
