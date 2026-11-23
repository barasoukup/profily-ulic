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

## Štít činžáku a mezera pod římsou (Bára 23. 11. 2026)

Bára: volské oko patří doprostřed štítu pod sedlo, ale sedlo nebylo vidět (střecha jen stoupala z rámu); a římsa
sedí moc blízko horních oken.

- **Štít se sedlem** (`profile.js` `TENEMENT_RIDGE`, `tenementGable`): činžák bez mansardy (a haussmannovský dům o 1–2
  podlažích, který ho kreslí) má hřeben 3 m od uliční fasády, za ním krátký zadní svah k řezu: jako výchozí štít
  štítových domů ukazuje rám uliční dvě třetiny štítu. Sklon dál 40°. Štít je omítnutá zeď (o odstín světlejší než stěna,
  ne tmavá jako plocha střechy), u okapu žlab. Volské oko pod hřebenem (v ose sedla), v 55 % výšky štítu, průměr asi
  0,7 m se světlou omítkovou šambránou. Výška domu: střecha je o 1 m nižší (hřeben ve 3 m místo za řezem), popisek
  podlaží a výšky se nemění (bere se z dat / počtu podlaží, ne z kresby).
- **Pás pod římsou** (`FRIEZE`): nad stropem nejvyššího podlaží nadezdívka (v cm při typickém podlaží vzhledu, škáluje se
  s ním), přičtená k výšce zdi: činžák 145, měšťanský dům 130, sorela 180, zděný dům 50.–60. let 25, haussmannovský 75,
  severský činžák 115, dánský 80, amsterdamský 65, středomořské 20–45. Od hlavy horního okna k podhledu římsy u činžáku
  asi 1,5 m. Činžák a měšťanský dům mají v pásu architrávovou linku, vlys o odstín světlejší a konzoly pod římsou po 42 cm;
  sorela linku pod vlysem. Štítové domy (`stit`, `hanza` se štítem) nadezdívku nemají (štít stojí na zdi).
- Sloupce oken, řez rámem, počty a výšky podlaží beze změny.

Snímek `stit-rimsa-pred-po.png` (vlevo HEAD, vpravo po změně):
`SHEET=stit-rimsa node evaluation/budovy-cz-okna/render.mjs <kořen před> . evaluation/budovy-cz-okna/stit-rimsa-pred-po.png`.
Referenční fotky (Wikimedia Commons): pražské štíty a římsy (Kategorie Gables in Prague), štítové zdi činžáků
(Brandwand Quedlinburg 2024, Berlín-Schöneberg 1986, Budapešť).

### Kritik (nezávislý agent, jen obrázky a fotky)

1. kolo (po prvním návrhu: sedlo ve 3 m, oko pod ním, nadezdívka bez výzdoby): nic vážného na štítu; střední: pás pod
   římsou příliš prostý a nízký (zvednout o 0,3–0,4 m, vlys, architráv, konzoly), sorela okna skoro u římsy; drobné: štít
   tmavý jako střecha (má být omítka), oko malé, jen jeden komín. Mimo zadání (zapsáno, neřešeno): vikýře kreslené čelně
   v dánském domě, amsterdamská střecha jako krabice, zinková strana haussmannovské mansardy, severský a středomořský dům
   bez hřebene. → zvýšená nadezdívka, vlys s architrávem a konzolami, světlejší štít, větší oko se šambránou.
2. kolo: **nic vážného**; štít čitelný, oko správně pod hřebenem, mezera 1,5 m „odpovídá pražským činžákům“. Drobné:
   okap končí bez žlabu (→ doplněn), konzoly řídké a ploché (→ hustší, vyšší); nepřevzato: klenáky kolem oka, nároží
   štítu bez římsy, římsa haussmannovského a středomořského domu bez modilionů; střední mimo zadání: dánský štít s čelním
   vikýřem.

Testy: `node --test tests/house-looks.test.js tests/buildings.test.js` 30/30, `npm test` 384/384.
