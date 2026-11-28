# Státy, města a zdroje

Přehled souborů po státech: jeden soubor na stát (`<ISO>.md`), v něm nahoře stav a rozhodnutí, dole popis zdrojů a pravidel. Společné věci států jsou níže.

## Státy

- [Česko (CZ): Praha, Brno, Jihlava, Most, Opava, Plzeň a další města](CZ.md): nasazeno (Praha a Brno 9. 11. 2026, celá ČR 10. 11. 2026, `https://streetspace.eu/profily/`)
- [Slovensko (SK)](SK.md): větev `slovensko`, 15.–16. 11. 2026
- [Rakousko (AT)](AT.md): větev `austria`, 16. 11. 2026, nenasazené
- [Německo (DE)](DE.md): 17. 11. 2026, nenasazené
- [Švýcarsko a Lichtenštejnsko (CH, LI)](CH.md): větev `switzerland`, 17. 11. 2026, nenasazené
- [Nizozemsko (NL)](NL.md): větev `netherlands`, 20. 11. 2026, nenasazené
- [Belgie a Lucembursko (BE, LU)](BE.md): větev `belgium`, 20. 11. 2026, nenasazené
- [Polsko (PL)](PL.md): větev `poland`, 21. 11. 2026, nenasazené
- [Francie (FR)](FR.md): větev `france`, 22. 11. 2026, nenasazené
- [Španělsko (ES)](ES.md): větev `spain`, 23. 11. 2026, nenasazené
- [Portugalsko (PT)](PT.md): větev `portugal`, 23. 11. 2026, nenasazené
- [Monako (MC)](MC.md): větev `monaco`, 23. 11. 2026, nenasazené
- [Kypr (CY)](CY.md): větev `cyprus`, 23. 11. 2026, nenasazené
- [Malta (MT)](MT.md): větev `malta`, 23. 11. 2026, nenasazené
- [Itálie (IT)](IT.md): větev `italy`, 23. 11. 2026, nenasazené
- [Estonsko (EE)](EE.md): větev `estonia`, 23. 11. 2026, nenasazené
- [Slovinsko (SI)](SI.md): větev `estonia`, 23. 11. 2026, nenasazené
- [Finsko (FI)](FI.md): větev `estonia`, 23. 11. 2026, nenasazené
- [Dánsko (DK)](DK.md): větev `estonia`, 23. 11. 2026, nenasazené
- [Litva (LT)](LT.md): větev `estonia`, 24. 11. 2026, nenasazené
- [USA (US): Washington, New York, San Francisco, Boston](US.md): větve `usa`, `na-newyork`, `na-sanfrancisco`, `na-boston`, 24.–26. 11. 2026, nenasazené
- [Kanada (CA): Toronto](CA.md): větev `canada`, 25. 11. 2026, nenasazené

### Jedna stránka pro celou ČR (Bára 10. 11. 2026)

- Žádný přepínač měst: město se pozná podle místa řezu (`city.js` `cityAt`, hranice obcí z RÚIAN v
  `app/public/towns.json`, `node tools/build_towns.mjs`), mimo naše města platí „cesko“ (technická mapa ČÚZK,
  RÚIAN, OSM, pražský mobiliář a vozidla Streetmixu). Zdroje dat, ilustrace a texty se mění s městem řezu.
- Podkladové mapy: Mapa, Ortofoto, Technická mapa, OpenStreetMap; v každé jsou vrstvy měst omezené na jejich území.
- Staré adresy `/brno/`, `/jihlava/`… přesměrují na `/?mesto=…` i s řezem v odkazu. Data měst v `data/brno/`, `data/plzen/`.

### Státy, města a zdroje (přestavba, větev architecture-countries, 16. 11. 2026, nenasazené)

- Plán `docs/architecture-countries.md` (Fable schválil s úpravami). Struktura všude stejná: stát → město → zdroje.
- Stát = modul `app/public/countries/<ISO>.js` (CZ, SK, AT; `default.js` pro „cizinu“ a výchozí hodnoty), načítaný
  staticky: normy, zákon o stání, značky, ortofoto, ilustrace měst státu, vzhled domů, hledání. Vedle `city` je `country`
  (modul státu), `city.country` zůstává ISO.  Pro nasazení řádek v
  `tools/countries.mjs` (pages.yml z něj bere smyčky), CSP hlídá `tests/csp.test.js`.
- Město dědí od státu, co nemá svého (ortofoto pruhů, přepíše ho `laneOrtho`); jen svá data popisují vlastnosti města
  (`roadOnPath`, `slowServer`, `ruianYear` u Prahy a Brna). Zdroje mají
  vlastní území (`places.js inArea`, `AREAS`), `towns/index.js placeAt`. Kredit zdroje je klíč v `credits.js`
  (opraveno: uložený řez v Košicích, Grazu, Innsbrucku se neztratí, slovenské a rakouské kredity zůstanou).
- Výstup beze změny ověřen záchrannou sítí `evaluation/replay/` (369 nahraných řezů SK, AT, Praha, Brno, cizina;
  přehrání před a po, tabulky ve 4 jazycích). České řezy mimo Prahu a Brno nahrát po odstávce DMVS (od 19. 11.).
- Krok 4b (Bára 16. 11. 2026): města všude. Slovenská (Bratislava, Košice, Žilina, B. Bystrica, Prešov, Nitra, Trnava,
  Trenčín, Martin, Poprad, Piešťany, Hlohovec, Zvolen) a rakouská (Vídeň, Graz, Linz, Salcburk, Innsbruck) jsou města jako
  Brno, podle hranic obcí (`towns-sk.json` ze ZBGIS, `towns-at.json` z obcí LAU Eurostatu GISCO 2024 = Statistik Austria,
  `tools/build_towns_at.mjs`; soubor Statistik Austria na open data už není). Texty, zdroje a normy mají od zbytku státu,
  ilustrace svoje (bez vlastní sady státu). Log má vedle `city` i `country` (ISO); D1 potřebuje
  `ALTER TABLE events ADD COLUMN country TEXT` a nový Worker (nasadit musí Bára, `logging/README.md`). Opraveno zároveň:
  Worker zahazoval polohu řezů východně od 20° v. d. (Košice) a západně od 11° (Bregenz).

### Společné pro státy (Bára 23. 11. 2026)

- Sever Kypru a Itálie mimo otevřená ortofota (i se San Marinem a Vatikánem) profil nedostanou, aplikace to řekne
  (`city.js closedAt`, `states.json` `closed_*`).
- Pobřeží: Španělsko, Portugalsko, Monako a Francie platí do 400 m za hranicí GISCO (nábřeží, přístavy); Gibraltar a Andorra
  zůstávají cizinou.
- Jízda vlevo je zabudovaná přímo v pravidlech (`derive.js`), profil se nezrcadlí.
- Worker logu ukládá každou platnou polohu (25. 11. 2026); nasazený z main 27. 11. 2026 (i s kontaktním formulářem a cronem
  „17 * * * *“).

### Jedna stránka pro celou ČR

Přepínač měst není. Město se bere podle místa řezu (`city.js`: `cityAt` podle hranic obcí z RÚIAN v `towns.json`,
`node tools/build_towns.mjs`; `setCity`). Moduly čtou `city` až při použití, takže zdroje dat, ilustrace (načtou se
při prvním řezu ve městě), texty i uvedení zdrojů v exportu sedí na místo řezu. Mimo města s vlastními zdroji platí
„cesko“ (`towns/czechia.js`: celostátní technická mapa ČÚZK, domy z RÚIAN, dlaždice OSM, pražský mobiliář a vozidla
Streetmixu). Bývalé stránky `/<město>/` přesměrují na `/?mesto=<město>` i s řezem v odkazu
(`tools/city_site.mjs`, volá ho `tools/build_site.mjs`; místní server totéž).

### Státy, města a zdroje (přestavba 16. 11. 2026)

Struktura je všude stejná: stát → město → zdroje (`docs/architecture-countries.md`).
- **Stát** je modul `countries/<ISO>.js` (`CZ.js`, `SK.js`, `AT.js`; `default.js` pro místo mimo známé státy a výchozí
  hodnoty všech vlastností): normy (`limits`, `contraflow`, `tramBelt`), zákon o stání (`freeLane`, `halfKerbNote`,
  `parkGuess`), značky (`signs`), ortofoto (`bedOrtho`, `laneOrtho`), ilustrace měst státu (`art`, `artAt`), vzhled domů
  (`socialistLooks`), služby hledání (`search`), panorama, hlášky. `setCity` nastaví vedle `city` i `country` (modul státu);
  `city.country` zůstává kód ISO. Mimo `countries/` není žádná podmínka na stát.
- **České jen v Česku** (Bára 26. 11. 2026: „ČÚZK jen Česko“): `default.js` (cizina) nemá žádné české zdroje ani
  vlastnosti: ortofoto `laneOrtho: "none"`, bez panoramat Mapy.com, bez značek (jako USA a Kanada), poznámka o stání
  bez českého paragrafu; to vše má `CZ.js`. Neznámý zdroj ortofota nic nečte (dřív spadl na ČÚZK). Vrstvy ČÚZK
  (ortofoto, DMVS), ZBGIS a basemap.at v mapě (`app.js keptInside`) neptají dlaždice za hranicí státu (prstence
  `states.json`, ne jen obdélník) a kredit se ukáže, jen když výhled stát zasahuje; vrstvy měst mají prstence města.
  Hledání se RÚIAN ptá napřed jen nad Českem, jinde až když místní služby nic nenašly. Hlídá `tests/cz-only.test.js`.
- **Město** je záznam v `city.js` (a modul `towns/<město>.js`, má-li vlastní zdroje); co nemá svého (ortofoto, značky,
  normy), dědí od státu. Zbytek státu je město `cesko`, `slovensko`, `austria`, mimo státy `cizina` (`towns/abroad.js`).
  Slovenská a rakouská města a Washington (`city.js STATE_TOWNS`: Bratislava, Košice … Vídeň, Graz …) jsou města podle hranic
  (`towns-sk.json`, `towns-at.json`, `towns-us.json`, `tools/build_towns_sk.mjs`, `build_towns_at.mjs`, `build_towns_us.mjs`); texty, zdroje a normy mají od zbytku
  státu, ilustrace své, má-li je stát nakreslené (`countries/<ISO>.js art`), jinak státu.
- **Zdroj** s vlastním územím (pasport, čáry mapy města, mapa povrchů Vídně, značky Salcburku) má `area` (box, případně
  hranice obce, `places.js inArea`) a jeho modul ho uvádí v `AREAS`. `towns/index.js placeAt(lat, lon)` vrací stát,
  město, sadu ilustrací a zdroje s územím v bodě. Kredit zdroje je klíč v `state.cut.sources` a řádek v `credits.js`
  (`creditLines` i `validate.js` podle něj).

**Nový stát:** modul `countries/<ISO>.js` (a řádek v `countries/index.js`), složka značek, řádek v `tools/countries.mjs`
(OSM, Geofabrik, Pages), zbytek státu jako město v `city.js` (`abroad`) a texty `city.<id>.*` v `locales/<jazyk>.json`, zdroje
v `towns/<stát>.js`, hranice v `states.json`, hostitelé v CSP (hlídá `tests/csp.test.js`). Podrobně skill
`.claude/skills/add-state`. **Nové město nebo zdroj:** viz Města jako moduly níže.

Úpravu, která nemá měnit výsledky, ověří záchranná síť `evaluation/replay/` (odpovědi zdrojů nahrané jednou pro 369
řezů na Slovensku, v Rakousku, v Praze, v Brně a za hranicemi, přehrané před a po změně; tabulky města, kreditů,
značek a norem států ve čtyřech jazycích).

Společné pro státy (Bára 23. 11. 2026): sever Kypru a Itálie mimo otevřená ortofota (i se San Marinem a Vatikánem) profil
nedostanou, aplikace to řekne (`city.js closedAt`, `states.json` `closed_*`). Na pobřeží Španělska, Portugalska, Monaka
a Francie platí stát do 400 m za hranicí GISCO (nábřeží, přístavy; `COAST_TOLERANCE`), Gibraltar a Andorra zůstávají
cizinou. Jízda vlevo je zabudovaná přímo v pravidlech (`derive.js`), profil se nezrcadlí. Hranice poloh ve Workeru
logu pokrývají všechny státy (nový Worker musí nasadit Bára).

### Města jako moduly

Každé město je jeden modul `app/public/towns/<město>.js` (vzor `towns/jihlava.js`): zdroje dat pro
kliknutí (`osm`, `surfaces`, `lines`, `parking`, `podlaznost`) ve stejném tvaru jako odpovědi IPR, podkladové
mapy (`maps`) a ortofoto pro kontrolu řezů (`ortho`). Společné funkce jsou v `app/public/gis.js`, dlaždice OSM
čtou všechna města stejné. Texty aplikace a uvedení zdrojů jsou v `city.js`, servery pro CSP a staré adresy
v `tools/cities.mjs`. Město patří do státu a dědí od něj, co nemá svého (`countries/<ISO>.js`; vlastní ortofoto pruhů
přepíše `laneOrtho`); jen data města popisují jeho vlastnosti (`roadOnPath`, `slowServer`, `ruianYear` u Prahy a Brna). Nové město: záznam v
`city.js` a `tools/cities.mjs`, modul v `towns/` (a v `towns/index.js`), kredit jeho zdrojů pod klíčem v `credits.js`,
kód obce v `tools/build_towns.mjs` (pak `node tools/build_towns.mjs`), ilustrace v `app/public/<město>/`,
kontrola `CITY=<město> node evaluation/sample.mjs|run_brno.mjs|render_brno.mjs` a A/B test (níže).

Ilustrace měst (`app/public/<město>/`, podle fotek z Wikimedia Commons): tramvaje, trolejbusy a autobusy místních
dopravců, sloupy trakčního vedení a označníky; mobiliář je kromě Brna pražský. Vlastní vozidla mají Praha (T3,
SOR NB 12), Brno (Tatra T3 v nátěru DPMB, 45T a 13T, autobus DPMB), Jihlava (32Tr, Citelis), Most (EVO2, SOR NB 12),
Opava (32Tr, Urbanway), Pardubice (32Tr, Urbanway), Plzeň (40T, 26Tr, SOR NS 12), Ostrava (Tango NF2, 26Tr,
Urbino IV CNG) a Ústí. Olomouc, Liberec, Hradec Králové, České Budějovice a Zlín berou data jako zbytek Česka
a mají jen vlastní vozidla (`city.js` `artTown`). Jinde kreslí vozidla Streetmix.
