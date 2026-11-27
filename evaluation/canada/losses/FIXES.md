# Opravy proher Severní Ameriky: slepé A/B (27. 11. 2026)

Navazuje na rozbor proher (`ZPRAVA.md`). Z něj vzešly tři společné opravy mapy povrchů (Planimetrics, mapa Toronta),
každá s vypínačem:

- `?off=gapsortho`: mezera mapy mezi dvěma vozovkami, vzatá jako střední pás, se označí a ortofoto rozliší trávník (zeleň)
  od dlažby (`towns/planimetrics.js gapsBetweenRoads`, `ortho-osm.js medianGapsByImage`; Markham Road, Overlea Boulevard);
- `?off=gapswide`: mezera širší než 10 m je střední pás jen mezi dvěma vozovkami jedné ulice (stejné jméno nebo `ref` na obou
  stranách, koleje nebo cesta uvnitř); jinak jsou to dvě ulice (Highway 27, Lake Shore Boulevard u rampy Gardineru);
- `?off=trackaxis`: cyklostezka vyříznutá z vozovky mapy (`osmTracks`) se označí a osa cesty pod ní patří vedlejší vozovce
  (`derive.js`; Finch Avenue West: ze tří pruhů zbyl jeden).

Opravy DDOT (Washington) a domy Toronta tu nejsou (Bára 26. 11. 2026: jen společné opravy, ne jednoho města).

## Jak

- Nové řezy (`../fixes/sample.mjs`, vlastní semínko, nic blíž než 150 m od dřívějších bodů), do aplikace jen ty, kterých se
  opravy můžou týkat (`surf.mjs`): 608 řezů v Torontu, Bostonu a New Yorku.
- Sběr v aplikaci (lokální server, `?osm=balik`, `pilot/public/zz-collect.js`): `def` (vše zapnuté) proti `plan0`
  (`?off=gapsortho,gapswide,trackaxis`), `evaluation/universal/data/na-fixes-plan.json`. **Změnilo se 72 profilů**
  (Toronto 61, Boston 10, New York 1).
- Rozlišení po opravách (běh bez jedné opravy, `gapsfix0` a `ta0`) doběhlo jen u 37 ze 72 řezů; u zbylých 35 se neví,
  která oprava profil změnila. Rozhoduje proto srovnání všech tří oprav dohromady.
- Balíky `../fixes/packages.mjs` (skupina `all`, všech 72 dvojic, X a Y náhodně, bez zdrojů, ortofoto města a fotky
  Mapillary do 30 m s rokem; fotka u 68 dvojic), pokyn `evaluation/usa/fresh/POKYN-AB.md` s poznámkou, že ortofoto má
  přednost před starší fotkou. Dva slepí posuzovatelé (Sonnet) na balík, každý zvlášť. Klíč `results/key.json` se četl až po
  posouzení. Výsledek `../fixes/results/score.md` (`node evaluation/canada/fixes/score.mjs`).

## Výsledek

Dvojici vyhrává strana s víc hlasy z obou.

| | dvojic | s opravami : bez | nerozhodně | nejde | p (znaménkový) | oba shodně | shoda posuzovatelů |
|---|---|---|---|---|---|---|---|
| **všechny** | 72 | **54 : 13** | 4 | 1 | < 0,001 | 48 : 8 | 58/72 |
| Toronto | 61 | **51 : 7** | 2 | 1 | < 0,001 | 45 : 5 | 52/61 |
| Boston | 10 | 3 : 5 | 2 | 0 | 0,73 | 3 : 3 | 6/10 |
| New York | 1 | 0 : 1 | 0 | 0 | 1 | 0 : 0 | 0/1 |
| jen ortofoto (bez fotky) | 4 | 4 : 0 | 0 | 0 | 0,13 | 3 : 0 | 3/4 |
| mezery (gapsortho + gapswide), kde je známo | 32 | 19 : 10 | 3 | 0 | 0,14 | 16 : 7 | 23/32 |
| osa pod cyklostezkou (trackaxis), kde je známo | 5 | 4 : 1 | 0 | 0 | 0,38 | 4 : 0 | 4/5 |
| oprava neurčená (vše Toronto) | 35 | 31 : 2 | 1 | 1 | < 0,001 | 28 : 1 | 31/35 |

Podíl výher s opravami 80 % (95% interval 70–88 %). Jistota posuzovatelů: vysoká 40, střední 57, nízká 47 ze 144 hlasů.

## Boston (3 : 5) a New York (0 : 1)

Všech deset bostonských změn je od mezer (gapswide / gapsortho). Proti opravě hlasovali posuzovatelé tam, kde široká mezera
odděluje hlavní vozovku od souběžné obslužné komunikace s jiným jménem: Soldiers Field Road (bdual-29, -30, -41; obslužná
cesta za travnatým pásem patří k ulici) a Washburn Street (bdual-99, sporné). Pro opravu: Transportation Way, Pulaski
Skyway, Seaver Street (dělicí pás přes les a park), sporné Morrissey Boulevard a Morton Street (1 : 1). Rozdíl 3 : 5 není
průkazný a výjimka pro jedno město by potřebovala vlastní měření (zapsáno v `docs/backlog.md`). New York: jeden řez pod mostem
(South Street, trackaxis), jeden posuzovatel „nejde“, druhý proti.

## Rozhodnutí

Bára 27. 11. 2026: „Jestli vycházejí dobře, tak je nechme.“ Opravy dohromady vycházejí průkazně lépe (54 : 13, p < 0,001),
**všechny tři zůstávají zapnuté** (výchozí stav, vypínače `?off=gapsortho`, `?off=gapswide`, `?off=trackaxis`). Jednotlivě
průkazné nejsou jen proto, že rozlišení po opravách nedoběhlo; nikde nevyšly průkazně hůř.

## Kontroly

- `npm test`: 528 testů, vše prošlo.
- `node evaluation/ortofoto-osm/regrese.mjs`: řádky bez `#` beze změny proti `vysledky/regrese.txt`.
- `node evaluation/canada/dc-same.mjs` (Washington, 100 řezů): výstup kódu před opravami (HEAD) a po nich je stejný.
