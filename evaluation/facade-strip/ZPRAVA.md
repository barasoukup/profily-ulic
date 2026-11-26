# A/B: proužek „plocha“ u fasády za chodníkem mapy povrchů (26. 11. 2026)

Backlog: „Finsko, zbytky recenze 24. 11. 2026“ (proužek plochy do 1,5 m u fasády přičíst k chodníku) a „Paříž“ (u fasády
pruh plochy 0,65 m mezi domem z OSM a chodníkem Plan de voirie). Obojí dělá stejné místo kódu: doplnění kolem mapy
povrchů (`ortho-osm.js besidePassport`), které mezeru mezi posledním chodníkem mapy a domem vyplní „plochou před domem“.
Proto **sdílené pravidlo pro všechny mapy povrchů** (všechny moduly s `passport: true`, i české pasporty), žádná výjimka
pro stát.

## Pravidlo (`ortho-osm.js facadeStrip`, `?off=fasada` vypne)

Kde strana končí u domu (dům mapy nebo OSM, ne plot ani konec za stropem) a poslední doplněný díl je zpevněná plocha
nejvýš 1,5 m široká, za kterou směrem k ulici leží chodník (mapy nebo doplněný), je ten díl chodník (`chodník u fasády
(odhad)`); `deriveProfile` ho spojí se sousedním chodníkem. Zeleň, plocha širší než 1,5 m, plocha před plotem nebo bez
chodníku zůstávají. Známé případy: Rue des Tournelles (pa12, 0,65 m), Rue Alain Chartier (pa32), Rue Chevert (pa20).

## Vzorek a sběr

- `sample.mjs` (semínko 20261126): 40 bodů Paříže, 40 Helsinek (10 čtvrtí), kontroly po 8 bodech v Tallinnu, Vilniusu,
  Bratislavě, Amsterdamu a Berlíně; nic do 60 m od bodů dřívějších A/B. Sběr `sber.js collectFacade` (localhost,
  `?osm=balik`), O = `?off=fasada`, N = pravidlo. Změnily se jen 4 ze 120 (`vysledky/rezy-1.json`).
- Proto druhý vzorek `sample2.mjs` (semínko 20261127): 200 bodů Paříže a 120 Helsinek, každý řezán s pravidlem a jen tam,
  kde proužek opravdu přidal k chodníku (počítadlo `P.dbg.facade`), znovu bez něj (`sber.js screenFacade`,
  `vysledky/rezy-2-sber.json`): 27 z 320, liší se 26.
- Kontroly: Vilnius, Bratislava, Amsterdam a Berlín beze změny ve všech 32 řezech; Tallinn změna v 1 z 8.

## Slepé posouzení

30 řezů, které se liší (26 Paříž, 3 Helsinky, 1 Tallinn; `vysledky/rezy-lisi.json`), dva samostatní posuzovatelé
(subagenti, každý jiným pořadím, bez kódu a klíče): ortofoto bez čar aplikace, fotky Mapillary (nejnovější do 30 m),
profily jako X a Y v náhodném pořadí (`baliky.mjs`, klíč `vysledky/klic-fasada.json`, posudky `posudky-fasada-1|2.json`,
sečteno `node evaluation/facade-strip/skore.mjs evaluation/facade-strip fasada`).

| | lépe N (pravidlo) | lépe O | stejně | nejde |
|---|---|---|---|---|
| posuzovatel 1 | **27** | 1 | 1 | 1 |
| posuzovatel 2 | **13** | 1 | 2 | 14 |
| shoda obou | **12** | 1 | – | 1 (neshoda 16, skoro vše „nejde“ druhého) |

- N lépe: na fotkách vede chodník až k fasádě (výlohy, sokl, terasa kavárny), proužek plochy tam není.
- O lépe (oba): Vambola v Tallinnu, dům za nízkou zídkou s předprostorem.
- Druhý posuzovatel bez fotky proužek na ortofotu nerozezná („nejde“ 14×), proti pravidlu nehlasoval jinde.

## Kontroly

- Regrese odhadu (`node evaluation/ortofoto-osm/regrese.mjs`): beze změny proti `vysledky/regrese.txt` (pravidlo se
  týká jen doplnění kolem mapy). `node evaluation/canada/dc-same.mjs`: beze změny. `npm test` (test `tests/facade-trim.test.js`).

## Závěr

Pravidlo vyhrálo průkazně (12 : 1 ve shodě obou, 27 : 1 a 13 : 1 jednotlivě) a kontroly nezhoršilo, **zůstává zapnuté**
(`?off=fasada` vypne). Sloučený chodník převezme zdroj jednoho z dílů (někdy „odhad“ místo „pasport“).

Fotky, ortofota a balíčky (`data/`) jen lokálně.
