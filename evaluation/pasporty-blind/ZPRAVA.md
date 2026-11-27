# Pasporty Šlapanic a Kuřimi: slepé přeměření (26. 11. 2026)

Dosavadní A/B (`evaluation/PASPORTY-AB.md`: Šlapanice 8 : 6, Kuřim 10 : 6) nebylo slepé (posuzovatel věděl, která
varianta je s pasportem) a je neprůkazné. Kód zmrazený: větev `canada` a1e594d (`measure-1126`), aplikace beze změny.

## Co by uživatel bez pasportu dostal

Aplikace nemá pro české pasporty přepínač (`?pasport=0` je jen slovenský, `towns/slovensko.js`); `evaluation/ab.mjs` počítá
variantu „bez“ v Node bez odhadu z ortofota (`ortho-osm.js`), tedy ne to, co dostane uživatel. Proto se sbíralo **ve stránce
aplikace** (`../bridge-water/blind/collect.js`, `?osm=balik`, výchozí nastavení): „s pasportem“ normálně, „bez pasportu“
se stejnou stránkou, jen dotazy na služby obou pasportů (`services5.arcgis.com/8F7J7ODVYrBts9AD`,
`services6.arcgis.com/nSl4NxcJbmr0IlpX`) vrátí prázdnou odpověď. Aplikace pak udělá přesně to, co při prázdném pasportu
(`withPassports`: technická mapa ČÚZK, a kde nic nemá, odhad z ortofota a OSM).

**DTM Jihomoravského kraje je v obou městech pořád z velké části prázdná:** bez pasportu je odhad v Kuřimi 41 z 60 řezů,
ve Šlapanicích 38 z 60 (dřív se to tvrdilo jen o Kuřimi). Ověřeno přímo: WFS kraje vrací u řezů s-1, s-3 a k-1 nula ploch,
u k-2 70. S pasportem je odhadem 12 a 6 řezů.

## Postup

- **Vzorek** (`sample.mjs`, semínko 20261126): 60 náhodných bodů v každém městě podle délky ulic OSM uvnitř hranice pasportu
  (`app/public/pasporty.json`; i obslužné cesty kromě vjezdů a parkovišť), od sebe ≥ 60 m, od dřívějšího vzorku
  (`evaluation/<město>/data/samples.json`) ≥ 100 m (Šlapanice nejméně 102 m, medián 186 m; Kuřim 101 a 158 m).
- **Sběr:** řez umístí klik („s pasportem“), „bez“ se počítá na tomtéž řezu. Pasport změnil profil u 50 z 60 řezů ve
  Šlapanicích a 32 z 60 v Kuřimi (`results/collection.json`); šum (opakované „s pasportem“ jiné) žádný.
- **Výběr k posouzení** (`pick.mjs`, semínko 20261127): ve Šlapanicích náhodných 35 z 50 změněných, v Kuřimi všech 32.
- **Slepé A/B:** `../bridge-water/blind/packages.mjs` (X/Y náhodně, zdroje skryté, ortofoto ČÚZK a fotky Mapillary, pokyn
  `../bridge-water/blind/POKYN-AB.md`: nejdřív složení, pak šířky), dva nezávislí posuzovatelé (Sonnet) na balík. Klíč
  `results/key.json`, verdikty `results/p<k>-a|b.jsonl`, hash obrázků `results/images.sha256` (obrázky v `data/blind/`,
  git je ignoruje), řádky obou variant `results/rows.json`.
- `node ../bridge-water/blind/score.mjs results sample-ab.json results/rows.json pas bez "s pasportem" "bez pasportu" > results/score.md`

## Výsledek

| město | dvojic | s pasportem : bez | nerozhodně | znaménkový test p | oba posuzovatelé shodně |
|---|---|---|---|---|---|
| **obě** | 67 | **26 : 28** | 13 | 0,89 | 19 : 20 |
| Šlapanice | 35 | 12 : 12 | 11 | 1,00 | 10 : 8 |
| Kuřim | 32 | 14 : 16 | 2 | 0,86 | 9 : 12 |

Shoda posuzovatelů 47/67, kde oba vybrali stranu 39/43 (posuzovatelé se shodnou, jen výsledky jdou oběma směry).

Podle toho, co je „bez“: kde je bez pasportu odhad z ortofota a OSM, **21 : 26** (Kuřim 12 : 16, Šlapanice 9 : 10); kde je
bez pasportu technická mapa, 5 : 2 (malé číslo).

Co posuzovatelé u pasportu vytýkají (důvody v `p*.jsonl`): plocha pasportu přes zahrady, les a dvory (zpevněná plocha 18–21 m,
obslužná 17 m, chodník 18 m: s-9, s-54, s-59, k-11, k-20, k-21, k-36, k-42; s pasportem má díl ≥ 12 m, kde bez něj
žádný takový není, 14 ze 67 posuzovaných řezů), stání, které na snímku není, a naopak
chybějící zeleň mezi chodníkem a vozovkou. Pasport vyhrává hlavně úzkými cestami se skutečnou šířkou a stáním podél
vozovky, které odhad nevidí.

## Doporučení

**Pasporty Šlapanic a Kuřimi vyřadit** (Bářino pravidlo „co nevyhraje, vyřadit“): naslepo, se dvěma posuzovateli a dvakrát
větším vzorkem je výsledek 26 : 28, žádná výhoda. Dřívější 8 : 6 a 10 : 6 porovnávalo s variantou bez odhadu z ortofota;
proti tomu, co uživatel bez pasportu opravdu dostane (odhad z ortofota a OSM tam, kde je DTM kraje prázdná), pasport
nepomáhá. Kdyby se měly nechat, tak jen s ořezem plochy pasportu na souvislý kus pod osou ulice a nové slepé A/B
(stejný postup, jen jiné semínko).

## Výhrady

- Posuzovatelé jsou modely (Sonnet); fotky Mapillary jsou v obou městech řídké a často odjinud, rozhodovalo hlavně ortofoto.
- Řez umístil klik bez ohledu na variantu, proto i body na polních a lesních cestách a v areálech (vzorek podle délky sítě
  OSM uvnitř hranice obce).
- Šlapanice jsou podvzorek 35 z 50 změněných řezů; výsledek nerozhodný v obou polovinách vzorku.
