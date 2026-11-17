# Zdroje dat pro Německo (17. 11. 2026)

## Ortofoto spolkových zemí (ověřeno a zapojeno)

Ověřeno 17. 11. 2026 jedním GetMap (EPSG:3857, 500 × 500 px, ±25 m) v centru jednoho města každé země, s hlavičkou
`Origin: https://streetspace.eu`. Všech 16 zemí vrátilo snímek a CORS (`*` nebo ozvěnu původu). Licence z polí `Fees` a
`AccessConstraints` v GetCapabilities. Zapojení: `pilot/public/lanes-ortho.js` (`DE_ORTHO`), země podle
`pilot/public/laender.json` (`tools/build_laender.mjs`, GISCO NUTS 1), u hranice se zkusí sousední země, prázdný snímek
(mimo pokrytí) se nepoužije. V mapě podklad „Ortofoto“ bere každou dlaždici z WMS země jejího středu.

| Země | WMS | Vrstva | Odpověď (čas) | CORS | Licence, uvedení |
|---|---|---|---|---|---|
| BW | owsproxy.lgl-bw.de/owsproxy/ows/WMS_LGL-BW_ATKIS_DOP_20_C | IMAGES_DOP_20_RGB | 200 (0,5 s) | * | dl-de/by-2-0, LGL-BW |
| BY | geoservices.bayern.de/od/wms/dop/v1/dop20 | by_dop20c | 200 (0,3 s) | ozvěna | CC BY 4.0, Bayerische Vermessungsverwaltung |
| BE, BB | isk.geobasis-bb.de/mapproxy/dop20c/service/wms | bebb_dop20c | 200 (0,3 s) | * | dl-de/by-2-0, „© GeoBasis-DE/LGB“ |
| HB | geodienste.bremen.de/wms_dop20_2023 | DOP20_2023_HB, DOP20_2023_BHV | 200 (0,3 s) | * | CC BY, Landesamt GeoInformation Bremen |
| HH | geodienste.hamburg.de/wms_dop_zeitreihe_belaubt | dop_zeitreihe_belaubt, `time=2024` | 200 (0,4 s) | * | dl-de/by-2-0, LGV Hamburg (rok 2022 je satelit Pléiades pod uzavřenou licencí, proto výslovně 2024) |
| HE | www.gds-srv.hessen.de/cgi-bin/lika-services/ogc-free-images.ows | he_dop20_rgb | 200 (0,5 s) | * | bez podmínek (HVGG § 24), HVBG |
| MV | www.geodaten-mv.de/dienste/adv_dop | mv_dop | 200 (0,7 s) | * | CC BY 4.0 (přehled WMS DOP LAiV 2024), „© GeoBasis-DE/M-V“ (v obrázku vepsaný) |
| NI | opendata.lgln.niedersachsen.de/doorman/noauth/dop_wms | ni_dop20 | 200 (1,2 s) | * | CC BY 4.0, LGLN |
| NW | www.wms.nrw.de/geobasis/wms_nw_dop | nw_dop_rgb | 200 (0,6 s) | ozvěna | dl-de/zero-2-0 (Datenlizenz podle IT-Planungsrat), 10 cm |
| RP | geo4.service24.rlp.de/wms/rp_dop20.fcgi | rp_dop20 | 200 (0,7 s) | * | dl-de/by-2-0, „©GeoBasis-DE / LVermGeoRP“ |
| SH | dienste.gdi-sh.de/WMS_SH_DOP20col_OpenGBD | sh_dop20_rgb | 200 (0,7 s) | ozvěna | CC BY 4.0, „© GeoBasis-DE/LVermGeo SH/CC BY 4.0“ |
| SL | geoportal.saarland.de/freewms/dop2023 | sl_dop20_rgb | 200 (1,0 s) | * | dl-de/by-2-0 „© GeoBasis DE/LVGL-SL“ (z metadat jiných dat LVGL; u DOP výslovně neověřeno), služba „noLimitations“ |
| SN | geodienste.sachsen.de/wms_geosn_dop-rgb/guest | sn_dop_020 | 200 (0,4 s) | * | dl-de/by-2-0, „GeoSN“ (INSPIRE metadata DOP) |
| ST | www.geodatenportal.sachsen-anhalt.de/wss/service/INSPIRE_LVermGeo_ATKIS_OI/guest | OI_OrthoimageCoverage | 200 (0,6 s) | ozvěna | dl-de/by-2-0, „© GeoBasis-DE / LVermGeo ST“ (Nutzungsbedingungen, Faltblatt Open Data) |
| TH | www.geoproxy.geoportal-th.de/geoproxy/services/DOP | th_dop | 200 (0,4 s) | * | CC BY 4.0, „© GDI-Th“ |

Hesensko, Sársko, Šlesvicko-Holštýnsko a Durynsko průzkum agenta nenašel nebo měl za uzavřené; adresy výše jsou z
vlastního dohledání a GetCapabilities. Licence Saska, Saska-Anhaltska, Meklenburska a Sárska dohledané 17. 11. 2026 po recenzi (Sársko jen z metadat jiných dat LVGL).

## Mapy povrchů ulic měst (Bára 17. 11. 2026: „ortofoto je minimum, ne optimum“)

Ověřeno dotazem v centru, CORS s původem streetspace.eu, licence z GetCapabilities nebo katalogu.

| Město | Služba | Obsah | CORS | Licence | Stav |
|---|---|---|---|---|---|
| Berlín | gdi.berlin.de/services/wfs/strassenbefahrung (WFS 1.1, víc vrstev jedním dotazem, 0,3–0,5 s) | Straßenbefahrung 2014: plochy vozovky, chodníků, cyklostezek, parkování, zeleně, tramvajového tělesa, dělicích pásů, zastávek; obrubníky; body značek (čísla StVO), stožárů, laviček, stojanů, přístřešků | * | dl-de/zero-2-0 | zapojeno (`?berlin=0`), A/B |
| Hamburk | api.hamburg.de/datasets/v1/feinkartierung_strasse (OGC API Features) | jen hlavní a obvodní ulice: plochy s užitím (i Radfahrstreifen, Schutzstreifen, Bussonderstreifen) a materiálem; obrubníky (Hochbord, Tiefbord) | * | dl-de/by-2-0 | zapojeno (`?hamburg=0`), A/B |
| Cáchy | geoserver.aachen.de/opendata/strassendatenbank/wfs, `logo_flaechen` | plochy z měření 2022: vozovka, odvodňovací žlab, chodník, cyklostezka, cyklopruh na vozovce, parkování, zeleň, ostrůvky, zálivy; materiál; podjezdy a nadjezdy | * | dl-de/zero-2-0 | zapojeno (`?aachen=0`), A/B |
| Drážďany | kommisdd.dresden.de WFS NodeId=2003 | Straßenflächen der Basisblockkarte: jedna třída (celý uliční prostor bez dělení) | ozvěna | bez omezení | nezapojeno, nerozlišuje vozovku a chodník |
| Bavorsko | gisportal-stmb.bayern.de BAYSIS_Strassenbestand WFS | šířky vozovek a jízdní pruhy, jen silnice státu, spolkové a okresní | * | CC BY 4.0, Bayerische Straßenbauverwaltung | kandidát na šířky do odhadu (jako ZBGIS), nezapojeno |
| Freiburg | geoportal.freiburg.de/wfs/gut_ki_strassenbreiten | šířky ulic od obruby k obrubě z mračen bodů 2024 (čáry) | neodpověděl (timeout) | Open Data BW | kandidát, zkusit znovu |
| Brémy | data Straßenbefahrung 2019 a 2021 | užití a materiál ploch | — | otherRestrictions, bez služby | nedostupné |

Mnichov, Lipsko, Kolín, Bonn, Karlsruhe, open.nrw (kromě Cách) a GovData: v katalozích nic dalšího s plochami ulic.

## Ostatní (z průzkumu agenta Haiku, neověřeno a nezapojeno)

Plné znění průzkumu níže. Kandidát na první městský zdroj: Hamburg `feinkartierung_strasse` (OGC API, plochy ulic
s polem `nutzung`, CORS `*`, dl-de/by-2.0), A/B test před zapojením.

---

# Německo: otevřené webové služby pro Profily ulic (prohlížeč, CORS)

Test: 17. 11. 2026, klient `profily-ulic`. Jeden malý dotaz na službu (bbox asi 100 m v centru, nebo jeden bod). CORS: `curl -sI -H "Origin: https://streetspace.eu"`, čte se `Access-Control-Allow-Origin` (ACAO). Dotazy na Overpass a Nominatim nebyly.

Legenda: **V** = ověřeno mým dotazem v této session. **R** = jen z vyhledávání nebo metadat, neověřeno. **?** = nenalezeno.

## 1. Ortofoto (nejdůležitější)

Všechny níže uvedené ortofoto služby jsou WMS (GetMap, PNG, 256 px, bbox ~100 m). Pro canvas se hodí WMS 1.3.0 s CRS EPSG:25832 nebo 25833 (u některých i EPSG:3857). Dlaždice XYZ/WMTS jsem u Německa nenašel kromě basemap.de.

| Land | Služba (URL) | Vrstva | Stav | ACAO | Licence (R = z metadat) | Pozn. |
|---|---|---|---|---|---|---|
| **Bund** basemap.de | `https://sg.geodatenzentrum.de/wmts_basemapde/1.0.0/WMTSCapabilities.xml` | jen `de_basemapde_web_raster_farbe/grau` | V (caps 200) | ano (echo) | dl-de/by-2.0 (R) | **Bez ortofota.** Jen mapa, WMTS 3857. Ne pro pixely |
| **NRW** | `https://www.wms.nrw.de/geobasis/wms_nw_dop` | `nw_dop_rgb` (CIR, NIR, UTM info) | V (caps 200, GetMap PNG 169 KB) | ano (echo `streetspace.eu`) | (R) dl-de/zero-2.0 nebo by (neověřeno) | EPSG:25832/25833/3857, PNG/JPEG |
| **Berlin** | `https://gdi.berlin.de/services/wms/truedop_2013` | `truedop_2013` | V (GetMap PNG 143 KB) | `*` | dl-de/by-2.0, nebo zero-2.0 podle záznamu (R) | **Jen 2013**, novější roky z katalogu (`gdi.berlin.de/geonetwork`) neověřeny. Attribution: „Geoportal Berlin / [Titel]“ (R) |
| **Bayern** | `https://geoservices.bayern.de/od/wms/dop/v1/dop20` | `by_dop20c` (RGB), `by_dop20g`, `by_dop20cir` | V (GetMap PNG 175 KB) | ano (echo) | (R) CC BY 4.0 (TUM, INSPIRE); jinde „Datenquelle: Bayerische Vermessungsverwaltung“ | Bez registrace. Pozor: wiki OSM říká, že DOP20 není pro OSM |
| **Brandenburg** | `https://isk.geobasis-bb.de/mapproxy/dop20c/service/wms` | `bebb_dop20c` | V (caps 200, ACAO `*`); GetMap **netestován** | `*` | dl-de/by-2.0, „© GeoBasis-DE/LGB“ (R) | Mapproxy; WMTS `dop20c_wmts`. Starší `ows/dop20c_wms` se má rušit |
| **Sachsen** | `https://geodienste.sachsen.de/wms_geosn_dop-rgb/guest` | `sn_dop_020` | V (GetMap PNG 121 KB) | `*` | (R) neověřeno | EPSG:25832/25833/3857 |
| **Niedersachsen** | `https://opendata.lgln.niedersachsen.de/doorman/noauth/dop_wms` | `ni_dop20` (layer `WMS_NI_DOP20`) | V (GetMap PNG 165 KB) | `*` | (R) neověřeno | „noauth“ v URL = bez přihlášení |
| **Sachsen-Anhalt** | `https://www.geodatenportal.sachsen-anhalt.de/wss/service/INSPIRE_LVermGeo_ATKIS_OI/guest` | `OI_OrthoimageCoverage` | V (GetMap PNG 159 KB, caps 200) | ano (echo) | „Es gelten keine Zugriffsbeschränkungen“ (R), licence neuvedena | Zdroj DOP20 (ATKIS-OI); bbox v testu asi 23 km od Magdeburgu, ale vrátil obrázek |
| **Hamburg** | `https://geodienste.hamburg.de/wms_dop_zeitreihe_belaubt` | `wms_dop_zeitreihe_belaubt` (časová řada, belaubt) | V (GetMap PNG 179 KB) | `*` | dl-de/by-2.0 (R) | Hlavní `HH_WMS_DOP` a `_belaubt` v OSM wiki vrací 404 (V). Parametr `time` (R) |
| **Bremen** | `https://geodienste.bremen.de/wms_dop20_2023` | `DOP20_2023_HB`, `DOP20_2023_BHV` | V (GetMap PNG 164 KB) | `*` | CC BY 4.0 (R, metadata) | 2023 |
| **Rheinland-Pfalz** | `https://www.geoportal.rlp.de/mapbender/php/wms.php?inspire=1&layer_id=61676&withChilds=1` | `rp_dop20` | V (caps 200, ACAO `*`); **GetMap nefunguje** (vrací ServiceException „Parameter REQUEST invalid“ i v upper-case) | `*` | dl-de/by-2.0 (R) | Mapbender, GetMap nutno ještě dořešit |
| **Saarland** | `https://geoportal.saarland.de/mapbender/php/wms.php?inspire=1&layer_id=46750&withChilds=1` | (`sl_dop20_info`, DOP vrstva neurčena) | V (caps 200, ACAO `*`); GetMap **nefunguje** (stejná exception) | `*` | (R) neověřeno | jako RLP |
| **Hessen** | `https://www.gds.hessen.de/wmsrest` ; `inspire-hessen.de/raster/dop20/ows` | `WMS_HE_Luftbilder - DOP20 rgb` (R) | **?** WMS URL nenalezena; INSPIRE WCS vrátil 502 (V) | ne | dl-de/zero-2.0 (R) | Stažení na JPEG (R) |
| **Thüringen** | **?** | - | **?** | - | licence sporná (OSM diskuse, R) | Licence podle OSM vlákna nejistá, TLBG přechází na TLRZ |
| **Baden-Württemberg** | `https://owsproxy.lgl-bw.de/owsproxy/wcs/WCS_INSP_BW_Orthofoto_DOP20` (WCS, R) | DOP20 | **?** WMS nenalezen; owsproxy WMS 404 (V) | `*` (u 404) | Open Data (R) | WCS pro pixely nevhodné bez `GetCoverage` testu |
| **Mecklenburg-Vorpommern** | **?** | - | **?** | - | - | Nenalezeno |
| **Schleswig-Holstein** | (LVermGeo SH, WMS vyžaduje licenci pro neprivátní použití, R) | DOP20 WCS (R) | **?** netestováno | - | WCS CC BY 4.0, WMS jinak (R) | Nejasné, proto bez WMS. Ověřit u LVermGeo SH |

Shrnutí ortofoto: **ověřené s pixely (GetMap PNG + ACAO)**: NRW, Bayern, Sachsen, Niedersachsen, Sachsen-Anhalt, Berlin (2013), Hamburg (časová řada), Bremen, Brandenburg (caps; GetMap ještě neověřen). **Chybí / nejisté**: BW, Hessen, Thüringen, MV, SH, RLP a Saarland (GetMap blokovaný).

Pozor: CORS „echo“ (`Access-Control-Allow-Origin: https://streetspace.eu`) je v pořádku, ale jen pro náš origin.

### basemap.de (BKG)
- Má jen web-rastr (farbe a grau), **ne ortofoto**. Nelze jej použít jako náhradu. (V)

## 2. Městské plochy (vozovka, chodník, parkování, zeleň)

| Město | Služba | Vrstva / pole | Stav | CORS | Licence (R) |
|---|---|---|---|---|---|
| **Hamburg** | `https://api.hamburg.de/datasets/v1/feinkartierung_strasse/collections/strassenflaechen/items?f=json&bbox=lon,lat,lon,lat` (OGC API Features) | `nutzung` (Gehweg, Parkplätze Kfz, Fußgängerzone, Grünfläche, Mischverkehrsfläche, …), `strassenname`, `strassentyp`, `kategorie`, `fremdeigentum`, `flaeche` | **V**: bbox Rathausmarkt 100 m, 50 polygonů, GeoJSON 50 KB | `*` (V) | (R) dl-de/by-2.0 |
| **Berlin** | Straßenflächen v ISU5 (WFS v Geoportalu, 32 000 ploch) | pole `gml_id` s klíčem | R, **netestováno** (URL nenalezena) | ? | (R) zero-2.0 nebo by-2.0 podle záznamu |
| München, Köln, Frankfurt, Düsseldorf, Leipzig, Dresden, Stuttgart | nehledáno | | | | |

## 3. Adresy a geokodér

- **Photon** (`https://photon.komoot.io/api/?q=…&lang=de`): **V**, dotaz „Karl-Marx-Allee Berlin“ vrátil výsledky s `countrycode DE`, ACAO `*`. Pokrývá Německo (V).
- BKG Geocoder: vyžaduje klíč (R). Nezkoušel jsem.
- Berlin, Hamburg, NRW adresní WFS: nenalezeny v této rešerši (?).

## 4. Dopravní značení měst (StVO čísla)

- **Leipzig**: Verkehrszeichen, WFS GetCapabilities + CSV/GeoJSON, rok 2022 (R, `opendata.leipzig.de/dataset/verkehrszeichen-stadt-leipzig`). CORS **netestováno**.
- **Gelsenkirchen, Bottrop**: „GeoSmartChange Inventarisierung Verkehrszeichen“ (Herbst 2020), WFS u Bottropu, GeoJSON u Gelsenkirchen (R). Mimo vaše města (NRW).
- **Berlin, Hamburg, Köln, Bonn**: v rešerši nic (?). Köln má jen Lichtsignalanlagen (WFS, R).
- Land **BW**: digitální Verkehrszeichenkataster přes Mobilithek / MobiData BW (R, nikoli WFS).

## 5. Parkování (placené zóny)

Nehledáno (zbylé v zadání, mimo čas). Doporučení: Berlin (Parkraumbewirtschaftung, gdi.berlin.de) a Hamburg (Parkraumzonen, transparenz.hamburg.de) ověřit příště.

## 6. Městská doprava (bez ověření, paměť modelu)

Stav: neověřeno. Jen pro orientaci, před použitím ověřit.

| Město | Tramvaj | Trolejbus | Barvy (paměť, neověřeno) |
|---|---|---|---|
| Berlin | ano (BVG, Flexity, Tatra) | ne | BVG: žlutá (bus), červená/bílá (tram ?) |
| Hamburg | ne | ne | Hochbahn/VHH: červená |
| München | ano (MVG) | ne | MVG: červená/bílá |
| Köln | ano (KVB) | ne | KVB: červená/bílá |
| Frankfurt | ano (VGF) | ne | VGF: bílo-červená |
| Leipzig | ano (LVB) | ne | LVB: bílá/zelená |
| Dresden | ano (DVB) | ne | DVB: bílá/žlutá |
| Stuttgart | ano (Stadtbahn SSB) | ne | SSB: bílá/červená |
| Düsseldorf | ano (Rheinbahn) | ne | Rheinbahn: červená |
| Hannover | ano (Üstra) | ne | Üstra: zelená/bílá |
| Nürnberg | ano (VAG, několik linek) | ne | VAG: červená |
| Bremen | ano (BSAG) | ne | BSAG: červená/bílá |
| Solingen | ne | ano (O-Bus) | — |
| Esslingen | ne | ano (O-Bus) | — |
| Eberswalde | ne | ano (O-Bus) | — |

## Tabulka pro tým

| služba | endpoint | co dává | CORS (ověřeno?) | licence | doporučení |
|---|---|---|---|---|---|
| NRW DOP | `wms.nrw.de/geobasis/wms_nw_dop` | DOP RGB, WMS | ano (V) | (R) | **použít** |
| Bayern DOP20 | `geoservices.bayern.de/od/wms/dop/v1/dop20` | DOP20 RGB/CIR/Grau | ano (V) | CC BY 4.0 (R) | **použít**, ověřit licenci OSM |
| Sachsen | `geodienste.sachsen.de/wms_geosn_dop-rgb/guest` | DOP020 | `*` (V) | (R) | **použít** |
| Niedersachsen | `opendata.lgln.niedersachsen.de/doorman/noauth/dop_wms` | DOP20 | `*` (V) | (R) | **použít** |
| Sachsen-Anhalt | `geodatenportal.sachsen-anhalt.de/wss/service/INSPIRE_LVermGeo_ATKIS_OI/guest` | DOP20 | ano (V) | (R) | **použít** |
| Hamburg | `geodienste.hamburg.de/wms_dop_zeitreihe_belaubt` | časová řada | `*` (V) | (R) | **použít** |
| Bremen | `geodienste.bremen.de/wms_dop20_2023` | DOP20 2023 | `*` (V) | CC BY 4.0 (R) | **použít** |
| Berlin | `gdi.berlin.de/services/wms/truedop_2013` | DOP 2013 | `*` (V) | by/zero (R) | použít, hledat novější |
| Brandenburg | `isk.geobasis-bb.de/mapproxy/dop20c/service/wms` | DOP20c | `*` (V caps) | by-2.0 (R) | ověřit GetMap |
| RLP / Saarland | `geoportal.rlp.de`, `geoportal.saarland.de` (mapbender) | DOP20 | `*` (V caps) | (R) | GetMap nefunguje, dořešit |
| Hessen, Thüringen, MV, BW, SH | ? | | | | nenalezeno nebo nejasná licence |
| basemap.de | WMTS | jen mapa | ano (V) | by-2.0 (R) | ne jako ortofoto |
| Photon | `photon.komoot.io` | geokód DE | `*` (V) | ODbL (R) | **použít** |
| Hamburg Straßenflächen | `api.hamburg.de/…/strassenflaechen/items` | plochy, `nutzung` | `*` (V) | by-2.0 (R) | **použít** |
| Berlin Straßenflächen (ISU5) | WFS v Geoportalu | plochy | ? | (R) | ověřit URL |
| Leipzig Verkehrszeichen | opendata.leipzig.de | značky, WFS | ? | (R) | ověřit CORS |

## Poznámky
- Jen jeden dotaz na službu, bez stahování velkých souborů. Hledání bylo přes webové vyhledávání; URL z něj nebyly vždy správné (Berlin, Hamburg, Bayern a BW první pokusy vrátily 404).
- Licence jsou z metadat (R), kde je uvedeno „V“, licence jsem nečetl na stránce. Před nasazením u každého Landu ověřit text licence a attribution.
- Výsledky sloužily k rozhodnutí, co zkoušet dál; ne jako hotová tabulka ke kódu.
