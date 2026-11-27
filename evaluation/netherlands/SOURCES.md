# Nizozemské otevřené datové služby pro Profily ulic (průzkum 20. 11. 2026)

Test: Origin `https://streetspace.eu`, User-Agent `profily-ulic`, asi 38 dotazů, pauzy 1 s. Bbox ~100 m u Weesperstraat (WGS84 4.9050,52.3606,4.9080,52.3624; RD 122200,486290,122300,486360), 300 m pro počty. Utrecht centrum: WGS84 5.1199,52.0898,5.1229,52.0916.
Sloupec „CORS“ = hlavička z odpovědi. Netestované položky jsou označené „neověřeno“.

## 1. BGT (PDOK)

| Položka | Hodnota |
|---|---|
| Šablona | `https://api.pdok.nl/kadaster/bgt/ogc/v1/collections/{collection}/items?bbox={minLon},{minLat},{maxLon},{maxLat}&limit=1000&f=json` (bbox ve WGS84, lon,lat) |
| Funguje | ano, HTTP 200 (wegdeel, begroeidterreindeel, paal, wegdeel_kruinlijn) |
| CORS | `Access-Control-Allow-Origin: *` |
| Licence | CC0 1.0 (odkaz v JSON kolekce: `creativecommons.org/publicdomain/zero/1.0/deed.nl`) |
| Stránkování | odpověď nemá `numberMatched`; další stránka je v `links` s `rel=next` (`&cursor=…`) |
| Názvy vlastností | snake_case: `functie`, `fysiek_voorkomen`, `plus_functie`, `plus_fysiek_voorkomen`, `plus_status`, `kruinlijn_leeg`, `op_talud`, `relatieve_hoogteligging`, `status`. Pozor: ne `fysiekVoorkomen`. |
| Geometrie | `Polygon` (wegdeel, begroeidterreindeel), `Point` (paal) |
| Kolekce | 51 kolekcí, mj. `wegdeel`, `wegdeel_kruinlijn`, `begroeidterreindeel`, `begroeidterreindeel_kruinlijn`, `onbegroeidterreindeel`, `onbegroeidterreindeel_kruinlijn`, `ondersteunendwegdeel`, `ondersteunendwegdeel_kruinlijn`, `waterdeel`, `pand`, `paal`, `vegetatieobject_punt/_vlak/_lijn`, `scheiding_lijn`, `overbruggingsdeel`, `straatmeubilair`, `weginrichtingselement_*` |

**Kruinlijn:** kolekce `wegdeel_kruinlijn` existuje (i pro ondersteunendwegdeel a begroeidterreindeel). V bboxu 100 m u Weesperstraat vrátila 0 prvků, takže geometrii jsme neviděli. Atribut `kruinlijn_leeg` u wegdeel je v 826 z 826 prvků `waardeOnbekend`.

**Počty wegdeel, bbox 300 m Amsterdam (826 prvků, všechny stránky):**

- `functie`: voetpad 286, parkeervlak 119, rijbaan lokale weg 119, fietspad 112, rijbaan regionale weg 44, voetpad op trap 40, inrit 32, transitie 31, OV-baan 25, spoorbaan 18 (10 hodnot, součet 826)
- `fysiek_voorkomen`: open verharding 528, gesloten verharding 256, transitie 42
- `plus_functie`: verkeersdrempel 33, zbytek null
- `plus_fysiek_voorkomen`: gebakken klinkers 23, tegels 7, cementbeton 1

**begroeidterreindeel, bbox 300 m Amsterdam (94 prvků):**

- `fysiek_voorkomen`: groenvoorziening 94
- `plus_fysiek_voorkomen`: heesters 39, null 31, bodembedekkers 16, planten 5, gras- en kruidachtigen 3

**Utrecht, wegdeel, bbox ~100 m:** první stránka (300 prvků, další stránka existuje): voetpad 179, rijbaan lokale weg 96, voetpad op trap 21, parkeervlak 4. Počty z 300 m bboxu Utrecht jsme neudělali.

**Paal, bbox 300 m Amsterdam (145 prvků):** `plus_type` = lichtmast 145, `type` = niet-bgt 145.

**Výkon:** wegdeel v 300m bboxu je 10,3 MB (limit 1000). Pro klik to je těžké, doporučuju menší bbox nebo jiné zdroje. begroeidterreindeel 300 m je 324 KB.

**Neověřeno:** `ondersteunendwegdeel` (berm, verkeerseiland), `vegetatieobject_*`, `overbruggingsdeel`, `waterdeel`, `pand` přes BGT.

## 2. BAG a 3D BAG

**BAG pand (PDOK OGC API):**

- Šablona: `https://api.pdok.nl/kadaster/bag/ogc/v2/collections/pand/items?bbox=4.9050,52.3606,4.9080,52.3624&limit=3&f=json`
- Funguje: ano, HTTP 200. CORS `Access-Control-Allow-Origin: *`.
- Licence: Public Domain Mark 1.0 (`creativecommons.org/publicdomain/mark/1.0/deed.nl`, odkaz v kolekcích).
- Vlastnosti: `identificatie`, `bouwjaar` (ne `oorspronkelijkBouwjaar`, ten v odpovědi chybí), `status` (např. „Pand in gebruik“), `gebruiksdoel` (např. `kantoorfunctie`, `onderwijsfunctie,winkelfunctie`, nebo null), `aantal_verblijfsobjecten` (v ukázce null), `verblijfsobject.href`.
- Gebruiksdoel je přímo u pandu, ne jen u verblijfsobjectu.

**3D BAG (3dbag.nl):**

- Šablona: `https://api.3dbag.nl/collections/pand/items?bbox=121200,487200,121300,487300&limit=3` (bbox v RD, EPSG:7415)
- Funguje: ano, s bboxem v RD. Bbox ve WGS84 vrátil 0 prvků. Testovací RD bbox vrátil 3 prvky.
- CORS: `access-control-allow-origin: *`.
- Licence: CC BY 4.0 (`creativecommons.org/licenses/by/4.0/`, odkaz v kolekci).
- Formát: CityJSON-like (`features[].CityObjects`), klíče atributů: `b3_h_dak_max`, `b3_h_dak_50p`, `b3_h_dak_70p`, `b3_h_dak_min`, `b3_h_maaiveld`, `b3_h_nok`, `b3_bouwlagen` (v ukázce null), `b3_dak_type` (např. slanted), `b3_nodata_fractie_ahn3`. Výšky tedy jsou, počet podlaží u prvního vzorku chybí.

## 3. Parkování

**Amsterdam parkeervakken (WFS, funguje):**

- Šablona: `https://api.data.amsterdam.nl/v1/wfs/parkeervakken/v1?service=WFS&version=2.0.0&request=GetFeature&typeName=app:parkeervakken&outputFormat=application/json&srsName=urn:ogc:def:crs:EPSG::28992&bbox=122200,486290,122300,486360,urn:ogc:def:crs:EPSG::28992&count=3`
- Výsledek: HTTP 200, 3 prvky, `Polygon`.
- CORS: `access-control-allow-origin: https://streetspace.eu` (odráží Origin).
- Vlastnosti: `id`, `buurtcode`, `straatnaam`, `type` (např. Vissengraat), `soort` (např. MULDER), `e_type` (např. E6b), `aantal`, `versiedatum`.
- Licence: v katalogu Amsterdam API je `terms_of_use.license` null (není uvedena). Neověřeno.
- JSON endpoint `/v1/parkeervakken/parkeervakken/` existuje, ale nepřijímá `bbox` ani `geofilter_bbox`. Pro bbox použít WFS.

**Amsterdam parkeerzones:** dataset v katalogu (`wfs/parkeerzones/v1`), licence null. Neotestováno dotazem.

**RDW Open Data (parkeren):** `opendata.rdw.nl` a `data.rdw.nl` ze sandboxu nerozlišují DNS (`Could not resolve host`). Neověřeno.

**Utrecht, Rotterdam, Den Haag:** neověřeno.

## 4. Podzemní sítě

**Amsterdam leidingeninfrastructuur (WFS, funguje):**

- Šablona: `https://api.data.amsterdam.nl/v1/wfs/leidingeninfrastructuur/v1?service=WFS&version=2.0.0&request=GetFeature&typeName=app:waternet_rioolleidingen&outputFormat=application/json&srsName=urn:ogc:def:crs:EPSG::28992&bbox=122200,486290,122300,486360,urn:ogc:def:crs:EPSG::28992&count=3`
- Výsledek: HTTP 200, 3 prvky, `LineString`. CORS `access-control-allow-origin: https://streetspace.eu`.
- Vlastnosti (rioolleiding): `objectnummer`, `status`, `jaar_gelegd`, `soort`, `type_leiding` (Gemengd riool), `vorm` (Rond), `diameter` (400), `breedte`, `hoogte`, `materiaal` (Beton), `bob_beginpunt` a `bob_eindpunt` (výška spodku v m, `-0.82`, jde o BOB, hloubka je od povrchu), `stelsel_type`.
- Další vrstvy v WFS: `waternet_rioolknopen`, `amsterdam_ovl_ondergrondse_kabels`, `amsterdam_ovl_bovengrondse_kabels`, `amsterdam_ovl_mantelbuizen`, `amsterdam_ovl_punten`, `amsterdam_ovl_lichtpunten`.
- Licence (katalog): „Creative Commons, Naamsvermelding“ (CC BY), přesná verze neověřena.

**KLIC (`app:klic_kabels_en_leidingen`):** HTTP 403. Nepřístupné.

**Liander, Stedin, Enexis, Rotterdam riolering:** neověřeno (žádný dotaz).

## 5. Ortofoto (PDOK Luchtfoto)

- Capabilities: `https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0?request=GetCapabilities&service=WMTS` (200, CORS `*`)
- Vrstvy: `Actueel_orthoHR` (8 cm, „Landsdekkende dataset in 8cm resolutie“), `Actueel_ortho25` (25 cm), plus ročníky `2026_orthoHR`, `2026_quickortho25` atd.
- Matice EPSG:3857 (`TileMatrixSet` z capabilities): ID `00` až `21`. Maximální zoom z capabilities je 21, z11 jsme ověřili jen z19.
- **Šablona (z ResourceURL v capabilities):** `https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_orthoHR/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.jpeg`
- **Pořadí pro Leaflet/OpenLayers je z/x/y** (TileMatrix=z, TileCol=x, TileRow=y). Ověřený příklad:
  `https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_orthoHR/EPSG:3857/19/269289/172321.jpeg` → HTTP 200, `image/jpeg`, 21 KB, CORS `Access-Control-Allow-Origin: *`.
- Licence: capabilities uvádí `AccessConstraints: none`. Konkrétní licence (CC0 nebo jiná) na pdok.nl neověřena.

## 6. Locatieserver (PDOK)

- Free: `https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q=Weesperstraat%20Amsterdam&rows=2` → HTTP 200, CORS `*`.
- Suggest: `https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest?q=Weesperstraat%20Amsterdam&rows=2` → HTTP 200, CORS `*`.
- Pole: `id`, `weergavenaam`, `type` (weg, postcode, …), `centroide_ll` (např. `POINT(4.90634653 52.36382504)`), `centroide_rd` (`POINT(122247.027 486323.829)`), `straatnaam`, `nwb_id`, `openbareruimte_id`, `gemeentenaam`, `woonplaatsnaam`, `provincienaam`, `score`.
- Licence: data z BAG (Public Domain Mark 1.0) a BGT (CC0). Stránka služby sama není ověřena.

## 7. Hranice

- Landsgrens: `https://api.pdok.nl/kadaster/bestuurlijke-gebieden/ogc/v1/collections/landsgrens/items?f=json` → **HTTP 404**. Cesta je chybná nebo se jmenuje jinak, správnou jsme nenašli. Neověřeno.
- Hranice obcí a CBS: neověřeno.

## 8. Stromy a osvětlení

- Amsterdam bomen (JSON): `/v1/bomen/bomen/` → 404 (tabulka jinak). WFS `https://api.data.amsterdam.nl/v1/wfs/bomen/v2?…typeName=app:bomen…` → timeout (40 s), neověřeno. Licence v katalogu „openbaar, tenzij anders aangegeven“.
- BGT paal (lichtmast): viz bod 1, 145 prvků, `plus_type=lichtmast`, Point, CC0.
- BGT vegetatieobject: neověřeno.

## Shrnutí pro aplikaci

- Nejsnadněji použitelné: BGT OGC (CORS `*`, CC0), BAG pand (CORS `*`, Public Domain Mark), PDOK WMTS a Locatieserver (CORS `*`), Amsterdam WFS (CORS odráží Origin, licence CC BY u sítí).
- Výšky a podlaží: 3D BAG s bboxem v RD.
- Pozor na velikost BGT wegdeel (10 MB na 300 m).
- Blokováno nebo neověřeno: KLIC (403), RDW (DNS), landsgrens (404), Amsterdam bomen (WFS timeout), parkeerzones a Utrecht/Rotterdam/Den Haag, Liander/Stedin/Enexis.
