# Data pro Dánsko (DK): ověřené otevřené služby (pro profil ulic)

Ověřeno 23. 11. 2026, asi 50 požadavků, User-Agent `profily-ulic`, pauza 1 s, Origin `https://streetspace.eu`. Overpass
ani Nominatim nebyly použity, žádný klíč ani token, žádné osobní údaje, Referer se nepodvrhoval.

Značení: **ověřeno** = odpověď přišla a byla přečtena (obrázky prohlédnuty); **neověřeno** = jen z dokumentace,
katalogu nebo vyhledávání. CORS „`*`“ = `Access-Control-Allow-Origin: *`; „echo“ = server vrací náš Origin.

Zkušební body: Kodaň Nørrebro u Assistens Kirkegård (12,553; 55,690), Kodaň Rådhuspladsen (12,5685; 55,6761), Kodaň
Vesterbro/centrum (12,560–12,575; 55,672–55,680), Aarhus Rådhuspladsen / Park Allé (10,205; 56,153).

## Verdikt

**Přidat s podmínkou.** Dánsko má otevřené ortofoto výborné kvality (10–12,5 cm, každé jaro celý stát, EPSG:3857
WMTS do z20, CORS echo, licence volná s uvedením zdroje), ale **jen s bezplatným tokenem** (Dataforsyningen) nebo API
klíčem (Datafordeler). Bez klíče není žádná úřední cesta k mapovým dlaždicím ani GeoDanmark vektorům. Token by byl ve
stránce vidět; Klimadatastyrelsen to sama počítá (její knihovny `okapi` a `gsearch-ui` mají token v atributu
`data-token` v HTML, ověřeno v README). Kodaň a Aarhus mají vlastní WFS **bez klíče, s CORS `*`**: Kodaň vodicí čáry
okrajů vozovek a cyklostezek (GeoDanmark `vejkant`), plochy parkování s orientací stání, vodorovné značení a budovy
s rokem, podlažími a výškou okapu (CC BY 4.0 u části vrstev). Mapa povrchů jako polygony vozovka/chodník neexistuje,
jsou to **čáry** (jako technická mapa Bratislavy). Hledání: DAWA je vypnutá (410), GSearch chce token, Photon funguje.
OSM 498 MB, jeden balík pod 512 MB.

Podmínka: Bára si založí účet na Dataforsyningen (zdarma) a souhlasí, že token bude v kódu stránky veřejný (vlastní
token jen pro tuto aplikaci, omezený na služby ortofota a GSearch). Bez toho jen OSM + Photon + Kodaň/Aarhus, tedy
o mnoho horší odhad mimo Kodaň.

### Rozhodnutí pro Báru

1. Založit účet a token Dataforsyningen (zdarma) a dát ho do stránky (viditelný), nebo Dánsko odložit / jet bez ortofota?
2. Pokud token: použít i GSearch (úřední hledání adres a ulic) místo Photonu?
3. Kodaň: zapojit `vejkant` (čáry okrajů vozovky a cyklostezky) jako „linie mapy povrchů“ podobně jako Bratislava (`?tm=1`)
   a otestovat A/B? Licence vrstvy `vejkant` a `bygning` není v katalogu výslovně uvedena (ostatní vrstvy KK CC BY 4.0,
   data GeoDanmark CC BY 4.0) → zeptat se Københavns Kommune, nebo brát jako GeoDanmark CC BY 4.0?
   **Rozhodnuto 24. 11. 2026: použít** (i stání a budovy; viz 2a).
4. Kodaňské budovy (`k101:bygning`: rok, podlaží, výška okapu) pro vzhled domů v Kodani; mimo Kodaň a Aarhus jen OSM
   (BBR celostátně jen přes Datafordeler s klíčem)? **Rozhodnuto 24. 11. 2026: použít.**
5. Datafordeler (nový `wms.datafordeler.dk` s API klíčem na 2 roky) místo Dataforsyningen? Dataforsyningen během podzimu
   2026 část služeb vypíná (forum OSM; ortofoto zatím běží). Doporučuji Dataforsyningen teď, s poznámkou v backlogu.
6. Normy: použít vejregler „Tværprofiler i byer“ (2019, četla jsem; novější vydání 31. 5. 2024 jsem neotevřela) a
   „Anlæg for parkering og standsning i byer“ (2023)? Viz NORMY.md.
7. Bezpečnostní poznámka: GetCapabilities WMTS Dataforsyningen (`orto_foraar_webm_DAF`) vrací v `ResourceURL` přihlašovací
   jméno a heslo k Datafordeleru (cizí servisní účet). **Nepoužívat**; je to chyba poskytovatele, šlo by mu dát vědět.

---

## 1. Ortofoto

| Zdroj | Typ, CRS | Ověřený stav | CORS | Klíč | Licence | Verdikt |
|---|---|---|---|---|---|---|
| **Dataforsyningen `orto_foraar_webm_DAF`** `https://api.dataforsyningen.dk/orto_foraar_webm_DAF?service=WMTS&request=GetTile&layer=orto_foraar_webm&tilematrixset=DFD_GoogleMapsCompatible&…&token=…` | WMTS, Web Mercator (`DFD_GoogleMapsCompatible`), úrovně 0–**20** (z20 ScaleDenominator 533,18 = 0,149 m/px na rovníku, **0,084 m/px v Kodani**), obálka 2,48–17,56° v. d., 53,0–58,6° s. š. | **ověřeno**: GetCapabilities 200 **bez tokenu**; GetTile bez tokenu **403** | echo (i u 403) | **ano**, token (účet zdarma) | „Vilkår for brug af frie geografiske data“ (1. 12. 2022, ověřeno, PDF) | **s podmínkou (token)** |
| Dataforsyningen `orto_foraar_DAF` | WMS 1.3.0, mimo jiné **EPSG:3857**, 25832, 4326; vrstvy `orto_foraar`, `orto_foraar_12_5` („Ortofoto forår 12,5cm“), `orto_foraar_10` („Ortofoto forår 10cm“), CIR, `fotoindex` | **ověřeno**: capabilities 200 bez tokenu; GetMap 3857 bez tokenu **403** | echo | ano | dtto | s podmínkou (token); `fotoindex` by dal datum snímku |
| Datafordeler `services.datafordeler.dk/GeoDanmarkOrto/orto_foraar_webm/1.0.0/WMTS` (staré, jméno + heslo) | WMTS | **ověřeno**: 403 bez přihlášení | `*` | jméno+heslo; podle fóra OSM končí nejpozději 1. 1. 2027 | dtto | ne (končí) |
| Datafordeler nový `wms.datafordeler.dk/…`, `wmts.datafordeler.dk/…` | WMS/WMTS | **ověřeno**: 401 bez klíče (cesty k ortofotu jsem hádala, neověřeno, zda jsou správné) | `*` | API klíč, platí 2 roky (fórum OSM, neověřeno) | dtto | alternativa k tokenu |
| Septima cache pro OSM `https://osmtools.septima.dk/mapproxy/tiles/1.0.0/kortforsyningen_ortoforaar/EPSG3857/{z}/{x}/{y}.jpeg` (y od severu, ač cesta „TMS“) | XYZ 3857 | **ověřeno**: 200, JPEG, CORS `*`; **červený vodoznak „© SDFE service by Septima“** uprostřed dlaždice z19 (prohlédnuto), z21 zvětšené a rozmazané | `*` | ne | podle editor-layer-index „(CC BY 4.0) GeoDanmark“ | **ne**: služba soukromé firmy pro editory OSM, vodoznak; bez souhlasu Septimy nepoužívat |
| Kodaň vlastní ortofoto | — | WMS `wfs-kbhkort.kk.dk/k101/ows` ortofoto nemá (ověřeno, 485 vrstev bez „orto/luft“) | | | | nenalezeno |

**Rozlišení a rok** (neověřeno dotazem, bez tokenu nejde): jarní snímkování GeoDanmark „producerer årligt landsdækkende
ortofotos“ (Confluence KDS `confluence.kds.dk/x/EICIAQ`, přečteno přes WebFetch); vrstvy 12,5 cm (celý stát) a 10 cm
(podle názvu asi města). Rok aktuální mozaiky jsem neověřila (`fotoindex` chce token). Snímek ze Septimy (z jarní
mozaiky) v Kodani ostrý, bez listí.

**Licence** (ověřeno, PDF `https://dataforsyningen.dk/asset/PDF/rettigheder_vilkaar/Vilk%C3%A5r%20for%20brug%20af%20frie%20geografiske%20data.pdf`,
1. 12. 2022): bezplatné, celosvětové, neomezené užívání, kopírování, šíření, úpravy, komerčně i nekomerčně. Povinnost:
uvést „Indeholder data fra Styrelsen for Dataforsyning og Infrastruktur“, název datové sady a že jde o datovou službu
(vzor „…, skærmkortet, WMS-tjeneste“), zpřístupnit odkaz na podmínky, nevzbuzovat dojem, že úřad aplikaci doporučuje.
Kredit pro aplikaci: „Indeholder data fra Styrelsen for Dataforsyning og Infrastruktur, Ortofoto forår, WMTS-tjeneste“
(úřad je dnes součástí Klimadatastyrelsen; GeoDanmark pro vektory uvádí CC BY 4.0 a kredit „@geodanmark“, ověřeno na
`geodanmark.dk/home/vejledninger/vilkaar-for-data-anvendelse/`, ortofota tam výslovně nejmenuje).

**Token v prohlížeči:** podmínky (PDF výše) o tokenu nic neříkají. Klimadatastyrelsen sama vydává knihovny pro
vkládání map a hledání do webových stránek (`github.com/Klimadatastyrelsen/okapi`, `gsearch-ui`), kde se token píše
přímo do HTML (`<div … data-token="…">`, ověřeno v README). Viditelný token je tedy zamýšlené užití. Riziko: někdo
token zkopíruje a čerpá na náš účet (služby jsou zdarma, nanejvýš zablokování tokenu). Doporučení: samostatný token jen
pro aplikaci, v kódu jako konfigurace (ne v `config.local.js`, protože jde o veřejný údaj), a záloha (OSM a mapa bez
ortofota), když token přestane platit. Podmínky uživatelského účtu Dataforsyningen (stránka je SPA, text jsem nenačetla):
**neověřeno**.

---

## 2. Mapy povrchů ulic

Celostátně: **GeoDanmark vektor** (Vejkant = okraje vozovek a stezek jako čáry, Helle = ostrůvky, Parkering, Bygning…)
přes Datafordeler `wfs.datafordeler.dk/GEODKV/GEODKV_WFS/1.0.0/WFS` (**ověřeno: 401 bez klíče, CORS `*`**) nebo
Dataforsyningen (jméno služby jsem nenašla, tři pokusy 404). GeoDanmark nemá polygony vozovky a chodníku, jen čáry
okrajů (můj výklad podle Kodaně níže, specifikaci jsem neotevřela).

### 2a. Kodaň: `https://wfs-kbhkort.kk.dk/k101/ows` (GeoServer, WFS 2.0)

**Ověřeno**: CORS `*`, bez klíče, `srsName=EPSG:4326` + `outputFormat=application/json` + `bbox=…,urn:ogc:def:crs:EPSG::4326`
funguje, odpovědi do 2 s. Capabilities: Fees `NONE`, AccessConstraints `NONE`; 485 vrstev.

| Vrstva | Ověřený obsah | Licence | Verdikt |
|---|---|---|---|
| **`k101:vejkant`** | čáry (MultiLineString) GeoDanmark, pole `vejtype`: **Kørevej** (okraj vozovky), **Cykelsti langs vej** (okraj cyklostezky podél ulice), Hovedsti, Sti diverse, Indkørselsvej, Internvej; `synlig_vejkant`, `registreringfra` (2025, „Totalajourføring 2024“). Vesterbro 500 čar na 1 × 0,9 km (293 vozovka, 106 cyklostezka) | v katalogu opendata.dk jako dataset **nenalezena**; obsahem GeoDanmark (CC BY 4.0) → **neověřeno** | **s podmínkou**: jako „linie mapy povrchů“ (obruby a hrany cyklostezek), A/B |
| `k101:helle` | ostrůvky jako čáry obrysu | dtto | doplněk k vejkant |
| **`k101:parkering_areal`** | **polygony stání** s `p_type` (např. „Afmærket skråparkering, 75°“, „Uafmærket parkering“), `antal_p_pladser`, `vejside`, `p_ordning`, aktualizace 2026 | dataset `parkeringspladser` (vrstva `p_pladser`) **CC BY 4.0** (ověřeno v CKAN opendata.dk); `parkering_areal` sama v katalogu není | **použitelné** (orientace stání jako Tallinn) |
| `k101:afmaerkning_total` | polygony vodorovného značení: Parkering, Gul afmærkning, Symboler på kørebane, Vejbump, Hvidafmærkning, Servicemarkering | **CC BY 4.0** (ověřeno v CKAN, dataset `afmaerkning_total`) | kandidát (pruhy, stání) |
| `k101:belaegninger - veje` | čáry povrchů z Vejman (produkt, rok položení, `vejklasse_`) | neuvedena | spíš ne |
| `k101:renhold_vejarealer_tap` | v testovaném bodě prázdné | | neověřeno |
| `k101:fortovsmatrikel`, `cykelsti`, `hastighedszoner`, `gadetraer` | jen v seznamu | | neověřeno |

**Rozhodnutí (Bára 24. 11. 2026):** „Kodaňská data bych použila.“ Vrstvy `vejkant`, `parkering_areal` a `bygning` jsou
v aplikaci **zapnuté**, přestože jejich licence v katalogu uvedená není; kredit „okraje vozovek (GeoDanmark) © Københavns
Kommune“, „parkovací plochy © Københavns Kommune“, „budovy (BBR, GeoDanmark) © Københavns Kommune“. A/B v aplikaci
(`ab/ZPRAVA.md`, 72 řezů v Kodani a 4 kontrolní v Aarhusu): čáry okrajů lépe 5, hůř 2, stejně 3, nejasné 2; parkovací
plochy lépe 7, hůř 2, stejně 3, nejasné 7; budovy `buildings-ab/ZPRAVA.md`. Vypnout jdou `?kbhkant=0`, `?kbhpark=0`,
`?kbhbyg=0`.

### 2b. Aarhus: `https://webkort.aarhuskommune.dk/wfs/wfs` (Spatial Suite, WFS 2.0)

**Ověřeno**: CORS `*`, 447 vrstev, GeoJSON v EPSG:4326.
- `spatialsuite:fortove_tvaerprofilelementer`: **čáry prvků příčného profilu** z Vejman (`TPE` „Fortov“, `VEJSIDE`
  Højre/Venstre, `OFFSET`, úsek v km), 17 v centru. Bez šířky.
- `spatialsuite:fortove_sortdrift_ny`: chodníky jako čáry **se šířkou** `bredde` (1,5–4 m), některé z roku 2017.
- `Kantafgraensning`: v centru prázdné. Další: `Cykelstier_ny`, `offentlige_parkeringspladser`, `Handicapparkering`.
- Licence: datasety Aarhusu na opendata.dk jsou **CC BY 4.0** (ověřeno v CKAN: `cykelstier`, `parkering-i-aarhus-kommune`),
  vrstvy chodníků samy v katalogu nejsou (**neověřeno**). Verdikt: nápověda k šířce chodníku, ne mapa povrchů.

### 2c. Odense, Aalborg

Na opendata.dk (CKAN) pod nimi nic o vozovkách ani chodnících; vlastní WFS jsem nenašla (**nenalezeno**, jedno
vyhledávání). Zbývá celostátní GeoDanmark (s klíčem).

---

## 3. Budovy

| Zdroj | Ověřený stav | Pole | Licence | Verdikt |
|---|---|---|---|---|
| **Kodaň `k101:bygning`** | **ověřeno**, CORS `*`, bez klíče | obrys GeoDanmark + BBR: **`opfoerelselsaar`** (rok, např. 1862), **`antaletager`** (podlaží), **`tagrendehoejde_estimat`** (výška okapu, m), materiál zdi a střechy, užití | v katalogu nenalezena (GeoDanmark CC BY 4.0, BBR „frie data“) → neověřeno | **použitelné v Kodani**; ptát se jen na potřebná pole (`propertyName`), vrstva má i `ejerforhold`, sousední `bygning_bbr_kbh` i **`ejernavn`** (jméno vlastníka, u soukromých osob osobní údaj) |
| Aarhus `spatialsuite:geokodede_bbr_bygninger` | **ověřeno**, CORS `*` | `Opfoerelse_Aar`, `Ombyg_Aar`, užití, materiál zdi a střechy, plochy (podlaží jen z `Byg_Arl_Saml`/`Byg_Bebyg_Arl`) | dataset `bbr-ejendomme-og-bbr-bygninger` CC BY 4.0 (CKAN, ověřeno) | použitelné v Aarhusu |
| BBR celostátně (Datafordeler) | neověřeno (API klíč) | rok, podlaží, užití | frie data | s klíčem |
| GeoDanmark `Bygning` celostátně | 401 bez klíče | obrys (výšku ani podlaží neuvádí, neověřeno) | CC BY 4.0 | s klíčem |
| OSM | | `building:levels`, `start_date` | ODbL | záloha |

Vzhled domů: `house-looks.js` už má `nordicLook("DK")` (dánský cihlový činžák, dřevěné domy jen na Bornholmu).

---

## 4. Hledání adres a ulic

| Služba | Ověřený stav | Verdikt |
|---|---|---|
| DAWA `api.dataforsyningen.dk/autocomplete` | **410 Gone** („no longer available“), CORS `*` | **ne** (vypnuto) |
| GSearch `api.dataforsyningen.dk/rest/gsearch/v2.0/navngivenvej?q=…` | **400** bez tokenu („Authentication token must…“), CORS echo | s tokenem (úřední; ulice, adresy, místní jména) |
| **Photon** `photon.komoot.io/api/?q=Nørrebrogade 10 København` | **200**, CORS `*`, dům Nørrebrogade 10, `countrycode` DK | **použitelné bez klíče** (záloha, ODbL) |

---

## 5. OSM (Geofabrik) a hranice

- **Ověřeno** (index Geofabrik + HEAD): `europe/denmark/denmark-latest.osm.pbf` = `denmark-261122.osm.pbf`, **498,4 MB**
  (hustá data z importů budov a adres). Faerské ostrovy (`europe/faroe-islands`) a Grónsko (`north-america/greenland`)
  jsou zvlášť. Balík `dk`: odhadem asi 180 MB (poměr jako u Estonska 124,8 → 45 MB), **pod 512 MB, bez dělení**; jen R2.
- Hranice: `gisco("DK")` (GISCO CNTR 1 : 1 M, Faerské ostrovy a Grónsko mají vlastní kódy FO, GL; neověřeno, soubor
  60 MB jsem nestahovala). V `tools/build_staty.mjs` a `tools/countries.mjs` Dánsko zatím není.

---

## 6. Zvláštnosti

- Provoz vpravo. Stání jen vpravo, v jednosměrce a „mindre befærdet vej“ i vlevo (NORMY.md B).
- Silná cyklistická infrastruktura: **cyklostezky zvýšené mezi vozovkou a chodníkem** („Copenhagen style“, obrubník na
  obou stranách) – v profilu typický prvek; cykelgade (E 47) od 2021.
- Kodaň a Aarhus mají **letbane** (tramvaj) a Kodaň metro (pod zemí, ignorovat), Odense letbane od 2022.
- Domy: Indre By (barokní a klasicistní měšťanské domy 3–5 podlaží, štítové vikýře), **brokvartererne** (Nørrebro,
  Vesterbro, Østerbro: pětipodlažní cihlové činžáky 1870–1910 v blocích), funkcionalismus 30. let (cihla), poválečné
  sídliště „almene boliger“ z panelů 60.–70. let (Brøndby Strand, Albertslund; nejde o socialistický panelák, `panel` ne),
  ve městech nízké „byhuse“, předměstí parcelhuse ze žluté cihly 60.–70. let, venkov hrázděné a doškové domy.
- Jazyk rozhraní: dánština (`da.js`) už existuje; žádný nový jazyk.
- Citlivé hranice: žádné sporné na pevnině (DE). Faerské ostrovy a Grónsko jsou součástí Dánského království, ale ne
  `DK` v GISCO ani v Geofabrik; nechat mimo (vlastní data nemáme).

## Neověřeno

Rok aktuální jarní mozaiky; skutečná jména služeb s tokenem (GeoDanmark WFS na Dataforsyningen); cesty k ortofotu na
novém Datafordeleru; podmínky uživatelského účtu Dataforsyningen; licence kodaňských vrstev `vejkant`, `bygning`,
`parkering_areal` (Bára je 24. 11. 2026 přesto použila); specifikace GeoDanmark 6 (co přesně je `vejkant`); Odense, Aalborg; hranice GISCO DK.
