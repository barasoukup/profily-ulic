# A/B: cyklostezky podél silnice z OSM (24. 11. 2026)

Nepřátelská recenze Dánska 24. 11. 2026, bod 2: `cycleway[:left|:right|:both]=track` na silnici se do profilu nedostala
(0 dílů `cyklostezka` v 76 kodaňských řezech, přitom tak je označených 24 % ulic Kodaně). Nově `derive.js trackAlongRoad`
(volané z `app.js` jen u odhadu, ne nad vlastní mapou povrchů): na straně s `track` hned za vnějším pruhem nebo stáním
cyklostezka šířky z OSM (`cycleway:<strana>:width`), jinak `country.trackWidth`, jinak 2 m, vykrojená z odhadnutých dílů
(krajnice, chodník, plocha, neurčeno, zeleň; nikdy z `dtm`/`pasport`); kde za ní žádný jiný chodník není, chodníku zůstane
1 m. Směr podle strany provozu, `opposite_track` a `cycleway:<strana>:oneway=-1` proti, `oneway=no` bez směru.
Přepínač `?off=stezkapodel` (A).

## Regrese Prahy a Brna
`node evaluation/ortofoto-osm/regrese.mjs` beze změny proti `vysledky/regrese.txt`. Krok běží v `app.js` až po
`deriveProfile`, proto jsem regresi pustila i s ním (kopie skriptu s `trackAlongRoad` po `deriveProfile`): **výsledek
totožný** (neutrální), `regrese.txt` se nemění.

## Kodaň
Vzorek `sample.json` (72 bodů do 3 km od Rådhuspladsen), aplikace na localhostu (`?osm=balik`), každý bod A (`off=stezkapodel`)
a B (výchozí) po sobě; řezy `vysledky/rezy-stezky.json`. Profil se liší v 7 řezech, z toho 6 kvůli stezce (ko8 je drobný
rozdíl jiného původu). Posouzení podle fotek z ulice (Mapillary, nejnovější snímek podél ulice do 25 m):

| řez | ulice | A → B | fotka | posudek |
|---|---|---|---|---|
| ko3 | Børsgade | chodník 2,25 → chodník 1 + stezka 1,25 | 2024: stezka u obruby za vozovkou | lépe B |
| ko7 | Nordre Fasanvej | chodník 2,5 → chodník 1 + stezka 1,5 | 2020: stezka mezi vozovkou a chodníkem | lépe B |
| ko54 | Øster Allé | zeleň 2,95 → zeleň 0,95 + stezka 2 | snímek z parku, ulice nevidět | nejasné |
| ko28 | Webersgade | chodník 3,7 → stezka 2 + chodník 1,7 | žádná | – |
| ko32 | Tagensvej | krajnice 1,83 → stezka 1,83 | žádná | – |
| ko70 | Forlandet | plocha / zeleň po stranách → stezky 1,98 a 2,02 | žádná | – |

**Lépe 2, hůř 0, nejasné 1, bez fotky 3.** Zapnuto. Šířky stezky u ko3 a ko7 jsou menší než skutečné (odhad celé šířky za
obrubou z ortofota je úzký), složení ale sedí. Posuzoval agent, který změnu udělal (neslepé), vzorek je malý. Po sběru dostalo Dánsko výchozí šířku 2,25 m (`countries/DK.js trackWidth`, běžná jednosměrná stezka podle příručky Tværprofiler i byer, 2019); u ko3 a ko7 to nic nemění (omezuje je šířka za obrubou), ko28 a ko54 by měly stezku o 0,25 m širší.
