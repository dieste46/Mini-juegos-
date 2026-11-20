# Plan de Mundo Joor

Actualizado: 20/11/2026. Quien cierre algo actualiza los apartados 2, 3 y 6.

## 1. Para quién y para qué

Un niño de 5 años, en 3º de Infantil; el curso que viene empieza Primaria. Todavía no lee.

- En clase: abecedario completo (una letra por semana, con una ficha de cinco partes: ver 4.2), números hasta 100 y sumas sencillas.
- Suma bien dos números menores de 5; con dos números menores de 10 puede; más allá se le complica.
- En inglés cuenta hasta 20 y conoce los colores.
- Le gustan pintar, los laberintos, los juegos de bloques y los de correr por carriles.

Objetivo de fondo: que llegue a Primaria con la base de lectura hecha, para que pueda hacer solo los deberes. Leer no es exigible para empezar Primaria (Orden ECD/853/2022 de Aragón, art. 4.7), así que no hay prisa de calendario: se trata de autonomía, no de un listón.

El contexto personal no está en este repo, que es público. Va en `docs/privado/contexto.md`, que no se sube.

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
| Guía a Bip | `robot` | aprende | DOM | Programar el camino de Bip con flechas y verlo ejecutarse (5 niveles; el último, con ficha de repetir) |

Además: temas granja y espacio, estilo arcade con opción pegatina, perfiles con guardado versionado, mundo de recompensas, mascota Bip, zona de padres (voz, estilo, perfiles, exportar e importar partidas con formato versionado), PWA sin conexión.

## 3. Pendiente conocido

- **Casa que no respondía en iPhone** tras un juego. Encontrada una causa, reproducible en Chromium: en Cuenta, Colores, Letras y Series, al pulsar la casa en el segundo y medio que sigue a un acierto, la siguiente pregunta se pintaba encima del menú, ya sin botón de casa (el motor de preguntas no tenía limpieza). Arreglado en `Core.runQuiz`, que ahora devuelve su función de limpieza. Falta confirmar en el iPhone que era esto y que no hay otra causa.
- **Service worker**: tras actualizarse, la caché nueva queda vacía hasta la siguiente carga con red. Sin conexión justo después de una actualización, puede faltar algún archivo.
- **Nada de lo hecho en canvas está probado a fondo en iPhone.** En Carrera hay que validar la dificultad de la vista desde detrás: se ajusta con `BASE` (velocidad) y `Z0` (distancia de aparición).
- **Repite con Bip sin tarjeta propia**: decidir tras observar si lo encuentra. Sacarlo al menú es quitar `hidden`.
- **Arte**: faltan las hojas de iconos de granja (gallina, girasol, árbol, oveja, casa, perro, tractor, sol, caballo, gato, pato, pollito, nube de tormenta y un cerdito nuevo, que el actual no convence) y de espacio (astronauta, cohete, estrella, Tierra, Luna, satélite, marcianito, platillo, robot), más iconos de tarjeta para Tres en raya y Laberinto.
- **CSS por capas**: `css/style.css` acumula reglas que se pisan. Limpieza pendiente, no urgente.

### Mudanza de alojamiento (en marcha)

De GitHub Pages a Cloudflare Pages, con la dirección gratuita `https://mundojoor.pages.dev`, para poder tener el repo privado y un enlace de prueba por cada rama.

Hecho:
- El repo se llama `mundojoor` (antes `Mini-juegos-`).
- La web funciona igual desde la raíz y desde una subcarpeta: todas las rutas son relativas, el manifest declara `scope` y hay `404.html`.
- Exportar e importar partidas con formato versionado. El importador acepta también las copias de la versión anterior, que es como salen de la web antigua.
- Cloudflare Pages publica solo `web/`: sin compilación, rama de producción `main`, directorio de salida `web`. Ese ajuste solo vale para los despliegues nuevos.
- Fusionado a `main` el 20/11/2026. Comprobado en producción: `https://mundojoor.pages.dev/` abre el juego con la caché `v20`, `/README.md` y `/web/` dan 404, carga sin conexión e importa una copia de la versión anterior. GitHub Pages sirve la misma versión en paralelo.

A tener en cuenta:
- Al renombrar el repo, GitHub no redirige las direcciones de Pages: `https://dieste46.github.io/Mini-juegos-/` da 404 y la web está en `https://dieste46.github.io/mundojoor/` (comprobado el 20/11/2026). El icono ya instalado apunta a la dirección antigua: con conexión enseñará ese 404, porque el service worker solo recurre a la caché cuando no hay red. Los datos siguen dentro de ese icono. Esto último falta verlo en el móvil.
- La vista previa de una rama está en `https://<alias>.mundojoor.pages.dev`, donde el alias es el nombre de la rama en minúsculas, con guiones en lugar de lo que no sea letra o número y recortado a 28 caracteres.
- Web Analytics de Cloudflare, desactivado: inyecta un script de terceros.
- El despliegue de GitHub Pages falla a veces con "No artifacts named github-pages": es un fallo pasajero de GitHub y basta con relanzar el trabajo fallido.

Pasos que faltan, en este orden:
1. En cada dispositivo, desde el icono antiguo: zona de padres → "Guardar copia" → guardar en Archivos. Si sale el 404, poner el modo avión y volver a abrirlo.
2. En cada dispositivo: abrir `https://mundojoor.pages.dev` en Safari → Compartir → "Añadir a pantalla de inicio" → abrir desde el icono nuevo → zona de padres → "Importar partidas". En este orden: la app instalada no ve lo que se haya importado en Safari. Borrar el icono antiguo.
3. Pasados unos días con las dos versiones en paralelo: quitar `.github/workflows/pages.yml`, desactivar Pages en GitHub, poner el repo en privado y quitar de `CLAUDE.md` la mención a GitHub Pages.

Cambiar otra vez de dirección (un dominio propio, por ejemplo) obliga a repetir los pasos 1 y 2, hasta que exista la sincronización de 4.0: con ella bastará teclear el código de familia en la dirección nueva.

## 4. Línea a seguir

Los apartados conservan su número, pero el orden de trabajo se revisó el 20/11/2026. El objetivo es la base de lectura, y eso lo mueve el abecedario; la sincronización no enseña nada y puede esperar ahora que hay exportar e importar.

1. Guía a Bip, el robot con flechas (hecho; ver 4.6).
2. Mi abecedario, primer corte: "Escucho" y "Escribo palabras" (4.2). Pendiente de que la familia valide `docs/contenido/abecedario.md`.
3. Misión del día (4.8).
4. Marco de diez y amigos del 10 (lo primero de 4.3).
5. Registro de uso, lo justo para que la misión elija qué reforzar (4.1).
6. Sincronización (4.0).

Confirmado por el autor solo el punto 1; el resto es la propuesta sobre la mesa.

### 4.0 Sincronización en la nube: `mundo-api` (diseñado, sin implementar)

Para que el iPhone y el iPad compartan el progreso y para que cambiar de aparato o de dirección no dependa de acordarse de exportar. Una sola API para todos los juegos de la familia: mundojoor, mundobloque y los que vengan.

**Principios**

- Local primero: el juego lee y escribe siempre en el dispositivo y nunca espera a la red. Sincronizar es un trabajo de fondo que puede fallar sin que se note.
- Sin cuentas ni correo: un "código de familia" une los dispositivos.
- Perfiles por niño. Un registro por perfil y juego, con `updatedAt`. Gana el más reciente.
- La API no sabe nada de cada juego: guarda JSON opaco. Un juego nuevo no obliga a tocarla.

**Piezas**

| Pieza | Dónde vive | Qué hace |
|---|---|---|
| `mundo-api` | Worker de Cloudflare con D1, en su propio repo | Guarda y reparte registros. Es lo único que toca la base de datos |
| `js/sync.js` (`Sync`) | Cliente; el mismo archivo en todos los juegos | Cola de pendientes, llamadas a la API, reintentos. No conoce los juegos |
| `js/store.js` (`Store`) | Cliente; propio de cada juego | Sigue siendo la única puerta al guardado local. Dice qué ha cambiado y aplica lo que llega |

Es un Worker aparte y no funciones dentro de cada web porque lo comparten varios juegos, cada uno en su dominio: una base de datos, un despliegue, y las webs siguen siendo estáticas. El precio es que las llamadas cruzan de dominio (CORS).

**Código de familia**

- Lo genera el servidor al crear la familia: 12 caracteres en tres grupos (`K7QM-2XHD-9TFP`), con un alfabeto sin letras que se confunden (sin I, L, O ni U). Son 60 bits.
- Es la única credencial: quien lo tiene lee y escribe los datos de esa familia. Se enseña en la zona de padres para teclearlo en el otro dispositivo. Tiene que poder teclearse: en iOS la app instalada no comparte datos con Safari, así que un enlace no sirve.
- El servidor guarda solo su SHA-256, que hace de `family_id`. El código en claro vive en los dispositivos, en los ajustes del aparato, y no entra en la copia exportada.
- Viaja en la cabecera `Authorization: Bearer`, nunca en la dirección.

**Datos (D1)**

```sql
CREATE TABLE families (
  id         TEXT PRIMARY KEY,           -- SHA-256 del código de familia
  created_at INTEGER NOT NULL,
  seq        INTEGER NOT NULL DEFAULT 0  -- contador de cambios aceptados: es el cursor de sincronización
);
CREATE TABLE profiles (                  -- el niño: común a todos los juegos
  family_id  TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  data       TEXT NOT NULL,              -- JSON: { name, avatar }
  updated_at INTEGER NOT NULL,           -- ms, reloj del dispositivo que hizo el cambio
  deleted    INTEGER NOT NULL DEFAULT 0,
  seq        INTEGER NOT NULL,
  PRIMARY KEY (family_id, profile_id)
);
CREATE TABLE records (                   -- un registro por perfil y juego
  family_id  TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  app        TEXT NOT NULL,              -- 'mundojoor', 'mundobloque'…
  game       TEXT NOT NULL,              -- 'contar', 'laberinto'…; '_app' para lo general del perfil en esa app
  data       TEXT NOT NULL,              -- JSON opaco para el servidor
  updated_at INTEGER NOT NULL,
  deleted    INTEGER NOT NULL DEFAULT 0,
  seq        INTEGER NOT NULL,
  PRIMARY KEY (family_id, profile_id, app, game)
);
CREATE INDEX records_pull ON records (family_id, app, seq);
```

- En mundojoor, cada minijuego es un registro con lo que hoy es `profile.games[id]`. El registro `_app` lleva lo general del perfil en esta web: tema, estilo y mundos vistos.
- `updated_at` decide quién gana. Lo pone el dispositivo; el servidor lo recorta a su propia hora si llega del futuro, para que un aparato con la fecha mal no gane siempre.
- `seq` decide qué hay nuevo ("dame lo cambiado desde el 41"). Lo pone el servidor, así que saber qué falta por bajar no depende del reloj de nadie.
- Los borrados son una marca (`deleted`), no quitar la fila: el borrado también tiene que propagarse.
- Límites: 64 KB por registro y 1 MB por petición.

**API (v1)**

| Ruta | Qué hace |
|---|---|
| `POST /v1/families` | Crea una familia y devuelve su código. Sin credencial; muy limitada por IP |
| `POST /v1/sync` | Con el código. Sube los cambios pendientes y baja lo nuevo, en una sola llamada |
| `DELETE /v1/family` | Con el código. Borra todo lo de esa familia |
| `GET /v1/health` | Para comprobar despliegues |

```
POST /v1/sync
→ { app: "mundojoor", since: 41,
    profiles: [ { id, updatedAt, deleted, data: { name, avatar } } ],
    records:  [ { profile, game, updatedAt, deleted, data: { … } } ] }
← { cursor: 57,
    profiles: [ … ],      // perfiles cambiados desde `since`
    records:  [ … ] }     // registros de esta app cambiados desde `since`, incluidos los que han ganado a lo enviado
```

- Cada cambio entra con `INSERT … ON CONFLICT DO UPDATE … WHERE excluded.updated_at > updated_at`: solo si es más reciente que lo que hay. A igualdad de fecha se queda el que estaba.
- Es idempotente: repetir la misma petición no cambia nada, así que el cliente reintenta sin miedo.
- Toda la petición va en una transacción.
- Un código desconocido responde 401. No se crean familias por el mero hecho de sincronizar, para que un error al teclear no abra una familia vacía.

**CORS y abuso**

- Lista de orígenes permitidos en una variable del Worker: `https://mundojoor.pages.dev`, el de mundobloque y el de cada juego nuevo. Se responde con el origen concreto, nunca con `*`, y con `Vary: Origin`.
- La petición previa (`OPTIONS`) se contesta con los métodos y cabeceras justos (`authorization`, `content-type`) y un día de validez.
- Una petición con un `Origin` que no esté en la lista recibe un 403.
- Las vistas previas de las ramas (`https://<rama>.mundojoor.pages.dev`) hablan con un Worker y una base de datos de pruebas aparte. Nunca con los datos de verdad.
- CORS solo frena a otras webs dentro de un navegador; un programa cualquiera puede mandar el `Origin` que quiera. La protección real es el código (60 bits) más el límite de intentos: del orden de 10 códigos fallidos por IP y hora, y 5 familias nuevas por IP y día.
- En los registros del Worker no se escribe ni el código ni el contenido.

**Cliente**

- `Store` ya es la única puerta al guardado y lo sigue siendo. Pasa al esquema v3: cada registro lleva su `updatedAt` y una marca de pendiente de subir. Los juegos no se tocan: al guardar, `Store` compara cada `games[id]` con lo último guardado y sella los que han cambiado. Ofrece dos funciones nuevas: `Store.changes()`, lo pendiente, y `Store.apply(remotos)`, que aplica lo que llega si es más reciente que lo local.
- `Sync` es un módulo nuevo, `js/sync.js`, idéntico en todos los juegos: `Sync.init({ api, app, store })`. Guarda en los ajustes del dispositivo el código, el cursor y la fecha de la última sincronización.
- Cuándo sincroniza: al abrir la app, al volver al menú después de un juego, al pasar a segundo plano, al recuperar la conexión y con el botón de la zona de padres. Nunca en mitad de una partida.
- Si falla (sin red, API caída): lo pendiente se queda en la cola y se reintenta en la siguiente ocasión. Si el código deja de valer (401), se para y se avisa en la zona de padres.
- El service worker no se toca: solo intercepta `GET`, y la API va por `POST` a otro dominio.
- En la copia de GitHub Pages, mientras exista, la sincronización queda apagada: su origen no está en la lista.

**Zona de padres**

- "Sincronizar entre dispositivos": *Crear código de familia* o *Tengo un código*.
- Ya vinculado: el código (oculto hasta tocarlo), "Última sincronización: hace 5 min", *Sincronizar ahora* y *Desvincular este dispositivo* (lo local se queda).
- Al unirse un dispositivo que ya tiene partidas, los perfiles con el mismo `id` se mezclan registro a registro; los demás quedan como jugadores distintos. Para que el iPhone y el iPad compartan `id` basta con importar la misma copia en los dos, que es justo lo que se hace en la mudanza. Fusionar a mano dos perfiles distintos queda fuera de la primera versión.

**Qué no se sincroniza en la primera versión**

- Los ajustes del dispositivo (la voz).
- Los dibujos de Pintar: son imágenes y no van en D1. Siguen viajando en la copia exportada.
- El registro de uso (4.1): se queda local. Su `Usage.flush(destino)` es el enganche si algún día se quiere subir.

**Lo que "gana el más reciente" no resuelve** (a validar antes de implementar)

- Si se juega al mismo juego en dos dispositivos sin conexión entre medias, el registro más antiguo se pierde entero. Con un registro por juego el daño es pequeño: el nivel se reajusta solo en dos o tres partidas.
- Las estrellas son el caso delicado. Hoy son un único contador por perfil que tocan todos los juegos: chocaría casi siempre y el niño vería bajar sus estrellas. Propuesta: guardar en el registro de cada juego las estrellas ganadas en él y que el total sea la suma (`app.js` ya sabe qué juego está abierto, no hay que tocar los juegos). Así solo chocan si es el mismo juego en los dos aparatos, y para ese campo `Store.apply` se queda con el mayor de los dos valores: las estrellas no bajan nunca. El servidor sigue siendo "gana el más reciente" a secas; la excepción vive en el cliente y solo para las estrellas.
- Importar una copia con la sincronización activa: los registros entran con las fechas que tenían en la copia, así una copia vieja no pisa lo más nuevo de la nube. "Borrar progreso" sí sella con la fecha del momento: el borrado gana.

**Privacidad**

- Lo único personal que sube es el nombre que se le haya puesto al jugador, que es opcional, y su progreso. Queda en la cuenta de Cloudflare de la familia, con la base de datos ubicada en la UE.
- Mientras lo use solo la familia es una actividad doméstica, fuera del RGPD (art. 2.2.c). Si algún día se abre a otras familias deja de serlo: habría que informar y contar con el consentimiento de los padres (menores de 14 años, art. 7 de la LOPDGDD). Decidirlo antes de pasarle a nadie la dirección de un juego con la sincronización puesta.

**Fases**

1. Cliente, sin red: `Store` v3 (fechas por registro, pendientes, `changes()` y `apply()`), estrellas por juego y `Sync` contra una API simulada en memoria. Prueba: dos "dispositivos" que juegan sin conexión y luego se cruzan.
2. `mundo-api`: repo nuevo, esquema con migraciones, las cuatro rutas, CORS y límites. Pruebas en local y dos despliegues separados, pruebas y producción.
3. Zona de padres: crear, unirse, estado, sincronizar ahora y desvincular. Prueba real con el iPhone y el iPad.
4. mundobloque adopta `sync.js` con su propio `app`.
5. Si hace falta: dibujos en R2, cambiar de código, fusionar perfiles.

El plan gratuito de Workers y D1 debería sobrar para este uso; comprobar los límites vigentes al empezar la fase 2.

**Abierto**

- Validar la regla de las estrellas.
- Dirección de mundobloque, para la lista de orígenes.
- Dirección de la API: vale la de `workers.dev`. Cambiarla más adelante obliga a publicar los juegos con la nueva, no a mover datos.

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

En la web, un juego `abecedario` en "Pequesabios":

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

### 4.6 Guía a Bip (hecho) y sus ampliaciones

Sustituye al "Laberinto con flechas" que había aquí. Está en `js/games/robot.js`: se colocan las flechas por adelantado y Bip las ejecuta; si choca, se para ahí y se corrige desde ese punto. Flechas de dirección fija, porque a los 5 años "gira a la izquierda" es bastante más difícil que "ve a la izquierda".

Falta probarlo con el niño. Según cómo le vaya:
- Si el nivel 5 (repetir) le queda lejos, partirlo en dos: primero repetir con huecos de sobra, luego con los justos.
- Más adelante: repetir un grupo de flechas, giros relativos (el robot mira hacia donde anda) y tableros hechos a mano para la misión del día.

### 4.7 Más adelante

Invasores con números o colores (solo cuentan los que dice la voz), cuatro en raya, rompeladrillos, pong para dos, el que sobra, clasificar, juego de escenario propio para Globos y Pilla.

### 4.8 Misión del día (propuesta)

Una sesión corta que mezcla juegos, para que haya rutina sin tener que elegir.

- Tres actividades cortas, una de letras, una de números y una de lógica, y después un rato libre de premio. Unos diez minutos, con final claro.
- Semanal: una tira de siete sellos y la letra de la semana, que elige la familia en la zona de padres.
- Sin rachas ni castigo por saltarse un día: si no, deja de ser un reto y pasa a ser deberes.
- Técnicamente barato: todos los juegos menos Piano y Pintar acaban en `Core.endScreen`, así que la misión puede encadenarlos desde ahí sin tocarlos.
- Con cinco o seis juegos de aprender la mezcla se repite pronto. Tiene sentido cuando exista el primer corte del abecedario.

### 4.9 Sonidos antes que letras (propuesta)

Conciencia fonológica, todo de oído: palmadas por sílabas, "¿empiezan igual?", juntar sílabas para formar la palabra.

- Las listas de palabras las da la familia, como en todo lo de pronunciación.
- La voz sintética es mala para sonidos sueltos. Alternativa: grabar la voz de la familia desde la zona de padres (se guardaría en el dispositivo y viajaría en la copia exportada).

## 5. Reparto del trabajo

- **Chat (proyecto "Aprendizaje Jr" en Claude)**: ideas, mecánicas, contenido (listas de palabras, frases de voz, orden de letras), valorar propuestas, decisiones y arreglos pequeños desde el móvil. Lo que se decide allí se escribe en `docs/`, para que quede en el repo.
- **Claude Code**: los bloques grandes de código (4.0 a 4.3), las pruebas en el iPhone real, las ramas y la limpieza técnica.
- **El autor**: probar con el niño, generar las hojas de iconos y decir cada semana qué letra toca.

## 6. Decisiones tomadas

- Primero entretenimiento; lo educativo va ganando peso con progresión real, no con más juegos sueltos.
- Se amplía "Pequesabios" (antes "Aprende jugando") en esta web. La app de aprendizaje aparte, descartada.
- Lectoescritura antes que el resto, siguiendo el método del colegio (mayúscula de imprenta, minúscula ligada, una letra por semana).
- Sin motor de juegos: canvas 2D propio para la acción, DOM para la interfaz.
- Estilo: Día arcade en la granja, Noche arcade en el espacio, opción Pegatina por jugador.
- Iconos 3D tipo juguete generados fuera; los packs de assets externos, descartados por choque de estilo.
- Nombres: la app y el título del menú son "Mundo Joor"; el nombre del jugador solo sale en el saludo. Se probó "Mundo" y el nombre del jugador como título y se descartó. Las secciones son "Minijuegos" (antes "¡A jugar!") y "Pequesabios". Los identificadores internos (`recreo`, `aprende`, `mini-juegos-*`) no cambian.
- Icono de la app: Bip sobre el cielo del espacio, dibujo propio. Sustituye al emoji del cerdito, que no era arte nuestro.
- Tres en raya: solo variante de tres fichas; X/O por defecto. Simón dentro de Tres en raya.
- Registro de uso solo local; nada de analítica de terceros.
- Alojamiento: Cloudflare Pages en `mundojoor.pages.dev`, con repo privado al acabar la mudanza; la web en `web/` para no publicar los documentos. Rutas siempre relativas.
- La copia exportada lleva su propia versión de formato (`format`), distinta de la del guardado (`v`). Importar sustituye lo que hay, previa confirmación con el contenido de la copia a la vista, y deja lo anterior en `mini-juegos-store-anterior`.
- No se renombran las claves internas (`mini-juegos-store`, `mini-juegos-arte`, cachés `mini-juegos-vN`) ni el nombre visible: cambiarlas obligaría a migrar datos sin ganar nada.
- Sincronización: un Worker aparte, `mundo-api`, con D1, común a todos los juegos; código de familia sin correo; gana el más reciente; local primero. Supabase y las funciones dentro de cada web, descartados.
