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
| po první změně | 241 | 139 | 99 | 3 |
| po Street View a kontrole Fablea (`vysledek-po.tsv`) | 190 | 139 | 51 | 0 |

Příčiny falešných paneláků před změnou: tvar desky u domů z 40. a 60. let (71), rok 1970–1995 i u zděných domů (47),
panelové novostavby po roce 2000 (16, vypadají jako moderní dům), úřady a školy s popiskem „panelový dům“ (kreslily se
už jako kanceláře).

## Změny (`profile.js` `buildingStyle`, `flatKind`; `gis.js` `ruianBuilding`)
- Panelák ne u domu dokončeného před 1955 a ne u zdí z cihel, kamene, monolitu či dřeva (RÚIAN): kreslí se plochý činžák.
- Panelový dům podle RÚIAN dokončený po 1995 je moderní bytový dům. Dřevěné stěnové panely (42) nejsou panelák.
- Bez centra města (zbytek ČR, Slovensko, ciziny) a bez roku rozhoduje jen tvar desky nebo 8+ podlaží, ne vzdálenost
  (dřív byl panelákem každý neznámý dům od 3 podlaží).
- Kancelář, úřad, škola: v kartě okraje „kancelářská budova“, ne „panelový dům“.

## Street View: 25 domů s kódem 10 kreslených jako panelák (Bára 16. 11. 2026)
Výběr a verdikty v `k-foceni.md`. Panelák jen 2 (Hradec Králové, 1970 a 1980). Zděných 19, z toho 13 se šikmou
střechou a komíny (typové domy 50.–60. let), 4 s plochou střechou, 2 spíš zděné; 3 nejdou poznat. U 2 starých domů
má RÚIAN rok 1990 (nejspíš rekonstrukce).

Změna: dům dokončený 1958–69 bez panelů v RÚIAN je nový vzhled **zděný bytový dům 50.–60. let** (`typovy`: šikmá
taškovou střecha, komíny, hladká omítka bez ozdob). Od 1970 zůstává kód 10 panelákem (oba paneláky ve vzorku).

## Kontrola Fablea (16. 11. 2026)
Opraveno: ručně zvolený nový vzhled se při načtení souboru ztrácel (`validate.js` `EDGE_STYLES`); zděný dům 60. let jen
do 5 podlaží (vyšší dům té doby zůstává panelákem); rok domu platí i u známé šikmé střechy (Plzeň: sorela, dům 60. let);
řadovka před venkovským domem, usedlost nejvýš 2 podlaží; IPR typ 6 v pražském centru je městský dům; měšťanský dům
i o 1–2 podlažích; rodinný dům 1946–59 je starší dům, ne „kostka“; podloubí nižší u nízkého přízemí, okno za ním
v hranici kresby. Nepřevzato: zděný dům 60. let „jen mimo desky“, protože všech 11 zděných domů z let 1958–69 ze
Street View mělo tvar desky.
