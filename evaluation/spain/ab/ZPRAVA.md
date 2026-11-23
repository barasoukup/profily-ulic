# A/B: mapa povrchů Zaragozy (23. 11. 2026)

Vzorek `sample.json` (`sample.mjs`, semínko 20261124): 40 náhodných bodů do 2,5 km od středu Zaragozy. Sběr v aplikaci
(localhost, `?osm=balik` s lokálním balíkem OSM jedenácti španělských měst), každý bod A = bez mapy (`?zaragoza=0`, odhad
z ortofota PNOA a OSM) a B = s mapou (chodníky, střední a zelené pásy z dlažeb města 2017, vozovka mezi nimi podél os
silnic z OSM). Výsledky `vysledky/a.json`, `b.json`, spojené `rezy.json`; obrázky `images/` (nahoře A modře, dole
B červeně, nad ortofotem PNOA; `ORTHO=es` v `evaluation/slovensko/ab/obrazky.mjs`).

- Mapa použita ve 33 řezech ze 40 (jinde chodník mapy do 25 m od středu řezu nebyl).
- Posudky (`vysledky/posudky.json`, posuzovatel Sonnet nad obrázky 10 px = 1 m, bez fotek z ulice): **lépe B 11, lépe
  A 2, stejně 12, nejde posoudit 8.**
  - Lépe B: přesnější šířka vozovky nebo stání vidět na snímku (zg3, zg13, zg25, zg26, zg39); náměstí, kruhový objezd,
    kolejový pás, zeleň, střední pás a více pruhů tam, kde odhad skoro nic nenakreslil (zg9, zg16, zg28, zg30, zg32, zg40).
  - Lépe A: zg12 Marqués de la Cadena (B kreslí pruhy přes chodník a trávu: vozovka „podél os OSM“ přesáhla), zg20
    Mariano Pano y Ruata (obruba B posunutá asi o 1,3 m, stání navíc).
- Snímky jsou malé a často ve stínu nebo pod stromy, posudky jsou přibližné.
- Mapa zůstává zapnutá (`?zaragoza=0` vypne).

Otevřené: vozovka jako pás kolem os OSM může přesáhnout přes trávu, kterou mapa nemá (zg12); řezy na pěších plochách
(zg24: 44 m „neznámého“ na nezpevněné ploše, zg28: chodník 28,6 m) jsou špatně s mapou i bez ní.
