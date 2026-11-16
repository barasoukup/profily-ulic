# Paneláky tam, kde panelák není (16. 11. 2026)

Bára: „paneláků máme moc, kreslí se i tam, kde to panelák není.“ Výška o kresbě rozhodovat nemá.

## Jak se měřilo
- `run.mjs`: 60 náhodných domů (ne rodinné domy, chaty, garáže, haly) z dlaždic OSM v okolí centra 11 měst
  (Praha, Plzeň, Ostrava, Pardubice, Hradec Králové, Olomouc, České Budějovice, Liberec, Zlín, Tábor, Vysoké Mýto)
  a tři celá sídliště jako kontrola (Jižní Město, Lesná, Poruba). Každý dům dostane stejné údaje jako v aplikaci po
  kliknutí (OSM a tvar bloku, podlažnost IPR v Praze, jinde RÚIAN, v Praze stáří zástavby).
- Pravda: RÚIAN, druh svislé nosné konstrukce. Panely = kód 4, 41, 43; jistě ne panel = cihly, kámen, monolit, dřevo.
- Kód **10 („kámen, cihly, tvárnice vč. kombinací“) nic neříká**: na Lesné, kde stojí jen paneláky, ho má 16 ze 48
  domů z roku 1970. Na Jižním Městě 3 ze 48, v Porubě (sorela, cihly) skoro všechny.
- Odpovědi služeb v `cache.json` (git je ignoruje), výsledky `vysledek.tsv` (před změnou), `vysledek-po.tsv` (po ní).

## Co vyšlo (města, bez kanceláří)
| | kreslen panelák | z toho panel v RÚIAN | ne panel (kód 10) | ne panel jistě |
|---|---|---|---|---|
| před změnou | 275 | 153 | 116 | 6 |
| po změně | 241 | 139 | 99 | 3 |

Příčiny falešných paneláků před změnou: tvar desky u domů z 40. a 60. let (71), rok 1970–1995 i u zděných domů (47),
panelové novostavby po roce 2000 (16, vypadají jako moderní dům), úřady a školy s popiskem „panelový dům“ (kreslily se
už jako kanceláře).

## Změny (`profile.js` `buildingStyle`, `flatKind`; `gis.js` `ruianBuilding`)
- Panelák ne u domu dokončeného před 1955 a ne u zdí z cihel, kamene, monolitu či dřeva (RÚIAN): kreslí se plochý činžák.
- Panelový dům podle RÚIAN dokončený po 1995 je moderní bytový dům. Dřevěné stěnové panely (42) nejsou panelák.
- Bez centra města (zbytek ČR, Slovensko, ciziny) a bez roku rozhoduje jen tvar desky nebo 8+ podlaží, ne vzdálenost
  (dřív byl panelákem každý neznámý dům od 3 podlaží).
- Kancelář, úřad, škola: v kartě okraje „kancelářská budova“, ne „panelový dům“.

## Co zůstává
99 domů s kódem 10 se dál kreslí jako panelák (hlavně 60. léta, 53). Data je od paneláku neodliší. K posouzení
z ulice je výběr 25 domů v `k-foceni.md`.
