# Slovinsko (SI)

Stav nasazení: větev `estonia`, 23. 11. 2026, nenasazené. Přehled všech států: [docs/countries/README.md](README.md). Pravidla od Báry platí všude, jsou v `CLAUDE.md`.

## Stav a rozhodnutí (dříve CLAUDE.md)

### Slovinsko (větev estonia, Bára 23. 11. 2026, nenasazené)

- `countries/SI.js`, `towns/slovenia.js`, `search/gurs.js` (Photon + čísla domů GURS), `signs-SI/`, `evaluation/slovenia/`
  (ZDROJE, NORMY, ab/). Hranice GISCO, OSM balík `si` (jen R2; viz seznam v `docs/deployment.md`). Mapa povrchů
  není: odhad z OSM a ortofota GURS DOF025 25 cm (server občas 30 s visí a vrátí 504: až 3 pokusy po 4 s, celkem nejvýš
  12 s, snímky se pamatují; čtverec pro model obrub stejně do 9 s, po výpadku se minutu neptá, `SI_RETRY` v
  `lanes-ortho.js`). Budovy z katastru GURS (`?gurs=0`; A/B 40 domů: víc údajů, podlaží 39 proti 17 z OSM, rok 39 proti 0,
  správnost jen na 9 fotkách; katastr počítá obytné podkroví jako podlaží: dům o 2–4 podlažích nižší než 3 m × podlaží
  + 2 m nad vchodem (H2 − H3) má horní podlaží ve střeše, `?off=podkrovi`; laděné i hodnocené na stejných 54 domech,
  31 → 37, bez odloženého vzorku, `ab/REPORT.md`). Stání podle ZPrCP čl. 65 (na obousměrce jen se středovou čárou,
  `parkOnRoadway`). Cyklisté v protisměru 3,2 m (čl. 38) jen na sběrných a vyšších, ne na obslužných ulicích (odst. 2).
  Pruhy `primary`/`secondary` bez varování (druh silnice a rychlost neznáme). Socialistický vzhled ne.
  Kredit „stav 11/2026“ (rok náletu služba neuvádí). Otevřené otázky v `docs/backlog.md`.

## Popis zdrojů a pravidel (dříve app/README.md)

### Slovinsko (Bára 23. 11. 2026)

Stát `slovenia` (SI), `countries/SI.js`, `towns/slovenia.js`; hranice GISCO (za Itálií a Rakouskem, Chorvatsko zůstává
cizina), OSM balík `si` (jen R2). Mapa povrchů ulic není (`evaluation/slovenia/SOURCES.md`): profil je odhad z OSM a
ortofota GURS DOF025 (25 cm, WMS ve Web Mercatoru, `lanes-ortho.js` `si`; server buď odpoví do sekundy, nebo 30 s visí
a vrátí 504: první dotaz má polovinu času, po 300 ms jeden další; podklad mapy jen uvnitř hranice). Budovy z katastru GURS
(WFS `wfs-si-gurs-kn`, vrstva STAVBE, filtr FES na obrys `OBRIS_GEOM` v bodě, jinak nejbližší obrys do 6 m; podlaží nad
zemí = `STEVILO_ETAZ` − `STEVILKA_PRITL_ETAZE` + 1, rok, výška H2 − H3 (střecha nad terénem u vchodu), nosná konstrukce, byty; katastr počítá obytné
podkroví jako podlaží: dům o 2–4 podlažích nižší než 3 m × podlaží + 2 m má horní podlaží ve střeše; `?gurs=0`; A/B
`evaluation/slovenia/ab/REPORT.md`). Hledání: Photon ve slovinštině a čísla domů GURS `NASLOVI_HS` (`search/gurs.js`).
Normy: pravidla o cyklistických plochách a o projektování silnic (dál se používají, nové k ZCes-2 nevyšly), chodník bez
varování (minimum nenalezeno), kolmé stání bez varování. Stání 3 m na směr, na obousměrce jen se středovou čárou (OSM
`lanes` ≥ 2, ne `lane_markings=no`) a na jednosměrce s jedním pruhem (ZPrCP čl. 65, `parkOnRoadway`), na chodníku jen se
značkou a s 1,6 m pro chodce. Značky `signs-SI/` (čísla pravidla 2015/2024, kresby většinou z pravidla 2000; README tam).
Bez paneláků (jugoslávská sídliště nejsou české panelové domy), neutrální vozidla, český mobiliář, rakouské označníky.
