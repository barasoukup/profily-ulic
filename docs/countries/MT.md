# Malta (MT)

Stav nasazení: větev `malta`, 23. 11. 2026, nenasazené. Přehled všech států: [docs/countries/README.md](README.md). Pravidla od Báry platí všude, jsou v `CLAUDE.md`.

## Stav a rozhodnutí (dříve CLAUDE.md)

### Malta (větev malta z cyprus, Bára 23. 11. 2026, nenasazené)

- Stát `malta` (MT): `countries/MT.js`, `towns/malta.js`, `signs-MT/`, `evaluation/malta/` (ZDROJE, NORMY). Hranice z OSM
  s výsostnými vodami, OSM balík `mt` (jen R2; viz seznam v `docs/deployment.md`). Jízda vlevo.
- Ortofoto stavebního úřadu 2018 ve stupních (služba nemá Web Mercator), jen odhad z OSM a ortofota. Normy: chodník 1,2 m
  jen oranžově, kolmé stání 4,8 m; volná šířka vedle stání 4,1 / 3 m podle DC15, nejméně 2,5 m na pruh. Britské značky pod
  OGL v1.0: věta o licenci v patičce i v exportu (`credits.js ukSigns`), stejně na Kypru.
- Měření 23. 11. (8 řezů v 6 městech): složení 55 %, šířka do 2 m 63 %, pruhy 38 %; chybí chodník 5×, stání 4×.

## Popis zdrojů a pravidel (dříve app/README.md)

### Malta (Bára 23. 11. 2026)

Stát `malta` (MT), `countries/MT.js`, `towns/malta.js`; hranice z OSM i s výsostnými vodami (`tools/malta-border.json`),
OSM balík `mt`. Jízda vlevo. Ortofoto stavebního úřadu 2018 (15 cm, CC BY 4.0); služba nemá Web Mercator, výřez se ptá
ve stupních (`lanes-ortho.js MT_ORTHO`, CRS:84). Mapa povrchů, stání ani budovy s podlažími nejsou. Normy: chodník 1,2 m
jen oranžově (zásady přístupnosti, doporučení), kolmé stání 4,8 m (DC15), jinak bez varování. Volná šířka vedle stání:
aspoň 4,1 m obousměrka a 3 m jednosměrka (DC15), nejméně 2,5 m na každý pruh. Značky `signs-MT/` jen z přílohy S.L. 65.05
(maltské kresby PD, britské pod OGL v1.0, uvedeno v patičce i v exportu; jednosměrka po směru, cyklistické stezky a „Except cycles“
se nekreslí, vlastní kresby II.E11, II.B6, II.D12 bez úředního čísla). Hledání Photon. Měření `evaluation/malta/REPORT.md`.
