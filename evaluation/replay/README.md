# Záchranná síť přestavby (nahraná data)

Krok 0 plánu `docs/architecture-countries.md`: přestavba na státy, města a zdroje nesmí změnit, co návštěvník
uvidí. Proto se odpovědi zdrojů jednou nahrají a pak se přehrávají tak často, jak je potřeba, bez jediného dotazu.

Přehrává se v prohlížeči, ne v Node: celý řetěz od kliknutí (`app.js cutAt`: zdroje města, ortofoto, odhad
z ortofota a OSM, `deriveProfile`, `deriveSigns`, `keepDrawable`) přes kresbu (`buildSvg`, domy, ilustrace, značky),
kontrolu šířek (`checkRules`), karty dílů a paletu značek v Návrhu až po kredit a znovu načtený uložený soubor
(`validate.js`). Větve podle státu a města jsou z velké části v `app.js` a v kresbě, které v Node nejdou spustit.
Co jde v Node, hlídá `tables.mjs`.

## Postup

1. `node evaluation/replay/server.mjs` (nebo spuštění „replay-arch“ z `.claude/launch.json`): aplikace na portu 5290,
   před ní nahrávač na http://localhost:5190 (jiný port: `node evaluation/replay/server.mjs 5390`, aplikace o 100 výš).
   Mapové dlaždice se nenačítají (CSP), aby stovky řezů nezatěžovaly servery dlaždic.
2. Nahrání (jednou, živě): `http://localhost:5190/?replay=record&run=rec-cs&lang=cs&osm=balik`. Odpovědi jsou
   v `data/replay/index.jsonl` a `data/replay/bodies/` **hlavního repa** (`/Users/barasoukupova/streetdesign/data/replay/`,
   `paths.mjs`; data třetích stran, git je ignoruje; `REPLAY_DATA=<složka>` jinam), výstupy běhů v `data/replay/out/<běh>/`.
   Jedna složka pro všechny pracovní kopie, žádný symlink. Nahrávky jiných pracovních kopií se do ní přenesou
   `node evaluation/replay/import.mjs <…/evaluation/replay/data>` (těla jednou podle hashe, řez z prvního zdroje, který ho má;
   nic se v cizích složkách nemění). Nahrávky se pozná podle jména řezu `vzorek:id` (`sample:5`, `ax-west:185`, `holdout:7`).
3. Přehrání: `?replay=play&run=<jméno>&lang=cs&osm=balik` (bez `osm=balik` se ptá na jiné dlaždice, než jaké jsou nahrané, a
   každý řez skončí „Tady jsem žádnou ulici nenašla“; `compare.mjs` proto píše, kolik řezů má profil) (a `sk`, `en`, `de`; přepínače aplikace jako `&wien=0` fungují).
   Dotaz, který nahrávka nemá, selže jako výpadek sítě a je v `misses` (změněný dotaz je změna).
4. Výchozí stav: přehrání kódu před změnou (`ROOT=<kopie commitu> node evaluation/replay/server.mjs 5192`),
   po změně totéž nad novým kódem a `node evaluation/replay/compare.mjs <výchozí> <nové>`.
5. Tabulky: `node evaluation/replay/tables.mjs <jméno>` (složené město × 4 jazyky, kredity, hlášky výpadků, značky
   států, normy států, vzhled domů, město a ilustrace bodu, `cleanCut`), porovnání `tables.mjs <A> <B>`.

Vzorek `sample.json` (`sample.mjs`): 369 řezů na Slovensku, v Rakousku, v Praze, v Brně a za hranicemi. České řezy
mimo Prahu a Brno (DTM ČÚZK po přechodu na JVF DTM 1.5) jsou ve `sample-cz.json` (`node evaluation/replay/sample.mjs cz`,
26. 11. 2026): 56 řezů, obrázky DMVS i WFS osmi krajů, Středočeský kraj jen z čar, Komenského ve Vysokém Mýtě,
Jihlava a pasporty měst (i vyřazených, teď DTM). Nahrávka `?replay=record&run=rec-cz&sample=sample-cz&lang=cs&osm=balik`
(asi 3 minuty), přehrání `&replay=play` stejně 56 z 56.

Známá nahodilost: ikona značky, která se v běhu načítá poprvé, občas do exportu SVG nestihne (řez 5, Bratislava,
rychlost 70). Rozdíl jen v `svg` jednoho řezu je proto potřeba ověřit opakovaným přehráním toho řezu (`&from=5&to=5`).
Dva body za hranicí (Mosonmagyaróvár, Komárom) ulici nenajdou a nechají předchozí řez, jejich `restored` se proto
s `credits` neshoduje; to není chyba aplikace.
