# Průzkum C: národní ortofoto služby (EPSG:3857, CORS), 11 zemí

Datum: 22. 11. 2026. Požadavek: `-A profily-ulic -H "Origin: https://streetspace.eu"`, pauza 1 s, nic z Overpassu ani Nominatimu. Většina hostitelů neodpověděla, proto je u většiny sloupců „neověřeno“. Mapa povrchů hlavních měst se nepodařila ověřit u žádného státu (hostitelé nefungují nebo nejsou nalezeny).

| stát | ortofoto (služba) | funguje | CORS | klíč | licence | rozlišení/zoom | mapa povrchů hlavního města | hodnocení | poznámka |
|---|---|---|---|---|---|---|---|---|---|
| Rumunsko | ANCPI, INSPIRE view `geoportal.ancpi.ro/inspireview/rest/services/OI/OI_View/MapServer/exts/InspireView/service` (ortofotoplan 1:5000, metadata z 2021) | ne: host `geoportal.ancpi.ro` se nepřeložil (DNS), 3 pokusy včetně kořene | neověřeno | neověřeno | neověřeno (EEA katalog uvádí „volně přístupné“, ověřit) | 50 cm (EEA), 1:5000 barevně; zoom neověřeno | neověřeno | nejisté | APIA `inspire.apia.org.ro` odpovídá, ale náhodná cesta dala 404. Bukurešť: neověřeno. |
| Bulharsko | Ministerstvo zemědělství, INSPIRE view ortofoto a DEM, `inspire.mzh.government.bg` (GetCapabilities) | ne: timeout (25 s a 20 s), 2 pokusy | neověřeno | neověřeno (INSPIRE: veřejný přístup omezen podle čl. 13 odst. 1 písm. d) | neověřeno | neověřeno | neověřeno | nejisté | Katastr `cadastre.bg` odpovídá 301, ortofoto tam nenalezeno. Ministerská služba je podle INSPIRE omezená. |
| Srbsko | RGZ / GeoSrbija (ortofoto 2007–13 letecké, 2015–16 a 2020–21 satelitní) | ne: `geosrbija.rgz.gov.rs` se nepřeložil (DNS); veřejné WMS nenalezeno | neověřeno | ano, přístup po registraci a poplatky (podle zákona o správních poplatcích a licenční smlouvy s distributorem satelitních snímků) | proprietární, bez volné licence | neověřeno | neověřeno | odložit | Podle vyhledávání jen prohlížení a registrace e-mailem; licence je hlavní překážka. |
| Bosna a Hercegovina | Federální geodetická správa (FGA), ortofoto 1:5000 Federace přes WMS (letecké snímky 2022); RGURS (Republika Srpska) nenalezena | ne: `fgu.com.ba` timeout, WMS URL nenalezena | neověřeno | neověřeno | neověřeno | 1:5000 (asi 25 cm podle snímkování, neověřeno) | neověřeno | nejisté | Stát nemá jednu národní službu (Federace, Republika Srpska, Brčko). Sarajevo leží ve Federaci. |
| Černá Hora | Uprava za nekretnine (geoportal), ortofoto 2025 (podle realitního blogu, bez odkazu na službu) | ne: `geoportal.gov.me` se nepřeložil (DNS) | neověřeno | neověřeno (zdroj z roku 2016 uvádí účet a omezení pro úřední použití) | neověřeno | neověřeno | neověřeno | odložit | Starý odkaz `geoportal.co.me` v zdrojích z roku 2016 také neověřen. |
| Severní Makedonie | Agentura za katastar, geoportál (ArcGIS, LiDAR 46 % území) | ne: `katastar.gov.mk` nejde navázat spojení (port 443) | neověřeno | neověřeno | neověřeno | neověřeno | neověřeno | nejisté | Vyhledávání WMS neodhalilo. Zdroj UN SALB uvádí „žádná data“ (možná zastaralé). |
| Albánie | ASIG National Geoportal, WMTS `geoportal.asig.gov.al/service/wmts?request=getCapabilities` | WMTS ano (200, 412 KB); GetTile v EPSG:900913 vrátil chybu 400, vrstva `orthophoto_2015:OrthoImagery` není v 3857; WMS GetMap 3857 vrátil `LayerNotDefined` (jiný název vrstvy), WMS capabilities timeout | ano (`Access-Control-Allow-Origin: *`) u WMTS | ne (neověřeno) | neověřeno | WMTS vrstvy: 2015 OrthoImagery, 20 cm a 8 cm (názvy); zoom neověřeno | neověřeno | nejisté (kvůli projekci) | Ortofoto 2025 pokrývá 92 % území (podle ASIG). Je potřeba reprojekce z EPSG:6870 (ETRS89 / Albania TM 2010) nebo jiný název vrstvy ve WMS. |
| Kosovo | Kosovská kadastrální agentura (AKK), geoportál; ortofoto WMS nenalezeno | `akk.rks-gov.net` odpovídá (302); ortofoto služba neověřena | neověřeno | neověřeno | neověřeno | neověřeno | neověřeno | nejisté | Podle strategie NSII (2023) je v plánu otevřená data. |
| Monako | neověřeno; `geoportail.mc` se nepřeložil (DNS) | ne | neověřeno | neověřeno | neověřeno | neověřeno | neověřeno | odložit | Nenalezen žádný zdroj. |
| Andorra | Govern d'Andorra; ortofoto 2012 (22,5 cm, produkce ICGC) | neověřeno: `sig.ad` odpovídá (421, ne WMS); ICGC WMS (`geoserveis.icgc.cat`) je pro Katalánsko, pokrytí Andorry neověřeno | neověřeno | neověřeno | neověřeno | 22,5 cm (zdroj), zoom neověřeno | neověřeno | nejisté | Vyžádat přímo od Govern d'Andorra. |
| San Marino | neověřeno; `geoportale.sm` se nepřeložil (DNS) | ne | neověřeno | neověřeno | neověřeno | neověřeno | neověřeno | odložit | Nenalezen žádný zdroj. |

## Shrnutí pro rozhodnutí
- **Žádný stát nemá ověřenou službu, která by hned fungovala v EPSG:3857 s CORS a bez klíče.** Jediný živý CORS (Albánie, WMTS) je v jiné projekci a vrstvy nejsou v 3857.
- **Nejblíž k použití:** Albánie (nutná reprojekce nebo WMS vrstva s 3857), pak Rumunsko a Bulharsko (INSPIRE služby, ověřit licenci a dostupnost, dnes nedostupné).
- **Odložit:** Srbsko (registrace, poplatky, licence), Černá Hora, Monako, San Marino.
- **Mapy povrchů hlavních měst:** nikde neověřeno.

## Co zbývá ověřit
- Rumunsko: nový host ANCPI nebo jiný GetCapabilities odkaz (DNS na `geoportal.ancpi.ro` neprošel).
- Bulharsko: zopakovat `inspire.mzh.government.bg` v jiný čas (timeout).
- Albánie: WMS GetCapabilities (timeout) a správný název vrstvy 3857, nebo reprojekce z EPSG:6870.
- Černá Hora, Severní Makedonie, Monako, San Marino: najít správný host geoportálu.
