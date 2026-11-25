# Washington: domy z odhadních tabulek CAMA (25. 11. 2026)

Služba `maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Property_and_Land_WebMercator/MapServer` (CORS pro dotazující se
web; licence **CC BY 4.0** v metadatech opendata.dc.gov, jen s výhradou, že data vznikla pro odhad daně). Skutečná pole:
- 25 Residential (109 406): `SSL, AYB` (rok), `STORIES` (i 2,5), `STYLE_D, STRUCT_D` (Row Inside, Single…), `EXTWALL_D, USECODE`;
- 23 Commercial (21 067): `AYB, EXTWALL_D, USECODE`, **podlaží nemá** (`WALL_HGT` je výška patra);
- 24 Condominium: po jednotkách, bez podlaží, pozemek pod domem má jiné SSL: **nepoužité**;
- 40 Owner Polygons: pozemek (`SSL`, `USECODE`). Jméno vlastníka a adresa se nežádají.
Budova se s daty spojuje přes pozemek pod bodem řezu (4 m za fasádou); půdorysy SSL nemají.

`towns/usa.js podlaznost`, `?cama=0` vypne: oba domy řezu najednou, 2 dotazy (pozemky podél úsečky, obytná tabulka), třetí
(komerční) jen když pozemek obytný záznam nemá. Dotaz trvá 0,14–0,2 s (v aplikaci měřeno). Nejdéle 3,5 s, po chybě minuta bez
dotazů; řez nečeká a dům zůstane z OSM. Rok, podlaží, druh (jen kde ho OSM nemá) a zdivo jdou do stávajícího mechanismu.
Druh podle pozemku kostelů a škol se nebere (bývá to i řadový dům).

## A/B (2 × 40 náhodných domů, `ab.mjs`, semínka 425001 a 990017, jiné než u vzhledů; posuzovali naslepo agenti Sonnet)
| | CAMA lépe | bez ní lépe | stejně | nelze | beze změny |
|---|---|---|---|---|---|
| 1. vzorek | 7 | 4 | 15 | 9 | 5 |
| 2. vzorek (po dvou úpravách) | **8** | **3** | 17 | 4 | 8 |

Správně 8 → 11 a 12 → 15, špatně 3 → 3 a 6 → 3. **Zapnuto.** Úpravy `northAmericaLook` po 1. vzorku: bytový dům od 1990 bez podlaží je
`podium` (ne nízký `moderni`), kancelář s cihlovým, kamenným nebo betonovým pláštěm není skleněná věž. Druhý vzorek je nový.

**Pokrytí** (80 domů): něco 67 (84 %), rok 65, zdivo 65, druh 61, podlaží 42 (53 %); OSM má podlaží u 17 (21 %).
**Podlaží proti fotce**: 32 porovnatelných, přesně 19 (59 %), do půl podlaží 28 (88 %); data mají o podlaží méně u C11, C24, Cx09, Cx37
(suterén nebo mansarda). Snímek z aplikace `cama-app.png`.

## Maryland a Virginie (jen zjištěno, nezapojeno)
- Maryland: `mdgeodata.md.gov/imap/…/PlanningCadastre/MD_PropertyData/MapServer/0` (body parcel, SDAT: `YEARBLT, STRUSTYL/DESCSTYL,
  STRUBLDG/DESCBLDG, STRUCNST/DESCCNST`; podlaží ve stylu), Montgomery i Prince George's. Licence neověřená.
- Fairfax County: `services1.arcgis.com/ioennV6PpG5Xodq0/…/Tax_Administration_Real_Estate_Dwelling_Data/FeatureServer` (otevřená data
  okresu). Licence neověřená. Arlington a Alexandria: hledání v katalogu nic nenašlo, neověřeno podrobněji.
