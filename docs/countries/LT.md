# Litva (LT)

Stav nasazení: větev `estonia`, 24. 11. 2026, nenasazené. Přehled všech států: [docs/countries/README.md](README.md). Pravidla od Báry platí všude, jsou v `CLAUDE.md`.

## Stav a rozhodnutí (dříve CLAUDE.md)

### Litva (větev estonia, Bára 24. 11. 2026, nenasazené)

- Stát `lithuania` (LT): `countries/LT.js`, `towns/lithuania.js`, `signs-LT/`, `evaluation/lithuania/` (SOURCES, NORMS, REPORT,
  ab/). Hranice GISCO za polskou PRG; OSM balík `lt` (jen R2).
- Pobřeží 400 m (LT, FI, DK) jen u moře (Bára 24. 11. 2026): úseky hranic na souši (`states.json` `land_*`, čáry GISCO bez
  příznaku pobřeží) se nepočítají a bod blíž hranici než pobřeží státu nepatří (300 m v Lotyšsku, Bělorusku, Rusku, Švédsku ne).
- **Žádné ortofoto** (Bára 24. 11.: ortofoto NŽT je jen k prohlížení na geoportálu, nepoužívat, úřadům nepsat):
  `laneOrtho: "none"`, mimo Vilnius jen odhad z OSM.
- Vilnius: topografické plochy 1 : 500 (`gis.vplanas.lt` …/MapServer/13, `KODAS` + `Paskirtis`) jako plochy řezu, když pod
  středem řezu leží vozovka mapy (pod pěšinou i chodník). **Vypnutá** (`?vilnius=1` zapne). Licence neuvedená, Bára je vzala jako kodaňské,
  kredit „Vilniaus miesto savivaldybė / Vilniaus planas“. A/B 26 řezů: lépe 17, hůř 2 (na ulicích 6 : 0, zbytek pěšiny
  a obslužné cesty); univerzální měření (10 řezů) ale mapa 53 % proti odhadu 75 % (`evaluation/lithuania/REPORT.md`).
  Bára 24. 11. 2026 po nepřátelské recenzi: co je horší, zůstane vypnuté, mapa je vypnutá a v mapě pokrytí není (do
  většího vzorku naslepo). Recenze `evaluation/lithuania/REVIEW.md`; model obrub (`?ai`) v Litvě neběží (bez ortofota).
- Vzhled domů z OSM (GRPK bez podlaží a roku). Obrysy budov GRPK (geoportal.lt `NZT/GRPK/MapServer/22`, CC BY 4.0, Bára
  24. 11. 2026) ukončují řez u fasády: pod mapou Vilniusu před budovami OSM, v odhadu jen domy, které OSM nemá; `?grpk=0`.
  A/B 88 řezů: změněno 14, lépe 5, hůř 2; měření: složení beze změny (53 %), šířka do 1 m 0 → 20 %. Zapnuté. Hledání Photon. Normy z příruček Vilniusu a Kaunasu
  (oranžově). Stání 3 m na směr, na chodníku jen se značkou. Značky z Commons (Augustasci CC BY 4.0, tabulky Gigillo83
  CC BY-SA 4.0, v patičce). Socialistické vzhledy ano (sovětská sídliště jako v Estonsku).
- Přeměření 24. 11. 2026: LT 75 % bez mapy Vilniusu, s `?vilnius=1` 53 % (hůř 6, lépe 0 z 10), mapa zůstává vypnutá.

## Popis zdrojů a pravidel (dříve app/README.md)

### Litva (Bára 24. 11. 2026)

Stát `lithuania` (LT), `countries/LT.js`, `towns/lithuania.js`; hranice GISCO (za polskou PRG), na pobřeží 400 m tolerance
(Klaipėda, Kuršská kosa); OSM balík `lt` (jen R2). **Žádné ortofoto:** celostátní ortofoto NŽT je licencované jen
k prohlížení na geoportal.lt (`evaluation/lithuania/SOURCES.md`), takže `laneOrtho: "none"` (`lanes-ortho.js` nevrátí
snímek), pruhy z ortofota ani podklad mapy nejsou; mimo Vilnius profil jen odhadem z OSM („jen odhad z OSM“). Vilnius:
topografické plochy 1 : 500 (`gis.vplanas.lt` … `Vilnius_basemap_LKS_su_rajonu/MapServer/13`, kód povrchu `KODAS` a účel
`Paskirtis`: `kelias` vozovka, `pėsč` chodník, `dvir` cyklo, `park` stání, `nuovaža` vjezd…) jako plochy řezu, když pod
středem řezu (do 3 m) leží vozovka mapy (pod pěšinou i chodník); před nimi budovy OSM, po nich zeleň a voda OSM
(`?vilnius=0` vypne). Licence neuvedená, kredit „Vilniaus miesto savivaldybė / Vilniaus planas“ (Bára jako u Kodaně).
A/B `evaluation/lithuania/ab/REPORT.md`. Vzhled domů z OSM (GRPK nemá podlaží ani rok); obrysy budov GRPK
(geoportal.lt `NZT/GRPK/MapServer/22`, CC BY 4.0) ukončují řez u fasády: pod mapou Vilniusu před budovami OSM, v odhadu
jen domy, které OSM nemá (`?grpk=0` vypne; A/B v `evaluation/lithuania/REPORT.md`). Hledání Photon. Normy jen
z městských příruček Vilniusu (2021) a Kaunasu (2024), oranžově. Stání 3 m na směr (KET 150.7, z druhé ruky), na
chodníku jen se značkou. Značky `signs-LT/` (Commons, Augustasci CC BY 4.0 / public domain, tabulky Gigillo83 CC BY-SA
4.0; 329 jako šablona aplikace). Socialistické vzhledy domů ano (sovětská sídliště jako v Estonsku), neutrální vozidla,
český mobiliář, rakouské označníky.
