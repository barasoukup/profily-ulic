# Paříž: proužek „plocha“ u fasády, bloky Plan de voirie a budovy BD TOPO (26. 11. 2026)

Backlog „Paříž“: u fasády často pruh „plocha“ 0,65 m mezi domem z OSM a chodníkem Plan de voirie (`../ab/ZPRAVA.md`).
Zkusit budovy BD TOPO (IGN, Géoplateforme, Licence Ouverte 2.0) nebo `plan-de-voirie-emprises-ilots-prives` místo OSM.

## 1. Kde leží dům proti chodníku mapy (`gap.mjs`, `vysledky/gaps.json`)

86 stran pařížských řezů (vzorky `../ab` a `../../facade-strip`), kde je posledním dílem mapy chodník: vzdálenost od
vnějšího okraje chodníku k prvnímu domu na řezu.

| zdroj domů | ±0,2 m | 0,2–1,5 m | > 1,5 m | dům přes chodník | žádný do 40 m |
|---|---|---|---|---|---|
| OSM (dnes) | 38 | 15 | 9 | 11 | 13 |
| BD TOPO | 43 | 8 | 8 | 18 | 9 |
| bloky Plan de voirie | **71** | **0** | **0** | 7 | 8 |

BD TOPO není lepší než OSM (blíž k chodníku na 14 stranách, dál na 17, častěji přes chodník), proto se nezapojuje.
Soukromé bloky (`plan-de-voirie-emprises-ilots-prives`, ODbL, jediná třída „Complément espace de voirie“, 5 537 ploch)
jsou přesná hranice veřejného prostoru: s chodníkem mapy se potkávají do 0,2 m.

## 2. Proužek u fasády

Mezery 0,2–1,5 m (15 stran s OSM) už řeší sdílené pravidlo `ortho-osm.js facadeStrip` (`../../facade-strip/ZPRAVA.md`,
slepé A/B 12 : 1, zapnuté): Rue des Tournelles a Rue Alain Chartier mají chodník až k domu.

## 3. Bloky jako dům (`towns/france.js parisBlocks`, `?ilots=1`)

Bloky jako domy za domy z OSM a za plochami mapy (oblouky podloubí z OSM zůstávají, chodník mapy vyhrává, kde ho blok
překrývá). Slepé A/B na nových řezech (`sample.mjs`, semínko 20261128, 60 bodů do 4 km od středu, nic do 60 m od dřívějších):
O `?ilots=0`, N s bloky, obojí s pravidlem proužku. Mapa použita ve 44 řezech, liší se 13 (`vysledky/rezy-lisi.json`). Dva
posuzovatelé (subagenti, ortofoto bez čar, fotky Mapillary, X a Y náhodně; `vysledky/klic-ilots.json`,
`posudky-ilots-1|2.json`):

| | lépe N (bloky) | lépe O | stejně | nejde |
|---|---|---|---|---|
| posuzovatel 1 | 5 | 2 | 6 | 0 |
| posuzovatel 2 | 6 | 4 | 2 | 1 |
| shoda obou | **5** | **2** | 2 | – (neshoda 4) |

- N lépe: odhad už nekreslí 14–15 m „plochy“ přes střechy domů za chodníkem (il24, il34), konec u fasády (il48); dvakrát
  profil došel dál přes křižovatku (il42, il52), což s bloky souvisí jen nepřímo.
- O lépe: ustoupené přízemí a předprostor se zábradlím (il28, il25): blok končí u chodníku, dům je o 3–4 m dál.

## Závěr

Bloky zlepšují konec profilu u velkých domů, ale na 13 řezech je to 5 : 2 (jednotlivě 5 : 2 a 6 : 4) a stojí jeden dotaz
na řez navíc: **zůstávají vypnuté** (`?ilots=1` zapne). BD TOPO místo OSM ne. Proužek 0,65 m řeší pravidlo z bodu 2.
Kontroly: regrese odhadu a `dc-same` beze změny (bloky se týkají jen Paříže a jsou vypnuté), `npm test`.

Fotky, ortofota a balíčky (`data/`) jen lokálně.
