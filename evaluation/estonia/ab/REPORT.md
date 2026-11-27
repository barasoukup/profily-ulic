# A/B: mapa povrchů Tallinnu (23. 11. 2026)

Vzorek `sample.json` (`sample.mjs`, semínko 20261126): 40 náhodných bodů do 3 km od středu Tallinnu. Sběr v aplikaci
(localhost, `?osm=balik`), každý bod A = bez mapy (`?tallinn=0`, odhad z ortofota Maa- ja Ruumiamet a OSM) a B = s mapou
povrchů města (`tar_maakate`: vozovky, chodníky a cesty, pojízdné plochy, krajnice, jiné plochy, trávníky, záhony, dvory;
před ní budovy z OSM, po ní zeleň a voda z OSM). Výsledky `results/a.json`, `b.json`, spojené `rezy.json`; obrázky
`data/images/` (jen lokálně, git je nesleduje; nahoře A modře, dole B červeně, nad ortofotem z dlaždic úrovně 18; `ORTHO=ee` v
`evaluation/slovakia/ab/images.mjs`).

- Mapa použita ve 24 řezech ze 40 (jinde vozovka ani chodník mapy do 15 m od středu řezu nebyly, nebo bod padl mimo ulice).
- Posudky (`results/posudky.json`, posuzovatel nad obrázky 10 px = 1 m, ortofoto asi 0,3 m na pixel, bez fotek z ulice):
  **lépe B 11, lépe A 4, stejně 1, nejde posoudit 8.**
  - Lépe B: A kreslí obslužnou cestu nebo vozovku moc úzkou, B pokryje celou viditelnou zpevněnou plochu (tl4, tl8,
    tl13, tl17, tl36, tl40); B přidá chodník a stromořadí (tl33); tl16, tl22, tl39 jen těsně.
  - Lépe A: tl9 (B nemá pěšinu přes trávník), tl31 (B kreslí asfalt jako zeleň), tl34 (obruba B posunutá do asfaltu,
    tráva jako chodník), tl26 (B začíná vozovku moc vpravo).
- Univerzální měření (4 řezy Tallinnu z 12 estonských): shoda složení Estonska 45 → 51 %.
- Univerzální měření: číslo „45 → 51 %“ stojí jen na 4 tallinnských řezech (n = 4, dva ve Starém Městě s nečitelným
  ortofotem); dnešní přepočet (pravidlo stran bez fasády z 24. 11.) dává pro Estonsko 43 % (`../REPORT.md`).
- Mapa zůstává zapnutá (`?tallinn=0` vypne). Licence: služba ji neuvádí; Bára 23. 11. 2026: městské dílo, nepoužíváme ho
  k ničemu špatnému, s kreditem města.

Otevřené: pole `kate` (povrch) nevyužité; tl38 ztratil střední pás se stromy, který měl odhad.

**Recenze 24. 11. 2026 (bod 5): první kolo nebylo slepé, výhry byly hlavně mimo ulice (7 z 11 na bezejmenných cestách,
dvorech a parkovištích), třetina „nejde posoudit“, pravidlo slabší než ve Vilniusu.** Proto druhé kolo níže; první kolo
zůstává jen pro historii.

## Druhé kolo: slepě, jen pojmenované ulice pro auta (24. 11. 2026)

- **Pravidlo** (`towns/estonia.js hasStreet`, jako Vilnius): pod středem řezu do 3 m musí ležet vozovka mapy (vrstva 36);
  u obslužné cesty stačí i pojízdná plocha (dvůr, parkoviště), chodník nebo cesta mapy jen pod pěší cestou. Dřív stačila
  vozovka nebo chodník do 15 m. Mapa se ptá nadvakrát: nejdřív vozovky a chodníky, ostatních šest vrstev jen při zásahu.
- **Vzorek** `sample2.json` (`sample2.mjs`, semínko 20261124): 40 pojmenovaných ulic pro auta (residential až primary,
  jeden řez na ulici) z lokálního balíku OSM v obdélníku celého města (24,60–24,88; 59,38–59,47), ne jen do 3 km od středu.
  Sběr v aplikaci na localhostu (`?osm=balik`, A `?tallinn=0`, B s mapou), `results/rezy2.json`.
- Mapa použita v **39 ze 40** řezů (Ülase ne). Jeden řez (Pirita tee) padl na bezejmennou cestu: vyřazen jako „nejde“.
- **Slepě**: `blind.mjs prepare` přeházel A a B náhodně na X a Y (klíč v `data/klic.json`), obrázky beze jmen variant
  (`images.mjs` s LA/LB „varianta X/Y“), seznamy dílů bez hvězdiček odhadu; k 28 řezům fotka z Mapillary podél ulice
  do 20 m (`blind.mjs photos`). Posudky `results/posudky2.json`, odslepené `results/posudky2-odslepene.tsv`.
- **Výsledek (39 řezů): lépe s mapou 10, lépe bez mapy 4, stejně 15, nejde posoudit 10.** S fotkou: lépe s mapou 8, bez
  mapy 4, stejně 12, nejde 4 (z 28).
  - Podle druhu ulice: residential 3 : 1 (stejně 6), secondary 2 : 1 (3), tertiary 2 : 0 (1), primary 2 : 2 (2),
    living_street 1 : 0 (2), unclassified 0 : 0 (1).
  - Lépe s mapou: počet pruhů a zeleň mezi vozovkami (Mere pst, Mustamäe tee, Eduard Vilde tee, Endla, Tondi), úzká
    jednopruhová ulička (Vuti, Veduri, Rüütli), suchý trávník místo zpevněné plochy (Imanta), hlavní silnice čtyřmi pruhy
    místo dvou (Paldiski mnt).
  - Lépe bez mapy: **Sõpruse pst a Ehitajate tee: s mapou deset pruhů po 4 m** (vozovka mapy přes obě vozovky i střední
    pás se rozdělí na pruhy, strop 4 m), Magdaleena (v křižovatce krajnice 6,6 m po obou stranách), Järvevana tee
    (nájezdová rampa jako krajnice 6,9 m).
  - „Nejde posoudit“ jsou hlavně řezy přes křižovatky s přechody (Jõe, Juhkentali, Pronksi, Kotka, Lootsi) a kruhový
    objezd (Sääse).
- **Slabiny posudku**: posuzoval agent, který A/B připravil (samostatného posuzovatele spustit nešlo); seznamy dílů
  s hvězdičkami odhadu jednou viděl, než je skryl, a odhad i mapa mají poznatelný „rukopis“ (mapa drobné plochy 0,5 m,
  odhad dvojice cyklostezek 1,3 m), takže slepota je jen částečná. Fotka z Mapillary je podél ulice, ne vždy přesně
  na řezu.
- **Závěr**: mapa vyhrává 10 : 4 na pojmenovaných ulicích, zůstává zapnutá (`?tallinn=0` vypne). Otevřené: dělení široké
  vozovky mapy přes střední pás (Sõpruse pst, Ehitajate tee) a řezy v křižovatkách.

## Budovy ETAK (recenze body 3 a 8, 24. 11. 2026)

- `korgus_m` je výška k hřebeni. Kalamaja, 261 obytných domů s `building:levels` z OSM: podlaží = výška / 3 sedí v 5 %,
  (výška − 3) / 3 v 69 % (průměrná odchylka 1,24 → 0,35 podlaží). Nové pravidlo (`etakBuilding`): (výška − 3) / 3,
  `fromHeight` (podlaží z OSM vyhrají), střecha se neurčuje (žádná plochá střecha z výšky); kůlny a garáže do 4,5 m
  („Kõrval- või tootmishoone“) jako garáž, zříceniny, základy a rozestavěné domy bez podlaží.
- A/B proti fotkám (`houses.mjs`, 60 domů Kalamaja a 30 Nõmme náhodně, Mapillary dívající se na dům 8–35 m): posouditelných
  15 domů, vše Kalamaja (v Nõmme jen 4 fotky z auta, dům na nich nejde určit). **A (výška / 3, přebíjí OSM) přesně 2,
  B (dnes) přesně 4; průměrná odchylka A 1,40, B 0,73 podlaží; blíž B 12×, blíž A 2×.** B i OSM často dávají 3 tam, kde
  fotka ukazuje 2 podlaží na kamenném soklu s podkrovím (počítala jsem plná podlaží bez soklu a podkroví). Posudky
  `results/posudky-domy.json`, data `results/domy.json`, fotky jen lokálně (`data/domy/foto/`).
- Dopad na vzhled: tallinnský dům potřebuje 2–3 podlaží; s výškou / 3 měly domy Kalamaje ze vzorku 4–5 podlaží
  (tallinnský dům nikdy), dnes 3.
