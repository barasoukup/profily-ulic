# Malé domy o samotě a paneláky v zahraničí (Bára 27. 11. 2026)

## 1. Malý dům o samotě (zapnuto, `?off=vesnice` vypne)
Příčina: Girbigsdorfer Straße (vesnice u Görlitz). Dům z OSM bez podlaží, výšky a druhu (`building=yes`) dostal v `abroadStyle`
„sikma" (činžák, výchozí 5 podlaží), čtvercový půdorys vyplňující obdélník dokonce „povalecny" (podle tvaru deska).
Pravidlo (`house-looks.js smallHouse`, `profile.js smallKind`; všude stejně, žádná podmínka na stát): bez podlaží i výšky, vlastní
půdorys do 250 m², nejvýš 3 spojené budovy a všechny dohromady do 450 m² (dům s garáží a kůlnou) = rodinný dům (`familyKind`, roku
podle `start_date`; spojené části nejsou řada); půdorys pod 30 m² = garáž. Kanceláře a domy s podlažími či výškou beze změny.
Do `buildingAt` přibyl `footprint` (m²) a `block.area`. `countries/*.js houseLook` běží až po tomto výsledku (vila se dál
mění podle místa), `houseDetails` se nemění.
Hustotu zástavby okolí jsem nepřidával: pravidlo vyhrálo bez ní.

Slepé A/B: 40 domů s fotkou Mapillary (AT, BE, DE, DK, LT po 8, města i vesnice, semínko 20261127), dva posuzovatelé Sonnet,
neutrální pokyn `POKYN.md`. S pravidlem lépe : bez pravidla lépe: **25 : 3** a **24 : 2** (stejně 3 a 5, nelze 9). Správně
(kresba „right") 1 → 17 a 1 → 11 z 40. Podle změny: sikma>vila 11 : 1, povalecny>vila 7 : 1, cihlovy>vila 3 : 0, plocha>vila 3 : 0,
funkce>vila 0 : 1 (jediná prohra). Kontroly: 615 domů s podlažími nebo výškou ve stejných vzorcích, **změněných 0** (podmínka
`!n`); testy 554 v pořádku. Kolik domů se mění: AT 82 z 371, BE 47 z 442, DE 55 z 558, DK 79 z 649, LT 26 z 115 (vesnice zhruba polovina).
Vzorky `vzoreka-*.json` (bez fotek), skripty `sample.mjs`, `sheets.mjs`, `score.mjs`.

## 2. Panelák v zahraničí jen při silném doložení (nezapnuto, `?panel2=1`)
Příčina Lipska: čtyři spojené městské domy v ohnuté řadě (bounding box 160 × 54 m, vyplnění 0,29) prošly druhou větví `isSlab`
(`parts ≥ 2` a obvod na část ≥ 30 m). Pravidlo `strictSlab` (jen kde platí socialistické vzhledy a mimo Česko): deska z tvaru jen
dlouhá kompaktní (vyplnění ≥ 0,8, šířka ≤ 16, délka ≥ 25) nebo řetěz (≥ 2 části, vyplnění ≥ 0,5, šířka ≤ 20); doložení rokem
(`flatKind`) a OSM `building:prefabricated=yes` / materiál panel (`info.panel`) zůstává. Barvu střechy z ortofota jsem neřešil.
Blind A/B (EE, LT, PL po 12, jen domy, kde se kresba změní: plocha > sikma/funkce): **11 : 12 a 14 : 10** pro nové : staré (LT 2 : 7 a 3 : 5 –
sovětské bloky se ztratily, EE a PL spíš nové). Kontrola na ověřených vzorcích `all-buildings` (`controls-old.mjs`): skutečné paneláky
SK10, SK12, LT08 zůstaly; ztratily se řadové/bloky se 3+ částmi (LTx01 sovětský blok, PL07). **Nevyhrálo, proto výchozí je staré
chování**; Lipsko tedy zůstává panelákem, dokud se pravidlo nedoladí (např. jen DE: jednotlivá doložení rokem / „bytový blok
v ulici" podle OSM `addr` + rovné čáry). DE vzorek nedoběhl (9 domů z 12 bez JSON), Slovensko nic.
