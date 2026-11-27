# A/B: ořez odhadnutých vozovek kolem vozovky pasportu (Rožnov, Šlapanice; 26. 11. 2026)

Backlog „Pasporty Rožnova a Šlapanic“: vozovka 20–27 m přes dvory a sousední komunikace (`../../PASSPORTS-AB.md`, Rožnov
č. 39, 43, 44, 54, 59, 63; Šlapanice č. 21, 23, 26).

## Příčina

Pasport sám je úzký (Sadová č. 39: vozovka pasportu −3,2 až 1,6 m). Široká vozovka je z DTM ČÚZK, který pasportová města
čtou přes obrázek DMVS (`towns/overlay.js overDmvs` → `dmvs.js surfaces` bez WFS kraje): bílá plocha obrázku, na jejíž typ
se aplikace nezeptala (nejvýš 16 dotazů na řez, nejbližší první), je podle barvy „vozovka (odhad)“, a v Rožnově bývá
jedna taková plocha přes celou čtvrť (č. 39: 98 × 158 m). Druhým zdrojem je parcela silnice RÚIAN, kterou `dmvs.js` dělá
vozovkou, když je pod středem řezu díra v DTM (tou dírou je tu právě vozovka pasportu).

## Pravidlo (`towns/overlay.js trimGuessedRoads`, `?orez=0` vypne)

Má-li pasport vozovku pod středem řezu (střed bboxu), je ulicí on: bílé plochy DTM bez zjištěného typu (vozovka jen podle
barvy) se vynechají a parcela silnice RÚIAN (`dmvs.js` ji označí `ROAD_PARCEL`) je zeleň jako mimo díru. Změřené vozovky DTM
zůstávají. Platí pro všechny moduly s `overDmvs` (pasporty Rožnova, Šlapanic a Kuřimi, Frýdek-Místek, Karviná, Třebíč).

Známé případy (starý vzorek, `CITY=roznov VARIANTS=pasport-bez-orezu,city node evaluation/ab.mjs`): Rožnov se změnil
v 8 z 63, Sadová (39) 25,4 → 5,1 m, Sladské (43) 24,1 → 4,4, Bačová (44) 24,6 → 3,4, U Kantorka (54) 27,6 → 5,1,
V Mokrém (63) 20,0 → 11,1 m (zbývá druhý polygon pasportu, souběžná cesta), Dolní Paseky (59) beze změny (široký je tu
sám polygon pasportu). Šlapanice 3 z 31 (č. 22 bez dělicího pásu), Kuřim 5 z 48 (Hybešova 38: 23 m vozovky pryč).

## Slepé A/B na nových řezech

`sample.mjs`: náhodné body na místních ulicích (délkově vážené, nic do 60 m od starého vzorku ani 80 m od sebe), Rožnov
150 (semínko 20261126), Šlapanice 90. Sběr `evaluation/ab.mjs` s `SAMPLES=…/samples-orez.json`, O = varianta
`variants/pasport-bez-orezu.mjs` (`?orez=0`), N = dnešní kód; řezy, které se liší (`rows.mjs`, `results/rezy-*-lisi.json`:
Rožnov 59 ze 150, Šlapanice 23 z 90), posoudili dva samostatní posuzovatelé (subagenti, ortofoto ČÚZK bez čar aplikace,
fotky Mapillary jen ve Šlapanicích, X a Y náhodně; `../facade-strip/packages.mjs`, klíče a posudky ve `results/`, sečteno
`node evaluation/archive/facade-strip/score.mjs evaluation/archive/passports-trim orez-roznov`).

| město | posuzovatel 1 N : O | posuzovatel 2 N : O | shoda obou N : O | stejně (shoda) |
|---|---|---|---|---|
| Rožnov | 31 : 9 | 33 : 7 | **30 : 6** | 12 |
| Šlapanice | 14 : 5 | 14 : 4 | **13 : 3** | 3 |

- N lépe: odhad už nekreslí 15–44 m vozovky se stáním a krajnicemi přes zahrady, dvory, louky a domy; úzké cesty mají
  jeden pruh skutečné šířky.
- O lépe: kde bílá plocha byla opravdu vozovka za okrajem pasportu (auta stojí u živého plotu, Rožnov 46, 135, 128;
  Šlapanice 36, 48): ořez tam zúží vozovku nebo vezme stání.

## Kontroly

- Ostatní moduly s `overDmvs` na starých vzorcích (`OLD=1 node rows.mjs kurim trebic karvina`): Kuřim 5 ze 48 změněno,
  Třebíč 7 ze 77, Karviná 6 (z 30 řezů, kde server města z Node odpověděl; 56 „chybí“ v obou variantách), Frýdek-Místek
  0 (z 30 s odpovědí). Těch 18 změněných posouzeno naslepo stejně (`orez-kontroly`): posuzovatelé 7 : 1 a 7 : 2,
  **shoda obou 7 : 1** (prohra: Třebíč č. 39, vozovka 5 místo 6 m), stejně 7.
- Regrese odhadu z ortofota a OSM a `dc-same`: beze změny (týká se jen českých pasportů nad DTM). `npm test` (test
  `tests/facade-trim.test.js`).

## Závěr

Ořez vyhrál průkazně v obou městech zvlášť (Rožnov 30 : 6, Šlapanice 13 : 3), **zůstává zapnutý** (`?orez=0` vypne).
O pasportech Šlapanic a Kuřimi jako celku rozhoduje Bára podle souběžného měření; tahle oprava je na něm nezávislá.
Zbývá: široký polygon samotného pasportu (Rožnov 59, 63) a úzká vozovka pasportu za chodníkem jako „dělicí pás“
(`derive.js`).

Data (`evaluation/<město>/data/`) jen lokálně.
