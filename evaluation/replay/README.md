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
   před ní nahrávač na http://localhost:5190. Mapové dlaždice se nenačítají (CSP), aby stovky řezů nezatěžovaly
   servery dlaždic.
2. Nahrání (jednou, živě): `http://localhost:5190/?replay=record&run=rec-cs&lang=cs&osm=balik`. Odpovědi jsou
   v `data/index.jsonl` a `data/bodies/` (data třetích stran, git je ignoruje).
3. Přehrání: `?replay=play&run=<jméno>&lang=cs` (a `sk`, `en`, `de`; přepínače aplikace jako `&wien=0` fungují).
   Dotaz, který nahrávka nemá, selže jako výpadek sítě a je v `misses` (změněný dotaz je změna).
4. Výchozí stav: přehrání kódu před změnou (`ROOT=<kopie commitu> node evaluation/replay/server.mjs 5192`),
   po změně totéž nad novým kódem a `node evaluation/replay/compare.mjs <výchozí> <nové>`.
5. Tabulky: `node evaluation/replay/tables.mjs <jméno>` (složené město × 4 jazyky, kredity, hlášky výpadků, značky
   států, normy států, vzhled domů, město a ilustrace bodu, `cleanCut`), porovnání `tables.mjs <A> <B>`.

Vzorek `sample.json` (`sample.mjs`): 369 řezů na Slovensku, v Rakousku, v Praze, v Brně a za hranicemi. České řezy
mimo Prahu a Brno (DMVS) až po odstávce DMVS (od 19. 11. 2026) jako `sample-cz.json`.

Známá nahodilost: ikona značky, která se v běhu načítá poprvé, občas do exportu SVG nestihne (řez 5, Bratislava,
rychlost 70). Rozdíl jen v `svg` jednoho řezu je proto potřeba ověřit opakovaným přehráním toho řezu (`&from=5&to=5`).
Dva body za hranicí (Mosonmagyaróvár, Komárom) ulici nenajdou a nechají předchozí řez, jejich `restored` se proto
s `credits` neshoduje; to není chyba aplikace.
