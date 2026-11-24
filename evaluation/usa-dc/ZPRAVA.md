# Pilot Severní Amerika, fáze 1: Washington DC offline (24. 11. 2026)

Bára schválila 24. 11. 2026 levný offline test: **dají se z otevřených dat DC poskládat profily, které sedí se
skutečností zhruba tak dobře jako v evropských státech** (univerzální měření, shoda složení asi 55–65 %)? Kritérium:
aspoň asi 60 %, nebo srovnatelně s Evropou. Kód aplikace (`pilot/public/*`) se neměnil, vše je v `evaluation/usa-dc/`.

## Verdikt

**Pokračovat do fáze 2, s výhradou.** Profily z mapy povrchů DC a inventáře DDOT mají **shodu složení 60 %**
(30 řezů). To je kritérium a průměr Evropy (CZ 58, AT 61, DE 56, NL 58, FR 60, PL 63 %, `../universal/vysledky/staty.md`).
Šířka uličního prostoru do 2 m sedí v 33 % (CZ 33, DE 34 %). Pruhy sedí v 43 %, s počtem pruhů z inventáře ve variantě 60 %.

**Výhrada:** samotné OSM bez mapy a bez ortofota má na stejných řezech složení 65 %. Je to tím, že posuzovatelé
v DC soustavně vynechávali úzké travnaté pásy mezi chodníkem a obrubou, které mapa má a ortofoto ukazuje. Bez
těchto pásů vychází DC 67 % a OSM 68 %, tedy stejně. OSM v DC je navíc výjimečně podrobné (chodníky zakreslené zvlášť).
Mapa jednoznačně přidává **stání**: posuzovatel a mapa se shodnou, zda v ulici je stání, v 22 z 30 řezů, samotné
OSM jen ve 13 z 30. Přidává i skutečné šířky. Obecný postup aplikace (OSM a ortofoto) tedy funguje i v USA. Data DC
ho zpřesní hlavně u stání a pruhů.

## Čísla

`node evaluation/usa-dc/score.mjs` (výstup ve `vysledky/skore.md`), pravidla univerzálního měření z 24. 11.:
strana bez fasády se počítá jen po okraj ulice, a jen řezy s vozovkou. Ve vzorku nejsou žádné `highway=service`,
takže vynechání vjezdů, parkovacích uliček a drive-through nic nevyřadí. Posuzovatelé označili dc-3-1 (zahrady,
hliněná plocha) a dc-6-2 (cihlové náměstíčko u křižovatky) jako „není ulice“.

| profil | řezů | složení stejné | shoda složení | pruhy stejně | šířka uličního prostoru do 1 / 2 m | nejčastější rozdíly (aplikace proti posuzovateli) |
|---|---|---|---|---|---|---|
| **DC: mapa povrchů + inventář DDOT** | 30 | 10 % | **60 %** | 43 % | 20 % / 33 % | navíc zelen 19×, navíc stani 11×, navíc chodnik 9×, chybí pruh 5×, chybí chodnik 4×, chybí stani 4× |
| DC – residential | 15 | 13 % | 65 % | 40 % | 33 % / 47 % | navíc zelen 8×, navíc stani 5×, chybí chodnik 4×, chybí stani 4× |
| DC – collector (tertiary) | 7 | 14 % | 55 % | 57 % | 0 % / 14 % | navíc zelen 6×, navíc stani 5×, navíc chodnik 4× |
| DC – arterial (primary, secondary) | 8 | 0 % | 56 % | 38 % | 13 % / 25 % | navíc zelen 5×, navíc chodnik 3×, chybí pruh 3×, chybí delici 2× |
| DC + pruhy z inventáře (varianta) | 30 | 10 % | 60 % | **60 %** | 20 % / 33 % | jako DC |
| jen OSM (bez mapy, bez ortofota) | 30 | 27 % | 65 % | 67 % | 13 % / 33 % | chybí stani 22×, chybí zelen 7×, chybí pruh 4×, chybí delici 4× |

Bez pásů zeleně u vozovky (stejně u obou profilů; zeleň mezi pruhy zůstává dělicím pásem): **DC 67 %, OSM 68 %**.

Výskyt prvků v uličním prostoru (`presence.mjs`, `vysledky/pritomnost.md`): v kolika řezech z 30 se shodne, zda prvek je, nebo není.

| prvek | posuzovatel ho má | DC se shodne | jen OSM se shodne |
|---|---|---|---|
| stání | 17 | **22** | 13 |
| zeleň u vozovky | 6 | 13 | 23 |
| dělicí pás | 9 | 27 | 25 |
| chodník | 26 | 26 | 29 |
| cyklopruh | 3 | 28 | 28 |

### Rozbor rozdílů
- **„navíc zelen“ (19×) je hlavně chyba posuzovatele.** Ortofoto travnatý pás mezi chodníkem a obrubou ukazuje
  (dc-5-1, dc-8-4, dc-3-4: prohlédla jsem sama) a u dc-5-1 ho posuzovatel dokonce popsal v poznámce („pás trávy se
  stromy mezi obrubou a chodníkem“), do profilu ho ale nedal. Kalibrace posuzovatele proběhla v Praze, kde takové pásy
  skoro nejsou. Část pásů jsou ale jen jamky stromů v cihlovém chodníku (dc-2-4, 0,9 m), a ty by měly zůstat chodníkem
  (viz fáze 2).
- **„navíc stani“ (11×):** DDOT vede pruh stání tam, kde stát smí. Posuzovatel ho zapíše, jen když tam auta vidí
  (fotky Mapillary jsou z let 2020–2026, ortofoto z březnového rána 2025). Část rozdílů jsou ranní zákazy stání
  na sběrných ulicích (rush hour). Stejný jev je u odhadu stání podle zákona v Evropě.
- **„navíc chodnik“ (9×):** druhý chodník za travnatou plochou nebo dvorem (dc-2-3, dc-5-2, dc-8-2) a chodníky ve
  středovém pásu bulváru (dc-6-1). Stejný jev jako v CZ a NL („aplikace dělí chodník“).
- **Pruhy:** DDOT uvádí u úzkých obousměrných místních ulic 2 pruhy o celkové šířce 16 ft (2 × 2,44 m). Pravidlo
  aplikace „2 × 2,5 m až od 5,0 m“ (`derive.js splitTwoWayLane`) z nich udělá jeden pruh. Varianta, která drží počet
  pruhů z inventáře, zvedne shodu pruhů ze 43 na 60 % a složení nezmění. **Pozor:** variantu jsem navrhla až po
  prvním skóre, je tedy laděná na tomto vzorku.
- **Široké tepny:** reach aplikace 22 m nestačí u Military Road (dc-4-3, 50 m, 10 pruhů s paralelními vozovkami)
  a u Columbia Road (dc-1-4). Ve fázi 2 je potřeba `wideRoads` / `wideStreets` jako u SK, AT a FR.
- **Uličky (alleys):** dc-1-1 padl přesně na ústí uličky, takže řez vede po ní. OSM ji nemá, a `awayFromJunctions`
  ji proto nevidí. Ve fázi 2 by se ústí uliček z planimetrie (Alley) mělo počítat jako křižovatka.

## Tři příklady (ortofoto v `data/`, git je ignoruje)

1. **dc-4-1 Ingraham Street NW** (`data/dc-4-1-ortho.jpg`, shoda 100 %): typická obytná ulice DC. Planimetrie dá
   chodník 1,65, travnatý pás 1,85, vozovku, chodník 1,95. DDOT k tomu přidá 2 pruhy stání po 8 ft. Výsledek
   chodník | zeleň | stání 2,4 | pruh 4,35 | stání 2,45 | zeleň | chodník a posuzovatel má totéž (šířka 16,2 proti 16,5 m).
   Samotné OSM by tu mělo jen chodník | pruh | pruh | chodník (43 %).
2. **dc-5-1 Newton Street NE** (`data/dc-5-1-ortho.jpg`, 71 %): profil DC je správně, posuzovatel vynechal oba
   travnaté pásy, i když je na fotce popsal. Měření tu trestá mapu za chybu posuzovatele.
3. **dc-1-1 Newton Street NW** (`data/dc-1-1-ortho.jpg`, 60 %): řez padl na ústí uličky, takže 36 m „zpevněné
   plochy“ a žádný chodník. Chyba umístění řezu, ne dat (viz uličky výše).

## Jak se profil skládá (mapování, `build.mjs`)

Používá se sdílený kód aplikace bez nových pravidel: `derive.js` (`nearestStreet`, `awayFromJunctions`,
`centerOnStreet`, `mtvuPolygons`, `deriveProfile`) a kroky, které po něm dělá `app.js cutAt` (`lanesFromShoulders`,
`splitTwoWayLane`, `capWideLanes`, `pedestrianZone`, `carveCycleways`, `carveTramTracks`). Mapa povrchů se předá
jako u Flander (`towns/belgium.js grbSurfaces`): druhy ploch se čtou podél řezu po 0,1 m a předají jako pásy
s kódy MTVU (2 m podél ulice). Bez ortofota pruhů a bez modelu AI, protože ty jsou v prohlížeči.

- **DC Planimetrics 2023** (OCTO, CC BY 4.0, `Planimetrics_2023/MapServer`, vrstvy 10, 11, 1; dotaz na rámeček řezu):
  - Building, Parking Garage → 601 budova (fasáda);
  - Sidewalk, Hidden Sidewalk, Stairs → 702 chodník; Crosswalk → 701 (leží na vozovce);
  - Road, Intersection, Hidden Road / Intersection → 701 vozovka;
  - Paved / Unpaved Median Island, Paved / Unpaved Traffic Island, Hidden Median → 9950 dělicí pás;
  - Alley, Paved Drive, **Parking Lot → 1003** jiná zpevněná plocha. Parkoviště bylo nejdřív 704, které `derive.js`
    čte jako stání u obruby, takže dc-5-4 měl 6 m „stání“ za chodníkem. Opraveno po prvním běhu.
  - mezera mezi polygony (pás u obruby, předzahrádka, trávník) → 401 zeleň;
  - přednost při překryvu: budova, chodník, dělicí pás, vozovka, ostatní.
- **DDOT Roadway SubBlock** (`Transportation_WebMercator/MapServer/162`): blok řezu je nejbližší rovnoběžná linie
  (|cos| ≥ 0,85) do 12 m od středu, našel se u všech 32 řezů. Z bloku se berou:
  - `TOTALTRAVELLANES` jako OSM `lanes`;
  - `TOTALPARKINGLANES` jako pásy 704 u vnějších obrub vozovky. Šířka je `TOTALPARKINGLANEWIDTH` / počet, ze stop
    na metry, v mezích 1,8–3,0 m. Při jednom pruhu stání se strana bere z `RPPSIDE` (O = vpravo od směru linie,
    I = vlevo; význam je odhad), jinak z OSM `parking:<strana>`, jinak vpravo.
  - cyklopruh z inventáře (`BIKELANE_CONVENTIONAL` / `BUFFERED` / `PROTECTED`, BD obě strany, IB/OB jedna) jako
    `cycleway:<strana>=lane`, jen kde OSM žádný cycleway nemá;
  - zákonný odhad stání (`default.js`: 3 m volna na směr, což je blízko US požárnímu pravidlu 20 ft) je tam, kde se
    blok našel, vypnutý.
- **Dosah:** výchozí v aplikaci, 22 m od osy na každou stranu, a konec u fasády.
- **Základ „jen OSM“:** `ortho-osm.js orthoOsmPolys` bez snímku ortofota. To je náhradní cesta aplikace, když
  ortofoto chybí. Kde nevrátí nic, nastupuje `estimateFromOsm`. Na všech 32 řezech vrátil `orthoOsmPolys` profil.
- **OSM:** vlastní dlaždice z výřezu Geofabrik `district-of-columbia` (21 MB pbf, `tools/build_osm_data.sh`, 876
  dlaždic, 46 MB; zabaleno `pack_osm_tiles.mjs` na 7,4 MB). Žádný Overpass.
- **Ohleduplnost:** dotazy na DC GIS jdou jeden po druhém s pauzou 1,5 s a jsou v cache (`data/cache`), celkem
  asi 130 dotazů. Fotky z Mapillary (token z `../streetview/token.local`, nikde se nevypisuje).

## Vzorek a posuzovatelé

- `sample.mjs`: osm 8 obvodů (wards 2022, DC GIS), v každém postupně residential, collector (tertiary), arterial
  (trunk, primary, secondary) a residential, pevné semínko. Jen ulice pro auta, žádné `service` (vjezdy, parkovací
  uličky, alleys), tunely, mosty ani spojky. Bod se umístí jako kliknutí v aplikaci (`lib.mjs placeCut`) a nechá se,
  jen když má Mapillary fotku do 30 m. Fotky mají všechny řezy, obě strany.
- `prepare.mjs`: ortofoto DC 2025 (8 cm, `Ortho2025_WebMercator`, CC BY 4.0) stejně jako `universal/ortho.mjs`
  (sdílený soubor se neměnil), řez napříč, 10 px = 1 m. U residential a collector 60 m, u arterial 80 m.
- Posuzovali **dva samostatní agenti Sonnet** (16 + 16 řezů) podle `../universal/POKYN.md`. Profil aplikace neviděli:
  hodnotili dřív, než vznikl. Výstupy jsou ve `vysledky/u-us-1.jsonl` a `u-us-2.jsonl`. Hlásili několik fotek
  z jiného místa (dc-1-1 b, dc-1-4 b, dc-2-1, dc-2-4, dc-7-1 b) a několik řezů přes křižovatku. Posuzovali rychle,
  asi 10 s na řez.

## Fáze 2: co by stála

**Funguje beze změny:** `derive.js` (celé skládání profilu, stání podle zákona s 3 m na směr, pruhy, dělicí pásy),
`ortho-osm.js` (odhad z OSM a ortofota, `besidePassport`), `osmtile.js`, `osmpack.js` a `pack_osm_tiles.mjs`,
`build_osm_data.sh` s výřezem Geofabriku, `gis.js` (ArcGIS REST `query`, `envelope`, `asMtvu`), `compare.mjs`
a univerzální měření, i18n (angličtina existuje), export.

**Modul státu US a města DC (odhad rozsahu):**

| část | co | rozsah |
|---|---|---|
| `towns/usa.js` (DC) | Planimetrics 10, 11, 1 + SubBlock 162 jako u Flander (pásy podél řezu), mapování z `build.mjs`, `SURFACE_MAPS`, kredity | asi 200 řádků; jádro je hotové v `build.mjs` |
| `countries/US.js` | normy (NACTO a DDOT Design and Engineering Manual: pruh 10 ft, stání 7–8 ft, cyklopruh 5–6 ft; jen orientačně), `freeLane` 3 m (IFC 20 ft), `wideRoads` / `wideStreets` pro tepny, ortofoto | asi 110 řádků, jako ostatní státy |
| stání | inventář DDOT (hotovo v pilotu), mimo DC zákonný odhad, který už je | 0 až malé |
| pruhy | počet z inventáře proti `splitTwoWayLane` (2 × 2,44 m), nastavení státu (`TWO_WAY_SPLIT` přes stát) | malé, ale zasahuje do jádra, potřebuje A/B a regresi |
| uličky | ústí Alley z planimetrie jako křižovatka v `awayFromJunctions` | malé, jádro, A/B |
| jamky stromů | mezera u obruby užší než asi 1,2 m v cihlovém chodníku jako chodník se stromy, ne zeleň (ověřit na ortofotu, dataset DDOT Urban Forestry) | malé, A/B |
| ortofoto | `lanes-ortho.js` DC 2025 (Web Mercator `export`, CORS) pro pruhy a odhad, `ortho.mjs` pro měření | asi 20 řádků |
| hledání | US Census Geocoder (bez CORS, JSONP nebo náš Worker) nebo Photon (už je, `search-photon.js`); DC MAR 2 chce klíč | 40–80 řádků |
| hranice | `staty.json` US (Census TIGER, public domain) a DC jako město (`mesta-us.json`) | skript jako `build_towns_at.mjs`, asi 60 řádků |
| OSM balík | DC 7,4 MB. Metro DC (DC, Montgomery, Prince George's, Arlington, Alexandria, Fairfax) asi 5× víc, **odhad 30–50 MB** na R2. Výřez osmiem z Geofabriku `maryland` (218 MB) a `virginia` (430 MB) | řádek v `tools/countries.mjs`, job ve workflow |
| CSP | `maps2.dcgis.dc.gov`, `imagery.dcgis.dc.gov`, geokodér; `tests/csp.test.js` | několik řádků |
| texty | kredity „DC GIS / OCTO (CC BY 4.0)“, „DDOT“, jméno města a státu, poznámky; vše přes `t()` × 24 jazyků | asi 15 textů |
| jednotky | stopy v zobrazení (volitelně), data ve stopách se převádějí už v modulu | později |

**Co se dá vynechat:** řádek značek (MUTCD, `signs-US/`; značky stání s časy se stejně nevejdou), vzhled domů
(zatím obecné typy, řadový dům až později) a vozidla (neutrální tramvaj a autobus z `generic/`, auta Streetmixu).

**Odhad práce fáze 2:** modul DC a státu s měřením zhruba jako Belgie nebo Finsko (1–2 dny agentů). Tři zásahy
do jádra (pruhy, uličky, jamky stromů) potřebují vlastní A/B a regresi.

## Soubory

- `lib.mjs` (OSM z dlaždic, umístění řezu, slušný fetch s cache), `sample.mjs`, `prepare.mjs`, `build.mjs`,
  `score.mjs`, `presence.mjs`; `sample.json` (32 řezů).
- `vysledky/u-us-1.jsonl`, `u-us-2.jsonl` (posuzovatelé), `skore.md`, `pritomnost.md`.
- `data/` (git ignoruje): ortofota a fotky řezů, `app-dc.json`, `app-dc-lanes.json`, `app-osm.json`, dlaždice OSM,
  balík, cache dotazů.
