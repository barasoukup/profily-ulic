# Boston: mezery za vnějším chodníkem jen z OSM (26. 11. 2026)

Pokračování `../outer/REPORT.md` (18 : 16; kde profil skončil u parkoviště nebo domu z OSM 13 : 8, kde ortofoto měnilo
jen šířku zeleně 2 : 5). **Výsledek: zlepšení se neprokázalo (s opravou 24 : bez 22, p 0,88), oprava
zůstává vypnutá, zapne ji `?outerosm=1`.**

## Oprava (sdílená, `?outerosm=1`)

- `towns/planimetrics.js outerGaps(runs, spans, { image: false })`: mezery mapy za vozovkou doplní jen dům z OSM (601), za
  prvním chodníkem i parkoviště, náměstí a pěší plocha z OSM (1003, od 8 m 704); zbytek zůstane zelení mapy a **ortofoto
  ho neposuzuje** (žádný příznak `OUTER_GAP`). Volá ji `towns/boston.js prepare` (Boston a Cambridge), jen s vypínačem.
- `?outergaps=1` (s ortofotem) zůstává, jak byl.

## A/B na nových řezech

- `sample.mjs 280` (semínko 20261204): 280 nových náhodných tepen Bostonu a Cambridge podle délky sítě, s fotkou Mapillary
  do 30 m, dál než 150 m od řezů čerstvého měření (`../fresh.json`), prvního A/B mezer (`../outer/sample.json`) i od sebe
  (47 v Cambridge). Žádný z nich se při vývoji nepoužil.
- Sběr `../../collect.js` (varianty `def` bez opravy a `ogosm` s ní), řádky `results/rows.json`. Oprava změnila **102 řezů**
  (o 0,2 m a víc). Slepé A/B dvěma posuzovateli (Sonnet, každý balík dva samostatní agenti, zadání jen „přečti ZADANI.md a
  postupuj podle něj“, pokyn `../../fresh/BRIEF-AB.md` beze změny, ortofoto MassGIS 2025, X/Y náhodně), klíč
  `results/key.json`, verdikty `results/p*-a|b.jsonl`, `measure.sh packages | score` → `results/score.md`.

| | dvojic | s opravou : bez | nerozhodně | p |
|---|---|---|---|---|
| tepny | 102 | **24 : 22** | 56 | 0,88 |

Shoda posuzovatelů 72/102; kde oba vybrali stranu 23/30. Hlasy 43 : 40, stejně 121.

Podle druhu změny (`split.mjs`, šířka profilu s opravou proti bez):

| změna | řezů | s opravou : bez | nerozhodně |
|---|---|---|---|
| profil kratší o víc než 2 m (konec u parkoviště nebo domu z OSM) | 12 | 4 : 3 | 5 |
| profil delší o víc než 2 m (dům z OSM v mezeře, zeleň před ním se počítá) | 21 | 5 : 10 | 6 |
| konec posunutý do 2 m (hrana domu z OSM jinde než mezera mapy) | 69 | 15 : 9 | 45 |

Konec u parkoviště, který v prvním A/B vyšel 13 : 8, je na novém vzorku vzácný (12 řezů) a nerozhodný (4 : 3). Většina změn
jsou posuny konce o desetiny metru; prodloužení přes dům z OSM spíš škodí (5 : 10). Posuzovatelé si stěžovali, že se
profily liší jen zelení za okrajem ulice, většina verdiktů má nízkou jistotu.

## Kontroly

- Bez vypínače beze změny: oprava se volá jen s `?outerosm=1`; Washington `evaluation/canada/dc-same.mjs` 100 řezů a
  New York `evaluation/usa/nyc/same.mjs` 50 řezů bajt po bajtu stejné jako kód před změnou; profily 60 řezů čerstvého
  měření Bostonu, 60 San Francisca a 50 New Yorku (sběr v aplikaci) viz `../../nyc/park/REPORT.md` (Kontroly).
- `node evaluation/ortho-osm/regression.mjs` beze změny, `npm test` prošel (test v `tests/boston.test.js`).

## Co zůstává

- **(Bára)** Oprava vypnutá. Mezery za chodníkem z OSM nepřinášejí průkazné zlepšení ani bez ortofota; kdyby se mělo
  pokračovat, tak jen konec u parkoviště bez domů (domy profil spíš prodlužují), ale to je na tomto vzorku 12 řezů 4 : 3.
- Parkoviště Bostonu v mapě chybějí (BTD MunicipalParkingLots jsou jen městská).
