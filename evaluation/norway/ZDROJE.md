# Data pro Norsko (NO): ověřené otevřené služby (pro profil ulic)

Ověřeno 23. 11. 2026, asi 50 požadavků na služby (User-Agent `profily-ulic`, pauza kolem 1 s, Origin
`https://streetspace.eu`), k tomu katalogy (Geonorge, ArcGIS Online, Commons, Lovdata). Overpass ani Nominatim nebyly
použity, žádné osobní údaje se neposílaly, žádný klíč. Ze služeb Commons přišlo jednou „too many requests“: dál jen
po jednom dotazu.

Značení: **ověřeno** = odpověď přišla a byla přečtena (u obrázků i prohlédnuta); **neověřeno** = jen z dokumentace,
katalogu nebo vyhledávání. CORS „`*`“ = `Access-Control-Allow-Origin: *`; „echo“ = server vrací náš Origin.

Zkušební body: Oslo Karl Johans gate / Rådhuset (10,740; 59,913), Oslo Grünerløkka (10,754–10,760; 59,921–59,924).

## Verdikt

**Odložit celostátní Norsko; nanejvýš „Oslo s podmínkou“.** Důvod: **celostátní ortofoto (Norge i bilder) není
otevřené.** Kartkatalog Geonorge u „Digitale ortofoto“ i u všech služeb Norge i bilder (WMS, WMTS Mercator) uvádí
přístup „**Norge digitalt begrenset**“ (licence Norge digitalt jen pro smluvní strany); služby vracejí bez tokenu
`499 Token Required` nebo „Bruker kan ikke autentiseres“ (ověřeno). OSM má od Geovekstu jen svolení obkreslovat, ne
užívat snímky v jiných aplikacích (fórum OSM, 2018–2024, neověřeno u Kartverketu). Stejně tak **FKB** (podrobná mapa
1 : 1000 s vozovkami, chodníky, obrubami, budovami): všech 15 dílů FKB „norway digital restricted“ (ověřeno v katalogu).
Bez ortofota a bez mapy povrchů by norský profil byl jen odhad z OSM a NVDB.

Co je **otevřené a dobré**: NVDB Statens vegvesen (CC BY 4.0, CORS echo, šířky vozovek, chodníky, obruby, parkování,
cyklopruhy, rychlosti, značky), adresy a místní jména Kartverketu (CC BY 4.0, CORS `*`), body budov z Matrikkelen (CC BY 4.0,
CORS `*`, ale bez podlaží a roku). **Oslo** má na serveru Bymiljøetaten (`geodata.bymoslo.no`) vlastní ortofoto 2024 (asi
4 cm), které jde z prohlížeče v EPSG:3857 (ověřeno, CORS echo), a databázi parkování jako polygony se způsobem stání a
šířkou; licence ortofota ale **není uvedená** (WMS téhož snímku od Plan- og bygningsetaten říká „Copyright PBE“).

**Rozhodnutí pro Báru**
1. Norsko celé odložit, dokud Kartverket/Geovekst nezpřístupní Norge i bilder (nebo jen podklad bez pruhů z ortofota)?
2. Nebo „Oslo s podmínkou“: zeptat se Bymiljøetaten (a PBE) e-mailem, zda smíme jejich ortofoto 2024 a parkovací
   databázi používat v cizí webové aplikaci (NLOD 2.0 / CC BY). Bez písemného ano nezapojovat.
3. NVDB jako náhrada mapy povrchů (šířky vozovek z FKB přepočtené na osu, chodníky, obruby): stojí za pokus i bez
   ortofota? Volání potřebuje hlavičku `X-Client` (preflight CORS povolen, ověřeno).
4. Svalbard a Jan Mayen (GISCO `SJ`) do „Norska“ nezahrnovat, nebo ano? (Svalbard je norský, ale zvláštní režim.)
5. OSM: Norsko je 1,38 GB PBF, je nutné dělit na 5 dílů Geofabriku (největší Østlandet 456 MB); pozor na kód `no`,
   který už používá italský díl `it_no` (nord-ovest) jen jako přípona, kolize klíčů není, ale je matoucí.
6. Rozhraní norsky nepřidávat (norština není mezi 24 jazyky EU; bokmål i nynorsk by byly dva jazyky).

---

## 1. Ortofoto

| Zdroj | URL | Stav | CORS | Klíč | Licence | Použitelné |
|---|---|---|---|---|---|---|
| Norge i bilder WMS (stará) | `https://wms.geonorge.no/skwms1/wms.nib` | **ověřeno**: GetCapabilities 200, ale tělo je `ServiceException` „Bruker kan ikke autentiseres … TCP/IP adresse ikke funnet“ (přístup podle IP) | `*` | IP/smlouva | Norge digitalt-lisens, „Norge digitalt begrenset“ (katalog `dcee8bf4-…`, ověřeno) | **ne** |
| Norge i bilder WMS (nová) | `https://services.norgeibilder.no/wms/ortofoto` | **ověřeno**: HTTP 499 ArcGIS „Token Required“ | echo | token | totéž (katalog `d6611216-…`, ověřeno) | **ne** |
| Norge i bilder WMTS Mercator / UTM33 | `https://tilecache.norgeibilder.no/wmts/webmercator?…GetCapabilities`, `…/utm33_euref89` | **ověřeno**: `{"error":{"code":499,"message":"Token Required"}}` | echo | token | Norge digitalt begrenset (katalog `99a61117-…` „Norge i bilder WMTS (Mercator)“, ověřeno) | **ne** |
| Starý `opencache.statkart.no/gatekeeper/gk/gk.open_nib_web_mercator_wmts_v2` | — | **ověřeno**: DNS se přeloží, spojení selže (curl 7) | — | — | — | ne (zrušeno) |
| Kartverket cache | `https://cache.kartverket.no/v1/wmts/1.0.0/WMTSCapabilities.xml` | **ověřeno**: 200, vrstvy jen `topo`, `topograatone`, `toporaster`, `sjokartraster`; matice `webmercator` do z18, Fees/AccessConstraints „Ingen“ | `*` | ne | CC BY 4.0 (podle katalogu, neověřeno textem) | podkladová **mapa** ano, ortofoto **ne** (nemá ho) |
| **Oslo, Bymiljøetaten** `Ortofoto` MapServer | `https://geodata.bymoslo.no/arcgis/rest/services/geodata/Ortofoto/MapServer` | **ověřeno**: popis „ortofoto fra 2024“, cache v EPSG:25832, 11 úrovní, nejjemnější **0,041 m/px**; `export?bbox=…&bboxSR=3857&imageSR=3857&size=512,512&format=jpg` → 200 `image/jpeg` 51 KB, ostrý snímek u Rådhuset (prohlédnuto: střechy, dlažba, čáry stání) | echo (`https://streetspace.eu`, `allow-credentials`) | ne | **neuvedena** (`copyrightText` prázdné) | **s podmínkou**: písemný souhlas města |
| Oslo, PBE WMS `flyfoto_bym` | `https://od1.pbe.oslo.kommune.no/cgi-bin/flyfoto_bym` | **ověřeno**: vrstvy `Nyeste_flyfoto`, `Flyfoto_1937/1947/1971/1984`; CRS jen EPSG:25832, 32632; AccessConstraints „Copyright Plan- og bygningsetaten i Oslo kommune“ | `*` | ne | copyright PBE | ne (není 3857, licence uzavřená) |
| Bergen, Trondheim, Stavanger | — | ArcGIS Online: žádná veřejná služba ortofota měst nenalezena (neověřeno, jen vyhledávání) | — | — | — | nenalezeno |

Svolení OSM: rozhodnutí Geovekst 20. 4. 2018, že OSM smí digitalizovat z prohlížecí služby Norge i bilder, s kreditem
„Norge i Bilder, Geovekst“; služba Norkartu „kan bare brukes av OSM til mapping“ (vlákno komunity OSM „Tillatelse til å
bruke Norge i Bilder“, neověřeno u Kartverketu). Pro nás to neplatí.

## 2. Mapy povrchů ulic

| Zdroj | URL | Ověřený obsah | CORS | Licence | Použitelné |
|---|---|---|---|---|---|
| FKB-Veg, FKB-BygnAnlegg, FKB-Grønnstruktur… (celostátní 1 : 1000) | `nedlasting.geonorge.no` | **ověřeno** v kartkatalogu: všech 15 dílů FKB „norway digital restricted“ | — | Norge digitalt (jen smluvní strany) | **ne** |
| **NVDB** (Nasjonal vegdatabank, Statens vegvesen), API Les v4 | `https://nvdbapiles.atlas.vegvesen.no/vegobjekter/api/v4/vegobjekter/{typ}?kartutsnitt=…&srid=5973&inkluder=egenskaper,lokasjon,geometri` | **ověřeno** (Oslo, obdélník 1 × 1 km): **838 Vegbredde, beregnet** (dekkebredde normal/min/max/medián, „Grunnlag FKB“, i obecní ulice `K`); **48 Fortau** (linie, `Belegning`, státní i obecní); **9 Kantstein** (linie, materiál); **528 Tverrprofil** (šířky jednotlivých jízdních pruhů, středového dělicího pásu, krajnic; jen státní silnice `R`); **43 Parkeringsområde** (bod, typ „Parkering langs kjørebane“, počet míst ZTP); 953 Sykkelfelt v centru Oslo 0 objektů. Dále v katalogu: 105 Fartsgrense, 813 Gågate, 616 Feltstrekning, 96 Skiltplate, 49 Trafikkøy, 174 Gangfelt | echo; vyžaduje hlavičku **`X-Client`** (bez ní 400 „X-Client må være satt“); preflight `OPTIONS` 200, `allow-headers: x-client` | NVDB Vegnett CC BY 4.0 (katalog `ad17eb84-…`, ověřeno); objekty NVDB podle Vegvesenu NLOD (neověřeno) | **ano** jako nápověda (šířka vozovky, chodník ano/ne, obruba, rychlost); polygony to nejsou |
| **Oslo, Bymiljøetaten: Parkeringsdatabasen** | `https://geodata.bymoslo.no/arcgis/rest/services/geodata/Parkering/MapServer/6/query` (`f=geojson`, obálka WGS 84) | **ověřeno** (Grünerløkka 330 × 330 m): 166 **polygonů** stání, `p_type` (typy s čísly značek: placené, zdarma, HC 552+807.8, bus, taxi 514, zákaz stání 372, stání zakázáno, bildeling, kolo…), `p_bredde`, `p_lengde`, `beregnet_antall`; 0,27 s, 69 KB | echo | neuvedena u vrstvy; jiné položky Bymiljøetaten na ArcGIS Online mají NLOD 2.0 (ověřeno u „Beboerparkering“, „Bildelingsplasser“) | **s podmínkou** (licence; ptát se jen na potřebná pole, vrstva má i `created_user`/`last_edited_user`) |
| Oslo: `Smale_fortau_innsyn` | `…/geodata/Smale_fortau_innsyn/MapServer/0` | **ověřeno** (seznam polí): polygony úzkých chodníků se šířkou (průměr, medián, min, max) | echo | neuvedena | jen doplněk |
| Oslo: Basisdata | `…/geodata/Basisdata/MapServer` | **ověřeno** (seznam vrstev): budovy, stromy, ploty, lampy, sloupy **z FKB** (FKB je omezená) | echo | FKB (Norge digitalt) | ne |
| Bergen, Trondheim, Stavanger | ArcGIS Online | nalezeny jen projekty firem (parkovací kartování Sweco pro Bergen), žádná mapa povrchů (neověřeno) | — | — | nenalezeno |

## 3. Budovy

| Zdroj | URL | Ověřený obsah | CORS | Licence | Použitelné |
|---|---|---|---|---|---|
| **Matrikkelen – Bygningspunkt** WFS 2.0 | `https://wfs.geonorge.no/skwms1/wfs.matrikkelen-bygningspunkt` (`typeNames=app:Bygning`, bbox v EPSG:4258 lat,lon) | **ověřeno**: 200, 0,16 s; pole `bygningstype` (kód NS 3457, např. 311), `bygningsstatus`, `harKulturminne`, `harSefrakminne`, `naringsgruppe`, bod; **bez podlaží, výšky i roku**; v odpovědi i identifikátory bytů (`bruksenhetId`, `adresseId`) | `*` | CC BY 4.0 (katalog `24d7e9d1-…`, ověřeno) | **s podmínkou**: jen typ domu (bytový/obchodní/průmysl) a památka; obrys z OSM |
| FKB-Bygning | — | „norway digital restricted“ (ověřeno v katalogu) | — | Norge digitalt | ne |
| Podlaží, rok | Matrikkelen je má, ale ve veřejné WFS nejsou (ověřeno: pole chybí) | — | — | — | **nenalezeno**; zbývá OSM `building:levels` (pokrytí neověřeno) |

## 4. Hledání

| Služba | URL | Stav | CORS | Licence | Použitelné |
|---|---|---|---|---|---|
| **Adresse REST-API** Kartverket | `https://ws.geonorge.no/adresser/v1/sok?sok=…&treffPerSide=…` | **ověřeno**: „Karl Johans gate 22 Oslo“ → 1 adresa, `adressenavn`, `kommunenavn`, `representasjonspunkt` (EPSG:4258), 0,22 s | `*` | CC BY 4.0 (katalog `44eeffdc-…`, ověřeno) | **ano** |
| Stedsnavn API | `https://ws.geonorge.no/stedsnavn/v1/navn?sok=…` | **ověřeno**: 200 (stará cesta `/sok` 404) | `*` | neověřeno | ano (místa, obce) |
| Photon (komoot) | — | neověřeno pro NO | — | ODbL | záloha |

## 5. OSM (Geofabrik) a hranice

**Geofabrik** (ověřeno 23. 11. 2026, `index-v1-nogeom.json` a `Content-Length`): `europe/norway/norway-latest.osm.pbf` =
`norway-261122.osm.pbf` **1 379 MB** (asi kvůli importu N50: hodně krajinného pokryvu). Díly: **østlandet 456 MB, nord-norge
407 MB, vestlandet 258 MB, trondelag 183 MB, sorlandet 77 MB, svalbard-janmayen 3,2 MB**. Celek se pod 512 MB nevejde,
**dělit po dílech** jako Itálie (`parts`, cesta `norway/<díl>`). Zda se Østlandet (456 MB PBF) zabalí pod 512 MB, neověřeno
(u Itálie díly do 650 MB PBF prošly).

**Hranice GISCO** (`CNTR_RG_01M_2024_4326.geojson`, ověřeno, CORS `*`): `NO` 4 199 polygonů, 51 687 vrcholů, 4,51–31,16° v. d.,
57,96–71,18° s. š. (pevnina s ostrovy, **bez Svalbardu**); Svalbard a Jan Mayen jsou zvlášť jako `SJ` (176 polygonů).
`tools/build_staty.mjs` Norsko zatím nemá.

## 6. Zvláštnosti

- Provoz vpravo (trafikkreglene § 5 nr. 1, ověřeno).
- Domy v ulicích (neověřeno fotkami): ve středu Osla zděné činžovní domy (bygårder) 1860–1910, jugend; dřevěné domy
  ve starých čtvrtích Bergenu, Trondheimu, Stavangeru i v Oslu (Kampen, Rodeløkka); funkcionalismus 30. let; poválečné
  „blokker“ a sídliště (drabantbyer Groruddalen), ale **žádné socialistické paneláky** (podle pravidla z 23. 11. jako
  na západ od Česka). Vlastní vzhled „dřevěný městský dům“ by se hodil (zatím chybí).
- Jazyk: bokmål a nynorsk; rozhraní nepřidávat. Sámské názvy jen v severních obcích.
- Citlivé hranice: Svalbard (Špicberská smlouva), Jan Mayen, hranice s Ruskem (Kirkenes) jsou v GISCO zřetelné; Norsko
  není v EU, ale je v EHP (GISCO ho kreslí).
- Ztížené: Oslo má mýtné kruhy, mnoho ulic s tramvají (Sporveien) a Bergen Bybanen; tramvajové normy nenalezeny (NORMY.md).
