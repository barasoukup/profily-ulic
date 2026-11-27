# Plán úklidu kódu po nasazení (audit Fable, 26. 11. 2026)

Bára 26. 11. 2026: „klidně ještě udělej další věci v té přestavbě tak, aby ten projekt a kód byl hezký.“ Audit jen četl
kód větve `canada`. Kroky přijdou po nasazení, po přestavbě překladů a přejmenování `pilot` → `app` (`docs/backlog.md`,
„Po nasazení“), každý zvlášť, s ověřením, že se chování nezmění.

## Co audit změřil

- Aplikace bez překladů asi 27 200 řádků (18 400 `pilot/public/*.js`, 6 200 `towns/`, 2 600 `countries/`); překlady
  30 000 řádků; testy 8 150 (532 testů, 7 s); `evaluation/` 338 skriptů, 18 900 řádků, 41,5 MB v gitu; `CLAUDE.md`
  769 řádků, `pilot/README.md` 1 221.
- Největší funkce: `profile.js drawPrahaBuilding` 1 245 ř. (34 větví podle vzhledu), `derive.js deriveProfile` 617 ř.
  a 20 argumentů, `app.js cutAt` 400 ř., `ortho-osm.js orthoOsmPolys` 459 ř.; `app.js` má 101 řádků přes 160 znaků.
- Vypínače: asi 150 (README jmenuje 46). 66 klíčů `?off=`, z toho 27 nezmíněných nikde; 12 parametrů aplikace;
  asi 55 vypínačů zdrojů měst čtených 23 kopiemi funkce `param`; 14 parametrů pokusů `ortho-osm.js P` nenastavuje nic
  (`walkYellow`, `walkEdge`, `split6`, `splitMin`, `walkMode`, `walkSat`, `walkDiff`, `walkLight`, `walkShadow`,
  `aiSnap`, `aiSnapMin`, `aiWalkMax`, `expScale`, `panoramaFromPosition`) – mrtvé větve.
- Stát mimo `countries/`: `app.js` asi 260 řádků vrstev ortofota po státech, `lanes-ortho.js` větve podle zdroje,
  `house-looks.js` 12× `iso ===`, `search.js` řetěz deseti hledačů, `sources.js isBrno()`.
- Duplicity: `towns/` `inRings` 18×, `param` 23×, `memo`/`cached` 12×, `ringsOf` 8×; `countries/` `signFile` 21×,
  `signLabel` 19×; `evaluation/` `sample.mjs` 50×, sběrače 17×, skóre 15×; `tools/` devět skriptů na hranice.
- 124 z 928 exportů nepoužívá jiný soubor; v `tools/` nikdo neodkazuje na `build_towns_ca.mjs`, `jvf_to_gpkg.py`,
  `profile_test.py`, `r2-cors.json`.
- Záchranná síť: přehrávka kryje jen SK, AT, Prahu, Brno a část Česka (369 + 56 řezů), 21 novějších států ne; nahrávky
  leží v jiných pracovních kopiích; podkladové vrstvy nehlídá nic.
- Žádný linter, formatter ani `.editorconfig`; bez bundleru – záměr, zachovat.

## Kroky (podle přínosu a rizika; S do půl dne, M asi den, L 2–3 dny)

1. **Rozšířit a zachránit přehrávku** (M): 10–20 řezů každého chybějícího státu, nahrávky do git-ignorovaného
   `data/replay/` hlavního repa, tabulka podkladových vrstev. Podmínka kroků 6–13; nahrávat ohleduplně.
2. **Zkrátit `CLAUDE.md` na asi 120 řádků** (M): pravidla, provoz, postupy, mapa dokumentace; státy do
   `docs/countries/<ISO>.md`, rozhodnutí do `docs/decisions.md`; jen přesouvat.
3. **ESLint jen na chyby a `.editorconfig`** (S), v `npm test`, bez přeformátování.
4. **Registr vypínačů `flags.js`** (M): adresa čtená jednou, záznam s druhem, výchozí hodnotou, popisem, datem a měřením;
   test, že každý vypínač má záznam; `docs/switches.md` generovaný z registru.
5. **Smazat prohrané pokusy** (S–M): jistě 14 mrtvých `P.*`; ostatní vypnuté pokusy podle Báry (`P.cars`, `?auta`,
   `P.areaGreen`, `?treepits`, `?otherstreet`, `?chodnik`, `?vypln`, `?tm`, `?outergaps`, `?sirka`, `?fietsstrook`,
   `?amspark`, `?sfosmpark`, `?ilots`, `?bologna`, `?vilnius`, `?krakow`…); u 27 nepoužívaných `?off=` jen vypínač.
6. **Společní pomocníci pro `towns/`** (M): `inside`, `ringsOf`, `cachedBy`, dotaz s limitem; asi 300–400 řádků méně.
7. **Registr ortofot** (L): `ortho/<zdroj>.js` jednoho tvaru; `app.js` staví vrstvy smyčkou.
8. **Registr hledání** (M): `{ id, looksLike, find }`, pořadí podle státu, bez cyklu modulů; nejdřív test dnešního chování.
9. **Vzhled domů podle státu do `countries/`** (S–M).
10. **Rozdělit `profile.js`** (M–L): `draw/buildings/` s tabulkou vzhled → funkce, `svg`, `items`, `signs`, `water`, `editor`.
11. **Rozdělit `derive.js`** (L): jen přesuny, `deriveProfile` na pojmenované fáze, fáze na commit.
12. **Rozdělit `app.js`** (L): podle jeho šesti oddílů; `cutAt` bez DOM, aby šel přehrávat v Node.
13. **`ortho-osm.js`, `lanes-ortho.js`** (M): `P` na konstanty a vypínače, `orthoOsmPolys` na fáze.
14. **`evaluation/`: knihovna a archiv** (L): `evaluation/lib/` (vzorek, sběr, A/B, skóre, šablona zprávy); živé nástroje
    převést, jednorázové pokusy beze změny do `evaluation/archive/` (zprávy zůstávají jako doklady rozhodnutí).
15. **`tools/` a workflow** (M): jeden `build_boundaries.mjs`, sloučit `city_site`, kroky měst z `pages.yml` do
    `tools/build_site.mjs`; ověření `diff -r` sestaveného webu.
16. **Hlídací testy** (S, průběžně): žádná podmínka na stát mimo `countries/`, žádný nepoužitý export, strop velikosti
    souboru a funkce, který se smí jen snižovat.

17. **Projít testy a zrušit zbytečné** (M; Bára 27. 11. 2026): testy smazaných pokusů pryč spolu s pokusy (krok 5);
    společná příprava dat do `tests/helpers/` místo kopií v každém souboru; testy, které hlídají jen vnitřní podobu
    kódu, ne chování, přepsat nebo smazat; co testuje totéž víckrát, sloučit. Cíl: méně řádků, stejné pokrytí chování,
    pod 10 s.
18. **Jednotný postup měření s malými vzorky** (S; Bára 27. 11. 2026: „jen vybrat ty ulice, na které to může mít vliv“):
    do `evaluation/lib/` (krok 14) a `docs/measuring.md`: nejdřív bez prohlížeče najít řezy, kterých se oprava může
    dotknout, slepé A/B jen na nich (asi 20–40) a malá kontrolní sada (30–50), která se nesmí změnit; nikdy celý vzorek
    v prohlížeči jen kvůli zjištění, co se změnilo.

19. **Vlastní pravidla psaní kódu `docs/coding-guidelines.md`** (S; Bára 27. 11. 2026), asi na stránku, udělat hned po
    kroku 3 (ESLint), ať se jimi řídí všechny další kroky: z Google/Airbnb JavaScript Style Guide pojmenování a délka
    funkcí, z *A Philosophy of Software Design* (Ousterhout) malé moduly s jasným rozhraním a jedna věc na jednom místě,
    z Test Desiderata (Kent Beck) a zásad Testing Library testy chování (rychlé, nezávislé, selžou jen při skutečné
    chybě); k tomu pravidla projektu: anglické názvy, jazyk ≠ stát, sdílený kód bez výjimek pro jedno město, vypínač
    a A/B u každé změny odhadu, měření na malých vzorcích (krok 18), bez bundleru a TypeScriptu, zprávy commitů
    popisné jako dosud. `CLAUDE.md` na ni odkáže, aby ji dostal každý agent.

Odhad: 1–6 asi 4–5 dní, 7–9 asi 4 dny, 10–13 asi 7–9 dní, 14–16 asi 4 dny, 17–19 asi 2–3 dny.

## Co nedělat

Bundler, TypeScript, framework; přepisovat logiku měřených pravidel (jen přesuny); přejmenovávat česká id v datech
uložených řezů a logu (`chodnik`, `pruh`, `cesko`) bez zpětné kompatibility; Prettier na celý kód (nanejvýš jedním
commitem nakonec s `.git-blame-ignore-revs`); plošně rozbíjet sdílený objekt `city`; mazat zprávy z měření; víc kroků
najednou nebo souběžně s novým státem.
