# A/B: mapa povrchů Tallinnu (23. 11. 2026)

Vzorek `sample.json` (`sample.mjs`, semínko 20261126): 40 náhodných bodů do 3 km od středu Tallinnu. Sběr v aplikaci
(localhost, `?osm=balik`), každý bod A = bez mapy (`?tallinn=0`, odhad z ortofota Maa- ja Ruumiamet a OSM) a B = s mapou
povrchů města (`tar_maakate`: vozovky, chodníky a cesty, pojízdné plochy, krajnice, jiné plochy, trávníky, záhony, dvory;
před ní budovy z OSM, po ní zeleň a voda z OSM). Výsledky `vysledky/a.json`, `b.json`, spojené `rezy.json`; obrázky
`images/` (nahoře A modře, dole B červeně, nad ortofotem z dlaždic úrovně 18; `ORTHO=ee` v
`evaluation/slovensko/ab/obrazky.mjs`).

- Mapa použita ve 24 řezech ze 40 (jinde vozovka ani chodník mapy do 15 m od středu řezu nebyly, nebo bod padl mimo ulice).
- Posudky (`vysledky/posudky.json`, posuzovatel nad obrázky 10 px = 1 m, ortofoto asi 0,3 m na pixel, bez fotek z ulice):
  **lépe B 11, lépe A 4, stejně 1, nejde posoudit 8.**
  - Lépe B: A kreslí obslužnou cestu nebo vozovku moc úzkou, B pokryje celou viditelnou zpevněnou plochu (tl4, tl8,
    tl13, tl17, tl36, tl40); B přidá chodník a stromořadí (tl33); tl16, tl22, tl39 jen těsně.
  - Lépe A: tl9 (B nemá pěšinu přes trávník), tl31 (B kreslí asfalt jako zeleň), tl34 (obruba B posunutá do asfaltu,
    tráva jako chodník), tl26 (B začíná vozovku moc vpravo).
- Univerzální měření (4 řezy Tallinnu z 12 estonských): shoda složení Estonska 45 → 51 %.
- Mapa zůstává zapnutá (`?tallinn=0` vypne). Licence: služba ji neuvádí; Bára 23. 11. 2026: městské dílo, nepoužíváme ho
  k ničemu špatnému, s kreditem města.

Otevřené: pole `kate` (povrch) nevyužité; tl38 ztratil střední pás se stromy, který měl odhad.
