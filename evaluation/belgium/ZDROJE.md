# Belgie: ověřené otevřené služby pro profily ulic

Průzkum 20. 11. 2026. Hlavičky: `User-Agent: profily-ulic`, `Origin: https://streetspace.eu`. Pauza 1 s mezi požadavky, celkem asi 52 požadavků. Overpass ani Nominatim nebyly použity. Nic nebylo zapsáno do repozitáře.

Legenda: **ano** = ověřeno (HTTP 200, data, CORS), **částečně** = ověřeno jen část, **ne** = neprošlo, **neověřeno** = nezkoušeno nebo nenalezeno.

Poznámka k CORS: `*` znamená povolení pro všechny. `https://streetspace.eu` znamená, že server vrací jen naši doménu, takže v prohlížeči z jiné domény nepůjde.

---

## 1. Plochy povrchů (vozovka, chodník, cyklostezka, parkování, zeleň)

| Služba | URL šablona | Funguje? | CORS | Třídy / typy | Licence | Poznámky |
|---|---|---|---|---|---|---|
| Flandry GRB WFS, vozovka (WBN) | `https://geo.api.vlaanderen.be/GRB/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=GRB:WBN&bbox=51.053,3.722,51.055,3.725,urn:ogc:def:crs:EPSG::4326&srsName=EPSG:4326&count=N&outputFormat=application/json` | **ano** | `*` | Vzorek Gent (500 × 600 m, 216 prvků): `TYPE` 2 = wegsegment (144), 1 = kruispuntzone (72). Chodník v tomto vzorku nebyl. | neověřeno (Vlaanderen open data, zkontrolovat na metadata.vlaanderen.be) | **Polygony**. `srsName=EPSG:4326` vrací souřadnice `[lon, lat]`. Bez `srsName` vrací Lambert 72 (EPSG:31370). Při bbox v EPSG:4326 je pořadí lat,lon. |
| Flandry GRB WFS, typy vrstev | `…/GRB/wfs?service=WFS&request=GetCapabilities` | **ano** | `*` | Vrstvy: GRB:Adres, ADP, ANO, GBA, GBG, GVL, GVP, KNW, LBZ, SGBG, SBN, TRN, WBN, WGA, WGO, WGR, WLAS, WLI, WPI, WRI, WRL, WTI, WTZ, Wegknoop, Wegsegment | neověřeno | Vrstvy WGO (wegopdeling) a WTZ a jejich geometrie neověřeny. Chodníky a cyklostezky v GRB zřejmě existují v jiných `TYPE` nebo v WGO. Nezkoumáno. |
| Brussels UrbIS, WFS vektor | `https://geoservices-urbis.irisnet.be/geoserver/urbisvector/wfs?request=GetCapabilities&service=WFS&version=2.0.0` | **částečně** | `*` | GetCapabilities vrací 200, ale **bez žádných FeatureType**. Služba je „download service“ s formátovanou URL. | CC0 (podle capabilities) | Vrstvy povrchů nenalezeny. Novější host `geoservices-vector.irisnet.be` nezkoušen. Podle popisu UrbIS Vector obsahuje „Parcels and buildings“, „Land use“, „Transport networks“, „Administrative units“, „3D buildings“, „Points of interest“. Chodníky v seznamu nejsou. |
| Valonsko PICC, Voirie (ArcGIS MapServer) | `https://geoservices.wallonie.be/arcgis/rest/services/TOPOGRAPHIE/PICC_VDIFF/MapServer?f=json` | **ano** (JSON) | `https://streetspace.eu` (jen naše doména) | Vrstvy: 19 Voirie - Noeud (multipoint), 20 Voirie - Ligne (polyline), 21 Voirie - Axe (polyline), 24 Voirie - Surface (polygon) | © SPW, katalog geoportail.wallonie.be (licence neověřena) | **Dotaz ověřen**: `…/MapServer/24/query?where=1%3D1&geometry=5.5700%2C50.6380%2C5.5750%2C50.6420&geometryType=esriGeometryEnvelope&inSR=4326&outSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=false&f=json` vrátil 200 a atributy (Liège). Geometrie nebyla vrácena, zkoušet s `returnGeometry=true`. Pořadí os u `outSR=4326` je lon, lat. |
| Valonsko PICC, Bords de voirie (FDC_SPW) | `https://geoservices.wallonie.be/arcgis/rest/services/DONNEES_BASE/FDC_SPW/MapServer/119?f=pjson` | **ano** (metadata) | `https://streetspace.eu` | Feature layer 119 „Bords de voirie, chemin ou îlot directionnel © SPW“, `esriGeometryPolyline`, zdroj VOIRIE_LIGNE z PICC | © SPW | Jen čáry hran, ne plochy. |

## 2. Ortofoto v Web Mercatoru s CORS

| Služba | URL šablona | Funguje? | CORS | Max. zoom | Licence | Poznámky |
|---|---|---|---|---|---|---|
| Flandry, OMWRGBMRVL WMTS (zima, střední měřítko, barva, nejnovější) | GetCapabilities: `https://geo.api.vlaanderen.be/OMWRGBMRVL/wmts?service=WMTS&request=GetCapabilities`. Dlaždice (KVP): `…/wmts?service=WMTS&request=GetTile&version=1.0.0&layer=omwrgbmrvl&style=default&tilematrixset=GoogleMapsVL&tilematrix={z}&tilerow={y}&tilecol={x}&format=image/jpeg` | **částečně**: caps 200, dlaždice **400** („Style 'default' is invalid“) | `*` | Matice `TileMatrix` 0 až 15 (podle capabilities). | neověřeno (Digitaal Vlaanderen, metadata „OMWRGBMRVL“) | Je potřeba přečíst název stylu z capabilities (`Style/Identifier`) a zkusit znovu. Matice `GoogleMapsVL` je Web Mercator. Pokrývá i Brusel (podle metadat). |
| Flandry, starý OMWRGB WMTS | `https://geo.api.vlaanderen.be/OMWRGB/wmts?…` | **ne** | — | — | — | 302 na `error.html`. |
| Valonsko, ORTHO_LAST (ArcGIS MapServer) | Export: `https://geoservices.wallonie.be/arcgis/rest/services/IMAGERIE/ORTHO_LAST/MapServer/export?bbox=5.5700,50.6380,5.5740,50.6410&bboxSR=4326&imageSR=3857&size=256,256&format=png&f=image` | **ano** (PNG 256 × 256, Liège) | `https://streetspace.eu` (jen naše doména) | lods až zhruba úroveň 15 (0,26 m/px na úrovni 14 podle metadat) | „SPW (2026)“ | **Ne jako XYZ**: `/tile/{z}/{y}/{x}` je v nativním EPSG:31370 a vrátil 404. Použitelné jen přes `export` s `bboxSR=4326&imageSR=3857`, tedy jeden požadavek na dlaždici. |
| Valonsko, ORTHO vintage (ORTHO_2025_PRINTEMPS atd.) | `…/IMAGERIE/ORTHO_2025_PRINTEMPS/MapServer/export?…` | neověřeno | neověřeno | neověřeno | „SPW“ | Seznam služeb v IMAGERIE obsahuje ortofota 1971 až 2026, včetně _IR (infračervené). |
| NGI, topo (WMTS, EPSG:3857) | `https://cartoweb.wmts.ngi.be/1.0.0/topo/default/3857/{z}/{y}/{x}.png` | **ne pro ulice**: z10 vrátil 200 s 139 B (prázdná dlaždice), z12, z14, z16 a z18 vrátily 404 | `*` | — | neověřeno | Vrstvy v capabilities: `crossborder`, `overlay`, `topo`. **Ortofoto NGI v nich není.** |
| Brusel, UrbIS ortofoto | — | **neověřeno** | — | — | — | Nenalezeno v našem průzkumu. Hledat v katalogu Geobru. |

## 3. Budovy (rok, využití, výška)

| Služba | Funguje? | Atributy | Poznámky |
|---|---|---|---|
| Flandry GRB Gbg (WFS) | **ano** | Vzorek Gent (GBG.608511, polygon). Atributy: BEGINDATUM, BGNINV, LBLBGNINV, LBLTYPE, OIDN, OPNDATUM, TYPE, UIDN, VERSDATUM, VERSIE | **Bez výšky, roku ani využití.** Typy (`TYPE`) nebyly spočítány. Zdroj výšek v GRB neověřen. |
| Brusel UrbIS (Parcels and buildings, 3D buildings) | neověřeno | — | Podle popisu UrbIS Vector je v produktu „3D buildings“. Vrstva ani pole výšky nebyla ověřena. |
| Valonsko PICC, Construction - Bâtiment - Emprise / Bord (MapServer PICC_VDIFF) | neověřeno (jen název vrstvy) | — | Vrstvy existují v seznamu služby. Geometrie a pole neověřeny. |
| Národní 3D | neověřeno | — | Nehledáno. |

## 4. Parkování

| Služba | Funguje? | CORS | Licence | Poznámky |
|---|---|---|---|---|
| Antverpy, parkeertariefzones (ArcGIS MapServer) | **ano** (JSON) | `https://streetspace.eu` (jen naše doména) | neověřeno (Stad Antwerpen open data) | `https://geodata.antwerpen.be/arcgissql/rest/services/P_Publiek/parkeertariefzones/MapServer?f=json`. Vrstvy: „Parkeerautomaten_ticket“ (bod), „Parkeerautomaten_LEZ_dagpas“, „Eventtariefzones“, „Betalend parkeren tot 22u“, „Parkeertariefzones - wijzigingen oktober“. Tarifní zóny (polygony) nebyly vyzkoušeny. Dál z vyhledávání: GeoJSON „Buurtparkingen“ (`portaal-stadantwerpen.opendata.arcgis.com/api/download/…`), nezkoušeno. |
| Brusel, parking.brussels (WFS ParkingBrussels) | **ne (302)** | — | Metadata: volné použití v mezích Brussels Open Data Licence. Shapefile, CSV, GeoJSON. | `https://data.parking.brussels/geoserver/ParkingBrussels/ows?service=WFS&version=2.0.0&request=GetCapabilities` vrátil 302 bez CORS. Lze zkusit i `opendatastore.brussels`, neověřeno. Na úrovni ulice: „On-street parking rules and zones“ a „On-street parking supply“ (katalog Geobru, CC-BY, neověřeno). |
| Gent, parkeerzones (data.stad.gent) | neověřeno | — | — | Vyhledávání nevrátilo výsledky. |

## 5. Vyhledávání adres s CORS

| Služba | Funguje? | CORS | Příklad dotazu | Pole v odpovědi | Poznámky |
|---|---|---|---|---|---|
| Flandry Geolocation v4 | **ano** | `*` | `https://geo.api.vlaanderen.be/geolocation/v4/Location?q=Veldstraat%2012%20Gent` | `LocationResult[]`: `FormattedAddress`, `Municipality`, `Zipcode`, `Thoroughfarename`, `Housenumber`, `ID`, `Location.Lat_WGS84`, `Location.Lon_WGS84`, `X_Lambert72`, `Y_Lambert72`, `BoundingBox` | Výsledek Veldstraat 12: lat 51,053263, lon 3,722089. Brusel, `q=Grote Markt 1 Brussel`: lat 50,847161, lon 4,351997 (ano, Brusel je v dosahu). **Dotaz jen na ulici** (Groentemarkt Gent) vrátil prázdný výsledek. Je potřeba číslo. |
| Brusel UrbIS localization (`geoservices.irisnet.be/localization/...`) | **ne (404)** | — | `…/Localization/Localization?q=Grand-Place%201000` | — | Odpověď je Tomcat 7 error page. Starý endpoint. |
| Brusel nový geocoder (Paradigm, `searchAddress`) | neověřeno | — | Podle dokumentace: `/api/v1/brussels/geocoding/searchAddress`, Swagger na `geoservices.irisnet.be/geocoding/swagger-ui/index.html` | — | Podle zpravodajství měl být od poloviny listopadu 2026 pokrývat všechny belgické adresy. Adresa URL na `datastore.brussels` nebyla nalezena. |
| Valonsko | neověřeno | — | — | — | Nehledáno. |

## 6. Podzemní sítě

| Služba | Stav | Poznámky |
|---|---|---|
| Brusel, UrbIS Transport networks | neověřeno | Podle katalogu zahrnuje silniční a tramvajovou a vlakovou síť. Nejde o podzemní inženýrské sítě. |
| Flandry, Gent, Antverpy, Valonsko | neověřeno | Nehledáno. |

---

## Shrnutí

- **Ověřené a použitelné ve webu s CORS:** GRB WFS (vozovka WBN, budovy GBG, polygony, EPSG:4326 přes `srsName`), Flandry Geolocation v4 (adresy včetně Bruselu), Valonsko PICC_VDIFF (Voirie - Surface, dotaz na plochu), Valonsko ORTHO_LAST (export PNG, ne XYZ).
- **Nepoužitelné:** NGI topo pro ulice (404 a prázdné dlaždice), starý OMWRGB Flandry (302), UrbIS localization (404), parking.brussels WFS (302 bez CORS).
- **Nejdůležitější otevřené body:** nastavit styl u OMWRGBMRVL (`Style 'default' is invalid`), najít plochy chodníků v GRB (WGO, jiné `TYPE`), najít vrstvu plošných povrchů v UrbIS (nebo nový host `geoservices-vector.irisnet.be`), ověřit licence všech služeb.
