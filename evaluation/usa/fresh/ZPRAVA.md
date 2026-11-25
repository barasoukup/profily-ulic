# Washington: čerstvé měření mapy DC po recenzi (25. 11. 2026)

Kód zmrazený před vzorkem: 077bc2d (opravy recenze 926de8d a sloučená `estonia` 748845e). Po sběru se kód neměnil.

- **Vzorek** (`sample.mjs`, semínko 20261126): 60 náhodných bodů podle délky sítě ulic DC (místní 19, obslužné a uličky 19,
  tepny 9, sběrné 8, dálnice a rampy 5), nejméně 150 m od všech dřívějších bodů v `evaluation/usa*` i od míst zkoušených při
  opravách, s fotkou Mapillary do 30 m (bez ní vypadlo 16 obslužných a 1 místní).
- **Sběr:** mapa a `?dc=0` v jednom běhu na témže místě a téže cestě OSM, jen OSM zvlášť (`?dc=0&orto=0&ai=0`). Mapa se
  použila v 59 z 60 (f-53, obslužná cesta, se vynechává). Tři řezy nemají fotku po směru ulice, posuzoval je jen ortofoto.
- **Slepé A/B:** dva samostatní posuzovatelé Sonnet na každou dvojici, X/Y náhodně, zdroje skryté, ortofoto a fotky, pokyn
  `POKYN-AB.md` bez zmínky o pásech zeleně, stání či čemkoli, co má mapa.
- **Univerzální měření:** 30 z těchto řezů (podle typů), tři posuzovatelé po 10 podle `../../universal/POKYN.md`, bez profilů, jeden
  posudek na řez. Tento schválený pokyn (stejný všude) pásy zeleně a stání výslovně jmenuje; A/B ne.

Vše `node evaluation/usa/fresh/score.mjs`, `results/score.md`.

## Slepé A/B

| typ | řezů | mapa : odhad | nerozhodně | nejde posoudit | podíl mapy (95 %) | p | oba shodně |
|---|---|---|---|---|---|---|---|
| **všechny** | 59 | **41 : 10** | 8 | 0 | 68–89 % | < 0,001 | 35 : 7 |
| bez obslužných | 41 | 30 : 5 | 6 | 0 | 71–94 % | < 0,001 | 27 : 4 |
| místní | 19 | 15 : 2 | 2 | 0 | 66–97 % | 0,002 | 13 : 2 |
| obslužné, uličky | 18 | 11 : 5 | 2 | 0 | 44–86 % | 0,21 | 8 : 3 |
| tepny | 9 | 5 : 1 | 3 | 0 | 44–97 % | 0,22 | 5 : 1 |
| sběrné | 8 | 6 : 1 | 1 | 0 | 49–97 % | 0,13 | 6 : 0 |
| dálnice, rampy | 5 | 4 : 1 | 0 | 0 | 38–96 % | 0,38 | 3 : 1 |

Shoda posuzovatelů 44/59, kde oba vybrali stranu 42/48. Mimo místní ulice je každý typ sám o sobě málo řezů.

## Univerzální měření

| profil | řezů | shoda složení (95 %) | pruhy stejně | šířka do 1 / 2 m |
|---|---|---|---|---|
| s mapou DC | 29 | **76 %** (68–84) | 48 % | 48 / 59 % |
| bez mapy (`?dc=0`) | 29 | 61 % (52–72) | 52 % | 21 / 41 % |
| jen OSM | 29 | 53 % (45–63) | 55 % | 28 / 41 % |

Mapa proti `?dc=0` +15 bodů (95 % +5 až +24), po řezech lépe 16, hůř 5, stejně 8 (p = 0,03); proti samotnému OSM +23 (+10 až
+36). Počet pruhů mapa nezlepšuje. **Dálnice a rampy: mapa 44 proti 63 % (3 řezy)**. Vynechaný f-34 posuzovatel viděl jako pěšinu.

## Rozhodnutí

**Mapa zůstává zapnutá** (Bářino „co je horší, zůstane vypnuté“): vyhrála na čerstvých řezech v obou měřeních, i s intervalem.
Oficiální řádek US je odtud: 29 řezů, 76 %. Není srovnatelný s dřívějšími 66 % (jiné řezy, podíl uliček: ty mají jednoduchý
profil a 93 %); bez 7 obslužných vychází s mapou 71 a bez mapy 61 %.

## Kde mapa prohrává

- uličky mezi domy (f-11, f-13, f-23, f-36, f-38): zeleň z mezer mezi polygony, kde je zpevněný dvůr, nebo soukromé dvorky
  za uličkou (zeleň 17 m);
- f-43, f-50 a f-22: úzké chodníky nebo zeleň místo zpevněné plochy; f-33: rampa a dálnice za ní v jednom řezu.

## Evropská kontrola oprav (sdílený kód)

Opravy se dotkly `places.js`, `city.js`, `lanes-ortho.js`, `sources.js` a `app.js`. 60 náhodných evropských řezů (každý druhý z
`../ab/eu-sample.json`), starý kód 1ceb328 proti novému: **změněno 0 z 60**, posuzovat nebylo co. (Šest dánských se v prvním
kole lišilo výpadkem ortofota v jednom z ramen; s čerstvými snímky jsou shodné.)
