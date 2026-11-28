# USA (US): Washington, New York, San Francisco, Boston

Stav nasazení: větve `usa`, `na-newyork`, `na-sanfrancisco`, `na-boston`, 24.–26. 11. 2026, nenasazené. Přehled všech států: [docs/countries/README.md](README.md). Pravidla od Báry platí všude, jsou v `CLAUDE.md`.

## Stav a rozhodnutí (dříve CLAUDE.md)

### USA (Washington) (větev usa, Bára 24. 11. 2026, nenasazené)

- Fáze 2 pilotu Severní Ameriky („Fáze 2 s mapou Washingtonu“): stát `usa` (US), `countries/US.js`, `towns/usa.js`,
  `evaluation/usa/` (REPORT, NORMS, ab/), pilot `evaluation/usa-dc/`. Jen metro Washingtonu (`states.json` `usa`: DC a
  sousední okresy Marylandu a Virginie z TIGERweb, sloučené v jeden obrys a až pak zjednodušené), zbytek USA `closed_us`
  s hláškou. OSM balík `us_dc` (DC + Maryland + Virginie oříznuté na metro, 86 MB, jen R2; viz seznam v `docs/deployment.md`, `osm-tiles.yml` umí výřezy spojené „+“ s obdélníkem za „@“).
- DC: mapa povrchů Planimetrics 2023 (CC BY 4.0, čtená podél řezu jako GRB, `hasStreet` jako Vilnius; `?dc=0`), inventář
  DDOT Roadway SubBlock (počet pruhů jako OSM `lanes` přes `wayTags`, stání u obrub, cyklopruhy, odhad stání tam vypnutý;
  `?ddot=0`), uličky planimetrie jako plochy `service=alley`, ortofoto DC 2025 jen nad Districtem (a 60 m za ním). Mimo DC jen odhad z OSM.
  **Po nepřátelské recenzi 25. 11. 2026** (926de8d): DC je District podle hranice (`towns-us.json`, 60 m za ní), strany z inventáře
  podle cesty řezu, chráněná cyklostezka tam, kde ji má OSM (Pennsylvania Avenue uprostřed), řez v ploše „Intersection“ to řekne,
  `RPPSIDE` není strana stání, výpadek inventáře se ohlásí.
  **Čerstvé měření** (`evaluation/usa/fresh/REPORT.md`, 60 náhodných řezů podle délky sítě, zmrazený kód, dva slepí posuzovatelé,
  neutrální pokyn): mapa : odhad **41 : 10** (nerozhodně 8), univerzální měření 76 % s mapou, 61 % bez ní, 53 % jen OSM (29 řezů,
  čtvrtina uličky): mapa **zůstává zapnutá**. Slabiny: uličky mezi domy (zeleň místo dvora), dálnice a rampy (3 řezy, 44 : 63 %).
  Starší čísla neplatí jako důkaz: A/B 23 : 9 mělo nápovědu v pokynu, 66 % stálo na řezech pilotu, na kterých se ladilo.
  Tepny (`evaluation/usa/arterials/REPORT.md`, `?off=dcarterials`): na 25 nových naslepo mapa : bez mapy 19 : 6; nový : starý kód jen
  3 změny na nových řezech (2 : 0 : 1), neprůkazné.
- **Druhá nepřátelská recenze (25. 11. 2026):** inventář DDOT má vlastní A/B (`?ddot=0`): 21 : 11 ze 45 změněných řezů z 90 (p 0,11; místní 15 : 5, tepny
  3 : 4), počet pruhů 20 proti 19 z 33, strany stání 49 proti 45 ze 73: **neprůkazné, zůstává zapnutý** (rozhodne Bára). Kliknutí ve Washingtonu a
  Torontu (46 a 46, z toho 13 uliček): po opravě uličky (`74fcb46`) žádná ulička přes 15 m. Jiná ulice šikmo v profilu se jen ohlásí (křižovatka);
  ukončení profilu před ní je remíza 13 : 10 (Evropa 9 : 10); `?off=otherstreet` vypne hlášku; sdílené).
- **Severní Amerika se načítá až na místě** (`late.js`, `america.js`, `states-america.json`; `usa`, `canada` a `closed_*` už nejsou ve `states.json`): start v Evropě
  o 11 kB gzip víc než `estonia` (dřív o 161). 
- Normy DDOT DEM 2023 (aplikace cituje bez čísel tabulek, neověřená), Bicycle Facility Design Guide 2020 a NACTO jen oranžově; stání 3 m na směr (IFC 503.2.1,
  18 DCMR § 2405); bez řádku značek; bez paneláků; hledání Photon.
- Ilustrace (větev north-america-art, sloučená 25. 11. 2026, `evaluation/north-america-art/`): severoamerické domy (`houses-america.js`,
  `house-looks-america.js northAmericaLook`), mobiliář `northamerica/`, autobus Metrobus v celém metru, Washington má svůj označník a glóbus do
  5 m (`lamp-post-top`), bez tramvaje; domy v DC z CAMA (`?cama=0`). Toronto zapojené (stát `canada`), New York, San Francisco a Boston zapojené (26. 11.).
- Tři společné změny z pilotu (všechny státy, podoba z `estonia` 83734e7): ústí uličky je křižovatka (`?off=ulicky`, zapnuto), obousměrka se dělí od
  4,0 m, kde je počet pruhů známý a u vozovky je stání (`?off=pocetpruhu`, zapnuto). Regrese Prahy a Brna beze změny, v Evropě z 120 náhodných řezů změněno 0.
- viz seznam v `docs/deployment.md`

### New York (větev na-newyork z canada, 26. 11. 2026, nenasazené)

- Druhé metro státu `usa`: pět obvodů New Yorku (`tools/build_boundaries.mjs` tabulka `METROS` `dc`, `nyc` z TIGERweb; Boston a San
  Francisco se přidají řádkem), město `newyork` v `towns-us.json` (`tools/build_boundaries.mjs`). New Jersey, Westchester a Nassau ne.
- Mapa povrchů NYC Planimetric Database 2022 (NYC OTI, NYCmaps na ArcGIS Online; „Limited to use defined by OTI“ bez zveřejněných podmínek, Bára 26. 11. 2026:
  používat, tatáž data jsou otevřená na NYC Open Data) přes `planimetrics.js` (`towns/newyork.js`,
  `?nyc=0`), domy z obrysů budov téže služby (`?nychouse=0`), ortofoto NYS 2024, normy Street Design Manual jen oranžově
  (`evaluation/usa/nyc/NORMS.md`; `rules.js` předává limitům město řezu), ilustrace `newyork/`. OSM balík `us_nyc` (jen R2).
- Čerstvé měření (`evaluation/usa/nyc/REPORT.md`, 75 řezů, 50 podle délky sítě bez podmínky fotky): slepé A/B mapa : odhad
  **31 : 23** (p 0,34), univerzálně 73 % s mapou, 70 % bez, 63 % jen OSM: **neprůkazné, zůstává zapnuté** (rozhodne Bára).
  Slabina: stání (mapa ho nerozliší, ortofoto ve stínu). Washington beze změny (10 z 10 řezů).
- Stání (26. 11., `evaluation/usa/nyc/park/REPORT.md`): stání z OSM sdílený kód do vozovky mapy dává, OSM ho v New Yorku nemá;
  stání ze značek NYC DOT je smazaný pokus (`docs/decisions.md`).
- viz seznam v `docs/deployment.md`

### San Francisco (větev na-sanfrancisco, 26. 11. 2026, nenasazené)

- Další metro státu `usa`: City and County of San Francisco (TIGERweb 06075; `tools/build_boundaries.mjs` tabulka `METROS` `dc`, `nyc`,
  `sf`, další metra jako řádky), hranice města v `towns-us.json` (`tools/build_boundaries.mjs`); okolní okresy `closed_us`.
  OSM balík `us_sf` (Geofabrik norcal oříznutý na město, 7,6 MB, jen R2; viz seznam v `docs/deployment.md`).
- Mapa povrchů `towns/sanfrancisco.js` (`?sf=0`) složená podél řezu (`planimetrics.js` s vlastním `runs`): uliční prostor
  DataSF (2014) = chodník, mezi krajními obrubami SFMTA vozovka, budovy DataSF jen mimo uliční prostor (posun 1,4 m);
  stání z digitální obruby SFMTA (`?sfcurb=0`), podlaží z výšek obrysů (`?sfhouse=0`). PDDL. Bez ortofota (otevřené není).
- Čerstvé měření (`evaluation/usa/sf/REPORT.md`, 60 řezů, zmrazený kód e9911c1, dva slepí posuzovatelé, snímky Esri jen k měření):
  mapa : odhad **34 : 6**, univerzálně 71 % s mapou, 55 % bez; obruba 21 : 7. Obojí zapnuté. Šířka s mapou o 2,5 m širší než
  u posuzovatelů (rozhodne Bára).
- Normy: chodník podle SFMTA Sidewalk Widths, jinak jen NACTO, oranžově (`evaluation/usa/sf/NORMS.md`). Ilustrace Muni (autobus,
  trolejbus, LRV4, označník); PCC a Path of Gold nezapojené.
- Opravy 26. 11. (`evaluation/usa/sf/fixes/REPORT.md`): orientace stání z OSM, kde obruba dá podélné (A/B 30 nových řezů 12 : 11,
  smazáno 28. 11. 2026, `docs/decisions.md`); osa ve vykrojeném stání a vozovka, kterou přechází jen chodník (Lippard Avenue, `derive.js ownRoad`,
  1 z 290 řezů, dalších 3 566 ve 24 státech beze změny: zapnuto, Bára 27. 11. 2026, `?axisroad=0` vypne).

### Boston (větev na-boston, 26. 11. 2026, nenasazené)

- Další metro státu `usa`: okresy Suffolk, Middlesex, Norfolk (`tools/build_boundaries.mjs METROS`, další metro = řádek), OSM balík
  `us_bos`; města `boston`, `bostonmetro` (celé metro: MBTA autobus a tramvaj, ortofoto MassGIS 2025, normy Boston Complete
  Streets Guidelines 2013 jen oranžově) a `cambridge` (jen území mapy) v `towns-us.json`; v Bostonu lampa acorn.
- Mapy povrchů Bostonu (Street Edges, Sidewalk Inventory, budovy s podlažími) a Cambridge (PDDL), `towns/boston.js`: vozovky jsou
  polygony přes celé město, proto statické dlaždice `data/us-plan` stavěné jednou týdně při nasazení
  (`tools/build_planimetrics_us.mjs`, `pages.yml`), při kliknutí žádný dotaz; `?boston=0`, `?cambridge=0`, `?bostonhouse=0`.
- Čerstvé měření 60 řezů (`evaluation/usa/boston/REPORT.md`): A/B mapa : odhad 27 : 21 (p 0,47; místní 13 : 4, tepny 8 : 15),
  univerzální 69 % s mapou, 68 % bez, 72 % jen OSM. Mapa zapnutá, **rozhodne Bára** (tepny: mezera mezi polygony je zeleň i na
  parkovišti a náměstí). Washington 100 řezů beze změny, regrese beze změny.
- Přegenerovat: `node tools/build_boundaries.mjs states usa && node tools/build_boundaries.mjs towns us && node tools/build_coverage.mjs`.
  viz seznam v `docs/deployment.md`
- Mezery za vnějším chodníkem (26. 11., `evaluation/usa/boston/outer/REPORT.md`, `planimetrics.js outerGaps`, `ortho-osm.js
  outerGapsByImage`): domy a parkoviště z OSM, zbytek ortofotem (MassGIS je bez listí, zeleň podle žlutosti a sytosti). A/B 52
  nových tepen 18 : 16, smazáno 28. 11. 2026, `docs/decisions.md`). Jen domy a parkoviště z OSM bez ortofota (`evaluation/usa/boston/outer-osm`): A/B 102 nových tepen 24 : 22, smazáno 28. 11. 2026, `docs/decisions.md`.

### Severní Amerika: rozhodnutí 26.–27. 11. 2026 (Bára)

- USA a Kanada kvůli prestiži, ne kvůli rozsahu: jen území, které kryjí dobré a dostupné zdroje. Washington jen District
  of Columbia, Toronto jen město; New York (5 obvodů), San Francisco a Boston s metrem (MassGIS ortofoto 15 cm zdarma)
  zůstávají. Okolní okresy a obce jsou zavřené s hláškou (`tools/build_boundaries.mjs` METROS, GTA; hranice nafouknuté o 60 m,
  `grow`, aby ulice po hranici nebyla napůl zavřená); okolí DC jen při ověřené licenci Maryland Six Inch.
- Stání v NYC, Bostonu a SF je jen „odhad“, ne „podle zákona“. Pět pravidel (DDOT, mapgaps, roadtracks, kerbbays,
  torontohouse) zůstává; opravy z rozboru proher jen obecné: mezery mezi vozovkami a stezka přes osu (`?off=gapsortho`,
  `gapswide`, `trackaxis`; A/B 54 : 13, `evaluation/canada/losses/FIXES.md`). Opravy jen pro jedno město (DDOT 2–5,
  podlaží Toronta) zahozené, schované ve větvi `dropped-city-fixes`; přepočet výšky na podlaží jako sdílená funkce
  (`floors.js`, `?off=floorsh`; Toronto 18 : 4, zapnuto i v SF a NYC bez vlastního měření, Bára 27. 11. 2026; OSM výška
  v Evropě 11 : 8, smazáno 28. 11. 2026 (`docs/decisions.md`); `evaluation/archive/floors-height/REPORT.md`). Inventář DDOT věří jen tam, kde se vejde do změřené šířky (`?off=ddotfit`, větev ddot-fit).
- Značky NYC DOT (smazáno 28. 11. 2026, `docs/decisions.md`) bez dalších úprav (Bára 27. 11. 2026: „nevymýšlet výjimky, nechat NY jak je“).
- Upozornění na řez křižovatkou zůstává; takové řezy se nepočítají do měření
  (`evaluation/universal/junction.mjs`). Oprava osy (Lippard Avenue) zapnutá všude, `?axisroad=0` (3 566 řezů ve
  24 státech beze změny). Chodník SF zůstává 10 ft.
- Mosty (všechny státy, 27. 11. 2026): odhad končí na hraně mostovky (`?off=mostdeska`), zábradlí (`?off=zabradli`);
  šířka krajního chodníku průkazně lépe (`evaluation/archive/bridge-water/edge/REPORT.md`).
- Kraków jen s `?krakow=1`; pasporty Chotěboře, Šlapanic a Kuřimi vyřazené i z kreditů (zbývá Rožnov). ČÚZK jen nad
  Českem. 

## Popis zdrojů a pravidel (dříve app/README.md)

### USA: Washington (Bára 24. 11. 2026, fáze 2 pilotu Severní Ameriky)

Stát `usa` (US), `countries/US.js`, `towns/usa.js`; v `states.json` jen metro Washingtonu (`usa`: District of Columbia,
Montgomery a Prince George's v Marylandu, Arlington, Fairfax County, Fairfax city, Falls Church a Alexandria ve Virginii,
hranice okresů z TIGERweb Census Bureau), zbytek USA je `closed_us` s hláškou (jako Itálie mimo pokrytí). OSM balík
`us_dc` (výřez Geofabriku District of Columbia a Marylandu a Virginie oříznutých na obdélník metra, sloučené osmiem;
`osm-tiles.yml` umí výřezy spojené „+“ s obdélníkem za „@“), jen R2. V DC:
- **mapa povrchů** DC Planimetrics 2023 (`maps2.dcgis.dc.gov` `Planimetrics_2023/MapServer` 10 vozovky, 11 chodníky,
  1 budovy; CC BY 4.0) čtená podél řezu po 0,1 m jako GRB Flander (mapování z pilotu `evaluation/usa-dc/build.mjs`: mezera
  mezi plochami je zeleň, parkoviště, uličky a vjezdy jiná zpevněná plocha), jen kde má ulici pod středem řezu
  (`hasStreet` jako Vilnius a Helsinky); řez ve středu plochy „Intersection“ to řekne; `?dc=0` vypne;
- **inventář DDOT** Roadway SubBlock (`Transportation_WebMercator/MapServer/162`): počet pruhů jako OSM `lanes` cesty
  (`app.js` `wayTags`), pruhy stání u vnějších obrub vozovky (704) a cyklopruhy, kde je OSM nemá; strany
  podle cesty řezu, chráněná cyklostezka tam, kde ji má OSM (i uprostřed ulice), blok podle druhu a jen vyplněný; kde blok je, odhad stání
  podle pravidel je vypnutý (`noParkGuess`); `?ddot=0` vypne;
- **uličky** z planimetrie jako plochy `service=alley` v prvcích OSM (ústí uličky = křižovatka, `derive.js`);
- **domy** z odhadních tabulek CAMA (rok, podlaží, druh, zdivo podle pozemku pod domem; `evaluation/north-america-art/cama/REPORT.md`),
  2–3 dotazy na řez, nejdéle 3,5 s; `?cama=0` vypne;
- **ortofoto** DC 2025 (`Ortho2025_WebMercator`, export v Web Mercatoru, jen nad Districtem podle hranice `towns-us.json` a 60 m za ní: `lanes-ortho.js us-dc`)
  pro pruhy, model obrub a podklad mapy. Mimo DC v metru jen odhad z OSM.
Normy DDOT (DEM 2023, Bicycle Facility Design Guide 2020) a NACTO jen oranžově (`evaluation/usa/NORMS.md`), stání 3 m na
směr (IFC 503.2.1, 18 DCMR § 2405), bez řádku značek, bez paneláků, severoamerické domy, mobiliář a autobus Metrobus
(`northamerica/`, `washington/`; `evaluation/north-america-art/`). Hledání Photon v obdélníku metra. A/B a měření v `evaluation/usa/`.

### USA: New York (Bára 26. 11. 2026)

Druhé metro státu `usa`: pět obvodů New Yorku (`states-america.json` `usa` je od teď víc metr: `tools/build_boundaries.mjs` tabulka
`METROS`, `dc` a `nyc`, okresy z TIGERweb; město `newyork` v `towns-us.json` z `tools/build_boundaries.mjs`). Okolní okresy New
Jersey, Westchester a Nassau nejsou (nemají mapu povrchů), zůstávají v `closed_us`. OSM balík `us_nyc` (výřez Geofabriku
New York oříznutý na obdélník města, 44 MB, jen R2). V New Yorku (`towns/newyork.js`, zapojený přes `towns/usa.js`):
- **mapa povrchů** NYC Planimetric Database 2022 (NYC OTI, organizace NYCmaps na ArcGIS Online, vrstvy Roadbed, Sidewalk,
  Plaza, Median, Parking Lot a Building; CORS) společným adaptérem `towns/planimetrics.js`: malovaný ostrůvek je vozovka,
  příjezd (driveway) a parkoviště jiná plocha, pás parkoviště u obruby stání (`?off=kerbbays`), ostrůvek bez vozovky na obou
  stranách zeleň, cyklostezky OSM ve vozovce mapy (`?off=roadtracks`); `?nyc=0` vypne;
- **domy** z obrysů budov téže služby (výška střechy → podlaží jako v Torontu, rok, garáž; žádný dotaz navíc, `?nychouse=0`);
- **ortofoto** státu New York 2024 (NYS ITS, `orthos.its.ny.gov`, export ve Web Mercatoru; jen nad městem a 30 m za ním).
Normy NYC Street Design Manual jen oranžově (`evaluation/usa/nyc/NORMS.md`; `countries/US.js limitsNYC`, `rules.js` předává
město řezu), stání 3 m na směr jako ve Washingtonu. Ilustrace `newyork/`: autobus MTA, lampa (davit) od 6 m a označník,
přístřešek a ostatní mobiliář severoamerický; Bishop's Crook zatím bez místa. Měření `evaluation/usa/nyc/REPORT.md`.

### USA: San Francisco (Bára 26. 11. 2026)

Další metro státu `usa`: City and County of San Francisco (TIGERweb, `tools/build_boundaries.mjs` tabulka `METROS` `dc`, `nyc`, `sf`;
hranice města v `towns-us.json`, `tools/build_boundaries.mjs`), okolní okresy zůstávají `closed_us`. OSM balík `us_sf` (výřez
Geofabriku `north-america/us/california/norcal` oříznutý na obdélník města, jen R2). Město nemá polygony vozovek čitelné
z prohlížeče, proto **`towns/sanfrancisco.js`** skládá mapu povrchů podél řezu (`planimetrics.js` s vlastním `runs`):
uliční prostor (DataSF Right of Way Polygons, 2014) = chodník, mezi dvěma krajními obrubami SFMTA (blockface curbs, vrstva 12)
vozovka, dvojice obrub uvnitř = ostrůvek; budovy (DataSF Building Footprints) mimo uliční prostor (leží asi 1,4 m východně,
mezera do 2 m k domu patří domu). Stání po stranách z digitální obruby SFMTA (Curb Zones, vrstva 56; `?sfcurb=0`), podlaží
z výšky obrysu (`?sfhouse=0`). `?sf=0` vypne vše. Bez ortofota (otevřené pro SF není, NAIP je 0,6–1 m). Chodníky varují
podle SFMTA Sidewalk Widths, jinak jen NACTO (`evaluation/usa/sf/NORMS.md`). Ilustrace Muni (`sanfrancisco/`: autobus,
trolejbus, LRV4, označník). Měření `evaluation/usa/sf/REPORT.md`. Zkoušená orientace stání z OSM je smazaný pokus (`evaluation/usa/sf/fixes/REPORT.md`, `docs/decisions.md`). Zapnuté všude (Bára 27. 11. 2026 po kontrole 3 566 řezů ve
24 státech beze změny, `evaluation/axisroad-check/REPORT.md`): vozovka, na kterou oprava osy přesunula osu, je ulice,
i když ji přechází jen chodník (Lippard Avenue); `?axisroad=0` vypne.

### USA: Boston (Bára 26. 11. 2026)

Další metro státu `usa`: okresy Suffolk, Middlesex a Norfolk (TIGERweb; `tools/build_boundaries.mjs` má metra v tabulce `METROS`,
další metro = další řádek), OSM balík `us_bos` (Geofabrik Massachusetts oříznutý obdélníkem metra, jen R2). Města v
`towns-us.json`: `boston` (ilustrace: autobus a tramvaj MBTA, označník, lampa acorn do 5 m), `bostonmetro` (celé metro:
autobus a tramvaj MBTA, ortofoto MassGIS, texty a normy Bostonu) a `cambridge` (jen území mapy povrchů).
- **mapy povrchů** Bostonu (Street Edges, Sidewalk Inventory, budovy s počtem podlaží) a Cambridge (Roads, Sidewalks,
  Driveways, Parking Lots, Buildings), obě PDDL, společným adaptérem `towns/planimetrics.js` (`towns/boston.js`). Vozovky
  jsou v obou službách polygony přes celé město (5 MB na dotaz), proto se **jednou týdně při nasazení** stáhnou a rozřežou do
  dlaždic `data/us-plan/<město>/` (`tools/build_planimetrics_us.mjs`, 0,005°, každý polygon oříznutý na dlaždici; Boston
  711 dlaždic 35 MB, Cambridge 120 a 9 MB); při kliknutí žádný dotaz na město. Lokálně: `node tools/build_planimetrics_us.mjs`
  (zapíše `app/data/us-plan`). Řez na hranici měst bere mapu města, ve kterém leží (Memorial Drive je Cambridge).
  `?boston=0`, `?cambridge=0` vypnou, `?bostonhouse=0` vypne podlaží domů.
- **ortofoto** MassGIS 2025 (15 cm, dlaždice z20, „No restrictions“) nad celým metrem: pruhy, obruby, podklad mapy (`lanes-ortho.js us-ma`).
- normy Boston Complete Streets Guidelines 2013 jen oranžově (`evaluation/usa/boston/NORMS.md`), stání 3 m na směr jako DC.
- smazané pokusy (mezery za vnějším chodníkem, stání ze značek NYC DOT): `docs/decisions.md`.
Měření `evaluation/usa/boston/REPORT.md`.
