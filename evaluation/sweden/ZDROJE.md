# Data pro Švédsko (SE): ověřené otevřené služby (pro profil ulic)

Ověřeno 23. 11. 2026, asi 45 požadavků na služby (plus čtení předpisů a katalogů), User-Agent `profily-ulic`, pauzy mezi
dotazy, Origin `https://streetspace.eu`. Overpass ani Nominatim nebyly použity, žádné osobní údaje se neposílaly, žádný klíč
ani přihlašovací údaje.

Značení: **ověřeno** = odpověď přišla a byla přečtena (u obrázků i prohlédnuta); **neověřeno** = jen z dokumentace,
katalogu nebo vyhledávání. CORS „`*`“ = `Access-Control-Allow-Origin: *`; „echo“ = server vrací náš Origin.

Zkušební body: Stockholm Drottninggatan / Vasagatan (18,064; 59,334), Göteborg Kungsportsavenyn (11,969; 57,705).

## Verdikt

**Přidat s podmínkou.** Švédsko má výborné ortofoto (Stockholm 0,16 m, nálet 2025), ale **z prohlížeče legálně bez
klíče dostupné není**: úřední WMS Lantmäteriet „Ortofoto Visning“ chce přihlášení a podle Lantmäteriet zůstávají
prohlížecí služby **placené**; zdarma (CC BY 4.0) jsou jen soubory COG ke stažení přes STAC, a to **po žádosti
a právním posouzení podle GDPR** (Lantmäteriet považuje ortofoto za osobní údaje) a s přístupem přes Basic auth.
Služba `minkarta.lantmateriet.se` odpovídá bez klíče a s CORS, ale je to zázemí spotřebitelské aplikace Min karta,
ne služba pro cizí aplikace (nepoužívat). Otevřené ortofoto s CORS a CC0 má jen **Göteborg** (2025).
Mapu povrchů s plochami vozovky a chodníku nemá žádné z velkých měst; **Malmö** a **Göteborg** mají otevřené (CC0)
**čáry obrubníků a okrajů chodníků**, Stockholm otevřené dopravní vrstvy (šířka vozovky z NVDB, úseky stání, cyklotrasy).
Budovy s podlažími nebo výškou otevřené z prohlížeče nejsou (Lantmäteriet „Byggnad“ jen po žádosti). Normy jsou dobře
doložené z první ruky (závazné TSFS 2021:122, doporučené VGU 2024). OSM: 1,0 GB, Geofabrik Švédsko nedělí, takže
balíky je potřeba rozřezat po svém.

**Podmínka:** bez ortofota by švédský profil byl jen odhad z OSM (bez pruhů z ortofota, mimo Göteborg). Rozumné cesty:
(a) přidat teď jen s Göteborgem jako ortofotem a zbytek jako odhad z OSM, nebo (b) požádat Lantmäteriet o přístup
k ortofotu (STAC, CC BY 4.0) a číst COG přes proxy (Cloudflare Worker s Bářinými údaji), nebo (c) zeptat se Lantmäteriet,
zda smí cizí aplikace používat Ortofoto Visning / Min karta. Doporučuji (a) jako začátek a souběžně (c).

### Rozhodnutí pro Báru
1. Ortofoto: začít jen s Göteborgem (CC0), nebo nejdřív žádost u Lantmäteriet (STAC s GDPR posouzením, nebo dotaz na
   Ortofoto Visning)? `minkarta` nepoužívat ani když technicky funguje (souhlas?).
2. Proxy přes Cloudflare Worker s přihlašovacími údaji Lantmäteriet (jen kdyby přístup povolili): Lantmäteriet podmiňuje
   US cloud tím, že poskytovatel je v EU-U.S. Data Privacy Framework (podmínky 3.5); chce to Bára?
3. Čáry obrubníků Malmö (CC0, jen soubor 150 MB) předpočítat při nasazení jako statický soubor/dlaždice, a Göteborg
   baskarta jen jako obrázek čar (jako technická mapa Bratislavy `?tm=1`)? Nebo zatím vynechat?
4. Stockholm Trafikkontoret (licensfritt): zapojit úseky stání (LTFR) a šířku vozovky NVDB jako nápovědu při kliknutí?
   Dokumentace mluví o API klíči, dotazy bez klíče teď fungují.
5. OSM: rozřezat Švédsko (1 011 MB) na 3 nebo 4 balíky pod 512 MB podle vlastních hranic (např. Götaland / Svealand /
   Norrland), jen na R2. Nový mechanismus v `osm-tiles.yml` (Geofabrik podoblasti nemá).
6. Miljonprogrammet (1965–1975, prefabrikované bloky): vzhled „nový poválečný bytový dům“ jako všude na západě, nebo
   panelák? (Pravidlo z 23. 11. 2026 dává paneláky jen CZ, SK, PL, EE a bývalé NDR.)
7. Normy: v Návrhu brát závazné minimum TSFS (cyklostezka 1,8 m obousměrně) červeně a VGU (doporučené obcím) oranžově?
8. Značky: švédské kresby na Commons jsou označené jako volné dílo, ale § 9 odst. 2 švédského autorského zákona chrání
   „alster av bildkonst“ i v úředních dokumentech (viz NORMY.md, C1). Přijmout označení Commons?

---

## 1. Ortofoto

| Zdroj | URL | Stav | CORS | Klíč | Licence | Použitelné |
|---|---|---|---|---|---|---|
| **Lantmäteriet Ortofoto Visning** (úřední WMS) | `https://maps.lantmateriet.se/ortofoto/wms/v1.3` | **ověřeno**: GetCapabilities **401** `Basic realm="Authorization Server"` | hlavička u 401 chybí | **ano** (účet Geotorget, Basic auth) | prohlížecí služby **placené** (tisková zpráva Lantmäteriet 3. 2. 2025: „Lantmäteriets visningstjänster kommer att vara fortsatt avgiftsbelagda“, **ověřeno** na via.tt.se) | **ne** (klíč by byl v prohlížeči vidět, placené) |
| Lantmäteriet „otevřené“ capabilities | `https://maps.lantmateriet.se/capabilities/inspire/ortofoto/wms/v1.3` | **ověřeno**: 404 (adresa z technického popisu V1.6.0 nefunguje) | – | – | – | – |
| Technický popis Ortofoto Visning V1.6.0 | `lantmateriet.se/globalassets/geodata/geodatatjanster/ortofotovisningv1.6.0-tekniskbeskrivning.pdf` | **ověřeno** (přečteno): vrstvy `Ortofoto_0.16`, `_0.25`, `_0.4`, `_0.5`, `Ortofoto_IR`, k nim `_meta` (rok náletu) a `_fs` (švy a čas náletu); SRS mimo jiné **EPSG:3857**, 3006, 4326; obrázek do 4096 px | – | – | – | – |
| **Min karta** (zázemí aplikace Lantmäteriet) | `https://minkarta.lantmateriet.se/map/ortofoto/` (WMS 1.1.1, tytéž vrstvy) | **ověřeno**: GetCapabilities 200 (93 KB, SRS i `epsg:3857`), GetMap `Ortofoto_0.16` v EPSG:3857 u Drottninggatan 200 `image/jpeg`, ostré (prohlédnuto, cca 0,2 m/px na výřezu); vrstva `Ortofoto_0.16_meta` ukazuje **2025** pro střed Stockholmu; GetFeatureInfo vypnuté | **`*`** | ne | žádná pro cizí užití; OSM fórum (12/2025, neověřeno u úřadu) považuje Min karta za koncovou aplikaci, ne datovou službu | **ne bez souhlasu Lantmäteriet** |
| **Lantmäteriet STAC (otevřená ortofota ke stažení)** | `https://api.lantmateriet.se/stac-bild/v1/` | **ověřeno**: katalog 200, CORS `*`, 738 kolekcí `orto-*` (např. `orto-o2-2025`), každá `license: CC-BY-4.0`; hledání u Drottninggatan vrátilo COG `dl1.lantmateriet.se/bild/data/orto/se0_16m_sweref/2025_O2/...tif` (nálet 31. 5. 2025, SWEREF 99 TM); **čtení COG (Range) bez přihlášení 401** Basic auth; náhled (`_thumbnail.jpg`) 200 | data: echo `https://streetspace.eu`, povoluje hlavičky `Authorization` a `Range` | **ano** (Geotorget, po žádosti) | **CC BY 4.0**; popis katalogu: „Din användning kommer att prövas juridiskt, i enlighet med dataskyddsförordningen (GDPR), och du behöver godkänna särskilda användningsvillkor“ (**ověřeno**) | **s podmínkou**: žádost u Lantmäteriet + proxy s přihlášením; COG je v SWEREF 99 TM, ne 3857 (převod v aplikaci nebo v proxy) |
| Podmínky pro HVD s osobními údaji | `lantmateriet.se/globalassets/geodata/geodataprodukter/anvandningsvillkor_for_vardefulla_datamangder_pu.pdf` (4. 3. 2025, v. 1.1) | **ověřeno** (přečteno): CC BY 4.0; uvádět název produktu, „©Lantmäteriet“, že byla data upravena, a CC BY 4.0 (3.1); uživatel je správce osobních údajů, smí je zpracovávat jen k účelu schválenému rozhodnutím (3.3), jen v EU/EHP, US cloud jen s DPF (3.5); namátkové kontroly, odebrání přístupu (4.1–4.4) | – | – | – | – |
| Obecná otevřená data Lantmäteriet | `lantmateriet.se/sv/geodata/vara-produkter/avgiftsfria-produkter/oppna-data/` | **ověřeno**: CC0, uvedení zdroje nepovinné; seznam produktů jen na Geotorgetu (JavaScript) | – | – | CC0 | ortofoto mezi CC0 produkty **neověřeno** (podle STAC je CC BY 4.0) |
| **Göteborg Ortofoto WMS** | `https://opengeodata.goteborg.se/services/ortofoto/wms/v1` | **ověřeno**: GetCapabilities 200, vrstvy `orto` (nejnovější) a `orto_2015` … **`orto_2025`**, CRS 3006, 3007, **3857**, 4326; GetMap `orto_2025` 3857 u Kungsportsavenyn 200 JPEG, ostrý jarní snímek bez listí (prohlédnuto: tramvaje, přechody, čáry čitelné) | **`*`** | ne | **CC0** (capabilities: Fees „Kostnadsfri“, AccessConstraints „Inga begränsningar (CC0)“; popis produktu 2022: „Åtkomst: Öppen. Ingen autentisering. Nyttjanderätt: Creative Commons CC0“) | **ano** (jen území Göteborgu; rozlišení podle popisu produktu 0,25 m, skutečná ostrost snímku 2025 vypadá lépe, neověřeno) |
| Stockholm, ortofoto města | dataportalen.stockholm.se, „Allmän produktspecifikation Ortofoto“ | **neověřeno** (jen výpis z vyhledávání): autorské právo Stadsbyggnadskontoret, otevřená licence neuvedena | – | – | neotevřené | ne |
| Malmö, ortofoto | `opendata-api.malmo.se` (CKAN) | **ověřeno**: hledání „ortofoto“ vrací jen datovou sadu vodorovného značení | – | – | – | nenalezeno |

Kredit pro Göteborg: „Ortofoto Göteborgs Stad (CC0)“ (CC0 kredit nevyžaduje).

---

## 2. Mapy povrchů ulic

| Město | Zdroj | Obsah | Stav | CORS | Licence | Použitelné |
|---|---|---|---|---|---|---|
| **Stockholm** | Trafikkontoret WFS `https://openstreetgs.stockholm.se/geoservice/api/wfs` (WFS 1.1.0, GeoServer za `apigw.stockholm.se`) | 113 vrstev: **LTFR** (lokální dopravní předpisy: úseky povoleného stání `LTFR_P_TILLATEN_GEOM`, zákaz stání, stání ZTP, zásobování, taxa), **NVDB** (`NVDB_Vagbredd` šířka vozovky `Bredd`, `NVDB_GCM-vagtyp`, `NVDB_Kollektivkorfalt`, `NVDB_Gagata`, `NVDB_Gangfartsomrade`, `NVDB_Hastighetsgrans`), cyklotrasy, stromy/„Skelettjord“, osvětlení… **Žádné plochy vozovky a chodníku.** | **ověřeno**: GetCapabilities 200; GetFeature `NVDB_Vagbredd` s `bbox=…,CRS:84` a `srsName=EPSG:4326` vrátil úseky u Drottninggatan (šířky 3,0 / 6,4 / 7,8 / 8,3 m); `LTFR_P_TILLATEN_GEOM` vrací čáry stání (bez bbox v EPSG:3011); vše **bez API klíče**, i když návod mluví o klíči | **`*`** | stránka služby: „Datainnehåll i dessa tjänster får vidareutnyttjas fritt och tillhandahållas ‚licensfritt‘ om inget annat anges“ (**ověřeno**) | **s podmínkou**: jen nápověda (šířka vozovky, stání); bbox v WGS 84 nutno poslat jako `CRS:84` (osa x = délka) |
| **Göteborg** | Baskarta WMS `https://opengeodata.goteborg.se/services/baskarta/wms/v2` | vrstvy `kommunikation` (okraje vozovky s obrubníkem `VAG_KANTSTEN`, bez obrubníku, chodníky, koleje), `byggnad`, `markdetaljer`, `anlaggningar`…; **jen čáry**, vrstvy `queryable="0"` (bez GetFeatureInfo); WFS vypnutá („Service WFS is disabled“) | **ověřeno**: GetMap `kommunikation,byggnad` 3857 PNG, prohlédnuto: obrubníky, koleje a obrysy domů na Kungsportsavenyn | **`*`** | **CC0** (capabilities „Inga begränsningar (CC0)“; popis „Baskarta DWG“ v2.1, 11/2025: CC0, aktualizace denně) | **s podmínkou**: jako obrázek čar (jako technická mapa Bratislavy); balík DWG z popisu (`/downloads/baskarta/baskarta_dwg_v2.zip`) vrací **404** |
| **Malmö** | CKAN `opendata-api.malmo.se`, datová sada `transport-primarkarta` | čáry základní mapy: `LAGER` = **Gangbana** (115 tis.), **Kantsten** (77 tis.), **Vagkant** (35 tis.), Bro, Perrong, Sparvagsspar…; jen soubory (GeoJSON 4326 **150 MB**, GPKG 3006/3008/4326, SHP, CSV 2 MB), žádná služba; „Primärkartan … inte kompletta i alla delar av staden“ | **ověřeno**: metadata balíčku a CSV atributů (přečteno); stažení vrací 302 s CORS `*` | `*` | **CC0** (`license_id: cc-zero`) | **s podmínkou**: předpočítat při nasazení (statické dlaždice čar), jinak ne |
| Malmö | `vagmarkeringar` (vodorovné značení, GeoJSON + DWG) | čáry značení | **neověřeno** (jen v hledání CKAN) | – | licence neuvedena | později |
| Uppsala (4. město) | – | – | **neověřeno** (nehledáno do hloubky; OSM wiki uvádí CC0 obce pro otevřená data, neověřeno) | – | – | – |
| Celostátní NVDB (Trafikverket) | Lastkajen / Trafikverket API | šířky vozovek, typy cest, rychlosti | **neověřeno** (přímý přístup chce účet nebo klíč; ve Stockholmu je NVDB v městské WFS, viz výše) | – | NVDB běžně CC0 (neověřeno) | později |

---

## 3. Budovy

| Zdroj | Stav | Pole | Licence | Použitelné |
|---|---|---|---|---|
| Lantmäteriet „Byggnad“ (HVD) | **neověřeno** dotazem; podle tiskové zprávy (**ověřeno**) jsou budovy mezi HVD zdarma, ale data s osobními údaji jen po účtu, uvedení účelu a výběru území; OSM fórum (2. ruka) říká, že Lantmäteriet považuje budovy za osobní údaje | obrysy, účel (výška/podlaží neověřeno) | CC BY 4.0 po schválení | **ne** z prohlížeče |
| Malmö `byggnader-primarkarta` | **ověřeno** (CSV atributů): jen `TYP` (offentlig / ej_offentlig) a `STATUS` (befintlig, bygglovsansökan); **bez výšky, podlaží i roku** | obrys | CC0 | jen obrysy (OSM to umí také) |
| Göteborg baskarta `byggnad` | **ověřeno** jako obrázek (obrysy) | – | CC0 | jen obrysy |
| 3D modely měst (3CIM, Stockholm/Göteborg/Malmö) | **neověřeno**: společná specifikace 3CIM (CityGML ADE) existuje, otevřená data s výškami jsem nenašla | – | – | později |
| OSM (`building:levels`, `height`, `start_date`) | **neověřeno** pokrytí | – | ODbL | výchozí zdroj |

---

## 4. Hledání adres a ulic

| Služba | Stav | Poznámka |
|---|---|---|
| Lantmäteriet Belägenhetsadress | **neověřeno**: adresy jsou HVD s osobními údaji (účet, účel) | z prohlížeče ne |
| **Photon (komoot)** `https://photon.komoot.io/api/?q=…` | **ověřeno**: 200, CORS `*`; „Kungsportsavenyen 10 Göteborg“ → dům (11,97403; 57,70136), `countrycode: SE` | **Použít** (jako Rakousko a Německo; ODbL) |

---

## 5. OSM (Geofabrik) a hranice

- **Geofabrik** (**ověřeno** 23. 11. 2026): `europe/sweden/sweden-latest.osm.pbf` → `sweden-261122.osm.pbf`, **1 011 MB**
  (Content-Length 1 011 339 249). Index Geofabriku **nemá žádné podoblasti Švédska** (rodičem `sweden` není nic).
  Nad limitem 512 MB na balík: nutné vlastní rozřezání (osmium extract podle polygonů krajů nebo obdélníků), např.
  Götaland / Svealand / Norrland, případně Stockholmský kraj zvlášť; jen na R2.
- **Hranice**: `tools/build_states.mjs` Švédsko zatím nemá; GISCO `SE` jako u Estonska (neověřeno pro SE: ostrovy Gotland,
  Öland, souostroví). Citlivé hranice: žádné sporné; Haparanda–Tornio je souvislé město přes hranici s Finskem
  (řez u hranice může padnout do Finska), Øresund most do Dánska.

---

## 6. Ostatní

- **Provoz vpravo** (od 3. 9. 1967, „Dagen H“; neověřeno zdrojem, obecně známé).
- **Jazyk rozhraní**: švédština už je mezi 24 jazyky EU (`sv`, „Gatusektion“, větev `eu-languages`); nic nepřidávat.
  Jazyk ≠ stát: švédské rozhraní v Praze zůstává s českými značkami.
- **Typy domů v ulicích** (podle obecných znalostí, neověřeno fotkami): staré město (Gamla stan, Visby), kamenné činžáky
  „stenstaden“ 1880–1910 (Stockholm Östermalm, Göteborg Linné s „landshövdingehus“: přízemí kamenné, patra dřevěná),
  funkcionalistické „lamellhus“ 1930–1950 (3–4 podlaží), **miljonprogrammet** 1965–1975 (prefabrikované bloky: deska,
  „skivhus“, věžáky), dřevěné domy v malých městech (falunská červeň), rodinné vily. Rozhodnutí 6 výše.
- **Zákon o stání**: viz NORMY.md B.

## Shrnutí v tabulce

| Oblast | Zdroj | Stav | CORS | Licence | Doporučení |
|---|---|---|---|---|---|
| Ortofoto celostátní | Lantmäteriet Ortofoto Visning | ověřeno: 401 | – | placené, účet | ne |
| Ortofoto celostátní | `minkarta.lantmateriet.se` | ověřeno: funguje, 0,16 m, 2025, 3857 | `*` | žádná pro cizí užití | ne bez souhlasu |
| Ortofoto celostátní | STAC `api.lantmateriet.se/stac-bild/v1` (COG) | ověřeno: katalog ano, data 401 | echo | CC BY 4.0 po GDPR posouzení | s podmínkou (žádost + proxy) |
| Ortofoto Göteborg | `opengeodata.goteborg.se/services/ortofoto/wms/v1` `orto_2025` | ověřeno | `*` | CC0 | **použít** |
| Povrchy Stockholm | Trafikkontoret WFS (NVDB šířky, LTFR stání) | ověřeno | `*` | licensfritt | nápověda, s podmínkou |
| Povrchy Göteborg | baskarta WMS v2 (čáry obrubníků) | ověřeno | `*` | CC0 | jako obrázek čar |
| Povrchy Malmö | `transport-primarkarta` (čáry chodníků, obrubníků) | ověřeno (metadata) | `*` | CC0 | předpočítat |
| Budovy | Lantmäteriet Byggnad | neověřeno (po žádosti) | – | CC BY 4.0 | ne; OSM |
| Hledání | Photon | ověřeno | `*` | ODbL | použít |
| OSM | Geofabrik `sweden` 1 011 MB | ověřeno | – | ODbL | rozřezat na 3–4 balíky |

Neověřeno: zda Lantmäteriet dovolí Ortofoto Visning / Min karta v cizí aplikaci; skutečné rozlišení Göteborgu 2025;
pokrytí 0,16 m mimo Stockholm; otevřená data Uppsaly; NVDB celostátně; výšky budov v OSM; licence švédských kreseb značek
podle § 9 odst. 2 URL.

### Zdroje (odkazy)
- Lantmäteriet, podmínky HVD s osobními údaji: https://www.lantmateriet.se/globalassets/geodata/geodataprodukter/anvandningsvillkor_for_vardefulla_datamangder_pu.pdf
- Lantmäteriet, otevřená data (CC0): https://www.lantmateriet.se/sv/geodata/vara-produkter/avgiftsfria-produkter/oppna-data/
- Tisková zpráva 3. 2. 2025 (prohlížecí služby placené): https://via.tt.se/pressmeddelande/3776001/lantmateriets-vardefulla-data-blir-avgiftsfria
- Ortofoto Visning, technický popis: https://www.lantmateriet.se/globalassets/geodata/geodatatjanster/ortofotovisningv1.6.0-tekniskbeskrivning.pdf
- OSM fórum o WMS Lantmäteriet (2. ruka): https://community.openstreetmap.org/t/wms-server-lantmateriet/137129
- Göteborg Ortofoto WMS, popis produktu: https://catalog.goteborg.se/store/6/resource/2689
- Göteborg Baskarta DWG, popis: https://opengeodata.goteborg.se/files/baskarta/baskarta_dwg_v2_sv.pdf
- Stockholm Trafikkontoret otevřená data: https://openstreetgs.stockholm.se/Home/
- Malmö otevřená data: https://opendata.malmo.se/
