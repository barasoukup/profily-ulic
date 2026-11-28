# Estonsko (EE)

Stav nasazení: větev `estonia`, 23. 11. 2026, nenasazené. Přehled všech států: [docs/countries/README.md](README.md). Pravidla od Báry platí všude, jsou v `CLAUDE.md`.

## Stav a rozhodnutí (dříve CLAUDE.md)

### Estonsko (větev estonia z italy, Bára 23. 11. 2026, nenasazené)

- `countries/EE.js`, `towns/estonia.js`, `search/inads.js` (In-ADS), `signs-EE/`, `evaluation/estonia/` (ZDROJE, NORMY). Hranice
  GISCO, OSM balík `ee` (jen R2; viz seznam v `docs/deployment.md`). Ortofoto z dlaždic TMS z18 (WMS má vodoznak),
  budovy ETAK s výškou. Mapa povrchů Tallinnu zapnutá (`?tallinn=0`; licenci neuvádí, Bára: městské dílo s kreditem, není
  zákaz; A/B lépe 11, hůř 4). Měření 23. 11. (12 řezů): složení 51 %, šířka do 2 m 25 %. Otevřené otázky norem v
  `docs/backlog.md`.
- Normy (Bára 23. 11. 2026, podle doporučení): chodník 1,5 / 2,0 m všude (tallinnských 2,5 m jen doporučení), jízdní pruh
  základ 2,75 m (méně planých varování), vedle stání 3 m na směr, pěší zóna 381 s 432, stání a tramvaj bez varování;
  normy nekupujeme (EVS 843 jen z druhé ruky).

## Popis zdrojů a pravidel (dříve app/README.md)

### Estonsko (Bára 23. 11. 2026)

Stát `estonia` (EE), `countries/EE.js`, `towns/estonia.js`; hranice GISCO, OSM balík `ee` (jen R2). Ortofoto Maa- ja
Ruumiamet z dlaždic TMS `foto@GMC` úrovně 18 (osa y odspodu, `lanes-ortho.js` `tms: true`; WMS v plném rozlišení má
vodoznak, proto ne), podklad mapy do z21. V Tallinnu mapa povrchů města (`tar_maakate`, vrstva po vrstvě; licenci
neuvádí, Bára: městské dílo s kreditem), před ní budovy a po ní zeleň z OSM, jen kde má vozovku nebo chodník do 15 m od
středu řezu (`?tallinn=0`; A/B lépe 11, hůř 4, `evaluation/estonia/ab/REPORT.md`). Budovy ETAK (WFS,
výška u fasády → podlaží po 3 m, `?etak=0`), hledání adres In-ADS (`search/inads.js`). Normy: chodník 1,5 / 2 m (nařízení
o přístupnosti 2026, závazné), ostatní EVS 843 z druhé ruky; stání a tramvaj bez varování. Stání 3 m na směr, na chodníku
jen se značkou a 1,5 m pro chodce. Značky `signs-EE/` (nařízení MKM nr 12, úřední díla; část překreslení CC BY-SA 4.0).
Paneláky jako v Česku (Lasnamäe, Mustamäe).
