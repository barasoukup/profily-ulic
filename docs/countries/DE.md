# Německo (DE)

Stav nasazení: 17. 11. 2026, nenasazené. Přehled všech států: [docs/countries/README.md](README.md). Pravidla od Báry platí všude, jsou v `CLAUDE.md`.

## Stav a rozhodnutí (dříve CLAUDE.md)

### Německo (Bára 17. 11. 2026, přeneseno na přestavbu států, nenasazené)

- Stát `germany` (`country` DE): `countries/DE.js` (normy, značky, zákon o stání, ortofota zemí, domy, hledání),
  `towns/germany.js` (mapy povrchů měst), `signs-DE/`, `evaluation/germany/` (ZDROJE, NORMY, RECENZE, ab/). Hranice GISCO 1 : 1 M za Českem,
  Slovenskem a Rakouskem (`node tools/build_states.mjs germany` přestaví jen Německo).
- OSM: Německo po 16 zemích (výřezy Geofabriku, balíky `de_by`, `de_nw` … jen na R2, každý pod 512 MB), každá země svůj job
  v `osm-tiles.yml` (`tools/countries.mjs` parts); index má obdélník dlaždic každého balíku.
- Ortofoto všech 16 spolkových zemí (WMS v EPSG:3857 s CORS, `lanes-ortho.js DE_ORTHO`), země řezu podle `laender.json`
  (GISCO NUTS 1, `tools/build_laender.mjs`); u hranice se zkusí sousední země, prázdný snímek se nepoužije. Hamburg
  výslovně rok 2024 (2022 je satelit pod uzavřenou licencí). Tabulka a licence `evaluation/germany/SOURCES.md`.
- Bára: zatím bez vlastních ilustrací („obrázky jsou nejdražší“): rakouské označníky a přístřešky (kulaté H = Z 224),
  český mobiliář, neutrální tramvaj a autobus (`generic/`).
- Paneláky jen ve východních zemích a v Berlíně (bývalá NDR podle `laender.json`, `countries/DE.js atPlace`), na západě jako v Rakousku.
- Značky `signs-DE/` (StVO, Commons, úřední díla § 5 UrhG) i s dodatkovými tabulkami (Anlieger frei, Radfahrer frei, Radverkehr
  im Gegenverkehr); jednosměrka jen Z 267 proti směru (Z 220 je šipka podél ulice bez přímé podoby, vynechává se jako
  v Rakousku; Bára 17. 11. 2026); sdílenou zónu Německo nemá.
- Normy `limitsDE` (`evaluation/germany/NORMS.md`): RASt 06, ERA 2010, EAR 23 jen podle sekundárních zdrojů; šířky pruhů
  a buspruhů jen orientačně (zdroj nenalezen), tramvajový pás bez varování. Stání napůl na chodníku: StVO § 12 a judikatura
  3,05 m na projetí (pruhy vedle stání aspoň 2,5 m).
- Stání (Bára 17. 11. 2026): zákonný odhad i v AT a DE (místní ulice; `?odhadstani=0`), stání zakreslené v OSM se do
  úzké odhadnuté vozovky zúží (do 85 %). Měření: chybí stání DE 15 → 8, AT 14 → 11 (zbytek: podhodnocená vozovka).
- Hledání Photon (Německo podle mapy; německy vypadající dotaz, který RÚIAN nenajde, i z jiného místa).
- Mapy povrchů ulic Berlína, Hamburku a Cách zapojené (`towns/germany.js`, `?berlin=0` …; A/B v `evaluation/germany/ab/`).
