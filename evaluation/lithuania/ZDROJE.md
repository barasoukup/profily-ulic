# Data pro Litvu (LT): ověřené služby pro profil ulic

Rešerše 23. 11. 2026, jen příprava (žádný kód). Asi 45 dotazů na služby, User-Agent `profily-ulic`, pauza 1 s, Origin
`https://streetspace.eu`. Overpass ani Nominatim nepoužity, žádné osobní údaje, žádný klíč.

Značení: **ověřeno** = odpověď přišla a byla přečtena (obrázky prohlédnuty); **neověřeno** = jen z dokumentace nebo
vyhledávání. CORS „echo“ = server vrací náš Origin (`Access-Control-Allow-Origin: https://streetspace.eu`), z prohlížeče
funguje; „bez CORS“ = hlavička chybí.

Zkušební body: Vilnius Gedimino pr. / Vinco Kudirkos a. (25,2797; 54,6872), Vilnius Žirmūnai (25,299; 54,708),
Kaunas Laisvės al. 10 (23,9262; 54,8970).

## Verdikt

**S podmínkou.** Technicky je Litva dobře připravená: celostátní ortofoto 2024–2025 ve Web Mercatoru s CORS, ve Vilniusu
městské ortofoto 2024 v dlaždicích do z20 (asi 9 cm) a **skutečná mapa povrchů 1 : 500** (topografické plochy s povrchem
a účelem: chodník, cesta, parkoviště) s CORS, hledání adres s CORS a celostátní budovy (GRPK, CC BY 4.0). Háček je
**licence**: ortofoto NŽT je výslovně jen pro prohlížení na geoportálu, „pro použití v jiných informačních systémech“ chce
NŽT kontakt (pagalba@geoportal.lt), a vilniuské služby (`gis.vplanas.lt`) licenci neuvádějí. Bez souhlasu by šlo jen
OSM + Photon + GRPK (budovy, šířky silnic), tedy odhad jako v cizině bez ortofota. Normy: státní STR 2.06.04:2014
jsem nepřečetla (e-seimas a e-tar blokuje Cloudflare); městské příručky Vilniusu (2021) a Kaunasu (2024) ano.

**Doporučení:** přidat stát hned jako „odhad z OSM“ (GRPK budovy, Photon nebo vilniuský lokátor), a ortofoto a mapu
povrchů Vilniusu zapojit až po písemném souhlasu NŽT a města Vilnius. Bez ortofota je odhad slabší (zkušenost
`evaluation/ortofoto-osm/`), proto jinak radši odložit do odpovědi úřadů.

### Rozhodnutí pro Báru

1. Napsat NŽT (pagalba@geoportal.lt) o souhlas s ortofotem `ORT_recent` v aplikaci (z prohlížeče, export ve 3857)? Bez
   něj není ortofoto pro pruhy.
2. Napsat Vilniusu (Vilniaus miesto savivaldybė / SĮ „Vilniaus planas“) o licenci k ortofotu 2024 a topografickým plochám
   1 : 500 (`gis.vplanas.lt`)? To je nejlepší zdroj v Litvě (jako Vídeň FMZK).
3. Přidat Litvu hned jako odhad z OSM (bez ortofota), nebo počkat na odpovědi?
4. Paneláky: Litva patří do bývalého SSSR (Žirmūnai, Lazdynai, Šilainiai); rozšířit „socialistické“ vzhledy domů o LT?
   Dnes jen CZ, SK, PL, EE a bývalá NDR.
5. Hledání: vilniuský lokátor (CORS, jen Vilnius, licence neuvedena) + Photon pro zbytek, nebo všude Photon?
6. Značky: kresby na Commons jsou **CC BY 4.0 (Augustasci)**, ne public domain (litevský zákon vyjímá právní akty, ale
   autor kreseb na Commons zvolil CC BY); uvádět autora v licencích, nebo kreslit z přílohy KET?
7. Normy: koupit/obstarat text STR 2.06.04:2014 jinou cestou (e-seimas z této sítě blokuje), nebo vystačit s příručkami
   Vilniusu a Kaunasu (DOP, 1. ruka)?

---

## 1. Ortofoto

| Zdroj | Ověřený stav | Rozlišení, datum | CORS | Licence | Použitelné |
|---|---|---|---|---|---|
| **NŽT `ORT_recent`** `https://www.geoportal.lt/arcgis/rest/services/NZT/ORT_recent/MapServer` (ArcGIS MapServer, nativně LKS94 = EPSG:3346/2600) | **ověřeno**: `export?bbox=…&bboxSR=3857&imageSR=3857&format=jpg&f=image` 200, `image/jpeg`, 0,4 s. Vilnius Gedimino 512 px na 86 m (0,17 m/px): přechody, čáry a auta zřetelné, efektivně asi 0,2–0,3 m. Kaunas Laisvės al. stejně: rozmazané, efektivně 0,3–0,5 m. `identify` vrstvy 0 dává datum náletu: Vilnius **15. 6. 2025**, Kaunas **9. 4. 2024** (ale snímek je s listím: nesoulad jako v Estonsku). Vrstvy 2022–2026 a družicové 2025–2026 | 0,2–0,5 m, 2024–2025 | echo | „© geoportal.lt © SSVA © Nacionalinė žemės tarnyba“; popis `ORT2LT`: „Dėl serviso naudojimo kitose informacinėse sistemose kreipkitės el. paštu: pagalba@geoportal.lt“ | **s podmínkou** (souhlas NŽT); na pruhy jen ve Vilniusu, jinde hrubé |
| NŽT `ORT10LT_Web_Mercator_102100` (cache ve 3857) | **ověřeno** (JSON služby): cache jen do úrovně 11 = **0,597 m/px** | 0,6 m | echo | jako výše | ne (hrubé) |
| NŽT `ORT10LT_2024_2026`, `ORT10LT_2021_2023` (WMTS/cache v LKS94 do 0,132 m) | **ověřeno** (JSON): jen EPSG:3346 | 0,13 m cache | echo | jako výše | ne (jiný CRS; přes `ORT_recent` export) |
| NŽT `ORT2LT_2018` (1 : 2000, města) | **ověřeno**: export ve 3857 ve Vilniusu ostrý (asi 10–15 cm), ale **2018** | ~0,1 m, 2018 | echo | jako výše | ne (staré) |
| **Vilnius `ORTO_2024_WGS`** `https://gis.vplanas.lt/arcgis/rest/services/Baziniai_zemelapiai/ORTO_2024_WGS/MapServer` („Vilniaus miesto 2024 m. ortofoto \| Web Mercator“) | **ověřeno**: cache ve **3857** se standardní mřížkou (počátek −20037508, úroveň 0 = 156543 m), dlaždice `…/tile/{z}/{y}/{x}` z20 200 `image/jpeg` (8 KB, velmi ostré: dlažba, čáry přechodů, sloupky), z21 a z22 404; `export` také funguje. Rozsah jen město | z20 = **0,086 m/px** na 54,7° s. š., 2024 | echo | copyrightText prázdný; v sousedních službách „© 2025 Vilniaus miesto savivaldybė © 2025 ID Vilnius UAB“; licence **neověřena** | **s podmínkou** (licence od města); technicky jako `ES_ORTHO` / dlaždice z20 |
| Vilnius starší (`ORTO_2022_WGS`, `ORTO_2019_WGS` …) | **ověřeno** jen seznam služeb | | echo | | rezerva |
| `geoportal.lt/mapproxy/gisc_ortofoto` | z dřívějška (Estonsko): 401 | | | | ne |

Licence ORT10LT: stránka geoportálu „Copyright“ (https://www.geoportal.lt/geoportal/web/en/copyright, **ověřeno** přes
WebFetch) uvádí jen „ORT10LT © National Land Service…“, o použití v jiných systémech nic. Stránka „Open data“
(https://www.geoportal.lt/geoportal/web/en/open-data, ověřeno) jmenuje jako otevřená (CC BY 4.0) jen **GRPK**, ortofoto ne.
Starší diskuse OSM Litva (talk-lt 2011, 2013, 2023, neověřeno proti dnešku) popisují licenční smlouvy a zákaz předávání
dál. **Závěr: ortofoto bez souhlasu NŽT nepoužívat.**

## 2. Mapy povrchů ulic

### 2a. Vilnius: topografické plochy 1 : 500 (`TEDR_PRLOTAI_P_500`)

`https://gis.vplanas.lt/arcgis/rest/services/Baziniai_zemelapiai/Vilnius_basemap_LKS_su_rajonu/MapServer/13`
(ArcGIS 10.81, capabilities `Map,Query,Data`, maxRecordCount 1 000, data v LKS94).

- **Ověřeno**: CORS echo; `query` s obálkou ve WGS 84, `outSR=4326`, `f=geojson` 200 za 0,9 s; na 160 × 165 m u Gedimino
  **270 ploch, 416 KB** (velké: dávat `outFields` a `maxAllowableOffset`).
- Pole: `KODAS` (kód plochy: 2421 asfalt, 2422 beton, 2423 dlažba/grindinys, 2424 zámková dlažba/trinkelės, 2425
  plytelės, 2426 štěrk, 2427 dřevo, 2428 jiný, 2430 schody, 22xx voda, 23xx vegetace, 2413 hřbitov; podle legendy
  rendereru, **ověřeno**; 2403 a 2405 v legendě nejsou), **`Paskirtis`** (účel: `pėsč` chodník/pěší 110×, `kelias`
  vozovka 12×, `park` parkoviště, `kita`, `pavirš`, `stat`; u 126 ploch prázdné), `Medziaga` (materiál: bet, tr, asf,
  met…), `Aukstis`, `Saltinis` („geod planas“ = geodetický plán), `TIIIS_NR` (číslo zaměření v národní TIIIS, 2021–2025).
- **Překryv s ortofotem 2024 u Gedimino (ověřeno, prohlédnuto)**: chodníky (`pėsč`) leží na chodnících, vozovky
  (`kelias`) mezi obrubami, náměstí V. Kudirkos s trávníky a podstavcem pomníku sedí; posun pod 1 m. **Je to skutečná
  mapa povrchů**, kandidát jako Vídeň FMZK. Zelené plochy jsou bez účelu (jen kód vegetace / bez `Paskirtis`).
- Sousední vrstvy téže služby `17 TEDR_DANGOS_P_500` a `22 TEDR_STATINIAI_P_500` (budovy 1 : 500 s kódy 2601–2618) vrátily
  v centru **0 objektů** (neověřeno proč; možná jen mimo centrum).
- **Licence neověřena** (služba ji neuvádí; Vilnius má politiku otevřených dat, ale tuto vrstvu jsem v katalogu
  nenašla; data.gov.lt a opendata.vilnius.lt z této sítě 403/Cloudflare). Data pocházejí z národní TIIIS (geodetická
  zaměření), jejíž služby jsou jen pro přihlášené a s **zákazem ukládání a předávání** (planuojustatau.lt, ověřeno přes
  WebFetch). **Zeptat se města, než se cokoli zapojí.**

Další vilniuské vrstvy (**ověřeno**, CORS echo, licence neuvedena):
- `Interaktyvus_zemelapis2/Miesto_tvarkymas_public/MapServer/41` „Gatvių danga“: osy ulic s povrchem (`DANGA`: kamenná
  dlažba, zámková dlažba, asfalt, beton, štěrk) a kategorií (`KATEGOR` B/C/D); linie, ne plochy.
- `Interaktyvus_zemelapis/Transportas/MapServer/21` cyklostezky a `/32` pěší cesty: linie s **`PLOTIS`** (šířka),
  `DANGA`, `TIPAS`, rok `IRENGTA`.
- `Transportas_public/0` parkování, `3`, `5` zóny placeného stání, `9` buspruhy („Viešojo transporto A juostos“),
  `30` sdílená prostranství („Dalijimosi erdvė“).
- `Medziu_lajos` (koruny stromů), `Zaliasis_Vilnius_public/23` (městská zeleň).

### 2b. Celostátně: GRPK (Georeferencinio pagrindo kadastras)

`https://www.geoportal.lt/arcgis/rest/services/NZT/GRPK/MapServer` (**ověřeno**: CORS echo, query 0,2 s).
- `11 Keliai` (osy silnic a ulic): **`PLOTIS`** a `JPLOTIS` (šířka v m, např. Gedimino pr. 10, Jogailos 12), `DANGA`
  (A asfalt, G…), `KATEGOR`, `LYGMUO` (úroveň), `PASKIRTIS`. Šířka celá v metrech, zdroj „ORT“ (z ortofota) nebo „KT“.
- `27 Žemės danga`, `23 Užstatytos teritorijos`: hrubé plochy (1 : 10 000).
- Mapa povrchů od obruby k obrubě celostátně **není**. GRPK je otevřené pod **CC BY 4.0** jako soubor ke stažení
  (`https://www.geoportal.lt/download/opendata/GRPK/GRPK_Open_SHP.zip`, „The contents are limited compared to the original
  dataset“; ověřeno na stránce Open data, soubor nestahován); licence služby ArcGIS samotné neuvedena.

### 2c. Kaunas, Klaipėda, Šiauliai

**Nenalezeno.** `gis.kaunas.lt`, `maps.kaunas.lt`, `zemelapis.kaunas.lt` nejdou přeložit; `gis.klaipeda.lt/arcgis|server/rest`
404; `gis.siauliai.lt/arcgis/rest` 404 (ověřeno). Vyhledávání nenašlo veřejnou službu povrchů. Topografie 1 : 500 je
v národní TIIIS jen s přihlášením (bez atributů, zákaz ukládání). **Mimo Vilnius tedy jen OSM + GRPK.**

## 3. Budovy

| Zdroj | Ověřený stav | Pole | CORS | Licence | Použitelné |
|---|---|---|---|---|---|
| **GRPK `22 Pastatai`** (služba výše) | **ověřeno**: 15 budov u Gedimino | obrys, `PASK` (účel, kód), `GRAKTAS` (asi unikátní číslo NTR, neověřeno), bez podlaží a výšky | echo | GRPK CC BY 4.0 (soubor); služba neuvedena | **ano** (fasády), statický soubor z CC BY balíku je čistší |
| **NTR otevřená data** `https://get.data.gov.lt/datasets/gov/rc/ntr/ntr_pastatai/NtrPastatas` (Registrų centras, Universal API) | **ověřeno**: JSON, **`aukstu_skaicius`**, **`stat_pabaigos_metai`** (rok dokončení), `modern_pabaigos_metai`, `sienos` (kód materiálu stěn), `stogo_danga`, `isores_apdaila`, plochy; **bez geometrie** a bez adresy v záznamu | podlaží, rok, materiál | **bez CORS** | otevřená data (licence na data.gov.lt neověřena, portál 403) | **s podmínkou**: jen při nasazení (statický soubor), propojení s obrysem přes unikátní číslo nebo adresu neověřeno |
| `get.data.gov.lt/datasets/gov/rc/ar/…` (Adresų registras: ulice, adresy, budovy) | **ověřeno** (`gatve/Gatve`), bez CORS | adresy | bez CORS | otevřená data | jen při nasazení |
| Vilnius `Interaktyvus_zemelapis/Pastatai_statyba/MapServer/2` „Šildymo sezono reitingas“ | **ověřeno**: 26 domů v Žirmūnai, **`AUKSTAI`** (podlaží), `STATMETAI` (rok, u Žirmūnai 2002–2006 podezřelé), **`TIPINIS_PR`** (typový projekt, např. `LAD-8-001`, `Netipinis`), adresa | jen bytové domy s ústředním topením | echo | neuvedena | s podmínkou (licence; jen Vilnius; doplněk) |
| Vilnius `TEDR_STATINIAI_P_500` | v centru 0 objektů | kód budovy | echo | neuvedena | neověřeno |

## 4. Hledání adres a ulic

| Služba | Ověřený stav | CORS | Licence | Použitelné |
|---|---|---|---|---|
| **Vilnius `Lokatoriai/PAIESKA_COMPOSITE/GeocodeServer/findAddressCandidates`** `https://gis.vplanas.lt/arcgis/rest/services/Lokatoriai/…` | **ověřeno**: „Gedimino pr. 9“ → 25,2812; 54,6870 (skóre 100), i varianty 9A | echo | neuvedena | s podmínkou (jen Vilnius) |
| **Photon** `https://photon.komoot.io/api/?q=…` | **ověřeno**: „Laisvės al. 10 Kaunas“ → dům i s ulicí a PSČ | `*` | ODbL | **ano** (záloha pro celou Litvu, jako jinde) |
| Adresní registr (`get.data.gov.lt`) | ověřeno, bez CORS | ne | otevřená | ne z prohlížeče |
| Národní geokodér geoportal.lt | `geoportal.lt/arcgis/rest/services/Lokatoriai` 404 | | | nenalezeno |

## 5. OSM (Geofabrik) a hranice

- **Geofabrik** (**ověřeno** 23. 11. 2026): `europe/lithuania/lithuania-latest.osm.pbf` → `lithuania-261122.osm.pbf`,
  **224 393 161 B (224,4 MB)**, bez podoblastí. Jeden balík `lt`, dělení pod 512 MB netřeba.
- Hranice: GISCO `LT` jako u ostatních (`tools/build_states.mjs` `gisco("LT")`); neověřováno dotazem.

## 6. Ostatní

- **Doprava vpravo.** Tramvaje v Litvě nejsou (Vilnius a Kaunas mají trolejbusy) → tramvajové normy netřeba, trolejbus ano.
- **Domy v ulicích**: Vilnius Senamiestis (barokní a klasicistní měšťanské domy, UNESCO), Naujamiestis a centrum Kaunasu
  (činžáky přelomu 19./20. st.), meziválečný modernismus Kaunasu (UNESCO 2023), **dřevěné domy** (Užupis, Šnipiškės,
  Žvėrynas ve Vilniusu, Žaliakalnis v Kaunasu, Klaipėda), sovětská panelová sídliště (Žirmūnai, Lazdynai, Šilainiai,
  Dainava), nové bytové domy. (Obecná znalost, neověřeno fotkami.)
- **Jazyk** rozhraní: litevština (lt) už v sadě 24 jazyků EU je; nic nepřidávat.
- **Citlivé hranice**: Bělorusko a Kaliningradská oblast (RU). NŽT podle diskuse talk-lt (2023, neověřeno) část dat
  (GRPK) kvůli válce neposkytuje v plném rozsahu. Ortofoto u hranic může být rozmazané/omezené (neověřeno).
- **Datum náletu** v `identify` neodpovídá vždy snímku (Kaunas „9. 4. 2024“, snímek s listím) → jako u Estonska.

## Shrnutí

| Oblast | Zdroj | Stav | CORS | Licence | Doporučení |
|---|---|---|---|---|---|
| Ortofoto celostátní | NŽT `ORT_recent` export 3857 | ověřeno, 0,2–0,5 m, 2024–2025 | echo | jen se souhlasem NŽT | podklad + pruhy ve Vilniusu po souhlasu |
| Ortofoto Vilnius | `gis.vplanas.lt` `ORTO_2024_WGS` z20 | ověřeno, ~9 cm, 2024 | echo | neověřena | **nejlepší pro pruhy**, po souhlasu města |
| Mapa povrchů Vilnius | `Vilnius_basemap_LKS_su_rajonu/13` (1 : 500, povrch + účel) | ověřeno, sedí na ortofotu | echo | neověřena | **zapojit jako Vídeň** po souhlasu, A/B |
| Mapa povrchů jinde | — (TIIIS jen s přihlášením) | nenalezeno | | | OSM + odhad |
| Šířky silnic | GRPK `Keliai` `PLOTIS` | ověřeno | echo | CC BY 4.0 (soubor) | nápověda k šířce vozovky |
| Budovy | GRPK `Pastatai` | ověřeno | echo | CC BY 4.0 | ano |
| Podlaží, rok | NTR `get.data.gov.lt` | ověřeno, bez geometrie | ne | otevřená | při nasazení, propojení ověřit |
| Hledání | Photon; Vilnius lokátor | ověřeno | `*` / echo | ODbL / neuvedena | Photon všude, lokátor volitelně |
| OSM | Geofabrik `lithuania` 224,4 MB | ověřeno | | ODbL | jeden balík `lt` |

Neověřeno: licence vilniuských služeb a NŽT pro aplikaci; význam kódů 2403/2405; proč jsou vrstvy 17 a 22 v centru
prázdné; licence a propojení NTR; rok `STATMETAI`; služby Kaunasu a Klaipėdy.
