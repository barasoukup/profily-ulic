# Povrchy ulic v evropských státech: mezery (průzkum B, 24. 11. 2026)

Cíl: najít otevřené mapy povrchů ulic (polygony obrub: vozovka, chodník, cyklistická cesta, stání, zeleň) pro velká města
a regiony ve státech, které aplikace už pokrývá, a kde zatím žádnou mapu povrchů nepoužíváme. Dotazy: curl, User-Agent
`profily-ulic`, Origin `https://streetspace.eu`, pauzy 1 s, asi 25 požadavků dnes. Overpass ani Nominatim nepoužity. Neoslovován
žádný úřad ani město. Co je převzato z dřívějších `evaluation/<stát>/ZDROJE.md` a nebylo dnes znovu ověřeno, je to uvedeno.

Značení: **ověřeno dnes** = odpověď přišla a byla přečtena dnes; **z ZDROJE** = převzato z dřívějšího průzkumu, dnes neznovu;
**neověřeno** = jen vyhledávání nebo katalog, bez dotazu na službu.

Poznámka k rozsahu: u českých měst mimo Prahu, Brno, Ostravu, Ústí a další pasporty je povrch už dnes z celostátní
technické mapy ČÚZK (DMVS, DTM), takže dalším městským zdrojem se tam nevyplácí zabývat.

---

## 1. Belgie

| Město / region | Zdroj | URL | Obsah | CORS | Klíč | Licence | Použitelné |
|---|---|---|---|---|---|---|---|
| Flandry (celý region, vč. Antverpy, Gentu) | GRB, WFS, vrstva `GRB:WBN` (vozovka) | `https://geo.api.vlaanderen.be/GRB/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=GRB:WBN&bbox=…` | **ověřeno dnes**: 101 polygonů v bbox Antverpy (typ 2 = 71, typ 1 = 30) | `*` (ověřeno dnes) | ne | Vlaams open data, podmínky neověřeno (doporučuji přečíst licenci GRB) | **ano**; použít plochy vozovky, aplikace dnes má jen čáry WGO |
| Flandry, chodníky a zóny pro chodce | GRB `GRB:WGO`, `GRB:WCZ` | stejná služba | neověřeno (dnes jen WBN) | `*` (z ZDROJE) | ne | – | s podmínkou: ověřit, zda jsou polygony |
| Valonsko | PICC „Voirie – Surface“ | `geoservices.wallonie.be` ArcGIS | z ZDROJE: plochy povrchů, dotaz na plochu | z ZDROJE: echo | ne | neuvedena | už napojeno jako čáry; plochy ověřit |
| Brusel | UrbIS vektor, parking.brussels | `geoservices-urbis.irisnet.be`, `data.parking.brussels` | z ZDROJE: UrbIS bez typů, parking 302 bez CORS | ne | ne | CC0 / Brussels ODL | ne |

## 2. Estonsko

| Město / region | Zdroj | URL | Obsah | CORS | Klíč | Licence | Použitelné |
|---|---|---|---|---|---|---|---|
| **Celé Estonsko** | ETAK (Eesti topograafia andmekogu), `etak:e_501_tee_a` (plochy cest) | `https://gsavalik.envir.ee/geoserver/etak/ows?service=WFS&version=2.0.0&request=GetFeature&typeNames=etak:e_501_tee_a&…` | **ověřeno dnes** v Tallinnu: 8 prvků, `tyyp_tekst` Liiklusala 5, Jalakäijate ala 2, Parkla 1. Liiklusala je často jeden slitý polygon celé sítě (z ZDROJE: 2,2 km², 120 děr) | `*` (ověřeno dnes) | ne | neuvedena přesně, neověřeno (ETAK je veřejná databáze, licenci ověřit) | **s podmínkou**: kryje celou zemi, ale nerozlišuje vozovku od chodníku; chodníky jen „pěší plocha“ |
| Tallinn | Městská základní mapa `tar_maakate` | ArcGIS, gis.tallinn.ee | plochy vozovek a chodníků | echo | ne | neuvedena | už použito v aplikaci |
| Tartu | Puhastusala (plochy úklidu) | z ZDROJE 2c | plochy úklidu | neověřeno dnes | ne | neověřeno | s podmínkou (je to úklid, ne povrch) |

## 3. Německo

| Město / region | Zdroj | URL | Obsah | CORS | Klíč | Licence | Použitelné |
|---|---|---|---|---|---|---|---|
| **Mnichov** | Open data Mnichova, `baut_strassenabschnitte_wu` (WFS GeoJSON) | `https://opendata.muenchen.de/…/baut_strassenabschnitte_wu` (odkaz z vyhledávání) | jen **osy** (linie) silniční sítě, bez rozdělení vozovky a chodníku | neověřeno dnes | ne | dl-by-de 2.0 (z katalogu) | **ne** (čáry, bez povrchů) |
| Mnichov | Pěší zóny 2024 (WFS Shape) | `opendata.muenchen.de/…/rad_rsp_fussg_zone_2024` | plochy pěších zón | neověřeno | ne | neověřeno | s podmínkou (jen jeden typ) |
| **Kolín nad Rýnem** | Strassen Köln (ckan.open.nrw.de) | `ckan.open.nrw.de/…/strassen-koln-k` | adresář názvů ulic, bez geometrie povrchů | – | ne | neověřeno | **ne** |
| Kolín | Flächennutzungsplan Web Verkehrsstraße | ckan.open.nrw.de | územní plán, ne stav povrchu | – | ne | neověřeno | ne |
| **Drážďany** | Straßenflächen Basisblockkarte, WFS (kommisdd.dresden.de NodeId=2003) | z ZDROJE: ozvěna CORS, bez omezení | polygony celého uličního prostoru, **jedna třída** (nedělí vozovku a chodník) | z ZDROJE: ozvěna (dnes 404 na moji adresu, nová adresa potřeba) | ne | z ZDROJE: bez omezení, neověřeno | **s podmínkou**: plochy ano, rozdělení ne; stejný typ jako dnes Berlín u ploch bez tříd |
| Brémy | DOP20 (ortofoto, ne povrch) | `geodienste.bremen.de/wms_dop20_2023` | ortofoto | `*` | ne | CC BY 4.0 | jen ortofoto, už v ZDROJE |
| München, Frankfurt, Düsseldorf, Stuttgart, Hannover, Nürnberg, Leipzig | vyhledávání jen pro Mnichov a Kolín | – | neověřeno | – | – | – | nepodařilo se najít veřejnou mapu povrchů (ZDROJE: „nehledáno“, dnes jen dvě města) |

## 4. Francie

| Město / region | Zdroj | URL | Obsah | CORS | Klíč | Licence | Použitelné |
|---|---|---|---|---|---|---|---|
| **Lyon / Grand Lyon** | WFS `metropole-de-lyon:pub_pcrs.limitevoiriepcrs` | `https://download.data.grandlyon.com/wfs/grandlyon?service=WFS&version=2.0.0&request=GetFeature&typeNames=metropole-de-lyon:pub_pcrs.limitevoiriepcrs&…` | **ověřeno dnes**: 20 prvků, **MultiLineString** (limit viru = obruba, linie). Plochy `ima…eptemprise` jen 1 polygon obrazu, ne povrch | `*` (ověřeno dnes, GetCapabilities i GetFeature) | ne | Grand Lyon open data, licence neověřeno dnes (z ZDROJE: Licence Ouverte) | **s podmínkou**: PCRS hranice je linie, slabší než polygon; kandidát pro kerby, ne pro plochy |
| Lyon | `pvo_patrimoine_voirie.pvochausseetrottoir` | stejná služba | osy (LineString) | `*` | ne | z ZDROJE | ne (osy) |
| Paříž | Plan de voirie (opendata.paris.fr) | Opendatasoft | polygony chodníků, vozovek, stání | `*` | ne | ODbL | už napojeno |
| Nantes, Bordeaux, Toulouse | Opendatasoft | z ZDROJE | osy nebo linie obrub | `*` | ne | ODbL/ODC | jen linie (slabší) |
| **Rennes** | PCRS (národní) | WMTS `data.geopf.fr`, vrstva `PCRS.LAMB93` | raster, ne polygony; místní PCRS Rennes nenalezen | neověřeno dnes | ne | Licence Ouverte (INSPIRE záznam) | **ne** (raster, a Rennes nenalezeno) |
| **Marseille** | vyhledávání | data.gouv.fr | nenalezena žádná vrstva vozovek ani chodníků (jen čtvrtě, Voi) | – | – | – | **ne** |
| Lille, Montpellier, Strasbourg | – | – | neověřeno (Strasbourg: z ZDROJE dataset chaussées nenalezen) | – | – | – | neověřeno |

## 5. Itálie

| Město / region | Zdroj | URL | Obsah | CORS | Klíč | Licence | Použitelné |
|---|---|---|---|---|---|---|---|
| **Lombardie** (DBT 1 : 1 000 ve městech) | ArcGIS `BaseMap/dbtr/MapServer`, vrstva `106` Area di circolazione veicolare | `https://www.cartografia.servizirl.it/arcgis2/rest/services/BaseMap/dbtr/MapServer/106/query?…` | **ověřeno dnes**: Milánské Duomo, počet 42 prvků (z ZDROJE: `ac_vei_zon` tronco carreggiata, `ac_vei_sed`, přesnost 1 : 1 000, vrstvy 104/105 pěší plochy). Ortofoto Lombardie je rozbité | **echo** (ověřeno dnes, ACAO = origin) | ne | neuvedena (z ZDROJE nic, ověřit) | **ano s podmínkou**: licence regionu neověřena; stát Itálie se dnes pouští jen tam, kde je otevřené ortofoto |
| **Milán** (DBT 2020 města) | soubor SHP, `gisportal.comune.milano.it/download/…/DBT_2020.zip` | z ZDROJE | celý DBT 1 : 1 000, 3–4/2020 | soubor, ne služba | ne | otevřená data Milána (CKAN, licence z katalogu) | **s podmínkou**: 597 MB, jen offline balík pro statický výřez, ne za klik |
| **Turín / Piemont** (BDTRE) | WFS `geoservices.csi.it/…/bdtre_viab` | z ZDROJE: `ac_vei` jeden obří polygon v Turíně | měřítko 1 : 10 000, prázdné chodníky | `*` | ne | neuvedena | **ne** (hrubé) |
| Bologna | Carta tecnica comunale (Opendatasoft) | z ZDROJE | plochy silnic (vozovky) | `*` | ne | CC BY 4.0 | už dnes za parametrem `?bologna=1`, vypnuto |
| Florencie | INSPIRE záznam `c_d612` | z ZDROJE | pěší plochy, adresa služby nenalezena | – | – | open data (záznam) | neověřeno |
| Řím | GeoRoma | z ZDROJE | nenalezeno | – | – | – | ne |

## 6. Španělsko

| Město / region | Zdroj | URL | Obsah | CORS | Klíč | Licence | Použitelné |
|---|---|---|---|---|---|---|---|
| **Katalánsko** (ICGC BT-5M, 1 : 5 000) | vektor jen k **stažení** po listech (SHP, DGN, E00); WMS jen obrázek, WMS BT-5M se ruší | `icgc.cat` (katalog downloads) | z vyhledávání: body, linie, polygony; obsah ulic neověřen | WFS nenalezen | ne | IDEC/ICGC, licence neověřena | **s podmínkou**: stáhnout a předzpracovat, ne WFS za klik |
| Barcelona | WMS `w133.bcn.cat/WMSVIALITAT` (z ZDROJE) | – | jen čáry komunikací | `*` | ne | – | ne |
| Madrid | CARTOBASE, sigma.madrid.es | z ZDROJE | jen `Map`, bez dotazů | – | – | – | ne |
| A Coruña | ArcGIS `INFRA_BTUC_VIARIO` | `ide.coruna.gal/…/MapServer` | viário (BTU, polygony silnic) | z ZDROJE: ověřeno dotazem na geometrii | ne | neuvedena (neověřeno) | **s podmínkou**: ověřit licenci a typ vrstvy (dnes nezkoušeno) |
| Valencie | geoportal.valencia.es | ArcGIS REST | neznámé | dnes **timeout** (curl 40 s, exit 28) | ne | – | **neověřeno** (z ZDROJE 2× nedostupné) |
| Málaga | `datosabiertos.malaga.eu` (GeoJSON obrys vozovky) | statický soubor | LineString obrysu vozovky | **bez CORS** (z ZDROJE) | ne | CC BY 4.0 | ne (čára, bez CORS) |
| Sevilla, Bilbao, Vitoria | – | – | neověřeno | – | – | – | neověřeno |

## 7. Portugalsko

| Město | Zdroj | Stav | Použitelné |
|---|---|---|---|
| Lisabon | geodados.cm-lisboa.pt, dados.cm-lisboa.pt | 403 Cloudflare (z ZDROJE); ArcGIS Online: jen obrysy budov | ne |
| Porto | mapas.cm-porto.pt | 500, blokace IP (z ZDROJE) | neověřeno |
| Madeira (Funchal) | IRIG CartTop NdD2 | WMS ano, WFS nefunguje; jen okraje, bez chodníků | ne |
| Oeiras | Cartografia 1:2 000 | planimetrie jen DWG | s podmínkou (konverze) |

## 8. Polsko

| Město / region | Zdroj | Stav | Použitelné |
|---|---|---|---|
| Celá země | BDOT10k (GUGiK, WMS) | **401**, neveřejné (z ZDROJE, dnes nezkoušeno znovu) | ne |
| Kraków | MJO (msip.um.krakow.pl) | už napojeno v aplikaci | – |
| Varšava | wms2.um.warszawa.pl, mapa.um.warszawa.pl | timeout (z ZDROJE); klíč u api | neověřeno |
| Wrocław | gis.um.wroc.pl | token (499) | ne |
| Gdańsk, Poznań | – | DNS / přesměrování | ne |

## 9. Rakousko

| Město / region | Zdroj | URL | Obsah | CORS | Klíč | Licence | Použitelné |
|---|---|---|---|---|---|---|---|
| Graz | INSPIRE / GIP Steiermark, Landesstraßen a kommunale Straßen | `inspire-geoportal` záznamy, `haleconnect.com` | **osy** silniční sítě | neověřeno dnes | ne | CC BY 4.0 (u Salcburku) | **ne** (osy) |
| Salcburk | GIP, subsítě 5002, 5014, 5004 | INSPIRE záznamy | cesty, lesní cesty (osy) | neověřeno | ne | CC BY 4.0 | ne |
| Linz, Innsbruck | – | nenalezeno | – | – | – | – | ne |
| Vídeň | FMZK | už napojeno v aplikaci | – | – | – | – | – |

## 10. Slovinsko

| Město | Zdroj | URL | Obsah | CORS | Klíč | Licence | Použitelné |
|---|---|---|---|---|---|---|---|
| **Maribor** | DRSI, skutečné využití veřejné silniční infrastruktury (`public:drsi_draba_oc`) | `https://prostor.maribor.si/ows/public/wfs` | z ZDROJE: 69 multipolygonů v centru, pole `vrsta_dr` (typ plochy) | z ZDROJE: `*`; **dnes**: 200, ale 0 prvků v mém bbox (nový test s jiným bbox nutný) | ne | neuvedena (neověřeno) | **s podmínkou**: nejlepší slovinský kandidát, ale dnes neověřeno, licence chybí |
| Maribor | chodníky, cyklostezky (`nig_cp_plocniki`) | stejná služba | osy, bez polygonů | – | ne | – | ne |
| Lublaň | ArcGIS Online MOL, GURS `POLIGONI_CESTE_G` | – | prázdné v centru | – | – | CC BY 4.0 | ne |

## 11. Dánsko

| Město | Zdroj | Stav | Použitelné |
|---|---|---|---|
| Kodaň, Aarhus | už napojeno (vejkant, parkering, BBR) | – | – |
| Odense, Aalborg | vlastní WFS nenalezena (z ZDROJE 2c) | nenalezeno | ne |
| Celé Dánsko | GeoDanmark (s klíčem) | už použito jako ortofoto | – |

## 12. Finsko

| Město | Zdroj | Stav | Použitelné |
|---|---|---|---|
| Helsinky | YLRE | už napojeno | – |
| Espoo | Ortokartta (WMS, ortofoto); plochy neověřeny | ortofoto CC BY 4.0 | jen ortofoto |
| Turku | ortofoto 2022 | jen ortofoto | ne |
| Tampere | mapa povrchů ulic bez CORS (z ZDROJE) | ne | ne |

## 13. Estonsko, Lotyšsko, Litva, Lucembursko, Slovensko, Česko

| Stát / město | Zdroj | Stav | Použitelné |
|---|---|---|---|
| Lucembursko | BD-L-TC (jen ke stažení), Ville de Luxembourg | opendata.vdl.lu blokováno WAF (z ZDROJE); plochy neověřeny | ne |
| Košice (SK) | GISPLAN (gisplan.kosice.sk) | plány registru chodníků, vozovek a cyklostezek (polygonová vrstva v zadání z roku 2025), zatím nezveřejněno; WFS nenalezen | neověřeno |
| Bratislava, Prešov, Žilina, B. Bystrica | pasporty (už napojeno) | – | – |
| Olomouc, Liberec, Hradec Králové, České Budějovice | DMVS ČÚZK | povrch už z celostátní technické mapy | netřeba městský zdroj |
| Lotyšsko, Litva | ZDROJE: jen ortofoto | ne | ne |

---

## Nejlepších 8 kandidátů (seřazeno)

1. **Flandry, GRB WBN (vozovka, polygony)**: ověřeno dnes (101 polygonů, CORS `*`), celý region, bez klíče; ve vyhledávání
   zvolit vrstvu vozovky místo jen čar WGO. Podmínka: ověřit licenci.
2. **Lombardie, DBT 1 : 1 000 (vrstva 106 a 104/105)**: ověřeno dnes (echo CORS, 42 prvků na Duomu), přesné plochy
   vozovky a pěších ploch ve městech. Podmínka: licence regionu a případně výřez, Lombardie je jinak mimo stát Itálie.
3. **Estonsko, ETAK (plochy cest celé země)**: ověřeno dnes (CORS `*`, Liiklusala, Jalakäijate ala, Parkla). Podmínka: slitý
   polygon bez rozdělení vozovky a chodníku; pro ostatní města Estonska použitelné jako doplněk ke ortofotu.
4. **Maribor, DRSI (skutečné využití silnic)**: z ZDROJE polygony s typem plochy; dnes 0 v bboxu, znovu ověřit, licence
   chybí.
5. **Drážďany, Straßenflächen Basisblockkarte**: z ZDROJE polygony celého prostoru ulice s CORS (ozvěna); bez rozdělení
   vozovky a chodníku, jen jako plocha ulice. Dnes nová adresa WFS (ta, kterou jsem zkusil, 404).
6. **Milán, DBT 2020 (SHP 597 MB)**: 1 : 1 000 celé město, kvalitní; jen jako předzpracovaný statický výřez
   (ne za klik), licence města z katalogu.
7. **Katalánsko, ICGC BT-5M (1 : 5 000)**: vektor s polygony po listech ke stažení; podmínka: předzpracování a licence.
8. **Lyon, PCRS hranice (linie)**: ověřeno dnes; slabší (čáry), ale oficiální PCRS hranic komunikací v metropoli.

## Co se nepodařilo ani nenašlo
- Mnichov, Kolín, Frankfurt, Düsseldorf, Stuttgart, Hannover, Nürnberg, Leipzig: žádná veřejná mapa povrchů (Mnichov jen osy).
- Marseille, Rennes (místní PCRS), Lille, Montpellier: nenalezeno.
- Valencie: server nedostupný (timeout), neověřeno.
- Košice: plánovaný registr, zatím bez veřejné služby.
- Linz, Innsbruck, Graz a Salcburk: jen osy silniční sítě.

## Poznámky k licencím a dotazům
- Licence z katalogů nejsou ověřeny u všech služeb; pokud je licence neuvedena, označeno jako neověřeno.
- Dotazy dnes: Lombardie (1), GRB (1), ETAK (1), Lyon (3), Maribor (1), Valencie (1, timeout), Dresden (1, 404),
  plus katalogová vyhledávání (7). Žádná data nebyla ukládána, žádné osobní údaje nebyly odeslány.
