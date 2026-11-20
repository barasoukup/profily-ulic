# Lucembursko: průzkum otevřených služeb pro profily ulic

Ověřeno 20. 11. 2026. Požadavků: 46 (limit ~50), pauza 1 s, User-Agent `profily-ulic`, hlavička `Origin: https://streetspace.eu`. Overpass ani Nominatim se nepoužily.
Testovací bboxy: Lucemburk centrum `6.129,49.610,6.132,49.612`; Esch-sur-Alzette `5.980,49.495,5.983,49.497`.
Neověřeno = nezkoušeno nebo nedohledáno. Licence jsou z katalogu data.public.lu, pokud není uvedeno jinak.

## 0. Shrnutí

| Vrstva | Stav pro web (CORS `*` nebo echo streetspace.eu) |
|---|---|
| Ortofoto (WMTS, z0–z21) | ANO, funguje, cc-zero u starších edic |
| Silniční osy, budovy (obrys), parcely, adresy (INSPIRE WFS) | ANO, geometrie v WGS84, bez výšek, tříd a využití |
| Hledání adres (fulltextsearch) | ANO |
| Plochy povrchů (chodník, cyklopruh, stání) | NE jako služba, jen ZIP BD-L-TC 282 MB |
| Výšky budov | NE jako služba, jen ZIP ACT 3D (offline) |
| Parkování (VdL ArcGIS) | Body, bez CORS; zablokováno pro prohlížeč |
| Podzemní sítě | Nenalezeno použitelné |

## 1. Povrchy (vozovka, chodník, cyklopruh, stání, zeleň)

| Služba | URL / šablona | Funguje? | CORS | Třídy / atributy | Licence | Poznámka |
|---|---|---|---|---|---|---|
| INSPIRE WFS, silniční osy `tn:TN.RoadTransportNetwork.RoadLink` | `https://wms.inspire.geoportail.lu/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&outputFormat=application/json&srsName=urn:ogc:def:crs:EPSG::4326&typeNames=tn:TN.RoadTransportNetwork.RoadLink&bbox=49.610,6.129,49.612,6.132,urn:ogc:def:crs:EPSG::4326` | ANO: Lucemburk 44 linií, Esch 42 linií (LineString) | ANO `*` | Žádná třída komunikace. Jen `gml_description` (název ulice) a `fictitious`. | neověřeno | Jen osy, ne plochy. Pořadí bboxu v urn EPSG:4326 je lat,lon; výstup GeoJSON je lon,lat. Výchozí CRS je EPSG:3035. |
| INSPIRE WFS `tn:TN.RoadTransportNetwork.RoadServiceArea` | stejná šablona, typeNames změněno | ANO, 0 prvků (Lucemburk) | ANO `*` | neověřeno | neověřeno | Prázdné v testu. |
| INSPIRE WFS, plošné vrstvy BD-L-TC (povrchy) | — | NE | — | — | — | GetCapabilities (782 typů) obsahuje jen `hy:*-BDLTC` (vodní plochy), žádné chodníky, vozovky ani cyklopruhy. |
| BD-L-TC 2015 (ACT), soubor | `https://download.data.public.lu/resources/bd-l-tc-2015/20180913-103154/BDLTC_SHP.zip` | Soubor 282 MB, obsah neověřen | neověřeno | Atributy neověřeny. Specifikace BD-L-TC 2013 (PDF, `Specifications-BD-L-TC-2013-V1.pdf`). | cc-zero | Není webová služba. Vhodné jen k předzpracování offline. Katalog: BD-L-TC 2015, 2008, 2000, „Surface d'eau“. |
| WFS `lc:LC.LISL-LandCover2024` (zeleň) | `...&typeNames=lc:LC.LISL-LandCover2024&bbox=49.610,6.129,49.612,6.132,urn:ogc:def:crs:EPSG::4326` | ANO, polygony; 1 prvek = 14,6 MB | ANO `*` | `landcoverobservation_class_xlink_href` (INSPIRE LandCoverClassValue; v testu kód 20, ostatní třídy neověřeny) | neověřeno | Odpověď je velmi těžká: vždy count=1 až 3 a malé bbox. |
| Ville de Luxembourg, trottoiry a voirie | data.public.lu hledání `trottoir`, `trottoirs` | 0 výsledků | — | — | — | `voirie` vrátilo jen Points de repère de la voirie étatique (APC, cc-zero). Neověřeno. |
| ws.geoportail.lu | `https://ws.geoportail.lu/` | Běží MapServer 7.4.2, odpověď HTML „No query information“ | ANO `*` | — | — | Službu ani vrstvy se nepodařilo najít (GetCapabilities bez parametrů nefunguje). |

## 2. Ortofoto (WMTS, Web Mercator)

| Služba | URL / šablona | Funguje? | CORS | Třídy / atributy | Licence | Poznámka |
|---|---|---|---|---|---|---|
| WMTS `ortho_latest`, **šablona** | `https://wmts1.geoportail.lu/opendata/wmts/ortho_latest/GLOBAL_WEBMERCATOR_4_V3/{z}/{x}/{y}.jpeg` | ANO. Ověřeno: z18 x=135535 y=89343 (26 KB JPEG), z20 x=542142 y=357374 (14 KB), z21 x=1084285 y=714749 (9 KB), Esch z20 (13,8 KB) | ANO `Access-Control-Allow-Origin: *` | — | ortho 2001–2016: cc-zero (data.public.lu); `ortho_latest` neověřeno | **Max zoom 21** (TileMatrixSet V3 má úrovně 00–21). Vizuální kontrola obsahu a rozlišení neověřeny. |
| Špatné pořadí `{z}/{y}/{x}` | `.../GLOBAL_WEBMERCATOR_4_V3/18/89343/135535.jpeg` | NE: vrací 854 B PNG (pravděpodobně prázdná dlaždice) | ANO | — | — | Používat `{z}/{x}/{y}`. Šablona v capabilities je `{TileMatrix}/{TileCol}/{TileRow}`, tedy z/x/y. |
| WMTS GetCapabilities | `https://wmts1.geoportail.lu/opendata/wmts/1.0.0/WMTSCapabilities.xml` | ANO, 69 KB XML | ANO `*` | Vrstvy: `ortho_1967`, `ortho_2001` až `ortho_2023`, `ortho_2025_winter`, `ortho_2025`, `ortho_irc`, `ortho_latest`, `ortho_2019_luref`, `ortho_2019_winter`, `topo_20k`, `topo_50k`, `topomap`, `toponymes` a další | — | Pozor: šablona v capabilities má dvojité lomítko v hostu (`//opendata`). V vlastní URL použít jednoduché. |
| Datasety ortofoto na data.public.lu | `https://data.public.lu/api/1/datasets/?q=orthophoto` | ANO, 25 výsledků | ANO (echo `https://streetspace.eu`) | — | Ortofoto officielle 2001, 2004, 2007, 2010, 2013, 2016: cc-zero (ACT) | Edice 2025 a `ortho_latest` jsou jen ve WMTS, licence neověřena. |

## 3. Budovy, výšky, parcely

| Služba | URL / šablona | Funguje? | CORS | Třídy / atributy | Licence | Poznámka |
|---|---|---|---|---|---|---|
| INSPIRE WFS `bu:BU.Building` | `...&typeNames=bu:BU.Building&bbox=49.610,6.129,49.612,6.132,urn:ogc:def:crs:EPSG::4326` | ANO: Lucemburk 153 budov, Esch 185 budov (MultiPolygon, WGS84) | ANO `*` | **Žádná výška, využití ani rok.** Jen `gml_identifier`, `inspireid_*`, `gml_description` = „National database of buildings (2023)“ | neověřeno | Jen obrysy, aktualizace 2023. |
| ACT, Base de données nationale des bâtiments 3D 2023 | `https://data.public.lu/api/1/datasets/?q=Base%20de%20donn%C3%A9es%20nationale%20des%20b%C3%A2timents%203D%202023` | Katalog ANO: 105 resource (ZIP ESRI GDB multipatch, GPKG empreintes 2D, GeoJSON empreintes, ZIP po obcích, např. Beaufort, Bech, Beckerich) | neověřeno (soubory, ne API) | Výšky a atributy neověřeny (soubory neotevřeny) | cc-zero | Není služba. Vhodné offline. Hlavní zdroj výšek pro ČR-srovnání. |
| ACT Bâtiments 3D 2017 (LOD 2.3) a 2013 (LOD 1) | data.public.lu | Katalog, neotevřeno | neověřeno | neověřeny | cc-zero | Starší edice. |
| INSPIRE WFS `cp:CP.CadastralParcel` | `...&typeNames=cp:CP.CadastralParcel&bbox=...` | ANO: 3 parcely (Polygon, WGS84), např. ID `PARCELLES.075F00140000821` | ANO `*` | Atributy neověřeny | neověřeno | Parcely jsou obrysy vlastnictví, ne plochy ulice. |
| LiDAR výšky povrchu | — | neověřeno | — | — | — | Nedohledáno. |

## 4. Parkování

| Služba | URL / šablona | Funguje? | CORS | Třídy / atributy | Licence | Poznámka |
|---|---|---|---|---|---|---|
| Ville de Luxembourg, ArcGIS FeatureServer, vrstva 6 „Parkings en surface“ | `https://maps.vdl.lu/arcgis/rest/services/OPENDATA/GEOJSON/FeatureServer/6/query?where=1%3D1&outFields=*&outSR=4326&f=geojson` | ANO: 3 prvky (Point), atributy `OBJECTID`, `NAME` | **NE.** Odpověď má `Vary: Origin` a `Timing-Allow-Origin`, ale **bez `Access-Control-Allow-Origin`**. Prohlížeč ze streetspace.eu ji nepřečte. | — | cc-zero (dataset „Mobilité - Circulation et parkings“, Ville de Luxembourg) | Jen body parkovišť. Ne plochy ani podélná stání v ulici. Ostatní vrstvy: 3 Park+Bike, 4 Park+Ride, 5 Parkings couverts, 7 Parkings mobilité réduite, 8 Vel'oH (body). |
| Ville de Luxembourg, opendata.vdl.lu | `https://opendata.vdl.lu/` | NE: odpověď F5 „Request Rejected“ | — | — | — | Blokováno WAF. |
| data.vdl.lu | `https://data.vdl.lu/` | NE: DNS nefunguje | — | — | — | — |
| Ville de Luxembourg, Emplacements de parking libres | data.public.lu, slug `mobilite-emplacements-de-parking-libres` | Katalog: 1 resource | neověřeno | neověřeno | cc-by | Neotestováno. |
| Esch, stationnement mobilité réduite | data.public.lu, `ville-desch-sur-alzette-stationnement-mobilite-reduite` | Katalog: 1 resource | neověřeno | neověřeno | cc-zero | Neotestováno. |
| Zóny placeného stání a rezidenční zóny | — | neověřeno | — | — | — | Nehledáno. |

## 5. Hledání adres (CORS)

| Služba | URL / šablona | Funguje? | CORS | Třídy / atributy | Licence | Poznámka |
|---|---|---|---|---|---|---|
| Géoportail fulltextsearch | `https://apiv3.geoportail.lu/fulltextsearch?query=avenue%20de%20la%20gare` | ANO, `application/geo+json`, 30 výsledků (Avenue de la Gare: Wiltz, Lamadelaine, Diekirch, Luxembourg…) | ANO `*` | `properties`: `label` (např. „Avenue de la Gare (Wiltz)“), `layer_name` (`Adresse` nebo `nom_de_rue`). Geometrie: Polygon (ulice) a bbox. | neověřeno | Esch dotaz `rue de l'Alzette Esch-sur-Alzette`: 30 výsledků, 29× `Adresse` (např. `8, Rue de l'Alzette, L-4010 Esch-sur-Alzette`), 1× `nom_de_rue`. Geometrie adres (bod) neověřena, dotaz s číslem domu nezkoušen. |
| INSPIRE WFS `ad:AD_Address` | `...&typeNames=ad:AD_Address&bbox=...` | ANO: 3 body (Lucemburk) | ANO `*` | Atributy neověřeny (ID typu `075F00144000000_66_67`) | neověřeno | Alternativa k fulltextsearch. |

## 6. Podzemní sítě

| Služba | URL / šablona | Funguje? | CORS | Třídy / atributy | Licence | Poznámka |
|---|---|---|---|---|---|---|
| INSPIRE WFS `us:US.ElectricityNetwork_UtilityLink` | `...&typeNames=us:US.ElectricityNetwork_UtilityLink&bbox=49.610,6.129,49.612,6.132,urn:ogc:def:crs:EPSG::4326&count=3` | ANO, ale **0 prvků** v bboxu centra | ANO `*` | neověřeno | neověřeno | Vrstvy existují v GetCapabilities. Pro ostatní (vodovod, kanalizace, plyn, `WaterNetwork_Tower`, `SewerNetwork_…`, `ElectricityNetwork_Pole`) jen názvy, geometrie neověřeny. |
| data.public.lu, INSPIRE Annex III | `…UtilityLink`, `WaterNetwork Tower` (katalog) | Katalog | neověřeno | neověřeno | cc-zero | Neotevřeno. |

## 7. Nedostupné nebo neprovedené

- opendata.vdl.lu: WAF odmítá (viz část 4). data.vdl.lu: nefunguje DNS.
- data.geoportail.lu: jen výchozí stránka nginx (ověřeno HTTP 200, bez dat).
- Nezkoušeno: Esch vlastní data (trottoiry, parkování), zóny, LiDAR, ws.geoportail.lu služby.

## 8. Doporučení

1. Pro profil z webu: ortofoto WMTS (`{z}/{x}/{y}`, max z21, CORS ano) a INSPIRE WFS pro obrysy budov a osy silnic, navíc adresy přes fulltextsearch.
2. Plochy povrchů a výšky budov nejsou webově dostupné. BD-L-TC 2015 (282 MB ZIP) a ACT 3D 2023 (GPKG/GDB, cc-zero) by se musely předzpracovat offline, jako u jiných států. Obsah ani atributy zatím neověřeny.
3. Parkování z VdL je bodová vrstva bez CORS. Pro prohlížeč by byl nutný proxy nebo offline zpracování.
4. Před použitím ověřit licenci ortofoto `ortho_latest` a INSPIRE WFS (není na data.public.lu).
