# DTM krajů z WFS místo obrázků DMVS, ortofoto krajů (10. 11. 2026)

**Výsledek: připojeno.** V devíti krajích s DTM od T-MAPY bere `dmvs.js` plochy jako polygony z WFS kraje
(`pilot/public/dtmwfs.js`), jinde a při chybě zůstávají obrázky DMVS. Ploty a zdi z WFS připojené nejsou.
Ortofoto krajů nic nového nepřineslo.

## WFS podle krajů

Server T-MAPY (MapServer) odpovídá WFS 2.0 na stejné adrese jako WMS: `…/mapservice/v1/wms/dtm_zps_plochy_bar`
(78 typů ploch `ms:zps_p_*`) a `…/dtm_zps_linie_body` (linie a body `ms:zps_l_*`, `ms:zps_b_*`). GML 3.2, S-JTSK
(`urn:ogc:def:crs:EPSG::5514`, osa x první), bbox i ve 4326. CORS `*`, bez klíče, `CountDefault` 5000, stránkování.
`AccessConstraints` prázdné, podmínky nikde. Skupinové vrstvy (`ms:dopr_st`, `ms:bud`) chybou, jednotlivé typy jdou
v jednom dotazu čárkami. Každý server má jen svůj kraj.

| Kraj | Adresa | Stav dat (vzorky) |
|---|---|---|
| Jihočeský | `jck.krajdtm.cz` | Budějovice jako DMVS (stejné díry) |
| Pardubický | `pak.krajdtm.cz` | Pardubice plné |
| Vysočina | `vys.krajdtm.cz` | Jihlava prázdná (město má svá data), Třebíč ano |
| Moravskoslezský | `msk.krajdtm.cz` | Ostrava a Karviná skoro prázdné, Opava málo |
| Královéhradecký | `khk.krajdtm.cz` | Hradec plný |
| Jihomoravský | `dtm.jmk.cz` | střed Brna prázdný (Brno má svá data), okolí ano |
| Liberecký | `dtm.kraj-lbc.cz` | Liberec plný; občas se zasekne na 5 s |
| Karlovarský | `dtm.kr-karlovarsky.cz` | Karlovy Vary plné |
| Zlínský | `dtm.zlinskykraj.cz` | Zlín jen budovy |
| Praha, Středočeský | IPR (`map.dtm-praha-sck.cz`, ArcGIS s tokenem) | Praha přes `gs-pub.praha.eu` už máme; Středočeský bez veřejného WFS |
| Plzeňský | `dtm.plzensky-kraj.cz` (ArcGIS, 401) | bez veřejné služby |
| Ústecký | `dtm.kr-ustecky.cz` (SPSLite) | bez veřejné služby |
| Olomoucký | `dtm.olkraj.cz` (ArcGIS Hub), `gispub.kr-olomoucky.cz/pub/.../DTM` jen stav dat | bez veřejné služby |
| DMVS ČÚZK | `dmvs.cuzk.gov.cz` | jen WMS; jediné WFS `api/wfs/evidence-dmvs` (části DTI, území editace), ZPS ne |

## A/B (`variants/dtm-wfs.mjs`, `CACHE=disk`, ČÚZK i kraje přes `polite.mjs`)

137 řezů: Budějovice 47 (lichá čísla), Pardubice, Hradec, Liberec po 30. Stejné části a okraje 124, šířky se liší
v průměru o 0,06–0,18 m (obrázek 0,1 m/px a zjednodušení 0,2 m). Z 15 řezů s jinými částmi nad ortofotem:
**lepší WFS 6** (Zlatý most místo „Voda“, zeleň u silnic, kterou obrázek vynechal, čistší střední pás), **lepší
obrázky 3** (úzké proužky 0,3 m mezi polygony: pruh 0,30 m v Hradci č. 7, zeleň 0,35 odhad v Liberci č. 1;
vozovka vychýlená v Hradci č. 19), stejně 6. Do WFS jdou jen plochy, které řez protíná, jako u obrázků (jinak by
RÚIAN pod nenakreslenou ulicí hlásil zeleň).

Čas ploch na kliknutí (`cas_dtm.mjs`, 20 řezů, souběžně jako prohlížeč, bez cache): **obrázky medián 1 357 ms
(7 dotazů na ČÚZK), WFS 648 ms (1 dotaz)**; Pardubice 1 339 / 451, Hradec 1 239 / 648, Liberec 2 469 / 797,
Budějovice 1 102 / 438. Dvakrát z 20 trvalo WFS přes 2 s; když WFS do 1,5 s neodpoví, ptá se `dmvs.js` souběžně
i obrázků a bere první dobrou odpověď. RÚIAN (2 dotazy) je u obou stejný.

Ploty, zdi, zábradlí a svodidla z WFS linií (`variants/dtm-wfs-linie.mjs`, 90 řezů, 17 jiných): svodidla sedí
(Pardubice č. 1), ale ploty a zdi uvnitř ulice uříznou profil (Hradec č. 8 bez chodníku a cyklostezky za
svodidlem, Liberec č. 22 bez 15 m náměstí, Hradec č. 29): **nepřipojeno**.

## Ortofoto krajů

- Jihočeský kraj `gis.kraj-jihocesky.cz/arcgis/rest/services/podkladove/`: `orto_2025_CBUD_WM` (Budějovice, Web
  Mercator, dlaždice do 0,02 m/px), `orto2003`–`orto2025` (celý kraj, S-JTSK, copyright ČÚZK), `orto_CB_WM`. CORS `*`.
  Na dvou místech v Budějovicích je `orto_2025_CBUD_WM` **stejný snímek jako ortofoto ČÚZK** (titíž chodci na
  náměstí, jen jiné barvy), tedy let ČÚZK 2025, ne ostřejší ani novější. Nepřipojeno.
- Kraje s tramvajemi (Plzeňský, Moravskoslezský, Olomoucký, Liberecký, Ústecký, Jihomoravský) vlastní veřejné
  ortofoto nemají (MSK a LBK bez REST služeb, Olomoucký jen RÚIAN a stav DTM). Ortofota mají města: Plzeň 2024 5 cm
  (starší než ČÚZK 2025, už v mapě), Most 2025 = ČÚZK, Brno 2025 (už v mapě). Pro `ortho.js` tedy beze změny.
