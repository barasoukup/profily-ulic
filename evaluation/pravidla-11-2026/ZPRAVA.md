# Pravidla 11/2026: stání podle zákona, tři druhy tramvaje, pruhy podle třídy TSK (10. 11. 2026)

Každá změna prošla testem A/B nad ortofotem (`evaluation/ab.mjs`). Protože jde o pravidla, ne o zdroje,
porovnává se kód před změnou a po ní: před každou změnou vznikla kopie `pilot/public` v `data/kod-0`,
`data/kod-1` a `data/kod-2` (git ji ignoruje). Varianty `variants/pred-zakon.mjs`, `po-zakon.mjs`,
`pred-tram.mjs`, `po-tram.mjs`, `pred-tsk.mjs` z ní berou `deriveProfile`, zdroje jsou stejné. Praha jen
z cache (`pilot/cache`), Jihlava a Ostrava s `CACHE=disk` přes `polite.mjs` (Ostrava 226 dotazů při prvním běhu,
pak 0). Verdikty jsou v `review.md` párů `evaluation/<město>/data/ab-*`.

## 1. Odhad stání podle zákona: připojeno

Podle § 25 odst. 3 zák. 361/2000 Sb. zůstane pro každý směr volný pruh 3 m. Obousměrka dostane stání od 8 m
na jedné straně a od 10 m na obou, jednosměrka od 5 m a od 7 m. Pruhy vedle stání mají aspoň 3 m, sdílený
pruh 2,5 m zmizel. U tramvaje zůstane 3,5 m od kolejnice (odst. 2). Chodník u obruby nerozhoduje.
Neodhaduje se jen u obruby ke střednímu pásu, k tramvajovému tělesu, k další vozovce nebo k zeleni do 15 m
před další vozovkou (doplněno po Ostravě č. 78). Kde se odhaduje, zůstává jako dřív.

| vzorek | liší se | lepší po (B) | lepší před (A) | žádná |
|---|---|---|---|---|
| Praha, 100 řezů | 7 | 4 | 2 | 1 |
| Jihlava, 89 | 11 | 7 | 3 | 1 |
| Ostrava, 99 | 14 | 9 | 4 | 1 |
| **celkem** | **32** | **20** | **9** | **3** |

- Většinou nový odhad zmizel z ulic 4,7–7 m, kde u řezu nikdo nestojí.
- **Problém:** v obousměrkách 5,4–7,5 m auta často opravdu stojí u jedné obruby, i když to zákon nedovoluje
  (Budčická, Jihlava č. 70 a 75, Ostrava Horymírova, Mařákova, Olbrachtova, Dářská). Takové profily teď
  stání nemají.
- **Problém:** bez podmínky chodníku se stání odhaduje i u široké průmyslové vozovky nebo silnice bez chodníku
  (Praha č. 52 U Technoplynu 16 m, Jihlava č. 60, Ostrava č. 51 13 m). Tam nikdo nestojí.
- Příklady z Česká Třebová: Smetanova (4,85 m) má jeden pruh bez stání, Jiráskova (7 m) dva pruhy po 3,5 m bez stání.

## 2. Tři druhy tramvaje: připojeno, výchozí povrch tělesa je otázka

Druhy jsou tramvaj v pruhu s auty (`tramvaj_v_pruhu`), tramvajový pruh ve vozovce (`tramvaj_pruh`, nový) a
tramvajové těleso (`tramvaj`, samostatné). Pruh ve vozovce vzniká, když se pruhy z OSM vejdou vedle kolejí,
nebo když koleje bez aut vedle leží v ulici s `embedded_rails`. Těleso vzniká z MTVU 705, z kolejí v zeleni
(tráva) a z kolejí ve vozovce bez aut vedle v ulici bez `embedded_rails`. Povrch se bere z `surface` trati v OSM,
jinak jsou to panely s příznakem odhadu. `psv`/`bus` na trati dává vlastnost „+ BUS“.

| vzorek | liší se | lepší po (B) | lepší před (A) |
|---|---|---|---|
| Praha, 100 řezů | 16 | 9 | 7 |
| Ostrava, 99 | 8 | 3 | 5 |

- **Druh:** změnil se v 10 řezech a v 9 sedí (Hlávkův most, nábř. E. Beneše, V Olšinách, Libeňský most,
  nábř. Kap. Jaroše, Bělohorská č. 49, Havlíčkova, Patočkova + BUS). Chyba je Švehlova (č. 32). Tam je
  štěrkové těleso, ale OSM má `embedded_rails` a MTVU vozovku, takže vyjde pruh ve vozovce.
- **Povrch:** všechny prohry jsou kvůli výchozím panelům. Z 16 posouzených těles bylo 5 z panelů, 9 ze štěrku
  (Poděbradská, Plzeňská, Olšanská, Generála Šišky, Ostrava Plzeňská, 28. října, Martinovská…) a 2 travnatá
  (Kolbenova, Ostrava Výškovická). OSM ani MTVU povrch tělesa nemá: na tramvajových tratích chybí `surface=grass`
  a výřez OSM nemá `landuse`. **Návrh pro Báru:** výchozí štěrk pro široké těleso mezi dvěma vozovkami a panely
  jen tam, kde jezdí autobusy nebo je těleso v ulici s jednou vozovkou.
- Kontrola v prohlížeči: Národní a Spálená mají tramvajový pruh, Vinohradská (u Želivského) tramvaj v pruhu,
  Plzeňská (č. 33) a Patočkova (+ BUS na jedné koleji) těleso.

## 3. Pruhy podle třídy TSK (Praha): připojeno

Třída úseku TSK dostane skupinu ČSN 73 6110. Podle zák. 13/1997 Sb. je MK I rychlostní nebo sběrná, TSK to
nerozlišuje, proto MK I a II spadají do skupiny B a jen dálnice do A. Varování v Návrhu pro jízdní pruh:
dálnice červeně pod 3 m, oranžově pod 3,5 m. MK I, MK II a silnice I. a II. třídy červeně pod 3 m. MK III
červeně pod 2,75 m, oranžově pod 3 m. MK IV červeně pod 2,5 m, oranžově pod 2,75 m. Bez třídy zůstává
2,5 / 3 m. Strop pruhu je teď v MK I a na dálnicích 3,75 m.

- Strop 3,75 m v MK I (Praha, 100 řezů): liší se 10, lepší B 6 (značené pruhy kolem 3,5 m: Kukulova,
  Strakonická, Čuprova, Ústecká, Generála Šišky), A 1 (Strakonická č. 11: dva pruhy po 4,3 m), obě 3.
- Strop 4 m v MK II a 4,5 m v MK IV (zkoušeno, nepřipojeno): z 6 řezů (č. 83 a cílený vzorek `samples-useky`)
  lepší A 1, obě 2, žádná 3.
- Varování o pruzích na 100 řezech (Stav, jak se otevře v Návrhu): dřív 1 červené a 33 oranžových, teď
  22 červených a 12 oranžových. Červená přibyla v MK I a II, kde se pruhy kolem tramvaje dělí na 2,7–2,95 m
  (Patočkova, Švehlova, Hlávkův most, Olšanská).

## Stání mimo zástavbu bez chodníku a v obytné zóně: připojeno

Bára: „u ulic mimo zástavbu bez chodníku to vypni“ a v obytné zóně odhad nedělat (§ 39: stání jen na
vyznačených místech). U obruby se stání neodhaduje, když tam není chodník a strana leží mimo zástavbu.
- **Chodník:** plocha chodníku nebo stezky (MTVU 702, 703) hned za obrubou nebo za zelení do 10 m, tag OSM
  `sidewalk` té strany, nebo pěší či cyklistická cesta OSM podél ulice do 12 m od obruby.
- **Mimo zástavbu:** profil na té straně nekončí domem a žádný dům z OSM ani z ploch města nezasahuje do obdélníku
  40 m od obruby ven a ±40 m podél ulice. Bez nových dotazů (OSM `landuse` ve výřezu není). Na vzorcích vychází
  stejně se 25, 30 i 40 m; 40 m nechává odhad i u statků s domy dál od silnice.
- Obytná zóna (`living_street`) vypadla z ulic s odhadem. Stání z OSM nebo z dat města v ní zůstává.

Kód před změnou je `data/kod-3`, po ní `data/kod-4` (kod-3 + nový `derive.js`), varianty `pred-zastavba` a
`po-zastavba`, `ITEMS=1`, Praha z cache, Jihlava a Ostrava `CACHE=disk` (0 dotazů na web).

| vzorek | liší se | lepší po (B) | lepší před (A) | žádná |
|---|---|---|---|---|
| Praha, 100 řezů | 3 | 2 | 0 | 1 |
| Jihlava, 89 | 0 | | | |
| Ostrava, 99 | 1 | 0 | 1 | 0 |
| **celkem** | **4** | **2** | **1** | **1** |

- Praha č. 52 U Technoplynu: u okraje k zeleni (stezka až 12,7 m za ní, žádný dům) odhad zmizel. U haly na
  druhé straně zůstal, protože je to zástavba; nikdo tam nestojí.
- Obytné zóny: Ohmova (č. 89) bez aut, lepší B. U libušské sokolovny (č. 86) auta stojí u druhé obruby, než
  kreslil odhad, takže ani jedna. Ostrava Žilinská (č. 87) u paneláků má řadu aut, asi na vyznačených místech,
  která data nemají: lepší A.
- Beze změny zůstaly Jihlava č. 60 Hruškové Dvory (stezka OSM 4,7 m za obrubou a hala do 40 m) a Ostrava č. 51
  Betonářská (chodníky za zelení 3 m na obou stranách). Pravidlo je nepokrývá, auta tam nestojí.
- Ve vsích a úzkých ulicích bez chodníku zůstal odhad podle zákona: Jihlava Na Kopci (10,9 m, dva odhady),
  Březinova (9 m), Pávov, Ostrava Pustkovecká (domy do 10 m). Silnice mezi poli (Praha Prokopské údolí,
  Černošická, Jihlava Kosovská, Pávov č. 59, Ostrava Na Pastvisko, Branecká) zástavbu nemají. Ty jsou ale užší
  než 8 m, takže by odhad nedostaly ani před změnou.

## 4. Povrch tramvajového tělesa: pravidlo a tráva z ortofota, připojeno

Povrch tělesa, které OSM nepopisuje, teď určuje `bedSurfaces` v `derive.js` a `ortho.js`. Vše zůstává
označené jako odhad.

1. **Tráva z ortofota.** Když řez podle OSM kříží koleje, aplikace se zeptá na jeden obrázek ortofota ČÚZK
   (stejná WMS jako podklad Ortofoto). Je to PNG kolem kolejí: řez 5 m za krajními kolejemi, 3 m podél ulice,
   0,25 m/px, asi 30 × 60 px a 10 kB. Dotaz jde souběžně s ostatními, limit je 2,5 s. Pixely tělesa se čtou
   bez 0,4 m u okrajů a bez pásu ±0,3 m kolem kolejnic. Tráva je tam, kde má aspoň 35 % světlých pixelů
   2g − r − b ≥ 10 a g > b. Při stínu, málo pixelech nebo chybě rozhoduje pravidlo.
2. **Pravidlo:** autobusy na koleji (+ BUS) → asfalt (nový povrch, kreslí se jako vozovka s kolejemi). V pěší zóně
   → panely. Těleso u kraje ulice (vozovka jen z jedné strany) → štěrk. Těleso mezi dvěma vozovkami od 6 m →
   štěrk, užší → panely. `surface=asphalt` v OSM je teď asfalt, ne panely.

Varianty `variants/tram-panely.mjs` (a, dřívější panely), `tram-pravidlo.mjs` (b) a `tram-orto.mjs` (c, pravidlo +
ortofoto) běžely s `PARTS=1 CACHE=disk` přes `polite.mjs`. Vzorky: řezy s tělesem ze 100 řezů Prahy, Ostravy,
Brna a Plzně, k tomu cílené vzorky `evaluation/<město>/data/samples-tram.json` (T v tabulce). Ty mají 10 náhodných
bodů na kolejích OSM 5–18 m od souběžné silnice v Brně, Ostravě a Plzni. Každé těleso je posouzené okem nad ortofotem
0,1 m/px. Vynechaných je 8 těles, kde se povrch poznat nedá: stín (Brno 49, 60, 96, T 1), stavba (Plzeň 22, T 6),
kolejiště vozovny (Plzeň T 1) a rozmazaný snímek (Brno 48). Zbylo **47 těles**.

| | těles | (a) panely | (b) pravidlo | (c) pravidlo + ortofoto |
|---|---|---|---|---|
| Praha | 8 | 1 | 5 | 6 |
| Ostrava | 8 + 10 T | 4 | 12 | 13 |
| Brno | 2 + 9 T | 2 | 8 | 9 |
| Plzeň | 3 + 7 T | 6 | 4 | 4 |
| **celkem** | **47** | **13** | **29** | **32** |

Okem: 22 štěrk, 14 panely nebo dlažba, 8 asfalt, 3 tráva.

- **Tráva** z ortofota sedí ve všech 3 případech (Kolbenova, Ostrava Výškovická, Brno Nové sady; podíl zelené
  0,85–1,0). Žádné jiné těleso nemá víc než 0,17 (Ostrava Počáteční se stromy). Proto vyhrála varianta (c).
- **Štěrk:** pravidlo trefí 19 z 22. Mýlí se u užších těles mezi vozovkami (5,7–5,9 m: Generála Šišky č. 40,
  Ostrava Plzeňská T 3, Závodní, Plzeň Přemyslova).
- **Problém:** asfalt bez autobusů pravidlo nepozná (5 z 8: Pavlovova, Ruská, Sokolská, Plzeň Koterovská, Gerská
  → panely; Křenová, Terezie Brzkové → štěrk). Panely mezi širokými vozovkami vycházejí jako štěrk (Bělohorská,
  Plzeň Karlovarská 2×). Plzeň má hodně panelových těles kolem 6 m, proto je tam pravidlo horší než panely.
- **Štěrk proti panelům z ortofota:** zkoušené byly i pražce. Při 0,1 m/px (varianta `tram-orto-10`, obrázek asi
  6× větší, 250–430 ms) jsou mezi kolejnicemi vidět jako pruhy po 0,6–0,75 m (`sleeperRepeat`, autokorelace
  jasu). Štěrk má 0,15–0,85, dlažba a asfalt 0,05–0,74. Práh 0,5 by přidal 1 těleso ze 47, proto se nepoužívá.
  Asfalt a panely mají stejný jas i strukturu a nejdou od sebe rozlišit.
- **Čas na klik:** obrázek trvá v prohlížeči 66–192 ms (při prvním běhu vyhodnocení 60–520 ms, jednou 1,8 s v
  Plzni). Startuje s ostatními dotazy, takže klik prodlouží jen tam, kde jsou plochy rychlejší. Na localhostu
  s cache IPR je to asi +150 ms. U živé MTVU (1–10 s) a služeb měst se neprojeví. Řez bez kolejí v OSM nic
  navíc nestojí. Vyhodnocení poslalo na ČÚZK asi 100 dotazů na malé obrázky a asi 45 na velká ortofota k posouzení.
- Kontrola v prohlížeči: Patočkova asfalt (+ BUS), Kolbenova tráva, Plzeňská (č. 33) štěrk, Ostrava Výškovická
  tráva, Brno Nové sady tráva. Plzeňská u Anděla má tramvajový pruh, ne těleso, takže povrch se tam neurčuje
  (obrázek se přesto stáhne, protože koleje kříží řez).

| řez | ulice | šířka | okolí | okem | (a) | (b) | (c) |
|---|---|---|---|---|---|---|---|
| Praha 15 | Bělohorská | 6,9 m | mezi vozovkami | panely | panely | **štěrk** | **štěrk** |
| Praha 20 | Poděbradská | 9,9 m | mezi vozovkami | štěrk | **panely** | štěrk | štěrk |
| Praha 25 | Kolbenova | 7,8 m | mezi vozovkami | tráva | **panely** | **štěrk** | tráva |
| Praha 26 | Patočkova | 7 m | mezi vozovkami, + BUS | asfalt | **panely** | asfalt | asfalt |
| Praha 33 | Plzeňská | 7 m | mezi vozovkami | štěrk | **panely** | štěrk | štěrk |
| Praha 35 | Olšanská | 9,7 m | mezi vozovkami | štěrk | **panely** | štěrk | štěrk |
| Praha 40 | Generála Šišky | 5,7 m | mezi vozovkami | štěrk | **panely** | **panely** | **panely** |
| Praha 42 | Generála Šišky | 10,5 m | u kraje | štěrk | **panely** | štěrk | štěrk |
| Ostrava 16 | Plzeňská | 7,5 m | mezi vozovkami | štěrk | **panely** | štěrk | štěrk |
| Ostrava 21 | Plzeňská | 7,4 m | mezi vozovkami | štěrk | **panely** | štěrk | štěrk |
| Ostrava 23 | 28. října | 7,6 m | mezi vozovkami | štěrk | **panely** | štěrk | štěrk |
| Ostrava 32 | 28. října | 4,5 m | mezi vozovkami | panely | panely | panely | panely |
| Ostrava 41 | Hlučínská | 4,7 m | mezi vozovkami | panely | panely | panely | panely |
| Ostrava 43 | Výškovická | 6,8 m | mezi vozovkami | tráva | **panely** | **štěrk** | tráva |
| Ostrava 50 | Martinovská | 7,2 m | mezi vozovkami | štěrk | **panely** | štěrk | štěrk |
| Ostrava 75 | Svornosti | 5,7 m | mezi vozovkami | panely | panely | panely | panely |
| Brno 12 | Svatopetrská | 7,4 m | mezi vozovkami | štěrk | **panely** | štěrk | štěrk |
| Brno 95 | náměstí Svobody | 15,9 m | pěší zóna | panely | panely | panely | panely |
| Plzeň 7 | Klatovská třída | 5,2 m | mezi vozovkami | panely | panely | panely | panely |
| Plzeň 8 | Klatovská třída | 5,3 m | mezi vozovkami | panely | panely | panely | panely |
| Plzeň 14 | Vejprnická | 5,2 m | mezi vozovkami | panely | panely | panely | panely |
| Brno T 2 | Nové sady | 6,5 m | mezi vozovkami | tráva | **panely** | **štěrk** | tráva |
| Brno T 3 | Kníničská | 7,6 m | u kraje | štěrk | **panely** | štěrk | štěrk |
| Brno T 4 | (bez jména) | 4,6 m | u kraje | štěrk | **panely** | štěrk | štěrk |
| Brno T 5 | Obvodová | 8,5 m | u kraje | štěrk | **panely** | štěrk | štěrk |
| Brno T 6 | Bystrcká | 6,7 m | mezi vozovkami | štěrk | **panely** | štěrk | štěrk |
| Brno T 7 | Křenová | 6,2 m | mezi vozovkami | asfalt | **panely** | **štěrk** | **štěrk** |
| Brno T 8 | Renneská třída | 6,7 m | mezi vozovkami | štěrk | **panely** | štěrk | štěrk |
| Brno T 9 | Nádražní | 6 m | mezi vozovkami, + BUS | panely | panely | **asfalt** | **asfalt** |
| Brno T 10 | Pod Sídlištěm | 8,6 m | mezi vozovkami | štěrk | **panely** | štěrk | štěrk |
| Ostrava T 1 | Pavlovova | 4,3 m | mezi vozovkami | asfalt | **panely** | **panely** | **panely** |
| Ostrava T 2 | Ruská | 1,9 m | mezi vozovkami | asfalt | **panely** | **panely** | **panely** |
| Ostrava T 3 | Plzeňská | 5,7 m | mezi vozovkami | štěrk | **panely** | **panely** | **panely** |
| Ostrava T 4 | Sokolská třída | 5,8 m | mezi vozovkami | asfalt | **panely** | **panely** | **panely** |
| Ostrava T 5 | Svornosti | 5,5 m | mezi vozovkami | panely | panely | panely | panely |
| Ostrava T 6 | Místecká | 4,7 m | u kraje | štěrk | **panely** | štěrk | štěrk |
| Ostrava T 7 | Martinovská | 7 m | mezi vozovkami | štěrk | **panely** | štěrk | štěrk |
| Ostrava T 8 | Výškovická | 7,2 m | mezi vozovkami | štěrk | **panely** | štěrk | štěrk |
| Ostrava T 9 | Počáteční | 7,6 m | u kraje | štěrk | **panely** | štěrk | štěrk |
| Ostrava T 10 | Závodní | 5,7 m | mezi vozovkami | štěrk | **panely** | **panely** | **panely** |
| Plzeň T 2 | Přemyslova | 5,9 m | mezi vozovkami | štěrk | **panely** | **panely** | **panely** |
| Plzeň T 4 | Koterovská | 5,3 m | mezi vozovkami | asfalt | **panely** | **panely** | **panely** |
| Plzeň T 5 | Lidická | 5,8 m | mezi vozovkami | panely | panely | panely | panely |
| Plzeň T 7 | Karlovarská | 8,4 m | mezi vozovkami | panely | panely | **štěrk** | **štěrk** |
| Plzeň T 8 | Karlovarská | 6,1 m | mezi vozovkami | panely | panely | **štěrk** | **štěrk** |
| Plzeň T 9 | Terezie Brzkové | 6,2 m | mezi vozovkami | asfalt | **panely** | **štěrk** | **štěrk** |
| Plzeň T 10 | Gerská | 5,8 m | mezi vozovkami | asfalt | **panely** | **panely** | **panely** |

Tučně je chyba. „Mezi vozovkami“ znamená vozovku na obou stranách tělesa, „u kraje“ jen na jedné.

## Otevřené

1. Povrch tělesa (bod 4): asfalt bez autobusů a panely mezi širokými vozovkami pravidlo nepozná. Pomohl by
   povrch z dat měst (pasport tramvajových tratí DPP, DPMB?) nebo jemnější ortofoto i pro panely.
2. Stání v úzkých obousměrkách, kde auta stojí proti zákonu: má profil ukázat skutečnost, nebo zákon?
3. Odhad stání u velmi široké průmyslové vozovky se zástavbou nebo chodníkem (Praha č. 52 u haly, Ostrava
   Betonářská): přidat podmínku? (Mimo zástavbu bez chodníku už odhad není.)
4. Obytná zóna: odhad už není (§ 39). Vyznačená místa (Ostrava Žilinská) ale data nemají.
5. Cyklisté v protisměru jednosměrky: § 25 počítá pruh pro každý směr jízdy, odhad bere jednosměrku jako jeden směr.
6. Červená u pruhů 2,7–2,95 m v MK I a II je přísná. Odvozené pruhy vedle tramvaje jsou dělení vozovky, ne
   změřená čára.
