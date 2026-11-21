#!/usr/bin/env bash
# Pasa todas las baterías contra la copia local de la web. Desde la raíz del repo:  bash pruebas/pasar.sh
# Tarda unos veinte minutos. Para una sola: levantar los servidores como aquí y lanzar  node pruebas/<batería>.js
set -u
cd "$(dirname "$0")/.."
T=pruebas/tmp; rm -rf "$T"; mkdir -p "$T/sub" pruebas/out
ln -sfn "$PWD/web" "$T/sub/mundojoor"                                   # la misma web, servida desde una subcarpeta
python3 -m http.server 8800 --directory web >/dev/null 2>&1 & A=$!      # desde la raíz, como en Cloudflare Pages
python3 -m http.server 8801 --directory "$T/sub" >/dev/null 2>&1 & B=$! # desde /mundojoor/, como en GitHub Pages
trap 'kill $A $B 2>/dev/null; rm -rf "$T"' EXIT
sleep 1.5
fallos=0
for b in general robot robot-guia robot-rodeo ayuda semana personalizacion letras; do
  node "pruebas/$b.js" > "pruebas/out/$b.txt" 2>&1 || fallos=$((fallos + 1))
  echo "== $b: $(grep -c '^OK' "pruebas/out/$b.txt") bien, $(grep -c '^FAIL' "pruebas/out/$b.txt") mal"
  grep '^FAIL' "pruebas/out/$b.txt"
done
[ "$fallos" = 0 ] && echo "Todo bien" || echo "$fallos baterías con fallos (detalle en pruebas/out/)"
exit "$fallos"
