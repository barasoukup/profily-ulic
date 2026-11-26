# Boston: zapojení a čerstvé měření mapy povrchů (26. 11. 2026)

Druhé metro státu `usa` (větev `na-boston` z `10882aa`). Kód zmrazený před vzorkem: **0d16ad8** (273e8d5 kód, 0d16ad8
překlady). Po sběru se kód zkusmo změnil jednou (konce řezu, viz níže) a změna se vrátila; měřený kód je 0d16ad8.

## Co je zapojené

- **Území:** okresy Suffolk, Middlesex a Norfolk (TIGERweb), `staty-america.json` `usa` (druhý kruh vedle metra DC),
  `tools/build_staty.mjs METROS`. Města `mesta-us.json`: `boston` (město, TIGERweb Incorporated Places), `cambridge`
  (jen území mapy) a `bostonmetro` (celé metro, kruh ze `staty-america.json`). Zbytek USA `closed_us` s hláškou, která
  teď jmenuje obě metra.
- **OSM:** balík `us_bos` (Geofabrik Massachusetts oříznutý na `-71.92,41.97,-70.62,42.76`), lokálně 75 MB.
- **Mapy povrchů** (`towns/boston.js`, společný adaptér `planimetrics.js`): Boston (Street Edges, Sidewalk Inventory,
  budovy podkladové mapy; PDDL) a Cambridge (Roads, Sidewalks, Driveways, Parking Lots, Buildings; PDDL). Vozovky jsou
  v obou službách polygony přes celé město (jeden dotaz na řez = 5 MB), proto **statické dlaždice** postavené jednou týdně
  při nasazení (`tools/build_planimetrics_us.mjs`, `pages.yml`, 0,005°, polygony oříznuté na dlaždici): Boston 711 dlaždic
  35 MB, Cambridge 120 a 9 MB, asi 120 dotazů na servery měst při stavbě, při kliknutí žádný. CORS obou služeb je
  otevřený, takže jde i dotaz při kliknutí, ale ne ohleduplně. Vypínače `?boston=0`, `?cambridge=0`.
- **Domy:** počet podlaží budov Bostonu (`part_floors`, `?bostonhouse=0`). Neměřeno zvlášť.
- **Ortofoto** MassGIS 2025 (15 cm, dlaždice z20, „No restrictions apply“) nad celým metrem: pruhy, obruby, podklad.
- **Normy** Boston Complete Streets Guidelines 2013 (s. 23 a 103) jen oranžově, `NORMY.md`.
- **Ilustrace:** v metru autobus a tramvaj MBTA (tramvaj jen na kolejích z OSM), označník; ve městě Bostonu navíc lampa
  acorn do 5 m. Washington beze změny (Metrobus a glóbus).

## Kontroly

- `node evaluation/ortofoto-osm/regrese.mjs`: beze změny proti `vysledky/regrese.txt`.
- Washington: 100 řezů (`evaluation/canada/dc-same.mjs`, A/B 40 + čerstvých 60) přes zdroje státu před (10882aa) a po:
  **bajt po bajtu stejné**.
- `npm test` prošel (nový `tests/boston.test.js`).

## Čerstvé měření

`sample.mjs`: 60 náhodných řezů podle délky sítě ulic Bostonu a Cambridge (semínko 20261226), dál než 150 m od míst
zkoušených při zapojování, s fotkou Mapillary do 30 m. Bez fotky vypadlo 21 místních a 12 obslužných, takže vzorek
nadreprezentuje tepny (26 z 60, v síti 27 %) a podreprezentuje místní ulice (22 z 60, v síti 53 %). Mapa se použila v 53 z
60 řezů (7 řezů beze změny: mapa ulici pod středem neměla). Sběr `../collect.js` (varianty `def`, `bos0`, zvlášť jen OSM),
balíčky a skóre kódem Washingtonu (`measure.sh packages | score`), ortofoto pro posuzovatele z dlaždic MassGIS.

**Slepé A/B** (dva posuzovatelé Sonnet na dvojici, X/Y náhodně, pokyn `../fresh/POKYN-AB.md`), `results/score.md`:

| typ | dvojic | mapa : odhad | nerozhodně | p |
|---|---|---|---|---|
| **všechny** | 53 | **27 : 21** | 5 | 0,47 |
| místní | 20 | **13 : 4** | 3 | 0,049 |
| tepny | 24 | **8 : 15** | 1 | 0,21 |
| sběrné | 4 | 2 : 2 | 0 | |
| dálnice | 4 | 3 : 0 | 1 | |
| obslužné | 1 | 1 : 0 | 0 | |

Shoda posuzovatelů 37/53, kde oba vybrali stranu 35/38.

**Univerzální měření** (30 řezů, tři posuzovatelé po 10 podle `../../universal/POKYN.md`, bez profilů; 28 použitelných):

| profil | shoda složení (95 %) | pruhy stejně | šířka do 1 / 2 m |
|---|---|---|---|
| s mapou | **69 %** (61–76) | 61 % | 25 / 36 % |
| bez mapy (ortofoto MassGIS a OSM) | 68 % (59–76) | 57 % | 18 / 39 % |
| jen OSM | 72 % (64–80) | 54 % | 29 / 39 % |

Mapa proti bez mapy +1 bod (−7 až +10), lépe 9, hůř 7, stejně 12. Ve všech třech nejčastěji chybí stání (10–12×).

## Co z toho plyne

- **Mapa ve vzorku jako celek nevyhrála ani neprohrála** (27 : 21, univerzálně +1 bod). Na **místních ulicích vyhrává**
  (13 : 4: chodníky, šířka vozovky, kruhové ostrůvky, stání po obou stranách), na **tepnách prohrává** (8 : 15).
- Proč na tepnách: mezera mezi polygony za chodníkem je zeleň, i kde je parkoviště, náměstí nebo dům („22 m zeleně“, b-9,
  b-28, b-33); široká mezera mezi vozovkami se stane dělicím pásem 21 m (b-14); Street Edges nemá parkoviště a některé
  budovy. Pokus zkrátit zeleň na koncích řezu (nechat 4 m, jinak konec u domu z OSM) změnil 13 řezů opačně, než měl
  (široké zelené plochy na konci řezu dosud odřezávalo odvození samo, problém je mezera *uvnitř* řezu), proto vrácen.
- Mapa zůstává **zapnutá** (neprohrála; je to jediný zdroj chodníků a šířky vozovky měst, místní ulice tvoří polovinu sítě),
  ale **rozhodne Bára** (viz níže). Alternativa: mapu jen pro místní a obslužné ulice; to by bylo rozhodnutí podle téhož
  vzorku a potřebovalo by nový vzorek.

## Pro Báru

1. **(Bára)** Mapa Bostonu a Cambridge zapnutá, i když celkově neprůkazná (27 : 21, p 0,47; místní 13 : 4, tepny 8 : 15)?
   Možnosti: nechat, vypnout (`boston`/`cambridge` jako `?…=0` výchozí), nebo jen místní ulice (nové měření).
2. **(Bára)** Licence Street Edges: PDDL je z položky ArcGIS celé podkladové mapy Bostonu („Basemap“), ne ze samotné vrstvy.
3. **(Bára)** Stání podle zákona: pravidlo Massachusetts o volném pruhu jsme nenašli, platí 3 m na směr jako v DC.
4. Před nasazením: workflow OSM tiles se `states: us` (postaví `us_dc` i `us_bos`) nebo jen `us_bos`, ověřit `index.json` na R2;
   první nasazení Pages postaví dlaždice map (`data/us-plan`, asi 45 MB).

Příkazy pro přegenerování souborů (při slučování s New Yorkem a San Franciskem):

    node tools/build_staty.mjs usa && node tools/build_towns_us.mjs && node tools/build_coverage.mjs
