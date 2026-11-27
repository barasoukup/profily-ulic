# Foralní katastry (Navarra, Gipuzkoa, Bizkaia, Álava): mohou se napojit jako Catastro?

Datum průzkumu: 23. 11. 2026. Bez změn kódu, bez commitu. Cíl: zjistit, zda aplikace může u kliknutí na ulici
dotázat budovy (počet podlaží nad zemí, rok, užití, obrys) stejně jako `app/public/towns/spain.js` dotazuje
Catastro (`ovc.catastro.meh.es/INSPIRE/wfsBU.aspx`, ta v Baskicku a Navaře nic nemá).

## Shrnutí

1. Všechny čtyři katastry mají veřejnou službu INSPIRE WFS s budovami (BU), která vrací podlaží nad zemí, rok výstavby, užití, počet bytů a obrys (polygon). Ověřeno dotazy na Pamplonu, Donostii, Bilbao a Vitoria-Gasteiz.
2. CORS: u Navarry a Gipuzkoy hlavička `Access-Control-Allow-Origin: *`; u Bizkaye a Álavy se vrací `https://streetspace.eu` (ověřeno dotazem s hlavičkou Origin). Prohlížeč je tedy použít může.
3. Licence: Navarra CC BY 4.0 (s uvedením zdroje), Gipuzkoa volné užití s uvedením autora, Bizkaia a Álava v katalogu CC BY (u Bizkaye si katalog odporuje s INSPIRE stránkou, u Álavy GetCapabilities žádnou licenci neuvádí). Licence ověřit a uvést zdroj v kreditech.
4. Kód se nedá přepnout jen změnou URL: liší se typ prvku (`BU:Building`, `bu-ext2d:Building`, `bu-core2d:Building`, `INSPIRE_BU:BU.Building`), u Álavy a jejího GML je pořadí souřadnic lon, lat (u ostatních lat, lon), CRS v URL i v `bbox`, obaly prvků (`wfs:member`), a u Gipuzkoy a Bizkaye elementy s atributy (regulární výraz `value()` v `spain.js` je nechytí). Rok je u každého katastru v jiném podelementu (`beginning` nebo `end`). Viz „Technické rozdíly".
5. Verdikt pro všechny čtyři: **s podmínkou** (napojení možné, je potřeba adaptér a uvedení zdroje; Bizkaia a Álava vyžadují ještě vyjasnit licenci).

## Postup a rozsah dotazů

- Zdrojový kód: `app/public/towns/spain.js` (řádky 111–175: `CATASTRO_WFS`, `catastroBuilding`, `foralAt`, `podlaznost`). Dotaz Catastra je bbox ±0,000005° kolem bodu fasády (asi 0,5 m), typy `BU:Building` a `BU:BuildingPart`.
- Dotazy jsem dělal ručně přes `curl`, bez User-Agent a bez e-mailu, bez klíče. Každou službu jednou GetCapabilities a pro každé město jeden GetFeature s bboxem asi 100 m. Několik dalších dotazů bylo nutných, protože první pokus měl chybnou syntaxi CRS (u Navarry a Álavy) nebo chybný typ prvku (u Gipuzkoy) nebo chybné pořadí souřadnic v `bbox` (u Álavy a Bizkaye). Celkem zhruba 12 malých dotazů, žádný hromadný stahování, žádný Overpass ani Nominatim.
- Metadatové záznamy v INSPIRE Geoportálu (`inspire-geoportal.ec.europa.eu`) se z této sandboxu nepodařilo stáhnout (curl vrátil kód 000). Pro licence jsem proto použil GetCapabilities (ověřeno) a výsledky vyhledávání a WebFetch na datos.gob.es a stránky Bizkaye (neověřeno, viz níže; stránka Bizkaye vrátila ověřovací výzvu „human verification", katalog Navarry vrátil 404).

## Tabulka: služby

| Katastr | Služba (GetCapabilities) | Typ prvku | Výsledek dotazu | CORS (Origin: https://streetspace.eu) | Licence | Verdikt |
|---|---|---|---|---|---|---|
| **Navarra** (IDENA, Registro de la Riqueza Territorial) | `https://inspire.navarra.es/services/BU/wfs?service=WFS&request=GetCapabilities&version=2.0.0` | `BU:Building` (jen budovy, žádné díly) | Pamplona, bbox 42,8130–42,8210 × −1,6470 až −1,6390, 20 budov, HTTP 200 | `Access-Control-Allow-Origin: *` (ověřeno) | CC BY 4.0 ES, text „Servicio proporcionado por el Gobierno de Navarra" (ověřeno v GetCapabilities; anglický text uvádí CC BY 3.0, tedy nesoulad) | **s podmínkou** |
| **Gipuzkoa** (b5m, Diputación Foral) | `https://b5m.gipuzkoa.eus/inspire/wfs/gipuzkoa_wfs_bu?service=WFS&version=2.0.0&request=GetCapabilities` | `bu-ext2d:Building` (druhý typ „other constructions" nemá budovy) | Donostia, bbox 43,3150–43,3220 × −1,9840 až −1,9770, 20 budov, HTTP 200 | `Access-Control-Allow-Origin: *` (ověřeno) | Volné užití v jakémkoli formátu s uvedením autora, bez záruky (ověřeno v GetCapabilities, „Fees: free access"); bez CC štítku | **s podmínkou** |
| **Bizkaia** (GeoBizkaia, Diputación Foral) | `https://geo.bizkaia.eus/arcgisserverinspire/rest/services/Catastro/Buildings/MapServer/exts/InspireFeatureDownload/service?REQUEST=GetCapabilities&SERVICE=WFS&VERSION=2.0.0` | `bu-core2d:Building` | Bilbao, bbox 43,2600–43,2660 × −2,9380 až −2,9320, 20 budov, HTTP 200 | `Access-Control-Allow-Origin: https://streetspace.eu` (ověřeno) | GetCapabilities: `AccessConstraints: None`, `Fees: no conditions apply` (ověřeno). INSPIRE stránka Bizkaye: CC BY 3.0 ES, katalog datos.gob.es: CC BY 4.0 (neověřeno, z vyhledávání) | **s podmínkou** (vyjasnit licenci) |
| **Álava / Araba** (GeoAraba, Diputación Foral) | `https://geo.araba.eus/WFS_INSPIRE_BU?REQUEST=GetCapabilities&SERVICE=WFS&VERSION=2.0.0` | `INSPIRE_BU:BU.Building` | Vitoria-Gasteiz, bbox lon −2,6750 až −2,6680, lat 42,8420–42,8500, 20 budov, HTTP 200 (s pořadím lon, lat) | `Access-Control-Allow-Origin: https://streetspace.eu` (ověřeno) | GetCapabilities: `AccessConstraints NONE`, `Fees NONE` (ověřeno). Katalog datos.gob.es: CC BY 4.0 (čteno přes WebFetch, neověřeno nezávisle) | **s podmínkou** (pořadí souřadnic, licence) |

Poznámka k prvnímu pokusu u Álavy: bbox v pořadí lat, lon vrátil `numberReturned="0"` (HTTP 200). Až pořadí lon, lat vrátilo 20 budov. Stejný dotaz s `SRSNAME=EPSG::4326` (dvojitá dvojtečka) vrátil chybu, správně je `EPSG:4326`.

## Atributy vrácené v GetFeature (ověřeno ze vzorků)

| Katastr | Podlaží nad zemí | Rok výstavby | Užití | Byty | Obrys (GML) | Poznámka k pořadí souřadnic |
|---|---|---|---|---|---|---|
| Navarra | `bu-base:numberOfFloorsAboveGround` (příklad 2) | `bu-base:dateOfConstruction/DateOfEvent/beginning` (příklad `1953-01-01…`, nil u jiných) | `bu-base:currentUse/CurrentUse/currentUse` jako `xlink:href` na codelist `CurrentUseValue/publicServices` | `bu-base:numberOfDwellings` (příklad 0) | `gml:MultiSurface`, `gml:posList` v EPSG/0/4258 | lat, lon (`42.81836666 -1.64421733`) |
| Gipuzkoa | `bu-base:numberOfFloorsAboveGround` (příklad 8, s atributem `xsi:nil="false"`) | `bu-base:dateOfConstruction/DateOfEvent/end` (příklad `1981-03-30`) | `bu-base:currentUse` (kód v odkazu, ověřeno jen existence elementu) | `bu-base:numberOfDwellings` (příklad 27) | `gml:Polygon` v EPSG/0/4258 | lat, lon (`43.321277 -1.976795`) |
| Bizkaia | `bu-base:numberOfFloorsAboveGround` (příklad 7) | `bu-base:dateOfConstruction/DateOfEvent/end` (příklad `1920-12-31`; `beginning` je nil) | `bu-base:currentUse/…/currentUse` jako `xlink:title="residential "` (s mezerou na konci) | `bu-base:numberOfDwellings` (příklad 14) | `gml:Polygon` v EPSG/0/4258 | lat, lon (`43.263572721 -2.938180184`) |
| Álava | `INSPIRE_BU:numberOfFloorsAboveGround` (příklad 6) | `INSPIRE_BU:dateOfConstruction` (příklad `1972-12-31T00:00:00`) | `INSPIRE_BU:currentUse` text (`residential`) | `INSPIRE_BU:numberOfDwellings` (příklad 8) | `gml:Polygon` v EPSG:4326 | **lon, lat** (`-2.66818449 42.84986292`) i v GML, i v bboxu |

Všechny čtyři vrací výšku (`heightAboveGround`), počet stavebních jednotek a podzemní podlaží (u Álavy a Gipuzkoy). Ověřeno ve vzorcích.

## Technické rozdíly oproti Catastru (co musí adaptér umět)

- **Pořadí souřadnic:** u Navarry, Gipuzkoy a Bizkaye je pořadí lat, lon (jako u Catastra s `EPSG::4326`). U Álavy je lon, lat, i v bboxu, i v GML (ověřeno). Adaptér musí mít pro Álavu přepínač, jinak body a obrysy budou zrcadlově u špatného místa.
- **CRS v dotazu:** Navarra a Gipuzkoa přijímají `srsName=http://www.opengis.net/def/crs/EPSG/0/4258` i v `bbox` (ověřeno). Bizkaye v `bbox` URI tvar odmítla (HTTP 400, „CRS for BBOX is syntactically incorrect"), přijala `EPSG:4258` (ověřeno). Álava přijala `EPSG:4326` (ověřeno).
- **Typ prvku:** `BU:Building` (Navarra), `bu-ext2d:Building` (Gipuzkoa; `bu-core2d:Building` tam vrací chybu „Feature type is not mapped", ověřeno), `bu-core2d:Building` (Bizkaia), `INSPIRE_BU:BU.Building` (Álava).
- **Obal prvků:** vzorky Navarry, Gipuzkoy a Álavy mají `<wfs:member>`, `spain.js` dělí podle `<gml:featureMember>` (ověřeno; u Bizkaye neověřeno). Je potřeba rozdělit i podle `wfs:member`.
- **Atributy s XML atributy:** Gipuzkoa píše `<bu-base:numberOfFloorsAboveGround xmlns:… xsi:nil="false">8</…>`. Regulární výraz `value()` v `spain.js` (`<[^>]*:tag>`) takový element nechytí. Potřeba rozšířit (ověřeno).
- **Rok:** jiný podelement (`beginning` u Navarry, `end` u Bizkaye a Gipuzkoy, přímý text u Álavy). Adaptér má vzít první neprázdný z `beginning`, `end`, přímého textu.
- **Užití:** jiné kódy. Catastro `1_residential` a `4_1_office` se mapuje v `USE` (`spain.js`). Foralní katastry: `residential`, `publicServices` (Navarra přes `xlink:href`), `residential ` s mezerou (Bizkaia). Mapa musí být jiná a vyzkoušet mezery.
- **Díly budov:** u Navarry, Gipuzkoy, Bizkaye a Álavy není typ `BuildingPart` v GetCapabilities (ověřeno pro Navarru, Álavu a Gipuzkou; u Bizkaye ověřeno jen `bu-core2d:Building`). Fasáda se bere z budovy samotné. Funkce `catastroBuilding` s `partsGml` (výběr části podle bodu) se tu použije s prázdným `partsGml`.
- **Výsledek pro patní bod:** `catastroBuilding` počítá s prvkem BU:Building, ve kterém bod leží. Ostatní čtyři služby mají stejnou logiku (bbox 0,5 m u budovy, výběr prvku podle bodu).

## Licence a podmínky (podrobně)

- **Navarra:** GetCapabilities, `AccessConstraints`: „ES: Creative Commons Reconocimiento (CC BY 4.0) [http://creativecommons.org/licenses/by/4.0/deed.es_ES]. EN: Creative Commons Attribution (CC BY 3.0) [http://creativecommons.org/licenses/by/4.0/deed.en_EN]. Será necesario nombrar la fuente de procedencia de la información de la manera siguiente: „Servicio proporcionado por el Gobierno de Navarra." Servicio „tal cual", sin garantía." (ověřeno). Povinný text: „Servicio proporcionado por el Gobierno de Navarra." Pozor na nesoulad CC BY 3.0 a 4.0 v anglické části; česky uvádět CC BY 4.0. Metadata: idena@navarra.es (neověřeno, z vyhledávání).
- **Gipuzkoa:** GetCapabilities, `AccessConstraints`: obsah „may be reproduced, removed and reused freely … in any format … under the following terms: 1. Authorship must be indicated in any case. 2. … disclaims any warranty … 3. … not responsible for damages" (ověřeno). `Fees: free access` (ověřeno). Bez CC štítku, takže uvést autora podle textu.
- **Bizkaia:** GetCapabilities `AccessConstraints: None`, `Fees: no conditions apply` (ověřeno). Vyhledávání uvádí: stránka Inspirebizkaia CC BY 3.0 ES, datos.gob.es CC BY 4.0, otevřenost upravuje Decreto Foral 106/2020, de 1 de diciembre (neověřeno: stránka Inspirebizkaia vrátila ověřovací výzvu, datos.gob.es WebFetch 404). Před použitím ověřit na stránce GeoBizkaia; do té doby uvést „Diputación Foral de Bizkaia" a CC BY 4.0 jako pracovní předpoklad.
- **Álava:** GetCapabilities `AccessConstraints: NONE`, `Fees: NONE` (ověřeno). Katalog datos.gob.es (čteno přes WebFetch): CC BY 4.0 (`http://publications.europa.eu/resource/authority/licence/CC_BY_4_0`), publikováno jako „Administración del Estado", ačkoli provozuje Diputación Foral (čteno přes WebFetch, neověřeno nezávisle).
- **Licence Catastra (pro srovnání):** Catastro má vlastní licenci přístupu a použití INSPIRE služeb; v kódu zatím kreditem „© DG Catastro" v `credits.js` (neověřeno tady, mimo rozsah průzkumu).

Požadavek na zdroj: každý katastr uvést v kreditu (zdroj + licence), jak je u ostatních zdrojů v `credits.js`.

## Ostatní (rate limit, klíč, HTTPS)

- **Klíč:** nepotřebují žádný (ověřeno: všechny čtyři vrátily data bez přihlášení).
- **HTTPS:** všechny čtyři URL jsou HTTPS (ověřeno).
- **Rate limit:** nezjištěn (neověřeno; neměřil jsem ho záměrně). WFS jsou podle univerzitní analýzy (Ivie, uv.es, neověřeno) vhodné na dotazy na bod, ne na hromadné stahování. Pro aplikaci to odpovídá (jeden bod, jeden dotaz na kliknutí).
- **Hromadné stažení:** ATOM feedy existují (Gipuzkoa `https://b5m.gipuzkoa.eus/inspire/download/buildings.xml`, neověřeno; Álava a Bizkaia mají ATOM podle katalogu, neověřeno). Pro zadání nepotřebné, pokud by bylo potřeba celé území, je to cesta.
- **Chování při výpadku:** u Catastra je v `spain.js` časový limit 25 s a paměť; stejné platí pro foralní služby.

## Verdikty

| Katastr | Verdikt | Co je třeba |
|---|---|---|
| Navarra | **s podmínkou** | Adaptér (typ `BU:Building`, rok v `beginning`, `xlink:href` u užití), uvést „Servicio proporcionado por el Gobierno de Navarra", CC BY 4.0 |
| Gipuzkoa | **s podmínkou** | Adaptér (typ `bu-ext2d:Building`, regulární výraz pro elementy s atributy, `wfs:member`), uvést autora |
| Bizkaia | **s podmínkou** | Adaptér (typ `bu-core2d:Building`, `bbox` s `EPSG:4258` bez URI), vyjasnit licenci (CC BY 3.0 ES, nebo 4.0) |
| Álava | **s podmínkou** | Adaptér s pořadím lon, lat (dotaz i GML), typ `INSPIRE_BU:BU.Building`, vyjasnit licenci (NONE v GetCapabilities, CC BY 4.0 v katalogu) |

Doporučení: pořadí a typy prvků jsou jediné skutečné překážky; CORS a licence nebrání. Před napojením ověřit licenci u Bizkaye a Álavy na stránkách správců (dnes neověřeno) a projít regresí `evaluation/` (aplikace musí u Prahy a Brna zůstat stejná).

## Co je ověřeno a co ne (přehled)

**Ověřeno (vlastním dotazem v tomto průzkumu):**
- Existence a adresy GetCapabilities u všech čtyř služeb (HTTP 200).
- Typy prvků, výchozí CRS a pořadí souřadnic (Navarra, Gipuzkoa, Bizkaia, Álava).
- Atributy floors, year, use, dwellings a obrys ve vzorcích z Pamplony, Donostie, Bilbaa a Vitoria-Gasteiz.
- CORS hlavičky pro Origin `https://streetspace.eu`.
- Licenční texty v GetCapabilities (Navarra, Gipuzkoa, Bizkaia, Álava).
- Chybové hlášky a jejich příčiny (syntaxe CRS, typ prvku, pořadí bbox).

**Neověřeno (jen z vyhledávání, WebFetch nebo nedostupné):**
- Obsah INSPIRE metadat v Geoportálu (curl selhal, kód 000).
- Licence na stránce GeoBizkaia (ověřovací výzva) a na datos.gob.es (u Navarry 404; u Bizkaye 404).
- ATOM feedy a jejich adresy.
- Limity počtu dotazů a provozní podmínky.
- Pokrytí budov (kolik budov má vyplněné podlaží nebo rok); vzorky ukázaly vyplněná pole, plošné pokrytí neměřeno.
- Gipuzkoa `bu-ext2d:Building` a `bu-core2d:Building` v Bizkaye: úplný seznam atributů z DescribeFeatureType nebyl stažen (jen to, co se objevilo ve vzorku GetFeature).
- Navarra a Álava: `BuildingPart` neexistuje podle GetCapabilities (ověřeno), ale nebyl zkontrolován DescribeFeatureType.
- Chování u hranic katastrů (budova přes hranici Navarra a Álava). Neměřeno.
