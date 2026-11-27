# Podkladové vrstvy podle států

Vygenerováno `node evaluation/replay/layers.mjs` z běhu `layers.js` (jazyk cs): pro bod každého státu se otevře každá podkladová vrstva z menu mapy
(mapa 300 × 300 px, přiblížení 18) a spočítají se dlaždice. Buňka: `načteno/požadováno` (bez prázdných `data:` dlaždic, které vrstva omezená na svou oblast vrací mimo ni);
tučně = chyba nebo prázdná dlaždice; „mimo oblast“ = vrstva tu nic nekreslí (není pro tenhle stát). Poslední sloupce: kredit ortofota a mapy, jak ho mapa ukazuje, a porušení CSP.

| Stát (bod) | Mapa | Ortofoto | Mapa povrchů | OpenStreetMap | + Linie mapy povrchů | Kredit Ortofoto | Kredit Mapa | CSP |
|---|---|---|---|---|---|---|---|---|
| CZ (vysoke-myto) | 6/6 | 6/6 | 8/8 | 6/6 | 8/8 | ortofoto © ČÚZK | © přispěvatelé OpenStreetMap | ok |
| DE (aachen) | 4/4 | mimo oblast | 4/4 | 4/4 | 4/4 | ortofoto © Beeldmateriaal.nl (PDOK, CC BY 4.0), ortofoto © spolkové země Německa (GeoBasis-DE) | © přispěvatelé OpenStreetMap | ok |

Prázdná dlaždice = celá jednobarevná (bílá nebo průhledná); `null` v měření (cizí původ bez CORS) se nepočítá.
