# Okna v podkroví a ustoupených podlažích českých domů (23. 11. 2026)

Bára 23. 11. 2026: okna ve štítech, mansardách a ustoupených podlažích mají ležet ve sloupcích oken pater pod nimi
(stejné místo i šířka), jako u nových evropských vzhledů (`evaluation/budovy-regiony/ZPRAVA.md`). Užší horní část
pojme méně oken, ale na stejné mřížce. Proporce, barvy, počty a výšky podlaží beze změny.

Sloupce pater (`profile.js drawPrahaBuilding`): přední osa `max(65, 35 + š/2)` cm od uliční fasády, zadní osa 247,5 cm
(mezi dveřmi a koncem zdi), šířka okna podle vzhledu (`WINDOWS`).

## Co se změnilo

| vzhled | dřív | teď |
|---|---|---|
| činžák, sorela, měšťanský dům, zděný dům 50.–60. let s mansardou / podkrovím | `row()` s vlastním krokem (u 2 pater mansardy o 50 cm vedle) | ve sloupcích pater tam, kde okno nevadí svahu mansardy (stejně jako regionální vzhledy, jen bez vikýřů) |
| činžák bez mansardy (i haussmannovský o 1–2 podlažích) | kulaté okno ve štítu v 200 cm | v zadní ose |
| městský dům (štít) | okno 75 cm pod hřebenem | v zadním sloupci a stejně široké (85 cm), výška dál podle střechy |
| vila, sorela, měšťanský dům: vikýř v valbě | okno 60 cm vedle sloupce | okno v zadním sloupci a stejně široké, vikýř o něco širší (okraj 25 cm jako dřív) |
| nový rodinný dům | čtvercové okno 90 cm ve štítu pod hřebenem | v zadní ose, 110 × 110 cm jako okna pater |
| panelák s ustoupeným podlažím | okno ze Streetmixu `row()` | panelové okno (tři tabule) v ose oken pod ním; ustoupené podlaží je užší, okno je jen tak široké, kolik se vejde (146 místo 190 cm) |
| kancelář s ustoupeným podlažím | okno ze Streetmixu | pásové okno s příčkami na mřížce pater pod ním |
| funkcionalistický a moderní dům: prosklené ustoupené podlaží | příčky po 55 cm | příčky na čarách oken pod ním (u funkcionalismu příčka křídla pražského okna, u moderního hrana okna) |
| městský dům s plochou střechou a ustoupeným podlažím | `row()` | ve sloupcích pater, kde se vejdou |
| škola (po 1955) s ustoupeným podlažím | **kresba spadla** (`WINDOWS.skola` neexistuje, „reading 'gap'“) | velké školní okno v jeho sloupci |

Beze změny (zkontrolováno): venkovský dům (štít bokem, okna jen v přízemí), rodinný dům 60.–80. let (valba bez
štítu), stará škola, kostel, garáž, hala, moderní a funkcionalistický dům bez ustoupeného podlaží, kancelář a panelák
bez něj, regionální vzhledy s mansardou (haussmannovský, severský činžák).

## Snímek

`pred-po.png`: vlevo HEAD, vpravo po změně, jen řádky, kde se kresba změnila (dva páry domů beze změny skript vynechá).
`node evaluation/budovy-cz-okna/render.mjs <kořen před> <kořen po> [výstup.png]`, kořen je složka s `pilot/public`
(např. `git archive HEAD | tar -x -C …`); kreslí kódem aplikace (Quick Look + ImageMagick).

## Ověření

- SVG všech 32 vzhledů × 9 podlažností × 4 druhy údajů × 5 měst (Praha, Francie, Španělsko, Nizozemsko, Estonsko),
  se štíty i bez, proti HEAD: liší se jen vzhledy z tabulky výše (a haussmannovský dům o 1–2 podlažích, který kreslí
  činžákový štít); HEAD padal v 50 případech (škola s ustoupeným podlažím), teď v žádném.
- `npm test` (čistá kopie HEAD + `profile.js`): 377/377, žádný test se neměnil (testy SVG domů nefotí).
- `node evaluation/ortofoto-osm/regrese.mjs` před a po: shodné (kresba domů do odhadu nezasahuje).
