# Polsko: otevřené služby pro profily ulic (ověřeno 21. 11. 2026)

Metoda: curl, User-Agent `profily-ulic`, Origin `https://streetspace.eu`, pauza 1 s, asi 58 požadavků. Overpass ani Nominatim nepoužity. Bbox 100 m: Varšava centrum, Kraków, Wrocław, Gdańsk, Poznań podle zadání. Co nebylo dotazováno, je označeno „neověřeno“.

Legenda: **ano** = HTTP 200 a data vrácena; **ne** = chyba; **neověřeno** = nedotazováno nebo nedostupné z tohoto místa.

## 1. Plochy a linie povrchů (vozovka, chodník, cyklistická cesta, parkování, zeleň, obruby)

| Služba | URL šablona / základ | Funguje? | CORS (Origin streetspace.eu) | Třídy / pole | Licence | Poznámky |
|---|---|---|---|---|---|---|
| **Kraków, Mapy_bazowe/basemap_MJO** (ArcGIS REST, MapServer, ArcGIS 10.81) | `https://msip.um.krakow.pl/arcgis/rest/services/Mapy_bazowe/basemap_MJO/MapServer/{id}/query?where=1%3D1&geometry={lon1},{lat1},{lon2},{lat2}&geometryType=esriGeometryEnvelope&inSR=4326&outSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=true&f=json` | **ano** (GET, JSON, prsteny v WGS84) | **ano**, hlavička `Access-Control-Allow-Origin: https://streetspace.eu` (odráží Origin) | Vrstvy: **5 Jezdnie** (polygon), **6 Chodniki** (polygon), **7 Krawężniki, ulice** (linie), **8 Ścieżki** (polygon), 4 Ważniejsze drogi (linie), 1 Nazwy placów (polygon), 9 Dzielnice. Pole třídy **`kod_nz`**: Jezdnie = `Jezdnia (KTJZ01)` (6) a `Plac (KTPL01)` (15, v jezdniční vrstvě!); Chodniki = `Chodnik (KTCR02)` (28); Krawężniki = `Krawężnik (KTKR01)` (10). Další pole: `kod`, `zrd_nz` (zdroj: „pomiar na osnowę“, „digitalizacja i wektoryzacja“), `je_nazwa` (dzielnica), `aktualnosc`, `typ_nz`/`typ_kd` (prázdné v testu). | neověřeno (metadata nestažena) | Počet na bbox asi 2,1 × 2,2 km: `Jezdnia (KTJZ01)` = **1 705** (`returnCountOnly`). `outStatistics` vrací 400, skupinové počty nejdou. Vrstva Jezdnie má minScale 24 999 a Krawężniki 5 000 (měřítková omezení, dotaz nebyl blokován, ověřit při plném zoomu). Vrstvy jsou dynamické (bez tile cache, `tileInfo` chybí). EPSG 2178 (nativní), výstup v 4326 přes `outSR`. Axis order: x = lon, y = lat. |
| Kraków, ArcGIS root | `https://msip.um.krakow.pl/arcgis/rest/services?f=json` | ano (JSON, složky GD, PI, Mapy_bazowe, GK, ZIS, …) | ano | Složka GD: `GD/Dzialki_GMK_i_wladanie`, `GD/Dzialki_i_MPZP`, `GD/GD_DZIALKI_GMK`, `GD/GD_Kompleksy_dzialek…` | neověřeno | Adresa `msip.krakow.pl` vrací 404, správná je `msip.um.krakow.pl`. |
| Varšava, mapa.um.warszawa.pl (mapová aplikace) | `https://mapa.um.warszawa.pl/` (Angular + Oracle MapViewer, testmapa.um.warszawa.pl/mapviewer) | HTML ano, data neověřena | HTML má `*`, MapViewer nedostupný (`connection reset`) | Vrstvy z interního katalogu aplikace, v bundle není veřejná WMS/WFS adresa | neověřeno | Nelze použít bez reverse engineeringu; neověřeno. |
| Varšava, wms2.um.warszawa.pl/geoserver (WMS) | `https://wms2.um.warszawa.pl/geoserver/WMS/wms?service=WMS&request=GetCapabilities` | **ne** (timeout 25 s a 40 s, dvakrát) | neověřeno | neověřeno | neověřeno | Sem přesměruje KIEG GetMap pro Varšavu (vrstva `budynki`), takže město má vlastní geoserver. Zkusit znovu z jiné sítě. |
| Varšava, wms.um.warszawa.pl / api.um.warszawa.pl | — | **ne** (timeout) | — | — | neověřeno | Mapa zasadnicza WMS i API (klíč) neověřeny. |
| Varšava, gis.um.warszawa.pl (ArcGIS) | — | **ne** (DNS) | — | — | — | Host neexistuje z tohoto místa. |
| Wrocław, gis.um.wroc.pl (ArcGIS) | `https://gis.um.wroc.pl/arcgis/rest/services?f=json` | **ne** (`499 Token Required`) | ano (hlavička), ale vyžaduje token | — | — | Bez přihlášení nelze. Odkazy na `gis.um.wroc.pl/imap/` a `/www/*_app/` neověřeny. |
| Wrocław, geoportal.wroclaw.pl/wms | `https://geoportal.wroclaw.pl/wms?...` | **ne** (404) | — | — | — | Domovská stránka 200, odkazy jen na aplikace. |
| Gdańsk (gis.gdansk.pl, ods.gdansk.pl, mapa.gdansk.pl) | — | **ne** (DNS) | — | — | — | Hosty z tohoto místa neexistují; neověřeno. |
| Poznań, sip.poznan.pl | `https://sip.poznan.pl/...` | **ne** (302 na `sip.geopoz.pl/sip/sip/info404`, 302 bez obsahu) | — | — | — | Služba přesunuta, neověřeno. |
| **GUGiK KIUT** (sítě, viz sekce 6) | — | — | — | — | — | Plochy povrchu KIUT nemá. |
| **GUGiK ULDK / KIEG** (pozemky, viz sekce 2 a 3) | — | — | — | — | — | Pozemky, ne povrch komunikace. |
| BDOT10k (plochy jezdni, chodníků, ... v GUGiK) | `https://mapy.geoportal.gov.pl/wss/service/PZGIK/BDOT10k/WMS/StandardResolution?service=WMS&request=GetCapabilities` | **ne** (`401 Unauthorized`) | — | — | — | Neveřejná (vyžaduje autorizaci). KrajowaIntegracjaMapaZasadnicza (WMS i WFS) dává 404 na obě varianty názvu. |

## 2. Katastr / pozemky (ULDK, KIEG)

| Služba | URL šablona | Funguje? | CORS | Pole | Licence | Poznámky |
|---|---|---|---|---|---|---|
| **ULDK, parcela podle bodu** | `https://uldk.gugik.gov.pl/?request=GetParcelByXY&xy={lon},{lat},4326&result=geom_wkt,teryt,parcel` | **ano** (test 21.0115, 52.231 → `SRID=2180;POLYGON(...)|146510`) | **ano** `*` | `geom_wkt` (EPSG:2180, výchozí), `teryt`, `parcel` | neověřeno | Vstup lon,lat (WGS84). Výstup v 2180, transformovat proj4js. |
| **KIEG WMS, dotaz na objekt** (budynki / działki) | `https://integracja.gugik.gov.pl/cgi-bin/KrajowaIntegracjaEwidencjiGruntow?service=WMS&request=GetFeatureInfo&version=1.3.0&layers=budynki&query_layers=budynki&info_format=text/xml&crs=EPSG:2180&bbox={N1},{E1},{N2},{E2}&width=256&height=256&i=128&j=128` | **ano** (GML) | **ano** `*` | Vrací atributy DZIAŁKI: `Identyfikator działki`, `Województwo`, `Powiat`, `Nazwa gminy`, `Nazwa obrębu`, `Numer działki`, `Oznaczenie użytku`, `Data publikacji danych`, … | neověřeno (GUGiK, zřejmě otevřená data) | **Atributy budynku (kondygnace, rok, funkce) v odpovědi nebyly.** Pro `budynki` vrátila služba údaje o parcele, ne o budově. Neověřeno, zda vrstva `budynki` má vůbec atributy budovy. |
| KIEG WMS, GetCapabilities | `...KrajowaIntegracjaEwidencjiGruntow?service=WMS&request=GetCapabilities` | **ano** (200, 32 KB) | ano | Vrstvy: powiaty, obreby, dzialki, numery_dzialek, **budynki**, kontury, uzytki | — | Formáty image/png, image/jpeg; CRS 2176–2180, 3857, 4326. Služba je WMS (ne WFS) i přes název souboru. |
| KIEG GetMap (budynki, Varšava) | `...KrajowaIntegracjaEwidencjiGruntow?service=WMS&request=GetMap&...` | **302** na `wms2.um.warszawa.pl/geoserver/WMS/wms?LAYERS=budynki&...` (dál timeout) | — | — | — | Pro Varšavu přesměruje na městský geoserver. Neověřeno, zda výsledek je obraz. |

## 3. Ortofoto (Web Mercator, CORS)

| Služba | URL šablona | Funguje? | CORS | Maximální zoom | Licence | Poznámky |
|---|---|---|---|---|---|---|
| **GUGiK ORTOFOTOMAPA, WMTS StandardResolution (EPSG:3857)** | `https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMTS/StandardResolution?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTOFOTOMAPA&STYLE=default&FORMAT=image/jpeg&TILEMATRIXSET=EPSG:3857&TILEMATRIX=EPSG:3857:{z}&TILEROW={y}&TILECOL={x}` | **ano** (test z18, Varšava, x=146372 y=86316: 7,8 KB JPEG 256×256) | **ano** `*` | **19** (matice EPSG:3857:0 až 19 v GetCapabilities) | „brak ograniczeń“ (AccessConstraints v GetCapabilities) | Kompatibilní s XYZ: {y} = TILEROW, {x} = TILECOL. Rozlišení snímku neověřeno. Matice EPSG:2180 a 4326 mají také TILEMATRIX. |
| GUGiK ORTOFOTOMAPA, WMTS HighResolution | `https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMTS/HighResolution?service=WMTS&request=GetCapabilities` | caps ano (200, 34 KB), CORS `*` | ano | **neověřeno** (v caps jen EPSG:2180 a 4326, zoom 14–16 pro 4326; **EPSG:3857 chybí**) | — | Není vhodné pro Web Mercator; použít StandardResolution. |
| GUGiK ORTO WMS | — | neověřeno | — | — | — | Nepotřeba, WMTS stačí. |
| Varšava / Kraków městské ortofoto | — | neověřeno | — | — | — | Nedotazováno. |

## 4. Budovy (podlaží, funkce, rok)

| Služba | Funguje? | Poznámky |
|---|---|---|
| KIEG vrstva `budynki` (WMS) | ano (GetFeatureInfo vrací parcelu, ne budovu) | Atributy budovy neověřeny (viz sekce 2). |
| BDOT10k (budynky s počtem kondygnací) | **ne** (401) | Neveřejné. |
| 3D GUGiK LOD1/LOD2 WFS | neověřeno | Nedotazováno. |
| Varšava, mapa.um.warszawa.pl (budynek/widok) | neověřeno | Interní webová aplikace, bez veřejné služby v kódu. |

## 5. Parkování (placené zóny, SPPN Varšava)

| Služba | Funguje? | Poznámky |
|---|---|---|
| Varšava SPPN, zdm / ZDM open data | neověřeno | Nedotazováno (rozpočet). |
| Kraków, parkovací úseky | neověřeno | V basemapě není. |
| Wrocław, Gdańsk, Poznań | neověřeno | Hostitelé neodpovídají nebo vyžadují token. |

## 6. Podzemní sítě (KIUT, GESUT)

| Služba | URL | Funguje? | CORS | Vrstvy | Poznámky |
|---|---|---|---|---|---|
| **KIUT WMS, GetCapabilities** | `https://integracja.gugik.gov.pl/cgi-bin/KrajowaIntegracjaUzbrojeniaTerenu?service=WMS&request=GetCapabilities` | **ano** (200, 21 KB) | ano `*` | `gesut`, `kgesut`, `kgesut_dane`, `przewod_wodociagowy`, `przewod_kanalizacyjny`, `przewod_gazowy`, `przewod_elektroenergetyczny`, `przewod_cieplowniczy`, `przewod_telekomunikacyjny`, `przewod_specjalny`, `przewod_niezidentyfikowany`, `przewod_urzadzenia` | Obraz (GetMap) a atributy přes GetFeatureInfo (XML ROWSET, např. `siec_wodociagowa`). Test na `przewod_wodociagowy` v centru Varšavy vrátil prázdný ROWSET (v bboxu 100 m nebyl prvek). Geometrie linek jen jako obraz, není GeoJSON; WFS neověřeno. |

## 7. Adresy a hledání (CORS)

| Služba | URL | Funguje? | CORS | Výstup | Poznámky |
|---|---|---|---|---|---|
| **UUG (GUGiK), GetAddress** | `https://services.gugik.gov.pl/uug/?request=GetAddress&address=Warszawa,%20Marsza%C5%82kowska%201&result=teryt,voivodeship,municipality,street,locator,geometry&format=json` | **ano** (200, JSON) | ano `*` | `geometry_wkt` = `POINT(638027.42 485064.76)` (EPSG:2180), `x`, `y` (2180), `teryt`, `street`, `number`, `accuracy` | **Bez města („Marszałkowska 1“) vrátil 0 výsledků.** Formát „Město, ulice číslo“ funguje. |
| PRG (GUGiK geocoder) | — | neověřeno | — | — | — |
| ULDK (viz sekce 2) | ano | ano | — | — | — |

## 8. Shrnutí pro aplikaci (verifikované, s CORS)

1. **Povrch**: Kraków `basemap_MJO` (Jezdnie, Chodniki, Krawężniki, Ścieżki). Jediné ověřené město s plochami a obrubou v JSON s třídami. Ostatní města nejsou ověřena.
2. **Ortofoto**: `ORTOFOTOMAPA` WMTS StandardResolution, EPSG:3857, z0–19, JPEG 256 px. Funguje, CORS `*`.
3. **Pozemky**: ULDK (GetParcelByXY) a KIEG WMS GetFeatureInfo.
4. **Sítě**: KIUT WMS (obraz; atributy přes FI).
5. **Adresy**: UUG GetAddress (EPSG:2180, přepočet). Vyžaduje „Město, ulice číslo“.
6. **Nezjištěno**: budovy s kondygnacemi, parkování, Varšava (vlastní geoserver nedostupný), Wrocław (token), Gdańsk a Poznań (nedostupné hosty).

## Neověřeno a proč

- Licence Krakova (basemap_MJO), KIEG, KIUT, UUG a ULDK: nedohledáno z metadat (neověřeno).
- Varšava (wms2.um.warszawa.pl): timeout dvakrát, nemohu potvrdit ani třídy.
- BDOT10k a KrajowaIntegracjaMapaZasadnicza: 401 a 404, nelze použít bez autorizace.
- Gdańsk: hosty z testu neexistují (DNS). Poznań: přesun na sip.geopoz.pl, který odpovídá 302 bez obsahu.
- Budovy s počtem podlaží, 3D LOD, parkování, PRG: nedotazováno.
