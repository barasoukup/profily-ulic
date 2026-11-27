# Profily ulic Opava: kontrola 50 náhodných řezů

9. 11. 2026 · stránka `/opava/` (zatím nenasazená)

Vzorek `CITY=opava node evaluation/sample.mjs` (stejné kvóty a seed jako jinde; vyšlo 83 řezů, obytné zóny
v Opavě v OSM skoro nejsou). Do kontroly šlo prvních 60 % řezů z každého typu ulice, tedy 50 řezů. Profily
`CITY=opava node evaluation/run_brno.mjs` (kód aplikace nad živými službami města), obrázky
`CITY=opava node evaluation/render_brno.mjs` nad ortofotem ČÚZK (město má jen kopii ortofota ČÚZK).
Řezy prošel jeden kontrolor podle obrázků a výpisu částí.

| Město | sedí | částečně | špatně |
|---|---|---|---|
| **Opava (účelová mapa povrchové situace, RÚIAN, parkovací stání města)** | **29** | **19** | **2** |
| Jihlava (pasport komunikací, RÚIAN, parkování města) | 43 | 41 | 5 |

Před opravami bylo 12 řezů špatně: vozovka chyběla nebo se tvářila jako budova či chodník.

## Opraveno při kontrole
- Vozovky ulic tvoří v účelové mapě čtyři obří polygony po celém městě (0,2–1 km², až 59 000 bodů). Tři
  z nich mají omylem popis „Bud-zděná“, „Chodník“ a „Zpevněná plocha“. Žádná budova v nich neleží,
  zato dvě třetiny os ulic z OSM ano. Teď se čtou jako vozovka a stahují se zvlášť, zjednodušené na 0,2 m
  (2,4 MB místo 0,1 MB na řez).
- Služby města převádějí S-JTSK do WGS 84 transformací 15965, takže data leží asi 4 m vedle OSM. Dotazy
  proto žádají `datumTransformation=1623`, s níž rohy budov sedí na RÚIAN do 0,1 m a na OSM do 0,2 m.

## Typické vady, které zůstaly
- Venkovské a polní cesty: celá vozovka jako jeden pruh nebo pruh se širokou krajnicí (odhad), sedm řezů.
- Kolmé stání mimo placené zóny chybí. Parkovací stání města má jen zóny, jinde je jen odhad podélného
  stání (Vojanova, Pekařská).
- Řezy u křižovatek a parkovišť: zalomená opěrná zeď (Ratibořská), parkoviště čtené jako pruh (Pekařská),
  souběžné obslužné komunikace (Žižkova).
- Ploty bez podezdívky zná aplikace jen z OSM. Vrstva plotů města (`basemap_umpspro`, vrstva 49) se dá jen
  vykreslit, dotazovat se na ni nejde. CAD linie (`info_dtm_liniova`) mají jen čísla úrovní a žádnou legendu.
