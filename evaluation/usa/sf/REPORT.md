# San Francisco: zapojení a čerstvé měření (26. 11. 2026)

Druhé metro státu `usa` vedle Washingtonu. Kód zmrazený před vzorkem: **e9911c1**; po sběru se aplikace neměnila (jen
měřicí skripty).

## Co je zapojené

- **Území:** City and County of San Francisco (TIGERweb, GEOID 06075, i s vodou zálivu a Farallony) v `states-america.json`
  `usa`; `tools/build_states.mjs` má tabulku `METROS = { dc, sf }` (každé metro sloučené zvlášť, washingtonský obrys bajt po
  bajtu stejný). Hranice města (TIGERweb Incorporated Places 0667000) v `towns-us.json` `sanfrancisco`. Okolní okresy
  (San Mateo, Marin, Alameda) mapu povrchů nemají, zůstávají `closed_us` s hláškou, která teď San Francisco jmenuje.
- **OSM:** balík `us_sf` (Geofabrik `north-america/us/california/norcal`, 660 MB, oříznutý na −122,54…−122,34, 37,68…37,84),
  lokálně 7,6 MB (`app/data/osm-pack/us_sf-novy.posm`). Na R2 ještě není.
- **Mapa povrchů** (`towns/sanfrancisco.js`, `?sf=0`): město nemá polygony vozovek čitelné z prohlížeče (služby
  `services.sfgov.org` zvenku neodpovídají), mapa se proto skládá podél řezu ze tří otevřených vrstev:
  uliční prostor (DataSF Right of Way Polygons `h8n7-e4ns`, 2014) je chodník, mezi dvěma krajními obrubami SFMTA (blockface
  curbs, `DataSF/master/MapServer/12`, aktivní) vozovka, dvojice obrub uvnitř ostrůvek; budovy (DataSF Building Footprints
  `ynuv-fyni`, model 2010) jen mimo uliční prostor. Obrysy budov leží asi 1,4 m východně od hranic pozemků (Folsom, Mission,
  Valencia), proto má uliční prostor přednost a mezera do 2 m mezi ním a domem patří domu. Uliční prostor s méně než
  dvěma obrubami mapu nedá (odhad). Licence DataSF: ODC PDDL (ověřeno v metadatech datových sad), CORS `*`; SFMTA ArcGIS vrací
  CORS pro tazatele.
- **Stání** z digitální obruby SFMTA (Curb Zones & All Policies, `MapServer/56`, `?sfcurb=0`): strana vozovky, jejíž zóny do
  15 m od řezu stání dovolují, dostane pruh stání 2,44 m (šikmé 4,88 m, když má nejdelší zóna aut aspoň 3 místa po méně než
  14 ft); strana se zónami bez stání žádné; se zónami na obou stranách je odhad podle zákona vypnutý.
- **Domy:** podlaží z mediánu výšky obrysu (`hgt_median_m`) pravidlem Toronta (`?sfhouse=0`).
- **Bez ortofota:** otevřené ortofoto San Franciska jsem nenašla (USGS NAIP má 0,6–1 m, na pruhy nestačí).
- **Normy** jen oranžově (`NORMS.md`): chodník podle SFMTA Sidewalk Widths, cyklopruh vedle stání a buspruh NACTO; zákon o
  stání 3 m na směr (California Fire Code 503.2.1, stejné jako IFC ve Washingtonu).
- **Ilustrace** Muni: autobus, trolejbus XT40, tramvaj LRV4 (kde má OSM koleje, i na Market Street) a označník; přístřešky a
  mobiliář severoamerické. Nezapojené: PCC linky F (tyčový sběrač, aplikace kreslí pantograf), lanovka a lampa Path of Gold
  (9,8 m, jen Market Street, není to lampa do 5 m jako glóbus Washingtonu).
- Hledání Photon v obdélníku San Franciska, je-li tam střed mapy. Texty ve 24 jazycích (strojově), CSP, kredity, patička,
  pokrytí.

## Vzorek a sběr

`sample.mjs fresh 60` (semínko 20261126): 60 náhodných bodů podle délky sítě ulic uvnitř hranice města (místní 57 %, tepny
19 %, sběrné 11 %, obslužné 10 %, dálnice 3 % délky), dál než 150 m od míst zkoušených při psaní mapy, s fotkou Mapillary
do 30 m (bez fotky vypadlo 7). Sběr `../collect.js` v jednom běhu: `def`, `sf0` (`?sf=0`), `curb0` (`?sfcurb=0`), zvlášť
`osm` (`?sf=0&orto=0&ai=0`; bez ortofota je totožný se `sf0`). Mapa se použila ve **44 z 60** řezů (chybí hlavně obslužné
cesty bez jména, Great Highway, 3rd Street s tramvají uprostřed).

Posuzovatelé (Sonnet, dva nezávislí na balík, slepě, X/Y náhodně) dostali **ortofoto Esri World Imagery** (jen k měření,
neukládá se do repozitáře, jako v Lombardii; `measure.sh`, export po kusech do 400 px a ne jemněji než 0,16 m) a fotky
Mapillary. Pokyn A/B je neutrální `../fresh/BRIEF-AB.md`, univerzální `../../universal/BRIEF.md`.
Vše: `evaluation/usa/sf/measure.sh packages`, `… score` → `results/score.md`; obruba `curb/results/score.md`.

## Výsledky

| měření | výsledek |
|---|---|
| **slepé A/B mapa : odhad** (44 změněných řezů) | **34 : 6**, nerozhodně 4 (podíl mapy 71–93 %, p < 0,001; oba posuzovatelé shodně 31 : 4) |
| místní ulice | 22 : 2 (p < 0,001) |
| tepny | 8 : 4 (p 0,39) |
| sběrné | 4 : 0 |
| **univerzální měření** (28 řezů) | **s mapou 71 %** (62–81), bez mapy 55 % (48–63) = jen OSM 55 %; lépe 16, hůř 2, stejně 10 (p 0,001) |
| **A/B obruby SFMTA** (`?sfcurb=0`, 39 změněných řezů) | **21 : 7**, nerozhodně 11 (p 0,013); univerzálně 71 % proti 64 % (p 0,065) |

**Rozhodnutí podle pravidla „co prohraje, zůstane vypnuté“:** mapa i obruba vyhrály, **zůstávají zapnuté**. Podlaží z výšek
obrysů jsem zvlášť neměřila (zapnuté jako v Torontu, rozhodne Bára).

## Slabiny

- **Šířka uličního prostoru:** s mapou medián o 2,5 m širší než u posuzovatelů, bez mapy 0,4 m (`widths.mjs`); do 1 m jen 7 %
  řezů (bez mapy 21 %). Uliční prostor z hranic pozemků (např. Folsom 25,2 m = předepsaných 82,5 ft) je spíš správně a
  posuzovatelé na Esri snímku, kde střechy domů přečnívají přes chodník, měří úžeji; ale nevím to jistě. **(Bára)** ověřit
  na pár řezech na místě nebo v Street View.
- **Tepny** jen 8 : 4. Prohry: Fell Street (s-13, jednosměrka, počet pruhů z OSM), O'Shaughnessy Boulevard (s-14, krajnice
  z odhadu pruhů), Indiana Street (s-21: obruba dala podélné stání 2,45 m, OSM i skutečnost mají šikmé), Geary Boulevard
  (s-47), 37th Avenue (s-29, park bez fasády), Lippard Avenue (s-36: úzká vozovka, po vykrojení stání v ní nezůstal pruh).
- Mapa chybí na obslužných cestách a tam, kde uliční prostor nemá dvě obruby přes řez (tramvajový pás 3rd Street, Great
  Highway).
- Data jsou stará: uliční prostor 2014, obrysy budov 2010; obruby SFMTA a digitální obruba průběžně.
