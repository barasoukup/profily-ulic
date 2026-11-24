# Mapy povrchů ulic: nové státy (průzkum 24. 11. 2026)

Rešerše bez kódu. Cíl: otevřená mapa povrchů ulic (polygony obrubník–obrubník: vozovka, chodník, cyklopruh, stání,
zeleň), jako Vídeň FMZK, nizozemská BGT nebo vilniuský TEDR, a to bez ohledu na to, zda stát má otevřené ortofoto.
Čtení předchozích poznámek: `evaluation/{sweden,norway,latvia,lithuania}/ZDROJE.md`, `docs/states-survey/*.md`.
Tady se nepřepisují, jen doplňují.

**Metoda.** Ověřeno = odpověď přišla a byla přečtena (u obrazů i prohlédnuta). Neověřeno = jen z katalogu, vyhledávání
nebo z dokumentace. Hlavička `Origin: https://streetspace.eu`, `User-Agent: profily-ulic`, pauza 1 s mezi dotazy.
Overpass ani Nominatim se nepoužily, žádné osobní údaje se neposílaly, žádný klíč, nikoho jsem nekontaktoval.
Asi 75 požadavků (katalogy CKAN, ArcGIS REST, export obrazu, hlavičky CORS). Hledání v ArcGIS Online jen jako
orientace, každý nález níže ověřen dotazem na službu.

## Verdikt

**Nenalezena žádná nová evropská služba s polygony povrchu ulic, která by byla otevřená, bez klíče a s CORS.**
Nejlepší kandidát je **Reykjavík (LUKR)**: vrstva `Samgönguflákar` (dopravní plochy, polygony) v ArcGIS MapServeru,
CORS echo, export obrazu ověřen a prohlédnut. Podmínka: licence není otevřená (viz tabulka) a dotaz na prvky vrátil
chybu, takže jen obraz. Ostatní nové státy v tomto průzkumu buď nemají otevřený katalog s touto vrstvou, nebo katalog
neodpověděl (403, 404, DNS). Pro obrubníky (čáry) jsou použitelné Dublin (DLR, NTA) a Glasgow (jen jako doplněk).

## 1. Tabulky po státech

### Irsko (IE): data.gov.ie (CKAN, odpovídá, CORS `https://superset.data.gov.ie`)

| Město | Zdroj | URL | Obsah | CORS | Klíč | Licence | Použitelné |
|---|---|---|---|---|---|---|---|
| Dún Laoghaire-Rathdown (Dublin, jih) | DLR Roads and Streets (`dlr-roads-schedule`) | WMS `https://data.smartdublin.ie/geoserver/sd/DLR%20Roads%20Schedule/wms?service=WMS&request=GetCapabilities` ; GeoJSON `…/dlr_roads_schedule.geojson` (4,5 MB) | **ověřeno**: LineString, WGS 84 (lon/lat), atributy typů chodníků (footpath types), délky, ID. **Jen čáry**, žádné polygony | WMS GetCapabilities `*` (ověřeno); GeoJSON bez ověření | ne | CC BY 4.0 (uvedeno v katalogu) | **čáry**, jako druhý stupeň (atribut „typ chodníku“ na ose) |
| Dublin (NTA) | Dublin Metropolitan Area Cycle Infrastructure 2025 (`nta-active-travel-cycle-network-dublin`) | GeoJSON `https://data.smartdublin.ie/dataset/48b6d5da-…/nta-active-travel-cycle-network-geojson.json` (2,4 MB) | **ověřeno**: LineString (cyklotrasy na obou stranách silnice; segregované pruhy, cyklopruhy, quietways, chodníky se sdíleným provozem). **Jen čáry** | GeoJSON: **bez ACAO** (ověřeno: 200 bez hlavičky) | ne | CC BY 4.0 (katalog) | **čáry**, s podmínkou CORS (proxy nebo statický soubor při nasazení) |
| Dublin (DCC) | Public Realm, Roads Maintenance, Street Furniture | katalog | nic o povrchu ulice (průzkumy, licence, údržba) | – | – | CC BY 4.0 | ne |
| Irsko celostátně | TII Carriageway Type 2024 (ArcGIS, `services-eu1.arcgis.com/LLthVa4myMypd7UM/…/Carriageway_Type_2024/FeatureServer`) | FeatureServer layer 0 | **ověřeno** metadata: Polyline, typ vozovky, jen národní silnice | neověřeno | ne | neověřeno (licence v popisu prázdná) | ne (čáry, jen národní silnice) |
| Dublin, povrchy ploch | Tailte Éireann (OSi) PRIME2, OSi Ortho | – | **neověřeno** (katalog má jen „High Value Dataset – Way GDF2“ a „Roads 250k“, linie a 250k; PRIME2 a ortofoto v katalogu nenalezeny, licence nezjištěna) | – | – | neověřeno | ne (nezjištěno) |

### Velká Británie (GB): bez otevřené mapy povrchů

| Město | Zdroj | URL | Obsah | CORS | Klíč | Licence | Použitelné |
|---|---|---|---|---|---|---|---|
| Celostátně | OS Maps API (vektor a rastr) | `https://api.os.uk/maps/vector/v1/vts?key=…` | **ověřeno**: bez klíče 401 (XML výjimka); OS MasterMap (silniční síť s chodníky) licencovaná | neověřeno (401 bez ACAO) | **ano** | OS Data Hub, placené | ne |
| Glasgow | Footway Parking Survey (ArcGIS, `services2.arcgis.com/Ne8d9gKn5SJ3eAaw/…/FootwayParkingSurvey_Public/FeatureServer`) | layer 0 „Pavement Parking Prohibitions Assessment“ | **ověřeno** metadata: **Polyline**, průzkum parkování na chodníku (2025) | neověřeno | ne | **neověřeno** (popis bez licence) | **čáry**, jen jako doplněk, licence před použitím |
| Glasgow | data.glasgow.gov.uk | CKAN API `package_search` | **ověřeno**: `Cannot GET` (404) na obou cestách CKAN; portál je jiný software | ACAO `*` u chybové stránky | ne | – | neověřeno (katalog nelze prohledat) |
| UK celostátně | data.gov.uk | `…/api/3/action/package_search` | 301 na úvodní stránku (CKAN API nedostupné z tohoto prostředí) | – | – | – | neověřeno |
| Londýn, Edinburgh, Manchester | – | – | **neověřeno** (edinburgh a edinburghcouncil hosty neodpověděly, DNS) | – | – | – | nenalezeno |

### Norsko (NO): Bergen (nově), Trondheim; Oslo viz `evaluation/norway/ZDROJE.md`

| Město | Zdroj | URL | Obsah | CORS | Klíč | Licence | Použitelné |
|---|---|---|---|---|---|---|---|
| **Bergen** | Bergenskart ArcGIS (Basis_kartdata) | `https://kart.bergen.kommune.no/arcgis/rest/services/Basis_kartdata/Bygning_Flate/MapServer` | **ověřeno**: Polygon, **budovy** (půdorys). Povrchy ulic nenalezeny | **echo** `https://streetspace.eu`, `allow-credentials` (ověřeno) | ne | **neověřeno** (copyrightText prázdné) | budovy ano (srovnání s OSM neprovedeno), povrchy ne |
| Bergen | `Basis_kartdata/FKB_Kartlegging` | export `…/FKB_Kartlegging/MapServer/export` | **ověřeno** (obraz): jen „Siste tatt: 2022 / Neste planlagt: 2026“, index pořízení snímků, **ne** plochy | echo | ne | – | ne |
| Bergen | `Bymiljoetaten/Asfaltering`, `Samferdsel/Vegnett`, `Gangekartlegging` | ArcGIS | **neověřeno** (vrstvy v katalogu; asfaltování a síť jsou spíš čáry, obsah nekontrolován) | – | ne | neověřeno | později |
| Trondheim | kart.trondheim.kommune.no ArcGIS | `…/arcgis/rest/services?f=json` | 404 (nginx) | – | – | – | neověřeno (jiná cesta nehledána) |

### Island (IS): Reykjavík (LUKR), ArcGIS Borgarvefsja

| Město | Zdroj | URL | Obsah | CORS | Klíč | Licence | Použitelné |
|---|---|---|---|---|---|---|---|
| **Reykjavík** | Borgarvefsja MapServer, vrstva **Samgönguflákar** (dopravní plochy, id 72/102/130 podle měřítka) | `https://borgarvefsja.reykjavik.is/arcgis/rest/services/Borgarvefsja/Borgarvefsja/MapServer/export` (bbox 3857, `layers=show:72,130`) | **ověřeno obrazem**: Polygon; prohlédnuto u Laugavegu/Hverfisgaty (vozovky tmavě žluté podle třídy, chodníky šedé, ostrůvky, náměstí). Schéma (ověřeno metadata): `GOTUFLOKKUR` (třída), `VEG_FL_TH` (třída v zástavbě), `SLIT_GERD`, `VINNSLA_F`, `RUTT`, `HREINSUN_FORG`, `SHAPE.AREA`. Dotaz na prvky (`/query`) vrací **„Invalid definition expression“ (neověřeno, u všech vrstev)** | **echo** `https://streetspace.eu` (export, ověřeno hlavičkou) | ne (export); ortofoto `Kort/Loftmyndir` a `Borgarvefsja/Loftmynd` vrací **499 Token Required** | Copyright služby: „Kort úr LUKR – Notist ekki sem heimild til graftar“ (mapa LUKR, **není určena jako podklad pro výkopy**); širší licence **neověřeno** | **s podmínkou**: obraz ano, data jen po dohodě s LUKR (dotaz nefunguje) |
| Reykjavík | Borgarvefsja, složka `Yfirbordsmerkingar` (vodorovné značení) | `…/arcgis/rest/services/Yfirbordsmerkingar` | **neověřeno** (existují služby FeatureServer/MapServer, obsah nezkoumán) | – | – | neověřeno | později |
| Reykjavík | Borgarvefsja `BvsProfileToolPro` (GP, profil) | GPServer | jen existence v katalogu, **neověřeno** | – | – | – | nezkoumáno |
| Reykjavík ortofoto | Loftmyndir | `…/Kort/Loftmyndir/MapServer` | **ověřeno** 499 „Token Required“ | echo | **ano** | – | ne |
| Island celostátně | LMÍ / NÁTT (WMS `gis.ust.is/geoserver/INSPIRE/wms` z HTML portálu) | – | **neověřeno** (jen adresa z kódu stránky) | – | – | – | nezkoumáno |
| Island katalog | opingogn.is | CKAN | 301 (nesledováno) | – | – | – | neověřeno |

### Švédsko, Lotyšsko, Litva: doplnění (ostatní viz existující ZDROJE.md)

| Město | Zdroj | Stav | Poznámka |
|---|---|---|---|
| Kaunas, Klaipėda | gis.kaunas.lt (DNS neodpověděl), kaunas.lt (302) | **neověřeno** | Litevské mapy povrchů jen Vilnius (`evaluation/lithuania/ZDROJE.md`) |
| Litva katalog | data.gov.lt | 301 (JSON nedoručen) | **neověřeno** |
| Lotyšsko, Riga | – | již ve `evaluation/latvia/ZDROJE.md` | nic nového |
| Švédsko, Göteborg / Malmö / Stockholm | – | již ve `evaluation/sweden/ZDROJE.md` | nic nového (obrubníky Malmö, Göteborg; Stockholm bez polygonů) |
| Uppsala | www.uppsala.se | 200 (domovská stránka), mapy nezkoumány | **neověřeno** |

### Maďarsko (HU)

| Město | Zdroj | Stav | Poznámka |
|---|---|---|---|
| Budapešť | geoportal.budapest.hu, data.budapest.hu, bkk.hu | DNS (000) a 404 / 301 | **nedostupné** z tohoto prostředí |
| Národní | geoportal.hu | 200 (domovská stránka) | služby ani ortofoto **neověřeno** |

### Chorvatsko (HR)

| Město | Zdroj | URL | Obsah | CORS | Klíč | Licence | Použitelné |
|---|---|---|---|---|---|---|---|
| Záhřeb | data.zagreb.hr (CKAN, odpovídá) | `…/api/3/action/package_search?q=ceste` | **ověřeno**: jen „Zatvaranje prometnica“ (uzavírky, JSON/XML/CSV) a „Izgrađene prometnice 2020–2024“ (XLSX). Povrchy ne | neověřeno (bez ACAO) | ne | Otvorena dozvola (OD) | ne |
| Split, Rijeka | www.rijeka.hr 200, split.hr 301 | – | **neověřeno** | – | – | – | nezkoumáno |
| Národní | DGU ortofoto (z minulého průzkumu) | – | bez CORS (z `docs/states-survey/c-vychod-balkan.md`) | ne | – | – | neměnit |

### Rumunsko (RO), Bulharsko (BG), Srbsko (RS), Ukrajina (UA), Moldavsko (MD), Řecko (GR)

| Stát / město | Zdroj | Stav | Poznámka |
|---|---|---|---|
| Rumunsko | data.gov.ro (CKAN, odpovídá) | `package_search?q=trotuar` → jen ISCIR (nic o ulicích) | **nenalezeno** v katalogu. Bukurešť: gis.pmb.ro DNS; pmb.ro 200 bez služby. Cluj: data.cluj.ro DNS |
| Bulharsko | sofiaplan.bg (HTML 200, plánovací portál), gis.sofia.bg, opendata.sofia.bg (DNS), data.egov.bg (403) | **neověřeno / nedostupné** | Plovdiv 200 (web), Varna 302 |
| Srbsko | data.gov.rs (404), geoportal.novisad.rs (DNS), beograd.rs 200 (web) | **neověřeno / nedostupné** | RGZ geoportál z minulého průzkumu DNS |
| Ukrajina | data.gov.ua (403), gis.kyivcity.gov.ua (403), gis.lviv.ua (DNS) | **nedostupné** (403 z tohoto prostředí, ne důkaz neexistence) | |
| Moldavsko | data.gov.md (404), geoportal.chisinau.md (DNS), chisinau.md (302) | **neověřeno** | |
| Řecko | data.gov.gr (CKAN, odpovídá) | `package_search?q=odos` → jen meteo Egnatia (XML) | **nenalezeno** pro Atény a Soluň; Thessaloniki web 301 |

### Malé státy a Balkán bez katalogu (Srbsko, BiH, ČG, SM, AL, XK, AD, MK)

| Stát / město | Zdroj | Stav |
|---|---|---|
| Sarajevo | sarajevo.ba 200 | web, služby **neověřeno** |
| Priština | pristina.org 200 | web, služby **neověřeno** |
| Podgorica | podgorica.me 301 | neověřeno |
| Tirana | tirana.gov.al DNS | nedostupné |
| Skopje | skopje.gov.mk 301 | neověřeno |
| Andorra, San Marino, Monako | – | nezkoumáno (dříve v `docs/states-survey/`) |

## 2. Ostatní otevřené zdroje: jen čáry obrubníků a povrchu (druhý stupeň)

| Město | Vrstva | Typ | Ověřeno | Poznámka |
|---|---|---|---|---|
| Dublin, DLR | Roads Schedule (footpath types) | LineString | ano (WMS CORS `*`, GeoJSON) | osa vozovky s atributem chodníku |
| Dublin, NTA | Cycle Network 2025 | LineString | ano (GeoJSON, bez CORS) | cyklotrasy na obou stranách |
| Glasgow | Footway Parking Survey | Polyline | ano (metadata) | licence neověřena |
| Irsko celostátně | TII Carriageway Type 2024 | Polyline | ano (metadata) | jen národní silnice |
| Malmö, Göteborg | obrubníky, okraje chodníků | čáry | ano (z `evaluation/sweden/ZDROJE.md`) | nic nového |

## 3. Ranking nejlepších pěti kandidátů

1. **Reykjavík (LUKR), `Samgönguflákar`**: jediná nalezená evropská vrstva s polygony dopravních ploch (na exportu vozovky
   žlutě, chodníky a plochy šedě; přiřazení barev k typu ověřeno jen vizuálně), služba má CORS pro streetspace.eu (ověřeno u exportu). Nevýhoda: dotaz na prvky
   nefunguje a licence je omezená větou o zákazu jako podklad pro výkopy. Nejdřív dohoda s LUKR.
2. **Dublin, DLR Roads Schedule**: čáry s typem chodníku, CC BY 4.0, WMS s CORS `*`. Pro profil jen jako atribut
   (chodník ano/ne, šířka neznámá), ne jako plocha.
3. **Dublin, NTA Cycle Network 2025**: čáry cyklistické infrastruktury na obou stranách vozovky, CC BY 4.0, GeoJSON
   2,4 MB (bez CORS, nutný statický soubor při nasazení). Dobrý podklad pro cyklopruhy a segregaci.
4. **Bergen, Bygning_Flate**: budovy jako polygony s CORS echo, bez licence v metadatech. Povrch ulic ne, ale stavební
   obrys by šel použít místo odhadu z OSM (ověřit licenci).
5. **Glasgow, Footway Parking Survey**: čáry parkování na chodníku (jen Glasgow), licence neověřena. Nejslabší, ale
   jediný britský zdroj mimo OS s výsledkem z dotazu.

## 4. Doporučení a otevřené otázky pro Báru

1. Reykjavík: napsat LUKR, zda smíme `Samgönguflákar` (export nebo dotaz na prvky) použít v cizí webové aplikaci
   s kreditem; bez písemného souhlasu jen jako obraz pro ověření, ne v aplikaci.
2. Dublin: DLR a NTA jsou CC BY 4.0 (v katalogu, neověřeno v textu licence na portále). Stojí za zvážení jako čáry
   cyklistické sítě do Návrhu nebo jako šipka v Stavu; CORS u NTA řešit přes statický soubor.
3. Země s odmítnutím (Ukrajina, Bulharsko, Černá Hora apod.): 403 a DNS nejsou důkaz neexistence služby. Zkusit znovu
   z jiné sítě nebo až Bára rozhodne, zda stojí za hledání přes místní katalogy.
4. Budovy: Bergen jako zdroj obrysů je k zvážení, ale stejně jako Oslo potřebuje vyjasnit licenci.

## 5. Co nebylo ověřeno (neověřeno)

- Obsah vrstev Bergen `Asfaltering`, `Vegnett`; Reykjavík `Yfirbordsmerkingar`; Glasgow licence; Uppsala a Trondheim mapy.
- Katalogy a města, která neodpověděla nebo nebyla prověřena: Litva (data.gov.lt, gis.kaunas.lt), Island (opingogn.is, gis.ust.is) (opingogn.is, gis.ust.is), Chorvatska (Split, Rijeka),
  Bulharska (Sofia, Plovdiv, Varna), Srbska (Bělehrad, Nový Sad), Moldavska (Kišiněv), Rumunska (Bukurešť, Cluj, Timișoara).
- Ukrajina: 403 z tohoto prostředí; nelze potvrdit ani vyvrátit.
- Hledání v ArcGIS Online dalo mimoevropské výsledky (Austrálie, Nový Zéland, USA) a z Evropy jen Glasgow, Irsko, Stirling.
