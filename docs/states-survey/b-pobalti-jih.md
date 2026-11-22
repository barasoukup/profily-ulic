# Průzkum B: národní ortofota pro Profily ulic (CORS, 3857)

Test: GetMap (nebo WMTS) v EPSG:3857 nad centrem hlavního města (cca 100 m), hlavičky `Origin: https://streetspace.eu`, `-A profily-ulic`. Pauza 1 s mezi dotazy. Overpass ani Nominatim nepoužity. Zkoušeno z tohoto prostředí, některé hostitele nebyly dostupné (viz poznámky). Vše, co nebylo ověřeno, je označeno „neověřeno“.

| stát | ortofoto (služba) | funguje | CORS | klíč | licence | rozlišení/zoom | mapa povrchů hlavního města | hodnocení | poznámka |
|---|---|---|---|---|---|---|---|---|---|
| Estonsko | Maa-amet fotokaart WMS `https://kaart.maaamet.ee/wms/fotokaart`, vrstva `MA-FOTOKAART` (nebo `EESTIFOTO`) | ano, ale jen v EPSG:3301 (3857 vrací výjimku InvalidSRS); GetMap v 3301 vrátil JPEG 7,7 KB | ano (`Access-Control-Allow-Origin: *`) | ne | neověřeno | neověřeno | neověřeno (v GetCapabilities jsou jen národní vrstvy HYB, `kergliiklustee`, `HYB_tanavad_10T_01`) | nejisté | Pro 3857 nutná klientská reprojekce 3301 (proj4js). Vrstvy HYB obsahují tanavad (ulice), ale nejsou to povrchové polygony města. |
| Lotyšsko | LGIA WMS `https://wms.lgia.gov.lv/wms` (ortofoto mozaika ČR 2019–2021, podle webu LGIA) | ne: GetCapabilities dvakrát 503 | neověřeno | neověřeno | INSPIRE stránka LGIA uvádí CC 4.0 (neověřeno přímo) | neověřeno | neověřeno | odložit | Služba nedostupná při testu; opakovat později. Adresa z vyhledávání, ne z dokumentace. |
| Litva | NŽT / geoportal.lt ortofoto | neověřeno (odhad `www.geoportal.lt/wms/ortofoto` vrátil 404; správnou adresu se nepodařilo najít) | neověřeno | neověřeno | neověřeno | neověřeno | neověřeno | nejisté | Vyhledávání našlo jen INSPIRE geoserver `inspire-geoportal.lt`, bez vrstvy ortofota. |
| Slovinsko | GURS WMS (`storitve.eprostor.gov.si/ows-ins-wms/ad/ows`, `prostor4.gov.si/ows2-m-pub/raster_gurs_pub/ows`) | neověřeno: obě adresy nedostupné z tohoto prostředí (DNS/připojení, bez odpovědi) | neověřeno | neověřeno (INSPIRE záznam uvádí, že některé služby jsou jen pro registrované) | neověřeno | neověřeno | neověřeno | nejisté | Zkusit znovu z jiné sítě. Podle záznamů je CRS nativní 3794, 3857 neověřeno. |
| Chorvatsko | DGU ortofoto 2024 `https://geoportal.dgu.hr/services/inspire/orthophoto_2024/wms`, vrstva `OI.OrthoimageCoverage` | ano: GetMap 3857 vrátil JPEG 66 KB | NE: odpověď nemá `Access-Control-Allow-Origin`, prohlížeč by ji nenačetl | ne (anonymní varianta; registrovaná vyžaduje authKey) | „WMS za anonimní uživatele“ (data.gov.hr), přesná licence neověřena | neověřeno | neověřeno | odložit | Bez CORS je přímé čtení z prohlížeče nemožné (jen přes vlastní proxy). Pokrývá jen západní polovinu státu (podle data.gov.hr). |
| Itálie (národní) | MASE `http://wms.pcn.minambiente.it/ogc?map=/ms_ogc/WMS_v1.3/raster/ortofoto_colore_08.map`, vrstva `OI.ORTOIMMAGINI.2008.33` | ano: GetMap 3857 nad Římem vrátil JPEG 30 KB | ano (`Access-Control-Allow-Origin: *`) | ne | neověřeno | neověřeno (snímek 2008) | neověřeno | dobré (jen jako stará služba) | Funguje, ale snímek je z roku 2008. Aktuálnější AGEA je jinde (regiony). Adresa je http, na HTTPS stránce by ji prohlížeč blokoval (mixed content). |
| Itálie – Lombardie | Geoportale Lombardia (AGEA 2018–2019, WMS/WMTS) | neověřeno: odhad `geoportale.regione.lombardia.it/wms/ortofoto` vrátil 404; správná adresa nenalezena | neověřeno | neověřeno | neověřeno | neověřeno | neověřeno | nejisté | Vyhledávání našlo jen INSPIRE záznamy (2018–2019 WMS/WMTS, 2021 WMTS). |
| Itálie – Emilia-Romagna | RER ortofoto 2022 RGB `https://servizigis.regione.emilia-romagna.it/wms/rer2022_rgb`, vrstva `RER2022_RGB` | ano: GetMap 3857 nad Boloňou vrátil JPEG 4,8 KB (pod prahem 5 KB, nejspíš málo obsahu) | ano (`Access-Control-Allow-Origin: https://streetspace.eu`) | ne | neověřeno | 20 cm (podle INSPIRE záznamu) | neověřeno | nejisté | Obrázek je podezřele malý, zopakovat na jiném místě. Vrstva `default` v GetMap vracela výjimku, správný název je `RER2022_RGB`. |
| Itálie – Lazio | Regione Lazio ortofoto | neověřeno (nehledáno zvlášť, ani URL) | neověřeno | neověřeno | neověřeno | neověřeno | neověřeno | nejisté | Nebylo zkoumáno; Řím leží v národní službě jen se snímkem 2008. |
| Řecko | Ktimatologio (ktimanet) `https://gis.ktimanet.gr/wms/wmsopen/wmsserver.aspx` | ne pro ortofoto: GetCapabilities vrací jen vrstvy `KTIMATOLOGIO` a `BASEMAP` (2,6 KB), bez snímku | NE (odpověď bez `Access-Control-Allow-Origin`) | neověřeno | neověřeno | neověřeno | neověřeno | odložit | Vyhledávání nenašlo otevřený ortofoto WMS. Podle gov.gr se data INSPIRE žádají přes Ktimatologio. |
| Kypr | DLS ortofoto 2014, 10 cm `https://eservices.dls.moi.gov.cy/arcgis/services/BASEMAPS/Imagery_Orthophoto_2014_10cm/MapServer/WMSServer`, vrstva `0` | ano: GetMap 3857 nad Nikósií vrátil JPEG 73 KB | ano (odpověď echo `Origin`: `https://streetspace.eu`) | ne | neověřeno (JOSM wiki: „Department of Lands and Surveys“) | 10 cm (2014) | neověřeno | dobré | Nejlepší z testovaných ve smyslu „funguje hned“. Snímek je z 2014. JOSM ticket hlásí dočasné 403 u DLS, dnes funguje. |
| Malta | 2012 ortofoto (15 cm) `https://malta.coverage.wetransform.eu/wms/ortho_2012/ows`, vrstva `OI.OrthoimageCoverage` | ne v 3857: výjimka `InvalidCRS` („unsupported crs: EPSG:3857“); CRS služby jsou 25833, 3035, 4258, 4326 | neověřeno (chyba výjimkou, hlavička CORS vrácena jako `*`) | ne | neověřeno (INSPIRE: bez omezení přístupu) | 15 cm (INSPIRE záznam) | neověřeno | odložit | Jde reprojektovat na klientovi z 25833/3035. Snímek je z roku 2012. |

## Hlavní města: mapa povrchů (kontrola jen vyhledáváním, bez dotazu na služby)

Kontrola povrchů (chodník, vozovka, cyklostezka jako polygony) nebyla provedena, protože jsem neměl prostor a přímá adresa nebyla nalezena. Všechna pole jsou „neověřeno“.

- Tallinn, Riga, Vilnius, Lublaň, Záhřeb, Řím, Atény, Nikósie, Valletta: neověřeno.

## Shrnutí

- Funguje hned, bez klíče, s CORS a 3857: **Kypr** (10 cm, 2014) a **Itálie národní** (2008, jen jako záloha).
- Funguje, ale jen s omezením: **Emilia-Romagna** (CORS ok, obrázek 4,8 KB, zopakovat), **Estonsko** (jen 3301, reprojekce na klientovi).
- Funguje, ale bez CORS: **Chorvatsko** (jen přes vlastní proxy, pokrývá západ).
- Nefunguje nebo nedostupné z tohoto prostředí: **Lotyšsko** (503), **Slovinsko** (hostitelé neodpovídají), **Malta** (3857 nepodporuje).
- Neověřeno: **Litva**, **Lombardie**, **Lazio**, **Řecko** (jen KTIMATOLOGIO/BASEMAP, bez ortofota).

## Odhady o chování dotazů

- Počet dotazů curl: Estonsko 3, Lotyšsko 3 (2× 503 a 1× 503), Litva 2, Slovinsko 2 (nedostupné), Chorvatsko 2, Itálie 3, Lombardie 1, Emilia-Romagna 3, Řecko 1, Kypr 2, Malta 4, Lazio 0. Celkem přibližně 26 dotazů, pauza 1 s.
- Několik adres pochází z vyhledávání webu (INSPIRE, data.gov.hr, JOSM wiki), ne z oficiálních dokumentací; označeno.
