# Data pro Kypr: ověřené otevřené služby (pro profil ulic)

Ověřeno 23. 11. 2026, asi 75 požadavků, User-Agent `profily-ulic`, pauza asi 1 s, Origin `https://streetspace.eu`.
Overpass ani Nominatim nebyly použity, žádné osobní údaje se neposílaly, Referer se nepodvrhoval.

Značení: **ověřeno** = odpověď přišla a byla přečtena; **neověřeno** = jen z dokumentace, katalogu nebo vyhledávání, bez
dotazu. CORS „echo“ = server vrací náš Origin (`Access-Control-Allow-Origin: https://streetspace.eu`, navíc
`Access-Control-Allow-Credentials: true`), z prohlížeče to funguje jako `*`; „bez CORS“ = hlavička chybí.

Pozor při zkoušení: servery DLS (za F5 BIG-IP) vracejí CORS jen na hlavičku `Origin: https://…` **s mezerou** za
dvojtečkou; `-H Origin:https://…` bez mezery dostal odpověď bez CORS. Prohlížeč mezeru posílá vždy, takže v aplikaci
problém není.

Zkušební body: Lefkosia/Nicosia Ledra St (33,3615, 35,1730), Lemesos/Limassol (33,0413, 34,6786), Larnaka (33,6290,
34,9170), Pafos (32,4200, 34,7720); britské základny Episkopi (32,887, 34,670), vesnice Akrotiri (32,9635, 34,6005),
Dhekelia (33,740, 34,984); nárazníková zóna Pyla (33,692, 35,015); sever: severní Nikósie (33,36, 35,20), Kyrenia/Girne
(33,317, 35,341), Famagusta/Gazimağusa (33,942, 35,12), Morphou/Güzelyurt (32,99, 35,198).

---

## 1. Ortofoto (DLS, Department of Lands and Surveys, Τμήμα Κτηματολογίου και Χωρομετρίας)

Adresář služeb `https://eservices.dls.moi.gov.cy/arcgis/rest/services?f=json` (**ověřeno**, ArcGIS Server 10.91):
složky `BASEMAPS`, `DTPH` (403), `GP`, `National` (výpis 403, jednotlivé služby ale odpovídají, viz kap. 2), `Utilities`.
Ve `BASEMAPS` (**ověřeno**): `Imagery_Orthophoto_1963`, `Imagery_Orthophoto_1993`, `Imagery_HillShade_1993`,
`Imagery_Satellite_2009_2013`, **`Imagery_Orthophoto_2014_10cm`**, **`Orthoimagery_2019_WebMercator`**. Novější ročník
(2021, 2023) **v adresáři není**; DLS ho podle svých stránek staví z náletu 2019 (projekt se Eratosthenes SA, smlouva
9/2019, zdroj EuroGeographics Annual Review 2019, neověřeno dotazem). Druhý adresář
`https://eservices.dls.moi.gov.cy/inspire/rest/services/INSPIRE` (**ověřeno**, CORS echo) má i `OI_Orthoimagery`
(INSPIRE pohled, neprozkoumán).

| Zdroj | Ověřený stav | Rozlišení, datum, pokrytí | Licence | Poznámka |
|---|---|---|---|---|
| **Ortofoto 2019** `https://eservices.dls.moi.gov.cy/arcgis/rest/services/BASEMAPS/Orthoimagery_2019_WebMercator/MapServer` | **ověřeno**: **dlaždicová cache v EPSG:3857** (`singleFusedMapCache`, mřížka Google/OSM, 256 px, úrovně 0–21), `tile/{z}/{y}/{x}` 200 `image/jpeg` (uvnitř okraje snímku PNG s průhledností), CORS echo, `Cache-Control: max-age=86400`. Také `export` (bbox 3857) a `WMSServer` (GetMap 1.3.0 `CRS=EPSG:3857`, `LAYERS=0`) 200 a CORS echo | Nálet 2019 (název služby; `serviceDescription` omylem „Cached OI 2014“, popis vrstvy „Cached OI 2019“). Cache do z21 (7,5 cm/px); skutečné GSD v metadatech **neuvedeno**. Na výřezu 64 × 64 m (25 cm/px) rozliší obrubníky, vodorovné značení i auta, srovnatelně s 2014 10 cm, o málo měkčí. **Pokrytí jen území pod kontrolou vlády** (Nikósie, Lemesos, Larnaka, Pafos, Episkopi, Akrotiri, Dhekelia 200); na severu (Kyrenia, Famagusta, Morphou) a v nárazníkové zóně (Pyla, z16–18) **404**; dlaždice z13 přes severní Nikósii končí právě na Zelené linii (ověřeno obrazem) | V katalogu data.gov.cy **nenalezen** (hledání „orthophoto“ i řecky vrátilo jen 1963, 1993 a 2014); licence tedy **neověřena** | **Nejnovější: použít jako hlavní**, ve tvaru dlaždic jako `at`/`ch` v `lanes-ortho.js` (`z: 20, px: 256`, pořadí `{z}/{y}/{x}`, ne `xy`). Chybějící dlaždice = 404, ne bílý obrázek. Licenci potvrdit u DLS (stejný správce jako 2014, který je CC BY 4.0). |
| **Ortofoto 2014, 10 cm** `https://eservices.dls.moi.gov.cy/arcgis/services/BASEMAPS/Imagery_Orthophoto_2014_10cm/MapServer/WMSServer`, vrstva `0` (REST `…/rest/services/BASEMAPS/Imagery_Orthophoto_2014_10cm/MapServer/export`) | **ověřeno**: WMS GetMap 1.3.0 `CRS=EPSG:3857` 200 `image/jpeg`, CORS echo; REST `export` (`bboxSR=3857&imageSR=3857&f=image`) totéž. Dynamická služba (bez cache, `exportTilesAllowed: false`), max. obraz 4096 px | **GSD 10 cm**, nálet 2014 (název, popis služby a katalog). `fullExtent` končí na 35,2° s. š.; pokrytí jen jih: Nikósie, Lemesos, Pafos i Episkopi (SBA) ostré, Kyrenia prázdná | **CC BY 4.0** (data.gov.cy, dataset „Χάρτης ορθοφωτογραφιών του 2014 ανάλυση 10cm“, **ověřeno** na stránce datasetu); polygon pokrytí v katalogu vede po nárazníkové zóně | Záloha za 2019 (starší o 5 let, ale s jasnou licencí). Jako `ES_ORTHO` (`res: 0.1`). |
| `Imagery_Satellite_2009_2013`, `Imagery_Orthophoto_1993`, `1963` | v adresáři (**ověřeno**), obraz nezkoušen | starší, družicové nebo historické | 1993 a 1963 v katalogu data.gov.cy (licence neověřena) | Nepotřebujeme. |

**Prázdné místo** (ověřeno, Kyrenia): WMS (2014 i 2019) vrací 200 a **plně bílý JPEG 2,4 KB** (s `FORMAT=image/png&
TRANSPARENT=TRUE` průhledné PNG 888 B); REST dlaždice 2019 vrací **404** (`text/html`, 721 B). Detekce prázdna jako
v Portugalsku: malá odpověď nebo čistě bílý obraz, u dlaždic stav 404.

**Britské základny (SBA)** Akrotiri a Dhekelia: ortofoto 2019 i 2014 je **pokrývá** (Episkopi, Akrotiri, Dhekelia
ověřeno; bod u Akrotiri ležel na ploše bez staveb, Episkopi a Dhekelia ukazují terén a cesty). Budovy DLS (kap. 3) tam
ale **chybí** (Episkopi 0 budov).

Licenční podmínky služeb DLS: katalog API DLS (`portal.dls.moi.gov.cy/en/alles-ypiresies/katalogos-apis/`, neověřeno
dotazem, jen přes WebFetch) uvádí služby `National/*` s větou, že o přístup je třeba požádat správce portálu; licenci
neuvádí. Služby přitom anonymně odpovídají (ověřeno). DLS prodává ortofoto i za poplatek (ceník 25 € / km² TIFF,
neověřeno). JOSM v roce 2020 ortofoto 2014 vyřadil pro „nejasnou licenci“ (ticket 18227, tehdy ještě bez záznamu na
data.gov.cy). Dnes je 2014 10 cm na data.gov.cy pod CC BY 4.0.

---

## 2. Mapy povrchů a vektorová data DLS

Online mapu povrchů (polygony vozovky, chodníku, stání) **jsem na Kypru nenašla**: ani DLS, ani obce (Nikósie, Lemesos,
Larnaka, Pafos) ji nezveřejňují; hledání na webu a v katalogu data.gov.cy vrátilo jen „Government Buildings of Nicosia
Municipality“ (budovy úřadů) a mapu nemovitostí lemesoské EOA (katastr, ne ulice). Obce podle tisku používají snímky
Cyclomedia (neveřejné).

| Služba | Ověřený stav | Obsah | Licence | Použitelnost |
|---|---|---|---|---|
| **DLS Cadastral Map** `https://eservices.dls.moi.gov.cy/arcgis/rest/services/National/CadastralMap_EN/MapServer` | **ověřeno**: `query` s obálkou v 4326 a `f=geojson` 200, CORS echo, max. 1000 prvků | Parcely, listy plánů, správní celky, bloky, `28 Buildings` (jen obrys a `BLDG_DESC` Digitized/Surveyed), `22 Topographic Lines` (kódy `TLWL20/25/30` zdi podle tloušťky, `TLFNWL` plot na zídce, `TLDASH`), `23 Topographic Areas` (na Makariou prázdné). **Obrubníky ani chodníky nemá** | data.gov.cy uvádí datasety „Κτίρια ΓΚΒΔ / ΚΒΔ – Κτηματολογικός Χάρτης“ (licence neověřena); katalog API: přístup „na požádání“ | Zdi a ploty na hranici parcel = poloha fasády či plotu. Plochy ulic ne. |
| **DLS Topography** `…/National/Topography_EN/MapServer` | **ověřeno**: `query` 200, CORS echo; `find` podle jména ulice funguje | `12 Main Road Network`, `13 Secondary`, `14 other`: osy ulic s **`LANENUMBER`** (počet pruhů), `CLASSIFICATION`, `SURFACETYPE`, `ROUTENUMBER`, jméno latinkou (`ROADNAMERMN`, např. „LEOFOROS SPYROU KYPRIANOU“, 4 pruhy). `2 Other Boundaries`: **linie** nárazníkové zóny (sever i jih), přístupové linie a hranice britských základen (`STATUS_COD` 1–4) | jako výše | Počet pruhů jako kontrola OSM (A/B). Hranice zón jsou čáry, ne polygony. |
| **INSPIRE TN_TransportNetwork** `https://eservices.dls.moi.gov.cy/inspire/rest/services/INSPIRE/TN_TransportNetwork/MapServer/1` | **ověřeno**: `query` 200, CORS echo | Road Link podle INSPIRE, atributy prázdné (`*_void`), jen `STYPE` | - | Nic navíc proti Topography. |

---

## 3. Budovy

| Zdroj | Ověřený stav | Pole | Licence | Poznámka |
|---|---|---|---|---|
| **DLS INSPIRE BU3 „Building_All_Footprints“** `https://eservices.dls.moi.gov.cy/inspire/rest/services/INSPIRE/BU_Buildings/MapServer/6` | **ověřeno**: `query` s obálkou v 4326, `f=json`/`geojson` 200, CORS echo, max. 1000 prvků; statistika přes celou vrstvu | **`FLOOR_QTY`** (podlaží), `GND_FLOOR`, **`H_ROOF_A_1`** a **`H_EAVE_B_1`** (výška střechy a okapu, m), `H_MSL_m_1`, **`ROOF_TYPE`** (Flat roof, Inclined roof…), **`B_TYPE`** (High residential building, Low residential with flat/inclined roof, Mixed, Commercial, Office, Industrial, Agriculture, Church, Mosque, Building under construction…), objem, plocha. Na Makariou v Nikósii 34 domů v bboxu ~180 × 180 m (7–8 podlaží, ploché střechy); Lemesos, Pafos, Larnaka také. Celkem **asi 565 000 budov**. Rok výstavby **není** | **CC BY 4.0** (data.gov.cy „Κτίρια (INSPIRE)“, ověřeno na stránce datasetu) | **Výborné pro vzhled domu** (podlaží, střecha, typ). Rozsah `extent` do 35,2° s. š.: jen území pod kontrolou vlády; britské základny **bez budov** (Episkopi 0). Původ: 3D model z leteckých snímků 2014 (INSPIRE metadata podle vyhledávání, neověřeno), DLS ho aktualizuje z náletu 2019 (stránky DLS, neověřeno). `B_TYPE` má překlepy v hodnotách (`LowResidential…`, `buildingwith…`): porovnávat po normalizaci. |
| DLS INSPIRE BU1 `…/BU_Buildings/MapServer/2` (`Building_dcdb`) | **ověřeno** | katastrální obrysy, `BLDG_CODE`, `BLDG_HGT_CODE`, `FLOOR_NUM` (na vzorku prázdné), číslo plánu | CC BY 4.0 (týž dataset) | Bez přínosu proti BU3. `MapServer/1` (`Building_sdb`) na vzorku prázdná. |

---

## 4. Hledání adres a ulic

| Služba | Ověřený stav | Odpověď | Licence | Poznámka |
|---|---|---|---|---|
| **Photon (komoot)** `https://photon.komoot.io/api/?q=…&bbox=32.2,34.5,34.65,35.75` | **ověřeno**, 200, CORS `*` | „Makariou Avenue Nicosia“ → úseky ulice (`osm_key: highway`, `countrycode: CY`), jména řecky i anglicky; „Ziya Rizki Caddesi Girne“ → ulice v Kyrenii, také `countrycode: CY` | ODbL | **Použít** (`search-photon.js`, přidat `CY`; místní jazyky el, tr). Bbox ostrova `[32.2, 34.5, 34.65, 35.75]`. |
| DLS Topography `find` `…/Topography_EN/MapServer/find?searchText=…&layers=12,13,14` | **ověřeno**, 200, CORS echo | 996 výsledků pro „Makariou“ (jména latinkou, bez obce v odpovědi, jen kódy `DIST_CODE`, `QRTR_CODE`) | jako kap. 2 | Jen záloha; Photon je lepší. |
| DLS INSPIRE `AD_Addresses/MapServer/0` | **ověřeno** | body adres **bez čísla a ulice** v atributech (jen `specification: parcel`) | - | Na hledání nepoužitelné. Geokodér DLS **nenalezen** (v `Utilities` je jen Geometry a tisk). |

---

## 5. Parkování a vyhrazené pruhy

Online ani ke stažení **nenalezeno** (data.gov.cy, web obcí). Stání a BUS pruhy jen z OSM.

---

## 6. OSM (Geofabrik) a hranice

**Geofabrik, ověřeno 23. 11. 2026** (`index-v1.json` a stránka `europe/cyprus/`): `europe/cyprus/cyprus-latest.osm.pbf`
**36,2 MB**, bez podoblastí. Polygon výřezu 31,95–34,96° v. d., 34,23–36,00° s. š.: **celý ostrov včetně severu**
a britských základen (Photon na OSM také vrací severní ulice s `countrycode: CY`). Jeden díl `cy`; po zabalení odhadem
pod 20 MB, na R2 jako ostatní nové státy.

**Hranice** (**ověřeno**: `CNTR_RG_01M_2024_4326.geojson`, `CNTR_ID` „CY“, `SVRG_UN` „UN Member State“): **2 polygony**,
hlavní ostrov (546 bodů, 32,27 až 34,584° v. d., 34,563 až 35,694° s. š.) a ostrůvek Klidhes u Karpasu. **Pokrývá celý
ostrov včetně severu a britských základen**; sever ani základny nejsou samostatné polygony a ve vrstvě GISCO nemají
vlastní `CNTR_ID` (UK v ní na Kypru nic nemá). Z GISCO se tedy území pod kontrolou vlády oddělit nedá.

Kde data o Zelené linii a základnách jsou (fakta, bez rozhodnutí):
- DLS `Topography_EN/MapServer/2` „Other Boundaries“ (**ověřeno**): linie severní a jižní hranice nárazníkové zóny
  („NORTH/SOUTH BUFFER ZONE“, popis v legendě „Limit of area under Turkish occupation“), hranice základen
  („SOVEREIGN BASES“) a „ACCESSIBILITY LINE“; jen čáry, polygon by se musel sestavit.
- Polygon pokrytí ortofota 2014 v katalogu data.gov.cy vede po nárazníkové zóně (ověřeno ve stránce datasetu).
- Pokrytí dlaždic 2019 a vrstvy budov BU3 končí na Zelené linii (ověřeno, viz výše).
- Vrstva „Cyprus Outline“ ve službě 2019 je celý ostrov („REPUBLIC OF CYPRUS“, 9 249 km²), ne pokrytí.

`tools/build_staty.mjs` by stačilo `cyprus: () => gisco("CY")`; sever je pak „CY“ a dostane tytéž zdroje, ale
ortofoto DLS i budovy tam nic nevrátí (404, bílý obraz, prázdný dotaz), takže zbude odhad z OSM bez ortofota.

---

## Shrnutí

| Oblast | Zdroj | Stav | CORS | Licence | Doporučení |
|---|---|---|---|---|---|
| Ortofoto | DLS `Orthoimagery_2019_WebMercator` (cache 3857 do z21, i WMS/export) | ověřeno, 2019, jih + SBA | echo | neověřena (není na data.gov.cy) | **Použít jako hlavní** po potvrzení licence (dlaždice z20, 256 px, `{z}/{y}/{x}`); 404 = prázdno |
| Ortofoto | DLS `Imagery_Orthophoto_2014_10cm` WMS / export | ověřeno, 10 cm, 2014, jih + SBA | echo | **CC BY 4.0** | Záloha (`res: 0.1`), nebo hlavní, dokud se licence 2019 nevyjasní; bílý JPEG 2,4 KB = prázdno |
| Ortofoto sever | žádné | 2019 i 2014 končí na Zelené linii | - | - | Odhad jen z OSM |
| Mapa povrchů | žádná (DLS, obce) | nenalezeno | - | - | Odhad z OSM a ortofota (`ortho-osm.js`) |
| Budovy | DLS INSPIRE `BU_Buildings/6` (podlaží, výšky, střecha, typ) | ověřeno, ~565 000 domů, jih | echo | **CC BY 4.0** | **Použít** (dotaz při kliknutí, bbox); vzhled domu z `FLOOR_QTY`, `ROOF_TYPE`, `B_TYPE` |
| Pruhy | DLS Topography `12–14` (`LANENUMBER`) | ověřeno | echo | nejasná | Možná kontrola počtu pruhů (A/B), ne hned |
| Zdi a ploty | DLS CadastralMap `22` | ověřeno | echo | nejasná | Nepotřebné |
| Hledání | Photon | ověřeno, i sever | `*` | ODbL | **Použít**, přidat `CY` |
| Stání, BUS | nenalezeno | - | - | - | OSM |
| OSM | Geofabrik `cyprus` 36,2 MB (celý ostrov) | ověřeno | - | ODbL | Jeden balík `cy` na R2 |
| Hranice | GISCO `CY` (celý ostrov včetně severu a SBA, 2 polygony) | ověřeno | - | © EuroGeographics | `gisco("CY")`; Zelená linie jen jako čáry DLS |

**Doporučení:** Kypr jako Portugalsko: odhad z OSM a ortofota, ale s nejlepšími budovami ze všech nových států
(podlaží, výšky a typ střechy z 3D modelu DLS, CC BY 4.0, CORS, dotaz s bboxem). Ortofoto: technicky nejlepší je
cache 2019 (3857, CORS), licenci ale DLS nikde neuvádí; čistá cesta je 10cm ortofoto 2014 (CC BY 4.0) a 2019 přidat po
dotazu na DLS (`dls_portal_badmin@dls.moi.gov.cy` podle katalogu API, neověřeno). Obě končí na Zelené linii a pokrývají
britské základny. Sever: GISCO ho počítá do CY, OSM a Photon ho mají, úřední data DLS ne; jestli ho brát jako CY, je
politické rozhodnutí pro Báru. Mapy povrchů ani data o stání nemá žádné kyperské město.

Neověřeno: skutečné GSD ortofota 2019 a jeho licence; podmínky služeb DLS mimo data.gov.cy (stránka Disclaimer);
INSPIRE metadata budov (geoportál INSPIRE byl z našeho připojení nedosažitelný, DNS); služba `INSPIRE/OI_Orthoimagery`;
mapa nemovitostí EOA Lemesos.
