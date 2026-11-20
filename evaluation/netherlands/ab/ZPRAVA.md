# A/B: mapa povrchů BGT v Nizozemsku (20. 11. 2026)

Vzorek `sample.json` (`sample.mjs`, semínko 20261120): Amsterdam 8, Rotterdam 7, Haag 7, Utrecht 7, Haarlem 4,
Leiden 4 náhodných bodů do 1,5 km od centra (37). Sběr v aplikaci (localhost, `?osm=balik` s lokálním balíkem OSM
vzorových měst), každý bod hned po sobě A = bez BGT (`?bgt=0`, odhad z ortofota PDOK a OSM) a B = s BGT. Výsledky
`vysledky/rezy.json`, obrázky `images/` (nahoře A modře, dole B červeně, nad ortofotem PDOK;
`ORTHO=nl` v `evaluation/slovensko/ab/obrazky.mjs`).

| město | řezů | BGT použita | profil se liší | chyba |
|---|---|---|---|---|
| Amsterdam | 8 | 6 | 6 | 0 |
| Rotterdam | 7 | 3 | 3 | 0 |
| Haag | 7 | 7 | 7 | 0 |
| Utrecht | 7 | 5 | 5 | 0 |
| Haarlem | 4 | 4 | 4 | 0 |
| Leiden | 4 | 4 | 4 | 0 |
| celkem | 37 | 30 | 30 | 0 |

BGT nepoužita u 7 řezů: pod středem nebyla plocha ulice (voda u grachtu, dvůr, kolejiště), tam zůstává odhad.

## Posudky nad ortofotem (všech 30 změněných)

- **Lépe B (12):** am1 Willemsstraat, am6 Kerkstraat, am7 Marnixstraat (koleje a stání podle mapy), de1 Nassauplein
  (cyklostezky a stání po obou stranách), de2 Prins Clauslaan (A tři pruhy a „neznámé“, B celý profil se stezkami
  a středním pásem), de5 Westeinde (stání jen vlevo jako na snímku), ro1 Proveniersstraat (oddělené cyklostezky místo
  cyklopruhů), ha3 Zuid Brouwersstraat (úzká ulička 5 m, A plocha a dva pruhy přes 7 m), ha4 (stání vlevo s auty),
  le2 1e Binnenvestgracht (bez stání jako na snímku), le3 Oranjestraat (stání na správné straně), ut6 (stání u parkoviště).
  Typicky chodníky a obruby na místě, cyklostezky oddělené od vozovky, stání tam, kde stojí auta.
- **Stejně (12):** am3, am5, am8, de4, ha1, ha2, le1, le4, ro3, ro5, ro6, ut1.
- **Hůř nebo sporně B (4):** de7 a ut4 (průchod pod budovou: B 29,6 m a 22,9 m pěší plochy), de3 (dvůr u vody: plocha
  18 m), ut2 (cesta v parku jako 5,75 m chodník, na snímku asi 3 m).
- **Nejde posoudit (2):** de6 (nástupiště nádraží Den Haag: B je kreslí jako nástupiště, A 2 m chodník), ut3.

## Výsledek

BGT zůstává zapnutá (`?bgt=0` vypne). Řezy uprostřed pěších ploch a průchodů dávají jednu velkou plochu; je to
skutečný stav mapy (pěší plocha), ne chyba čtení, ale v profilu to nic neříká. Případné omezení (jako ve Švýcarsku jen
vozovka pod středem) zkusit, kdyby si toho Bára všimla.
