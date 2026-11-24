# Mapy povrchů ulic: Izrael, Turecko (a stručně Gibraltar, Maroko, Tunisko, Libanon)

Rešerše bez kódu (24. 11. 2026). Cíl: otevřená mapa povrchů ulic (polygony obrubník–obrubník), ortofoto použitelné
z prohlížeče, budovy, adresy, normy a značky. Navazuje na `A-nove-staty.md` a `B-mezery.md`, nepřepisuje je.

**Metoda.** Ověřeno = dotaz vrátil data a hlavičky jsem přečetl (`curl`, `Origin: https://streetspace.eu`,
`User-Agent: profily-ulic`). Neověřeno = jen z vyhledávání nebo z dokumentu, který se nepodařilo stáhnout. Overpass ani
Nominatim se nepoužily, žádné osobní údaje se neposílaly, nikoho jsem nekontaktoval. Asi 45 požadavků na několik serverů,
mezi nimi pauzy. Několik serverů z této sítě odmítlo spojení (000) nebo vrátilo 403 či 571 (blokace, ne chyba dat);
u těch je uvedeno „neověřeno“.

## Verdikt v kostce

| Stát | Verdikt | Proč |
|---|---|---|
| Izrael | **odložit** (s podmínkou: Tel Aviv a ortofoto ověřit z jiné sítě) | Jediná ověřená otevřená plošná vrstva povrchů je Beer Sheva (město, ne Tel Aviv), a její soubory jsem nemohl stáhnout (403 CloudFront). Tel Aviv GIS vrací 571 na všechny cesty. Ortofoto (GovMap, MAPI) nemám ověřené jako otevřené. |
| Turecko | **odložit** | TKGM ortofoto WMS existuje podle jeho uživatelské příručky, ale URL ani podmínky užití se mi nepodařilo ověřit (stažení příručky vrátilo jiný dokument). İBB (data.ibb.gov.tr) nejde z této sítě otevřít (ECONNREFUSED / 000), Izmir CBS vrací 403. |
| Gibraltar | odložit | Vládní geoportál s ortofotem a základní mapou se zmiňuje, ale bez ověřené služby a licence. |
| Maroko | odložit | Jen OSM (v ČR už máme vlastní balík) a historické mapy. Oficiální otevřené ortofoto nenalezeno. |
| Tunisko, Libanon | neprozkoumáno | Mimo rozsah „jen pokud rychle“; v rešerších se nevynořily žádné otevřené zdroje ulic. |

**Nejlepší kandidáti (seřazeno):**
1. **Beer Sheva (data.gov.il, obec Be'er Sheva, „Other (Open)“)**: vrstva `roads-br7` (hrany asfaltu, obruby, osy) a
   `buildings-br7`. Podmínka: ověřit stažení z jiné sítě, průnik s řezem a kvalitu (fotogrammetrie z 2005).
2. **Tel Aviv-Yafo (gisn/opendatasource)**: teprve až se podaří dosáhnout na server; zatím neověřeno, zda vrstvy
   chodníků a obrub existují.
3. **TKGM ortofoto WMS (Turecko)**: když se potvrdí URL a podmínky užití v dokumentu TKGM nebo v harita-db.
4. **İBB / İzmir**: až z jiné sítě, nejdřív katalog s filtrem „OGC WMS“.

## 1. Izrael (IL)

### 1a. Ověřené zdroje

| Město / organizace | Zdroj | URL | Obsah | CORS | Klíč | Licence | Použitelné |
|---|---|---|---|---|---|---|---|
| Stát (katalog) | data.gov.il, CKAN `package_search` | `https://data.gov.il/api/3/action/package_search?rows=5&q=…` | **ověřeno**: vrací JSON s výsledky (dotazy `road`, `bicycle`, `buildings`, `parking`, `rights-of-way`) | **ověřeno**: `Access-Control-Allow-Origin: *` | ne | různá, u záznamů viz níže | katalog ano; samotná data podle záznamu |
| Beer Sheva (obec) | `roads-br7` (dataset `bdf28cc0-…`) | katalog ověřen; soubor `…/resource/825413d2-…/download/` (GeoJSON) | **metadata ověřena** (`package_show`): „Other (Open)“, popis: „Silnice v celém městě, hrana asfaltu, obruby a hrana vozovky“, vzniklo fotogrammetrií z letecké fotografie 2005 a dílčími údaji z geodetů. Geometrie čar/polygonů z popisu, obsah souboru **neověřeno** | katalog `*`; soubor **403 CloudFront** (blokace) | ne | „Other (Open)“ (data.gov.il) | **s podmínkou**: kandidát na plochy (hrana asfaltu + obruba), stáří 2005 |
| Beer Sheva | `bicycle_track-br7` (GeoJSON), `buildings-br7`, `buildings-preservation-br7`, `bicycles-parking-br7` | katalog ověřen (výsledky dotazu `bicycle`, `buildings`, `parking`); soubory **neověřeno** (403) | cyklotrasy, budovy, stojany na kola (z názvů a katalogu) | katalog `*` | ne | „Other (Open)“ | **s podmínkou**: budovy bez ověřeného patra/roku |
| Stát, MTSB (ministerstvo dopravy) | `urban_road_safety_elements`, `road_strat_2030/2050`, `park_n_ride` | katalog ověřen | bezpečnostní prvky, silniční strategie, P+R | katalog `*` | ne | „Creative Commons Attribution“ (u některých), jinak „Other (Open)“ | ne pro plochy; pozadí a atributy |
| Stát (MŽP) | `greenbuildings` | katalog ověřen | zelené budovy, bez licence v katalogu | katalog `*` | ne | **neuvedeno** | ne (licence chybí) |
| Tel Aviv-Yafo | opendatasource.tel-aviv.gov.il, gisn.tel-aviv.gov.il ArcGIS, apiportal.tel-aviv.gov.il | `https://gisn.tel-aviv.gov.il/arcgis/rest/services?f=json` | **neověřeno**: všechny cesty vracejí **571** (serverová blokace z této sítě), WebFetch také 571 na opendatasource. Vyhledávání nenašlo vrstvu chodníků ani cyklostezek; API portál uvádí „GisLayers REST API“ | **neověřeno** | **neověřeno** (zda ano) | web uvádí volné sdílení „s uvedením zdroje“ (z vyhledávání, neověřeno přímo na stránce) | **zatím neznámé**: nejdřív ověřit z jiné sítě, zda existuje vrstva chodníků a obrub |
| Tel Aviv | opendata.tel-aviv.gov.il | — | **neověřeno** (571) | — | — | — | — |
| Jeruzalém, Haifa | jejich GIS | — | **neprozkoumáno** z této sítě (nejsou jednoznačné adresy) | — | — | — | — |
| Stát (Survey of Israel, MAPI) | ortofoto, GovMap | `https://www.govmap.gov.il/` a `ags.govmap.gov.il` | GovMap: **403 CloudFront** (blokace) ; `ags.govmap…` **000** (nedostupný). Ortofoto **nenalezeno** jako otevřená služba (vyhledávání: jen ISPRS článek o normách MAPI) | — | — | **neověřeno**: GovMap je prohlížeč, ne otevřená licence | **ne** (dokud není ověřena otevřená služba) |
| Stát (katalog ortofoto) | data.gov.il dotaz „orthophoto“ | `…/package_search?q=orthophoto` | **0 výsledků** (ověřeno) | `*` | ne | — | ne |

**Pozn. k dotazu na chodníky**: `q=sidewalk` a `q=bike lane` vrátily **0 výsledků** (ověřeno). Hebrejské dotazy s URL
kódováním z tohoto skriptu nevyšly kvůli chybě v mém shellu (neověřeno), proto je nespouštím znovu.

### 1b. Územní otázky (Izrael)

Bára rozhodne. Nejde o technický problém, ale aplikace musí zvolit, co ukazuje a jak město označí.

- **Východní Jeruzalém**: municipalita Jeruzaléma (katalogy a GIS) území spravuje jako své; mezinárodní právo ho podle
  většiny států a podle EU nepovažuje za součást Izraele. Mapa z obecního zdroje by tu byla „z izraelské municipality“.
- **Západní břeh (Judea a Samaří, osady)**: data izraelských obcí a katastru tam nejsou ověřena; mezinárodně uznávané
  pohledy se liší.
- **Golanské výšiny**: Izrael je anektoval (1981), většina států anexi neuznává. Analogie k uzavřené oblasti severního
  Kypru v aplikaci je přímá.
- Praktický návrh (jen návrh): stejný přístup jako u Kypru (uzavřená oblast nebo neutrální označení „území mimo
  uznanou hranici“), a zdroj tam jen podle státu, jehož data používáme.

## 2. Turecko (TR)

### 2a. Ověřené zdroje

| Město / organizace | Zdroj | URL | Obsah | CORS | Klíč | Licence | Použitelné |
|---|---|---|---|---|---|---|---|
| Stát, TKGM (Tapu ve Kadastro) | ortofoto WMS (podle příručky „Ortofoto Harita Servisleri Kullanım Rehberi“, 2021) | příručka `https://tkgm.gov.tr/sites/default/files/2021-03/Ortofoto%20Harita%20Servisleri%20Kullan%C4%B1m%20Rehberi.pdf` | **neověřeno**: stažení vrátilo obecnou stránku TKGM bez URL služby a bez podmínek. Vyhledávání uvádí, že ortofota jsou sdílena jako WMS a jsou altlasem MEGSİS a HBB | **neověřeno** | **neověřeno** (zda ano) | **neověřeno**. Stránka TKGM má jen copyright „© 2026 Tapu ve Kadastro Genel Müdürlüğü — Tüm Hakları Saklıdır“ (ověřeno), což nic neříká o užití | **odložit**: nejdřív přečíst příručku a `GetCapabilities` z jiné sítě |
| Stát, TKGM | parselsorgu.tkgm.gov.tr (katastr) | `https://parselsorgu.tkgm.gov.tr/app/` | **403**; `Access-Control-Allow-Origin: app://parselsorgu` (cizí aplikace, ne náš původ) | ne | — | — | ne |
| Stát, TKGM | cbsgm.tkgm.gov.tr ArcGIS | `…/arcgis/rest/services?f=json` | **000** (nedostupný) | — | — | — | — |
| Stát, HGM (Harita Genel Müdürlüğü) | harita.gov.tr | — | **000** (nedostupný) | — | — | — | — |
| İstanbul, İBB | Açık Veri Portalı | `https://data.ibb.gov.tr/api/3/action/package_search?…` | **000**, nedostupný (ověřeno několikrát). WebFetch `data.ibb.gov.tr/en/` vrátil **ECONNREFUSED** | — | — | vyhledávání uvádí „İstanbul Büyükşehir Belediyesi Açık Veri Lisansı“, odpovídá CC BY 4.0, **neověřeno** na stránce | **neověřeno**: nelze ověřit. Kandidáti z vyhledávání: `ana-arter-veri-seti` (UKOME, pochybné popisy), solární mapa (WMS) |
| İstanbul, İBB ortofoto | Harita Müdürlüğü | — | vyhledávání nenašlo ortofoto WMS (neověřeno) | — | — | — | **neověřeno** |
| İzmir, BŞB | cbs.izmir.bel.tr | `https://cbs.izmir.bel.tr/` | **200** pro kořen (HTML, bez služby), `…/arcgis/rest/services` **302** na google.com.tr (chyba / přesměrování), `www.izmir.bel.tr` 200 (HTML). Odkazy na „Kent Haritası / 2B Kent Rehberi / Halihazır Harita“ jsou jen záložky portálu | **neověřeno** | — | **neověřeno** | **odložit**: ArcGIS služba není dostupná, otevřený katalog nenalezen |
| İzmir, otevřená data | acikveri / data.izmir.bel.tr | — | **000** | — | — | — | — |
| Ankara (ABB), Bursa, Antalya | — | `cbs.ankara.bel.tr/arcgis/rest/services` | Ankara **404** (ArcGIS cesta neexistuje). Bursa, Antalya **neprozkoumáno** | — | — | — | — |
| Openapi İzmir | openapi.izmir.bel.tr/api/ | `https://openapi.izmir.bel.tr/api/` | **404** (JSON), ale odpověď má `Access-Control-Allow-Origin: *` (ověřeno hlavičkou); žádná datová vrstva | `*` | ne | neuvedeno | ne (bez dat) |

### 2b. Územní poznámka (Turecko)

Turecko samo o sobě nemá území v tomto smyslu jako Izrael. **Severní Kypr (TRNC)** není uznán (kromě Turecka) a
aplikace ho už má jako uzavřenou oblast. Pokud se Turecko nasazuje, je potřeba jen zachovat tuto hranici, ne přidávat
další výjimky. Data TKGM a İBB se týkají jen tureckého území.

## 3. Ostatní (stručně)

- **Gibraltar**: vládní Technical Services Department uvádí, že základní mapu a letecké snímky lze získat přes vládní
  geoportál (vyhledávání, **neověřeno**). Zákon o infrastruktuře prostorových informací (2010) mluví o licencích, ale
  text na webu je označen jako zastaralý. Licence ortofota neověřena. Verdikt: odložit, bez ověřeného URL.
- **Maroko**: OSM a WFP/HDX „Morocco streets and pathways“ (katalog uvádí ODbL, ale v metadatech je licence prázdná a
  `isopen` = False, **neověřeno**). Oficiální ortofoto (ANCFCC) a silniční síť nenalezeny. Verdikt: odložit.
- **Tunisko, Libanon**: v této rešerši nebyly nalezeny otevřené zdroje. Nezkoumáno podrobně.

## 4. Obecné poznatky a požadavky aplikace

- **Odhad podle norem a stání**: u Izraele a Turecka nemám ověřené normy ani zákon o stání. Pro Izrael a Turecko by
  bylo třeba zjistit vyhlášky (není ověřeno).
- **Budovy**: `buildings-br7` (Beer Sheva) a `greenbuildings` jsou katalogové záznamy; patro, výška nebo rok nejsou
  ověřeny. Izraelské budovy z katalogu bez licence nelze použít (`greenbuildings` bez licence).
- **Adresy**: data.gov.il ani města nebyla ověřena pro vyhledávání adres. Photon (od komoot) je použitelný jako záloha
  (dle pravidel projektu), ale nebyl testován.
- **Značky**: nezkoumáno (krátce podle zadání: nic použitelného nenalezeno).
- **Licence pro značky a normy v Izraeli a Turecku**: neověřeno.

## 5. Doporučení

1. Izrael: zkusit Tel Aviv znovu z jiné sítě (gisn, apiportal `GisLayers`); pokud vrstvy chodníků a obrub nejsou, zůstat
   u Beer Sheva a jen na jeden stát mimo Prahu. Jinak odložit.
2. Turecko: přečíst TKGM příručku a `GetCapabilities` ortofota (HTTP z jiné sítě), ověřit podmínky užití. Teprve potom
   rozhodnout. İBB a İzmir vyžadují jiné připojení.
3. Záložní postup, který platí už teď: OSM a ortofoto z vyhledaného zdroje, jen s označením „odhad“ (jako u ostatních
   států bez mapy povrchů).

## Seznam neověřených položek (pro kontrolu)

- Tel Aviv všechny vrstvy (571), Jeruzalém, Haifa (neprozkoumáno).
- Beer Sheva soubory (403 CloudFront): obsah geometrie, zda obrubník/hrana je polygon.
- GovMap, MAPI ortofoto (403/000): licence, WMS.
- TKGM ortofoto WMS (URL i podmínky), HGM harita.gov.tr (000).
- İBB Açık Veri Portalı (000, ECONNREFUSED), İBB ortofoto, İzmir (403/302), Ankara (404).
- Gibraltar, Maroko: licence a vrstvy neověřeny.
