# Data pro Portugalsko: ověřené otevřené služby (pro profil ulic)

Ověřeno 23. 11. 2026, asi 110 požadavků, User-Agent `profily-ulic`, pauza 1 s, Origin `https://streetspace.eu`. Overpass
ani Nominatim nebyly použity, žádné osobní údaje se neposílaly, Referer se nepodvrhoval.

Značení: **ověřeno** = odpověď přišla a byla přečtena; **neověřeno** = jen z dokumentace, katalogu nebo vyhledávání, bez
dotazu. CORS „`*`“ = `Access-Control-Allow-Origin: *`; „echo“ = server vrací náš Origin, z prohlížeče to funguje stejně;
„bez CORS“ = hlavička chybí (obrázek jde zobrazit v `<img>`, ale ne číst pixely ani JSON z `fetch`).

Zkušební body: Lisboa Av. da Liberdade (-9,1456, 38,7200), Porto Av. dos Aliados (-8,6110, 41,1480), Faro (-7,9350,
37,0170), Funchal (-16,9086, 32,6476), Ponta Delgada (-25,6687, 37,7412), Vila do Porto (-25,1446, 36,9446), mimo
Portugalsko Badajoz (-6,97, 38,88).

---

## 1. Ortofoto

### 1a. Pevnina (DGT, Direção-Geral do Território)

| Zdroj | Ověřený stav | Rozlišení, datum, pokrytí | Licence | Poznámka |
|---|---|---|---|---|
| **Ortos 2025** `https://cartografia.dgterritorio.gov.pt/wms/ortos2025` (totéž `https://geo.dgterritorio.gov.pt/wms/ortos2025`), vrstva `Ortos2025-RGB` | **ověřeno**: GetMap 1.3.0 `EPSG:3857` 200, `image/jpeg`, CORS `*` na obou hostech; Lisboa, Porto, Faro ostré snímky (40–55 KB na 512 px) | GSD **0,25 m**, RGB+NIR, nálet 29. 3. – 26. 7. 2025 ve 4 pásech (katalog dados.gov.pt, ověřeno). Vrstva `Enquadramento_Ortos2025` (klad listů 8 × 5 km) **pokrývá celou pevninu** (GetMap ověřen); Madeiru ani Azory ne | **CC BY** (dados.gov.pt „Ortofotos 25 cm – Portugal Continental – 2025“, `license: cc-by`, ověřeno; dataset HVD); capabilities: Fees „no conditions apply“, AccessConstraints „None“ | **Nejnovější a celostátní: použít jako hlavní.** Kredit „© DGT“ (přesné znění podle DGT neověřeno). WMTS `geo.dgterritorio.gov.pt/wmts/ortos2025` existuje (ověřeno), ale jen v matici `PTTM_06` (EPSG:3763), takže pro nás WMS. |
| **Ortos 2021** `https://cartografia.dgterritorio.gov.pt/wms/ortos2021`, `Ortos2021-RGB` | **ověřeno**: CORS `*`, `EPSG:3857`; Porto ostré, **Lisboa a Faro prázdné** | Katalog: „zona norte“, GSD **0,30 m** (název datasetu říká 25 cm, popis 0,30 m). Klad `Enquadramento_Ortos2021` (GetMap ověřen) pokrývá **jen sever pevniny, zhruba nad 39,6° s. š.** (Porto, Braga, Aveiro, Coimbra ano; Leiria na hraně; Lisboa, Alentejo, Algarve ne) | CC BY (dados.gov.pt, ověřeno) | Starší a horší než 2025: nepoužívat. |
| **Ortos 2018** `https://cartografia.dgterritorio.gov.pt/wms/ortos2018`, `Ortos2018-RGB` | **ověřeno**: CORS `*`, `EPSG:3857`, Lisboa, Porto, Faro ostré | GSD 0,25 m, celá pevnina (klad ověřen) | CC BY (dados.gov.pt, ověřeno) | Jen záloha. Starší ročníky: `ortos2015` odpovídá (capabilities 200), 50 cm. `ortos2019/2020/2022/2023/2024` neexistují (404). |
| **OrtoSat 2023** `https://ortos.dgterritorio.gov.pt/wms/ortosat2023`, `ortoSat2023-CorVerdadeira` | **ověřeno**: CORS `*`, `EPSG:3857`, Lisboa, Porto, Faro | Družicové snímky 2023, **30 cm**, celá pevnina (katalog, ověřeno; i v OGC API `ogcapi.dgterritorio.gov.pt/collections/ortos-rgb`) | CC BY (dados.gov.pt, ověřeno) | Viditelně měkčí než letecké 2025; nepotřebujeme. |

**Prázdné místo** (ověřeno): mimo pokrytí vrstvy (Ortos2021 v Lisabonu i Ortos2025 u Badajozu ve Španělsku) vrací server
200 a **bílý JPEG 1 819 B** (průměr 1,0, odchylka 0). S `FORMAT=image/png&TRANSPARENT=true` přijde **plně průhledné PNG**
(139 B, alfa 0). Detekce prázdna: velikost odpovědi pod ~2 KB nebo čistě bílý obraz. Ortofoto tedy omezit na pevninu
(hranice státu bez ostrovů), jinak by se bílá četla jako beton.

Kontrola ostrosti (ověřeno, Av. dos Aliados, 32 × 32 m na 256 px): 2025 a 2021 rozliší dopravní značení a obrubníky,
OrtoSat 2023 je rozmazanější. 2025 vypadá jako běžné ortofoto (domy se mírně naklánějí), ne „true ortho“.

### 1b. Madeira a Azory (vlastní vlády regionů)

| Zdroj | Ověřený stav | Rozlišení a datum | Licence | Poznámka |
|---|---|---|---|---|
| **Madeira, IRIG (Direção Regional do Ordenamento do Território)** `https://irig-sig.madeira.gov.pt/ows/pg/qwc_config/DIR_orto_mosaico`, vrstva `Ortos` (skupina `madeira_p1`–`p4`, `portosanto`, `desertas`) | **ověřeno**: QGIS Server, capabilities nabízí `EPSG:3857`, GetMap Funchal 200, `image/jpeg`, CORS `*`, 0,6 s; obraz velmi ostrý | **GSD 10 cm**, nálet 20. 6. – 5. 10. 2023, Madeira, Porto Santo, Desertas (katalog, ověřeno) | dados.gov.pt `notspecified`; capabilities Fees „conditions unknown“, AccessConstraints „None“ (ověřeno) | **Použitelné technicky**; licenci se zeptat (IRIG). |
| **Azory, Secretaria Regional do Ambiente e Ação Climática** `https://ambiente.azores.gov.pt/qgisserver/<ostrov>/orto2024/qgis_mapserv.fcgi`, vrstvy `ortofotomapa_2024_<ostrov>` (`smg` São Miguel, `ter`, `fai`, `pic`, `sjo`, `gra`, `flo`, `cor`, `sma`) | **ověřeno**: GetMap v `EPSG:3857` 200 a ostrý obraz (Ponta Delgada, Vila do Porto), i když capabilities uvádí jen 4326, 5013, 5015; **bez CORS** (za Cloudflare). OGC API `…/idea-api/collections` vrací 403 (výzva Cloudflare) | **10 cm** (GSD 8 cm), léto 2024, všech 9 ostrovů (9 datasetů na dados.gov.pt, ověřeno) | **CC BY** (dados.gov.pt, ověřeno); capabilities Fees „conditions unknown“ | Jako podklad mapy (`<img>`/dlaždice) ano; pro pruhy z ortofota (čtení pixelů) ne bez CORS. Jeden endpoint na ostrov: v aplikaci rozhodnout podle ostrova. Starší 40 cm (2004–2008) na `wssig4.azores.gov.pt/geoserver` (neověřeno). |

---

## 2. Mapy povrchů měst

### 2a. Shrnutí po městech

Online mapu povrchů (polygony vozovky, chodníku, cyklostezky, stání) s CORS **jsem v Portugalsku nenašla**. Národní model
velkoměřítkové kartografie je CartTop (DGT: NdD1 ~ 1 : 1000–2000, NdD2 ~ 1 : 10 000); online je k vidění jen NdD2
Madeiry (bez chodníků).

| Město | Služba | Ověřený stav | Obsah | Licence | Použitelnost |
|---|---|---|---|---|---|
| **Lisboa** | `geodados.cm-lisboa.pt` (ArcGIS), `dados.cm-lisboa.pt` (CKAN) | **ověřeno: 403 s výzvou Cloudflare** („Just a moment…“, `cf-mitigated: challenge`) i pro API a pro soubory ke stažení | Katalog (přes dados.gov.pt, ověřeno): **„Cartografia Numérica Vetorial“ 1 : 1000, jen DWG v 7z** po listech (431-1, 431-2, 431-3/4, 417), katalog objektů v PDF | CC BY (dados.gov.pt) | Online ne; stažení z našeho připojení blokuje výzva (CAPTCHA neobcházíme). Až po domluvě s městem, nebo ručním stažením Bárou a předzpracováním DWG. |
| **Lisboa, ArcGIS Online města** `https://services.arcgis.com/1dSrzEWVQn5kHHyK/arcgis/rest/services` | **ověřeno**: CORS `*`, `query` s bboxem a `f=geojson` funguje | Žádné plochy ulic. Užitečné: `Edificado_e_Vias/FeatureServer/0` **obrysy budov** (35 v bboxu ~170 × 150 m na Av. da Liberdade; pole `IDTIPO`, `MORADA`, bez podlaží a roku; zdroj kartografie 1 : 1000), `/1` osy ulic; `Ciclovias` (rede ciclável, zóny 30, ZAAC, stojany); `Ambiente_DMEVAE/0` stromy; `Cartografia_Base` (bloky „Quarteirões“, osy) | CC BY / CC0 podle datasetu (dados.gov.pt) | Obrysy budov = poloha fasád (jako RÚIAN). Plochy chodníků ne. |
| **Porto** | `mapas.cm-porto.pt` (dřív `geo.cm-porto.pt`, `sig.cm-porto.pt`) | **ověřeno: 500 „Serviço indisponível“** se zobrazenou IP klienta na všech cestách (`/server/rest`, `/arcgis/rest`, `/geoserver/ows`); spíš blokace cizí IP než výpadek (neověřeno) | - | - | Nezjištěno. Katalog `dadosabertos.cm-porto.pt` (CKAN, 69 datasetů, **bez CORS**) plochy ulic nemá; viz stání a BUS (kap. 5). |
| **Cascais** GeoCascais `https://geocascais.cascais.pt/geoserver/ows` | **ověřeno**: WFS 2.0 capabilities 200, ale **prázdný seznam vrstev** pro anonymní dotaz; hlavičky CORS bez `Allow-Origin` | - | - | Online ne. Statické soubory viz stání (kap. 5). |
| **Oeiras** `oeirasinterativa.oeiras.pt/dadosabertos` | katalog **ověřen** přes dados.gov.pt | „Cartografia Topográfica 2016/2010 – Altimetria e Planimetria“ 1 : 2000, **planimetrie jen DWG**, SHP jen „domínios“; ortofoto 10 cm 2020 jen jako PDF plakát | CC BY-SA | Jen předzpracování DWG při nasazení (obsah neověřen, nestahováno). |
| **Madeira (Funchal)** IRIG `…/qwc_config/DIR_cartografia_topografica_Nd2` | **ověřeno**: WMS capabilities (CORS `*`), WFS na stejné adrese „Service unknown“ | CartTop NdD2: `area_infra_trans_rodov`, `segmento_via_rodov`, `via_rodov_limite` (okraje silnic), hydrografie, výšky; **bez chodníků**. Ke stažení GPKG `irig-storage.madeira.gov.pt/irig-catalogo/Cart_Topo_Nd2.gpkg` (neověřeno) | `notspecified` | Malý přínos (měřítko 1 : 10 000); funchalský NdD1 neveřejný. |
| Braga, Coimbra, Aveiro, Almada, Matosinhos | - | **nenalezeno**: na dados.gov.pt nemají žádné datasety (Almada, Matosinhos, Braga 0; Aveiro 1, Coimbra jen „Mobilidade Suave“ SHP), hledání ArcGIS Online (`arcgis.com/sharing/rest/search`) dalo jen studentské a turistické vrstvy | - | - | Zatím nic. |

### 2b. Poznámka

Vyhledávání v katalogu SNIG (`snig.dgterritorio.gov.pt/rndg`, ověřeno) ani na dados.gov.pt nenašlo pro žádné město vrstvu
„passeios“ (chodníky), „faixa de rodagem“ (vozovka) ani „lancis“ (obrubníky). Portugalsko je v tom jako Francie mimo
Paříž: **odhad z OSM a ortofota**.

---

## 3. Budovy

| Zdroj | Ověřený stav | Pole | Licence | Poznámka |
|---|---|---|---|---|
| Celostátní vrstva budov s podlažími | **nenalezena**. DGT OGC API (`ogcapi.dgterritorio.gov.pt/collections`, CORS echo, ověřeno) budovy nemá (má katastr parcel `cadastro`, CAOP, COS, ortofota). INE Base Geográfica de Edifícios (body budov ze sčítání) jen v katalogu INSPIRE; `inspire.ine.pt` přesměrovává na „manutenção“ (ověřeno). BUPi má jen hranice pozemků | - | - | Domy z OSM (výška/podlaží jen místy). |
| **INE BGRI 2021** (statistické podsekce = bloky) přes **geoapi.pt** `https://json.geoapi.pt/gps/{lat},{lon}/detalhes` | **ověřeno**: 200, CORS `*` | Za blok: `N_EDIFICIOS_1_OU_2_PISOS`, `N_EDIFICIOS_3_OU_MAIS_PISOS`, `N_EDIFICIOS_CONSTR_ANTES_1945`, `…_1946_1980`, `…_1981_2000`, `…_2001_2010`, `…_2011_2021`, počty bytů. Av. da Liberdade: 6 budov, všech 6 se 3+ podlažími, 5 před 1945 | INE: CC BY (dados.gov.pt u datasetů INE); geoapi.pt je **komunitní služba** (ne úřední) | **Plošný odhad vzhledu domu** (jako pražský Vývoj zástavby): nízká/vysoká zástavba, stáří. Lépe stáhnout BGRI 2021 od INE při nasazení (statický soubor) než volat cizí službu při kliknutí. |
| **Lisboa** `Edificado_e_Vias/FeatureServer/0` | **ověřeno** (viz 2a) | obrys, `IDTIPO` (2 = budova, 10005 jiné), adresa; **bez podlaží a roku** | CC BY | Obrysy fasád Lisabonu. |

---

## 4. Hledání adres a ulic

| Služba | Ověřený stav | Odpověď | Licence | Poznámka |
|---|---|---|---|---|
| **Photon (komoot)** `https://photon.komoot.io/api/?q=…&bbox=-31.3,32.6,-6.18,42.16` | **ověřeno**, 200, CORS `*` | „Rua de Santa Catarina Porto“ → 5 úseků ulice (`osm_key: highway`, `city: Porto`, `countrycode: PT`) | ODbL (OSM) | **Použít** (`search-photon.js`, přidat `PT` do `BOX` a `NATIVE`). Bbox státu i s ostrovy: `[-31.3, 32.6, -6.18, 42.16]`. |
| DGT OGC API CAOP `…/collections/municipios/items?bbox=…` (i `freguesias`) | **ověřeno**, 200, CORS echo, GeoJSON | obec, okres, NUTS | CC BY (DGT, neověřeno v odpovědi) | Jen správní celky, ne ulice. Na „město řezu“ stačí statický soubor (GISCO/CAOP). |
| geoapi.pt `/gps/{lat},{lon}` | **ověřeno**, CORS `*` | okres, obec, farnost, využití půdy | komunitní | Ne pro hledání ulic. |
| Úřední geokodér DGT | **nenalezen** | - | - | Neexistuje veřejně (jen v katalogu SNIG). |

---

## 5. Parkování a vyhrazené pruhy

| Zdroj | Ověřený stav | Pole | Licence | Poznámka |
|---|---|---|---|---|
| **Lisboa EMEL** „Lugares de estacionamento na via pública“ `https://dados.emel.pt/dataset/7e0c9ceb-…/download/listregulatedandresidentsparkingspaces.json` | **ověřeno**: 200, `application/json`, 12,7 MB, **bez CORS** | **11 979 úseků** jako lomená čára (`coordenadas`, WGS 84), **`estacionamentoOrientacao`**: Longitudinal 6 672, De topo (kolmé) 2 604, Em espinha 60° 1 595, 45° 734, „sobre o passeio“ (na chodníku) 34; `tipologia` (Tarifado, Residente…), `zona`, `lugarQTD` (celkem 102 164 míst), aktualizováno 21. 10. 2026 | **CC BY-SA** (dados.gov.pt, ověřeno) | **Výborné: poloha i orientace stání po úsecích** (lepší než Madrid). Statický soubor při nasazení. Další EMEL: hranice zón ZEDL/ZAAC, tarifní oblasti (polygony), rede ciclável. |
| **Porto** `dadosabertos.cm-porto.pt` | **ověřeno**: GeoJSON 200, **bez CORS** | `eixos-tarifados` 812 linií (ulice s placeným stáním), `lugares-de-estacionamento-…-zona-ocidental` 3 862 bodů (místa, jen západ města), **`corredores-bus` 63 linií** (`estado_corredor`, `orientacao_circulacao`, `horario_bus`), `ciclovias`, `marcas-rodoviarias…` (body) | **CC0** (CKAN, ověřeno) | Statické soubory při nasazení: BUS pruhy a placené stání v Portu. |
| **Cascais** `dadosabertos.cascais.pt` „Estacionamento“ | **ověřeno**: GeoJSON 200 (`application/geo+json`), bez CORS | **8 116 ploch stání** (MultiPolygon 8 015): `tipo` Livre 7 040, Parcómetro 797, Atribuído 164…, `capacidade` | CC BY (dados.gov.pt) | Plochy stání jako polygony: kandidát na doplnění stání v Cascais (statický soubor). Ciclovias tamtéž. |
| AML „Oferta de Estacionamento na Área Metropolitana de Lisboa“ | jen v katalogu SNIG (OGC API Maps), **neověřeno** | - | - | - |

---

## 6. OSM (Geofabrik) a hranice

**Geofabrik, ověřeno 23. 11. 2026** (`index-v1.json` a stránka `europe/portugal/`): `europe/portugal/portugal-latest.osm.pbf`
**409 MB**, **bez podoblastí**. Polygon výřezu sahá od -31,6° do -6,18° v. d. a od 29,7° s. š.: **obsahuje Madeiru i Azory**
(i Selvagens). Azory jsou navíc samostatně `europe/azores/azores-latest.osm.pbf` (není potřeba). Madeira samostatný výřez
nemá. Jeden díl `pt` → `europe/portugal/portugal`; po zabalení odhadem ~150 MB (poměr ČR), takže pod 512 MB a jen na R2
jako ostatní nové státy.

**Hranice** (**ověřeno**: `CNTR_RG_01M_2024_4326.geojson`, `CNTR_ID` „PT“): 41 polygonů, pevnina (15; -9,52 až -6,19,
36,96 až 42,15), Madeira s Porto Santo a Selvagens (15; -17,26 až -15,86, 30,03 až 33,13), Azory (11; -31,27 až -25,01,
36,93 až 39,73). `tools/build_states.mjs` už má `portugal: () => gisco("PT")` (bez filtru, ostrovy zůstanou). Pro
rozlišení ortofota (pevnina / Madeira / Azory) stačí obdélníky výše; ostrovy Azor po jednom kvůli endpointům.

---

## Shrnutí

| Oblast | Zdroj | Stav | CORS | Licence | Doporučení |
|---|---|---|---|---|---|
| Ortofoto pevnina | DGT `ortos2025` WMS | ověřeno, 25 cm, 2025, celá pevnina | `*` | CC BY | **Použít** (`res: 0.25`, jako `ES_ORTHO`); jen na pevnině, bílý JPEG 1,8 KB = prázdno |
| Ortofoto pevnina | DGT `ortos2021` / `ortos2018` / `ortosat2023` | ověřeno | `*` | CC BY | Ne (2021 jen sever a 30 cm; 2018 starší; 2023 družice) |
| Ortofoto Madeira | IRIG `DIR_orto_mosaico` | ověřeno, 10 cm, 2023 | `*` | nespecifikováno | Použít po dotazu na licenci (`res: 0.1`) |
| Ortofoto Azory | `ambiente.azores.gov.pt/qgisserver/<ostrov>/orto2024` | ověřeno, 10 cm, 2024 | **ne** | CC BY | Jen jako podklad mapy; pro pruhy z ortofota ne (bez CORS) |
| Mapa povrchů | žádné město online | Lisboa DWG za Cloudflare, Porto nedostupné, Cascais WFS prázdný | - | - | Odhad z OSM a ortofota (`ortho-osm.js`) |
| Fasády | Lisboa `Edificado_e_Vias/0` | ověřeno, obrysy | `*` | CC BY | Použít v Lisabonu (A/B) |
| Domy (vzhled) | INE BGRI 2021 (bloky: 1–2 / 3+ podlaží, stáří) | ověřeno přes geoapi.pt | `*` | CC BY (INE) | Statický soubor od INE při nasazení; jinak OSM |
| Hledání | Photon | ověřeno | `*` | ODbL | **Použít**, přidat `PT` |
| Stání | Lisboa EMEL (úseky s orientací), Porto (ulice, místa), Cascais (plochy) | ověřeno | ne | CC BY-SA / CC0 / CC BY | Statické soubory při nasazení |
| BUS pruhy | Porto `corredores-bus` | ověřeno | ne | CC0 | Statický soubor; jinde OSM |
| OSM | Geofabrik `portugal` 409 MB (i ostrovy) | ověřeno | - | ODbL | Jeden balík `pt` na R2 |
| Hranice | GISCO `PT` (pevnina, Madeira, Azory) | ověřeno | - | © EuroGeographics | už v `build_states.mjs` |

**Doporučení:** Portugalsko jako Francie mimo Paříž: odhad z OSM a ortofota DGT **Ortos 2025** (25 cm, celá pevnina, CC BY,
CORS), na Madeiře 10cm ortofoto IRIG (CORS, licenci ověřit), na Azorech 10cm ortofoto jen jako podklad mapy (bez CORS).
Online mapu povrchů nemá žádné z velkých měst: Lisabonská kartografie 1 : 1000 existuje jen jako DWG za výzvou Cloudflare
(řešit s městem nebo ručním stažením), Porto má geoportál pro nás nedostupný. Hledání přes Photon. Nejcennější statická
data: **stání EMEL v Lisabonu** (12 tisíc úseků s orientací podélné / kolmé / šikmé), placené stání a **BUS pruhy Porta**
(CC0), plochy stání Cascais, obrysy budov Lisabonu a BGRI 2021 INE pro výšku a stáří zástavby. OSM jedním balíkem.

Neověřeno: přesné znění kreditu DGT; licence ortofota Madeiry; obsah lisabonských DWG a oeiraských DWG; zda Porto blokuje
cizí IP; INE BGE (body budov) a jeho služba; AML Oferta de Estacionamento; WMTS DGT v Web Mercatoru (nenalezen).
