# Podlaží z výšky budovy: jedna sdílená funkce (Bára 27. 11. 2026)

`pilot/public/floors.js` `floorsFromHeight(h, { type, roofShape, pitched })`; bez podmínky na stát či město, přednost má vždy zjištěný počet
podlaží (OSM `building:levels`, úřední data). Pravidla:

- **plochá nebo neznámá střecha**: (h − 2,2) / 3,3 (od 25 m 3,05); pod 8 m hranice 1/2 podlaží na **6,0 m** (návrh 11);
- **známá šikmá střecha** (OSM `roof:shape` gabled, hipped, mansard…, nebo `pitched` od volajícího): odečte se 3,5 m střechy (návrh 12);
- **haly** (OSM `building` = train_station, transportation, warehouse, industrial, sports_hall, hangar, hall, factory…) od 6 m: žádná
  podlaží z výšky, `undefined` (návrh 13); nižší hala 1 podlaží.

## Kde se používá
- Toronto (výška obrysu DERIVED_HEIGHT), San Francisco (`hgt_median_m`), New York (`HEIGHT_ROOF`): města vracejí podlaží i výšku (`hm`),
  `app.js` je přepočte (`refloor`) podle druhu budovy a střechy z OSM, až je známá. **Zapnuto.**
- OSM `height` bez `building:levels` v `profile.js` (Evropa; dřív výška / 3,5): stejné pravidlo jen s `?floorsosm=1`. **Vypnuto.**
- Neprodloužené (každá země má vlastní výšku a vlastní přepočet, bez vlastního měření nechat): Slovensko ZBGIS (výška / 3,3), Francie (/ 3),
  Itálie (/ 3,2), Dánsko (okapová výška / 3), Estonsko ((h − 3) / 3), Plzeň (okap / 3,2), Nizozemsko, Kypr. Napojit se dá `heightHouse`/`refloor`
  po měření v dané zemi.
- Vypínač `?off=floorsh`: všude dřívější pravidlo (Toronto bez 6 m, bez střechy a hal).
- Střecha podle vzhledu domu (typicky štítový dům Toronta) **není napojená**: vzhled se volí podle počtu podlaží (kruh) a v torontských
  OSM budovách je `roof:shape` vzácný, takže sada návrh 12 vůbec neprověřila.

## Měření (slepé, Mapillary fotky, dva posuzovatelé Sonnet, neutrální pokyn, průměr, rozdíl ≤ 1)
Vzorek: 36 torontských a 36 OSM (CZ) budov, kde se pravidlo změní, a 10 + 8 nezměněných rubem; 90 fotek, 28 nešlo poznat, 1 rozpor, porovnáno 61.
`sample.mjs`, `sample-osm.mjs`, `prepare.mjs`, `score.mjs`, posudky v `results/`.

| sada | budov | blíž nově : dřív | stejně | p (znaménkový) |
|---|---|---|---|---|
| změněné, Toronto | 29 | **18 : 4** | 7 | 0,004 |
| změněné, OSM Evropa (CZ) | 19 | 11 : 8 | 0 | 0,65 |
| změněné, vše | 48 | 29 : 12 | 7 | 0,012 |

Toronto: výhra je hlavně patrový dům 6,0–7,15 m (1 → 2 podlaží) a haly (dřív 3 podlaží z průmyslové haly). Haly se v bodování
počítají s odhadem 2 podlaží, které aplikace bez čísla kreslí (odhad). Europa: výsledek neprůkazný, proto vypnuto.
Kontrola (nesmí se změnit): 13 nezměněných budov v posuzované sadě nemá jiný výsledek (z konstrukce funkce); pravidlo mění jen výšku
6,0–7,15 m bez šikmé střechy, haly od 6 m a známou šikmou střechu, ostatní výšky vrací shodně s dřívějším (`tests/floors.test.js`).
Regrese `evaluation/ortofoto-osm/regrese.mjs`: řádky shodné s `vysledky/regrese.txt`. `npm test`: 552 prošlo.

Neměřeno: San Francisco a New York (stejná funkce, zapnuto podle Toronta; pásmo 6–7,15 m se mění stejně).
