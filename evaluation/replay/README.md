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

## Vzorky a pokrytí (27. 11. 2026)

| Vzorek | Řezů | Co kryje | Nahrávka |
|---|---:|---|---|
| `sample.json` (`sample.mjs`) | 369 | SK (13 měst, dálnice), AT (Vídeň, Graz, Linz, Salcburk, Innsbruck, Klagenfurt, menší města, dálnice), Praha, Brno, okraje za hranicemi | `sample:<id>` |
| `sample-cz.json` (`sample.mjs cz`) | 56 | české kraje mimo Prahu a Brno (DTM ČÚZK, WFS krajů), Vysoké Mýto, Jihlava, pasporty měst | `sample-cz:<id>` |
| `sample-states.json` (`sample.mjs states`) | 248 | DE, CH, LI, NL, BE, LU, PL, FR, MC (8), ES, PT, CY, MT, IT, EE, SI, FI, DK, LT, US, CA: 12 řezů na stát, kolo po městech | jména z nahrávek `ax-*:<id>` (pole `rec`) |

Dohromady 673 řezů ve 24 státech (CZ, SK, AT a 21 nových; k tomu 5 bodů na okrajích sousedních států). Vzorek států je z bodů, které už existovaly (univerzální měření
a A/B vzorky států v `evaluation/axisroad-check/ax-*.json`), a **nenahrával se znovu**: odpovědi jsou z nahrávky kontroly `?axisroad=1`
(3 566 řezů, 24 států; `import.mjs` ji přenesl). Řez si v harnessu nese jméno z té nahrávky (`rec`), jinak je `vzorek:id`.
`node evaluation/replay/sample.mjs states` vybere jen řezy, které nahrávka má.

**Nahrávka a kód se rozcházejí**, když se od nahrání změnily dotazy (jiný výřez ortofota, nový parametr): chybějící dotaz je v `misses`
a řez je horší. `compare.mjs` na začátku píše, kolik řezů má profil a kolik chybějících odpovědí. Doplnění: `?replay=fill` (nahrané
odpovědi se berou, jen chybějící se zeptají živě a zapíšou s příznakem `fill`, který v řezu přebije starší chybové odpovědi téhož dotazu).
Takhle se 27. 11. 2026 doplnilo 283 ze 369 řezů `sample` (praha, brno, SK, AT: změněná okna ortofota a RÚIAN) asi 2 000 odpověďmi
a 2 z 56 řezů `sample-cz` (Kuřim, JMK); `sample-states` a `ax-*` odpovědi měly všechny.

## Determinismus (27. 11. 2026)

Dvě přehrání téhož kódu nad stejnou nahrávkou mají **0 rozdílů** v `compare.mjs` na všech třech vzorcích (248 + 369 + 56 řezů,
každý dvakrát). Co se muselo opravit (jen v harnessu, aplikace beze změny):

- Ikona značky načtená poprvé se občas nestihla do exportu SVG (řez 5, Bratislava, rychlost 70): soubory aplikace se brali
  jako hotové po hlavičce odpovědi, tělo (SVG ikony) ještě šlo. Harness teď načte celé tělo, než požadavek přestane být „v běhu“.
- Nizozemský dotaz BGT nese `datetime=<teď>` (klíč nahrávky se s přehráním nepotkal): klíč dotazu má čas nahrazený `NOW`
  (`stamp` v `harness.js`, i při čtení starých nahrávek).
- Odpověď na dotaz, který řez nenahrál sám (např. index balíků OSM, nahraný jen v prvním řezu každé nahrávky), se bere nejdřív
  z téže nahrávky (jméno vzorku před dvojtečkou); ve společné složce je víc nahrávek a jejich indexy balíků se liší dobou (nový stát v balíku).
- `?replay=fill` zapisuje živé odpovědi s příznakem `fill` (viz výše), jinak by přehrání dostalo starou chybovou odpověď dřív než novou.

Zbývá nedeterministické jen to, co compare.mjs záměrně nesrovnává: kresby karty „Porovnat“ na stránce (rozložení podle měření textu v okně;
export kreseb `svg`, `svgNavrh` se srovnává) a číslování ořezových cest v SVG (přečísluje se podle prvního použití). Dva body za hranicí
(Mosonmagyaróvár, Komárom) ulici nenajdou a nechají předchozí řez, jejich `restored` se proto s `credits` neshoduje; to není chyba aplikace.
Řez 118 ve `sample-states` (Braga, PT) skončí „stav: chybí části profilu“ při opětovném načtení uloženého souboru (`restore`, `validate.js`):
opakovatelně, v aplikaci to tedy je (profil bez dílů), do přestavby se to nemění.

## Podkladové vrstvy podle států

`layers.md` (`node evaluation/replay/layers.mjs`, běh `layers.js`): pro bod každého státu se otevře každá podkladová vrstva z menu mapy
a spočítají se dlaždice (načteno, chyba, prázdné), kredit a porušení CSP. Živě, s pauzami (asi 4 dlaždice na vrstvu a stát,
jednou); `http://localhost:5190/?layers=1&lang=cs` (okno prohlížeče musí být vidět, jinak se časovače zpomalí), potom `node evaluation/replay/layers.mjs`.
