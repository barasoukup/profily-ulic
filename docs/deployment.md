# Nasazení a publikace

Nasazení na GitHub Pages, workflow, kontrola zdrojů a seznam balíků OSM, které je před nasazením nového státu nutné postavit ručně.

## Publikace na GitHub Pages

Aplikace umí běžet i bez serveru: v `public/config.js` je `STATIC = false` (data přes lokální server s cache)
a při nasazení se přepíše na `true`. Prohlížeč se pak ptá služeb IPR, měst, krajů a ČÚZK přímo (povolují CORS)
a dlaždice OSM a ostatní statická data čte jako soubory pod `data/`. Písmo Inter a Leaflet leží na webu
(`public/fonts/`, `public/leaflet/`), žádné Google Fonts ani unpkg. Bez serverové cache trvá každé načtení řezu
podle IPR 1–10 s.

Nasazení dělá `.github/workflows/pages.yml`: při každém pushi do `main`, ručně a každé pondělí. Nejdřív `npm test`,
pak vyrobí dlaždice OSM celé ČR z výřezu Geofabrik (týdenní kopie v cache Actions), hranice ZPS, dlaždice vývoje
zástavby, otevřená data Prahy, parkování v Brně a zóny v Plzni (při výpadku zdroje se použije soubor z minulého
nasazení), doplní klíč Mapy.com (`MAPY_KEY`, tajná proměnná) a `LOG_URL`, přidá přesměrování starých stránek měst
a vystaví vše na GitHub Pages. Dlaždice se do repozitáře neukládají. Jsou to data odvozená z OpenStreetMap, takže
na webu leží pod ODbL 1.0 (viz `data/README.txt` na webu a patičku aplikace).

### Kontrola zdrojů dat

Každé pondělí ráno (po nasazení) a ručně běží `.github/workflows/zdroje.yml`: `node tools/check_sources.mjs` udělá
v každém městě jeden řez v jeho ukázkovém bodě (`example` v `city.js`) stejnými moduly jako zveřejněná aplikace
(`STATIC = true`, dlaždice OSM a soubory `data/` z webu) a stáhne po jednom obrázku podkladových map. Vypíše
tabulku zdroj × stav: `ok`, `prázdné`, `náhrada ČÚZK` (služba města nic nevrátila, plochy jsou z technické mapy
ČÚZK), `tichá chyba` (dotaz selhal, ale zdroj pokračoval bez něj, takže by si toho návštěvník nevšiml),
`varování` (jen neúplný řetězec certifikátů serveru; prohlížeče si poradí) a `CHYBA`. Chyba, tichá chyba nebo
prázdné plochy či OSM běh shodí a GitHub pošle e-mail; tabulka je v souhrnu běhu. Je to asi sto malých dotazů
týdně, město po městě. Lokálně proti místnímu serveru: `SITE=http://localhost:5173/ node tools/check_sources.mjs`,
jen některá města: `node tools/check_sources.mjs praha brno podklad`. Mezilehlé certifikáty, které některé
servery neposílají (Frýdek-Místek), jsou v `tools/ca/`.
Plochy jsou povinné jen tam, kde je mapa povrchů (`SURFACE_MAPS` modulů, bod v ulici pro každou v `tools/check_sources_lib.mjs`
`POINTS`). Co selže, zkusí se po pauze znovu; jen pomalá služba (dvakrát vypršela) je varování, když povinné dotazy státu prošly.

## Verze modulů

Při stavbě webu (`pages.yml`, krok „Assemble the site“, naposled, až je `config.js` a CSP hotové) běží `node tools/version_modules.mjs _site`:
do `index.html` vloží import mapu, která každému modulu `*.js` a `*.mjs` (mimo `errors.js` a Leaflet) dá `?v=<10 znaků SHA-256 obsahu>`,
a vstupní `<script type="module" src>` dostane verzi sám (`src` import mapou neprochází). Statické `import` i `import()` tedy jdou
na adresy s verzí, návštěvník se starou stránkou dostane celou starou sadu (nebo 404 a hlášku z `errors.js`), nikdy směs. Zdroje se
nemění, lokální server také ne. Import mapa je inline skript, jeho hash je v `script-src` CSP (ne `unsafe-inline`). Hlídá
`tests/module-versions.test.js` (sestaví web do dočasné složky). Co verzi nemá: soubory čtené `fetch` (JSON, ilustrace, dlaždice) a `ort/*.wasm`.

## Kde to běží a co obnovuje push (dříve CLAUDE.md)

-  Dlaždice OSM ČR a Slovenska (Geofabrik) jsou zabalené do jednoho souboru na stát (`tools/pack_osm_tiles.mjs`,
  `app/public/osmpack.js`, čtení přes HTTP Range) na Cloudflare R2: kbelík `profily-ulic-osm` v Bářině účtu, doména
  `https://data.streetspace.eu/osm/` (DNS v Cloudflaru, Cache Rule), tytéž soubory na Pages (`data/osm-pack/`) jako
  záloha. Nahrává workflow přes S3 API (tajné `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, proměnná `R2_ACCOUNT_ID`).
  ČR 281 MB, SK 107 MB (Bára 15. 11. 2026, zpráva `evaluation/osm-r2/REPORT.md`). Lokálně server čte dlaždice
  `app/data/osm-tiles` jako dřív, `?osm=balik` balík z `app/data/osm-pack`, `?osm=r2` z R2.
- Naposledy nasazeno 10. 11. 2026: celá ČR (dlaždice OSM ČR, WFS krajů), nová města, značky, vrstvy, hledání,
  záznam řezů (zapisuje se, ověřeno). Nasazení Pages potřebuje delší timeout (245 000 souborů, `timeout` v pages.yml).

## Před nasazením: workflow OSM tiles ručně pro nové státy

Jeden seznam místo poznámek u každého státu (dřív rozeseté v `CLAUDE.md`). Push na `main` balíky OSM nepřestavuje; po nasazení nových států spustit workflow OSM tiles ručně se `states: …` a ověřit `data.streetspace.eu/osm/index.json`.

- CH + LI: **Před nasazením spustit workflow OSM tiles ručně se `states: ch,li`** a ověřit `data.streetspace.eu/osm/index.json` (push je nepostaví, recenze Fable).
- NL: **Před nasazením spustit workflow OSM tiles ručně se `states: nl`.**
- BE + LU: **Před nasazením spustit workflow OSM tiles ručně se `states: be,lu`.**
- PL: **Před nasazením workflow OSM tiles se `states: pl`.**
- FR: **Před nasazením workflow OSM tiles se `states: fr`.**
- ES: **Před nasazením workflow OSM tiles se `states: es`.**
- PT: **Před nasazením workflow OSM tiles se `states: pt`.**
- MC: **workflow OSM tiles se `states: mc`**
- CY: **workflow OSM tiles se `states: cy`**
- MT: **workflow OSM tiles se `states: mt`**
- IT: **workflow OSM tiles se `states: it`**
- EE: **workflow OSM tiles se `states: ee`**
- SI: **workflow OSM tiles se `states: si`**
- FI: **workflow OSM tiles se `states: fi`**
- DK: **workflow OSM tiles se `states: dk`**
- CA: Před nasazením workflow OSM tiles se `states: ca`
- US (Washington): **workflow OSM tiles se `states: us`**
- US (Washington): Před nasazením: R2 balík `us_dc`, nový Worker logu (Bára).
- US (New York): Před nasazením: workflow OSM tiles se `states: us` (postaví `us_dc` i `us_nyc`), licence NYCmaps a ortofota NYS (Bára).
- US (San Francisco): **workflow OSM tiles se `states: us`**
- US (Boston): Před nasazením workflow OSM tiles se `states: us` (nebo `us_bos`).
- US + CA: Severoamerické balíky po nasazení spustit ručně (`states: us,ca`).

- Balíky OSM pod 10 GB (27. 11. 2026): zmenšené při balení (`tools/osm_slim.mjs`), každý den sedmina států (`tools/countries.mjs` DAYS, `osm-index.yml`); push na main balíky nepřestavuje, změna skriptů dojde denními dávkami do týdne. viz seznam v `docs/deployment.md`
