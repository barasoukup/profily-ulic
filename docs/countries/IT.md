# Itálie (IT)

Stav nasazení: větev `italy`, 23. 11. 2026, nenasazené. Přehled všech států: [docs/countries/README.md](README.md). Pravidla od Báry platí všude, jsou v `CLAUDE.md`.

## Stav a rozhodnutí (dříve CLAUDE.md)

### Itálie (větev italy z malta, Bára 23. 11. 2026, nenasazené)

- **Jen oblasti s ortofotem s otevřenou licencí** (Bára 23. 11.: ortofota AGEA „jen pro institucionální účely“ nesplňujeme):
  provincie Bolzano, Turín, Bologna, Modena (hranice ISTAT, `tools/italy-border.json`; kredit Turína ve znění Geoportálu města
  „Base cartografica realizzata da …“, Bára 23. 11. 2026). Zbytek Itálie, Vatikán a San Marino zatím mimo; Apulie 2023 bez licence.
  Bolzano 2023: nálet provincie ve spolupráci s AGEA, licence provincie CC BY 4.0 (Bára 23. 11. 2026: používat).
  Stání 3 m na směr je Bářina konvence (čl. 157 odst. 4 CdS mluví jen o jednosměrce se stáním vlevo).
- `countries/IT.js`, `towns/italy.js`, `signs-IT/`, `evaluation/italy/` (ZDROJE, NORMY, ab/). OSM 5 dílů (jen R2;
  viz seznam v `docs/deployment.md`). Plochy silnic Bologni vypnuté (celé uliční prostory), výšky budov Bologni zapnuté.
- Měření 23. 11. (6 řezů): složení 56 %, šířka do 2 m 33 %.

## Popis zdrojů a pravidel (dříve app/README.md)

### Itálie (Bára 23. 11. 2026)

Stát `italy` (IT), `countries/IT.js`, `towns/italy.js`; **jen oblasti s ortofotem s otevřenou licencí** (Bára: vrstvy
AGEA regionů jsou „jen pro institucionální účely“, to nesplňujeme): provincie Bolzano a obce Turín, Bologna, Modena
(hranice ISTAT 1. 1. 2026, CC BY 4.0, `tools/italy-border.json`; GISCO 1 : 1 M zabíral pruhy sousedních obcí, kde je ortofoto města černé). Turín je v kreditu ve znění, které žádá Geoportál města („Base cartografica realizzata da …“). Zbytek Itálie, Vatikán a San Marino profil nedostanou (hláška, `city.js closedAt`, `states.json` `closed_it`).
Ortofota CC BY 4.0: Bologna 2023, Modena 2024 (služby regionu Emilia-Romagna), Turín 2023, Bolzano 2023 (nálet provincie
ve spolupráci s AGEA, licenci CC BY 4.0 dává provincie) (`lanes-ortho.js IT_ORTHO`, podle obdélníku oblasti; výpadek se ohlásí). OSM po 5
dílech Geofabriku (jen R2). Výšky budov Bologni (`?bolognadomy=0`); plochy silnic Bologni vypnuté (`?bologna=1`; jsou to
celé uliční prostory i s chodníky, A/B `evaluation/italy/ab/REPORT.md`). Normy podle D.M. 5. 11. 2001 (pruh podle třídy z OSM:
3,25 / 3 / 2,75 m, v obytné zóně bez varování), D.M. 557/1999 (obousměrná stezka 2,5 m, společná stezka oranžově pod 2,5 m)
a přístupnosti (0,9 m); stání 3 m na směr (konvence aplikace, zákon dává 3 m jen u stání vlevo v jednosměrce). Značky `signs-IT/` (Regolamento, úřední díla).
