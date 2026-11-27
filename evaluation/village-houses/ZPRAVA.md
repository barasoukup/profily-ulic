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

## 2. Panelák v zahraničí jen při shodě více znaků (zapnuto, `?off=panel2` vypne)
Kde platí socialistické vzhledy a mimo Česko (Česko má RÚIAN) dělá desku skóre (`house-looks.js panelScore`, PANEL_SCORE 3), ne
tvar bloku. Znaky z OSM (`derive.js ownShape`, `aroundOf`): přesný obdélník vlastního půdorysu (vyplnění nejmenšího obdélníku pod
0,7 = nikdy panelák; 0,7 → 1 bod, 0,8 → 1,5), volný prostor (zastavěno jinými budovami do 80 m ≤ 0,2 → 1, ≤ 0,12 → 1,5), velikost
(půdorys ≥ 500 m² nebo 8+ podlaží → 1), zeleň (≥ 20 % okolí z OSM trávy, lesa, parku, zahrady → 0,5). Poloha mimo centrum se
nahrazuje zastavěností okolí (centra zahraničí aplikace nezná). Doložení rokem panelové éry a OSM `building:prefabricated` /
materiál panel zůstává silnější. Uložený řez bez těchto polí čte staré pravidlo (`isSlab`).
Lipsko (6 NP v centru, podle Bářina odkazu): oba domy teď „sikma" (rect 0,68 a 0,34, zastavěno 0,3).

A/B naslepo (dva posuzovatelé Sonnet, domy s fotkou, kde se kresba mění), 2 kola, EE, LT, PL, DE: 1. kolo (jen nad starším
tvrdším pravidlem, přepočteno na skóre, 33 domů) 10 : 11 a 13 : 8; **čerstvé 2. kolo (36 domů, jiné semínko, DE, EE, LT, PL po 9)
16 : 16 a 15 : 13** pro nové : staré. Dohromady 54 : 48 (nevýznamné). Kresba panelu u změněných domů: dosavadní pravidlo kreslilo
panelák 130× (hodnoceno), z toho 35× špatně a 27× správně; nové přidalo 14 paneláků, z nich 7× správně a 1× špatně. Tedy méně falešných
než ztracených skutečných (35 odstraněných špatných : 27 odstraněných správných), bez zhoršení celku; podle Bářina pokynu „raději
panelák nedat než ho dát, když tam není" **zapnuto**. V Německu (9 domů) vyšlo 3 : 5 a 2 : 5 pro staré, malý vzorek.
Zbytek: skutečné paneláky vzorků `all-buildings` SK10, SK12, LTx01 mají skóre 1,5–2,5 a zmizí (SK12 a LTx01 těsně pod prahem; SK12 =
čtvercový dům, panelák z druhé strany ulice), LT08 (3 NP, dům v zástavbě 0,46) a PL07 (obdélník 0,48) také. Falešné z neměnné
geometrie zůstávají (kasárna PLp09, vysoká obdélníková kancelář LTx05). Slovensko vzorek nedoběhl.
Skripty `features.mjs`, `score-panel.mjs`, `controls-old.mjs` (pozor: čte staré info bez `own` a `around`, tedy staré pravidlo).
