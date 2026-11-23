# Data pro Itálii, San Marino a Vatikán: ověřené otevřené služby (pro profil ulic)

Ověřeno 23. 11. 2026, asi 230 požadavků, User-Agent `profily-ulic`, pauza 1 s, Origin `https://streetspace.eu`. Overpass
ani Nominatim nebyly použity, žádné osobní údaje se neposílaly, Referer se nepodvrhoval.

Značení: **ověřeno** = odpověď přišla a byla přečtena (u ortofota i prohlédnutý snímek); **neověřeno** = jen z dokumentace,
katalogu nebo vyhledávání, bez dotazu. CORS „`*`“ = `Access-Control-Allow-Origin: *`; „echo“ = server vrací náš Origin,
z prohlížeče to funguje stejně; „bez CORS“ = hlavička chybí (obrázek jde zobrazit v `<img>`, ale ne číst pixely ani JSON).

> **Stav po recenzi 23. 11. 2026** (`RECENZE.md`): aplikace používá jen ortofota Bologna 2023, Modena 2024, Torino 2023
> a Bolzano 2023 (všechna CC BY 4.0 podle katalogů, oddíl „Ověření licencí“ na konci). **Bolzano 2023 nafotila provincie
> ve spolupráci s AGEA v rámci monitorovacího plánu** (pole `lineage` záznamu provincie); vlastníkem záznamu je
> provincie a licenci dává výslovně CC BY 4.0 (`useLimitation`, `otherConstraints`), Bára 23. 11. 2026: používat.
> Mimo tyto čtyři oblasti (zbytek Itálie, San Marino, Vatikán) aplikace **profil nedělá**, kliknutí ukáže hlášku
> (`city.js closedAt`, `staty.json` `closed_it`); hledání Photon tam ulice nabídnout může. Návrhy „odhad z OSM a
> ortofota“ u San Marina a Vatikánu níže jsou rešerše, ne stav aplikace.
>
> **Hranice a kredit Turína (Bára 23. 11. 2026, recenze body 13 a 15):** oblasti jsou od 23. 11. hranice ISTAT „Confini
> delle unità amministrative a fini statistici al 1° gennaio 2026“, negeneralizované (shapefile v EPSG:32632,
> https://www.istat.it/storage/cartografia/confini_amministrativi/non_generalizzati/2026/Limiti01012026.zip; licence
> CC BY 4.0 podle Note legali ISTAT, „Salvo diversa indicazione, tutti i contenuti … Creative Commons – Attribuzione –
> versione 4.0“; kredit „© ISTAT“), převedené do WGS 84 a uložené v `tools/italy-border.json`. Body 100 m od hranice
> (po obou stranách): GISCO 1 : 1 M zařadil špatně 10–24 % (Bolzano 10, Turín 17, Bologna 18, Modena 24), ISTAT po
> zjednodušení na 30 m 0,2–1,2 % (rohy); 50 m od hranice GISCO 25–37 %, ISTAT do 1 %. Obdélník ortofota Modeny rozšířen na
> západ (10,77). Kredit Turína je ve znění Licenze d'uso Geoportálu města: „Base cartografica realizzata da Bára Soukupová, integrata con Ortofoto digitale colore 2023 della Città di Torino reperiti sul Geoportale del Comune di Torino“.

Zkušební body: Bologna Piazza Maggiore (11,3426, 44,4938) a Via Rizzoli (11,3460, 44,4990), Milano Duomo (9,1900, 45,4642),
Torino (7,6790, 45,0680), Firenze (11,2540, 43,7710), Roma (12,4823, 41,8986), Genova (8,9340, 44,4070), Trieste (13,7768,
45,6495), Udine (13,2350, 46,0630), Trento (11,1217, 46,0679), Bolzano (11,3548, 46,4983), Perugia (12,3888, 43,1107),
Bari (16,8700, 41,1200), Palermo (13,3615, 38,1157), Parma (10,3279, 44,8015), Napoli jako „mimo“ (14,2681, 40,8518);
Città di San Marino (12,4473, 43,9336), Serravalle (12,5040, 43,9690), Vatikán (12,4534, 41,9029).

---

## 0. Licence ortofot AGEA (rozhoduje o všem ostatním)

Většina regionálních ortofot jsou snímky **AGEA** (Agenzia per le Erogazioni in Agricoltura, celostátní nálety po třech
letech, 20 cm). AGEA zůstává vlastníkem a regionům je půjčuje **licenční smlouvou „pro institucionální účely“**. Přímo
v odpovědích služeb (ověřeno):

- Toscana (capabilities OFC 2022): práva výhradně AGEA, licence regionu „per fini istituzionali senza che in alcun modo sia
  consentito il download delle immagini“, povinný text „Ortofoto 2022 copyright AGEA – licenza d'uso concessa a Regione
  Toscana…“, který je **vepsaný přímo do obrazu** (svislý nápis podél okraje snímku, ověřeno na snímku Florencie).
- Umbria (ArcGIS `copyrightText`): „© 2020 AGEA – TUTTI I DIRITTI RISERVATI“.
- Lombardia (`Ortofoto2018_2019`): „proprietà esclusiva di AGEA“; dokumenty regionu (neověřeno dotazem): komerční použití
  a další poskytování zakázáno.
- Puglia 2022: „concessa in riuso da AGEA alla Regione Puglia attraverso specifica convenzione“.
- Veneto (stránka regionu, neověřeno dotazem): povinný text „ORTOFOTO 20 cm [2024] AGEA – TUTTI I DIRITTI RISERVATI“.
- Výjimka: staré AGEA 2008 a 2011 (50 cm) v Jižním Tyrolsku jsou podle capabilities pod **CC BY 4.0**.

Důsledek: ortofota AGEA (ER `Agea2023`, Lazio `2023_AGEA`, Umbria, Toscana, Puglia 2022, Sicílie 2022 podle všeho také)
jsou technicky použitelná (CORS, Web Mercator), ale **licence pro naši aplikaci je přinejmenším nejasná, spíš nevyhovuje**.
Čistě otevřená jsou jen ortofota s otevřenou licencí vlastníka: Emilia-Romagna RER 2022–2026 (CC BY 4.0, jen část
území), Bologna 2023, Modena 2024, Torino 2023, Bolzano 2023 (provincie; nálet ve spolupráci s AGEA, licence provincie
CC BY 4.0, viz úvod), Puglia 2023 (projekt Puglia Digitale), FVG true
ortho 2017–2020 (bez CORS). Než něco s AGEA zapojíme, je potřeba se zeptat AGEA nebo regionu (ideálně Bára).

AGEA má i vlastní geoportál s ortofoty celé Itálie (podle článku ItaliaOggi „scaricabili dal geoportale“), adresu služby
WMS jsem nenašla (neověřeno).

---

## 1. Ortofoto

### 1a. Celostátní

| Zdroj | Ověřený stav | Rozlišení, datum | Licence | Poznámka |
|---|---|---|---|---|
| **PCN / MASE** `http://wms.pcn.minambiente.it/ogc?map=/ms_ogc/WMS_v1.3/raster/ortofoto_colore_12.map`, vrstvy `OI.ORTOIMMAGINI.2012.32` (zóna UTM 32) a `.33` | **ověřeno**: capabilities a GetMap v `EPSG:3857` 200, CORS `*`, snímek Bologni 512 px; **jen http**: `https://wms.pcn.minambiente.it/…` vrací 301 zpět na `http://` (a `gn.mase.gov.it/ogc` 403 Akamai) | **50 cm**, AGEA 2009–2012 (abstrakt) | Fees „Nessuna condizione“, AccessConstraints „Nessuno“ | **Nepoužitelné**: ze stránky na https by to byl smíšený obsah (prohlížeč http obrázky do canvasu nepustí), navíc 50 cm a 14 let staré. |
| AGEA geoportál | **nenalezeno** | – | AGEA | Viz kap. 0. |

### 1b. Po regionech (přehled je hlavní výstup)

Režim „ArcGIS“ = `…/ImageServer/exportImage?bbox=…&bboxSR=3857&imageSR=3857&size=…&format=jpg&f=image` (nebo
`MapServer/export`), jako u Plzně a IPR v `lanes-ortho.js`. „WMS“ = GetMap 1.3.0 v `EPSG:3857`.

| Region | Služba a vrstva | Ověřený stav | Rok, rozlišení, pokrytí | CORS | Licence | Prázdno mimo pokrytí |
|---|---|---|---|---|---|---|
| **Emilia-Romagna** | WMS `https://servizigis.regione.emilia-romagna.it/wms/agea2023_rgb`, vrstva `Agea2023_RGB` (za ní ArcGIS `…/arcgis/rest/services/public/Agea2023_RGB/ImageServer`) | **ověřeno**: Bologna, San Marino ostré | AGEA 2023, 20 cm, celý region **i San Marino** | echo | AGEA (kap. 0), capabilities bez podmínek | černý JPEG 1 686 B (ArcGIS 4 779 B na 512 px), PNG průhledné |
| Emilia-Romagna | `…/wms/agea2020_rgb`, `Agea2020_RGB` | **ověřeno** | AGEA 2020, 20 cm, celý region; ostřejší než 2023 | echo | AGEA | jako výše |
| Emilia-Romagna | `…/wms/rer2022_rgb`, `RER2022_RGB` | **ověřeno: nad Boloní, Modenou, Parmou, Ravennou, Forlì, Rimini, Ferrarou i San Marinem černé** | Vlastní nálet RER 2022, 20 cm; z katalogu snímků (`ImageServer/query`) a přehledového snímku jen **malé ostrůvky** (např. Valmarecchia kolem 12,2° v. d., 43,9° s. š.) | echo | CC BY 4.0 (INSPIRE záznam, neověřeno dotazem) | černý JPEG |
| Emilia-Romagna | ArcGIS `public/RER2023_24_RGB` (WMS `…/wms/rer2023_24_rgb`) | **ověřeno**: snímek v Apeninách (10,215, 44,485); Bologna černá | RER 2023/24, 20 cm, **pás pahorkatin a Apenin** (bez nížiny a měst) | echo | CC BY 4.0 (podle obdobných záznamů, neověřeno) | černý |
| Emilia-Romagna | ArcGIS `public/RER2025_26_RGB` (WMS `…/wms/rer2025_26_rgb`) | **ověřeno**: Parma ostrá, Cesena černá | RER 2025/26, pixel 15 cm, zatím 2 bloky (Parma 10,12–10,51 / 44,65–45,04 a 11,64–12,16 / 43,74–44,07), přibývá | echo | CC BY 4.0 (neověřeno) | černý |
| Emilia-Romagna (města) | ArcGIS `public/Comune_BO_2023_RGB` (WMS `…/wms/comune_bo_2023_rgb`), `public/Comune_MO_2024_RGB` | **ověřeno** Bologna: velmi ostré | Bologna 2023 a Modena 2024, 20 cm (podle `pixelSizeX`, vizuálně ostřejší než AGEA), jen území obce | echo | CC BY 4.0 (ověřeno v katalogu, oddíl na konci) | černý |
| **Lombardia** | ArcGIS `https://www.cartografia.servizirl.it/arcgis2/rest/services/BaseMap/Ortofoto2021/ImageServer` (+ WMS `…/arcgis2/services/BaseMap/Ortofoto2021/ImageServer/WMSServer`, vrstva `0`; WMTS v katalogu) | **ověřeno: nefunguje** – `exportImage` chyba 400/500 „Error exporting image“, WMS vrací 0 B, WMTS „ArcGIS Server Error“; stejně `Ortofoto2018_2019` | AGEA 2021, 20 cm | echo | AGEA, výslovně jen institucionální | – |
| **Piemonte** (region) | WMS `https://geomap.reteunitaria.piemonte.it/mapproxy/service`, vrstva `rp_ortofoto_2010` | **ověřeno**, rozmazané | ICE 2010, asi 40–50 cm | `*` | – | – |
| **Torino** (město) | tamtéž, vrstva `coto_ortofoto_2023` | **ověřeno**: velmi ostré (asi 10 cm, vizuálně) | 2023, jen Torino | `*` | CC BY 4.0 (dataset Comune di Torino, ověřeno, oddíl na konci; záznam služby WMS „Condizioni sconosciute“; kredit ve znění Geoportálu, viz stav nahoře) | bílý JPEG 1 651 B, PNG průhledné |
| **Veneto** | IDT-RV 2.0, `idt2-geoserver.regione.veneto.it/geoserver` | **neověřeno**: spojení vyprší (TCP timeout) | AGEA 2024, 20 cm (stránka regionu) | ? | AGEA „tutti i diritti riservati“ | – |
| **Toscana** | WMS `https://www502.regione.toscana.it/ows_ofc/com.rt.wms.RTmap/wms?map=owsofc`, vrstva `rt_ofc.5k22.32bit` (i `5k19`, `5k16`) | **ověřeno**: Florencie 20 cm, ale **s vepsaným copyrightem AGEA** podél okraje | AGEA 2022, 20 cm, celý region | `*` | AGEA, „fini istituzionali“, bez stahování | bílý JPEG 2,4 KB |
| **Lazio** | WMS (GeoNode) `https://geoportale.regione.lazio.it/geoserver/ows`, vrstva `geonode:2023_AGEA_25833_COG` (i `2020_…`, `2017_…`) | **ověřeno**: Řím a **Vatikán** (kupole sv. Petra) | AGEA 2023, 20 cm, celý region **i Vatikán** | `*` | AGEA (záznam GeoNode bez licence) | bílý JPEG 909 B, PNG průhledné; 1,5–2,8 s na snímek |
| **Liguria** | WMS `https://geoservizi.regione.liguria.it/geoserver/M2555/wms`, vrstva `L10401` (2022; 2019 `M2248:L8256`, 2016 `M1828:L5802`) | **ověřeno: nefunguje** – ServiceException „Failed to create reader from file“ u všech tří | AGEA 2022/2019/2016, celý region | `*` | AGEA | – |
| **Friuli VG** | WMS `https://irdat-ortofoto.regione.fvg.it/geoserver/ortofoto/ows`, vrstva `trueorto_FVG_1720` | **ověřeno**: Terst a Udine velmi ostré, **true ortho** | 2017–2020, asi 10 cm (vizuálně) | **bez CORS** (i OPTIONS 403) | capabilities bez podmínek | bílý JPEG 909 B |
| Friuli VG | `https://serviziogc.regione.fvg.it/geoserver/ORTOFOTO/wms` | **ověřeno**: CORS `*`, ale jen klady listů (bílé) | – | `*` | – | – |
| **Bolzano / Südtirol** | WMS `https://geoservices.buergernetz.bz.it/mapproxy/wms`, vrstva `p_bz-Orthoimagery:Aerial-2023-RGB` | **ověřeno**: Bolzano ostré | 2023, 20 cm, celá provincie | echo | CC BY 4.0 (záznam provincie, ověřeno, oddíl na konci); nálet 2023 ve spolupráci s AGEA | bílý JPEG 4,7 KB (512 px) |
| Bolzano (obce) | tamtéž `gvcc-Orthoimagery:Aerial-<rok>-RGB` | **ověřeno** (abstrakty) | ortofota jednotlivých obcí: Bolzano 2019, Merano 2023, Ora 2024… | echo | ? | bílé mimo obec |
| **Trento** | WMS `https://siat.provincia.tn.it/geoserver/stem/ecw-rgb-2015/wms`, vrstva `ecw-rgb-2015` | **ověřeno**: snímek 200 OK | 2015, 20 cm (stránka provincie) | **bez CORS** | – | – |
| **Marche** | `map.regione.marche.it/arcgis` | **ověřeno**: ortofoto nenabízí | – | echo | – | Sousední ER `Agea2023` pokrývá San Marino, Marche nic. |
| **Umbria** | ArcGIS `https://siat.regione.umbria.it/arcgis/rest/services/public/ORTOFOTO_2020_WGS84_UTM33N/MapServer/export` | **ověřeno**: Perugia | AGEA 2020, 20 cm, celý region (cache v UTM 33, `export` v 3857 funguje) | echo | „© 2020 AGEA – TUTTI I DIRITTI RISERVATI“ | – |
| **Puglia** | ArcGIS `https://webapps.sit.puglia.it/arcgis/rest/services/BaseMaps/Ortofoto2023/ImageServer` | **ověřeno**: Bari ostré | **2023, 20 cm, vlastní projekt regionu** (Puglia Digitale), ne AGEA | echo | neuvedena (pravděpodobně otevřená, neověřeno) | černý JPEG 1 686 B |
| Puglia | tamtéž `Ortofoto2022` | **ověřeno** | AGEA 2022, 20 cm | echo | AGEA, „specifica convenzione“ | černý |
| **Sicilia** | ArcGIS `https://map.sitr.regione.sicilia.it/gis/rest/services/ortofoto/ortofoto_2022_20cm_sicilia/ImageServer` (i `ortofoto_2013_15cm_comuni` MapServer – 15 cm jen obce) | **ověřeno**: Palermo | 2022, 20 cm, celý ostrov (pravděpodobně AGEA, popis prázdný) | `*` | neuvedena | – |
| **Sardegna** | `https://webgis.regione.sardegna.it/geoserverraster/ows` | **neověřeno**: spojení naváže, odpověď nepřijde do 110 s | AGEA 2019, 20 cm (INSPIRE záznam) | ? | AGEA | – |
| Campania, Abruzzo, Molise, Basilicata, Calabria, Valle d'Aosta | – | **nehledáno do hloubky**: zkušební adresy ArcGIS/GeoServeru neodpověděly nebo 404 | – | – | – | Zbytek ve druhém kole, pokud bude potřeba. |

Shrnutí ortofot: technicky použitelná (CORS + Web Mercator + 20 cm) jsou ortofota **Emilia-Romagna, Lazio, Toscana,
Bolzano, Piemonte (jen Torino), Umbria, Puglia, Sicílie**. S otevřenou licencí vlastníka: **Bolzano 2023 (nálet ve spolupráci s AGEA, licence
provincie CC BY 4.0), Torino 2023, Bologna 2023, Modena 2024, ER RER 2023–26 (části regionu)**; Puglia 2023 licenci
neuvádí (oddíl na konci). Lombardie a Ligurie mají služby rozbité, Veneto
a Sardinie neodpovídají, FVG a Trento nemají CORS (jen podklad mapy, ne pruhy).

Ostrost (ověřeno na snímcích 512 px na 60 m): AGEA 2020/2023 rozliší auta a vodorovné značení, AGEA 2023 v ER je měkčí než
2020; Bologna 2023, Torino 2023 a FVG true ortho jsou ostřejší (blíž 10 cm). Toscana má v obraze text s copyrightem
(svislý pruh u okraje), který by detekce čar mohla číst jako značení: snímek oříznout nebo nepoužít.

Výběr ortofota podle regionu (jako `laender.json` u Německa): GISCO NUTS 2 `NUTS_RG_01M_2024_4326_LEVL_2.geojson`
(**ověřeno**, 16,7 MB, 21 regionů IT včetně ITH1 Bolzano a ITH2 Trento zvlášť). Uvnitř ER dál podle pokrytí (RER podle
roků, jinak Agea): ArcGIS `ImageServer/query` vrací obrysy snímků, nebo stačí zkoušet od nejnovějšího a černý obraz
(JPEG pod ~5 KB, průměr 0) přeskočit, jak to `laneImage` dělá u Portugalska.

---

## 2. Mapy povrchů měst

| Město / region | Služba | Ověřený stav | Obsah | Licence | Použitelnost |
|---|---|---|---|---|---|
| **Bologna** (Carta tecnica comunale) | Opendatasoft API `https://opendata.comune.bologna.it/api/explore/v2.1/catalog/datasets/<id>/records?where=within_distance(geo_shape, geom'POINT(lon lat)', 60m)` | **ověřeno**: CORS `*`, GeoJSON, dotaz okolím bodu (data aktualizovaná 22. 11. 2026) | `aree-stradali` **10 636 polygonů ploch silnic** (`descrizion`: „Tracciato principale in tronco“ 6 853, „Tronco di intersezione“ 3 557, mosty, železnice…; `sede`, `fondo` asfalt/dlažba); u Via dell'Indipendenza polygon 782 m² na ~107 m (asi 7 m, odhad z jednoho polygonu; A/B `ab/ZPRAVA.md` ale ukázalo, že plochy jsou často **celý uliční prostor i s chodníky**, proto je mapa vypnutá); `carta-tecnica-comunale-marciapiedi` **13 108 linií obrub** („Ciglio di marciapiede, elemento o spartitraffico“); dále `percorsi-pedonali`, `arredi-urbani` (mobiliář), `binari-ferroviari`, `recinzioni`, `filari-siepi`; ZTL, Città 30, cyklotrasy `piste-ciclopedonali` | **CC BY 4.0** | **Nejlepší italský kandidát**: vozovka jako plocha + obruby chodníků jako čáry (chodník = mezi obrubou a fasádou). Dotaz při kliknutí, 2–3 požadavky. |
| **Lombardia** (DBT regionální, 1 : 1000 ve městech) | ArcGIS `https://www.cartografia.servizirl.it/arcgis2/rest/services/BaseMap/dbtr/MapServer/<vrstva>/query` | **ověřeno**: CORS echo, `f=json` (ne `f=geojson` s outSR 4326) | `106` Area di circolazione veicolare (Milano Duomo: 28 polygonů, `ac_vei_zon` „tronco carreggiata“, `ac_vei_fon`, `ac_vei_sed`, přesnost 1 : 1000); `102` Area stradale (`ar_str_cf` „strada locale“…); `103` cyklo (v bboxu 0); **`104`/`105` pěší plochy: „Failed to execute query“** | neuvedena (Regione Lombardia; IODL/CC BY podle portálu, neověřeno) | Vozovka ano, chodníky jen jako zbytek mezi vozovkou a domy. Celá Lombardie. |
| **Milano** (DBT 2020 města) | `dati.comune.milano.it` (CKAN) | **ověřeno**: SHP 597 MB (`gisportal.comune.milano.it/download/…/DBT_2020.zip`), online služba `gisportal…/arcgis/rest` 404 | celý DBT 2020, 1 : 1000, let 3–4/2020 (strato 01 Viabilità: plochy vozovky, chodníků, cyklo) | **CC BY** | Jen statický soubor při nasazení (předzpracovat na dlaždice); obsah nestahován. |
| **Piemonte** (BDTRE) | WFS `https://geoservices.csi.it/ms/wfs/taims/rp-01/taimswfs/bdtre_viab` (`ac_vei`, `ac_ped`, `ac_cic`, `ar_str`…) | **ověřeno**: CORS `*`, GeoJSON, `srsName=EPSG:4326` | V Turíně `ac_vei` jeden obří polygon (bbox přes celé město), **měřítko 1 : 10 000**, `ac_ped` a `ac_cic` v centru prázdné | neuvedena | Pro profil **nepoužitelné** (hrubé). Torino má vlastní `coto_bdtre` jen jako WMS (obrázek). |
| **Emilia-Romagna** (DBTR) | `servizigis…/arcgis/rest/services/cache/dbtr_*` | **ověřeno**: jen cache dlaždic; WFS `…/wfs/dbtr` 404 | – | – | Vektorově online ne (Bologna má vlastní, viz výše). |
| **Firenze** | INSPIRE záznamy města (`c_d612`, „area di circolazione pedonale“: chodníky, přechody, podloubí) | **neověřeno**: adresu služby jsem nenašla, CKAN API portálu `opendata.comune.fi.it` nevrací JSON | – | open data (záznam) | Zeptat se SIT města (sit@comune.fi.it) nebo hledat dál. |
| **Roma** | GeoRoma (WMS/WFS podle článku) | **nenalezeno** | podklad 1 : 5000 regionu | – | Zatím nic. |

---

## 3. Budovy (výška, podlaží)

| Zdroj | Ověřený stav | Pole | Licence | Poznámka |
|---|---|---|---|---|
| **Bologna** `c_a944ctc_edifici_pl` (Opendatasoft, jako výše) | **ověřeno**: CORS `*`, 35 budov v okruhu 60 m | `altezza_gr` (výška ke hřebeni/okapu), `quota_gron`, `quota_pied`, `volume`, `descrizion` (Edificio generico, Chiesa, Scuola, Portico, Tettoia…) | CC BY 4.0 | **Výška domu i podloubí** (Portico 359 objektů; Bologna je jich plná). |
| **Lombardia** DBT `dbtr/MapServer/94` Unità volumetrica, `97` Corpo edificato | **ověřeno**: CORS echo; 94 vrátil 320 objektů **za 67 s** (pomalé), 97 za ~1 s | 94: `un_vol_av` (výška, m), `un_vol_por`; 97: `edifc_uso` (residenziale…) | neuvedena | Výška ano, ale dotaz na 94 je na kliknutí příliš pomalý; spíš předzpracovat. |
| **Piemonte** BDTRE WFS `…/taimswfs/bdtre_imm`, `un_vol` a `edifc` | **ověřeno**: CORS `*`, GeoJSON, 0,5 s | `un_vol_av` (výška z DSM/DTM ARPA), `edifc_uso`, `edifc_ty`; geometrie z katastru 1 : 2000 | neuvedena | **Použitelné na kliknutí** (celý Piemont). |
| Ostatní regiony a celostátní vrstva | **nenalezeno** | – | – | OSM (`building:levels`, `height`, jen místy). |

---

## 4. Hledání adres a ulic

| Služba | Ověřený stav | Odpověď | Poznámka |
|---|---|---|---|
| **Photon (komoot)** `https://photon.komoot.io/api/?q=…&bbox=6.6,35.4,18.6,47.1` | **ověřeno**, CORS `*` | „Via dell'Indipendenza Bologna“ → 3 úseky (`countrycode: IT`); „Contrada del Collegio San Marino“ → `Città di San Marino`, `SM` | **Použít** (`search-photon.js`: `IT`, `SM`, `VA` do `BOX` a `NATIVE`). Pozor: „Via della Conciliazione“ bez polohy vrátí Piacenzu, Varese, Rovigo – posílat `lat/lon` mapy, jak už se děje. |
| Celostátní registr adres ANNCSU | **neověřeno** | – | API s CORS jsem nehledala. |

Bbox států: IT `[6.63, 35.49, 18.52, 47.09]` (GISCO), SM `[12.40, 43.89, 12.52, 43.99]`, VA `[12.445, 41.900, 12.459, 41.907]`.

---

## 5. OSM (Geofabrik) a hranice Itálie

**Geofabrik, ověřeno 23. 11. 2026** (`index-v1-nogeom.json`, stránka `europe/italy/`): celá Itálie
`europe/italy/italy-latest.osm.pbf` **2,1 GB**; podoblasti: **Nord-Ovest 568 MB, Nord-Est 599 MB, Centro 370 MB, Sud
404 MB, Isole 207 MB** (`tools/countries.mjs` už má díly `it_no`, `it_ne`, `it_c`, `it_s`, `it_i`). Po zabalení odhadem
asi třetina (poměr ČR 0,9 GB → 281 MB), tedy každý díl pod 512 MB.

**Hranice** (**ověřeno**: `CNTR_RG_01M_2024_4326.geojson`, `CNTR_ID` „IT“): 117 polygonů, 7 951 bodů, **2 díry**:
Vatikán (5 bodů) a San Marino (42 bodů). `tools/build_staty.mjs` už má `italy: () => gisco("IT", true)` (s dírami).
Kampione d'Italia je díra ve Švýcarsku (už vyřešeno u CH). Regiony: GISCO NUTS 2 (viz kap. 1b).

---

## 6. San Marino (SM)

**Ortofoto.** Vlastní geoportál San Marina **nenalezen**: `gis.sm`, `geoportale.sm`, `sit.sm` se nepřeloží (DNS),
`territorio.sm` odkazy na GIS nemá; plán správy UNESCO zmiňuje ortofota celé republiky, ale bez veřejné služby
(neověřeno). **San Marino pokrývá ortofoto Emilia-Romagna AGEA 2023** (`…/wms/agea2023_rgb`, `Agea2023_RGB`, **ověřeno**:
Città di San Marino a Serravalle ostré, přehled 12,38–12,54° v. d. bez děr; CORS echo, `EPSG:3857`), stejně AGEA 2020.
Regionální RER 2022–2026 nad San Marinem černé (ověřeno). Marche ortofoto online nemá. Licence: AGEA (kap. 0), San Marino
není italský region, takže je to ještě méně jasné.

**Tip ke zprávě koordinátora:** dotaz na `…/wms/rer2022_rgb` s `RER2022_RGB` v `EPSG:3857` je správný, jen **ta vrstva
nad Boloní ani San Marinem nemá snímky** (nálet RER 2022 je jen pár ostrůvků); 4 779 B je černý JPEG z `exportImage`
512 px, WMS vrací černý 1 686 B na 256 px. Správná vrstva: `agea2023_rgb` / `Agea2023_RGB` (nebo `agea2020_rgb`).

**Mapa povrchů, budovy:** nenalezeny. Odhad z OSM a ortofota.

**OSM** (**ověřeno** na polygonech `.poly` Geofabriku): `italy.poly` San Marino obsahuje, ale **podoblasti ho skoro
vynechávají** (jsou poskládané z italských regionů, San Marino je mezi Nord-Est a Centro díra): z 1 717 bodů sítě uvnitř
San Marina leží 191 jen v Nord-Est, 186 jen v Centro, 14 v obou a **1 326 (77 %) v žádné**, včetně Città di San Marino.
Díly `it_*` tedy San Marino nepokryjí. Samostatný výřez Geofabrik nemá; **openstreetmap.fr** ano:
`https://download.openstreetmap.fr/extracts/europe/san_marino-latest.osm.pbf` (**ověřeno**, 1,6 MB, denně). Doporučení:
vlastní díl `sm` z tohoto výřezu (nebo `osmium extract` z `italy-latest` podle hranice).

**Hranice** (**ověřeno**): GISCO „SM“ 1 polygon, **42 bodů** na 61 km² (průměrně bod po ~1 km, u Monaka bylo 11 bodů na
2 km²). Na rozlišení státu v řezu hrubé jen u hranice; doporučuji jako u Monaka hranici z OSM (admin_level 2, relace
San Marina, © OSM ODbL), zjednodušenou na ~30 m, a před Itálií v `staty.json`.

---

## 7. Vatikán (VA)

**Ortofoto.** **Pokrývá ho ortofoto Lazio AGEA 2023** (`geoportale.regione.lazio.it/geoserver/ows`,
`geonode:2023_AGEA_25833_COG`, **ověřeno**: kupole sv. Petra a ulice kolem, CORS `*`, `EPSG:3857`). Licence AGEA (kap. 0).
Celostátní PCN by ho pokrylo také, ale jen http a 50 cm. Vlastní služba Vatikánu: nenalezena (nehledala jsem do hloubky;
stát o 0,44 km² ji sotva má).

**OSM:** Vatikán **leží v Geofabrik `italy/centro`** (ověřeno na `centro.poly`), díl `it_c` ho tedy obsahuje.
openstreetmap.fr má i `europe/vatican_city-latest.osm.pbf` (**ověřeno**, 3,1 MB), není potřeba.

**Hranice** (**ověřeno**): GISCO „VA“ = **5 bodů** (čtyřúhelník 12,446–12,459 / 41,900–41,907), díra v Itálii je stejná.
To je na stát velikosti 1 × 0,7 km **nepoužitelně hrubé** (Svatopetrské náměstí a Via della Conciliazione by padaly
napůl). Doporučuji hranici z OSM (admin_level 2, Città del Vaticano) jako u Monaka, uloženou v `tools/vatican-border.json`,
a v `staty.json` před Itálií; z italské díry pak počítat stejně (díru GISCO nahradit polygonem OSM, nebo nechat přednost
Vatikánu jako u Monaka před Francií).

**Mapa povrchů, budovy:** nenalezeny; ulic je ve Vatikánu pár. Odhad z OSM a ortofota.

---

## Shrnutí

| Oblast | Zdroj | Stav | CORS | Licence | Doporučení |
|---|---|---|---|---|---|
| Ortofoto celostátní | PCN/MASE 2012 | ověřeno, 50 cm, jen http | `*` | bez podmínek | Ne (http, staré) |
| Ortofoto ER | `agea2023_rgb` (+ `agea2020_rgb`) | ověřeno, 20 cm, celý region + SM | echo | AGEA | Technicky ano; licenci vyjasnit |
| Ortofoto ER otevřené | RER 2023/24, 2025/26, Bologna 2023, Modena 2024 | ověřeno, 15–20 cm, části | echo | CC BY 4.0 (RER) | **Použít, kde jsou** (Bologna, Modena, Parma, Apeniny) |
| Ortofoto Lazio | `geonode:2023_AGEA_25833_COG` | ověřeno, 20 cm, + Vatikán | `*` | AGEA | Technicky ano; licence |
| Ortofoto Toscana | `rt_ofc.5k22.32bit` | ověřeno, 20 cm, copyright v obraze | `*` | AGEA, jen institucionální | Ne (licence i nápis) |
| Ortofoto Bolzano | `p_bz-Orthoimagery:Aerial-2023-RGB` | ověřeno, 20 cm | echo | CC BY 4.0 (provincie; nálet s AGEA) | **Použito** |
| Ortofoto Torino | `coto_ortofoto_2023` | ověřeno, ~10 cm | `*` | CC BY 4.0 (ověřeno) | **Použito** |
| Ortofoto Puglia | `Ortofoto2023` ImageServer | ověřeno, 20 cm, vlastní nálet | echo | neuvedena | **Použít** po ověření licence |
| Ortofoto Umbria, Sicílie | ArcGIS 2020 / 2022 | ověřeno, 20 cm | echo / `*` | AGEA („tutti i diritti“) / ? | Licence |
| Ortofoto FVG, Trento | true ortho 2017–20 / 2015 | ověřeno | **ne** | – | Jen podklad mapy |
| Ortofoto Lombardia, Liguria | 2021 / 2022 | ověřeno: služby chybují | echo / `*` | AGEA | Ne (zkusit později) |
| Ortofoto Veneto, Sardinie | IDT2 / geoserverraster | neodpovídají | ? | AGEA | – |
| Mapa povrchů | **Bologna** aree stradali + obruby | ověřeno | `*` | CC BY 4.0 | Zapojeno, ale **vypnuté** (`?bologna=1`; A/B: celé uliční prostory) |
| Mapa povrchů | Lombardia DBT `106` vozovka | ověřeno, 1 : 1000 | echo | ? | Použít po A/B (bez chodníků) |
| Mapa povrchů | Milano DBT 2020 SHP | ověřeno, 597 MB | – | CC BY | Statický soubor, později |
| Mapa povrchů | Piemonte BDTRE | ověřeno, 1 : 10 000 | `*` | ? | Ne (hrubé) |
| Budovy | Bologna (`altezza_gr`), Piemonte `un_vol` | ověřeno | `*` | CC BY 4.0 / ? | **Použít** |
| Budovy | Lombardia `un_vol` | ověřeno, 67 s | echo | ? | Jen předzpracovat |
| Hledání | Photon | ověřeno (IT, SM) | `*` | ODbL | Přidat `IT`, `SM`, `VA` |
| OSM | Geofabrik 5 dílů (207–599 MB) | ověřeno | – | ODbL | Díly `it_*` (už v `countries.mjs`) |
| OSM San Marino | openstreetmap.fr `san_marino` 1,6 MB | ověřeno; Geofabrik díly ho z 77 % vynechávají | – | ODbL | **Vlastní díl `sm`** |
| OSM Vatikán | v `italy/centro` | ověřeno | – | ODbL | Nic navíc |
| Hranice IT | GISCO s dírami SM, VA | ověřeno | – | © EuroGeographics | už v `build_staty.mjs` |
| Hranice SM / VA | GISCO 42 / **5** bodů | ověřeno | – | – | **OSM hranice** jako u Monaka |
| Regiony | GISCO NUTS 2 (21) | ověřeno | – | © EuroGeographics | `regioni.json` jako `laender.json` |

**Doporučení.** Itálie je jako Německo: ortofoto po regionech podle NUTS 2. Na rozdíl od Německa ale většinu regionálních
ortofot vlastní AGEA a půjčuje je jen pro institucionální účely; bez souhlasu AGEA je bezpečné zapojit jen ortofota s otevřenou licencí vlastníka:
**Bolzano 2023 (s AGEA, licence provincie CC BY 4.0), Puglia 2023 (licence neuvedena), Torino 2023, Bologna 2023, Modena 2024 a ER RER 2023–26**. AGEA vrstvy (ER, Lazio, Umbria,
Sicílie, Toscana) jsou technicky připravené (CORS, Web Mercator, 20 cm), stačí rozhodnutí o licenci (Bára, případně
dotaz na AGEA). Lombardie a Ligurie mají služby teď rozbité, Veneto a Sardinie neodpovídají; ostatní jih nehledán
do hloubky. Mapa povrchů: **Bologna** (plochy vozovky a obruby chodníků, CC BY 4.0, CORS) je nejlepší kandidát na první
město; Lombardie má z DBT vozovku 1 : 1000 (bez chodníků). Výška domů: Bologna, Piemonte (rychlé WFS), Lombardie (pomalé).
Hledání Photon. OSM v pěti dílech; **San Marino potřebuje vlastní díl** (Geofabrik ho v podoblastech vynechává),
Vatikán je v `centro`. Hranice San Marina a hlavně Vatikánu (5 bodů) brát z OSM jako u Monaka; ortofoto je pokrývá
z ER (SM) a Lazia (VA), obojí AGEA.

Neověřeno v době rešerše (licence ER RER, Bologna, Modena, Torino, Bolzano a Puglia ověřené později, oddíl na konci):
Sicílie 2022; AGEA geoportál a jeho služby; Veneto IDT2 a Sardinie (neodpovídaly); Campania, Abruzzo, Molise,
Basilicata, Calabria, Valle d'Aosta, Marche (bez ortofota online); Firenze a Roma (mapa povrchů); zda Bologna
`aree-stradali` zahrnuje i parkovací pruhy; čísla relací OSM pro San Marino a Vatikán.

## Ověření licencí otevřených ortofot (23. 11. 2026)

Zkontrolováno v oficiálních katalozích a v metadatech služeb (jen několik dotazů, bez osobních údajů). Otevřená znamená CC BY 4.0, CC0, IODL 2.0.

| Dataset | Licence (citace) | Zdroj | Verdikt |
|---|---|---|---|
| Bolzano/Südtirol 2023, WMS `https://geoservices.buergernetz.bz.it/mapproxy/wms`, vrstva `p_bz-Orthoimagery:Aerial-2023-RGB` (20 cm) | „Ortofoto 2023, risoluzione 20cm; L'utilizzo dei dati è vincolato dal rispetto delle condizioni di cui al modello di licenza Creative Commons BY 4.0“ (odkazy na `licenses/by/4.0/deed.it` a `deed.de`). Capabilities služby mají jen `Fees: none`, `AccessConstraints: none`; obecná CC0 u provincie neplatí, tohle je výslovně CC BY. Vyžaduje uvedení autora (Autonome Provinz Bozen – Südtirol). | https://geonetwork1.civis.bz.it/geonetwork/srv/api/records/p_bz:Orthoimagery:Aerial-2023-RGB | otevřená (CC BY 4.0) |
| Puglia 2023, ImageServer `https://webapps.sit.puglia.it/arcgis/rest/services/BaseMaps/Ortofoto2023/ImageServer` (WMS: `https://webapps.sit.puglia.it/arcgis/services/BaseMaps/Ortofoto2023/ImageServer/WMSServer`) | Žádná licence nenalezena. Popis služby: „Ortofoto 2023 acquisita nell'ambito di progetto Puglia Digitale Ecosistema Agricoltura, Territorio e Ambiente“, `copyrightText` prázdný; WMS bez AccessConstraints. V CKAN dati.puglia.it (`package_search`) záznam ortofoto 2023 není; v repertoriu `repertorio.sit.puglia.it` také ne. Starší ortofota Puglie (2006, 2015) mají IODL 2.0, ale u 2023 to nelze předpokládat (část ortofot Puglie je AGEA; SIT portál vyžaduje přihlášení). | https://pugliacon.regione.puglia.it/web/sit-puglia-sit/web-map-service3 (jen výpis služby), https://dati.puglia.it/ckan | nenalezeno (neintegrovat bez dotazu na InnovaPuglia, info@sit.puglia.it) |
| Torino 2023 (let 3.–5. 3. 2023), WMS `https://geomap.reteunitaria.piemonte.it/mapproxy/service?` vrstva `coto_ortofoto_2023` (CRS 32632, 3857, 4326, 3003, 23032; mapproxy, capabilities `https://geomap.reteunitaria.piemonte.it/WEBCAT/CAPABILITIES/wms_coto_ortofoto_2023.xml`) | Metadata datasetu „Ortofoto digitale colore 2023“ (vlastník Comune di Torino): odkaz `https://creativecommons.org/licenses/by/4.0/deed.it`. Obecné licenční podmínky Geoportálu Torina: „La Città di Torino autorizza la libera e gratuita consultazione, estrazione, riproduzione e modifica dei dati in esso/a contenuti da parte di chiunque (Licenziatario) vi abbia interesse per qualunque fine, purchè nel rispetto dei termini della Licenza ‚Creative Commons public licence‘ Attribuzione - 4.0 (ITALIA)“; uvedení: „Base cartografica realizzata da [Licenziatario], integrata con [Livelli informativi o Servizi][data] della Città di Torino reperiti sul Geoportale del Comune di Torino“. Pozor: záznam samotné WMS služby („Ortofoto 2023 – Geo-servizio WMS“) má „Condizioni sconosciute“, platí tedy licence datasetu. Také se žádá kopie odvozenin na geoportale@comune.torino.it (spíše pro shapefile). aperto.comune.torino.it dataset ortofoto nemá. | https://www.geoportale.piemonte.it/geonetwork/serv/api/records/c_l219:e9b9f64d-ae84-4ed8-82d5-32113a3c0c0d ; http://geoportale.comune.torino.it/web/cartografia/licenze-duso ; službový záznam https://www.geoportale.piemonte.it/geonetwork/srv/api/records/c_l219:7e6d1f14-3270-4b9e-a1b5-eff4e2e996a4 | otevřená (CC BY 4.0; uvést Città di Torino) |
| Bologna 2023 RGB, `public/Comune_BO_2023_RGB`, WMS `https://servizigis.regione.emilia-romagna.it/wms/comune_bo_2023_rgb` (20 cm, resampling z 5 cm, let 19.–26. 6. 2023, Comune di Bologna / CGR) | Katalog: „Tipo di licenza: CC BY 4.0 (Creative Commons - Attribuzione)“. Capabilities služby prázdné. | https://geoportale.regione.emilia-romagna.it/catalogo/dati-cartografici/cartografia-di-base/immagini/layer-1740409830.74 ; zpráva https://geoportale.regione.emilia-romagna.it/notizie/servizi-e-applicazioni/ortofoto-dtm-comuni-bo-mo | otevřená (CC BY 4.0) |
| Modena 2024 RGB, `public/Comune_MO_2024_RGB`, WMS `https://servizigis.regione.emilia-romagna.it/wms/comune_mo_2024_rgb` (20 cm, let 17. 5.–5. 6. 2024; publikováno 18. 2. 2025) | „Tipo di licenza: CC BY 4.0 (Creative Commons - Attribuzione)“ | https://geoportale.regione.emilia-romagna.it/catalogo/dati-cartografici/cartografia-di-base/immagini/layer-1740409832.65 | otevřená (CC BY 4.0) |
| Emilia-Romagna RER 2023/24 RGB, `public/RER2023_24_RGB`, WMS `https://servizigis.regione.emilia-romagna.it/wms/rer2023_24_rgb` (20 cm, publikováno 19. 2. 2024) | „Tipo di licenza: CC BY 4.0 (Creative Commons - Attribuzione)“ (datová i WMS karta) | https://geoportale.regione.emilia-romagna.it/catalogo/dati-cartografici/cartografia-di-base/immagini/layer-14 ; https://geoportale.regione.emilia-romagna.it/servizi/servizi-ogc/elenco-capabilities-dei-servizi-wms/cartografia-di-base/service-47 | otevřená (CC BY 4.0) |
| Emilia-Romagna RER 2025/26 RGB, WMS `https://servizigis.regione.emilia-romagna.it/wms/rer2025_26_rgb` (publikováno 3. 9. 2026, projekt běží, pokrytí se doplňuje) | „Tipo di licenza: CC BY 4.0 (Creative Commons - Attribuzione)“ | https://geoportale.regione.emilia-romagna.it/catalogo/dati-cartografici/cartografia-di-base/immagini/copy_of_layer-8 | otevřená (CC BY 4.0) |
| (pro kontrast) Emilia-Romagna AGEA 2023 RGB, `Agea2023_RGB` | „Tipo di licenza: Utilizzo ristretto dei dati“; „Il Prodotto è concesso in Licenza d'uso a Regione Emilia-Romagna“; „Solo consultabili“ | https://geoportale.regione.emilia-romagna.it/catalogo/dati-cartografici/cartografia-di-base/immagini/layer-16 | neotevřená (nepoužít) |

Poznámky:
- Emilia-Romagna: vrstvy RER a Bologna/Modena jsou CC BY 4.0, ale pokrývají jen část regionu (RER 2023/24 a 2025/26 podle dodaných oblastí, viz WMS `metadati_raster`); zbytek regionu zůstává AGEA 2023 (neotevřená). Atribuce: „Regione Emilia-Romagna“ (u Bologny a Modeny Comune di Bologna / Modena, CGR).
- Mapproxy Bolzana a Torina dovolují Web Mercator (EPSG:3857); Torino vrstva leží jen v obdélníku 7,47–7,88 E, 44,94–45,21 N.
- Katalog INSPIRE Geoportal z tohoto prostředí nebyl dosažitelný (DNS), záznamy jsou citovány z katalogů zdrojů a z výsledků vyhledávání.
