# Záchranná síť přestavby (nahraná data)

Krok 0 plánu `docs/architecture-countries.md`: přestavba na státy, města a zdroje nesmí změnit, co návštěvník
uvidí. Proto se odpovědi zdrojů jednou nahrají a pak se přehrávají tak často, jak je potřeba, bez jediného dotazu.

**Od 28. 11. 2026 (krok 13b) jde řez přehrát i v Node** (oddíl Přehrávka v Node níže): profil, řez, kredity, město
a stavový řádek, bajt po bajtu jako v prohlížeči. A/B a kontroly se dělají tam; prohlížeč zůstává na kresbu a na to,
co Node neporovnává.

Přehrává se v prohlížeči: celý řetěz od kliknutí (`app/cut.js cutAt`: zdroje města, ortofoto, odhad
z ortofota a OSM, `deriveProfile`, `deriveSigns`, `keepDrawable`) přes kresbu (`buildSvg`, domy, ilustrace, značky),
kontrolu šířek (`checkRules`), karty dílů a paletu značek v Návrhu až po kredit a znovu načtený uložený soubor
(`validate.js`). Větve podle státu a města jsou z velké části v `app/` (dřív `app.js`) a v kresbě, které v Node nejdou spustit.
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

## Přehrávka v Node (krok 13b, 28. 11. 2026)

Jádro řezu `app/public/app/cut-core.js` (`computeCut(input, deps)`) nemá stránku ani mapu: prohlížeč ho volá z `app/cut.js
cutAt` a pak kreslí, loguje, ukládá a vykresluje; Node ho volá z `node-player.mjs` nad nahrávkou.

```
node evaluation/replay/node.mjs sample cc-a --jobs=8                       # 369 řezů, asi 80 s
node evaluation/replay/node.mjs sample cc-b --jobs=8 --switches='off=mapfill'
node evaluation/replay/compare.mjs cc-a cc-b                                # A/B: co se změnilo
node evaluation/replay/compare.mjs <běh v prohlížeči> cc-a                   # kontrola proti prohlížeči
```

- `--jobs=N` rozdělí vzorek mezi N procesů (každý nejdřív udělá řez před svým úsekem, kvůli `AGAIN_M`; výsledek je stejný
  jako v jednom procesu), `--from/--to`, `--lang`, `--switches` (adresa jako v prohlížeči, čte ji `flags.js`).
- **Co Node porovnává** (`_done.json` `fields`, `compare.mjs` bere jen ta pole): `status`, `statusClass`, `title`, `city`,
  `cut`, `stav`, `credits`, `misses`, `errors`, `failed`. **Co ne**: `svg`, `svgOtherArt`, `svgNavrh` (kresba a export),
  `shares`, `widthCheck`, `legend`, `cutInfo`, `ruleCheck`, `palette`, `editors`, `compare`, `restored`, `sub`,
  `stavText`, `footer` (stránka). Ty dál jen přehrávka v prohlížeči.
- **Math stránky** (`cr-math.mjs`): Chrome 156 (prohlížeč aplikace Claude, V8 15) počítá `sin`, `cos`, `tan`, `atan`,
  `atan2`, `asin`, `exp`, `log` správně zaokrouhleně (3 000 hodnot proti mpmath: všechny), Node 26 (V8 14.6, fdlibm) ne
  (3–20 % hodnot o bit vedle). Poslední bit posune výřez ortofota v adrese dotazu (chybějící odpověď) nebo pixel. Node proto
  dostane funkce počítané v double-double a zaokrouhlené jednou (270 000 hodnot stránky: všechny stejné), `sinh` vzorcem
  fdlibm nad správným `expm1` (jako stránka). Jiný prohlížeč (Firefox, Safari, starší Chrome) má jinou Math: běh
  v prohlížeči pro srovnání pouštět v Chrome 156 a novějším.
- **Plátno** (`node-browser.mjs`, `canvas-log.js`): Chrome kreslí `OffscreenCanvas` na GPU. Dekódování obrázků je stejné
  (`@napi-rs/canvas`, Skia), ale zmenšený obrázek vzorkuje GPU s vlastním zaokrouhlením (asi 3 % hodnot o 1 vedle)
  a čáry nápověd modelu (`ai-kerbs.js hints`) mají jiné okraje. Proto `?replay=canvas` v prohlížeči (jako `play`, navíc
  nahraje, co vrátilo každé `getImageData` aplikace, pod klíčem toho, co se na plátno kreslilo) a Node je vrátí. Čtení,
  které nahrávka nemá (změněný řez v A/B), Node nakreslí sám (mipmapa a bilineární vzorkování jako Chrome, okraje podle
  pokrytí); takový řez má v souboru `canvasDrawn` (nesrovnává se). Bez nahraných pláten (`--canvas=draw`) vyjde jinak
  96 z 369 řezů `sample`, 32 z 248 `sample-states`, 3 z 56 `sample-cz` (hlavně šířky dílů u řezů s modelem obrub).
- **ONNX**: model obrub běží ve stejné `onnxruntime-web` wasm (`app/public/ort/`) jako v prohlížeči, jedno vlákno.
- Nahrání pláten (jednou po změně vzorku nebo nahrávky): `http://localhost:5190/?replay=canvas&run=<jméno>&sample=<vzorek>&lang=cs&osm=balik`;
  28. 11. 2026 nahrána pro `sample`, `sample-cz` a `sample-states` (asi 6 400 čtení, gzip v `bodies/`).
- Test `tests/cut-core.test.js`: dva nahrané řezy (`tests/fixtures/cut-core`, `node evaluation/replay/fixture.mjs sample-cz 17,43
  tests/fixtures/cut-core`, plátna kreslí Node) dají uložený výsledek; ten se shoduje i s prohlížečem.

Shoda 28. 11. 2026 (kód `cut-core`, běhy v prohlížeči `cc-new-s`, `cc-new-cz`, `cc-canvas-st`, v Node `cc-fin-*`):

| Vzorek | Řezů | Node : prohlížeč | Node 1 proces | Node 8 procesů | Prohlížeč |
|---|---:|---|---:|---:|---:|
| `sample` | 369 | 0 rozdílů | 362 s | 81 s | 372–638 s |
| `sample-cz` | 56 | 0 rozdílů | 47 s | 15 s | 32–163 s |
| `sample-states` | 248 | 0 rozdílů | 163 s | 44 s | 275–721 s |

(Prohlížeč podle toho, co v počítači běží vedle; Node počítá model obrub a Math stránky v JavaScriptu, jeden proces proto
není rychlejší než prohlížeč, výhoda je v procesech vedle sebe a v tom, že běh nepotřebuje okno ani agenta u prohlížeče.)

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

Od převodu textů na klíče (27. 11. 2026) si řez pamatuje poznámku jako klíč (`note.mapDown`, dřív česká věta) a město
skládá své texty z `locales/<jazyk>.json` až za ostatní pole: `compare.mjs` i `tables.mjs` porovnávají poznámku přes její
češtinu (`locales/cs.json`) a město s poli v jednom pořadí; `compare.mjs` nečte klíče stránky (`data-t`). Co návštěvník
vidí, se porovnává jako dřív.

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

Běh 27. 11. 2026 (26 bodů, každá vrstva jednou; `layers.md`): kredity odpovídají státu a CSP nic neblokuje. Nálezy: Polsko, ortofoto: GUGiK vrátilo
4 chyby ze 4 (v prvním běhu 4 z 4; službu zkusit znovu), Dánsko bez ortofota lokálně (vrstva je jen s klíčem `dkToken`, ne chyba),
Litva nemá podkladové ortofoto (ortofoto jen pro pruhy), Praha, linie mapy povrchů: 4 chyby z 8 (IPR/ČÚZK, často 503), u Cách se kredit ortofota
ukazuje i s Nizozemskem (kredit jde podle obdélníku státu). Nástroj měří jeden bod na stát, takže je to vzorek, ne záruka.
