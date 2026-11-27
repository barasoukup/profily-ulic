# A/B 3: co aplikace doplní kolem mapy povrchů (Helsinky YLRE, 24. 11. 2026)

Navazuje na `../ab2/`: mapa vyhrála 16 : 9, ale na obytných ulicích prohrála 7 : 9. Ve všech devíti prohrách byly díly
z mapy („pasport“) dobře a chybné bylo to, co aplikace doplnila kolem ní jako odhad (Bára 24. 11. 2026: opravit doplnění,
ne mapu).

## Co bylo špatně

1. **Zahrady a trávníky za koncem registru byly „plocha (odhad)“** (Tammitie ×2, Tiilimäki, Teinintie). `besidePassport`
   (ortho-osm.js) bral zeleň podle podílu zelených pixelů ortofota; na helsinském snímku je ten podíl u zahrad skoro nula
   (0,00–0,02). Odhad bez mapy je dělal správně, protože zeleň a chodníky čte model (`ai-kerbs.js`, `chodník (AI)`,
   `zeleň (AI)`), který se u mapy vůbec nespouštěl.
2. **Stání ve vozovce registru** bylo jen z OSM a ze zákonného odhadu. Bez mapy ho dělí model (`parkFromAi`), který auta
   vidí (Vironkatu), a zákonný pruh tam, kde auta nestojí, vrátí do jízdního pruhu (Tiilimäki, Tammitie). Na Apollonkatu
   chybělo stání z OSM o 0,1 m: změřená vozovka (6,9 m) neustoupila, odhadnutá ustoupí o 0,3 m na pruh (derive.js).
3. **Chybějící chodník za kolmým stáním** (Maasälväntie): dům stál 25,7 m za posledním dílem mapy (strop 25 m), strana
   proto skončila stáním a „neurčeno 0,5“.
4. Navíc (Tammitie): dům z OSM vedle řezu blíž než obrys města na řezu, profil pokračoval za něj jako „neurčeno“.

## Co se změnilo (`?off=mapfill` vrátí dřívější stav)

Kde se mapa povrchů v zahraničí potká s ortofotem (`countries/default.js mapFill`, Česko ne, `CZ.js`), app.js pustí na
řez stejný model jako odhad (`modelCut`) a:

- `besidePassport(aiSurf)`: díly mezi mapou a koncem strany podle druhů modelu (běhy aspoň 1 m): zeleň jako zeleň,
  chodník jen na straně, kde ještě žádný není (nejvýš 6 m), a jen když mapa na řezu nějaký chodník nebo cyklostezku má
  (Runoilijanpolku: úzká cesta mezi trávníky bez chodníků, model tam chodníky vymýšlel); jiný chodník podle zeleně snímku
  jako dřív, ostatní zpevněná plocha.
- Je-li konec strany dál než strop (25 m), strana pokračuje k vnějšímu okraji prvního chodníku, který model přečte do 8 m
  za mapou (Maasälväntie); jinak jako dřív.
- Dům z OSM vedle řezu se nakreslí i tehdy, když obrys dál na řezu leží za ním.
- `parkFromAi(..., { inside: true })` ve vozovce mapy: stání jen ve vozovce (chodník mapy zůstává), stejná pravidla jako
  v odhadu (data o stání a strany označené v OSM rozhodují, zákonný pruh bez aut zpět do pruhu).
- `deriveProfile({ osmParkGive })`: stání označené v OSM ve vozovce mapy smí ubrat pruhům 0,3 m jako v odhadu.

Kde ortofoto není nebo model nestihne (první řez, 12 s), zůstává dřívější doplnění a zákonný odhad. Nové texty v rozhraní
nejsou.

## Kontroly

- **Regrese** `node evaluation/ortho-osm/regression.mjs`: beze změny, totožná s `results/regression.txt` (změna se odhadu
  bez mapy netýká).
- `npm test`: 422 testů prošlo.
- **Starý vzorek ab2 (31 ulic pro auta)** znovu nasbírán (`results/rezy-stary.json`: A bez mapy, O dřívější doplnění =
  ab2 B ve všech 31, N nové). Změnilo se 11 řezů, ostatních 20 je stejných. Změněné znovu posouzené naslepo N proti A
  (`posudky-stary.json`): **lépe N 6, stejně 5, lépe A 0.**

  | řez | ab2 | nyní | co se změnilo |
  |---|---|---|---|
  | kruu2 Vironkatu | A | **N** | stání na obou stranách (model), jeden pruh 4,7 m |
  | munk2 Tiilimäki | A | **N** | zahrada A zelená, zákonné stání na A pryč |
  | oulu4 Teinintie | A | **N** | zeleň na B, stání z OSM |
  | tool3 Apollonkatu | A | stejně | stání z OSM na straně A |
  | munk3 Tammitie | A | stejně | zeleň místo plochy a neurčeno |
  | munk4 Tammitie | A | stejně | zeleň, zákonné stání pryč |
  | pihl1 Maasälväntie | A | stejně | chodník za kolmým stáním (zbyl proužek plochy 0,45 m) |
  | kapy2 Osmontie | A | stejně | proužek zeleně místo plochy |
  | laut2 Lahnaruohontie | B | **N** | zeleň za chodníkem |
  | malm3 Malmin asematie | B | **N** | trávník až k domu |
  | ulla2 Ehrenströmintie | stejně | **N** | stání B z OSM |

  Žádná dřívější výhra se nezměnila v prohru. Starý vzorek celkem: **mapa lépe 20, hůř 1 (itak3, beze změny), stejně 9,
  nejde 1** (dřív 16 : 9); obytné ulice 10 : 1 (dřív 7 : 9). Je to ale vzorek, na kterém se ladilo.

## Nový slepý A/B (nový vzorek)

`sample.mjs` (semínko 20261125): 319 náhodných bodů v 20 předměstích, žádný do 60 m od bodu ab2; `collect.js pickResidential`
nechal ty do 20 m od OSM `highway=residential` v Helsinkách, nejvýš 2 na předměstí, prvních 32 (`sample.json`). Sběr
(`collect.js collectAB3`, localhost, `?osm=balik`): A `?helsinki=0`, O `?off=mapfill`, N dnešní kód (`results/rezy-novy.json`).
Dva řezy dopadly na jinou ulici (secondary, tertiary), posuzuje se 30 obytných. Mapa použita ve 31 z 32.

Posuzovali samostatní posuzovatelé (agenti, každý balíček jiný, bez přístupu ke klíčům a ke kódu): ortofoto bez čar
aplikace, fotky Mapillary (nejnovější do 30 m každým směrem, 24 z 32 řezů), profily jako X a Y v náhodném pořadí bez
zdrojů dílů, řezy v náhodném pořadí (`packages.mjs`, klíče `results/klic-*.json` až po posudku).

| srovnání | lépe nové | lépe staré | stejně |
|---|---|---|---|
| **nové doplnění N proti dřívějšímu O** (19 obytných, kde se liší) | **14** | 4 | 1 |
| **mapa (N) proti odhadu bez mapy (A)** (29 obytných, kde se liší) | **11** | 7 | 11 |

- N lépe: zahrady, dvory a les zeleně místo zpevněné plochy (8×), žádný chodník přes zahradu (Pakila, Munkkiniemi,
  Laajasalo), stání jen na straně s auty (Lauttasaari), stání u aut (Käpylä).
- O lépe (těsně): zpevněné kousky u domů, které model vzal za zeleň (Lauttasaari, Malmi, Pakila), chodník a hřiště
  za stezkou (Kannelmäki).
- Mapa hůř: stání tam, kde žádné není (Vartiokylä), úzká cesta jako dva pruhy s chodníky (Puistola), kolmé stání jako
  plocha (Pukinmäki), konec dřív než u fasády (Lauttasaari, Pihlajamäki), chodník jako plocha (Laajasalo). Mapa lépe:
  vozovka a pruhy (Oulunkylä, Haaga), stezky a stromořadí (Kannelmäki, Malmi, Herttoniemi), stání (Käpylä), žádné
  vymyšlené stání (Laajasalo, Herttoniemi).

Na obytných ulicích předměstí tedy mapa s novým doplněním vyhrává 11 : 7 (v ab2 se starým 7 : 9).

## Kontroly v Tallinnu a ve Vídni

12 řezů Tallinnu (`../../estonia/ab/sample2.json`, prvních 12) a 12 Vídně (FMZK, `../../austria/ab/sample.json`, prvních
12), O proti N (`results/kontroly.json`). Vídeň: **beze změny ve všech 12** (FMZK pokrývá celý řez, stání v jejích
vozovkách model neměnil). Tallinn: změna v 1 z 12 (Pelguranna: za živým plotem 0,85 m zpevněné plochy místo zeleně),
posouzena naslepo s balíčkem nového doplnění: **lépe N** (začíná tam parkoviště). Žádná prohra.

## Závěr

Nové doplnění je lepší na novém vzorku (14 : 4) a nic nezhoršilo (regrese beze změny, starý vzorek 0 proher, kontroly
0 proher), proto **zůstává zapnuté** (`?off=mapfill` vypne). Zbývá: model občas vezme zpevněný kousek u domu za zeleň;
stání ze zákonného odhadu tam, kde model nerozhodne (Vartiokylä); kolmé stání mimo vozovku mapy jako plocha.

Obrázky, fotky a balíčky (`data/`) jen lokálně (git je ignoruje).
