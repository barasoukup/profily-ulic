# Data pro Finsko: ověřené otevřené služby (pro profil ulic)

Ověřeno 23. 11. 2026, asi 60 požadavků (1–6 na službu), User-Agent `profily-ulic`, Origin `https://streetspace.eu`.
Overpass ani Nominatim nebyly použity, žádné osobní údaje se neposílaly, žádný klíč. Commons API nás po dvou
dotazech omezilo (429), proto u části souborů značek není licence ověřená (viz `NORMY.md`).

Značení: **ověřeno** = odpověď přišla a byla přečtena (u obrázků i prohlédnuta); **neověřeno** = jen z dokumentace,
katalogu nebo vyhledávání. CORS „`*`“ = `Access-Control-Allow-Origin: *`; „bez CORS“ = hlavička chybí (z prohlížeče
se obraz ukáže, ale pixely ani JSON číst nejdou).

Zkušební body: Helsinki Bulevardi (24,9380, 60,1650) a Aleksanterinkatu (24,9445, 60,1685), Espoo Tapiola (24,8050,
60,1760), Tampere Hämeenkatu (23,7600, 61,4980), Turku Kauppatori (22,2680, 60,4510).

## Verdikt

**S podmínkou.** Finsko nemá celostátní ortofoto bez klíče: služba Maanmittauslaitos (MML) bez klíče vrací 401 a klíč
je osobní a byl by v prohlížeči vidět; podmínky MML navíc říkají, že otevřené rozhraní není pro služby s velkým
provozem a uživatel odpovídá za ochranu svého klíče. Výborná data mají ale města:

- **Helsinki** (CC BY 4.0, CORS `*`, EPSG:3857): ortofoto 5 cm z let 2021–2026, **mapa povrchů ulic YLRE** (vozovka,
  chodník, oddělená cyklostezka, dělicí pás, trávník, materiál, šířka dílu) a **budovy s počtem podlaží, rokem
  dokončení a materiálem fasády**. To je úroveň Vídně nebo Tallinnu.
- **Espoo** (ortofoto 30 cm, 2026) a **Turku** (ortofoto 2025 velmi ostré) s CORS a v EPSG:3857; licence ověřena
  23. 11. 2026 v katalogu HRI / avoindata.fi (CKAN API): Espoo „Espoon ja Kauniaisten ortoilmakuvat“ včetně vrstvy
  `Ortokartta` (nejnovější) **CC BY 4.0**; Turku „Turun ilmakuva 2022“ (tosiortokuva 5 cm, vrstva `Ilmakuva 2022 True ortho`)
  **CC BY 4.0**; vrstva `Ilmakuva 2025` vlastní záznam nemá (nejspíš „Turun seudun ilmakuva“, 5 cm, CC BY 4.0, název vrstvy
  neuveden), proto aplikace bere 2022.
- Celostátně bez klíče a s CORS: **budovy z Ryhti (SYKE)** jako body s počtem podlaží a rokem dokončení,
  **adresy z Ryhti**, **Digiroad** (šířka vozovky, počet pruhů, rychlosti; po 18. 9. 2026 ho Väylä už neaktualizuje).
- Normy: zákon o silničním provozu a příloha se značkami přečtené z Finlexu (1. ruka); šířky z celostátní příručky
  Väylävirasto 18/2020 a z helsinské „Katutilan mitoitus“ 2014 (1. ruka, doporučení). Značky všechny na Commons jako
  public domain.

**Podmínka:** buď (a) Bára souhlasí s klíčem MML v kódu stránky (a vyřeší se, zda to podmínky dovolují a zda služba
vrací CORS, což bez klíče ověřit nejde), nebo (b) Finsko se přidá jako „odhad z OSM“ všude a s ortofotem jen v Helsinkách,
Espoo a Turku (ortofoto podle města, jako Německo podle zemí). Varianta (b) jde udělat hned.

### Rozhodnutí pro Báru

1. Ortofoto: klíč MML v prohlížeči (nutná registrace v Bářině jménu, dotaz na MML), nebo jen městská ortofota
   (Helsinki, Espoo, Turku) a jinde ortofoto žádné?
2. Helsinki YLRE jako mapa povrchů (jako Vídeň FMZK): zapojit a udělat A/B?
3. Budovy: Helsinki (polygony s podlažími) a celostátně Ryhti (body s podlažími, rokem, materiálem, `construction_method`
   prvek/na místě)? Ryhti je bod, obrys domu musí přijít z OSM.
4. Vzhled domů: finské betonové panelové domy 60.–80. let (BES) kreslit jako „panelák“, nebo jako na západě
   („nový poválečný bytový dům“)? Podle memory jsou paneláky jen v CZ, SK, PL, EE a NDR. Navíc dřevěné domy
   (staré čtvrti Porvoo, Rauma, Turku; „rintamamiestalo“ 40.–50. let) nemáme.
5. Åland: má vlastní silniční zákon (autonomie); zahrnout do „Finsko“ s finskými pravidly, nebo vynechat?
6. Hledání: Ryhti `open_address` (CORS, jen přesná shoda adresy) + Photon jako záloha, nebo jen Photon?
7. Tampere (mapa povrchů ulic bez CORS): vynechat, nebo proxy?

---

## 1. Ortofoto

| Zdroj | Typ, CRS | CORS | Klíč | Rozlišení, rok | Licence | Použitelné | Stav |
|---|---|---|---|---|---|---|---|
| **MML ortokuva** `https://avoin-karttakuva.maanmittauslaitos.fi/avoin/wmts/1.0.0/ortokuva/default/WGS84_Pseudo-Mercator/{z}/{y}/{x}.jpg` | WMTS, 3857 | při 401 hlavička `Access-Control-Allow-Origin:` **prázdná**; s klíčem neověřeno | **ano** (`api-key=`, osobní, zdarma) | 0,5 m celostátně, obnova po 3 letech (v Laponsku 12) | CC BY 4.0 (MML) | **s podmínkou** (klíč) | 401 ověřeno (tile i capabilities); rozlišení neověřeno |
| **Helsinki** `https://kartta.hel.fi/ws/geoserver/avoindata/wms`, vrstvy `avoindata:Ortoilmakuva_2026_5cm`, `_2025_5cm`, `_2024_5cm` … (také WMTS `…/gwc/service/wmts`) | WMS 1.3.0 GeoServer, **EPSG:3857 funguje** | `*` | ne | **5 cm**, každoročně 2021–2026; `Ortoilmakuva_2024_30cm` | **CC BY 4.0** (HRI `helsingin-ortoilmakuvat`) | **ano** (jen území Helsinek: 24,82–25,27° v. d., 60,12–60,30° s. š.) | **ověřeno**: GetMap 3857 200 `image/jpeg`, Aleksanterinkatu ostrá střecha se solárními panely, bez vodoznaku |
| **Espoo** `https://kartat.espoo.fi/teklaogcweb/wms.ashx`, vrstvy `Ortokartta` (2026, 11.–14. 4.), `Ortokartta_2024` | WMS, 3857 v capabilities | `*` | ne | **0,30 m** (abstrakt vrstvy); 5 cm jen `Ortokartta_2026_rajoitettu` = „käyttöluvallinen“ (na povolení) | neověřena (Fees/AccessConstraints „none“) | s podmínkou (licence; 30 cm je hrubé na pruhy) | **ověřeno**: GetMap 3857 200, PNG, Tapiola |
| `Ortokartta_HSY-alue` na téže službě Espoo | WMS | `*` | ne | 0,40 m, 2021, celé území HSY | neověřena | jen podklad | capabilities ověřeny |
| **Turku** `https://turku.asiointi.fi/TeklaOGCWeb/WMS.ashx` (stará `opaskartta.turku.fi` → 301), vrstva `Ilmakuva 2025`, také `Ilmakuva 2022 True ortho` | WMS, 3857 | `*` | ne | odhadem **5–8 cm** (prohlédnuto, ostré lavičky, zábradlí) | neověřena (Fees/AccessConstraints „none“) | s podmínkou (licence) | **ověřeno**: GetMap 3857 200, Kauppatori |
| HSY `https://kartta.hsy.fi/geoserver/wms`, `taustakartat_ja_aluejaot:Ortoilmakuva_2023` | WMS; v capabilities jen 3879, 3067, ale GetMap 3857 vrací 200 | **bez CORS** | ne | neověřeno | neověřena | ne (bez CORS) | ověřeno |
| Tampere `https://geodata.tampere.fi/geoserver/ows` | WMS | **bez CORS** | ne | ortofoto ve WMS nenalezeno (jen `ortokuvat:ilmakuvaindeksi_polygon_gk24`) | — | ne | ověřeno (capabilities) |
| Kapsi (komunitní zrcadlo ortofota MML) `tiles.kartat.kapsi.fi/ortokuva/…` | XYZ | — | ne | — | — | ne | 307 na `kapsi-tiles.y2k.fi`, ten neodpověděl (ověřeno); neoficiální |

**Podmínky MML** (ověřeno, stránka podmínek otevřených rozhraní https://www.maanmittauslaitos.fi/en/node/12942):
„The user is responsible for the protection of their own API key and other identifying information.“; „The interface
service is not intended for using high-volume services.“; uživatel musí v aplikaci uvést zdroj. Návod ke klíči
(https://www.maanmittauslaitos.fi/en/rajapinnat/api-avaimen-ohje): osobní klíč z „My Account“, lze ho poslat jako
parametr URL `api-key=`; MML může sledovat využití a kontaktovat uživatele. Na stránce je servisní zpráva „Changes in
the terms of use of the open interface“ z 29. 9. 2026 (**neotevřena**). Podle vyhledávání (neověřeno) je otevřené WMTS
„pro testování a malé použití“ a ortofota v něm stály na stavu z 11. 3. 2026 kvůli výpadku.
**Licence MML** (ověřeno, https://www.maanmittauslaitos.fi/en/opendata-licence-cc40): CC BY 4.0; uvést MML jako
poskytovatele, název dat a datum, vzor „contains data from the National Land Survey of Finland Topographic Database
06/2014“.

**Helsinki**: v datech je zohledněn zákon o ochraně území (aluevalvontalaki) a pokyny armády (popis datasetu HRI,
ověřeno), tedy některá místa mohou být zakrytá. Kredit podle CC BY 4.0: „Helsingin kaupunki, kaupunkimittauspalvelut“
(přesné znění, které HRI žádá, **neověřeno**).

---

## 2. Mapy povrchů ulic

| Město | Endpoint | Obsah | CORS | Licence | Použitelné | Stav |
|---|---|---|---|---|---|---|
| **Helsinki YLRE** (Yleisten alueiden rekisteri) | WFS 2.0 `https://kartta.hel.fi/ws/geoserver/avoindata/wfs`, `typeNames=avoindata:YLRE_Katu_ja_viherosat_kaikki_alue` (také `…_ajorata_alue`, `…_kevytliikenne_alue`, `…_eiliikenne_alue`, `YLRE_Viherosat_alue`, `YLRE_Katualue_alue`), `srsName=EPSG:4326`, `outputFormat=application/json` | polygony dílů ulice: `paatyyppi`/`alatyyppi` (např. **Ajorata/Ajorata**, **Kevyt liikenne/Jalankulkualue**, **Kevyt liikenne/Erotettu pyörätie**, **Muu rakenneosa/Erotusalue**, Nurmikko, Juuristoritilä), `materiaali` (Asfalttibetoni, Nupukivi, Noppakivi, Luonnonkivilaatta…), **`osan_leveys`** (šířka dílu v m), `alueen_nimi` (ulice), `alueen_kayttotarkoitus` (např. Kokoojakatu) | `*` | **CC BY 4.0** (HRI `helsingin-kaupungin-yleisten-alueiden-rekisteri`, ověřeno) | **ano** | **ověřeno**: Bulevardi 46 dílů na 110 × 110 m; vrstva přes ortofoto (WMS) sedí na fasádě a chodníku |
| Tampere | WFS `https://geodata.tampere.fi/geoserver/locus/wfs`, `locus:Katualueen_osa_katu_RpaStreetPart_Polygon_gsview` (a `…_klv_…`) | polygony dílů: `katuosalaji` (AJORATA…), `pintamateriaali`, `toiminnallinen_luokka`, `ajosuunta` | **bez CORS** | neověřena | ne bez proxy | ověřeno (10 dílů u Hämeenkatu, JSON) |
| Tampere maanpeite | `maanpeite:maanpeite_2025_paallystetty_tie`, `_viherpinta`, `_rakennukset` | pokryv země 2025 (zpevněná cesta, zeleň, budovy) | bez CORS | neověřena | ne | jen seznam vrstev |
| Turku | WFS `https://turku.asiointi.fi/TeklaOGCWeb/WFS.ashx`, `kanta:Liikennevayla` | **čáry** základní mapy (`reunaviiva`, `kplkoodi` 62520…), EPSG:3877, GML 3.1.1 | `*` | neověřena | jen jako čáry (jako technická mapa Bratislavy); význam kódů neověřen | ověřeno (3 prvky; dotaz s bbox ve 4326 vrátil 0, nutný bbox v 3877) |
| Espoo | WFS `https://kartat.espoo.fi/teklaogcweb/wfs.ashx`: `kanta:Liikennevayla`, `GIS:Katualueet`, `akaava:Katualue`, `GIS:Viheralueet`, `GIS:Liikennemerkit` | asi čáry základní mapy a plochy z územního plánu | `*` | neověřena | neověřeno (dotaz na prvky nedělán) | jen seznam vrstev |
| Vantaa | WFS `https://gis.vantaa.fi/geoserver/wfs`: `liikenne:kevytliikenne`, `liikenne:keskilinjat`, `gis:rakennukset` | osy, ne plochy | bez CORS | CC BY 4.0 (u jiných dat Vantaa, neověřeno) | ne | ověřeno (capabilities) |
| Celostátně **Digiroad** | OGC API Features `https://avoinapi.vaylapilvi.fi/vaylatiedot/ogc/features/v1/collections/digiroad:dr_leveys/items?bbox=…` (také `dr_kaistojen_lukumaara`, `dr_nopeusrajoitus`, `dr_joukkoliikennekaista`, `dr_pysakointikielto`, `dr_liikennemerkit`, `dr_taajama_alueet`) | atributy úseků sítě: **šířka vozovky v cm** (`arvo`: 400), počet pruhů po směru (`vaik_suunt`), rychlost, buspruh, zákaz stání | `*` | CC BY 4.0 (Väylä, **neověřeno**) | ano jako nápověda (jako ETAK `laius`) | **ověřeno** (Tampere: šířka 400 z r. 2015, 2 pruhy). Pozor: v názvu vrstev „Ylläpito siirtynyt Fintrafficille, Väyläviraston päivitykset päättyneet 18.9.2026“ |

Pozn. k YLRE: rekord obsahuje i `paivittaja` (uživatelské jméno úředníka) — v aplikaci se ptát jen na potřebná pole
(`propertyName=paatyyppi,alatyyppi,materiaali,osan_leveys,alueen_nimi`). YLRE pokrývá jen ulice ve správě
Kaupunkiympäristö (ne pozemky jiných úřadů a soukromé plochy, podle popisu HRI).

---

## 3. Budovy

| Zdroj | Endpoint | Pole | CORS | Licence | Použitelné | Stav |
|---|---|---|---|---|---|---|
| **Helsinki** | WFS `avoindata:Rakennukset_alue_rekisteritiedot` (kartta.hel.fi, jako výše) | polygon, `tyyppi` (Asuinrakennus, Liikerakennus…), **`i_kerrlkm`** (podlaží), **`c_valmpvm`** (dokončení, např. 1892), `c_julkisivu` (kód fasády), `c_rakeaine` (materiál), `c_kayttark`, adresa | `*` | CC BY 4.0 (HRI `helsingin-rakennukset`, podle vyhledávání; **neověřeno** v katalogu) | **ano** | **ověřeno**: Bulevardi 38 domů, např. Bulevardi 14: 5 podlaží, 1898 |
| **Ryhti (SYKE), celostátně** | WFS 2.0 `https://paikkatiedot.ymparisto.fi/geoserver/ryhti_building/wfs`, `ryhti_building:open_building` (`srsName=EPSG:4326`, JSON); také OGC API `…/ryhti_building/ogc/features/v1` | **bod**, **`number_of_storeys`**, **`completion_date`**, `main_purpose` (kód), `facade_material`, `material_of_load_bearing_structures`, **`construction_method`** (prvek/na místě), `apartment_count`, `is_protected` | `*` | CC BY 4.0 podle vyhledávání (stránka licence SYKE **neotevřena**); capabilities: Fees „Maksuton“, AccessConstraints „Lisenssi“ | **ano** (podlaží a rok k obrysu z OSM) | **ověřeno**: Tampere centrum 3 domy (4 podl./1901, 3 podl./1882); limit 3 000 prvků na dotaz (ověřeno na stránce Ryhti) |
| MML Maastotietokanta / rakennuspalvelu | OGC API (klíč) | obrys, podlaží částečně | — | CC BY 4.0 | s podmínkou (klíč) | neověřeno |
| Espoo, Turku, Tampere | `kanta:Rakennus`, `GIS:Rakennukset`, `rakennukset:RAKENNUKSET_JULKINEN_MVIEW` | neověřeno | Espoo, Turku `*`; Tampere bez | neověřena | neověřeno | jen seznam vrstev |

Číselníky Ryhti (`uri.suomi.fi/codelist/rytj/...`) jsem nerozkódovala (např. `construction_method` 02 = asi „na místě“,
**neověřeno**).

---

## 4. Hledání adres a ulic

| Služba | Stav | CORS | Licence | Použitelné |
|---|---|---|---|---|
| **Ryhti `open_address`** `https://paikkatiedot.ymparisto.fi/geoserver/ryhti_building/ogc/features/v1/collections/open_address/items?f=json&filter-lang=cql-text&filter=address_fin='Hämeenkatu 10' AND municipality_number='837'` | **ověřeno**: 1 výsledek s bodem WGS 84; pole `address_fin`, `address_swe`, `address_name_fin/swe`, `postal_office_fin` (ne `street_name_*`) | `*` | jako Ryhti | s podmínkou (jen přesná shoda nebo `LIKE`; potřebuje kód obce; bez fulltextu) |
| Helsinki Palvelukartta `https://api.hel.fi/servicemap/v2/search/?q=Bulevardi%2014&type=address` | **ověřeno**: vrací adresy i mimo Helsinki (Raasepori), fi/sv/en | **bez CORS** | neověřena | ne |
| Digitransit geocoding `api.digitransit.fi/geocoding/v1/search` | **ověřeno**: 401 „missing subscription key“ | — | — | ne (klíč) |
| MML geokoodaus | klíč | — | CC BY 4.0 | ne bez klíče |
| **Photon** (komoot) | neověřeno pro FI | — | ODbL | **záloha** jako v Německu a Rakousku |

---

## 5. OSM a hranice

**Geofabrik** (ověřeno 23. 11. 2026, `index-v1-nogeom.json` a HEAD): `europe/finland/finland-latest.osm.pbf` =
`finland-261122.osm.pbf`, **778,4 MB**, bez podoblastí (Åland je v něm). Pro srovnání ČR 953,9 MB → balík 281 MB, SK
349,1 MB → 107 MB; Finsko tedy odhadem **asi 230 MB, dělit pod 512 MB netřeba** (odhad podle poměru, neověřeno
zabalením).

**Hranice GISCO** (ověřeno: `FI-region-01m-4326-2024.geojson`, CORS `*`): 2 875 polygonů (ostrovy), 27 536 vrcholů,
19,26–31,59° v. d., 59,74–70,09° s. š., **Åland je uvnitř**. V `tools/build_staty.mjs` Finsko zatím není.

---

## 6. Zvláštnosti

- **Pravostranný provoz** (zákon 729/2018, § 19; ověřeno).
- **Jazyky**: úředně finština a švédština (dvojjazyčné názvy ulic v Helsinkách, Espoo, Turku i v datech: `address_swe`,
  `katunimi_ruotsi`). Rozhraní už má `fi` i `sv` (EU jazyky), nic nepřidávat.
- **Åland**: autonomní, podle obecné znalosti má vlastní silniční předpisy (**neověřeno**, zákon jsem na to nečetla).
  GISCO ho počítá do Finska.
- **Citlivá hranice**: s Ruskem (východní hranice, od 2023 přechody zavřené); ortofota mají vojenská omezení
  (aluevalvontalaki, Helsinki to uvádí výslovně).
- **Domy v ulicích**: kamenné činžáky 1880–1930 (novorenesance, jugend; Helsinki Kruununhaka, Ullanlinna, Tampere,
  Turku), funkcionalismus 30. let, poválečné lamelové domy 50. let, **betonové prefabrikáty 60.–80. let (BES)** na
  sídlištích, **dřevěné domy** (staré Porvoo, Rauma, Turku Port Arthur, Puu-Käpylä) a „rintamamiestalo“ (1,5podlažní
  dřevěný rodinný dům 40.–50. let). Ryhti `material_of_load_bearing_structures` a `construction_method` by dřevo a
  prefabrikát rozlišily (číselníky neověřeny).
- **Zima**: příručky počítají s lumitilou (sněhový pás 0,5–1,5 m) a minimální volnou šířkou pro strojní úklid 2,2–2,5 m.

---

## Shrnutí

| Oblast | Zdroj | Stav | CORS | Licence | Doporučení |
|---|---|---|---|---|---|
| Ortofoto celostátní | MML ortokuva WMTS 3857 | 401 bez klíče | prázdná hlavička při 401 | CC BY 4.0 | jen s klíčem (rozhodne Bára) |
| Ortofoto Helsinki | kartta.hel.fi WMS, 5 cm, 2026 | ověřeno | `*` | CC BY 4.0 | **použít** (`res` 0,05–0,1) |
| Ortofoto Espoo | kartat.espoo.fi WMS, 30 cm, 2026 | ověřeno | `*` | neověřena | podklad; zeptat se na licenci |
| Ortofoto Turku | turku.asiointi.fi WMS, 2025 | ověřeno, ostré | `*` | neověřena | použít po ověření licence |
| Mapa povrchů Helsinki | YLRE WFS | ověřeno, sedí | `*` | CC BY 4.0 | **použít** jako FMZK, A/B |
| Mapa povrchů Tampere | locus WFS | ověřeno | bez | neověřena | ne bez proxy |
| Mapa povrchů Turku, Espoo | Tekla WFS (čáry) | částečně | `*` | neověřena | později |
| Šířka vozovky celostátně | Digiroad `dr_leveys` | ověřeno | `*` | CC BY 4.0 (neověř.) | nápověda k odhadu |
| Budovy Helsinki | `Rakennukset_alue_rekisteritiedot` | ověřeno | `*` | CC BY 4.0 | **použít** |
| Budovy celostátně | Ryhti `open_building` (body) | ověřeno | `*` | CC BY 4.0 (neověř.) | **použít** s obrysy z OSM |
| Hledání | Ryhti `open_address` + Photon | ověřeno (Ryhti) | `*` | — | Photon, Ryhti doplňkově |
| OSM | Geofabrik `finland` 778 MB | ověřeno | — | ODbL | jeden balík `fi` |
| Hranice | GISCO `FI` | ověřeno | `*` | © EuroGeographics | přidat do `build_staty.mjs` |
