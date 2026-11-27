# Podkladové vrstvy podle států

Vygenerováno `node evaluation/replay/layers.mjs` z běhu `layers.js` (jazyk cs): pro bod každého státu se otevře každá podkladová vrstva z menu mapy
(mapa 300 × 300 px, přiblížení 18) a spočítají se dlaždice. Buňka: `načteno/požadováno` (bez prázdných `data:` dlaždic, které vrstva omezená na svou oblast vrací mimo ni);
tučně = chyba nebo prázdná dlaždice; „mimo oblast“ = vrstva tu nic nekreslí (není pro tenhle stát). Poslední sloupce: kredit ortofota a mapy, jak ho mapa ukazuje, a porušení CSP.

| Stát (bod) | Mapa | Ortofoto | Mapa povrchů | OpenStreetMap | + Linie mapy povrchů | Kredit Ortofoto | Kredit Mapa | CSP |
|---|---|---|---|---|---|---|---|---|
| CZ (vysoke-myto) | 6/6 | 6/6 | 8/8 | 6/6 | 2/2 | ortofoto © ČÚZK | © přispěvatelé OpenStreetMap | ok |
| CZ-Praha (praha) | 8/8 | 4/4 | 8/8 | 4/4 | **4/8, 4 chyb** | ortofoto © ČÚZK | © přispěvatelé OpenStreetMap, mapa © IPR Praha | ok |
| CZ-Brno (brno) | 5/5 | 8/8 | 5/5 | 4/4 | 1/1 | ortofoto © ČÚZK, ortofoto 2025 © Statutární město Brno | © přispěvatelé OpenStreetMap, mapa © Statutární město Brno | ok |
| SK (bratislava) | 4/4 | 4/4 | 4/4 | 4/4 | žádné dlaždice | ortofoto © GKÚ Bratislava, NLC (ZBGIS) | © přispěvatelé OpenStreetMap | ok |
| AT (wien) | 4/4 | 4/4 | 4/4 | 4/4 | žádné dlaždice | ortofoto © basemap.at | © přispěvatelé OpenStreetMap | ok |
| DE (aachen) | 4/4 | 4/4 | 4/4 | 4/4 | žádné dlaždice | ortofoto © Beeldmateriaal.nl (PDOK, CC BY 4.0), ortofoto © spolkové země Německa (GeoBasis-DE) | © přispěvatelé OpenStreetMap | ok |
| CH (basel) | 4/4 | 4/4 | 4/4 | 4/4 | žádné dlaždice | ortofoto SWISSIMAGE © swisstopo | © přispěvatelé OpenStreetMap | ok |
| LI (balzers) | 6/6 | 6/6 | 6/6 | 6/6 | žádné dlaždice | ortofoto SWISSIMAGE © swisstopo | © přispěvatelé OpenStreetMap | ok |
| NL (amstelveen) | 4/4 | 4/4 | 4/4 | 4/4 | žádné dlaždice | ortofoto © Beeldmateriaal.nl (PDOK, CC BY 4.0) | © přispěvatelé OpenStreetMap | ok |
| BE (antwerpen) | 9/9 | 9/9 | 9/9 | 9/9 | žádné dlaždice | ortofoto © Beeldmateriaal.nl (PDOK, CC BY 4.0), ortofoto: Bron: Luchtopnamen Digitaal Vlaanderen (Modellicentie gratis hergebruik v1.0) | © přispěvatelé OpenStreetMap | ok |
| LU (diekirch) | 4/4 | 4/4 | 4/4 | 4/4 | žádné dlaždice | ortofoto © ACT Luxembourg (geoportail.lu, CC0) | © přispěvatelé OpenStreetMap | ok |
| PL (bydgoszcz) | 4/4 | **0/4, 4 chyb** | 4/4 | 4/4 | žádné dlaždice | ortofoto © GUGiK (Geoportal.gov.pl) | © přispěvatelé OpenStreetMap | ok |
| FR (bordeaux) | 6/6 | 6/6 | 6/6 | 6/6 | žádné dlaždice | ortofoto © IGN (Géoplateforme) | © přispěvatelé OpenStreetMap | ok |
| MC (monaco) | 4/4 | 8/8 | 4/4 | 4/4 | žádné dlaždice | ortofoto © IGN (Géoplateforme) | © přispěvatelé OpenStreetMap | ok |
| ES (barcelona) | 4/4 | 4/4 | 4/4 | 4/4 | žádné dlaždice | ortofoto PNOA © IGN (CC BY 4.0) | © přispěvatelé OpenStreetMap | ok |
| PT (aveiro) | 6/6 | 6/6 | 6/6 | 6/6 | žádné dlaždice | ortofoto © DGT | © přispěvatelé OpenStreetMap | ok |
| CY (ayianapa) | 4/4 | 4/4 | 4/4 | 4/4 | žádné dlaždice | ortofoto © DLS Kypr | © přispěvatelé OpenStreetMap | ok |
| MT (birkirkara) | 6/6 | 6/6 | 6/6 | 6/6 | žádné dlaždice | ortofoto © Planning Authority Malta (CC BY 4.0) | © přispěvatelé OpenStreetMap | ok |
| IT (bologna) | 6/6 | 6/6 | 6/6 | 6/6 | žádné dlaždice | ortofoto © Comune di Bologna, Regione Emilia-Romagna (CC BY 4.0) | © přispěvatelé OpenStreetMap | ok |
| EE (tallinn) | 4/4 | 4/4 | 4/4 | 4/4 | žádné dlaždice | ortofoto © Maa- ja Ruumiamet, nálet 2024 (stav dlaždic 11/2026) | © přispěvatelé OpenStreetMap | ok |
| SI (celje) | 4/4 | 4/4 | 4/4 | 4/4 | žádné dlaždice | ortofoto DOF025 © Geodetska uprava RS (CC BY 4.0) | © přispěvatelé OpenStreetMap | ok |
| FI (espoo) | 4/4 | 8/8 | 4/4 | 4/4 | žádné dlaždice | ortofoto © Espoon kaupunki (CC BY 4.0), ortofoto © Helsingin kaupunki, kaupunkimittauspalvelut (CC BY 4.0) | © přispěvatelé OpenStreetMap | ok |
| DK (aalborg) | 4/4 | žádné dlaždice | 4/4 | 4/4 | žádné dlaždice | – | © přispěvatelé OpenStreetMap | ok |
| LT (antakalnis) | 9/9 | žádné dlaždice | 9/9 | 9/9 | žádné dlaždice | – | © přispěvatelé OpenStreetMap | ok |
| US (boston) | 4/4 | 4/4 | 4/4 | 4/4 | žádné dlaždice | ortofoto © MassGIS (Bureau of Geographic Information), 2025 | © přispěvatelé OpenStreetMap | ok |
| CA (toronto) | 6/6 | 4/4 | 6/6 | 6/6 | žádné dlaždice | ortofoto © City of Toronto, 2025 (Open Government Licence – Toronto) | © přispěvatelé OpenStreetMap | ok |

Nálezy (chyba nebo prázdná dlaždice; „žádné dlaždice“ u Linií mimo ČR je správně, vrstva je jen v Česku):
- CZ-Praha (praha), +Linie mapy povrchů: 4 chyb z 8 (tile.openstreetmap.org, dmvs.cuzk.gov.cz, gs-pub.praha.eu)
- PL (bydgoszcz), Ortofoto: 4 chyb z 4 (mapy.geoportal.gov.pl)
- DK (aalborg), Ortofoto: žádné dlaždice (vrstva pro tenhle stát není, nebo chybí klíč)
- LT (antakalnis), Ortofoto: žádné dlaždice (vrstva pro tenhle stát není, nebo chybí klíč)

Prázdná dlaždice = celá jednobarevná (bílá nebo průhledná); `null` v měření (cizí původ bez CORS) se nepočítá.
