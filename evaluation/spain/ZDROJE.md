# Data pro Španělsko: ověřené otevřené služby (pro profil ulic)

Ověřeno 23. 11. 2026, asi 70 požadavků, User-Agent `profily-ulic`, pauza 1 s, Origin `https://streetspace.eu`. Overpass ani
Nominatim nebyly použity, žádné osobní údaje se neposílaly.

Značení: **ověřeno** = odpověď přišla a byla přečtena; **neověřeno** = jen z dokumentace, katalogu nebo vyhledávání, bez
dotazu. CORS „`*`“ = `Access-Control-Allow-Origin: *`; „echo“ = server vrací náš Origin (`https://streetspace.eu`), z
prohlížeče to funguje stejně.

Zkušební body: Madrid Puerta del Sol (-3,7038, 40,4168), Calle de Alcalá (-3,6982, 40,4190), Barcelona (2,1649, 41,3925),
A Coruña (-8,405, 43,370), Zaragoza Paseo de la Independencia (-0,883, 41,649), mimo Španělsko (1,0, 46,0, Francie).

---

## 1. Ortofoto

| Zdroj | Ověřený stav | Rozlišení a datum | Licence | Poznámka |
|---|---|---|---|---|
| **IGN PNOA máxima actualidad, WMS** `https://www.ign.es/wms-inspire/pnoa-ma`, vrstva `OI.OrthoimageCoverage` | **ověřeno**: GetMap 1.3.0 v `EPSG:3857` (100 × 100 m na 512 px) vrátil 200, `image/jpeg`, CORS `*`, Madrid i Barcelona | `OI.MosaicElement` GetFeatureInfo (`text/plain`) dává datum a rozlišení snímku v bodě: Madrid Sol `2023-07`, **0,25 m**; Barcelona `2024-07`, **0,25 m**. Popis služby: mozaika 25 a 50 cm, „ve městských jádrech pravé ortofoto“ (true ortho, neověřeno) | **CC BY 4.0 scne.es** (AccessConstraints v capabilities, ověřeno); kredit podle dokumentace „PNOA cedido por © Instituto Geográfico Nacional“ (neověřeno). **Pozor: Melilla je Pléiades Neo © Airbus DS (2022)**, jiná licence | Mimo Španělsko (bod ve Francii) vrátí 200 a malý obrázek 1,8 KB: pozadí MODIS / Sentinel-2, **ne bílé**. Aplikace musí ortofoto omezit na území státu (jako IGN ve Francii). Ostrost jako francouzské IGN 20 cm, spíš měkčí. |
| **IGN PNOA, WMTS** `https://www.ign.es/wmts/pnoa-ma` | **ověřeno**: GetTile KVP, `LAYER=OI.OrthoimageCoverage&STYLE=default&TILEMATRIXSET=GoogleMapsCompatible&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}`, z19 i z20 vrátily 200, `image/jpeg`, CORS `*`, `cache-control: max-age=31536000` | GoogleMapsCompatible do **z20**, ale z20 je jen převzorkovaná 25cm mozaika (viditelně rozmazaná). Rozumně z19 (asi 30 cm na pixel dlaždice 256 px) | jako WMS | Šablona: `https://www.ign.es/wmts/pnoa-ma?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=OI.OrthoimageCoverage&STYLE=default&FORMAT=image/jpeg&TILEMATRIXSET=GoogleMapsCompatible&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}`. Pro `lanes-ortho.js` jednodušší WMS (jako `FR_ORTHO`), `res: 0.25`. |
| **ICGC Katalánsko** `https://geoserveis.icgc.cat/servei/catalunya/orto-territorial/wms`, vrstva `ortofoto_color_vigent` | **ověřeno**: GetMap 1.3.0 `EPSG:3857` 200, `image/jpeg`, CORS `*`; obraz ostřejší a barevně vyváženější než PNOA na stejném místě | Abstract: „color 25 cm any 2025“ (aktuální rok 2025). Starší ročníky jako vrstvy `ortofoto_color_2024` …; `ortofoto_10cm_color_2020` a `…_2011/2010` jsou jediné 10cm (jen historie) | Capabilities: Fees odkaz `http://www.icgc.cat/condicions`, AccessConstraints „copyright“; podle stránek ICGC CC BY 4.0 (neověřeno) | Pro Katalánsko lepší než PNOA (novější, 2025). Území ohraničit hranicí Katalánska (vlastní `laender.json`-like soubor autonomních společenství). |
| Madrid, Barcelona: vlastní městské ortofoto | **neověřeno** | - | - | Geoportál Madridu a Barcelony má ortofoto v prohlížečích; otevřenou službu s CORS jsem nehledala do hloubky. |

---

## 2. Mapy povrchů měst (nejcennější)

### 2a. Shrnutí po městech

| Město | Služba | Ověřený stav | Geometrie a třídy | Licence | Použitelnost |
|---|---|---|---|---|---|
| **A Coruña** `https://ide.coruna.gal/server/rest/services/Intranet/INFRA_BTUC_VIARIO/MapServer` | ArcGIS REST, capabilities `Map,Query,Data`, SR 25829 | **ověřeno**: `/{layer}/query?geometry=-8.4060,43.3695,-8.4045,43.3705&geometryType=esriGeometryEnvelope&inSR=4326&outSR=4326&outFields=*&f=json` vrací polygony (`rings`), 200, CORS echo. V bboxu ~120 × 110 m: ACERAS 21, CALZADA VIALES 6, CARRILBICI 1, CALZADA APARCAMIENTO 0 | **Polygony podle vrstev**: 1 ACERAS (`TIPO_1028`=`ACE`), 2 ESCALERAS Y RAMPAS, 3 TRÁNSITO PEATONAL, 4 VÍA URBANA PEATONAL, 5 CARRILBICI, 7 CALZADA VIALES (`TIPO_0042`, `REVES_0042`=`PAV`, `SENTIDO`, `ZONA_0042`=`ROT`), 8 CALZADA APARCAMIENTO, 9 CALZADA CARRETERAS. Měřítko 1 : 500, `ORIGEN` „Actualización 2014“ | copyright „Ayuntamiento de A Coruña … SIT“ (ověřeno); otevřená licence **neověřena**, služba leží ve složce **„Intranet“** (veřejně dostupná, ale před použitím se zeptat města) | **Úplná mapa povrchů, nejlepší nález.** Mapování: 9 a 7 → 701, 1 → 702, 3/4 → 702 (pěší), 5 → 703, 8 → 704. Data z roku 2014. |
| **Zaragoza** IDEZar GeoServer `https://idezar-sig.zaragoza.es/servicios/geoserver/wfs` | WFS 2.0.0, GeoJSON | **ověřeno**: `TYPENAMES=idezar_base:Aceras_PavimentoTF_2017&OUTPUTFORMAT=application/json&SRSNAME=EPSG:4326&BBOX=41.6485,-0.8840,41.6495,-0.8820,urn:ogc:def:crs:EPSG::4326` 200, CORS `*`: 21 MultiPolygonů `TIPO_PAVIM`=`Ac`; `Medianas_PavimentoTF_201702` 7 MultiPolygonů `TIPO_PAVIM`=`Med` | Chodníky (`Ac`) a střední dělicí pásy (`Med`) jako plochy, rok 2017; **vozovka jako plocha chybí** (= zbytek mezi chodníky). Další: `PBandVerde_PavimentoTF_20170` (zelené pásy), `AcerasZonasVerdes_PavimentosTF_2017` (v bboxu 0), `carril_bizi_20250127` (cyklotrasy, v bboxu 0, geometrie neověřena), `movilidad:MU2_carriles_bici`, `JERARQUIA_VIARIA`, `arboles_2022` | Capabilities: Fees NONE, AccessConstraints NONE (ověřeno); katalog města podle vyhledávání CC BY 4.0 (neověřeno) | **Dobře použitelné**: chodník + medián z dat, vozovka mezi nimi (jako obrubový postup). Formát WFS jako Lyon / BD TOPO. |
| **Madrid** `https://sigma.madrid.es/vector/rest/services/MAPAS_BASE/CARTOBASE_2016/MapServer` a `CARTOBASE_WGS84_COLOR_2023` | ArcGIS REST, **jen `Map`** (žádné Query ani Identify) | **ověřeno**: `/query` i `/identify` vrací 400 „Requested operation is not supported“; `/export` (PNG, `bboxSR=imageSR=3857`) vrací 200, CORS echo. Služba 2023 je `singleFusedMapCache` (do z23), takže `layers=show:` se ignoruje a export kreslí celou mapu; u CARTOBASE_2016 (SR 25830) se výběr vrstev uplatní jen částečně | Vrstvy CM1000 (jen jako obraz): ACERA, ACERA NIVEL, ISLETA, CARRIL BICI (polygony), BORDILLO, APARCAMIENTO (linie). Barvy v exportu 2023: chodník šedý, ostrůvek světle šedý, zeleň světle zelená, vozovka bílá. Vozovka jako vrstva není | Copyright „Ayto. Madrid“ (ověřeno); datos.madrid.es má obecné podmínky s uvedením zdroje (neověřeno) | **Jen obrázkem** (jako `dmvs.js`: obraz + barva v bodě), rozlišení chodník / ostrůvek po barvě je křehké. Vektor 1 : 1000 je ke stažení po listech (DGN/DWG, datos.gob.es „Cartografía actualizada 1:1000“, neověřeno) → možné předzpracovat při nasazení. |
| **Barcelona** (Ajuntament) | WMS `https://w133.bcn.cat/WMSVIALITAT/service.svc/get`, MTM `https://geo.bcn.cat/mapproxy/service`, CKAN `opendata-ajuntament.barcelona.cat` | **ověřeno**: WMSVIALITAT capabilities 200, CORS `*`, jediná vrstva `Linies_comunicacions` (linie, GetFeatureInfo nabízené, nezkoušeno). CKAN API 200, CORS `*` | Online jen **linie** (kresba obrub). Dataset `mapa-base-topografic` (CC BY 4.0, ověřeno v katalogu) má **GPKG 652 MB** celého města (obsah vrstev neověřen, nestahováno) | CC BY 4.0 (katalog, ověřeno) | Online plochy **ne**. Případně GPKG předzpracovat při nasazení na dlaždice (zjistit, jestli má polygony chodníků). |
| **Katalánsko ICGC, CT 1 : 1000** `https://geoserveis.icgc.cat/icc_ct1m/wms/service` | WMS, CORS `*` | **ověřeno**: capabilities a GetMap 200; vrstvy `V22_PL`, `V22BCN_PL`, `…_LN`, `…_PN`, `…_TX`. GetMap ukazuje jen **červenou kresbu** obrub a budov; GetFeatureInfo na plochách i liniích vrátil **prázdnou odpověď** | Kresba (linie), ne třídy ploch | podle ICGC (neověřeno) | Nepoužitelné jako mapa povrchů; pokrývá jen některá města. |
| **Valencia** geoportal `https://geoportal.valencia.es/server/rest/services/OPENDATA/…` | ArcGIS REST + WFS | **neověřeno**: server z našeho připojení **2× nedostupný** (timeout 40–60 s, i přes IPv4). Katalog `opendata.vlci.valencia.es` (CKAN, CORS `*`) **ověřen** | Podle katalogu: `UrbanismoEInfraestructuras/MapServer/307` **obruby (bordillos)** s typem okolí (chodník, stání, krajnice, cyklostezka, přechod…); `/115` komunikace 1 : 500; `Trafico/MapServer/238` **vodorovné značení** (čáry pruhů, stání, přechody, šrafy); `Trafico/205` stání ORA | CC BY 4.0 (katalog, ověřeno) | Slibné (obruby s typem + značení), ale nutné ověřit odjinud; může jít o blokování mimo Španělsko. |
| **Málaga** `datosabiertos.malaga.eu` | statický soubor | **ověřeno**: `…/da_cartografiaDelimitacionCalzadaSimplificada-4326.geojson` 200, `text/html`, **bez CORS**; obsah LineString (obrysy vozovky) | Linie okraje vozovky, bez tříd | CC BY 4.0 (katalog, ověřeno) | Jen při nasazení (stáhnout a zabalit), pro kontrolu obruby. Chodníky v katalogu nenalezeny. |
| Sevilla, Bilbao, Vitoria-Gasteiz | - | **neověřeno** (vyhledávání nenašlo veřejnou vrstvu chodníků/vozovek; Sevilla má IDE s WMS/WFS, Bilbao jen ulice, Vitoria vyměňuje DXF 1 : 500 jen smluvně) | - | - | Zatím nic. |

### 2b. Poznámka k datovému modelu

A Coruña i Madrid používají stejný model „BTU“ (pole `ID_FENOMENO`, `COMPONEN2D`, `TIPO_xxxx`, `TTRAM_0027`), který
vychází z národní normy pro městskou kartografii (Base Topográfica Urbana, neověřeno). Další města se stejným modelem lze
hledat podle jmen vrstev `ACERA`, `ISLETA`, `CALZADA`.

---

## 3. Budovy: Catastro INSPIRE (WFS)

| Služba | Ověřený stav | Pole | Licence | Poznámka |
|---|---|---|---|---|
| `https://ovc.catastro.meh.es/INSPIRE/wfsBU.aspx`, `BU:Building` | **ověřeno**: `service=WFS&version=2.0.0&request=GetFeature&typenames=BU:Building&srsname=EPSG::25830&bbox=…` 200, CORS `*`, Content-Type `application/x-unknown`, **jen GML** (55 KB na 100 × 100 m) | `beginning` (rok stavby, např. 1880, 1962; u části prázdné), `currentUse` (`1_residential`, `4_1_office`, `4_2_retail`, `4_3_publicServices`), **`numberOfFloorsAboveGround` v Building prázdné** | podle dokumentace volné užití s uvedením „Dirección General del Catastro“ (neověřeno; capabilities na Fees/AccessConstraints nic nevrátily) | |
| tamtéž `BU:BuildingPart` | **ověřeno**: `srsname=EPSG::4326&bbox=40.4185,-3.7045,40.4192,-3.7035` (pořadí lat, lon) 200, CORS `*`, 372 KB na asi 85 × 80 m | **`numberOfFloorsAboveGround`** vyplněné po částech budovy (0–8 u Sol), `numberOfFloorsBelowGround`; geometrie `posList` lat lon | jako výše | Podlaží brát z BuildingPart (maximum za budovu), rok a užití z Building. Odpověď je velká: dotazovat jen úzký pás kolem řezu. |
| Pokrytí | **ověřeno**: Bilbao (`bbox=43.2625,-2.9360,…`) vrací „No records founded“ | - | - | **Baskicko a Navarra mají vlastní katastr** (foral): Catastro je nepokrývá. Bizkaia má INSPIRE WFS budov (bizkaia.eus/inspirebizkaia), Navarra IDENA, Álava, Gipuzkoa – vše neověřeno. Tam OSM. |

---

## 4. Hledání adres a ulic: CartoCiudad

| Služba | Ověřený stav | Odpověď | Licence | Poznámka |
|---|---|---|---|---|
| `https://www.cartociudad.es/geocoder/api/geocoder/candidates?q=…&limit=N` | **ověřeno**, 200, CORS `*`, `application/json` | pole objektů: `address`, `muni`, `province`, `type` (`portal`, `callejero`…), `lat`, `lng`, `id`, `refCatastral` | CC BY 4.0 scne.es (dokumentace IGN/CNIG, neověřeno v odpovědi) | U ulic (`type: callejero`) je `lat`/`lng` **0,0**: geometrii dá až `find`. |
| `…/candidatesJsonp?q=…` | **ověřeno**, 200, CORS `*` | totéž v `callback(...)` | | JSONP není potřeba, stačí `candidates`. |
| `…/find?id=<id>&type=<type>` a `…/find?q=…` | **ověřeno**, 200, CORS `*` | `geom` jako WKT (`POINT(…)` u adresy, `MULTILINESTRING(…)` u ulice) | | Ulice „Paseo de Gracia“ vrátila osu celé ulice. |
| `…/reverseGeocode?lon=…&lat=…` | **ověřeno**, 200 | nejbližší adresa (`PUERTA DEL SOL`) | | Pro název ulice u řezu, pokud OSM nemá. |

Katalánské, galicijské a baskické názvy jsou v CartoCiudad v kastilské podobě („PASEO GRACIA“); OSM má místní.

---

## 5. Parkování

| Zdroj | Ověřený stav | Pole | Licence | Poznámka |
|---|---|---|---|---|
| **Madrid SER** `datos.madrid.es` dataset `218228-0-ser-calles` (CSV `…/218228-25-ser-calles-csv.csv`) | **ověřeno**: CKAN API 200, CORS `*`; CSV (latin1, `;`, desetinná čárka) přečteno | `Gis_X`, `Gis_Y` (ETRS89 UTM 30N, bod uprostřed úseku), `Calle`, `Nº Finca`, `Color` (Verde/Azul/…), **`Batería/Línea`** (orientace stání), `Número de Plazas` | podmínky datos.madrid.es (neověřeno) | **Poloha i orientace stání po úsecích**; statický soubor při nasazení (jako ZPS Prahy). Strana ulice jen podle polohy bodu. |
| **Barcelona** `trams-aparcament-superficie` (CSV `TRAMS.csv`, 3 MB, čtvrtletně) | **ověřeno**: začátek souboru přečten | `LATITUD_I/LONGITUD_I`, `LATITUD_F/LONGITUD_F` (začátek a konec úseku), `TIPUS_TRAM` (`AZL` modrá, `VR` zelená, `VM`…), `ADREÇA`, `PLACES` | CC BY 4.0 (katalog, ověřeno) | **Úseky placeného stání s polohou**, bez orientace (podélné/kolmé). Statický soubor při nasazení. |
| **Valencia** ORA `Trafico/MapServer/205`, vodorovné značení `Trafico/MapServer/238` | **neověřeno** (server nedostupný, viz 2a) | podle katalogu: barva ORA; značení stání, pruhů, přechodů | CC BY 4.0 (katalog) | |
| Madrid CARTOBASE `APARCAMIENTO` (linie stání) | jen jako obraz (viz 2a) | - | - | |

---

## 6. OSM (Geofabrik) a hranice

**Geofabrik, ověřeno 23. 11. 2026** (`index-v1-nogeom.json` a stránka `europe/spain/`): `spain-latest.osm.pbf` 1,4 GB;
17 autonomních společenství + Ceuta a Melilla, cesta `europe/spain/<id>/<id>-latest.osm.pbf`:

| id | velikost | | id | velikost |
|---|---|---|---|---|
| andalucia | 189 MB | | galicia | 107 MB |
| aragon | 91,5 MB | | islas-baleares | 44,7 MB |
| asturias | 35,1 MB | | la-rioja | 13,9 MB |
| cantabria | 34,1 MB | | madrid | 81,9 MB |
| castilla-la-mancha | 103 MB | | melilla | 782 KB |
| castilla-y-leon | 171 MB | | murcia | 33,8 MB |
| cataluna | 262 MB | | navarra | 35,9 MB |
| ceuta | 616 KB | | pais-vasco | 66,2 MB |
| extremadura | 38,5 MB | | valencia | 135 MB |

**Kanárské ostrovy** jsou u Geofabriku „special region“ s rodičem `africa`: `africa/canary-islands/canary-islands-latest.osm.pbf`
(57,8 MB). Pro `tools/countries.mjs` tedy díly jako u Francie, `es_<zkratka>` → `spain/<id>/<id>`, a Kanáry zvlášť s cestou
`africa/canary-islands/canary-islands` (`.github/workflows/osm-tiles.yml` řádek 105 má prefix `europe/` napevno: pro Kanáry ho bude třeba rozšířit). Balíky největších
(Katalánsko 262 MB, Andalusie 189 MB) se po zabalení vejdou pod 512 MB (podle poměru ČR: 1,39 GB dlaždic z ~0,8 GB pbf,
spíš těsně; ověřit při stavbě). Ceutu a Melillu lze přidat k Andalusii, nebo jako dva malé díly.

**Hranice** (neověřeno dotazem, podle postupu Francie v `tools/build_staty.mjs`): `gisco("ES")` z
`CNTR_RG_01M_2024_4326.geojson` (Eurostat GISCO 1 : 1 M, © EuroGeographics). Obsahuje pevninu, Baleáry, Kanáry, Ceutu a
Melillu; Andorra (AD) a Gibraltar (GI) jsou samostatné státy GISCO, takže do Španělska nepatří. **Llívia** je ve
Francii díra (`gisco("FR", true)`) a ve Španělsku má být vlastním vnějším prstencem: ověřit, že ji `gisco("ES")` vrací
a `cityAt` ji přiřadí Španělsku. Kanáry jsou mimo obdélník Evropy: filtr jako u Francie nepoužívat. Pro ortofoto ICGC je
potřeba hranice Katalánska (GISCO NUTS 2 `ES51`, jako `laender.json` v Německu).

---

## Shrnutí

| Oblast | Zdroj | Stav | CORS | Licence | Doporučení |
|---|---|---|---|---|---|
| Ortofoto celostátně | IGN PNOA WMS `pnoa-ma` | ověřeno, 25 cm (2023–24) | `*` | CC BY 4.0 | **Použít** (`res: 0.25`), omezit na území ES; Melilla jiná licence (od recenze 23. 11. 2026 se tam pruhy z PNOA nečtou, `lanes-ortho.js` `ES_NOT_PNOA`; mapová vrstva v `app.js` zatím ano) |
| Ortofoto Katalánsko | ICGC `ortofoto_color_vigent` | ověřeno, 25 cm 2025 | `*` | CC BY 4.0 (neověř.) | Použít v Katalánsku přednostně |
| Mapa povrchů | A Coruña BTU viario | ověřeno, polygony s třídami | echo | neověřena („Intranet“) | **Použít po dotazu na město**, A/B |
| Mapa povrchů | Zaragoza IDEZar WFS | ověřeno, chodníky + mediány | `*` | bez omezení (capab.) | **Použít**, vozovka jako zbytek, A/B |
| Mapa povrchů | Madrid CARTOBASE | jen obraz (Map) | echo | Ayto. Madrid | Až po zkoušce čtení barev nebo předzpracování listů 1 : 1000 |
| Mapa povrchů | Barcelona, ICGC CT1M | jen linie / GPKG 652 MB | `*` | CC BY 4.0 | Online ne; GPKG prozkoumat |
| Mapa povrchů | Valencia | server nedostupný | ? | CC BY 4.0 | Ověřit znovu (obruby s typem + značení) |
| Budovy | Catastro `BuildingPart` + `Building` | ověřeno (GML) | `*` | DG Catastro | **Použít** (podlaží, rok, užití); mimo Baskicko a Navarru (zatím se ptá i tam: hranice společenství aplikace nemá); od recenze 23. 11. 2026 s limitem 25 s, pamětí na bod a domem pod bodem |
| Hledání | CartoCiudad `candidates` + `find` | ověřeno | `*` | CC BY 4.0 | **Použít** |
| Stání | Madrid SER CSV, Barcelona TRAMS CSV | ověřeno | `*` (API) | CC BY 4.0 / Madrid | Statické soubory při nasazení |
| OSM | Geofabrik 19 dílů + Kanáry (africa) | ověřeno | - | ODbL | díly `es_*` na R2 |

**Doporučení:** Španělsko jako Francie: odhad z OSM a ortofota PNOA všude, k tomu Catastro pro domy a CartoCiudad pro
hledání. Města s mapou povrchů, která jde číst z prohlížeče: **Zaragoza** (WFS, chodníky a mediány, CORS, bez omezení) a
**A Coruña** (úplné polygony vozovky, chodníku, cyklostezky a stání; licence nejasná, služba ve složce „Intranet“, zeptat
se města). Madrid má nejpodrobnější kresbu (CM1000 s chodníky, ostrůvky, cyklostezkami a stáním), ale jen jako obraz:
buď čtení barev jako `dmvs.js`, nebo předzpracování listů 1 : 1000 při nasazení. Valencii ověřit znovu (možná blokuje
zahraniční IP). Barcelona online plochy nemá. Stání v Madridu (SER s orientací) a Barceloně (úseky) jako statické
soubory.

Neověřeno: přesné licence Catastra, A Coruñi a datos.madrid.es; geometrie cyklotras Zaragozy; Sevilla, Bilbao, Vitoria;
foralní katastry Baskicka a Navarry; hranice GISCO pro ES (Llívia); městská ortofota Madridu a Barcelony.
