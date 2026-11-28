# Finsko (FI)

Stav nasazení: větev `estonia`, 23. 11. 2026, nenasazené. Přehled všech států: [docs/countries/README.md](README.md). Pravidla od Báry platí všude, jsou v `CLAUDE.md`.

## Stav a rozhodnutí (dříve CLAUDE.md)

### Finsko (větev estonia, Bára 23. 11. 2026, nenasazené)

- `countries/FI.js`, `towns/finland.js`, `search/ryhti.js` (Photon + adresy Ryhti), `signs-FI/`, `evaluation/finland/`
  (ZDROJE, NORMY, ab/, buildings-ab/). Hranice GISCO s Alandami, pobřeží 400 m. OSM balík `fi` (jen R2, celé Finsko 366 MB;
  viz seznam v `docs/deployment.md`). Bez klíče MML (Bára): ortofoto jen Helsinek, Espoo a Turku (CC BY 4.0), jinde
  odhad jen z OSM. Mapa povrchů Helsinek YLRE (`?helsinki=0`; slepé A/B 31 ulic pro auta: lépe 16, hůř 9 (`evaluation/finland/ab2`), s doplněním
  kolem mapy na týchž (ladicích) ulicích 20 : 1, na nových obytných ulicích 11 : 7 (`ab3`); první A/B z 23. 11. (10 : 3) nebylo slepé). Budovy
  z registru Helsinek a Ryhti (`?hkibuild=0`, `?ryhti=0`; 40 domů: podlaží 39 proti 31 z OSM, rok 36 proti 5, dřevo 4).
  Normy jen doporučení, nic červeně. Otevřené otázky v `docs/backlog.md`.
- Měření přesnosti 24. 11. (poprvé, posuzoval Opus): shoda složení 52 % (22 řezů); Helsinky, Espoo, Turku 51 % (šířka do 2 m
  31 %), bez ortofota (Tampere, sever Vantaa) 54 % (šířka 11 %) (`evaluation/universal/REPORT.md`).
- Doplnění kolem mapy povrchů (Bára 24. 11. 2026, všude v zahraničí, kde je ortofoto; `?off=mapfill`): za koncem mapy
  zeleň a chodníky podle modelu jako v odhadu, ve vozovce mapy stání podle aut na ortofotu a stání z OSM smí zúžit pruhy.
  Nový slepý A/B obytných ulic Helsinek: lépe 14 : 4 proti dřívějšímu, mapa proti odhadu 11 : 7; Tallinn, Vídeň bez prohry
  (`evaluation/finland/ab3/REPORT.md`).

## Popis zdrojů a pravidel (dříve app/README.md)

### Finsko (Bára 23. 11. 2026)

Stát `finland` (FI), `countries/FI.js`, `towns/finland.js`; hranice GISCO včetně Alandských ostrovů (finská pravidla,
vlastní silniční zákon Alandy nečten), na pobřeží 400 m tolerance jako u Španělska (`city.js` COAST); OSM balík `fi`
(jen R2, celé Finsko zabalené 366 MB). Celostátní ortofoto MML chce osobní klíč (v prohlížeči by byl vidět): ortofoto jen
měst, každé jen ve svém obdélníku (`lanes-ortho.js` `FI_ORTHO`, `fi`): Helsinky 2026 (5 cm, tosiortofoto), Espoo
„Ortokartta“ (asi 30 cm), Turku 2022 (tosiortofoto 5 cm), vše CC BY 4.0; jinde profil jen z OSM. Mapa povrchů Helsinek
z registru veřejných ploch YLRE (WFS kartta.hel.fi, jako Tallinn: budovy OSM před ní, zeleň a voda OSM po ní, jen kde má
pod středem řezu (do 3 m) díl svého druhu, pod ulicí pro auta vozovku; `?helsinki=0`; slepé A/B ulic pro auta
`evaluation/finland/ab2/REPORT.md`: lépe 16, hůř 9; s doplněním kolem mapy na nových obytných ulicích 11 : 7, `ab3`).
Budovy: v Helsinkách registr budov města (podlaží, rok, materiál, fasáda, užití; `?hkibuild=0`), jinde Ryhti SYKE (body
uvnitř obrysu domu z OSM; `?ryhti=0`); dřevěný dům jde do severských vzhledů (`house-looks.js nordicLook("FI")`; A/B
`evaluation/finland/buildings-ab/REPORT.md`). Hledání: Photon ve finštině/švédštině a adresy Ryhti `open_address`
(`search/ryhti.js`). Normy jen doporučení (Väylä 18/2020, Helsinki „Katutilan mitoitus“ 2014): nic červeně, oranžově pod
nejnižší doporučenou šířkou (`evaluation/finland/NORMS.md` E). Stání 3 m na směr, na chodníku zakázané. Značky
`signs-FI/` (příloha 3 zákona 729/2018, Commons public domain; README tam). Bez paneláků, neutrální vozidla, český
mobiliář, rakouské označníky.
