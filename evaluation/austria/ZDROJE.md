# Austria: open web data services for Profily ulic (browser-callable)

Test date: 16. 11. 2026. Client name "profily-ulic". Tests: one small request per endpoint (bbox ~60 x 50 m in central Vienna, 16.3700,48.2050 to 16.3760,48.2100, or one point at Stephansplatz). CORS checked with `curl -sI -H "Origin: https://streetspace.eu"`, reading `Access-Control-Allow-Origin`.

Legend: **V** = verified by my own request in this session. **R** = only read in search results or in a capabilities document, not tested.

## 1. National

### 1a. State boundary of Austria
- **Recommended (V):** Eurostat GISCO, Countries 2024, 1:20M, GeoJSON. `https://gisco-services.ec.europa.eu/distribution/v2/countries/geojson/CNTR_RG_20M_2024_4326.geojson`
  - HEAD with Origin: 200, `Access-Control-Allow-Origin: *`, about 2.0 MB (1:10M is 3.8 MB, 1:3M is 15 MB, 1:1M is 58.9 MB for all of Europe).
  - I downloaded the 1:1M file once (58.9 MB, all countries) and cut out AT (1 MultiPolygon, CNTR_ID=AT, ISO3 AUT). Saved as `scratchpad/austria-gisco-2024-01m.geojson` (110 KB). That was a single request, but larger than the "small requests" rule would normally allow; the 20M file is what I'd use in the app.
  - Licence: EU Commission / Eurostat GISCO reuse policy, attribution to EuroGeographics and Eurostat (R, not checked on the page).
- **BEV official state border:** BEV WMS `https://data.bev.gv.at/geoserver/INSdataAU/wms` (WMS 1.3.0, layers `INSdataAU_AdministrativeBoundaries`, `AB_AdministrativeBoundary`). GetCapabilities is 200 with `ACAO: *` (V). GetMap for a Vienna bbox returned a 1.8 KB PNG with `ACAO: *` (V). **The WFS of the same geoserver is disabled:** `ServiceUnavailable, "Service GeoServer Enterprise WFS is disabled"` (V). So there is no vector query; only raster.
- **BEV Verwaltungsgrenzen (VGD)** is published as dated SHP ZIPs (R, from BEV geonetwork records).
- **Statistik Austria** Gemeinde/Bezirk/Bundesland boundaries: open.data portal and GitHub copies from 2021 (CC BY 4.0) (R). The state border is not listed there.
- Open Data Portal Austria GeoJSON (2013/2017, Gemeinden etc.) (R; the portal did not answer in my test, `data.opendataportal.at` timed out).

### 1b. Orthophoto (basemap.at, Vienna-hosted tile cache)
- **Tile template (V):** `https://maps.wien.gv.at/basemap/bmaporthofoto30cm/normal/google3857/{z}/{y}/{x}.jpeg` (order z/row/col, as in WMTS). Test tile z17 (x=71497, y=45448): 200, image/jpeg, 21 KB, `ACAO: *` (V). Test tile z19 at Stephansplatz (z19/y=181795/x=285988): 200, 15 KB, `ACAO: *` (V).
- `maps1.wien.gv.at` gave a connection error in my test (code 000), `maps.wien.gv.at` worked. The WMTS capabilities list hosts maps1 to maps4 and maps; use one that works, or rotate.
- **WMTS capabilities (V):** `https://basemap.at/wmts/1.0.0/WMTSCapabilities.xml`, 200, `ACAO: *`, 30 KB. Also `https://maps.wien.gv.at/basemap/1.0.0/WMTSCapabilities_31256.xml` (200, 28 KB) for MGI / GK East.
- Layers in the capabilities (V): `bmaporthofoto30cm` (30 cm ortho, jpeg, google3857 zooms 0–20), `bmap` (colour), `bmapgrau`, `bmaphidpi` (512 px), `bmapoverlay`, `bmapgelaende`, `bmapoberflaeche`, `geolandbasemap`.
- Licence: basemap.at tiles are CC BY 4.0, attribution "basemap.at" (R, from the Static-Maps issue and the basemap.at description; the capabilities string I could not find).
- Pixel reading: `ACAO: *` is present, so canvas reads should work (V for headers only; I did not run a canvas test).

### 1c. Address search / geocoder
- **No free, browser-callable national geocoder found.**
  - BEV Adresssuch-Service: requires registration and an API token; terms and fees via BEV customer service (R, from bev.gv.at search results; not verified).
  - adressregister.at: free web search UI, not an API (`https://adressregister.at/` 200, V for the page only).
  - offene-adressen.at (third-party API on BEV data) did not answer (code 000, V). Reverse geocoder by Thomas Konrad on GitHub (R).
  - BEV Adressregister tagesaktuell (bulk download, licence: "Standardentgelte und Nutzungsbedingungen des BEV", R from the geonetwork record). Bulk file, not a browser query.
- **Vienna only (V):** WFS `ogdwien:ADRESSENOGD`, points, fields `NAME_STR` (street), `ONR_VON`, `GEB_X`, `GEB_Y`, `PLZ`, `ZUG_X`, `ZUG_Y`. CQL test `NAME_STR LIKE 'Stephans%'`: 200, `ACAO: *`, returned features. Good geocoder for Vienna.
- Salzburg WFS has no address layer I could find in the list (not tested).

### 1d. Buildings with use and height
- **Vienna (V):** `ogdwien:GEBAEUDETYPOGD` (polygons, `BAUTYP`, `OBJ_STR` = object type, 500 in bbox), `ogdwien:FMZKGEBOGD` (polygons, `LAYER` = Gebäude 915, Überbauung, Flugdach, Sonstiges Bauwerk), `ogdwien:GEBAEUDEINFOOGD` (points, address-linked building info, e.g. `STRCD`, `VONN`, `BISN`; height/floors not confirmed).
- **Rest of Austria:** no open national building footprint with heights (R). BEV Adressregister gives address points only. OSM is the fallback (not tested; the project rule says use own OSM tiles, not Overpass).

## 2. City surface maps

### Vienna (FMZK = Flächen-Mehrzweckkarte, MA 41 / Stadtvermessung)
WFS `https://data.wien.gv.at/daten/geo?service=WFS&request=GetFeature&version=2.0.0&typeNames=ogdwien:<LAYER>&outputFormat=application/json&srsName=EPSG:4326&bbox=…,EPSG:4326&count=…`
GetCapabilities is 200 with `ACAO: *` and lists 377 layers (V). Every GetFeature below returned 200 with `ACAO: *` (V).

| Layer | Geometry (test bbox count) | Fields that give the surface / class | Verified values |
|---|---|---|---|
| `FMZKVERKEHR1OGD` | Polygon (246) | `LAYER`, `F_KLASSE`, `KLASSE_SUB` | Fahrbahn (21), Ruhender Verkehr (33), Straßenmobiliar (31), Fahrbahnschwelle (32), Zebrastreifen (30), Private Verkehrsfläche (26), Telefonzelle (82), Kiosk (84), Denkmal (81) |
| `FMZKVERKEHR2OGD` | Polygon (1067) | `LAYER`, `F_KLASSE` | Gehsteig (23), Fußgängerzone (24), Gehweg/Radweg (25), Befestigte Fläche (59), Innenhof (51), Stiege (74), Portal (86) |
| `SISBELAGOGD` (Straßenbelag, MA 28) | Polygon (1678) | `BELAG`, `BELAG_TXT` (surface type), `FLART`, `TYPE`, `BORDSTA`, `BAUKENN`, `ERHALTUNG` | BELAG GA = Gussasphalt Gehsteig (647), GP = Granitplatten (375), HS = Spezial/Hartbeton (146), GM = Großsteinpflaster Fugenverguss (113), AB = Asphaltbeton (113), ZB = Zementbeton (92). FLART A = Abschnittsfläche, T = T-Plateau, P = Plateau |
| `SISBORDSTOGD` (Bordsteine, MA 28) | LineString (1434) | `TYPE` (BST1/3/4), `TYPE_TXT` | Granitbordstein gestockt 32 cm (BST4, 1305), 20 cm (BST3, 106), Saum aus 7"-Steinen 18 cm (BST1, 23). **These are the kerb lines.** |
| `SISGEHSTEIGABSOGD` | Point (66) | `ABSENKUNG_TXT` | Gehsteigabsenkung: bis 3 cm (47), 0 cm (11), bis 5 cm (5), nicht abgesenkt (3) |
| `STRASSENGRAPHOGD` (street graph) | LineString (128) | `FRC`, `FOW`, `FOW_NAME`, `DEDICATEDWIDTH` (-1 = unknown, else width in m), `EDGECATEGORY`, `FEATURENAME` | FOW 3 = ungeteilte Fahrbahn (76), 14 = Fußgängerzone (47), 15 = Fußweg (5). Width given for 42 of 128 |
| `RADWEGEOGD` | LineString (39) | `MERKMAL`, `SUBMERKMAL` | Getrennte Führung (23), Radroute (8), Markierte Anlagen (8); subtypes incl. Radfahren gegen die Einbahn, Radfahren in Fußgängerzone |
| `RADNETZOGD` | LineString (39) | `RANG`, `STRNAM` | Radnetz ranking |
| `KURZPARKZONEOGD` | Polygon (1) | `DAUER`, `GUELTIG_VON`, `ZEITRAUM`, `WEBLINK2` | Kurzparkzone 2 h |
| `KURZPARKSTREIFENOGD` | (0 in bbox) | not tested | |
| `PARKENBERECHTOGD`, `PARKENGELTUNGOGD`, `PARKENAUTOMATOGD` | not tested | | |
| `BAUMKATOGD` | Point (58) | `GATTUNG_ART` (species), `BAUMHOEHE_TXT`, `KRONENDURCHMESSER_TXT`, `STAMMUMFANG_TXT`, `PFLANZJAHR` | Trees with species and sizes |
| `STRUKALLEEBAUMOGD`, `STRUKGRUENRAUMOGD` | not tested | | |
| `FMZKGRUEN1OGD` | (0 in bbox) | | green layers `FMZKGRUEN2OGD`, `GRUENGEWOGD` not tested |
| `HALTESTELLEWLOGD` | Point (1) | `BEZEICHNUNG`, `WL_NUMMER` | Wiener Linien stops |
| `OEFFHALTESTOGD` | Point (4) | `HTXT`, `HLINIEN`, `LTYP` | Public transport stops with lines |
| `LAMPENTAUSCHOGD` | Point (not counted, 11 KB sample) | `PROJEKTSTATUS_ID` | Lamp-exchange project points, **not a full lamp inventory** (caveat) |
| `ELADESTELLEOGD`, `LADEZONEOGD`, `BUSHALTEZONEOGD`, `BUSPARKPLATZOGD`, `BUSVERBOTSZONEOGD`, `FAHRRADABSTELLANLAGEOGD`, `GRPZONENOGD`, `WOHNSTRASSEOGD`, `FUSSGEHERZONEOGD` | listed, not tested | | |

Vienna licence: `AccessConstraints` in the WFS capabilities points to `https://data.wien.gv.at/nutzungsbedingungen` (V in the caps; the page itself did not answer, code 000). Vienna OGD is normally CC BY 4.0 Wien (R, not verified on the page).

### Salzburg (Stadt Salzburg, `data.stadt-salzburg.at`)
WFS `https://data.stadt-salzburg.at/geodaten/wfs?service=WFS&request=GetFeature&version=2.0.0&typeNames=ogdsbg:<LAYER>&outputFormat=application/json&srsName=EPSG:4326&bbox=…`
GetCapabilities 200 (V). `ACAO: *` on all tested layers (V). Test bbox 13.0440,47.7975 to 13.0500,47.8015.

| Layer | Geometry (test bbox count) | Fields | Notes |
|---|---|---|---|
| `busspur` | MultiLineString (12) | `ID`, `FEATURENAME` | bus lanes (V) |
| `bikequality` | MultiLineString (300, capped by my count=300) | `QUALITY`, `BAUWEISE`, `SECTIONID`, `SEGMENTID` | cycle-route quality along segments (V) |
| `kurzparkzone` | MultiPolygon (2) | `MAXIMALE_PARKDAUER`, `ART`, `GEBUEHRENPFLICHT`, `NAME` | (V) |
| `bewohnerparkzone` | MultiPolygon (3) | `ART`, `GRUPPE`, `NAME` | (V) |
| `baumkataster` | Point (67) | `BAUMART`, `NAME_BOTANISCH`, `NAME_DEUTSCH` | (V) |
| `verkehrszeichen` | Point (271) | `VZBEZ` (sign code), `VZTEXT`, `HOEHE`, `BREITE`, `STRASSE`, `EDGE_ID` | traffic signs with code (V) |
| `verkehrslichtsignalanlage` | Point (67) | `CODE`, `MARKE` | traffic lights (V) |
| `poller`, `radinformation`, `parkplatz` (0 in bbox) | | | (V) |
Other layers listed in capabilities but not tested: `gip_edge` (street graph), `anwohnerzone`, `radbaumassnahme_aktuell`, `hoehenmodell-vektor`, `orthofoto`, `bebauungsplan`, `flaechenwidmung`, `stadtteil`. Licence: `AccessConstraints` says "Datenquelle: Stadt Salzburg – data.stadt-salzburg.at; Nutzungsbedingungen: CC BY 3.0 AT" (V in caps).

### Graz, Linz, Innsbruck, Klagenfurt (not verified)
- **Graz:** `data.graz.gv.at` redirects to `data.gv.at` (V, 301). Graz geodata page (`graz.at/.../Geodaten_Themen.html`, 200) names a Straßennetz layer and "Hydraulikdaten/Kanalnetz" and "Einwohnerdaten / Adressen" (R). No WFS endpoint found. The GIP (national Graphenintegrations-Plattform) carries sidewalks and bike lanes as usage strips on the road (R, via search). **Maybe**: check the GIP route below.
- **Linz:** `data.linz.gv.at` redirects to `data.gv.at/auftritte/stadt-linz` (V); that page returned no readable text. `webgis.linz.at` (200 but JS only). No surface layers found (R).
- **Innsbruck:** `data.innsbruck.gv.at` redirects to data.gv.at (V); page not readable. Not tested further.
- **Klagenfurt:** `klagenfurt.at` 200 (V); no open geodata found (R, not searched further).
- **Styria (Land):** `data.steiermark.at` 200 (V). WMS `gis.stmk.gv.at` redirects to `landesentwicklung.steiermark.at` (V). Not tested further.
- **GIP (Graphenintegrations-Plattform, Austria-wide):** road graph with usage strips; the best national street-space source I could identify, but no endpoint tested (R).

## 3. Other layers
- Vienna: trees (BAUMKATOGD, V), street lights (LAMPENTAUSCHOGD, V but partial), stops (HALTESTELLEWLOGD, OEFFHALTESTOGD, V), parking zones (KURZPARKZONEOGD, V, PARKENBERECHTOGD/PARKENGELTUNGOGD not tested), bicycle (RADWEGEOGD, RADNETZOGD, V). **Tram tracks** are not in this WFS list (no `GLEIS` / tram layer by name; not searched further).
- Salzburg: trees, parking, bike quality, traffic signs, traffic lights (all V).

## 4. Underground utilities (Leitungskataster)
- No open utility cadastre found for Austria or the cities tested (R). Graz lists "Hydraulikdaten/Kanalnetz" on its geodata page, but I found no open download or endpoint for it.
- Conclusion: treat as **no** (not available as open data).

## Table

| service | endpoint | what it gives | CORS (verified?) | licence | recommendation |
|---|---|---|---|---|---|
| Austria boundary, GISCO 2024 1:20M | `https://gisco-services.ec.europa.eu/distribution/v2/countries/geojson/CNTR_RG_20M_2024_4326.geojson` | AT MultiPolygon, 2 MB | `*` (V, HEAD) | EU / Eurostat GISCO reuse, EuroGeographics attribution (R) | **use** (cut AT or use the 20M file) |
| BEV admin boundaries WMS | `https://data.bev.gv.at/geoserver/INSdataAU/wms` | PNG tiles of AB layers (no vector) | `*` (V) | BEV Standardentgelte/Nutzungsbedingungen (R) | maybe (raster only) |
| BEV WFS | `https://data.bev.gv.at/geoserver/INSdataAU/wfs` | disabled | n/a (V: ServiceUnavailable) | - | no |
| basemap.at ortho 30 cm | `https://maps.wien.gv.at/basemap/bmaporthofoto30cm/normal/google3857/{z}/{y}/{x}.jpeg` (also maps1–4) | JPEG tiles, z0–20 | `*` (V, z17 and z19) | CC BY 4.0 basemap.at (R) | **use** (pixels readable, CORS OK) |
| basemap.at WMTS caps | `https://basemap.at/wmts/1.0.0/WMTSCapabilities.xml` | layer and template list | `*` (V) | - | use for templates |
| BEV Adresssuch-Service | BEV web service, token | address geocoding | not tested | registration, fees (R) | maybe (only with token; not browser-free) |
| adressregister.at | `https://adressregister.at/` | web UI search | n/a | - | no (UI, not API) |
| offene-adressen.at | `https://www.offene-adressen.at/` | third-party API | unreachable (V) | - | no |
| Vienna addresses | `https://data.wien.gv.at/daten/geo?…typeNames=ogdwien:ADRESSENOGD` | address points, Vienna only | `*` (V, incl. CQL) | Wien OGD (R) | **use** (Vienna geocoder) |
| Vienna FMZK traffic | `…typeNames=ogdwien:FMZKVERKEHR1OGD` / `FMZKVERKEHR2OGD` | roadway, footway, parking, islands, pedestrian zone | `*` (V) | Wien OGD (caps: nutzungsbedingungen) | **use** |
| Vienna kerbs | `…typeNames=ogdwien:SISBORDSTOGD` | kerb lines, type and height | `*` (V) | Wien OGD (R) | **use** |
| Vienna pavement | `…typeNames=ogdwien:SISBELAGOGD` | surface material per polygon | `*` (V) | Wien OGD (R) | **use** |
| Vienna dropped kerbs | `…typeNames=ogdwien:SISGEHSTEIGABSOGD` | dropped kerb points | `*` (V) | Wien OGD (R) | use |
| Vienna street graph | `…typeNames=ogdwien:STRASSENGRAPHOGD` | road class, width (partly), pedestrian zone | `*` (V) | Wien OGD (R) | use |
| Vienna bike network | `…RADWEGEOGD`, `…RADNETZOGD` | cycle paths, routes | `*` (V) | Wien OGD (R) | use |
| Vienna trees | `…BAUMKATOGD` | trees, species, size | `*` (V) | Wien OGD (R) | use |
| Vienna buildings | `…GEBAEUDETYPOGD`, `…FMZKGEBOGD` | building polygons, type | `*` (V) | Wien OGD (R) | use (no heights verified) |
| Vienna stops | `…HALTESTELLEWLOGD`, `…OEFFHALTESTOGD` | stops | `*` (V) | Wien OGD (R) | use |
| Vienna lamps | `…LAMPENTAUSCHOGD` | lamp-exchange points only | `*` (V) | Wien OGD (R) | no (incomplete) |
| Vienna parking | `…KURZPARKZONEOGD` | short-term zones | `*` (V) | Wien OGD (R) | maybe |
| Salzburg WFS | `https://data.stadt-salzburg.at/geodaten/wfs` | busspur, bikequality, parking zones, trees, signs, traffic lights | `*` (V) | CC BY 3.0 AT (V, caps) | use for Salzburg |
| Graz GIP / geodata | `graz.at` pages, GIP | street graph, usage strips | not found (R) | - | maybe (no endpoint) |
| Linz, Innsbruck, Klagenfurt | portals only | nothing found | n/a | - | no (not found) |
| Statistik Austria boundaries | open.data portal / GitHub 2021 | Gemeinde, Bezirk, Land | not tested | CC BY 4.0 (R) | maybe (offline file, not a state border) |
| Leitungskataster | none | - | - | - | no (not open) |

## Notes for the team (short)
- Polite use: my probes were one to three small requests per endpoint. The one exception is the Eurostat 1:1M file (58.9 MB, one time). I did not use Overpass.
- The BEV geoserver WFS is down; if a vector state border is needed in the app, use the GISCO file.
- Vienna WFS layers accept `count` and bbox; the test bbox sizes stayed small.
