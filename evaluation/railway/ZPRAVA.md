# Železnice jako díl profilu (Bára 27. 11. 2026)

Podnět: Rudolfstraße v Linci (`#rez=48.306707,14.273160,53.5,22.0,22.0,5853782`), trať Mühlkreisbahn vede podél ulice a v profilu
chyběla. Zjištění: dlaždice OSM koleje `rail`, `narrow_gauge` a `subway` vůbec nedržely (export `build_osm_data.sh` bral jen `tram`
a `light_rail`), takže nešlo jen o odhad. Po změně se v Linci místo „krajnice 4,25 m“ kreslí „Železnice 4,50 m“ (snímek
`linz-rudolfstrasse.png`).

## Co se změnilo
- Typ `railway` (`types.js`, `profile.js drawRailway`, 23 překladů štítku, graf povrchu „částečně propustný“, Streetmix jako štěrkový
  dělicí pás, `validate.js` pole `narrow`), paleta „Železnice“ v Návrhu, vypínač `?off=railway`.
- Odhad (`ortho-osm.js`, `derive.js`): viz `pilot/README.md`, oddíl Železnice.
- Dlaždice: nové koleje jen na povrchu a u silnice (`tools/build_osm_tiles.mjs dropRail`). V malém vzorku 60 měst (6 států) je to
  72 599 řádků v 5 663 dlaždicích, 2,6 MB zabalené; celostátní přírůstek se zjistí až přestavbou na R2.

## Měření (bez prohlížeče vybrané, pak slepé)
1. Výběr offline: `scan.mjs` z OSM výřezů 60 měst (`osmium` + `ogr2ogr` + skutečný `build_osm_tiles.mjs`, CZ, SK, AT, DE, CH, PL)
   našel 3 400 míst, kde ulice s názvem má kolej 4–22 m vedle sebe aspoň 30 m (AT 816, DE 1 649, CH 963, CZ 358, SK 166, PL 216), a kontroly
   bez koleje a tramvaje do 100 m. Vybráno 30 cílů s fotkou Mapillary a ortofotem (AT 7, DE 7, CH 5, CZ 4, SK 4, PL 3; pevné pořadí,
   dřív než se cokoli pustilo v aplikaci) a 40 kontrol.
2. Slepý A/B: dva posuzovatelé (Sonnet, `POKYN.md` s přidaným kódem `zeleznice`, neutrální ids, každý posuzovatel ve dvou polovinách)
   sestavili vlastní profil; aplikace s železnicí a bez (`?off=railway`) proti nim mírou `evaluation/universal/compare.mjs`
   (složení uličního prostoru; `railway` je tam třída `zeleznice`, počítá se do uličního prostoru).
3. Kontroly: 40 řezů bez koleje v okolí se nesmí změnit.

### První běh (bez limitu vzdálenosti)
Změněno 16 z 27: lépe 2, hůř 3, stejně 11. Hůř: Gdaňsk Przy Torze (lože odkrojilo vozovku), Szczecin Dembowskiego (kolej 16 m od osy za
stromy, rozšířila řez a změnila odhad stání), Štýrský Hradec Friedhofgasse. Oprava: lože nezasahuje do vozovky z ortofota (začíná u obruby)
a kolej dál než `RAIL_GAP` = 10 m za posledním prvkem ulice se nebere.

### Po opravě (platí)
- Změněno 10 z 28 posuzovaných řezů: **lépe 2, hůř 1, stejně 7**, znaménkový test p = 1,0 (rozdíl neprokázaný; posuzovatel 1: 2 : 1,
  posuzovatel 2: 3 : 0, p = 0,25).
- Střední shoda složení u změněných 0,518 proti 0,469 bez železnice, u všech 28 řezů 0,544 proti 0,526; odchylka šířky uličního prostoru
  8,71 m proti 9,07 m.
- Koleje zapsal aspoň jeden posuzovatel u 26 řezů, aplikace je nakreslila u 9 (dřív 0); **nakreslila železnici, kterou nezapsal žádný
  posuzovatel: 0**. Zbytek jsou koleje dál než 10 m od ulice nebo celé železniční plochy (nádraží), které se do ulice schválně neberou.
- Kontroly: 38 ze 40 beze změny; dva zbylé jsou výpadek (prázdný profil v jednom z běhů, Polsko), ne železnice.
- Regrese `evaluation/ortofoto-osm/regrese.mjs` proti MTVU Prahy a Brna (s dlaždicemi doplněnými o koleje, `regr-tiles.mjs`):
  s `?off=railway` shodně se základem; se zapnutou železnicí složení o 1–9 m správně víc, vozovka navíc a chodník beze změny.
- **Výchozí stav: zapnuto.** Důvody: žádná nakreslená železnice navíc, kontroly beze změny, regrese nehorší, nominálně lépe (2 : 1);
  statisticky to neprokázal malý vzorek (jen 3 řezy, kde se skóre lišilo, ostatní změna kreslí kolej, kterou míra složení nerozliší).
  Pozor: dokud se balíky OSM na R2 nepřestaví, v produkci se nic nezmění (koleje v dlaždicích chybí).

## Doplněk: dosah natažený za stezku (Tikkurilantie ve Vantaa, Via Leopardi v Meranu)
Příčina: odhad končí strany bez domu na „posledním prvku ulice“ (stezka, chodník; pravidlo Generála Šišky z 17. 11. 2026,
`ortho-osm.js`, konec strany), takže natažený dosah nepomůže. Trať Vantaan ratikka (ve výstavbě) v dlaždicích není vůbec
(export bere jen `tram`, `light_rail`, `rail`, `narrow_gauge`, `subway`; `construction` ne) a profil nezastavuje ona, ale ten konec
u stezky. Oprava `?dosah=1`: strana s dosahem nad 22,5 m, který uživatel natáhl, nekončí u posledního prvku, ale jde zelení do dosahu,
k plotu, zdi nebo domu. Tikkurilantie: strana A pokračuje trávníkem (15,6 m) až k plotu lesa 26,7 m od osy; Merano: za chodníkem
zelení do dosahu. Výchozí řez (dosah 22 m) se nemění.
Slepý A/B na 12 řezech s dosahem 32 m (bez koleje, `judge2/`): změněno 6, lépe 0, hůř 1, stejně 5; odchylka šířky 8,48 m proti 7,70 m.
**Proto je výchozí stav vypnuto** (`?dosah=1`); pro Bářin případ funguje, obecně se nezlepšuje. Vzorek byl náhodný, ne případy „trávník
za stezkou“; vhodné měřit znovu na nich.

## Soubory
`scan.mjs`, `choose.mjs`, `select.mjs`, `build.sh`, `pack.mjs`, `regr-tiles.mjs` (data), `collect.js` (běh v aplikaci), `score.mjs`,
`score-stretch.mjs`, `POKYN.md`, `judge/map.json`, `vysledky/` (posuzovatelé, `ab-detail.json`), `linz-rudolfstrasse.png`.
