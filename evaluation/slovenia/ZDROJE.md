# Data pro Slovinsko: ověřené otevřené služby (pro profil ulic)

## Verdikt

**Přidat s podmínkou.** Slovinsko má jako jeden z mála států celou trojici zdarma, bez klíče, s CORS `*` a pod
CC BY 4.0 od jednoho úřadu (GURS): ortofoto ve Web Mercatoru, budovy katastru s počtem podlaží, rokem výstavby a
výškou, a adresy. **Chybí ale mapa povrchů ulic**: státní ani městská data s vozovkou a chodníkem jako plochami jsem
pro Lublaň, Maribor, Celje ani Koper nenašla (Maribor má chodníky a cyklostezky jen jako osy, bez CORS). Profil by tedy
byl jako na Slovensku mimo pasporty: odhad z OSM a ortofota. Ortofoto má jen **25 cm** (DOF025), na čtení pruhů je to
na hraně (Estonsko 3–10 cm, Praha 10 cm).

Podmínky:
1. Profil jen jako odhad z OSM a ortofota (`ortho-osm.js`), s regresí proti Praze a Brnu jako u každé změny odhadu.
2. Ortofoto omezit na hranici státu (mimo Slovinsko server 30 s visí a vrací 504) a počítat s občasným 504 i uvnitř
   (opakovat dotaz jako u IPR).
3. Dotazy na WFS GURS malé (bbox kolem řezu, jen potřebná pole): server odmítá „obsáhlé“ dotazy textem o zneužití.

Ověřeno 23. 11. 2026, asi 60 požadavků na služby (WMS/WFS GURS 25, Maribor 7, Photon 1, Commons 6, PISRS 15, ostatní
katalogy), User-Agent `profily-ulic`, pauza 1–2 s, Origin `https://streetspace.eu`. Overpass ani Nominatim nebyly
použity, žádné osobní údaje se neposílaly, Referer ani User-Agent se nepodvrhovaly, žádný klíč.

Značení: **ověřeno** = odpověď přišla a byla přečtena (u obrázků i prohlédnuta); **neověřeno** = jen z dokumentace,
katalogu nebo vyhledávání. CORS „`*`“ = `Access-Control-Allow-Origin: *`; „bez CORS“ = hlavička chybí.

Zkušební body: Lublaň Prešernov trg (14,5058, 46,0514), Lublaň Ajdovščina/Slovenska (14,5040–14,5060, 46,0505–46,0520),
Maribor Glavni trg (15,6460, 46,5580); mimo Slovinsko Záhřeb (15,9775, 45,8130).

Úřad: **Geodetska uprava Republike Slovenije (GURS)**. Listopadový průzkum hlásil, že služby neodpovídají; důvod:
staré adresy `storitve.eprostor.gov.si` (spojení vyprší) a `prostor4.gov.si` (neexistuje v DNS) už neplatí a katalog
`eprostor.gov.si/imps` z naší sítě také neodpovídá. **Platné služby jsou na `ipi.eprostor.gov.si`** (adresy jsem našla
v otevřeném kódu na GitHubu, kořen serveru vrací 403, konkrétní služby 200).

---

## 1. Ortofoto

| Zdroj | Ověřený stav | Rozlišení, rok | Verdikt |
|---|---|---|---|
| **WMS `https://ipi.eprostor.gov.si/wms-si-gurs-dts/wms`**, vrstva **`SI.GURS.ZPDZ:DOF025_3857`** („Barvni DOF v koordinatnem sistemu EPSG:3857“) | **ověřeno**: GetCapabilities 1.3.0 200, 36 KB, CORS `*`, Fees `none`, AccessConstraints `none`; GetMap 1.3.0 `CRS=EPSG:3857`, 256 × 256 na dlaždici z19: Lublaň 200 `image/jpeg` 9 KB za 1,2 s (napoprvé 504 po 31 s), Maribor 200 10 KB za 0,5 s; obraz prohlédnut: ostrý barevný snímek, střechy a chodníky rozeznatelné | **25 cm** (název DOF025; INSPIRE záznam podle vyhledávání: GSD 0,25 m); rok **neověřeno** (katalog GURS podle vyhledávání: nejnovější nálety 2023–2025, obnova po 2–4 letech; 2024 nálet střední části státu) | **použitelné s podmínkou**: pruhy z ortofota jen hrubě, `res: 0.25`; ořezat hranicí státu a opakovat při 504 |
| Tamtéž vrstva **`SI.GURS.ZPDZ:DOF025`** (nativně EPSG:3794, ale kořen služby nabízí i 3857 a vrstva ho dědí) | **ověřeno**: GetMap v 3857 512 × 512 na Prešernově náměstí (12,5 cm/px) 200 `image/jpeg` 27 KB, 0,4 s; jiný snímek než `_3857` (bez stínů, jiný den); jindy 504 po 30 s | 25 cm | záloha k `_3857` |
| Tamtéž `DOF050`, `DOF050_Z` (historický), `PREGLEDNI_DOF`, `LIDAR` (stínování), `TTN5_TTN10` (základní mapa 1 : 5000) | **ověřeno** jen v GetCapabilities (CRS 3794 a CRS:84 na vrstvě, 3857 z kořene) | 50 cm | podklad nebo historie, pro pruhy ne |
| Mimo Slovinsko (Záhřeb) | **ověřeno**: 504 po 30 s, žádný obrázek | – | dotazy jen uvnitř hranice |
| Starší adresy `storitve.eprostor.gov.si/ows-*`, `prostor4.gov.si/ows2-m-pub/…`, WMTS `ipi.eprostor.gov.si/wmts/…` | **ověřeno nefunkční**: timeout / DNS / 403 | – | nepoužívat |

**Licence** (**ověřeno**, „Splošni pogoji uporabe geodetskih podatkov GURS“, `https://www.e-prostor.gov.si/fileadmin/struktura/Preberi_me.docx`,
datováno 11. 11. 2026): data GURS jsou informace veřejného charakteru pod **CC BY 4.0**, užití komerční i nekomerční,
sdílení i úpravy dovoleny. Povinný údaj o zdroji: „Geodetska uprava Republike Slovenije, vrsta podatka in čas, na
katerega se podatki nanašajo“. Seznam výslovně jmenuje „Daljinsko zaznavanje“ (ortofoto), „Stavbe“, „Register naslovov“,
„Register prostorskih enot“, „Zbirni kataster GJI“. GURS nezaručuje nepřetržitou dostupnost.
Kredit pro aplikaci: **„Ortofoto DOF025, Geodetska uprava Republike Slovenije (CC BY 4.0)“** + rok, až ho zjistíme.

---

## 2. Mapy povrchů ulic

| Zdroj | Ověřený stav | Obsah | CORS | Licence | Verdikt |
|---|---|---|---|---|---|
| GURS Zbirni kataster GJI (sítě), WFS `https://ipi.eprostor.gov.si/wfs-si-gurs-kgi/wfs`, `SI.GURS.KGI:POLIGONI_CESTE_G` | **ověřeno**: 0 objektů v centru Lublaně i Mariboru | plochy silniční infrastruktury (v těchto městech prázdné) | `*` | CC BY 4.0 | **ne** |
| Tamtéž `LINIJE_CESTE_G` | **ověřeno**: 20 linií v centru Lublaně, pole jen `GJI_ATR1_SIFRA` (10, 11, 13; význam kódů nenalezen) | osy / linie silničních objektů | `*` | CC BY 4.0 | ne (nejsou plochy) |
| **DRSI „Javna občinska / državna cestna infrastruktura“** (dejanska raba javne cestne infrastrukture), převzatá v WFS Mariboru `https://prostor.maribor.si/ows/public/wfs`, `public:drsi_draba_oc`, `drsi_draba_dc` | **ověřeno** (Maribor centrum): 69 multipolygonů, pole `vrsta_dr` (3313, 3314), **`vrsta_pov`** (10, 12, 14), `opis` („trg“, „ploščad“), `d_vir` 2019 | plochy pozemků veřejných komunikací, zřejmě od hranice k hranici bez dělení na vozovku a chodník (význam kódů `vrsta_pov` **neověřen**) | **bez CORS** (Maribor) | podle podatki.gov.si „Ni omejitev“, odkaz na podmínky Mariboru (neotevřeno) | **ne teď**: celostátní služba DRSI s CORS nenalezena; kandidát na „šířku uličního prostoru“ jako ETAK v Estonsku |
| Maribor `public:nig_cp_plocniki` (chodníky), `nig_cp_kol_steze` (cyklo), `int_mob_pes_cone`, `int_mob_invalid_pm` | **ověřeno**: chodníky jako **osy** (`LineString`) s polem `sir_min`/`sir_max` (v centru 0 = nevyplněno), `ustroj_opis` (TLAKOVAN…), `ul_ime`, data 2014; cyklo jako linie s typem (rdeča KS na pločniku, rdeč prehod) | linie, ne plochy | bez CORS | neuvedena (katalog: „Ni omejitev“) | ne (jen nápověda, a bez CORS by potřeboval statický soubor) |
| Lublaň (MOL): ArcGIS Online organizace `jlo5wkWDRtOVSOdg` (137 služeb), hub `mol-ljubljana.hub.arcgis.com`, `gis.ljubljana.si` | **ověřeno**: hub vrací 0 položek, seznam 137 služeb neobsahuje nic o vozovkách a chodnících (WiFi, školy, formuláře Survey123…); `gis.ljubljana.si` neodpovídá (timeout); podatki.gov.si má jen „Urejene kolesarske poti v MOL“ (linie, ZIP, CC BY 4.0, 2021) | – | – | – | **nenalezeno** |
| Celje, Kranj, Koper | **neověřeno**: vyhledávání nic nenašlo; Koper má na podatki.gov.si jen cyklotrasy (GeoJSON), menší obce „Pločniki v občini …“ jako ZIP (systém PISO) | – | – | – | nenalezeno |
| Celostátní topografická data GURS (DTM 5), Dejanska raba (MKGP) | **neověřeno**: plochy cest v nich jsem nehledala dotazem; dejanska raba nerozlišuje vozovku a chodník | – | – | CC BY 4.0 | později |

**Závěr:** vozovka a chodník jako plochy nejsou nikde v dosahu prohlížeče. Profil = odhad z OSM a ortofota (jako
Slovensko mimo pasporty, Německo mimo Berlín/Hamburk/Cáchy). Doplňkově zvážit statický soubor chodníků Mariboru
(osy, data 2014) a dotaz na Lublaň (Oddelek za urejanje prostora / Služba za digitalizacijo), zda má mapu povrchů.

---

## 3. Budovy

| Zdroj | Ověřený stav | Pole | CORS | Verdikt |
|---|---|---|---|---|
| **Kataster nepremičnin, WFS `https://ipi.eprostor.gov.si/wfs-si-gurs-kn/wfs`, `SI.GURS.KN:STAVBE`** | **ověřeno**: WFS 1.1.0 GetFeature `outputFormat=application/json`, `srsName=EPSG:4326`, bbox 150 × 110 m v Lublani: 5 budov, 28 KB, 1,7 s; capabilities 13 s | **`STEVILO_ETAZ`** (podlaží, 5–6), **`STEVILKA_PRITL_ETAZE`** (číslo přízemí, 2 → jedno podzemní podlaží; nadzemní = ETAZ − PRITL + 1, můj výklad, neověřeno), **`LETO_IZGRADNJE`** (1821, 1897, 1946), `LETO_OBNOVE_FASADE`, `LETO_OBNOVE_STREHE`, **`VISINA_H1/H2/H3`** (m n. m.; podle Ur. l. RS 41/2022 H1 podlaha nejnižšího podlaží, H2 nejvyšší bod střechy, H3 terén u hlavního vchodu; výška = H2 − H3, ověřeno 23. 11., `ab/ZPRAVA.md`; okap katastr nemá), `NOSILNE_KONSTRUKCIJE_NAZIV_SL` (opeka, beton…), `TIPI_STAVB_NAZIV_SL` (samostoječa / vrstna), počet bytů a provozoven, `BRUTO_TLORISNA_POVRSINA`, `TLORIS_GEOM` / `OBRIS_GEOM` (obrys v GeoJSON uvnitř vlastností, hlavní geometrie je bod), přesnost polohy | `*` | **použít** (nejbohatší registr budov ze všech dosavadních států); ptát se jen na potřebná pole (`propertyName`), odpověď je jinak velká |
| Tamtéž `STAVBE_OBRIS`, `ETAZE`, `DELI_STAVB` | neověřeno dotazem (jen capabilities) | obrysy, podlaží po patrech | `*` | dle potřeby |
| Lastnictví (`LASTNISTVO_PRAVNIH_OSEB`, `OSEBE_*`, `IMETNIKI_LASTNISTVA_H`) | nedotazováno | vlastníci | – | **nepoužívat** (osobní/firemní údaje, aplikace je nepotřebuje) |

Licence CC BY 4.0 (výslovně „Stavbe“ v podmínkách GURS, ověřeno). Kredit „Kataster stavb, GURS“ + datum stavu.
Pozor na limit: GURS u příliš velkého dotazu (300 objektů, 300 × 170 m, vrstva sítí) vrátil výjimku „Obvestilo o
neprimerni zahtevi“ (dotaz zamítnut jako hromadné stahování, ať se použije aplikace JGP); jiný velký dotaz se uřízl
v půlce (1,4 MB). **Dotazy na kliknutí držet malé.**

Bonus (pro „Sítě pod zemí“, ne teď): `wfs-si-gurs-kgi` `LINIJE` vrací v centru Lublaně **3D trasy sítí celé země**
(elektronické komunikace, kabely, plyn, horkovod, kanalizace, vodovod, veřejné osvětlení) s výškou bodů; ověřeno.

---

## 4. Hledání adres a ulic

| Služba | Ověřený stav | Poznámka | Verdikt |
|---|---|---|---|
| **GURS `wfs-si-gurs-kn` `SI.GURS.KN:NASLOVI_HS`** (domovní čísla s bodem) | **ověřeno**: CORS `*`, GeoJSON v EPSG:4326, 1 s; pole `ULICA_NAZIV`, `HS_STEVILKA`, `HS_DODATEK`, `NASELJE_NAZIV`, `OBCINA_NAZIV`, **`*_NAZIV_DJ`** (dvojjazyčný název v italské a maďarské oblasti) | filtr CQL `ULICA_NAZIV LIKE 'Trubarjeva%'` funguje (ověřeno na `REGISTER_NASLOVOV`), ale je to přesná shoda na začátek řetězce, bez fulltextu a bez tolerance diakritiky | **použitelné s podmínkou**: jako RÚIAN (ulice + číslo), na volný text nestačí |
| GURS `wfs-si-gurs-rn` `SI.GURS.RN:REGISTER_NASLOVOV` | **ověřeno**: CORS `*`, bez geometrie, souřadnice `E`, `N` v D96/TM (EPSG:3794) | – | spíš `NASLOVI_HS` |
| GURS `wfs-si-gurs-rpe` (`OBCINE`, `NASELJA`, `ULICE`, `CETRTNE_SKUPNOSTI`…) | **ověřeno** (capabilities, CORS `*`) | hranice obcí pro `mesta-si.json`, ulice s geometrií | pro hranice měst a hledání ulic |
| **Photon** (komoot) | **ověřeno**: „Trubarjeva cesta Ljubljana“ → ulice v Lublani, CORS `*` | ODbL | **záloha / hlavní volný text** |

---

## 5. OSM (Geofabrik) a hranice

**Geofabrik** (**ověřeno** 23. 11. 2026): `europe/slovenia/slovenia-latest.osm.pbf` → `slovenia-261122.osm.pbf`,
**314,7 MB** (Content-Length 314 659 500). Pod 512 MB, **dělit není třeba**: jeden balík `si` (po zabalení odhadem
120–150 MB podle poměru u Česka; neověřeno).

**Hranice GISCO** (**ověřeno**: `NUTS_RG_01M_2024_4326_LEVL_0.geojson`, CORS `*`): Slovinsko jeden polygon,
1 154 vrcholů, obdélník 13,38–16,60° v. d., 45,42–46,88° s. š. `tools/build_staty.mjs` Slovinsko zatím nemá. Státní
hranici má i GURS (Evidenca državne meje, CC BY 4.0; nedotazováno).

---

## 6. Zvláštnosti

- **Doprava vpravo**, jako u nás.
- **Jazyk**: slovinština (`sl.js` už v aplikaci je, „Profili ulic“). Na pobřeží (Koper, Izola, Piran) úředně i italština,
  v Prekmurí maďarština: registr adres má dvojjazyčné názvy (`*_NAZIV_DJ`). Žádný jazyk nepřidávat.
- **Citlivé hranice**: **Piranský záliv** (arbitrážní rozhodnutí 2017 Slovinsko uznává, Chorvatsko ne) a několik
  sporných úseků s Chorvatskem (Dragonja, Sveta Gera / Trdinov vrh); na profil ulic to dopad skoro nemá, ale „stát
  řezu“ u Dragonji a v Piranském zálivu nepopisovat jako rozhodnutý (GISCO 1 : 1 M tam kreslí jednu čáru).
- **Tramvaje**: ve Slovinsku žádné (lublaňská zrušena 1958); autobusy LPP Lublaň, Marprom Maribor. Trolejbusy nejsou.
- **Typy domů v ulicích** (vlastní zkušenost a obecná znalost, **neověřeno** na fotkách): historická jádra
  (Lublaň Staré město, Piran a pobřeží v benátském stylu, Ptuj, Škofja Loka), **rakousko-uherské činžáky
  a secese** kolem 1900 (Lublaň centrum, Maribor), **funkcionalismus a Plečnikova Lublaň** mezi válkami, **socialistické
  bloky a sídliště** (Lublaň Fužine, Štepanjsko naselje, Maribor Tabor, Velenje), rodinné domy předměstí; dřevěné domy
  v ulicích výjimečně (horské vesnice). Katastr dává rok a materiál nosné konstrukce, takže vzhled jde odvodit z dat.
  Paneláky: Slovinsko bylo součástí Jugoslávie, ne východního bloku; dle pravidla z 23. 11. 2026 („socialistický vzhled
  jen CZ, SK, PL, EE a bývalá NDR“) by tu byl „nový poválečný bytový dům“ — **rozhodne Bára** (jugoslávská sídliště jsou
  socialistická, ale jiné technologie).

---

## Shrnutí

| Oblast | Zdroj | Stav | CORS | Licence | Doporučení |
|---|---|---|---|---|---|
| Ortofoto | GURS WMS `wms-si-gurs-dts`, `DOF025_3857` | ověřeno, 25 cm, rok neověřen; občas 504, mimo stát 504 | `*` | CC BY 4.0 (ověřeno) | **Použít** jako podklad i pro hrubé pruhy (`res: 0.25`), ořez hranicí, opakování |
| Mapa povrchů | – (Maribor jen osy chodníků a pozemky komunikací bez CORS; Lublaň nic) | ověřeno nenalezeno | – | – | Odhad z OSM a ortofota; zeptat se Lublaně |
| Budovy | GURS `wfs-si-gurs-kn` `STAVBE` (podlaží, rok, výška, konstrukce, obrys) | ověřeno | `*` | CC BY 4.0 | **Použít** |
| Hledání | GURS `NASLOVI_HS` (CQL) + Photon | ověřeno | `*` | CC BY 4.0 / ODbL | Photon na volný text, GURS na přesnou adresu |
| Hranice měst | GURS `wfs-si-gurs-rpe` `OBCINE` | ověřeno (capabilities) | `*` | CC BY 4.0 | statický soubor při nasazení |
| OSM | Geofabrik `slovenia` 314,7 MB | ověřeno | – | ODbL | jeden balík `si` |
| Hranice státu | GISCO `SI` | ověřeno | `*` | © EuroGeographics | doplnit do `build_staty.mjs` |
| Sítě (později) | GURS `wfs-si-gurs-kgi` `LINIJE` (3D) | ověřeno | `*` | CC BY 4.0 | kandidát pro ◍ Sítě mimo Prahu |

Neověřeno: rok a přesné rozlišení ortofota v jednotlivých městech; význam kódů `vrsta_pov` DRSI a `GJI_ATR1_SIFRA`;
`STEVILKA_PRITL_ETAZE`; licence dat Mariboru; zda Lublaň vůbec mapu povrchů vede; velikost balíku
po zabalení.

## Rozhodnutí pro Báru

1. **Přidat Slovinsko teď jen jako odhad z OSM a ortofota 25 cm** (bez mapy povrchů), nebo počkat, až se Lublaň vyjádří?
2. **Napsat Lublani (MOL)**, zda má mapu povrchů ulic (vozovka, chodník, cyklostezka) a za jakých podmínek? A DRSI,
   zda „dejansko rabo javne cestne infrastrukture“ nabízí jako službu s CORS a co znamenají kódy `vrsta_pov`?
3. **Vzhled poválečných domů**: jugoslávská sídliště jako „socialistický“ vzhled, nebo „nový poválečný bytový dům“
   jako na Západě (pravidlo z 23. 11. zatím Slovinsko nejmenuje)?
4. **Sítě pod zemí** pro celé Slovinsko z katastru GJI (3D trasy): zařadit na později, nebo ne?
5. **Značky**: Commons má slovinské značky skoro jen ve **starém číslování** (II-x, III-x z roku 2000) jako
   „PD-Slovenia-exempt“; nová čísla (2202, 2421…) chybí. Kreslit podle obrázků pravidla 2024, nebo převzít staré
   kresby (piktogramy se zřejmě nezměnily, neověřeno)? Podrobnosti v `NORMY.md`.
6. Hledání: stačí Photon, nebo dopsat i přesné hledání adresy přes GURS (jako RÚIAN)?

## Doplněno při zapojení (23. 11. 2026)

- Rok náletu DOF025 služba nedává: GetFeatureInfo vrací jen barvy pásem, rozměr času má jen historická vrstva DOF050_Z,
  WFS `wfs-si-gurs-dts` neexistuje (404). Kredit je proto „stav 11/2026“.
- GetMap `DOF025_3857` 23. 11.: odpověď do 1 s, nebo 30 s nic a 504 (i uvnitř státu, náhodně, opakovaný dotaz obvykle
  projde). Aplikace dává prvnímu dotazu polovinu času a pak jeden opakuje.
- STAVBE: výchozí geometrie je těžiště (BBOX v URL hledá těžiště); `TLORIS_GEOM` chybí v Mariboru u mnoha domů, obrys
  `OBRIS_GEOM` mají; filtr CQL vrací 403, filtr FES (`FILTER=<fes:Filter>…`) funguje. `NASLOVI_HS` s `PropertyIsLike`
  na `ULICA_NAZIV` a `PropertyIsEqualTo` na `HS_STEVILKA`: 0,7 s.
