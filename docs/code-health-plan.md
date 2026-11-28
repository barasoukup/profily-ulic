# Plán úklidu kódu po nasazení (audit Fable, 26. 11. 2026)

Bára 26. 11. 2026: „klidně ještě udělej další věci v té přestavbě tak, aby ten projekt a kód byl hezký.“ Audit jen četl
kód větve `canada`. Kroky přijdou po nasazení, po přestavbě překladů a přejmenování `pilot` → `app` (`docs/backlog.md`,
„Po nasazení“), každý zvlášť, s ověřením, že se chování nezmění.

## Co audit změřil

- Aplikace bez překladů asi 27 200 řádků (18 400 `app/public/*.js`, 6 200 `towns/`, 2 600 `countries/`); překlady
  30 000 řádků; testy 8 150 (532 testů, 7 s); `evaluation/` 338 skriptů, 18 900 řádků, 41,5 MB v gitu; `CLAUDE.md`
  769 řádků, `app/README.md` 1 221.
- Největší funkce: `profile.js drawPrahaBuilding` 1 245 ř. (34 větví podle vzhledu), `derive.js deriveProfile` 617 ř.
  a 20 argumentů, `app.js cutAt` 400 ř., `ortho-osm.js orthoOsmPolys` 459 ř.; `app.js` má 101 řádků přes 160 znaků.
- Vypínače: asi 150 (README jmenuje 46). 66 klíčů `?off=`, z toho 27 nezmíněných nikde; 12 parametrů aplikace;
  asi 55 vypínačů zdrojů měst čtených 23 kopiemi funkce `param`; 13 parametrů pokusů `ortho-osm.js P` nenastavuje nic
  (`walkYellow`, `walkEdge`, `split6`, `splitMin`, `walkMode`, `walkSat`, `walkDiff`, `walkLight`, `walkShadow`,
  `aiSnap`, `aiSnapMin`, `aiWalkMax`, `expScale`) – mrtvé větve (`panoramaFromPosition` je metoda API Mapy.com, ne pokus;
  oprava podle recenze Fable 27. 11. 2026).
- Stát mimo `countries/`: `app.js` asi 260 řádků vrstev ortofota po státech, `lanes-ortho.js` větve podle zdroje,
  `house-looks.js` 12× `iso ===`, `sources.js isBrno()`.
- Duplicity: `towns/` `inRings` 18×, `param` 23×, `memo`/`cached` 12×, `ringsOf` 8×; `countries/` `signFile` 21×,
  `signLabel` 19×; `evaluation/` `sample.mjs` 50×, sběrače 17×, skóre 15×; `tools/` devět skriptů na hranice.
- 124 z 928 exportů nepoužívá jiný soubor; v `tools/` nikdo neodkazuje na `build_towns_ca.mjs`, `jvf_to_gpkg.py`,
  `profile_test.py`, `r2-cors.json`.
- Záchranná síť: přehrávka kryje jen SK, AT, Prahu, Brno a část Česka (369 + 56 řezů), 21 novějších států ne; nahrávky
  leží v jiných pracovních kopiích; podkladové vrstvy nehlídá nic.
- Žádný linter, formatter ani `.editorconfig`; bez bundleru – záměr, zachovat.

## Kroky v pořadí provedení (po recenzi Fable 27. 11. 2026; S do půl dne, M asi den, L 2–3 dny)

Krok 1 je první věc po nasazení, před přestavbou překladů, přejmenováním `pilot` → `app` i úklidem `.claude/worktrees/`
(nahrávky leží v pracovních kopiích). Od kroku 5 platí: každý commit = přehrání před a po a `compare.mjs` s 0 rozdíly,
výsledek ve zprávě commitu. Povinné jádro: 1–8, 9 a 11–13a; ostatní podle chuti, plán jde zastavit v půli.

1. **Přehrávka jako záchranná síť** (L): odstranit nahodilost (počkat na načtení ikon před exportem SVG; dvě přehrání
   téhož kódu = 0 rozdílů); 10–20 řezů každého chybějícího státu (21 států), nahrávky do git-ignorovaného
   `data/replay/` hlavního repa (přesunout i ty z pracovních kopií), tabulka podkladových vrstev; nahrávat ohleduplně.
2. **ESLint jen na chyby a `.editorconfig`** (S–M): `devDependencies` + `package-lock.json`, `npm ci` v jobu `test`;
   pravidla `no-undef`, `no-unused-vars`, `no-unreachable`, `no-dupe-keys`, cykly importů (případně vlastní
   `tools/check_imports.mjs` bez závislosti, poslouží i kroku 4); `npm run check` rekurzivně přes všechny složky.
3. **Pravidla psaní kódu `docs/coding-guidelines.md`** (S; dřív krok 19): asi stránka – z Google/Airbnb pojmenování
   a délka funkcí, z Ousterhouta malé moduly s jasným rozhraním, z Test Desiderata a Testing Library testy chování;
   pravidla projektu (anglické názvy, jazyk ≠ stát, sdílený kód bez výjimek pro město, vypínač a A/B u změny odhadu,
   malé vzorky, bez bundleru a TypeScriptu, popisné commity). Pravidla o délce a pojmenování platí pro nový a přesouvaný
   kód, stávající se kvůli nim nepřepisuje; u každého pravidla, čím se hlídá (ESLint, test kroku 4, úsudek recenzenta).
   `CLAUDE.md` na ni odkáže.
4. **Hlídací testy architektury** (S) v jednom `tests/architecture.test.js`: žádná podmínka na stát mimo `countries/`,
   žádný nepoužitý export, strop velikosti souboru a funkce; seznam dnešních výjimek, který se smí jen zkracovat.
5. **`CLAUDE.md` a `app/README.md`** (M): nejdřív vypsat všechna pravidla a zákazy (věty s „Bára:“, „nikdy“, „vždy“,
   „před nasazením“) do jednoho oddílu a ten nechat celý; přesouvat jen popis stavu (státy do `docs/countries/<ISO>.md`,
   rozhodnutí do `docs/decisions.md`, README podle témat do `docs/`). Cíl asi 200 řádků; každý řádek původního souboru
   dohledatelný v novém umístění.
6. **Smazat prohrané pokusy** (hotovo 28. 11. 2026, větev `drop-experiments`, seznam a měření v `docs/decisions.md`; S–M; Bára 27. 11. 2026: smazat všechny vypnuté pokusy kromě map povrchů `?krakow`,
   `?bologna`, `?vilnius`, které zůstanou vypnuté pro další pokus): 13 mrtvých `P.*` (`walkYellow`, `walkEdge`, `split6`, `splitMin`, `walkMode`,
   `walkSat`, `walkDiff`, `walkLight`, `walkShadow`, `aiSnap`, `aiSnapMin`, `aiWalkMax`, `expScale`; ne
   `panoramaFromPosition`, to je metoda API Mapy.com); před smazáním grep jména v celém repu. Ostatní vypnuté pokusy podle
   Báry (`P.cars`, `?auta`, `P.areaGreen`, `?treepits`, `?otherstreet`, `?chodnik`, `?vypln`, `?tm`, `?outergaps`,
   `?outerosm`, `?nycsigns`, `?sirka`, `?fietsstrook`, `?amspark`, `?sfosmpark`, `?ilots`, `?bologna`, `?vilnius`,
   `?krakow`…). U 28 nezmíněných `?off=` zůstane výchozí chování, smaže se jen vypnutá větev; komentář s měřením do
   `docs/decisions.md`.
7. **Registr vypínačů `flags.js`** (M): adresa čtená jednou (nahradí 22 kopií `param`), záznam s druhem, výchozí
   hodnotou, popisem, datem a měřením; test, že každý vypínač má záznam; `docs/switches.md` generovaný z registru.
8. **Společní pomocníci pro `towns/`** (M): `inside`, `ringsOf`, `cachedBy`, dotaz s limitem (`param` řeší krok 7).
9. **Úklid testů** (M; Bára 27. 11. 2026): společná příprava dat do `tests/helpers/`; testy po státech
   (`belgium.test.js`…) na jednu tabulku přes `countries/`; co testuje totéž víckrát, sloučit. Hlídací testy kroku 4 jsou
   povolená výjimka z „testovat chování“. Před a po `node --test --experimental-test-coverage`: pokrytí řádků `derive.js`,
   `signs.js`, `rules.js`, `ortho-osm.js` nesmí klesnout, čas nezhoršit (dnes asi 6 s). Před dělením velkých souborů.
10. **Smlouvy modulů a verze modulů** (hotovo 28. 11. 2026, větev `module-contracts`: `tools/version_modules.mjs`, `tests/module-versions.test.js`, `tests/towns.test.js`, typedefy v `app/public/types.js`; verze jsou hash obsahu, ne commit; `deriveProfile` už bral jeden objekt, popsaný jako `DeriveArgs`; S–M): JSDoc `@typedef` pro díl profilu, `country`, `town`, `source` v jednom
    souboru, test smlouvy pro `towns/` po vzoru `tests/countries.test.js`; `deriveProfile` s jedním objektem argumentů
    `{ geometry, sources, options }`. Při nasazení import mapa s `?v=<commit>` pro všechny moduly (generuje nástroj
    webu, bez bundleru), aby návštěvník nedostal směs starých a nových modulů; aspoň hláška „načtěte stránku znovu“ při
    chybě importu v `errors.js`.
11. **Rozdělit `profile.js`** (hotovo 28. 11. 2026, větev `split-profile`: `profile.js` jen re-exportuje z `app/public/draw/` a `draw/buildings/`, žádná funkce nad 100 ř., `drawPrahaBuilding` jsou fáze nad jedním kontextem `hs` a if-řetězce podle vzhledu jsou tabulky; L): `draw/buildings/` s tabulkou vzhled → funkce, `svg`, `items`, `signs`, `water`, `editor`.
12. **Rozdělit `derive.js`** (L; hotovo 28. 11. 2026, větev `split-derive`): jen přesuny; `derive.js` je vstup s týmiž exporty, práce v
    `app/public/derive/<téma>.js` (geometry, tags, placement, crossings, polygons, classify, parking, part-types, tram, lanes, walkways,
    items, buildings, output, adjust, estimate); `deriveProfile` (16 řádků) volá fáze nad jedním objektem `ctx`: `profile-prepare`
    (`prepareCut`, `classifyRuns`), `profile-reach` (`findAxisRun`, `reachLimits`, `walkToEdges`, `keepRuns`), `profile-parts`
    a `profile-roadway` (`buildParts`), `profile-finish` (`addFurniture`, `describeEdges`, `markSurfaces`, `profileOf`). Přehrávka
    v Node nad `sample`, `sample-cz`, `sample-states` po každém commitu 0 rozdílů; stropy: zbývá jen `splitRoadway` (228 řádků).
13. **`app.js`**: 13a rozdělit podle oddílů, jen přesuny (L; hotovo 28. 11. 2026, větev `split-app`: `app.js` je vstupní bod, části v `app/public/app/`, jádro řezu v `app/cut.js` s místy `// DOM (13b)`, přehrávka `sample` a `sample-cz` před a po beze změny); 13b jádro `cutAt` bez DOM, přehrávka v Node (L, samostatně,
    s přehráním všech států) – jediný skutečný refaktor plánu, zlevní každé další měření. 13b hotovo 28. 11. 2026 (větev
    `cut-core`): `app/cut-core.js computeCut` po fázích, `cutAt` 16 řádků; `evaluation/replay/node.mjs` přehraje všech 673
    řezů bez prohlížeče s 0 rozdíly proti prohlížeči (Math stránky `cr-math.mjs`, plátna GPU nahraná `?replay=canvas`);
    prohlížeč před a po bajt po bajtu stejně; návod `evaluation/replay/README.md` (Přehrávka v Node).
14. **`ortho-osm.js`, `lanes-ortho.js`** (hotovo 28. 11. 2026, větev `split-ortho`; M): `app/public/ortho/<celek>.js` (zdroje ortofot států `sources.js`, `regions.js`, `si-retry.js`, `image.js`, čáry `lines.js`, pruhy `lanes.js`, šrafy `hatch.js`; OSM kolem řezu `osm-along.js`, `bridges.js`, `rail.js`, `road-tags.js`, sloupce a obruby `columns.js`, `kerbs.js`, plochy `polys.js` + `polys-sides.js` + `polys-ends.js`, `beside.js`, `facade.js`, `estimate-info.js`, `measures.js`, `settings.js`), oba soubory zůstaly vstupy se stejnými exporty; `P` drží jen vypínače (`off`, `stretchOn`, `axisroad`, `aiWalk`, `dbg`), čísla hledání obrub jsou `KERB_SCORE` (`ortho/kerbs.js`); `orthoOsmPolys`, `besidePassport` a `measured` jsou pojmenované fáze; Node přehrávka (sample, sample-cz, sample-states) po každém commitu 0 rozdílů, regrese Praha/Brno beze změny. Krok 15 naváže na `ortho/sources.js`.
15. **Registr ortofot** (L): `ortho/<zdroj>.js` jednoho tvaru; `app.js` staví vrstvy smyčkou.
16. **Registr hledání** (M; hotovo 28. 11. 2026, větev `search-registry`: služby `app/public/search/<id>.js` tvaru `{ id, looksLike, find }`, pořadí dotazů v `search/registry.js`, běh v `search/run.js`, `search.js` jen pole a seznam bez podmínky na stát; cyklus `search-at > search-sk > search` zrušen (`norm`, `splitQuery` do `search/text.js`); test dnešního chování 45 dotazů v `tests/search.test.js` a `tests/fixtures/search-behaviour.json` prošel beze změny).
17. **Vzhled domů podle státu do `countries/`** (S): hotovo 28. 11. 2026 (větev `house-looks-countries`, v `house-looks.js` žádná podmínka na stát, 40 000 domů starý/nový kód 0 rozdílů, `evaluation/archive/house-looks-countries/`).
18. **Měření s malými vzorky** (S hned, knihovna s krokem 19; Bára 27. 11. 2026): `docs/measuring.md` – výběr dotčených
    řezů predikátem nad nahranými vstupy přehrávky (krok 1) nebo uloženými vstupy sběračů, slepé A/B jen na nich
    (20–40), pevná kontrolní sada v gitu (`evaluation/lib/control.json`, 30–50), nikdy celý vzorek v prohlížeči.
19. **`evaluation/`: knihovna a archiv** (M): `evaluation/lib/` (vzorek, sběr, A/B, skóre, šablona zprávy); přesun
    jednorázových pokusů do `evaluation/archive/` jedním commitem spolu s přejmenováním českých složek z backlogu (odkazy
    se lámou jen jednou); historii gitu nepřepisovat, nové obrázky z měření do gitu nepřidávat.
20. **`tools/` a workflow** (M): jeden `build_boundaries.mjs`, sloučit `city_site`, kroky měst z `pages.yml` do
    `tools/build_site.mjs`; ověření `diff -r` sestaveného webu. Hotovo 28. 11. 2026 (větev `tools-site`): `build_site.mjs` skládá celý web (`pages.yml` ho volá, sítě a tajné hodnoty zůstaly v něm), `city_site.mjs` i `build_city_site.mjs` v jednom, `build_boundaries.mjs states|towns|regions|laender|all` místo deseti nástrojů; web starým a novým postupem `diff -r` shodný, hranice bajt po bajtu shodné nad atrapou služeb.

Odhad celkem 28–32 dní (Fable: původních 21–25 bylo asi o třetinu optimistických).

## Pořadí od 28. 11. 2026 (Bára schválila)
1. Nasadit hotové (kroky 6, 5, 7, 10) po malých dávkách, jen na Bářino „nasaď“.
2. Drobnosti: krok 17 (vzhled domů do `countries/`) a 18 (malé vzorky v `docs/measuring.md`).
3. Krok 9: úklid testů, před dělením souborů.
4. Krok 13a (app.js podle oddílů, jen přesuny), pak hned **13b** (jádro řezu bez DOM, přehrávka a A/B v Node): největší
   úspora času a tokenů u každého dalšího měření.
5. Dělení: krok 12 (`derive.js`), 11 (`profile.js`), 14 (`ortho-osm.js`, `lanes-ortho.js`), po jednom s přehrávkou;
   drobné opravy po tu dobu pozastavit.
6. Kroky 15, 16, 8 (registry ortofot a hledání, pomocníci měst), až bude potřeba další stát nebo město.
7. Kroky 19, 20 (knihovna `evaluation/`, nástroje a workflow) na konec.
Mimo přestavbu: Dánsko Dataforsyningen → Datafordeler do 15. 1. 2027 (Bářin klíč).

## Co nedělat

Bundler, TypeScript, framework; přepisovat logiku měřených pravidel (jen přesuny); přejmenovávat česká id v datech
uložených řezů a logu (`chodnik`, `pruh`, `cesko`) bez zpětné kompatibility; Prettier na celý kód (nanejvýš jedním
commitem nakonec s `.git-blame-ignore-revs`); plošně rozbíjet sdílený objekt `city`; mazat zprávy z měření; víc kroků
najednou nebo souběžně s novým státem. Výjimka z „jen přesuny“ je pouze krok 13b.
