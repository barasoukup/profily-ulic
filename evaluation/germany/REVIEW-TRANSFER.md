# Nepřátelská recenze přenosu Německa na přestavbu států (17. 11. 2026)

Rozsah: `git diff origin/main..germany-main` (commity `198f38d`, `444ff20`, `87d830f`). Žádný soubor kromě této zprávy
jsem neměnil.

Co jsem ověřil: `npm test` prošel (272 testů, 0 chyb). Malé kontroly v Node: `cleanCut` (Berlín, Cáchy, Košice, Graz,
Paříž, cizí klíče), `deriveProfile` pro DE / AT / CZ / Prahu (zákonný odhad, zúžení stání), `checkRules` s protisměrem
v DE, `PackSet` s výpadkem jednoho balíku, `pack_osm_tiles.mjs` na 132 000 prázdných dlaždicích, `landsAt` pro místa
za hranicí. Dva malé dotazy ven (WMS Saska a Bavorska, dlaždice 256 px ve Varnsdorfu a v Aši).
Co jsem neověřil: běh `osm-tiles.yml` na GitHubu, stavbu dlaždic zemí, chování v prohlížeči, služby Berlína, Hamburku
a Cách, 14 zbylých WMS.

Bez nálezu: architektura (žádná podmínka na stát mimo `countries/`, `DE.js` neimportuje `city.js` ani modul, který ho
importuje; `lanes-ortho.js` nemá žádný import; `lawNeed`, `besideMax`, `atPlace` a `contraflow → null` jsou popsané
v `default.js`), `useCity` v Česku, na Slovensku a v Rakousku nic nedělá navíc (`atPlace` je `null`), obnova řezu
(`country.atPlace?.(…).then` se pro stát bez `atPlace` nevyhodnotí), CSP (15 hostitelů WMS v `connect-src` i `img-src`,
Berlín, Hamburk, Cáchy, Photon), překlady (test hlídá, staré klíče v `en/sk/de.js` nezůstaly), index `de_xx`
(`osm_index.mjs`), `deploy` přes `GITHUB_TOKEN` (`workflow_dispatch` je povolená výjimka, `actions: write` je nastavené).

Opravy z `REVIEW.md` po přenosu: 1 drží (meze z `bounds` států, klíče z `credits.js`; `deTown`, `de-BE`, `at19` zůstanou,
cizí hodnoty vypadnou), 2 drží (test 5,1 / 7,1 / 9,1 m), 4 hotové jinak a rozbité (nález 1), 6 drží jen napůl (nález 2),
7 drží (zúžení jen při `run.guess`; Praha 6,7 m s `parking:both` zase bez stání), 9 drží (pruh jen skupina B se zdrojem,
kolmé 4,5 + 0,7 m, protisměr `null`, tramvajový pás `[]`), 10 drží (země z `laender.json`, test), 11 drží (Worker
45,5–55,5° a 5,5–23°, nasadit musí Bára), 12 drží uvnitř Německa, ale přineslo nález 3. Bod 3: odkazy na licence
v patičce jsou, Sársko zůstává neověřené (nález 8).

## Blokující

### 1. `pack_osm_tiles.mjs` spadne u každého balíku nad asi 120 000 dlaždic: Česko, Rakousko a velké země se nenahrají
- **Kde:** `tools/pack_osm_tiles.mjs:108–109` (nový obdélník dlaždic pro `index.json`), volá `.github/workflows/osm-tiles.yml:106`.
- **Co je špatně:** `Math.min(...ij.map(…))` rozbalí všechny dlaždice do argumentů funkce. Od zhruba 120–125 tisíc
  prvků končí `RangeError: Maximum call stack size exceeded`. Česko má 246 496 dlaždic (`app/data/osm-tiles-cz2`),
  Slovensko 105 315 (těsně pod hranicí). Podle plochy vyjde Bavorsko kolem 220 tisíc, Dolní Sasko 150 tisíc, Rakousko
  přes 150 tisíc, Bádensko-Württembersko a Severní Porýní-Vestfálsko kolem hranice. Soubor `.posm` se zapíše, ale
  `index.json` ne a skript skončí chybou: krok „Build and pack“ selže, „Upload to R2“ se přeskočí.
- **Dopad:** po sloučení se Česko (a nejspíš Rakousko) přestanou týdně obnovovat (zůstane poslední starý soubor, nikdo si
  nevšimne, protože `index` a `deploy` běží dál) a největší německé země nebudou mít data nikdy. Místní `index.json`
  v `app/data/osm-pack` nemá `bbox`, takže tahle podoba skriptu na celém státu ještě neběžela.
- **Jak zopakovat:** složka se 132 000 prázdnými soubory `x_y.json`, `node tools/pack_osm_tiles.mjs <složka> out/xx-{hash}.posm`
  → RangeError, v `out/` je jen `.posm`. Nebo `node -e 'Math.min(...new Array(125000).fill(1))'`.
- **Oprava:** obdélník počítat smyčkou (`packTiles` už `extent` počítá v řádcích 44–51: vrátit ho a použít), přidat test
  s 300 000 jmény. Před pushem pustit `osm-tiles.yml` ručně na `cz` a `de_by`.

## Vážné

### 2. Výpadek českého balíku na R2 už nepřepne na zálohu na Pages, řez dostane prázdná data
- **Kde:** `app/public/osmpack.js:215–227` (`PackSet.tiles`).
- **Co je špatně:** oprava bodu 6 pustí dál každou odpověď, ve které uspěl aspoň jeden dotázaný balík. Obdélníky balíků
  se ale hodně překrývají (obdélník Saska drží Ústí, Děčín, Most a Chomutov, Bavorska Plzeň, Cheb a Karlovy Vary,
  Rakouska České Budějovice a Znojmo, Slovenska východní Moravu). Když tam český balík selže (timeout, 5xx) a sousední
  odpoví prázdnem, vrátí se prázdný seznam: „Tady jsem žádnou ulici nenašla“ a do logu `bez_dat`. Dřív stejná chyba
  přepnula na Pages, kde Česko je. Dokud `index.json` nemá `bbox` (první nasazení, balík bez meta souboru), ptá se
  každý řez všech balíků a platí to pro celé Česko a Slovensko.
- **Jak zopakovat:** `PackSet(["r2", "pages"])`, index s `cz` a `de_sn` s překrytými obdélníky, `cz` na R2 vrací 503,
  `de_sn` odpoví → `tiles(["2884_10016"])` vrátí `[]`, `set.at` zůstane 0, na Pages se nikdo nezeptá.
- **Oprava:** balík, který selhal, zkusit na dalším místě (Pages) jen pro jeho kód; když ho tam index nemá, teprve pak
  varování a pokračovat. Test na opačný případ, než je ten stávající (Česko dole, Bavorsko odpovídá).

### 3. Podklad „Ortofoto“: německá vrstva kreslí bílé dlaždice přes české (a rakouské) ortofoto v pásu u hranice
- **Kde:** `app/public/app.js:206–234` (`DeOrtho`), `app/public/lanes-ortho.js:71–78` (`landsAt` s okolím 2 km).
- **Co je špatně:** vrstva je v `kinds.ortho` poslední, tedy nad ortofotem ČÚZK i basemap.at. Dlaždice se ptá země,
  i když její střed leží do 2 km **za** hranicí Německa (`landsAt` vrací i okolní země). Pro jednu zemi jde JPEG bez
  průhlednosti a mimo své území WMS vrací bílou. Ověřeno: střed Varnsdorfu → `["SN"]`, střed Aše → `["BY"]`, oba
  dotazy vrátily čistě bílý obrázek (255, 255, 255). Totéž u dlaždice, která má střed v Německu a přesahuje hranici
  (Görlitz, Pasov, Freilassing): její polovina za hranicí je bílá.
- **Dopad:** v českých obcích u německé hranice (Aš, Varnsdorf, Vejprty, Rumburk, Hřensko, Železná Ruda…) zmizí
  v podkladu Ortofoto české ortofoto pod bílou plochou. Česko se tím změnilo, ač nemělo.
- **Oprava:** dlaždici kreslit jen pro země, ve kterých střed opravdu leží (první zásah `landsAt`, `n === 0`), a vždy
  jako průhledné PNG, když dlaždice není celá uvnitř jedné země (nebo vždy do 2 km od jakékoli hranice včetně státní).
  Případně `zIndex` pod ortofota sousedních států nestačí, ČÚZK je bez `bounds` všude.

### 4. Zúžené stání v odhadnuté vozovce svítí v Návrhu červeně hned po kliknutí
- **Kde:** `app/public/derive.js:676–687` (`OSM_PARK_MIN`).
- **Co je špatně:** oprava bodu 7 zúžení omezila na odhadnutou vozovku, jenže tam (celé Německo, Rakousko a Slovensko
  mimo města s mapou, Česko bez technické mapy, pražské a brněnské plochy s `guess`) dál vzniká stání 1,7–1,9 m a pruh
  2,5 m, na které pravidla hned hlásí minimum. Recenze to vytýkala a výtka pro odhad platí dál.
- **Jak zopakovat:** `setCity("praha")`, vozovka 701 s `guess: true` 6,7 m, `parking:both=parallel` →
  `parkovani 1,70 · pruh 2,50 · pruh 2,50`, pravidla: „Parkování 1,70 m: pod minimem“, dvakrát „Jízdní pruh 2,50 m:
  užší než základ“. Jednosměrka 4,4 m → `pruh 2,50 · parkovani 1,90`, zase červeně.
- **Oprava:** u dílu z odhadu varování potlačit (šířka je odhad, ne projekt), nebo zúžené stání kreslit v nejmenší
  šířce pravidel a chybějící decimetry vzít chodníku; rozhodne Bára.

## Drobné

5. **Protisměr bez pravidla smaže varování pruhů** (`app/public/rules.js:45–51`): varování pruhů se z `out` vyřízne
   dřív, než se zjistí, že stát pravidlo nemá. V Německu pruh 2,8 m ve skupině B dává „užší než základ“, se značkou
   `oneway + protismer` nedá nic. Kontrolu `if (!rule)` dát před `splice`.
6. **Ruční spuštění `osm-tiles.yml` s `de` nepostaví nic** (`osm-tiles.yml:14, 72`): popis vstupu radí „např. de,at“,
   kódy jsou ale `de_by` … a porovnává se přesná shoda. Vzít i předponu státu (`de` → všechny `de_*`) nebo opravit popis.
7. **`CLAUDE.md` po přenosu neplatí** (oddíl Německo): „balík `de` jen na R2, staví ho job `de` (330 min)“ (je 16 balíků
   `de_xx`), „paneláky podle `city.js inGdr`“ (je `DE.js atPlace` a `laender.json`), „Kandidát na městská data: Hamburg …
   před zapojením A/B“ (je zapojený). Komentář „Each well under an hour“ v `osm-tiles.yml:66` je odhad, žádný běh ho nezměřil.
8. **Licence zemí se v dokumentech rozcházejí:** `LICENCE-A-ZDROJE.md` řadí Sársko mezi „bez podmínek“ a ST a MV
   jen „s povinným zdrojovým údajem“, `DE_ORTHO.credit` (`lanes-ortho.js:44–60`) uvádí SL a ST dl-de/by-2-0 a MV
   CC BY 4.0. U Sárska `SOURCES.md:24` sám říká „u DOP výslovně neověřeno“: blokující bod 3 staré recenze tedy pro
   Sársko trvá (ověřit, nebo zemi do té doby vypnout).
9. **Věta o stání napůl na chodníku v Německu říká nepravdu u obousměrky** (`DE.js:89–90`, `derive.js:716`): `lawNeed`
   pro odhad (dva pruhy po 2,5 m = 5 m) se použije i do věty „podle StVO § 12 a judikatury má zůstat asi 5,00 m“.
   Judikatura říká 3,05 m. Do věty dát 3,05 m, 5 m nechat jen odhadu. (Odvozeno z kódu, větu jsem na řezu nevyvolal.)
10. **`laender.json` (334 kB) se stahuje i českým uživatelům:** obdélník německé vrstvy sahá po 15,1° v. d. (Praha,
    Plzeň, Ústí), první dlaždice podkladu Ortofoto tam soubor načte a pro každou dlaždici počítá 9 × 16 testů bodu
    v mnohoúhelníku. Nejdřív zkusit hrubou hranici Německa ze `states.json`.
11. **Německé ortofoto selže potichu, když se nenačte `laender.json`** (`lanes-ortho.js:110`): `.catch(() => [])` vrátí
    „žádný snímek“ bez výpadku, profil je jen z OSM a poznámka o ortofotu chybí. Chybu poslat dál jako `outage`.
    Když první země visí do konce časového limitu, druhá se nezkusí (`left < 500`).
12. **Rakouská záloha z19 při jakékoli chybě 4xx** (`lanes-ortho.js:150–154`): `missing` počítá i 403 a 429, takže
    omezení ze strany basemap.at zdvojnásobí dotazy. Brát jen 404. `at19` má `res: 0.1`, skutečně je kolem 0,2 m.
13. **Starý soubor `de-….posm` na R2** (z doby jednoho balíku) by `osm_index.mjs` vzal jako stát `de` a aplikace by ho
    četla vedle `de_xx` (test `tests/osm-index.test.js` to dokonce čeká). Před prvním během zkontrolovat kbelík.
14. **`useCity` a obnova zapisují `panels` po `await`** (`app.js:88–93, 2087–2089`): při dvou rychlých klicích ve dvou
    státech se `panels` může zapsat městu druhého řezu. Hodnotu zapsat jen když `city.id` zůstalo stejné.
15. **Dokumentace nových vlastností státu:** `docs/architecture-countries.md` a `app/README.md` `lawNeed`, `besideMax`
    a `atPlace` neznají (jen `default.js` a jedna zmínka ve skillu); `houseLook` má čtvrtý parametr `city`, `default.js`
    ho nepopisuje. Nápověda `tools/countries.mjs` nezná `--matrix`.
16. **První push (trvá, bod 5 staré recenze):** stránka s Německem vyjde za minuty, dlaždice zemí až po `osm-tiles.yml`;
    s nálezem 1 navíc některé země nevyjdou vůbec. `pages.yml` už nemá týdenní spuštění: když `index` selže, týdenní
    obnova ZPS a ostatních dat při nasazení ten týden neproběhne.

## Zapracování (17. 11. 2026)

- **Opraveno:** 1 (obdélník dlaždic smyčkou, `tilesBox`, test na 250 000 dlaždic), 2 (balík, který na R2 selže, se zkusí
  na Pages sám, i když soused odpoví prázdně; test), 3 (dlaždice podkladu, která není celá v jedné zemi, jako průhledné
  PNG; Sasko i Bavorsko mimo své území vrací průhlednou plochu, ověřeno u Varnsdorfu a Aše), 4 (stání z OSM v odhadnuté
  vozovce zůstává 2 m, pruhy ustoupí nejvýš o 0,3 m; test), protisměr bez pravidla nemaže varování pruhů, ruční spuštění
  `de` postaví všechny země, věta o stání napůl na chodníku v Německu, CLAUDE.md, licence ortofot v LICENCE-A-ZDROJE.md.
- **Ponecháno:** `laender.json` se načte i u českého pohraničí v podkladu Ortofoto (jen tam, kde vrstva Německa leží);
  starý `de-*.posm` na R2 není (Německo se nikdy nenahrálo).
