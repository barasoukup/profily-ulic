# Most nad vodou a zelení: slepé přeměření (26. 11. 2026)

Přeměření změny „ulice na mostě nebere vodu ani zeleň OSM pod sebou“ (`pilot/public/ortho-osm.js` u `overGround`,
`?off=mostvoda` = dřív; `../ZPRAVA.md`). Recenze vytkla, že dosavadní 18 : 0 nebylo slepé, řádky nejsou uložené a měřily
se jen mosty nad vodou, ačkoli změna zahazuje i zeleň. Kód zmrazený: větev `canada` a1e594d (větev `measure-1126`), aplikace
se neměnila, nové jsou jen skripty v této složce.

## Postup

- **Vzorek** (`sample.mjs`, semínko 20261126): silniční mosty (trunk až living_street, `bridge`, ne pod zemí) z místních
  balíků OSM 16 států, kde aplikace odhaduje z ortofota a OSM a posuzovatel má otevřené ortofoto (PL, SK, AT, DE, FR, ES, PT,
  IT, SI, EE, FI, LT, BE, LU, NL, CH; ne Česko, kde je technická mapa všude). Bloky balíků losované podle velikosti dat,
  most v nich náhodně, nejvýš 4 na stát a skupinu, s fotkou Mapillary do 30 m. Tři skupiny:
  **voda** (střed mostu nad vodou OSM, most ≥ 25 m) 36, **zeleň** (ne nad vodou, zeleň OSM pod středem nebo do 25 m od
  něj podél řezu) 30, **krátké mostky** (< 25 m, voda nebo zeleň do 25 m) 26. Celkem 92 mostů ve 14 státech (vylosované SK
  a EE nedaly bod). Od dřívějšího vzorku (`../points.json`) a od Kościuszkova mostu nejméně 252 m, medián 365 km.
- **Sběr** (`collect.js` ve stránce aplikace, `?osm=balik`, výchozí nastavení včetně AI obrub): každý most nejdřív B (dnes),
  pak A (`P.off = {mostvoda}`) na tomtéž řezu (poloha, azimut a cesta z vzorku). Liší-li se A a B, ještě jednou B (B2);
  liší-li se B2 od B, je to šum, ne změna. Řádky `results/rows.json`.
- **Slepé A/B** (`packages.mjs`): dvojice, které se liší (alespoň 0,2 m nebo jiné díly), X/Y náhodně, zdroje skryté, ortofoto
  státu (`../../universal/ortho.mjs`) a fotky Mapillary, pokyn `POKYN-AB.md` (neutrální, stejný jako
  `evaluation/usa/fresh/POKYN-AB.md`: nejdřív složení, pak šířky). Dva nezávislí posuzovatelé (Sonnet) na každý balík.
  Klíč `results/key.json`, verdikty `results/p<k>-a|b.jsonl`, hash každého obrázku `results/images.sha256` (obrázky v
  `evaluation/bridge-water/data/blind/`, git je ignoruje, některá ortofota jsou jen k prohlížení).
- **Krajní chodníky** (`POKYN-CHODNIK.md`): tytéž snímky bez profilů a v jiném pořadí, dva další měřiči změřili na ortofotu
  krajní chodník na straně A a B (`results/m<k>-a|b.jsonl`, klíč `measure-key.json`). Strana se počítá, když ji změřili oba.
- Výsledky: `node score.mjs results sample.json results/rows.json B A "změna (B)" "dřív (A, ?off=mostvoda)" > results/score.md`.

## Co se změnilo

| skupina | mostů | změna nic nezměnila | jiný profil | šum | bez ortofota / profilu | posouzeno |
|---|---|---|---|---|---|---|
| voda | 36 | 12 | 24 | 0 | 2 / 0 | 22 |
| zeleň | 30 | 21 | 8 | 0 | 0 / 1 | 8 |
| krátké | 26 | 15 | 11 | 1 | 1 / 0 | 9 |

U zeleně se změna projeví málokdy (8 z 30): většinou nemá zeleň OSM nižší vrstvu přes řez, nebo ji tam ořízne už pravidlo
konce ulice.

## Slepé A/B (39 dvojic)

| skupina | dvojic | změna : dřív | nerozhodně | nejde | znaménkový test p | oba posuzovatelé shodně |
|---|---|---|---|---|---|---|
| **všechny** | 39 | **27 : 3** | 8 | 1 | < 0,001 | 25 : 1 |
| voda | 22 | **20 : 1** | 1 | 0 | < 0,001 | 19 : 1 |
| zeleň | 8 | 4 : 1 | 3 | 0 | 0,375 | 4 : 0 |
| krátké mostky | 9 | 3 : 1 | 4 | 1 | 0,625 | 2 : 0 |

Shoda posuzovatelů 32/39, kde oba vybrali stranu 26/28. Prohry změny: **w-9** (Vilnius, dvě souběžné konstrukce mostu: mezi
nimi je opravdu voda, oba posuzovatelé pro „dřív“), **g-13** (Lucembursko, posuzovatelé vidí okraje bez chodníku) a **s-20**
(Lucembursko, krátký mostek, jeden hlas). Zeleň a krátké mostky samy o sobě průkazné nejsou (8 a 9 dvojic), ale ukazují
stejným směrem a změna tam nic nerozbíjí; typická výhra u zeleně: g-8 (Polsko) bulvár s trávníkovými pásy, kde „dřív“
kreslilo do pásů vodu, g-22, g-25 (CH, AT) chodníky na mostě místo zeleně.

## Krajní chodník proti ortofotu (69 stran)

| | stran | medián chyby | do 1 m | chodník navíc (měřiči nic) | chodník chybí (měřiči ≥ 1 m) | chodník ≥ 5,9 m |
|---|---|---|---|---|---|---|
| **změna** | 69 | **0,80 m** | **38** | 3 | **18** | 0 |
| dřív | 69 | 1,75 m | 25 | 2 | 34 | 0 |
| voda: změna / dřív | 44 | 0,95 / 2,00 m | 24 / 11 | 1 / 0 | 16 / 29 | 0 |
| zeleň: změna / dřív | 15 | 1,15 / 1,25 m | 7 / 5 | 2 / 2 | 2 / 5 | 0 |
| krátké: změna / dřív | 10 | 0,15 / 0,10 m | 7 / 9 | 0 / 0 | 0 / 0 | 0 |

Měřiči se shodují s mediánem 0,2 m (do 0,5 m ve 49 ze 69 stran). Změna chodníky na mostech hlavně **vrací** (dřív chyběly
na 34 stranách, teď na 18); kde chodník dává, je spíš o něco užší než na ortofotu (w-19, w-21, w-29). Strop 6 m se ve vzorku
neobjevil ani jednou. U krátkých mostků jsou obě varianty stejně dobré (rozdíly do desítek cm).

**Most Tadeusza Kościuszki v Krakově** (50.05278, 19.91553): s AI obrubami vychází řez pokaždé jinak (B a B2 se liší,
`results/rows-krakow.json`), proto ještě s `?ai=0` (`rows-krakow-ai0.json`): změna dává chodníky 3,6 a **6,0 m (strop)**,
dřív 3,6 a 4,05 m; ortofoto podle recenze asi 4,7 a 3,3 m. Strop je tedy skutečný jev změny, ale ve 39 náhodných mostech
se neopakoval.

## Doporučení

**Nechat zapnuté, i pro zeleň.** Nad vodou změna slepě a s dvěma posuzovateli vyhrává 20 : 1 a vrací chodníky na mostech
(chyba 0,8 proti 1,75 m). U zeleně a krátkých mostků je vzorek malý (4 : 1 a 3 : 1, neprůkazné), ale nic nenaznačuje škodu,
takže omezení jen na vodu měření nepodporuje. Co zůstává opravit (zápis do backlogu):
- dvě souběžné konstrukce mostu s vodou mezi nimi (w-9): bez ploch mostů (`man_made=bridge`) v dlaždicích OSM to změna
  nepozná;
- chodník doroste do stropu 6 m, když za okrajem mostu nic nekončí (Kościuszkův most): krajní chodník na mostě by mohl mít
  vlastní strop podle ortofota nebo končit u okraje vozovky + běžná šířka.

## Výhrady

- Posuzovatelé i měřiči jsou modely (Sonnet), ne lidé; fotky Mapillary bývají z jiného místa mostu a ortofota u mostů
  ukazují často jen desku (zábradlí a chodníky v jednom pásu).
- Vzorek je z místních výřezů balíků OSM (bloky kolem měst), ne z celých států; Litva má ortofoto jen pro Vilnius, Finsko
  jen pro pět měst, takže 3 vylosované mosty nešly posoudit.
- Výchozí nastavení s AI obrubami dává občas jiný řez při opakování (1 most vyřazen jako šum, Kościuszkův most); změna se
  proto pozná jen tam, kde se opakované B shoduje.
- Šířka krajního chodníku: měřiči počítají i chodník společný s cyklisty, aplikace ho počítá jen jako `chodnik`,
  `chodnik_kola`, `stezka_sdilena`; samostatná `cyklostezka` u okraje je v aplikaci 0 (w-31, w-35).
