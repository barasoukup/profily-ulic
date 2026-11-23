# Data pro Maltu: ověřené otevřené služby (pro profil ulic)

Ověřeno 23. 11. 2026, asi 70 požadavků, User-Agent `profily-ulic`, pauza asi 1 s, Origin `https://streetspace.eu`.
Overpass ani Nominatim nebyly použity, žádné osobní údaje se neposílaly, Referer se nepodvrhoval.

Značení: **ověřeno** = odpověď přišla a byla přečtena; **neověřeno** = jen z dokumentace, katalogu nebo vyhledávání, bez
dotazu. CORS `*` = `Access-Control-Allow-Origin: *`; „echo“ = server vrací náš Origin (navíc
`Access-Control-Allow-Credentials: true`), z prohlížeče to funguje jako `*`.

Pozor: weby `gov.mt` a `pa.org.mt` jsou za Cloudflare. Na curl vracejí 403 „Sorry, you have been blocked“ nebo výzvu
„Just a moment…“ (`portal.data.gov.mt`, `msdi.data.gov.mt`, `www.pa.org.mt`, `mapserver.pa.org.mt`). Ochranu jsem
neobcházela. Katalog `portal.data.gov.mt` (CKAN) jsem prošla ve vestavěném prohlížeči (Cloudflare ho pustil bez úlohy)
a jeho API `/api/3/action/package_search` volala ze stejné stránky. **Služby, které katalog uvádí, ale běží jinde**
(`malta.coverage.wetransform.eu`, `haleconnect.com`, `address.gov.mt`), na curl odpovídají normálně.

Zkušební body: Valletta Triq ir-Repubblika (14,5130, 35,8985), Msida (14,4870, 35,8960), Sliema (14,5045, 35,9128),
Victoria na Gozu (14,2393, 36,0443), Marsalforn (14,2605, 36,0720), Comino (14,3365, 36,0105); moře (14,00, 35,70) a
Sicílie mimo pokrytí (15,00, 36,80).

---

## 1. Ortofoto (Planning Authority, PA; služby provozuje wetransform)

Katalog `portal.data.gov.mt` (380 datasetů) má od PA **jen dvě ortofota**: `orthoimagery-2012` a **`orthoimagery-2018`**
(**ověřeno**, dotazy „ortho“, „imagery“, „aerial“). Obě jsou v katalogu pod **CC BY 4.0**. Ortofoto 2018 je navíc
označené jako **High Value Dataset** (prováděcí nařízení (EU) 2023/138, kategorie Pozorování Země a životní prostředí),
a ta musí být pod CC BY 4.0 nebo volnější. Novější ročník (2020, 2022) jsem v katalogu ani jinde nenašla. PA má
mapový server `mapserver.pa.org.mt`, ten je ale za Cloudflare (curl dostane výzvu, prohlížeč IIS 403/404 bez výpisu
služeb). `geoserver.pa.org.mt` a `geoportal.pa.org.mt` nemají DNS záznam. MSDI `msdi.data.gov.mt` (GeoServer i
GeoNetwork) přesměruje na `splashpage.gov.mt` „This website is unavailable“ (**ověřeno** v prohlížeči). Infrastructure
Malta ani Lands Authority v katalogu žádnou mapovou službu nemají.

| Zdroj | Ověřený stav | Rozlišení, datum, pokrytí | Licence | Poznámka |
|---|---|---|---|---|
| **Ortofoto 2018** WMS `https://malta.coverage.wetransform.eu/wms/ortho_2018/ows`, vrstva `OI.OrthoimageCoverage` | **ověřeno**: GetCapabilities 1.3.0 200, CORS `*`. GetMap 1.3.0 200 `image/jpeg`, CORS `*`, asi 0,3–0,45 s, bez `Cache-Control`. `CRS=EPSG:4326` (pořadí os **lat,lon**) i `CRS=CRS:84` (lon,lat) dávají stejný výřez (obrazy se liší jen v pár bajtech JPEG). **`EPSG:3857` ani `EPSG:900913` nejde**: 200 `text/xml` `InvalidCRS`. Nabízí `CRS:84`, 4326, 4258, 3035, 32633 (a překlep `ESPG:3045`). MaxWidth/MaxHeight 4000 | **Mřížka 0,15 m** v UTM 33N (WCS DescribeCoverage `ortho_2018`, `offsetVector 0.1500016`, **ověřeno**; přehledy `_2`… `_32`). Výřez ±25 m při 0,10 m/px i 0,05 m/px funguje (převzorkuje). Obraz ostrý: obruby, vodorovné značení, auta i chodci (Valletta, Msida). Rok jen z názvu, přesné datum letu neuvedeno. **Malta, Gozo i Comino pokryté** (Valletta, Msida, Sliema, Victoria, Marsalforn, Comino 200 s obrazem) | **CC BY 4.0** (portal.data.gov.mt, dataset „Orthoimagery 2018“, Planning Authority, **ověřeno** v katalogu); GetCapabilities `AccessConstraints noLimitations`, `Fees` prázdné | **Použít jako hlavní.** WCS stejných dat `https://malta.coverage.wetransform.eu/ortho_2018/ows` (2.1.0, CORS `*`, **ověřeno** GetCapabilities a DescribeCoverage). |
| Ortofoto 2012 WMS `https://malta.coverage.wetransform.eu/wms/ortho_2012/ows` (adresa se přesměruje 301 na statický `…/capabilities/ortho-wms-caps.xml`; GetMap jde přímo) | **ověřeno**: GetMap 1.3.0 v 4326 a CRS:84 200, CORS `*`, bez 3857. **Nespolehlivé:** při jemném měřítku vrací 200 `text/xml` „Could not get any sources: HTTP Error“, ve Vallettě pod asi 0,13 m/px, v Sliemě už při 0,20 m/px, na Cominu i při 0,33 m/px (při 1 m/px obraz je) | 15 cm, let 1. 6. 2012 (projekt ERDF156; metadata ISO `…/metadata/org.1261.434810b6-….xml`, **ověřeno**) | CC BY 4.0 (katalog); metadata INSPIRE „no conditions to access and use“ (**ověřeno**) | Jen záloha, a to slabá: zdroji chybí dlaždice nejjemnější úrovně. Na Gozu (Victoria) při 0,15 m/px obraz byl, měkčí než 2018. |

**Prázdné místo** (ověřeno, moře, Sicílie, kanál mezi Maltou a Gozem): 200 a **černý JPEG 2 391 B** (s `image/png`
paletové PNG 967 B). Detekce: `blank()` v `lanes-ortho.js` černou plochu pozná (r, g, b < 4).

**Chyby přicházejí jako 200 `text/xml`** (`ServiceExceptionReport`), ne jako 4xx/5xx. V `patchOf` by `createImageBitmap`
na XML spadl, takže je potřeba kontrolovat `content-type` (`image/…`), jinak brát jako „nic“.

**Jak to zapojit bez 3857** (návrh): `patchOf` staví bbox ve Web Mercatoru. Rohy převést inverzní Mercatorovou projekcí
na stupně a poslat `CRS=CRS:84&BBOX=lon0,lat0,lon1,lat1` (pořadí lon,lat se nesplete) se stejnou šířkou a výškou v px.
Na ±25 m je rozdíl mezi Mercatorem a „plate carrée“ v rámci jednoho pixelu, takže obraz se vykreslí jako dnes. Hodnota
`res: 0.15` (nativní mřížka). Odhadem jako `ES_ORTHO`, jen s jinou funkcí bboxu.

---

## 2. Mapy povrchů ulic

**Nenalezeno.** V katalogu (dotazy „road“, „street“, „pavement“, „parking“, „transport“, „topography“) nic s plochami
vozovek, chodníků ani obrub. PA zveřejňuje z velkoměřítkové topografie (LiDAR/fotogrammetrie) jen budovy (kap. 3).

| Služba | Ověřený stav | Obsah | Licence | Použitelnost |
|---|---|---|---|---|
| Transport Malta **TEN-T Comprehensive Road Network** WFS `https://haleconnect.com/ows/services/org.1261.556c29b1-1a36-4bc1-86dc-fdca3d411eb9_wfs` (`tn-ro:RoadLink`) | **ověřeno**: GetCapabilities 200, CORS echo; GetFeature (bbox Msida) 200, **0 prvků** | Jen síť TEN-T (osy), podle katalogu 1 : 2 500 z podkladů MEPA 1989 | katalog CC BY 4.0, ale `ows:Fees` ve službě „Attribution-NonCommercial-NoDerivatives 4.0“ (**rozpor**) | Ne. |
| Enemalta **Street lighting** WFS `…/org.1261.898d07df-6334-47ba-bc05-da23ed497076_wfs` (`us-net-common:Appurtenance`) | **ověřeno**: GetFeature geojson 200, CORS echo, **131 bodů** v okně asi 450 × 450 m v Msidě | Body lamp (kód, obec), bez výšky a typu | katalog CC BY 4.0, ve službě **CC BY-NC-ND 4.0** (rozpor) | Polohy lamp by šly, ale licence je sporná; zatím ne. |
| DSM a DTM 2018, 1 m (PA) WCS `https://malta.coverage.wetransform.eu/dsm_1m_2018/ows`, `…/dtm_1m_2018/ows` | **ověřeno**: GetCapabilities 200, CORS `*`; GetCoverage `SUBSET=E(…)&SUBSET=N(…)` v UTM 33N, `FORMAT=text/csv` 200, CORS `*` (hodnoty v CSV celé metry) | Povrch a terén, 1 m; i 2012 | **CC BY 4.0** (katalog) | Možné do budoucna: výška domů (DSM − DTM) a výšky povrchu ulice (Bářin nápad z 12. 11.). Ne hned. |

---

## 3. Budovy

| Zdroj | Ověřený stav | Pole | Licence | Poznámka |
|---|---|---|---|---|
| **PA Large Scale Topography: Buildings** WFS `https://haleconnect.com/ows/services/org.1261.af1f626c-3200-4fb6-8ae0-a3426b6b4a6e_wfs`, `bu-core2d:Building` | **ověřeno**: GetFeature 2.0.0 `OUTPUTFORMAT=application/geo+json`, `SRSNAME`/`BBOX` v `urn:ogc:def:crs:EPSG::4326` (lat,lon), 200, CORS echo, asi 0,13 s | **`heightAboveGround`** (m, `measured`, od nejnižšího bodu terénu ke střeše), `beginLifespanVersion` (2020), id. **Bez podlaží, typu, střechy a roku.** Polygony jsou **celé bloky**, ne jednotlivé domy: Valletta 8 prvků v okně 110 × 110 m (bloky 1 800–7 800 m², 23–38 m), Msida 21 (do 6 100 m², 10–36 m), Victoria 14 | katalog **CC BY 4.0**; služba v `ows:Fees` „Conditions apply - contact mappingshop@pa.org.mt…“ (**rozpor**, katalog je novější a dataset je PA) | Výška bloku je maximum přes více domů, k vzhledu jednoho domu jen hrubě (podlaží ≈ výška / 3,2). Obrys fasády bloku k ulici je použitelný. |
| OSM budovy (dlaždice) | neověřeno pro Maltu | `building:levels` místy | ODbL | Jako jinde v cizině. |

---

## 4. Hledání adres a ulic

| Služba | Ověřený stav | Odpověď | Licence | Poznámka |
|---|---|---|---|---|
| **Photon (komoot)** `https://photon.komoot.io/api/?q=…&bbox=14.15,35.78,14.60,36.10` | **ověřeno**, 200, CORS `*` | „Triq ir-Repubblika Valletta“ → úseky ulice (`countrycode: MT`, `osm_value: pedestrian`), i anglicky „Republic Street Valletta“ | ODbL | **Použít** (`search-photon.js`, přidat `MT`; místní jazyky mt, en). |
| Office of the Address Registrar `https://address.gov.mt/wp-json/gov/v1/streets` (také `localities`, `local-councils`, `regions`) | **ověřeno**: 200 JSON 1,38 MB, CORS echo | Seznam ulic (jméno maltsky, kód, lokalita, obec, region), **bez souřadnic** | CC BY 4.0 (katalog) | K hledání polohy nestačí; jen ke kontrole jmen. Geokodér nenalezen. |

---

## 5. Parkování a vyhrazené pruhy

Nenalezeno (katalog: „parking“ vrátil jen územní plán, „bus“ nic). Stání a BUS pruhy jen z OSM.

---

## 6. OSM (Geofabrik) a hranice

**Geofabrik, ověřeno 23. 11. 2026** (`index-v1.json`, HEAD): `europe/malta/malta-latest.osm.pbf` **9,0 MB**
(9 003 611 B, Last-Modified 23. 11. 2026). Výřez `malta.poly` je jednoduchý obdélník 14,00–14,856° v. d.,
35,52–36,33° s. š. (8 bodů): celé souostroví i s mořem. Jeden díl `mt`, na R2 jako ostatní nové státy.

**Hranice GISCO** (**ověřeno**: `CNTR_RG_01M_2024_4326.geojson`, `CNTR_ID` „MT“): **3 polygony**: Malta **129 bodů**
(14,32–14,573° v. d., 35,807–35,997° s. š., 246 km²), Gozo **43 bodů** (65 km²), Comino **12 bodů** (3 km²). Filfla,
Cominotto a ostrůvky sv. Pavla chybějí (neobydlené). Průměrná délka úseku na Maltě kolem 1 km, takže pobřeží je
hrubé: z 13 zkusmých nábřežních bodů padly 3 mimo (Sliema Tower Road, Birgu u Dockyard Creek, Ċirkewwa); body byly
odhadnuté, některé mohly ležet na vodě, ale riziko pro nábřežní ulice je skutečné.

Lepší a jednodušší než OSM (správní hranici bez Overpassu nezískáme): **obdélník z `malta.poly`** nebo GISCO ring
rozšířený o asi 300 m. V okruhu není jiný stát (Sicílie od 36,64° s. š., Lampedusa 12,6° v. d.), takže moře uvnitř
nevadí. Obce: PA „Local Councils units and boundaries“ (haleconnect, CC BY 4.0 v katalogu, neověřeno dotazem) nebo
LAU GISCO, pokud by Malta měla města.

---

## Shrnutí

| Oblast | Zdroj | Stav | CORS | Licence | Doporučení |
|---|---|---|---|---|---|
| Ortofoto | PA **2018** WMS wetransform, `OI.OrthoimageCoverage` | ověřeno, 15 cm, Malta + Gozo + Comino | `*` | **CC BY 4.0** (HVD) | **Použít jako hlavní**: `CRS:84`, bbox z Mercatoru převedený na stupně, `res: 0.15`; XML chyba (200) = nic, černý JPEG = prázdno |
| Ortofoto | PA 2012 WMS | ověřeno, ale při jemném měřítku chyba zdroje | `*` | CC BY 4.0 | Nepoužívat (nebo jen jako záloha s kontrolou `content-type`) |
| Ortofoto novější | PA `mapserver.pa.org.mt`, MSDI | za Cloudflare / nedostupné | - | - | Ne |
| Mapa povrchů | žádná | nenalezeno | - | - | Odhad z OSM a ortofota (`ortho-osm.js`) |
| Budovy | PA Large Scale Topography Buildings WFS | ověřeno, bloky s měřenou výškou | echo | CC BY 4.0 (katalog) × „conditions apply“ (služba) | Možné pro výšku bloku; jinak OSM |
| Výšky | PA DSM/DTM 2018 1 m WCS | ověřeno | `*` | CC BY 4.0 | Později (výška domů, výšky povrchu) |
| Lampy | Enemalta Street lighting WFS | ověřeno, body | echo | CC BY 4.0 × CC BY-NC-ND (rozpor) | Zatím ne |
| Hledání | Photon | ověřeno | `*` | ODbL | **Použít**, přidat `MT` |
| Hledání | address.gov.mt | ověřeno, bez souřadnic | echo | CC BY 4.0 | Ne |
| Stání, BUS | nenalezeno | - | - | - | OSM |
| OSM | Geofabrik `malta` 9,0 MB | ověřeno | - | ODbL | Jeden balík `mt` na R2 |
| Hranice | GISCO `MT` 3 polygony (129 + 43 + 12 bodů) | ověřeno | - | © EuroGeographics | Raději obdélník z `malta.poly` (nebo GISCO rozšířené), aby nábřeží nepadla mimo |

**Doporučení:** Malta jako Portugalsko nebo Kypr: odhad z OSM a ortofota. Ortofoto PA 2018 (15 cm, CC BY 4.0, CORS `*`,
pokrývá všechny tři obydlené ostrovy) je kvalitní, jen nemá Web Mercator: do `lanes-ortho.js` přidat zdroj s bboxem
v `CRS:84` a kontrolou `content-type`. Ortofoto 2012 ne (zdroj padá). Budovy PA jsou bloky s výškou, ne jednotlivé domy;
pro vzhled domu dál OSM, výšku bloku případně z WFS. Mapy povrchů, stání ani buspruhy Malta nezveřejňuje. Hranici
vzít z obdélníku Geofabriku, GISCO 1 : 1 M je na pobřeží hrubé.

Neověřeno: přesné datum letu 2018; zda PA má novější ortofoto na `mapserver.pa.org.mt` (za Cloudflare, výpis služeb
nedostupný); licenční rozpor u WFS budov a lamp (katalog CC BY 4.0 proti textu ve službě); INSPIRE geoportál EU
(`inspire-geoportal.ec.europa.eu` z našeho připojení bez DNS); OSM budovy na Maltě; služba obcí PA.
