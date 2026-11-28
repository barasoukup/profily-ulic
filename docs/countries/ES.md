# Španělsko (ES)

Stav nasazení: větev `spain`, 23. 11. 2026, nenasazené. Přehled všech států: [docs/countries/README.md](README.md). Pravidla od Báry platí všude, jsou v `CLAUDE.md`.

## Stav a rozhodnutí (dříve CLAUDE.md)

### Španělsko (větev spain z france, Bára 23. 11. 2026, nenasazené)

- Stát `spain` (ES): `countries/ES.js`, `towns/spain.js`, `search/cartociudad.js`, `signs-ES/`, `evaluation/spain/` (ZDROJE, NORMY, ab/).
  Hranice GISCO s ostrovy, Ceutou, Melillou a Llívií. OSM po 17 společenstvích, Ceutě, Melille a Kanárských ostrovech
  (`es_*`, Kanáry pod `africa/`, jen R2). viz seznam v `docs/deployment.md`
- Ortofoto IGN PNOA (25 cm, CORS *, CC BY 4.0; mimo Španělsko satelitní pozadí: v mapě jen nad Španělskem), budovy
  z katastru (`?catastro=0`), hledání CartoCiudad.
- Baskicko a Navarra: budovy z foralních katastrů provincií (`towns/spain-foral.js`, INSPIRE WFS Navarry, Álavy, Bizkaie,
  Gipuzkoy; provincie podle NUTS 3 v `regions-es.json`; `?foral=0`, `?foral=nc,gi`). A/B 57 domů (Bára 23. 11. 2026,
  `evaluation/spain/foral-ab/REPORT.md`): podlaží a rok z ~0 na 55 z 57, shoda s OSM ±1 v Bilbau a Donostii, Álava
  soustavně +2 a Pamplona taky: fotky dávají za pravdu katastru (OSM píše „B+4“ jako 4 a vynechá podkroví), všechny čtyři zapnuté. OSM
  Navarry, Donostie a Vitorie v lokálním balíku `es` (Bára 23. 11. 2026).
- Mapa povrchů Zaragozy (dlažby 2017: chodníky, střední a zelené pásy; vozovka jako pás kolem os OSM, `?zaragoza=0`): A/B 40
  řezů, použita ve 33: lépe 11, hůř 2, stejně 12, nejde posoudit 8; zapnutá. A Coruña (1 : 500 i s vozovkou a stáním) je ve
  složce „Intranet“ bez licence, Madrid jen jako obrázek, Barcelona jen čáry, Valencie neodpověděla.
- Normy: závazný chodník 1,8 m (TMA/851/2021), jinak doporučení ministerstva 2024. Stání: 3 m k protějšímu okraji vozovky
  (čl. 91.2 a RGC, doslova). Katalog značek je od 1. 7. 2025 nový (RD 465/2025); značky jako úřední díla (čl. 13 LPI).
  Bára 23. 11. 2026 souhlasí: 3 m doslova, sdílená stezka bez varování, zóna 30 jako tabule S-30; A Coruña se
  ptát nebudeme („moc práce bez valného užitku“), její mapu zatím nepoužívat.
- Měření 23. 11. (23 řezů v 10 městech): složení 57 %, šířka do 2 m 26 % (velké rozdíly hlavně bez fasády, posuzovatel
  měřil k okraji snímku); nejčastěji chybí chodník (10×) a stání (8×).

## Popis zdrojů a pravidel (dříve app/README.md)

### Španělsko (Bára 23. 11. 2026)

Stát `spain` (ES), `countries/ES.js`, `towns/spain.js`, `search/cartociudad.js`; hranice GISCO s Baleárami, Kanárskými ostrovy,
Ceutou, Melillou a Llívií (prstenec uvnitř francouzské díry). OSM po 17 autonomních společenstvích, Ceutě, Melille
a Kanárských ostrovech (`es_*`, Kanárské ostrovy u Geofabriku pod `africa/`, jen R2). Ortofoto IGN PNOA (WMS, 25 cm,
`lanes-ortho.js` zdroj `es`; mimo Španělsko kreslí satelitní pozadí, proto v mapě jen nad Španělskem). V Melille se pruhy
z PNOA nečtou (snímek Airbus, licence nevyjasněná).
- **Mapa povrchů Zaragozy** (dlažby města 2017: chodníky, střední a zelené pásy, IDEZar WFS) tam, kde má chodník do 25 m
  od středu řezu (`?zaragoza=0`). Vozovku jako plochu nemá: je to pás kolem os silnic z OSM, až za chodníky a budovami.
  A Coruña (1 : 500, i vozovky a stání) je ve složce „Intranet“ s nejasnou licencí, zatím ne.
- **Budovy** z katastru (Catastro INSPIRE WFS, GML): podlaží části budovy u fasády, rok, užití, byty (`?catastro=0`).
  Baskicko a Navarra mají vlastní katastr: tam se Catastra neptá, ale foralního katastru provincie (`towns/spain-foral.js`:
  Navarra, Álava, Bizkaia, Gipuzkoa, INSPIRE WFS, podlaží, rok, užití, byty; `?foral=0` vypne, `?foral=nc,gi` jen
  vybrané; Álava a Navarra mají proti OSM o 1–2 podlaží víc, fotky dávají za pravdu katastru: OSM ve Španělsku
  nepočítá přízemí a podkroví). Provincie podle hranic NUTS 3 z GISCO v `regions-es.json` (`node tools/build_boundaries.mjs regions es`; Treviño patří
  Burgosu; u vnější hranice do 500 m se ptá foralního katastru a bez domu pak Catastra). Limit 25 s, paměť na bod,
  jeden dotaz na fasádu. A/B v `evaluation/spain/foral-ab/REPORT.md`.
- **Normy:** závazná přístupnost (Orden TMA/851/2021: chodník 1,8 m), ostatní podle doporučení ministerstva dopravy
  2023/2024 (cyklo, pruhy 2,5–3 m, stání). Bez varování buspruh, tramvajový pás a sdílená stezka (5 m by svítilo všude).
  **Stání:** vedle stojícího auta 3 m k protějšímu okraji vozovky (čl. 91.2 a RGC); odhad jako v Lucembursku (pruhy vedle
  stání zůstanou průjezdné, aspoň 3 m); stání na
  chodníku zakázané. **Značky** `signs-ES/` (katalog RD 465/2025, úřední díla podle čl. 13 LPI); obytná ulice z OSM
  je S-47 (zóna 20 km/h), S-28 jen s maxspeed=10; výchozí rychlost bez značky podle čl. 50 RGC (20 / 30 / 50 km/h podle
  pruhů na směr) se nekreslí; dálnice S-1 / S-1a jen podle ref AP- / A-. **Hledání** CartoCiudad.
  Bez paneláků, univerzální vozidla. Rešerše `evaluation/spain/` (ZDROJE, NORMY).
