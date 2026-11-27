# Data pro Lotyšsko (LV): ověřené otevřené služby (pro profil ulic)

Rešerše 23. 11. 2026, jen příprava (žádný kód). Asi 60 požadavků na služby, User-Agent `profily-ulic`, Origin
`https://streetspace.eu`, pauzy kolem 1 s, žádné smyčky ani hromadné stahování (stažené jen schéma XSD katastru, 23 KB,
a dva veřejné PDF k normám). Overpass ani Nominatim nepoužity, žádné osobní údaje, žádný klíč.

Značení: **ověřeno** = odpověď přišla a byla přečtena; **neověřeno** = jen z dokumentace, katalogu nebo vyhledávání.
CORS „echo“ = server vrací náš Origin (z prohlížeče funguje); „bez CORS“ = hlavička `Access-Control-Allow-Origin`
pro náš Origin chybí.

Zkušební body: Riga centrum (Brīvības iela / Dzirnavu iela, 24,117–24,120; 56,954–56,956), Vecrīga (24,106; 56,949).

## Verdikt

**Odložit** (nebo „s podmínkou“, jestli Bára zařídí přístup k ortofotu). Důvody:

1. **Ortofoto z prohlížeče volně není.** LĢIA dává bez přihlášení jen staré cykly 1994–2008 a ty jsou v otevřené službě
   prázdné (rozsah `NaN`). Cykly 7 (2019–2021, 25 cm) a 8 (2022–2024, 20 cm) jsou „bezplatná data, autorizovaný přístup
   po podpisu licence“ (CC BY 4.0); INSPIRE WMTS 7. cyklu vrací **401**. LVM GEO (státní lesy), přes který jdou cykly 4–8
   v JOSM, má v adrese **přístupový klíč** a z tohoto prostředí neodpověděl (25 s timeout); stránka „Open access WMS“ je
   „coming soon“.
2. **Mapa povrchů není nikde jako služba.** Riga má výborné otevřené geoportál GEO RĪGA (CC BY 4.0), ale bez vrstvy
   vozovka/chodník; podrobná topografická databáze (ADTI 1 : 500) je jen na žádost (DGN, poplatek 2 EUR). Další města
   (Daugavpils, Liepāja, Jelgava, Jūrmala) mapu povrchů veřejně nemají (nenalezeno).
3. Budovy jsou dobré (katastr VZD: podlaží nad zemí, rok, materiál; CC BY 4.0), ale **jen jako statický soubor při
   nasazení** (služby katastru z tohoto prostředí neodpověděly, GEO RĪGA nemá CORS pro nás).

Bez ortofota by profil v Lotyšsku byl jen odhad z OSM (jako `cizina`), bez přeměření pruhů. Pokud LĢIA přístup dá a
dovolí ho z prohlížeče, je to „s podmínkou“: ortofoto 20 cm celé země + budovy z katastru + Photon, zbytek odhad z OSM.

### Rozhodnutí pro Báru

1. Požádat LĢIA (e-pieteikumi.lgia.gov.lv nebo pakalpojumi@lgia.gov.lv) o bezplatný přístup k WMS 8. cyklu (2022–2024,
   CC BY 4.0) a zeptat se, zda smí být přihlašovací údaj/klíč v prohlížeči veřejné stránky (jinak jen přes vlastní proxy).
   Bez toho Lotyšsko odložit.
2. Riga: použít ortofoto GEO RĪGA 2022 (2 cm, CC BY 4.0, jen historické centrum s ochranným pásmem a 13 území, ke stažení
   po listech 1 : 500 v TIF/ECW) jako dlaždice na R2 při nasazení? Velký objem, jen část města.
3. Budovy: statický výtah z katastru VZD (podlaží nad zemí, rok, materiál zdí, užití; 242 MB XML + SHP po krajích) při
   nasazení, nebo jen OSM? V Rize navíc LOD1 (výšky) a vrstvy GEO RĪGA (období výstavby, dřevěné domy, sériové paneláky).
4. Požádat Rigu (georiga@riga.lv) o CORS pro `streetspace.eu` na `georiga.lv/server` (zóny 30/20, obytné zóny, cyklo,
   období výstavby by šly dotazem při kliknutí), nebo brát otevřená data staticky?
5. Normy: koupit LVS 190-2 (normální příčné profily) a LVS 190-7 (parkoviště), nebo varovat jen podle návrhu LVS 190-9
   (cyklo, chodník 1,5 m) a zbytek nechat bez varování?
6. Zákon o stání: „3 m od protější hrany vozovky“ (bod 121.4 pravidel) brát jako `freeLane: 3` na celou zbývající šířku,
   ne na směr (viz NORMY.md B1)?

---

## 1. Ortofoto

| Zdroj | URL | Ověřený stav | CORS | Klíč | Licence | Použitelné |
|---|---|---|---|---|---|---|
| LĢIA otevřené ArcGIS `OPEN_DATA` | `https://wms.lgia.gov.lv/open/rest/services/OPEN_DATA?f=json` | **ověřeno**: jen `Ortofoto1_bw`, `Ortofoto2_rgb`, `Ortofoto3_rgb` (cykly 1994–2008), `LGIA_pamatkarte`, `Latvijas_pilsetu_ortofotokartes`, `Vdb`. `Ortofoto3_rgb`: wkid 3059, `fullExtent` NaN, žádné vrstvy; `LGIA_pamatkarte` jen vrstva `fons`, export 3857 u Rigy = prázdné PNG 383 B (stejně jako u Estonska) | echo | ne | CC BY / CC0 (JOSM, neověřeno) | **ne** (prázdné a staré) |
| LĢIA INSPIRE ortofoto (7. cyklus 2019–2021, 25 cm) | `https://wms.lgia.gov.lv/arcgis/rest/services/INSPIRE/INSPIRE_ORTO/MapServer` a `…/WMTS/1.0.0/WMTSCapabilities.xml` | **ověřeno: HTTP 401** (Tomcat) | – | **ano** (přihlášení) | „Authorized approach with the Creative Commons 4.0 license terms“, zdarma ([stránka LĢIA](https://www.lgia.gov.lv/en/inspire-orthophoto-maps)) | **s podmínkou** (registrace) |
| LĢIA WMS 8. cyklu (2022–2024, RGB i CIR) | adresa se dá až po licenci | neověřeno | neověřeno | **ano** | „Free data, authorized access after signing the license“ ([WMS servisi](https://www.lgia.gov.lv/en/wms-servisi)); otevřená licence CC BY 4.0, uvádět LĢIA jako autora (prezentace LĢIA 2025, neověřeno přímo) | **s podmínkou** |
| LVM GEO (AS Latvijas valsts meži) `geoserver.lvmgeo.lv/wms<klíč>`, vrstvy `public:Orto_4cikls` … `Orto_8cikls`, `Orto_LKS` | z [JOSM Maps/Latvia](https://josm.openstreetmap.de/wiki/Maps/Latvia) | **ověřeno**: `geoserver.lvmgeo.lv` se přeloží (195.13.215.225), ale do 25 s neodpoví; `lvmgeoserver.lvm.lv` NXDOMAIN. Podle JOSM EPSG:3059 i 3857, 8. cyklus 0,2 m (na východní hranici družicové snímky) | neověřeno | **klíč v adrese** (není náš) | odkaz na lvmgeo.lv/en/data, licence tam není; „Open access WMS/WMTS/WFS“ = „coming soon“ (**ověřeno** WebFetch) | **ne** bez souhlasu LVM |
| Riga GEO RĪGA: ortofoto 2022 | [georiga.eu/en/atvertie-dati/lidar-point-cloud](https://georiga.eu/en/atvertie-dati/lidar-point-cloud/) | **ověřeno** (text stránky): nálet 8.–9. 2022, **2 cm/px**, TIF a ECW po listech TKS-93 1 : 500, LKS-92 TM; jen historické centrum, ochranné pásmo a 13 chráněných území zástavby; stahuje se klikem v mapě (žádná služba) | – (soubory) | ne | **CC BY 4.0** (stránka „Atvērtie dati“, odkaz na legalcode.lv) | **s podmínkou** (dlaždice při nasazení na R2, jen část Rigy) |
| LĢIA historická městská ortofota 1997–2002 | data.gov.lv `latvijas-pilstu-ortofotokartes-1997-2002-g` | ověřeno v katalogu (CC0) | – | – | CC0 | ne (staré) |

Shrnutí: **celostátní aktuální ortofoto z prohlížeče bez registrace neexistuje.** Hranice: Lotyšsko sousedí s Ruskem a
Běloruskem; 8. cyklus má podle JOSM u východní hranice jen družicové snímky (neověřeno).

## 2. Mapy povrchů ulic

| Město | Zdroj | Ověřený stav | CORS | Licence | Použitelné |
|---|---|---|---|---|---|
| Riga | **GEO RĪGA ArcGIS Server** `https://georiga.lv/server/rest/services` (ArcGIS 10.91, asi 200 služeb) | **ověřeno**: seznam služeb přečten. **Žádná vrstva vozovek a chodníků.** Nejblíž: `AMD_UP_TAN_apsaimniekotas_teritorijas` (plochy v údržbě s výměrou tvrdého povrchu a trávníku, ne obrysy povrchů), `Ielu_uzturesanas_kategorijas` (osy ulic, kategorie údržby), `Sarkanas_linijas` (uliční čáry = hranice uličního prostoru), `Veloinfrastruktura` (čáry: velojoslas, velosipēdu ceļi, kopīgi/dalīti gājēju un velosipēdu ceļi), `atruma_ierobezosanas_zonas_2025` (polygony: dzīvojamā zona, 20 km/h, 30 km/h), `Rigas_satiksme` (zastávky, trasy tramvají/autobusů/trolejbusů), `Neregulejamas_gajeju_parejas`, `Luksofori`, `Nodevu_dalijums_zonas` | **bez CORS pro nás**: `Vary: Origin`, hlavičku dostane jen `https://georiga.lv` (ověřeno s Originem georiga.lv i arcgis.com) | otevřená data GEO RĪGA **CC BY 4.0** ([Atvērtie dati](https://georiga.eu/atvertie-dati/)); u služby samotné licence neuvedena | **ne při kliknutí**; uliční čáry, cyklo a zóny jako statické soubory (data.gov.lv, CC BY 4.0) |
| Riga | ADTI (augstas detalizācijas topogrāfiskā informācija, 1 : 500) | neověřeno dotazem: podle [riga.lv](https://www.riga.lv/en/services/provision-topographical-information-database) jen na žádost přes eriga.lv nebo geo@riga.lv, DGN, poplatek 2 EUR | – | neuvedena | ne (jen na žádost) |
| Daugavpils, Liepāja, Jelgava, Jūrmala | – | `gis./geo./kartes.<město>.lv` neexistují (NXDOMAIN, ověřeno); vyhledávání nic nenašlo; na data.gov.lv Liepāja 12 datových sad, žádná o ulicích (ověřeno) | – | – | **nenalezeno** |
| Celostátně | VSIA Latvijas Valsts ceļi `raim-nododamie-dati` (CSV státních a obecních silnic, ielas un brauktuves) | ověřeno jen v katalogu data.gov.lv (CC0) | – | CC0 | jen tabulky, ne plochy |

Závěr: Lotyšsko nemá žádnou otevřenou mapu povrchů od obruby k obrubě. Pro Rigu se dá ze statických dat vzít šířka
uličního prostoru (uliční čáry `Sarkanas_linijas`), cyklotrasy a zóny rychlosti.

## 3. Budovy

| Zdroj | URL | Ověřený stav | CORS | Licence | Použitelné |
|---|---|---|---|---|---|
| **Katastr VZD, textová data** `kadastra-informacijas-sistemas-atvertie-dati`, soubor 5 `building.zip` (XML 242 MB, stav 21. 11. 2026) | [data.gov.lv](https://data.gov.lv/dati/eng/dataset/kadastra-informacijas-sistemas-atvertie-dati) | **ověřeno** (katalog a schéma XSD `BuildingFullData.xsd`): prvky **`BuildingGroundFloors`** (podlaží nad zemí), `BuildingUndergroundFloors`, **`BuildingExploitYear`** (rok uvedení do užívání), `BuildingAcceptionYears`, `BuildingMaterialKind` (materiál), `BuildingUseKind` (užití); data o vlastnících v otevřené sadě nejsou (popis sady) | – (soubor) | **CC BY 4.0** | **ano, staticky při nasazení** (spojit s obrysy přes kadastrální číslo) |
| Katastr VZD, prostorová data `kadastra-informacijas-sistemas-atverti-telpiskie-dati` (SHP po krajích a městech, Riga 21,8 MB) | data.gov.lv | ověřeno v katalogu | – | CC BY 4.0 | ano (obrysy budov) |
| VZD INSPIRE „Ēkas“ (WFS, WMS, Atom; EPSG:4258, týdenní aktualizace) | `https://geo-dpps.viss.gov.lv/api/DPPSPackage/client/Ekas_un_bu_219_tpaJSL/…`, `https://grafws.kadastrs.lv/atom/bu/atom.xml` (z API geolatvija.lv, `licenseType: OPEN`) | **ověřeno: obě adresy z tohoto prostředí 30–40 s bez odpovědi** (DNS ano, spojení ne) | neověřeno | otevřená (CC BY 4.0 v katalogu) | neověřeno, zkusit z jiné sítě |
| Riga GEO RĪGA `PAD_eku_buvniecibas_periods` (budovy podle období výstavby: do 1699 … 1865–1899, 1900–1920, 1921–1940, 1941–1976, posledních 50 let) | `georiga.lv/server/rest/services/PAD_eku_buvniecibas_periods/MapServer/13–21` | **ověřeno** dotazem u Brīvības ielas: adresa, `exploitstartdate` (např. Dzirnavu iela 59: 1875), užití; pole `crownershipmark` nečteno | **bez CORS** | neuvedena (u otevřených dat CC BY 4.0) | jen staticky |
| Riga `koka_ekas_Riga` (dřevěné domy), `REA_PAD_serijveida_ekas` (sériové domy: pole `serija`, `ekspl_gads`), `PAD_eku_sienu_konstruktivais_buvmaterials` (materiál zdí) | totéž | ověřena pole (ne obsah) | bez CORS | neuvedena | **cenné pro vzhled domu** (dřevák, panelák podle série), staticky |
| Riga LOD1 (výšky budov) `rigas-lod1-modelis` | data.gov.lv (GDB 113 MB, CityGML 178 MB) | ověřeno v katalogu | – | CC BY 4.0 | staticky (výška) |
| Riga „Būves Rīgas administratīvajā teritorijā“ (`esosas_buves.gpkg` 51 MB, LKS-2020 TM, 1 : 2000, aktualizováno 22. 11. 2026) | data.gov.lv | ověřeno v katalogu | – | CC BY 4.0 | obrysy staticky |

## 4. Hledání adres a ulic

| Služba | Ověřený stav | CORS | Licence | Použitelné |
|---|---|---|---|---|
| **Photon** (komoot) | **ověřeno**: „Brīvības iela 40 Rīga“ → 3 výsledky na adrese (24,1188; 56,9546) | `*` | ODbL | **ano (záloha jako jinde)** |
| LĢIA `OPEN_DATA/Vdb/FeatureServer` (místní názvy: body, čáry, centroidy ploch) | ověřeno (seznam vrstev) | echo | otevřená data LĢIA | jen názvy míst, ne adresy |
| VZD Valsts adrešu reģistrs | služba pro prohlížeč nenalezena (jen INSPIRE záznam, dati@vzd.gov.lv) | – | – | ne |
| kartes.lv Geocoding API | neověřeno; podle [dokumentace](https://developers.kartes.lv/en/geocoding/) s klíčem klienta | – | komerční | ne |
| Riga `Ielas_adreses` (GEO RĪGA) | v seznamu služeb | bez CORS | CC BY 4.0 (open data) | ne při kliknutí |

## 5. OSM a hranice

- **Geofabrik** (**ověřeno** 23. 11. 2026, HEAD): `europe/latvia/latvia-latest.osm.pbf` → `latvia-261122.osm.pbf`,
  **141 853 252 B = 141,9 MB**, bez podoblastí. **Dělit pod 512 MB netřeba**, jeden balík `lv` (po zabalení odhadem
  kolem 50 MB, odhad podle Estonska 125 MB → 45 MB).
- Hranice: GISCO `CNTR_RG_01M_2024_4326` (stejně jako ostatní státy v `tools/build_states.mjs`); soubor GISCO odpovídá s
  CORS `*` (ověřena dostupnost NUTS 0 souboru, samotný polygon LV neprohlížen).

## 6. Zvláštnosti

- **Pravostranný provoz** (CSN Nr. 279 bod 114: stání „ceļa labajā pusē“).
- **Jazyk** lotyština (`lv`, soubor `app/public/lv.js` už existuje); ruština je menšinový jazyk, nepřidávat. Jména ulic
  v OSM a katastru jsou lotyšsky s diakritikou (ā, č, ē, ģ, ī, ķ, ļ, ņ, š, ū, ž).
- **Typy domů v ulicích** (podle vrstev GEO RĪGA, ne z fotek; čtvrti a styly jsou obecná znalost, **neověřeno**):
  středověká a hanzovní Vecrīga; činžáky 1865–1920 včetně **secese** (Alberta iela); **dřevěné domy** 19. a počátku
  20. století (Riga má vlastní vrstvu `koka_ekas_Riga`); meziválečný funkcionalismus; **sovětské sériové domy** (vrstva
  `REA_PAD_serijveida_ekas` s polem `serija` a rokem, obsah nečten); nová výstavba. Paneláky tedy ano (jako v CZ, SK,
  PL, EE). Než se vzhled domů zapojí, ověřit na fotkách z ulice (Riga, Liepāja).
- **Citlivé hranice**: Rusko a Bělorusko (pohraniční pásmo „Pierobeža“, značky 547–550); Bára rozhodne, jestli tam
  něco omezit. Lotyšsko–Estonsko (Valka/Valga) je jedno město přes hranici.
- Souřadnice: národní LKS-92 TM (EPSG:3059) a nově LKS-2020 TM (Riga už v ní publikuje). Aplikace bere jen 3857/4326.
- Některé státní hosty (`geo-dpps.viss.gov.lv`, `grafws.kadastrs.lv`, `riga.lv` přes curl) z tohoto prostředí
  neodpověděly; může jít o omezení podle sítě. Zopakovat z jiné sítě, než se rozhodne.

## Souhrnná tabulka

| Oblast | Zdroj | Stav | CORS | Licence | Doporučení |
|---|---|---|---|---|---|
| Ortofoto celostátní | LĢIA 8. cyklus 2022–2024 (20 cm) | ověřeno jen to, že je za přihlášením (INSPIRE 7. cyklus 401) | neověřeno | CC BY 4.0 po podpisu licence | **požádat LĢIA**, jinak odložit |
| Ortofoto otevřené | LĢIA `OPEN_DATA` | ověřeno, prázdné, 1994–2008 | echo | CC BY / CC0 | ne |
| Ortofoto Riga | GEO RĪGA 2022, 2 cm, centrum | ověřeno (stránka), soubory | – | CC BY 4.0 | možná, statické dlaždice |
| Mapa povrchů | – | nenalezena v žádném městě | – | – | odhad z OSM |
| Uliční prostor Riga | `Sarkanas_linijas` (open data) | ověřeno v katalogu | – | CC BY 4.0 | staticky, šířka fasáda–fasáda |
| Cyklo, zóny Riga | `Veloinfrastruktura`, `atruma_ierobezosanas_zonas_2025` | ověřeno (vrstvy) | bez CORS | CC BY 4.0 (open data) | staticky |
| Budovy | katastr VZD (podlaží, rok, materiál) | ověřeno (schéma, katalog) | – | CC BY 4.0 | **staticky při nasazení** |
| Budovy Riga | LOD1, období výstavby, dřevěné, sériové | ověřeno | bez CORS | CC BY 4.0 | staticky |
| Hledání | Photon | ověřeno | `*` | ODbL | ano |
| OSM | Geofabrik `latvia` 141,9 MB | ověřeno | – | ODbL | jeden balík `lv` |

Zdroje (stránky s licencí): [LĢIA WMS servisi](https://www.lgia.gov.lv/en/wms-servisi),
[LĢIA INSPIRE ortofoto](https://www.lgia.gov.lv/en/inspire-orthophoto-maps), [LĢIA atvērtie dati](https://www.lgia.gov.lv/en/atvertie-dati),
[GEO RĪGA Atvērtie dati](https://georiga.eu/atvertie-dati/), [data.gov.lv VZD katastr](https://data.gov.lv/dati/eng/dataset/kadastra-informacijas-sistemas-atvertie-dati),
[JOSM Maps/Latvia](https://josm.openstreetmap.de/wiki/Maps/Latvia), [LVM GEO data](https://www.lvmgeo.lv/en/data).
