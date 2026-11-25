# Opravy příčin, uložený odkaz s cestou a nové změření zákonného stání (25. 11. 2026)

Zadání (Bára 25. 11. 2026): opravit tři změřené příčiny z `../mereni/ZPRAVA.md` a uložený odkaz, kód zmrazit a změřit na řezech, na
kterých se nic neladilo; „co je horší, zůstane vypnuté“.

**Krátce:** odkaz nese cestu OSM. Tři příčiny opravené. Na 571 nových místních ulicích (109 změněných řezů, dva posuzovatelé Sonnet)
je `lawlanes` s opravami proti `?off=lawlanes` lépe **34**, hůř **21**, neshoda 3, stejně 37, nejde 14 (p = 0,10; podíl výher 49–73 %).
Na oficiálních bodech shoda složení beze změny (0,6010 → 0,6011), lépe 1 (složení), hůř 3 (jen počet pruhů). Výsledek je **smíšený**,
ne čistá výhra: zůstává zapnuté jako dosud, **rozhodne Bára** (oddíl 5).

## 1. Odkaz: `#rez=lat,lon,azimut,vlevo,vpravo,cesta`
Cesta OSM je šesté číslo. Čtou ho `share.js` (`cutHash`, `parseCutHash`, `sameCut`), `derive.js savedStreet`, `app.js` (otevření, vložená
poloha, změna adresy otevřené stránky, obnovení z úložiště a po změně jazyka); `designParams` (`&navrh=`, `&stav=`), „O aplikaci“
(`about.js`, jen prvních část adresy), přesměrování `build_root_site.mjs` a `city_site.mjs` berou adresu celou a nemění se; `logging/hlaseni.mjs`
a `upravy.mjs` cestu vypisují. **Worker se měnit nemusí**: `CUT_PATH` pustí jen číslice, čárky, tečky a minus, nový odkaz mezi ně patří
(test); stará otevřená stránka šesté číslo přeskočí. Cesta, která už není, je pod zemí, dál než 40 m nebo končí víc než 5 m před
řezem: nejbližší ulice jako dřív. Směr podél cesty se bere z té cesty. Ověřeno v aplikaci: všech 10 z 226 řezů, které se chytaly jiné
vozovky, dostalo svou cestu a tentýž profil; starý odkaz a odkaz s neexistující cestou jako dřív; `?lang=sk`.
Vedlejší nález: azimut je v odkazu zaokrouhlený na celé stupně, profil z odkazu se tím o centimetry liší, výjimečně o díl (Versmannstraße).

## 2. Příčiny
1. **Piktokoridor:** `layLaw` a `widenLaw` ho počítají jako pruh. at-graz-4, cz-kolin-5 jako s vypnutým, Zaragoza 21 stání zpět.
2. **`markIslands`:** při složení bez zákonných pruhů dostane jejich obruby (`lawAt`); chodník za takovou obrubou zůstane. Zaragoza 10, 19,
   21, 24 opravené. Hamburk 28 a Zaragoza 11, kde bylo „delici“ shodou okolností lepší, se vrátily (je tam chodník jako dřív).
3. **Jednosměrka na dva pruhy:** výklad v `../mereni` („značí jen šířka, bez čáry“) **neseděl**. Dělí čáry z ortofota, většinou slabé (podíl
   0,06–0,10: Bartoňova, Jesenského, Sorbiers); v Kraszewského plná čára, tedy okraj řady aut; jen v Roger de Llòria ve
   Valencii z čar vyjdou samé krajnice a dělí šířka (`lanesFromShoulders`). Oprava `lawUnsplits`: v jednosměrce bez `lanes` ≥ 2, kde čáry
   dají víc pruhů než pravidla, se pruhy pravidel vrátí, když se do nich vejde víc zákonných pruhů, které model nevyloučil. fr-toulouse-2
   (dvě slabé čáry, stání se vejde i tak) zůstává, stejně obousměrky (nl-schiedam-5).
   Cena proti dnešku (N před opravami) na oficiálních bodech: at-graz-4 60 → 100 %, pt-braga-8 71 → 86 % (pruhy hůř); es-valencia-4 hůř.
Testy: `tests/park-ai.test.js`, `pravidla.test.js`, `share.test.js`, `saved-cut.test.js`, `logging.test.js`, `root-site.test.js`.

## 3. Nový vzorek (kód zmrazen na 7af8747, potom vzorek; kód se už neměnil)
`sample.mjs` (semínko 20261125 + 909): místní ulice v deseti státech, kandidáti dál než 150 m od každého z 42 831 bodů v JSON souborech
`evaluation/`, 477 řezů; druhá dávka jen Slovensko (`sample-sk.mjs`, 94 řezů). Ramena N (dnešní kód) a L (`?off=lawlanes`) v jednom sběru, stejné
odpovědi služeb a stejná cesta. Změna = jiné díly nebo díl aspoň o 0,25 m. Posuzovatelé Sonnet, naslepo, X/Y náhodně a pro
druhého posuzovatele znovu, zdroje skryté, ortofoto a Mapillary (do 30 m, kde nic, do 50 m; u 56 ze 121 řezů žádná fotka). Řez se počítá
straně, když ji zvolil aspoň jeden posuzovatel a druhý nezvolil opačnou.

| | změněno | lépe : hůř | neshoda / stejně / nejde | oba posuzovatelé |
|---|---|---|---|---|
| ES | 19 | 8 : 2 | 1 / 4 / 4 | 4 : 1 |
| IT | 13 | 4 : 1 | 1 / 6 / 1 | 2 : 1 |
| PL | 13 | 6 : 4 | 0 / 2 / 1 | 2 : 0 |
| SK | 22 | 8 : 4 | 1 / 7 / 2 | 7 : 2 |
| CZ | 5 | 2 : 1 | 0 / 2 / 0 | 1 : 0 |
| AT | 6 | 1 : 2 | 0 / 3 / 0 | 1 : 1 |
| DE | 10 | 1 : 2 | 0 / 6 / 1 | 0 : 1 |
| BE | 10 | 2 : 5 | 0 / 3 / 0 | 0 : 3 |
| DK | 4 | 2 : 0 | 0 / 2 / 0 | 0 : 0 |
| PT | 7 | 0 : 0 | 0 / 2 / 5 | 0 : 0 |
| **celkem** | **109** | **34 : 21** | 3 / 37 / 14 | 17 : 9 |

Znaménkový test p = 0,10 (podíl výher 49–73 %), oba posuzovatelé p = 0,17; jen první dávka 31 : 17 (p = 0,06). **Výhra je v
šířkách** (stejné složení bez krajnic): 23 : 10 (p = 0,04); kde se mění složení, **11 : 11** (29 řezů). Jistota posudků většinou nízká,
třetina řezů „stejně“. Belgie prohrává 2 : 5 (malé číslo, žádná výjimka z toho neplyne).

## 4. Oficiální body (stejné posudky, 467 řezů)
Změněno 31 ze 402 řezů: lépe 1 (de-muenchen-4, složení 83 → 86 %), hůř 3 (de-freiburg-5, fr-toulouse-2, nl-schiedam-5: složení stejné, o pruh vedle), jinak stejně;
jedna šířka hůř. Shoda složení 58 → 58 % (0,6010 → 0,6011), pruhy stejně 48 → 47 %. Před opravami bylo 2 : 5. Oficiální řádky proti ránu
(oprava mění 5 řezů): AT 58 → 60 %, ES 56 → 55 %, PT 64 → 65 %; ostatní beze změny (`../../universal/vysledky/staty.md`).

## 5. Rozhodnutí o `lawlanes`
Pravidlo „víc lépe než hůř na novém vzorku a ne hůř na oficiálních bodech“: první část splněna bez průkaznosti; druhá podle výkladu. Podle složení
(Bářino první měřítko) oficiální body hůř nejsou, počtem řezů 1 : 3 ano. To není čistá výhra ani prohra, proto jako u remízy:
**výchozí stav zůstává zapnutý jako dnes, rozhodne Bára**. Vypnutí je jeden řádek v `app.js` (`lawPark`). Opravy 1–3 jsou uvnitř `lawlanes`
(jinde nic nemění), samostatně se naslepo neposuzovaly.

## 6. Slovensko (151 nových řezů, rozhodne Bára)
| | změněno | lépe : hůř | neshoda / stejně / nejde | oba posuzovatelé |
|---|---|---|---|---|
| odhad stání zapnutý proti vypnutému, `lawlanes` zapnuté (dnes) | 24 | **12 : 7** (p = 0,36) | 4 / 1 / 0 | 10 : 6 |
| odhad stání zapnutý proti vypnutému, `lawlanes` vypnuté | 33 | **16 : 11** (p = 0,44) | 1 / 4 / 1 | 10 : 10 |

Odhad na Slovensku tedy v obou případech spíš pomáhá, neprůkazně; dřív 7 : 6 a 1 : 4. Vypnutí `lawlanes` samo o sobě důvod k návratu
výjimky nedává. `lawlanes` na Slovensku samo 8 : 4.

## 7. Meze
Portugalsko se naslepo posoudit nedalo: DGT odmítalo spojení při stahování snímků pro posuzovatele (sběr v aplikaci ho ještě měl).
Posuzovatelé Sonnet, dva na řez, jistota nízká; Mapillary u řady řezů chybí. Rozpočet
svobody je malý: 5 % je u 55 rozhodnutých řezů asi 36 : 19. Nové ulice mimo deset států se neměřily. Příčina 4 (model auta pod stromy nevidí)
zůstává. `parkFromAi` také nepočítá piktokoridor (neměněno, jen poznámka).

Soubory: `kandidati*.json`, `body*.json`, `vysledky/nove.json`, `oficialni.json`, `ids-*`, `balik-*`, `klic-*`, `posudek-*` (a1–a8 a b1–b8 N : L, c, d SK zapnuto : vypnuto,
e, f totéž bez `lawlanes`), `vyhodnoceni.mjs`, `zmeny.mjs`, `skore.mjs`. Ortofota a fotky (`data/`) git ignoruje.
