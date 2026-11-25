# Vzhled domu ze všech budov OSM (Bára 25. 11. 2026)

Dřív četl vzhled domu jen budovy OSM s podlažími nebo výškou, všechny jen v USA (`allBuildings`). Teď všude stejně
(`derive.js buildingAt`, `?off=vsedomy` staré chování), příznak je zrušený, **výjimka nezůstala žádná**. Test zastavěného
území čte dál jen budovy s podlažími nebo výškou.

Vzorek `sample.mjs`: náhodné domy ve městech univerzálního vzorku (pevné semínko), změněný = jiná kresba; registr budov
(ČR, SK, NL, FR, ES, EE…) má dál přednost, OSM je druhé. Fotka Mapillary, archy `sheets.mjs`, posuzovaly naslepo samostatní
agenti Sonnet (`POKYN.md`), `score.mjs`. Fotky v gitu nejsou.

## Kolik domů se mění
Domů se stejným nálezem OSM přibylo hodně (AT 88 → 172 ze 175), kresba se mění méně: AT 39/175, DE 15/111, BE 20/33, PL 24/149,
PT 34/117, CH 57/203, LT 15/60, IT 30/108, LU 60/126, SK 77/329, NL 26/97, FR 32/344, ES 15/213, **CZ 37/900**. Garáže a kůlny pod
řezem: 2–7 na stát, kreslí se jako garáž (jako dům jen DE 1, LU 1, PL 1).

## 1. kolo (153 domů, 13 států, bez nových pravidel)
| | nové lépe | staré lépe | stejně | nelze |
|---|---|---|---|---|
| AT | 3 | 3 | 4 | 2 |
| BE | 5 | 6 | 1 | 0 |
| CH | 8 | 2 | 0 | 1 |
| CZ | 3 | 0 | 6 | 1 |
| DE | 6 | 0 | 4 | 2 |
| FR | 1 | 3 | 7 | 1 |
| IT | 3 | 2 | 5 | 2 |
| LT | 3 | 5 | 2 | 2 |
| LU | 6 | 0 | 4 | 2 |
| NL | 5 | 1 | 2 | 4 |
| PL | 3 | 5 | 4 | 0 |
| PT | 6 | 3 | 1 | 2 |
| SK | 5 | 1 | 5 | 1 |
| **celkem** | **57** | **31** | 45 | 20 |

Správně 16 → 41, špatně 63 → 42. Prohry měly dvě společné příčiny:
- **Panelák jen z tvaru** (PL, LT): budova bez podlaží i druhu byla podle půdorysu panelák (nové 1 : 4). Pravidlo `abroadStyle`: kde
  se paneláky stavěly, tvar bloku sám panelák nedělá. Na západě (poválečný dům) tentýž odhad vyhrál (asi 9 : 1), zůstává.
- **Řadový dům bez podlaží ve Flandrech** (1 : 5) byl přízemní domek. Pravidlo `brickLook`: dům v řadě neznámých podlaží je
  cihlový městský dům.
Obě pravidla jsou společná, bez podmínky na stát.

## 2. kolo (72 nových domů, jiné semínko, s pravidly)
| | nové lépe | staré lépe | stejně | nelze |
|---|---|---|---|---|
| BE | 6 | 4 | 1 | 1 |
| DE | 7 | 3 | 1 | 1 |
| EE | 3 | 2 | 3 | 4 |
| FR | 3 | 1 | 7 | 1 |
| LT | 8 | 1 | 2 | 1 |
| PL | 5 | 2 | 4 | 1 |
| **celkem** | **32** | **13** | 18 | 9 |

Správně 5 → 16, špatně 34 → 21. Žádný stát neprohrává.

## Zbylé chyby
Řadové domy Valonska bez podlaží (`nizky` má výchozí jedno podlaží, skutečnost 2–3), obchody bez podlaží ve starém městě jako
hala (PT 0 : 2), historické úřady a hotely jako kancelář (nerozhodně). Rakousko bylo v 1. kole nerozhodné (3 : 3), 2. kolo tam nebylo, čerstvý vzorek níže.

## Rakousko, čerstvý vzorek (25. 11. 2026, větev estonia)
18 změněných domů s fotkou z 238 (61 změněných), jeden vyřazený (40 m od domu 1. kola), semínko 772025, samostatný posuzovatel
Sonnet (`vzorek3-AT.json`, `vysledky/posudek3-AT.json`): **nové lépe 3, staré lépe 6**, stejně 3, nelze 5. S 1. kolem 6 : 9
(p = 0,6). Prohrává `sikma>povalecny` (0 : 4, jeden stejně, tři nelze): dům bez podlaží je podle půdorysu poválečný dům, na
fotkách jsou starší domy. `kancelar` 1 : 1, `garaz` 1 : 0, `povalecny>sikma` 1 : 1. Výjimka není; rozhodne Bára.

Na `estonia` kreslí archy `north-america-art/houses/render.mjs` z větve `north-america-art` (`sheets.mjs`).

## Blok kolem dvora není poválečný dům (25. 11. 2026, čerstvý vzorek): nevyhrálo, v aplikaci není
**Co udělalo `povalecny` v 1.–3. kole** (mimo paneláky; nové : staré proti `?off=vsedomy`). Úzká deska (fill ≥ 0,65, šířka ≤ 16 m):
AT 0 : 1, CH 1 : 1, PT 2 : 0. Málo dlouhých částí (parts ≥ 2, 30 m na část): AT 1 : 5 (z toho zámek), **CH 4 : 0**, IT 2 : 1, LU 1 : 0,
BE 1 : 0, PT 2 : 0. Čtyři z pěti švýcarských výher jsou tedy z téže části jako rakouské prohry. Skoro žádný blok dvůr
neuzavírá (z geometrie OSM 1 m: CH09 ano, ostatní výhry ani prohry ne), díra v obrysu je jen u paláce; řídké vyplnění obdélníku
(< 0,6) oddělilo 7 výher od 6 proher, vzalo by i CH04 a CH09. Hloubka křídla (výhry 8–17 m, prohry 9–17 m) ani podíl
volné plochy uzavřené z 10 a 12 ze 16 směrů je neoddělily. Nejlépe oddělilo: 3 a víc částí a vyplnění konvexního obalu < 0,7
(4 prohry, 1 výhra; L ze dvou desek zůstává deskou).

**Zmrazené pravidlo** (`yard-rule.patch`, `house-looks.js isWesternSlab`, `?off=dvorana`): kde se paneláky nestavěly, takový blok
podle části „dlouhé části“ deska není; zámek, nádraží, stadion, most, hausbót, stavba, kůlna apod. podle tvaru vůbec ne. Platí
i pro Haussmannův dům Francie a Lucemburska. Kde se stavěly (CZ, SK, PL, EE, LT, bývalá NDR), se nemění nic: 443 + 384 + 371 + 132 + 229 domů
bez rozdílu, kontrola paneláků proti RÚIAN (`budovy-panel`, 840 domů ČR) řádek po řádku stejná.

Změní se (náhodné domy ve městech vzorku): AT 52 z 1665, CH 105 z 5829, DE 12 z 1049, BE 18 z 3131, LU 43 z 4549, FR 16 z 2980, IT 26 z 437,
DK 15 ze 110, FI 30 z 301. Jiný vzorek (domy ve středech měst, registr ne): SI 2 z 273, ES 2 z 331, PT 4 ze 414; NL, MT, CY, MC 0.

**Naslepo** (`yard-sample.mjs`, `yard-sheets.mjs`, `POKYN4.md`, `yard-score.mjs`; nové semínko, 40 m od dřívějších kol, 80 m od sebe): 129
změněných domů s fotkou, AT 30, CH 30, DE, BE, FR, IT 10, LU 9 (víc s fotkou není), navíc DK a FI po 10, protože se tam mění nejvíc;
dva posuzovatelé Sonnet na dům, tři varianty na archu. Dům patří straně, proti které není ani jeden hlas.

| | nové : dnešek | nové : `?off=vsedomy` | dnešek : `?off=vsedomy` |
|---|---|---|---|
| AT | 17 : 10 | 9 : 5 | 5 : 8 |
| CH | 9 : 14 | 3 : 7 | 7 : 6 |
| DE | 3 : 5 | 2 : 2 | 3 : 1 |
| BE | 3 : 5 | 0 : 2 | 3 : 3 |
| FR | 2 : 3 | 1 : 2 | 1 : 1 |
| IT | 3 : 1 | 0 : 1 | 0 : 3 |
| LU | 3 : 2 | 0 : 0 | 2 : 3 |
| DK | 6 : 3 | 1 : 0 | 3 : 5 |
| FI | 1 : 7 | 1 : 2 | 5 : 0 |
| **celkem** | **47 : 50** (p = 0,84) | 17 : 21 (p = 0,63) | 29 : 30 (p = 1) |
| shoda dvou posuzovatelů | 90 ze 115 | 103 ze 110 | 57 ze 75 |

Zbytek do počtu domů je stejně, opačně nebo nelze poznat (14 domů). Jen AT 17 : 10 má p = 0,25; jen CH 9 : 14 p = 0,41. U bloku tohoto tvaru stojí
zhruba stejně často starý činžák jako blok po válce; data OSM je nerozliší.

**Rozhodnutí:** vypnuto, v aplikaci zůstává dnešní stav; Švýcarsko by o zisk přišlo. Rozdíl Rakouska (17 : 10) a Finska (1 : 7) je skutečný rozdíl
zástavby, ne tvaru, a výjimku státu jsem nedělal.

**Stojí čtení všech budov v Rakousku za to?** Na blocích kolem dvora dnešek : `?off=vsedomy` 5 : 8, na ostatních změněných domech (30 s fotkou,
`ATa…`) **13 : 9** (stejně 4, nelze 4, p = 0,52, shoda 22 z 26). S 1. a 3. kolem (3 : 3 a 3 : 6) je to na náhodných změněných domech 19 : 18.
Bloků kolem dvora, které čtení mění, je mezi 437 změněnými domy jen malá část, ostatní mírně vyhrávají: prohra není, výhra také ne. **Bára 25. 11. 2026: Rakousko zůstává na společném pravidle.**
