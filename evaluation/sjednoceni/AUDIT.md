# Sjednocení výjimek: audit příznaků (24. 11. 2026)

Bára 24. 11. 2026: co nejvíc ve sdíleném kódu, co nejméně výjimek. Výjimka zůstane jen s naměřeným důvodem nebo tam,
kde odráží skutečný rozdíl v zákoně, normách nebo datech. Opatrnost, „nevyzkoušeno“ ani „nechtěli jsme na to sahat“
důvodem nejsou. Vzor: e0494e5 (mapFill v Česku, slepé A/B 90 řezů, příznak zrušený).

Prošlé soubory: `pilot/public/countries/*.js` (default.js a 22 států), `towns/*.js`, `city.js` a čtení `country.<x>`,
`city.<x>` a `city.fix` v `app.js`, `derive.js`, `ortho-osm.js`, `lanes-ortho.js`, `ai-kerbs.js`, `rules.js`,
`profile.js`, `sources.js`, `gis.js`. `ortho-osm.js`, `ai-kerbs.js` a `lanes-ortho.js` podle státu nevětví (jen podle
zdroje ortofota při jeho stahování).

Třídy: **(a)** oprávněný rozdíl (zákon, normy, značky, zdroj dat, jazyk a texty, ilustrace); **(b)** naměřená výjimka;
**(c)** jen opatrnost nebo neznámý důvod: kandidát na sjednocení.

## Příznaky, které mění chování výpočtu profilu

| příznak | kde se liší od výchozího | co dělá | důvod u kódu | měření | třída |
|---|---|---|---|---|---|
| `besidePassport` | výchozí false: CZ, BE, LU, AT (a cizina); true: SK, DE, CH, NL, PL, FR, ES, PT, IT, EE, SI, FI, DK, LT | za koncem pasportu nebo mapy města doplní kusy až k domu (ortofoto, model, čáry mapy) | CZ žádný; BE a LU nemají mapu s `passport` (příznak mrtvý), AT také ne | žádné pro CZ | **(c)** |
| `besideMax` | null (15 m) v CZ, SK a výchozím; 25 m všude jinde, kde je `besidePassport` | jak daleko za pasportem se doplňuje | DE: předzahrádky Cách 15–18 m; ostatní převzaly | jen pozorování v Cáchách | **(c)** |
| `parkGuess` | false: SK, MC; jinde true | zákonný odhad podélného stání v místních ulicích | SK: „nevyzkoušeno“, Bára 16. 11. po prohlídce slovenských řezů (4504dfc, ještě bez modelu aut); MC: Code de la route čl. 31 (stání jen na vyznačených místech) | SK žádné počítané; AT a DE zapnuté po měření 17. 11. (chybí stání 14 → 11, 15 → 8) | SK **(c)**, MC (a) |
| `wideRoads` | false: CZ (výchozí); true všude jinde | dálnice a silnice pro motorová vozidla dostanou dosah 35 m | „Fable: not tried on Czech motorways“ | žádné | **(c)** |
| `wideStreets` | jen CY, DK, EE, ES, FI, FR (MC), IT, LT, MT, PT, SI | hlavní ulice, jejíž strana končí na dosahu ve středovém pásu, promenádě nebo chodníku, dostane dosah 35 m | Paříž (51dfd19, bulváry), do dalších států zkopírováno | jen Paříž | **(c)** |
| `roadClassFromOsm` | false: CZ, SK (výchozí); true jinde | skupina ulice z OSM `highway`, kde město nemá svou třídu (TSK v Praze) | „Austria has no street classes of its own“ | žádné | **(c)**, na geometrii profilu bez vlivu (strop pruhu dálnice 3,75 m dává `LANE_CAP` stejně), mění jen normu pro varování |
| `city.fix.serviceJunctions` (zrušeno 25. 11.) | všechna česká města kromě Prahy; v cizině nikde | obslužná cesta (ne vjezd ani parkoviště) se počítá jako křižovatka, řez od ní odskočí | Brno: boční ulice jsou v OSM `service` (Kohoutova) | Praha 9. 11. 2026 (7757f5a), 100 řezů: 1 lépe, 2 hůř (č. 20 posun o obslužnou cestu na horší místo); cizina nikdy | Praha **(b)**, cizina **(c)** |
| `city.fix.axisToRoadway` (zrušeno 25. 11.) | jako výše | osa OSM do 4,5 m vedle vozovky mapy se přesune na vozovku | Brno, 100 řezů: osy 2–4 m vedle | Praha jako výše (č. 42 středový pás jako pruh 1,55 m); cizina nikdy | Praha **(b)**, cizina **(c)** |
| `city.fix.roadUnderAxis` (zrušeno 25. 11.) | jako výše | zpevněná plocha nebo dvůr (1003, 603) do 25 m pod osou ulice je vozovka (odhad) | Brno: MTVU kóduje přestavěnou silnici jako manipulační plochu | Praha jako výše; cizina nikdy | Praha **(b)**, cizina **(c)** |
| `city.bedPanels` | Plzeň | tramvajové těleso bez údaje je z panelů | data Plzně (A/B) | A/B Plzně | (a) |
| `city.roadOnPath` | jen Praha | chodník/cesta MTVU (702) aspoň 5 m pod silnicí OSM je vozovka (odhad), když vozovku mapa v řezu nemá | hlášení Poncarové: dvoupruhová silnice kódovaná 702 | 142 pražských řezů beze změny (jen neutralita v Praze) | **(c)**, nízký dopad |
| `trackWidth` | DK 2,25 m | šířka cyklostezky z tagů OSM bez šířky | dánská příručka Tværprofiler i byer | recenze 24. 11. | (a) norma |
| `freeLane`, `lawNeed`, `parkOnRoadway`, `parkByCycleLane` | po státech | zákon o stání (volný pruh, SI bez stání na obousměrce bez osy, CH a NL ne vedle cyklopruhu) | zákony států | – | (a) |
| `leftHand` | CY, MT | jízda vlevo | zákon | – | (a) |
| `laneOrtho`, `bedOrtho`, `city.laneOrtho`, `orthoHereAt` | po státech a městech | které ortofoto (a zda je smí použít: LT „none“) | zdroj dat a licence | – | (a) |
| `limits`, `contraflow`, `tramBelt`, `signs` | po státech | normy a značky | předpisy států | – | (a) |
| `atPlace` | DE (bývalá NDR), další | co rozhoduje místo řezu (vzhled domů) | data | – | (a) |
| `city.slowServer`, `paidZoneFile`, `builtAgeTiles`, `iprHouseKind`, `ruianYear`, `sources.js isBrno` | Praha, Brno | vlastnosti serverů a dat města | zdroj dat | – | (a) |
| moduly `towns/*.js` (posun souřadnic, `narrowStrip` Jihlavy, registr stání Paříže, BGT, FMZK…) | po městech | převod vlastních dat na plochy | zdroj dat | A/B u každého města | (a) |
| `ortho-osm.js P` (`cars`, `areaGreen`, `?vypln=1`) | všude stejně vypnuté | – | regrese | změřeno, zhoršuje | (b), ale ne podle státu |

## Příznaky jen pro texty a vzhled (mimo výpočet)

`orthoEstimate` (poznámka „odhad z ortofota a OSM“ / „jen odhad z OSM“; v Česku se nečte, je to vlastně
`laneOrtho !== "none"`), `halfKerbNote`, `linesMissing`, `panorama`, `author`, `search`, `art`, `socialistLooks`,
`houseLook`, `houseDetails`, `city.abroad` (poznámky, vzhled domu bez centra): všechny (a). `orthoEstimate` lze
zjednodušit bez měření (jen text).

## Počty

Příznaky výpočtu (řádky tabulky, `city.fix` po jednotlivých pravidlech): **(a) 11, (b) 1 (pravidla city.fix v Praze,
plus globální P), (c) 8** (`besidePassport`, `besideMax`, `parkGuess` SK, `wideRoads`, `wideStreets`,
`roadClassFromOsm`, `city.fix` v cizině, `roadOnPath`).

## Pořadí testů (dopad)

1. `besidePassport` v Česku (devět měst s pasportem; zadání Báry).
2. `parkGuess` na Slovensku (všechny místní ulice SK).
3. `city.fix` v cizině (posun řezu a osy u každé mapy města).
4. `wideStreets` a `wideRoads` v zemích bez nich.
5. `besideMax` 15 → 25 na Slovensku, `roadOnPath` mimo Prahu, `roadClassFromOsm` (jen varování).

## Výsledky (24.–25. 11. 2026; podrobně `ZPRAVA.md`)

| příznak | A/B | rozhodnutí | commit |
|---|---|---|---|
| `besidePassport` | 47 řezů v 9 českých městech s pasportem: změna 2 (+1 šum), N 1 : O 0, stejně 1 | sjednoceno, příznak zrušen | 725908a |
| `parkGuess` SK | 58 slovenských místních ulic: změna 8, N 1 : O 4 | výjimka s důvodem; pravidlo dat (zákon jen bez čtení aut modelem) zkoušeno: SK 0 změn z 58, státy se zákonem 7 : 15 a naslepo 2 : 4, vráceno | 57f0947, bod 7 |
| sdílená oprava `parkFromAi` | 22 kontrol + 7 SK: nový 6 : starý 2; univerzální měření 3 : 3 | zapnuto | 211284f, 409baaa |
| `wideRoads` CZ | 14 českých dálnic: N 1 : O 13 | nahrazeno pravidlem dat | 4f661d8 → 55bb8d9 |
| `wideRoads`, `wideStreets` (všechny státy) | pravidlo dat `widerSides`, 112 řezů: změna 6, N 4 : O 2; kontroly bez mapy, české dálnice a Paříž beze změny | sjednoceno, oba příznaky zrušeny | 55bb8d9 |
| `city.fix` (3 pravidla os) | 54 řezů (39 v cizině s mapou, 15 v Praze): 0 změn; staré pražské prohry trvají | sjednoceno mimo Prahu (Praha `fix: {}` s důvodem) | bf4160d |
| `city.fix` v Praze | pravidla upravená (dělicí pás, protější vozovka); Praha 152 řezů: naslepo N 9 : O 4, proti MTVU ze 131 posunutých míst lépe 54, hůř 30; Brno 118: změna 1 (N), cizina 50: 0 | **sjednoceno, `city.fix`, `AXIS_FIX` i `PROFILY_FIX` zrušené**; Plzeň jen `bedPanels` (data) | `praha/ZPRAVA.md` |
| ústí uličky, spočítané pruhy (z pilotu USA) | viz `praha/ZPRAVA.md` | přenesené; spočítané pruhy jen se stáním u vozovky (Odlehlá prohrála) | `praha/ZPRAVA.md` |

Zbývá (doporučení): `besideMax` (SK 15 m, jinde 25 m; A/B na Slovensku, na českých pasportech je to jedno),
`roadOnPath` (jen Praha; zkusit na DTM ČÚZK a mapách měst, data mohou mít stejnou chybu), `roadClassFromOsm` (CZ, SK;
geometrii nemění, jen normu varování; sjednotit bez A/B, ale je to výklad normy, rozhodnout s Bárou), `orthoEstimate`
(jen text, je to `laneOrtho !== "none"`; zjednodušit).
