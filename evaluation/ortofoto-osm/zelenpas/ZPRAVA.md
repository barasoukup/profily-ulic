# Zelený pás za obrubou, když chybí fasáda (Bára 23. 11. 2026)

**Co:** odhad z ortofota a OSM končí na straně bez domu u obruby (nebo chodníku z OSM, jinak 2 m za obrubou,
`LAST_NONE`). Nově, je-li část hned za posledním dílem ulice zeleň (z ortofota nebo z OSM) aspoň 1 m široká, strana
skončí 3 m za ním (nejvýš šířka té zeleně), jako odhad. Nic jiného se nedomýšlí (ploty ani příkopy).
Kód: `pilot/public/ortho-osm.js trimToEnds` (`GREEN_STRIP`, `GREEN_STRIP_MIN`, `P.greenStrip`).

**Stav: vypnuto** (`P.greenStripOn`; v aplikaci `?zelenpas=1`, v regresi `ZELENPAS=1`). Regrese se tím nemění.

## Regrese Prahy a Brna (`node evaluation/ortofoto-osm/regrese.mjs`)

Na metrech, které profil měl už dřív, se nic nemění (pás jen prodlouží konec). Přibude 10–13 m srovnávaných metrů na
město a ortofoto, a protože část z nich má MTVU jako chodník, klesne v Praze záchyt chodníku o 1 pp:

| | složení správně | za obrubami | chodník: záchyt | F1 |
|---|---|---|---|---|
| Praha ČÚZK bez → s pásem | 68 → 68 % (1660 → 1670 m) | 62 → 62 % | 70 → 69 % | 63 → 63 % |
| Praha IPR 10 cm | 68 → 68 % (1687 → 1699 m) | 64 → 63 % | 71 → 70 % | 64 → 63 % |
| Brno ČÚZK | 69 → 69 % (1859 → 1872 m) | 64 → 64 % | 63 → 63 % | 57 → 57 % |
| Brno 10 cm | 59 → 59 % (1868 → 1869 m) | 46 → 46 % | 68 → 68 % | 57 → 57 % |

Podle pravidla (co zhorší, zůstane vypnuté) je pás vypnutý. Šířka 2 m (`PSET='{"greenStrip":2}'`) skoro nic nedělá
(je stejná jako dnešní `LAST_NONE`, 7 stran), 4 m zhorší i složení v Praze ČÚZK (68 → 67 %).

## Co je pod pásem podle MTVU (`W=3 node evaluation/ortofoto-osm/zelenpas/mtvu.mjs`)

Pás se přidá na 81 stranách (65 řezů × ortofot), dohromady 83 m:

| MTVU pod pásem | m | podíl |
|---|---|---|
| zeleň (400–499) | 38,0 | 46 % |
| zahrady (300) | 21,9 | 26 % |
| nezpevněné a ostatní přírodní (100, 200, 500) | 7,3 | 9 % |
| chodník | 6,1 | 7 % |
| vozovka, stání | 6,7 | 8 % |
| zpevněné plochy (1003, 902) | 3,3 | 4 % |

Asi 81 % přidaných metrů je opravdu nezpevněná zeleň, zahrady nebo podobně; 19 % je chodník, vozovka nebo dlažba
(pod korunami stromů nebo souběžná cesta). Regrese ale hodnotí zahradu (300) jako „jiné“, ne zeleň, proto ji
nevidí jako zlepšení.

## A/B v aplikaci v dalších státech: neproběhlo

Plán byl nasbírat profily řezů bez fasády z univerzálního vzorku s pásem a bez něj (vlastní server s `EVAL_SAVE=1`)
a dát je posoudit nezávislému posuzovateli. Spuštění serveru pro sběr bylo 23. 11. odmítnuto, takže srovnání
v aplikaci a přepočet Slovinska s pásem nejsou. Až bude sběr možný: `?zelenpas=1` proti bez, body z
`vysledky/u-*.jsonl` s `facadeA`/`facadeB` false (u odhadu 169 řezů), obrázky `evaluation/slovensko/ab/obrazky.mjs`.

**Rozhodnutí pro Báru:** zapnout přes mírný pokles záchytu chodníku v Praze (vzniká jen na nových metrech, 81 %
pásu je opravdu zeleň/zahrada), nebo počkat na A/B v aplikaci.
