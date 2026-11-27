# Boston: mezery za vnějším chodníkem podle OSM a ortofota (26. 11. 2026)

Oprava z backlogu (tepny prohrály v čerstvém měření 8 : 15, `../REPORT.md`). **Výsledek: zlepšení se neprokázalo
(18 : 16), oprava zůstává vypnutá, zapne ji `?outergaps=1`.**

## Příčina na prohraných řezech

Prohrané tepny čerstvého měření (`../results/score.md`, důvody posuzovatelů v `../results/p*-?.jsonl`):

- **b-9, b-28, b-33, b-12, b-48, b-34:** za vnějším chodníkem je mezera mezi polygony mapy (Street Edges nemá parkoviště,
  budovy podkladové mapy chybějí), `planimetrics.js runsAlong` z ní dělá zeleň 401; profil skončí až u vzdálené budovy mapy
  (zeleň 22 m přes parkoviště nebo dům). Na b-33 mapa nemá ani chodník: mezera začíná hned za stáním.
- **b-14:** mezera 21 m mezi dvěma vozovkami je podle `gapsBetweenRoads` dělicí pás (do 30 m); v řezu je ale parkoviště.
  Neřešeno (pravidlo Toronta, sdílené).
- Ortofoto MassGIS 2025 je z jara bez listí: podíl zelené (`GREEN_AREA` odhadu) je u trávníků i parkovišť skoro nula
  (vývojové řezy: parkoviště b-9 0,001, trávník b-39 0,005), zeleň se na něm nedá poznat podle zelené.

## Oprava (sdílená, `?outergaps=1`)

- `towns/planimetrics.js outerGaps(runs, osmAreasAlong(...))`, volá ji `prepare` města (jen Boston a Cambridge): v mezeře
  mimo vozovku dům z OSM (601), za prvním chodníkem od vozovky i parkoviště, náměstí a pěší plocha z OSM (1003, od 8 m 704,
  aby profil skončil jako u širokého trávníku). Co zbude za chodníkem, dostane příznak `OUTER_GAP`.
- `ortho-osm.js outerGapsByImage`: zbylá mezera aspoň 6 m, kterou ortofoto pokrývá aspoň 3 m, je zpevněná, když není zelená
  ani nažloutlá a sytá jako trávník mimo vegetaci (medián žlutosti pod 6 a sytosti pod 12; prahy z vývojových řezů starého
  vzorku, ne z A/B); od 8 m jako 704, užší jako 1003. Ostatní mapy (Washington, Toronto, New York, San Francisco) ji nevolají.

Vývoj na starém vzorku (60 řezů čerstvého měření, jen ke ladění): mění se 21 řezů; b-9 a b-28 končí za chodníkem místo
22 m zeleně, b-33 má 4,5 m místo 22,7 m, b-12, b-14 a b-48 beze změny.

## A/B na nových řezech

`sample.mjs 160` (semínko 20261127): 160 nových náhodných tepen Bostonu a Cambridge (podle délky sítě, dál než 150 m od řezů
čerstvého měření i od sebe, s fotkou Mapillary do 30 m; 22 v Cambridge). Sběr `../../collect.js` (`def` s opravou, `og0`
bez ní; tehdy byla oprava výchozí), `bos-outer.json`. Oprava změnila 52 řezů o 0,2 m a víc. Slepé A/B dvěma posuzovateli
(Sonnet, `../../fresh/BRIEF-AB.md`, ortofoto MassGIS), `measure.sh packages | score`, `results/score.md`:

| | dvojic | s opravou : bez | nerozhodně | p |
|---|---|---|---|---|
| tepny | 52 | **18 : 16** | 18 | 0,86 |

Shoda posuzovatelů 33/52, kde oba vybrali stranu 19/23. Podle druhu změny: kde profil skončil dřív (parkoviště, dům z OSM)
13 : 8, kde se změnila jen šířka okrajové zeleně 2 : 5, delší profil 2 : 2. Posuzovatelé rozhodovali skoro jen podle zeleně
za okrajem ulice, často „stejně“; dům z OSM ve velké mezeře někdy profil prodloužil (zeleň před domem se počítá, dřív ji
odvození jako širokou zeleň odřízlo).

## Kontroly

- Ostatní mapy oprava nevolá; Washington `evaluation/canada/dc-same.mjs` 100 řezů bajt po bajtu stejných.
- Výchozí stav (oprava vypnutá): 60 řezů čerstvého měření stejných jako v měření (`bos-final.json`).
- `node evaluation/ortho-osm/regression.mjs` beze změny, `npm test` prošel (test v `tests/boston.test.js`).

## Co zůstává

- **(Bára)** Oprava vypnutá (neprokázaná). Slibnější část je konec profilu u parkoviště (13 : 8); zkusit jen ji (bez domů
  z OSM a bez změn šířky zeleně) na dalším novém vzorku, ne na tomto.
- Mezera mezi vozovkami jako dělicí pás 21 m (b-14) nevyřešená.
- Parkoviště Bostonu chybějí v mapě (BTD MunicipalParkingLots jsou jen městská), Cambridge Parking Lots už v mapě jsou.
