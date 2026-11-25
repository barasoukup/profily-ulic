# Změření sdílených změn ve státech, kde se neměřily (25. 11. 2026)

Zadání (Bára 25. 11. 2026): změřit mapFill, zákonné stání po pruzích (lawlanes), parkshare, pravidla křižovatek a os a widereach tam,
kde se neměřily. Neposuzovat znovu oficiální řezy; kód řezu neměnit.

**Krátce:** nic se celkem nezlepšilo ani nezhoršilo. Na oficiálních bodech 58 → 58 % (59 ze 402 řezů jinak, lépe 9, hůř 10). Na 226
nových místních ulicích naslepo mapFill 8 : 7 (Zaragoza 0 : 4, ostatní 8 : 3), zákonné stání po pruzích 7 : 8. Prohry mají
konkrétní příčiny ve sdíleném kódu a v modelu aut, ne ve státech (oddíl 4).

## 1. Sběr

Zmrazená kopie kódu b4b8964, čtyři vlastní servery, `?osm=balik`. Každý řez v jednom sběru ve všech ramenech, vypínače přepnuté za běhu;
odpovědi služeb se pro řez pamatují, takže ramena čtou totéž (geodienste.ch nejvýš 1 dotaz za 6,5 s). Skripty: `sample.mjs`, `skore.mjs`,
`zmeny.mjs`, `baliky.mjs`, `fotky.mjs`, `vyhodnoceni.mjs`, `univ-rows.mjs`; sběrač je přepis `../sber.js collect` s mezipamětí
(`sber.js`). Ramena: **N** dnešní kód; **O** všechny vypínače (`mapfill, lawlanes, parkshare, obsluzne, protejsi, ulicky, osaroad, pocetpruhu,
widereach`); u Slovenska **OSK** = O a zákonné stání vypnuté jako dřív; každý vypínač zvlášť. (`osafix` nevypnuté; O není přesně
starý kód: `widereach` vypnuté znamená nikdy 35 m, dřív ho část států měla.)

Sběrač volal `cutAt(lat, lon, false, azimut)`, tedy jako odkaz. Dřívější kolo (24. 11.) 21 ze 467 řezů posunulo (posun od posouzeného
místa 0,4–31 m; polský pl-katowice-4 uložil jiný řez); teď všech 467 přesně (0,00 m), bez chyby sběru.

## 2. Oficiální body (stejné posudky, 467 použitelných řezů, 402 ulic)

| stát | řezů | shoda složení O → N | složení stejné | pruhy stejně | šířka do 1 m | do 2 m | změněno | lépe : hůř : stejně (složení, pak pruhy) |
|---|---|---|---|---|---|---|---|---|
| CZ | 30 | 58 % → **58 %** | 27 % → 27 % | 30 % → 30 % | 30 % → 30 % | 33 % → 33 % | 2 | 1 : 0 : 1 |
| SK | 12 | 84 % → **84 %** | 67 % → 67 % | 75 % → 75 % | 33 % → 33 % | 50 % → 50 % | 0 | 0 : 0 : 0 |
| AT | 29 | 60 % → **58 %** | 17 % → 14 % | 38 % → 38 % | 28 % → 28 % | 45 % → 45 % | 4 | 0 : 1 : 3 |
| DE | 32 | 56 % → **57 %** | 13 % → 16 % | 50 % → 50 % | 16 % → 16 % | 38 % → 38 % | 9 | 2 : 1 : 6 |
| CH | 17 | 61 % → **62 %** | 24 % → 18 % | 47 % → 41 % | 35 % → 29 % | 41 % → 35 % | 4 | 1 : 2 : 1 |
| LI | 6 | 69 % → **69 %** | 33 % → 33 % | 50 % → 50 % | 50 % → 50 % | 67 % → 67 % | 0 | 0 : 0 : 0 |
| NL | 32 | 58 % → **59 %** | 25 % → 25 % | 47 % → 47 % | 41 % → 44 % | 53 % → 56 % | 3 | 2 : 1 : 0 |
| BE | 33 | 48 % → **47 %** | 9 % → 9 % | 36 % → 36 % | 18 % → 18 % | 33 % → 33 % | 2 | 0 : 1 : 1 |
| LU | 12 | 51 % → **51 %** | 25 % → 25 % | 42 % → 42 % | 8 % → 8 % | 25 % → 25 % | 2 | 0 : 0 : 2 |
| PL | 22 | 65 % → **65 %** | 18 % → 18 % | 41 % → 36 % | 23 % → 23 % | 36 % → 36 % | 7 | 0 : 1 : 6 |
| FR | 25 | 58 % → **58 %** | 4 % → 4 % | 56 % → 52 % | 32 % → 32 % | 52 % → 52 % | 3 | 1 : 1 : 1 |
| ES | 23 | 56 % → **56 %** | 13 % → 13 % | 48 % → 52 % | 13 % → 17 % | 22 % → 26 % | 7 | 1 : 1 : 5 |
| PT | 28 | 65 % → **64 %** | 29 % → 29 % | 64 % → 68 % | 25 % → 25 % | 54 % → 54 % | 3 | 0 : 1 : 2 |
| CY | 11 | 55 % → **55 %** | 18 % → 18 % | 82 % → 82 % | 0 % → 0 % | 18 % → 18 % | 2 | 0 : 0 : 2 |
| MT | 8 | 58 % → **58 %** | 13 % → 13 % | 38 % → 38 % | 50 % → 50 % | 75 % → 75 % | 2 | 1 : 0 : 1 |
| IT | 6 | 56 % → **56 %** | 17 % → 17 % | 67 % → 67 % | 0 % → 0 % | 17 % → 17 % | 2 | 0 : 0 : 2 |
| EE | 12 | 44 % → **44 %** | 8 % → 8 % | 33 % → 33 % | 17 % → 17 % | 42 % → 42 % | 2 | 0 : 0 : 2 |
| SI | 8 | 62 % → **62 %** | 25 % → 25 % | 63 % → 63 % | 13 % → 13 % | 38 % → 38 % | 1 | 0 : 0 : 1 |
| LT | 10 | 75 % → **75 %** | 30 % → 30 % | 60 % → 60 % | 30 % → 30 % | 60 % → 60 % | 1 | 0 : 0 : 1 |
| FI | 22 | 52 % → **52 %** | 14 % → 14 % | 41 % → 41 % | 14 % → 14 % | 23 % → 23 % | 2 | 0 : 0 : 2 |
| DK | 24 | 59 % → **59 %** | 17 % → 17 % | 46 % → 46 % | 33 % → 33 % | 50 % → 50 % | 0 | 0 : 0 : 0 |
| vše | 402 | 58 % → **58 %** | 19 % → 19 % | 48 % → 47 % | 25 % → 25 % | 41 % → 41 % | 59 | 9 : 10 : 40 |

Rozdíl oficiálního řádku proti dosavadnímu (AT 61 → 58, LU 53 → 51, SI 56 → 62 …) je zčásti přesné místo řezu, ne změna kódu;
kód je sloupec O → N. Lépe/hůř: shoda složení, při shodě pruhy; u ostatních je rozdíl jen v šířkách.

| vypínač sám | změněno | lépe : hůř |
|---|---|---|
| mapfill | 13 | 5 : 3 (CZ 1:0, DE 2:0, CH 1:1, NL 1:1, BE 0:1) |
| lawlanes | 34 | 2 : 5 (DE 1:1, AT 0:1, NL 0:1, FR 0:1, PT 0:1, ES 1:0; PL 5 beze změny skóre) |
| parkshare | 4 | 0 : 1 (PL) |
| widereach | 9 | 2 : 2 (NL, MT lépe; CH Rue de Sous-Terre a ES Paseo de Recoletos hůř) |
| obsluzne, protejsi, ulicky | 0 | řez uložený na přesném místě se neposouvá, takže se na těchto bodech projevit nemohou |
| osaroad, pocetpruhu | 0 | v místech se neuplatní |

Řezy mimo Česko, kde se něco změnilo, jsou vypsané v `node skore.mjs` (a pro N ze `vysledky/oficialni.json`).
Plně přičtené hůř: at-graz-4 (100 → 60), pt-braga-8, nl-schiedam-5, fr-toulouse-2 (lawlanes), be-mechelen-1 a ch-bern-5 (mapfill),
ch-geneve-6 a es-madrid-4 (widereach), pl-lublin-1 (parkshare).

## 3. Nové ulice (semínko 20261125 + 303, 226 místních ulic, žádná do 150 m od posouzeného bodu)

Změny proti N (vypínač sám): mapfill CH 3 z 12, Berlín 2 z 10, Hamburk 3 z 10, Krakov 4 z 12, SK 4 z 16, Flandry 4 z 12, Zaragoza 7 z 12,
Helsinky 1 (navíc), **NL 0 z 12, Paříž 0 z 12**. lawlanes: PL 4 a Krakov 3, SK 3, Zaragoza 6, Hamburk 3, Flandry 5, BE zbytek 3, PT 4, CH 2, FR 2,
DK 2, ES, IT, FI, EE po 1; NL, Paříž, LT, Berlín 0. parkshare 0, osaroad 1, pocetpruhu a widereach 0. Opravdové změny (rozdíl aspoň 0,25 m
nebo jiné díly): mapfill 26, lawlanes 35, osaroad 1.

Posuzovatelé Sonnet (5 balíčků, každý jiný, X a Y náhodně, zdroje dílů skryté, ortofoto, Mapillary, pokyn `POKYN.md`);
jednotlivý posudek, jistota většinou nízká, jen část ulic má fotky. **N = dnešní kód, O = vypínač vypnutý.**

| mapfill | N : O | stejně / nejde | | lawlanes | N : O | stejně / nejde |
|---|---|---|---|---|---|---|
| DE (Berlín, Hamburk) | 4 : 0 | 0 | | ES (Zaragoza; Valladolid) | 3 : 3 | 0 / 1 |
| SK (Bratislava, B. Bystrica) | 2 : 1 | 1 / 0 | | BE | 1 : 1 | 2 / 3 |
| CH | 1 : 0 | 1 / 1 | | DE | 1 : 0 | 1 / 0 |
| PL (Krakov) | 1 : 1 | 2 / 0 | | CH, DK | 2 : 0 | 1 / 0 |
| BE (Flandry) | 0 : 1 | 2 / 0 | | SK | 0 : 2 | 1 / 0 |
| ES (Zaragoza) | 0 : 4 | 1 / 2 | | PL | 0 : 1 | 4 / 1 |
| FI (Helsinky) | 0 : 0 | 0 / 1 | | PT | 0 : 1 | 2 / 0 |
| **celkem** | **8 : 7** | 7 / 4 | | **celkem** | **7 : 8** | 15 / 5 |

osaroad (Zaragoza, Calle de San Francisco de Borja): N 1 : 0. FR, IT, EE, FI u lawlanes jen „stejně“, NL, Paříž, LT beze změny: tam se
pravidlo neprojevilo, tedy nic neříká. Balíčky ma1, ma2 (mapfill), mb1–3 (lawlanes); posudky `vysledky/posudky.json`.

## 4. Co prohrává a proč (návrhy sdílených oprav, kód se neměnil)

Příčiny jsou z kódu a z ramen (v rameni bez `lawlanes` zákonný pruh zůstal, takže model auta vyloučit nemohl); opravy se nezkoušely.

1. **Piktokoridor není pro `layLaw` jízdní pruh** (`ai-kerbs.js`: `lanes` a `free` berou jen typ `pruh`), takže na ulici s
   `pruh_piktokoridor` se zákonné stání nikdy nevrátí: at-graz-4 (100 → 60 %), Rua António Cândido v Lisabonu (naslepo prohra, jistota
   vysoká), Zaragoza 21 (prohra), cz-kolin-5 (skóre stejné). Návrh: počítat i `pruh_piktokoridor`.
2. **Chodník mezi pruhy se změní v „delici“** (`derive.js markIslands`): pruhy se měří na profilu složeném znovu bez zákonných pruhů;
   chodník do `ISLAND_MAX` mezi dvěma vozovkami u sebe nemá stání, vypadá jako ostrůvek a zůstane jím, i když se stání vrátí
   (Zaragoza 24). Šest řezů: Zaragoza 10, 11, 19, 21, 24 a Hamburk 28; ve všech čtyřech zaragozských prohrách mapFill, ale spolu s bodem 1
   nebo 4. Dvakrát to dopadlo lépe (Hamburk 28, Zaragoza 11 v rameni lawlanes: je tam střední pás). Návrh: `markIslands` při tom druhém
   složení nechat chodník, u něhož při prvním stál zákonný pruh (`lawKerbs`).
3. **Jednosměrka se bez zákonného pruhu rozdělí na dva jízdní pruhy** a vedle nich už zákonné stání nezbude: Kraszewskiego (Krakov),
   Jesenského (B. Bystrica), Bartoňova (Bratislava) naslepo prohra, pt-braga-8 (86 → 71 %, pruhy ale lépe). Návrh: nerozdělovat jednosměrku, kterou
   značí jen šířka (bez `lanes` v OSM a bez čáry z ortofota), dokud se nerozhodne o zákonném stání. Změřit zvlášť.
4. **Model auta nevidí** a zákonný pruh vrátí do vozovky, v mapě povrchů (mapFill): Zaragoza 10, 11, 19 (PNOA, stromořadí),
   Halvestraat v Lovani, be-mechelen-1. Opravdová mez modelu na ortofotu; stejný princip v Helsinkách, Česku a Německu vyhrál. Nápad k vyzkoušení (pravidlo
   dat, ne státu): „auta nejsou“ brát vážně jen u ostrého snímku a tam, kde u obruby není koruna stromu.
5. **widereach** 2 : 2: Rue de Sous-Terre v Ženevě (bere souběžnou ulici) a Paseo de Recoletos (park) hůř, Ringweg-Oost v Diemenu a Triq
   l-Imdina lépe.

Rue Belle Vue v Lutychu (naslepo prohra) není chyba: zákon by dva pruhy stání ve 7 m obousměrce nedovolil, auta tam ale stojí.

## 5. Šum a meze

- **Šum sběru:** oficiální body znovu v čerstvém sběru 294 řezů (N i O; bez CH a LI) a 107 nových (N). Kde ortofoto odpovědělo, vyšly **všechny
  stejně**. Liší se 17 z 294 a 2 ze 107, všechny proto, že v druhém sběru vypadlo ortofoto: IGN Francie (504 a 502), DGT Portugalsko
  (2025 nedostupné, záloha satelit), Geoportal PL (1), Wallonia (1), v prvním sběru nic nevypadlo (jediné hlášení: Sasko jeden dotaz). Aplikace je tedy bez výpadku deterministická; rozdíl profilů
  mezi dvěma koly dřív byl posun řezu a výpadky ortofota. Tytéž výpadky ukazují, že profil francouzských a portugalských řezů při
  výpadku spadne na OSM, a to bez poznámky v číslech: sběr se musí kontrolovat (`M.stats().fails`).
- **Posuzovatelé:** jeden Sonnet na balíček, bez opakování, jistota většinou nízká; u dvou změn stejného řezu (N v obou balíčcích) je
  shoda slabá. Rozdíly 8 : 7 a 7 : 8 jsou remízy, nelze z nich vyvodit zhoršení; spolehlivé jsou jen příčiny 1 a 2 (čtené v kódu).
- **Nezměřeno:** NL, Paříž, LT (žádná změna); IT, FI, EE, FR u lawlanes jen „stejně“; Švýcarsko jen Curych, Bern, Basilej, 12 ulic; SI, CY, MT, LU
  (zákonný odhad) mimo zadání nových ulic, jen na oficiálních bodech; Aargau a jiné kantony ne. Ortofota Portugalska pro 3 řezy posuzovateli
  nešla stáhnout (spojení na DGT), posoudil jen fotky. Z pravidel křižovatek (`obsluzne`, `protejsi`, `ulicky`) se na nových ulicích nic neměřilo: ramena řežou na místě, kam dosedlo kliknutí dnešního kódu.
- **Vedlejší nález:** uložený řez dvouvozovkové ulice se otevře na stejném místě, ale jeho nejbližší cesta OSM může být jiná (bez `wayId`
  v odkazu): z 226 kliknutí znovu přesně otevřených se 10 chytlo jiné cesty, u 7 vyšel jiný profil (Amsinckstraße, Versmannstraße, Aia,
  Sucha, Ludwinowska…). Zaragoza 9: první kliknutí zmapovalo odhad, druhé mapu (výpadek). Řešení: uložit do odkazu i cestu (`way`), jinak je „přesně
  stejný“ jen místo. Neopraveno, rozhodne Bára.

Soubory: `kandidati.json`, `body.json` (226), `vysledky/oficialni.json`, `nove.json` (ramena stejná s N vynechána), `znacky.json` (cesta řezu),
`sum.json` (druhý sběr), `posudky.json`, klíče. Ortofota a fotky (`data/`) git ignoruje.
