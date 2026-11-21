# Pruebas

Baterías con Playwright que emulan un móvil (390×844, táctil) contra la web servida en local. No son parte de la web: esta carpeta no se publica.
Hacen falta Node, Python 3 y Playwright con Chromium; en las sesiones de Claude Code en la nube ya vienen.

```bash
bash pruebas/pasar.sh          # todas, desde la raíz del repo (unos veinte minutos)
```

| Batería | Qué comprueba |
|---|---|
| `general.js` | Servida desde la raíz y desde una subcarpeta, sin conexión, exportar e importar (formato nuevo, antiguo, archivos no válidos, copia retocada), y humo de los juegos: partida completa, "otra vez", casa a mitad y los dos temas |
| `robot.js` | Guía a Bip: el generador de tableros, partida completa, tropiezos, pistas, niveles 4 y 5, tamaños de pantalla |
| `robot-guia.js` | Guía a Bip: siguiendo solo lo que brilla se resuelve cualquier tablero a la primera |
| `robot-rodeo.js` | Guía a Bip, nivel 4: tras llegar sin la estrella, lo que falta cabe entero en los huecos |
| `ayuda.js` | El botón "?" y la ventana de cómo se juega, en todos los juegos |
| `semana.js` | La letra de la semana |
| `personalizacion.js` | Juegos del menú, favoritos, Mi Bip, nivel a mano y letras trabajadas |
| `letras.js` | Qué letras pregunta el juego Letras en cada nivel (informativa: no falla, hay que leerla) |
| `desplegado.js` | Contra una dirección ya publicada: `node pruebas/desplegado.js https://mundojoor.pages.dev/` |

- `robot.js`, `ayuda.js` y `personalizacion.js` aceptan también una dirección publicada como argumento.
- `datos/copia-antigua.json` es una copia de seguridad en el formato anterior a la mudanza, con datos inventados. Sirve para comprobar que se sigue pudiendo importar.
- Los resultados y las capturas van a `pruebas/out/`, que no se sube.
- Un fallo no siempre es de la web: si una batería compara con lo guardado, antes hay que llamar a `Store.flush()` (ver "Probar" en `CLAUDE.md`).
- Una función nueva lleva su batería, o sus comprobaciones en la que toque.
