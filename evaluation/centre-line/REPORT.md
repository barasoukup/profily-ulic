# Středová čára z ortofota (Bára 27. 11. 2026: „čáry čti z ortofota“)

`lanes-ortho.js centreLine(st, s, e)` vrací pro vozovku: nalezena / ne, plná / přerušovaná (podíl délky s barvou a pravidelné
mezery podél čáry) a polohu, bez ortofota `null` (neznámo). Zákon stání států (`countries/<ISO>.js centreLine`:
`required`, `solid`) to používá v `derive.js splitRoadway`; zapnuté jen Slovinsko (čl. 65/4/12 a 65/4/10), jinde `null`.
Při neznámu platí dřívější pravidlo z OSM `lanes` (`parkOnRoadway`). Vypínač `?off=stredcara`.

## Přesnost detektoru (`detect.mjs`, ručně označené vozovky `evaluation/orthophoto/labels`, kvalita „ok“, do 10 m, 73 vozovek)
- je / není čára: 65 ze 70 (93 %), 3 neznámé; do 14 m 105 ze 113 (93 %).
- bez čáry správně 27 z 29, přerušovaná 26 z 31, **plná jen 4 z 10** (sešlapaná plná čára vypadá jako přerušovaná).
- Praha a Brno na ČÚZK 12,5 cm: 18 z 21 (86 %). Vzorek je malý.

## Slovinsko: změny odhadu (replay, 350 řezů, `si-sample*.json`)
Změnilo se 14 ze 350 (4 %), dalších 76 starších řezů 0. Většinou nejde o stání, ale o pruhy: strop zákonného pásu se dřív
plánoval podle OSM a rozdělení pruhů z čar se kvůli němu zamítlo (jeden široký pruh a krajnice), nově vyjdou dva pruhy.
Slepé A/B, dva posuzovatelé Sonnet (`judge-packets.mjs`): s čarou lépe 16, bez 6, stejně 6 z 28 posudků
(bez remíz p = 0,05); shoda posuzovatelů na řez jen 7 ze 14 (ortofoto GURS 25 cm je slabé).
Kontrola mimo Slovinsko: 30 českých (Praha, Brno, Ostrava, Plzeň) a 30 švýcarských řezů, změněno 0.
Regrese `ortho-osm/regression.mjs`: výsledky beze změny. Testy 567 z 567.

Výchozí stav: zapnuto (jen SI).
