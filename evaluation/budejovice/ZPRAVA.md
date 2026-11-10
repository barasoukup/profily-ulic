# České Budějovice: zdroje města a A/B s DTM ČÚZK (10. 11. 2026)

**Výsledek: nic nepřipojeno.** Město nezveřejňuje plochy ulic (vozovka, chodník) a to, co zveřejňuje, profil
nezlepší. Budějovice dál běží na celostátní DTM ČÚZK (`towns/cesko.js`) s vlastními vozidly (`artTown`).

## Co je k mání

| Služba | Adresa | Obsah | Geometrie, CRS | CORS | Licence, stáří |
|---|---|---|---|---|---|
| ArcGIS Online města (účet `reitmajerj_c_budejovice`, rozcestník `c-budejovice.cz/mapovy-rozcestnik`) | `services9.arcgis.com/8svDug0pVvBQzXWS/arcgis/rest/services` | asi 120 vrstev, z ulic: | Web Mercator (dotaz ve 4326 jde) | `*` | licence neuvedena, ani u položek |
| – pasport místních komunikací | `GL_MISTKOM/FeatureServer/0` | 5 257 os úseků, třída, směr, název; pole šířek (`SROAD`, `SWALK`) prázdná | čáry | ano | úpravy 2022 |
| – chodníky (zimní údržba) | `GL_CHODNIKY/0`, `GL_ZIMNI_UDRZBA_CHOD/0` | 2 874 os chodníků, bez šířky | čáry | ano | 2023 |
| – trávníky z pasportu zeleně | `GP_TRAVNIK/0` | 8 925 ploch trávníků (Melies) | polygony | ano | 2008–2018 |
| – úseky placeného stání | `GL_PARKUSEKY/0` | 858 úseků: ulice, strana L/P, tarif, délka v m; **bez způsobu stání**, čára kreslená schematicky u osy ulice nebo v pruhu stání | čáry | ano | aktualizace 2026 |
| – lavičky | `GB_PASPORT_LAVICKY/0` | 2 962 laviček se stavem | body | ano | 2026 |
| – zastávky a trasy MHD, stojany, koše, mosty, cyklotrasy, parcely KN, majetek | `Zastávky_MHD_ČB`, `GB_KOSE`, `GL_MOSTY`, `GL_CYKLO`, `KN`, `Majetková_mapa` | pro profil nic nového (OSM a RÚIAN to mají) | | ano | |
| GIS Jihočeského kraje | `gis.kraj-jihocesky.cz/arcgis/rest/services/podkladove/orto_2025_CBUD_WM` | **ortofoto Budějovic 2025** (dlaždice, Web Mercator), dále ortofota 2003–2025, ÚP | rastr | `*` | licence neuvedena |
| DTM kraje (portál `jck.krajdtm.cz`) | `jck.krajdtm.cz/mapservice/v1/wms/dtm_zps_plochy_bar` | stejné vrstvy jako DMVS, i **WFS 2.0 s geometrií** (GML, S-JTSK; JSON jen u části vrstev) | polygony | `*` | data DTM kraje |
| `mapy.c-budejovice.cz/amg/…` | | aplikace hlášení (ProBudějce, uzavírky), žádná mapová služba | | | |

Technickou mapu města ani pasport s plochami město veřejně nevydává (gis./geoportal.c-budejovice.cz neexistují,
otevřená data `data.c-budejovice.cz` jsou jen dokumenty). DTM kraje má v Budějovicích **stejné díry jako DMVS**
(obrázky obou služeb kolem Štítného vypadají stejně): chybí celé čtvrti východně od Lannovy
třídy (Štítného, Pražské předměstí-východ, Suché Vrbné, Nové Vráto) a jih (Rožnov, Nemanice, Mladé).

## A/B

Vzorek: 47 řezů (liché číslo z `data/samples.json`, všechny typy ulic). `CACHE=disk`, ČÚZK přes `polite.mjs`
(273 dotazů na ČÚZK, 409 na web celkem, další běhy z cache).

- **DTM ČÚZK nic nevrátila u 22 ze 47 řezů** (47 %), u dalších 4 je profil odhad z OSM. Štítného v aplikaci:
  „Technická mapa tu nic nevrátila, profil je odhad z OSM“ (3 m pruh).
- `variants/budejovice-mesto.mjs`: DTM + trávníky města do volných míst DTM + lavičky města. Liší se 2 řezy:
  č. 11 (lavička navíc) a č. 33 (trávník vpravo, ale i Neurčeno 2,15 m a zpevněná plocha v lese). **Lepší B 0,
  lepší A 0, obě 2.**
- `variants/budejovice-stani.mjs`: navíc úseky placeného stání jako pás 2 m kolem čáry. Liší se 4 řezy: k výše
  uvedeným č. 51 (zapne zónu, místo odhadnutého stání krajnice; obě nepřesné) a č. 71 (stání 3,15 m a pruh 3 m;
  auta stojí podélně, odhad 2 m sedí líp). **Lepší B 0, lepší A 1, obě 3.**
- Díry v DTM (22 řezů) neumí zaplnit žádný zdroj města: trávníky samy profil nedají a osy bez šířek také ne.

Verdikty: `data/ab-city-budejovice-*/review.md`, obrázky `png/`. Souhrn:
`CITY=budejovice VARIANTS=city,budejovice-mesto,budejovice-stani ITEMS=1 node evaluation/ab.mjs --summary`.

## Otevřené

- Licence: vrstvy města na ArcGIS Online ani služby kraje licenci neuvádějí; před případným použitím zeptat
  odbor informatiky / GIS magistrátu (správce účtu) a kraj.
- Plochy ulic by šlo dostat jen od města (pasport s plochami, pokud ho má) nebo až je kraj do DTM doplní.
- Ortofoto kraje 2025 je novější a ostřejší než ČÚZK; mohlo by sloužit jako podklad nebo ortofoto kontroly (`ortho`).
- WFS DTM kraje dává skutečné polygony místo čtení obrázků DMVS (jen Jihočeský kraj); stálo by za vlastní A/B.
