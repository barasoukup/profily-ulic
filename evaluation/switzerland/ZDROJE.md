# Švýcarsko a Lichtenštejnsko: zdroje dat (17. 11. 2026)

Průzkum agentem (Haiku) a ověření ručně (každá služba jedním malým dotazem, `Origin: https://streetspace.eu`).

## Zapojené

| zdroj | adresa | co dává | CORS | licence | v aplikaci |
|---|---|---|---|---|---|
| Hranice států swissBOUNDARIES3D (swisstopo) | `api3.geo.admin.ch/rest/services/api/MapServer/ch.swisstopo.swissboundaries3d-land-flaeche.fill/{CH,LI}` | přesné hranice CH (s dírami Büsingen a Campione) i LI | – (jen při stavbě) | otevřená data Konfederace, „© swisstopo“ | `tools/build_staty.mjs` → `staty.json`, zjednodušeno asi na 30 m |
| Ortofoto SWISSIMAGE 10 cm (swisstopo) | WMTS `wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg` | celé CH a LI a pás za hranicí; z20 všude ověřeno (Curych, Basilej, Ženeva, Lugano, Vaduz), z21 vrací 400 | `*` | otevřená data Konfederace (OGD, „© swisstopo“; WMTS Fees none, STAC uvádí „proprietary“ = vlastní podmínky OGD) | `lanes-ortho.js` `ch` (pruhy, obruby odhadu), podklad mapy (`app.js`), posuzovatel přesnosti |
| Úřední vyměřování, pokryv půdy (Amtliche Vermessung, Bodenbedeckung, DM.01 `LCSF`) | WFS `geodienste.ch/db/av_0/deu`, `TYPENAMES=ms:LCSF`, GeoJSON v EPSG:4326 | plochy všech kantonů, které ho sdílejí, i Lichtenštejnska (Kanton `FL`): `Strasse_Weg`, `Trottoir`, `Verkehrsinsel`, `Bahn`, `Gebaeude`, `uebrige_befestigte`, zeleň, voda | `*` | podle podmínek kantonů; provoz geodienste.ch (KGK): „fair use“ 10 dotazů WFS za minutu, webová aplikace do 10 000 uživatelů denně je fair use | `towns/switzerland.js`, `?av=0` vypne |
| Hledání Photon (komoot) | `photon.komoot.io/api/` | adresy a ulice z OSM, `lang=default` dává místní názvy (Genève, Lugano) | `*` | data OSM (ODbL), veřejný server pro rozumné použití | `search-photon.js` (`photon-ch`) |
| Dlaždice OSM | Geofabrik `europe/switzerland` (550 MB PBF) a `europe/liechtenstein` (4 MB) | ulice, domy, zeleň | – | ODbL | `tools/countries.mjs` `ch`, `li` (jen R2) |

Pokrytí úředního vyměřování na geodienste.ch (dotaz 100 m v centru, 17. 11. 2026): Curych (ZH) 198 ploch, Basilej (BS)
129, Bern (BE) 118, Ženeva (GE) 121, Lugano (TI) 190, St. Gallen (SG) 190, Vaduz (FL) 152; **Lausanne (VD) a Luzern (LU)
prázdné** (kantony ho volně nesdílejí). Tam zůstává odhad z SWISSIMAGE a OSM.

Druhy pokryvu → kódy MTVU (`AV_KIND`): `Strasse_Weg` 701 (vozovka i cesty, také pěšiny v parku: díly profilu nad ní
skládá OSM a ortofoto), `Trottoir` 702, `Verkehrsinsel` a `uebrige_befestigte` 1003, `Bahn` 705, `Gebaeude` 601 (budovy
z katastru místo OSM), zeleň 401, voda 501. Parkoviště samostatný druh nemá (je v `Strasse_Weg` nebo
`uebrige_befestigte`), stání proto dál dává OSM a odhad podle zákona.

## Zkoušené a nezapojené

| zdroj | proč ne |
|---|---|
| Kanton Curych WFS `maps.zh.ch/wfs/OGDZHWFS` (`ms:ogd-0401_arv_basis_avzh_bodenbedeckung_f`) | totéž úřední vyměřování jako geodienste.ch, jen jeden kanton |
| Basel-Stadt `wfs.geo.bs.ch` (`BS_Bodenbedeckungen_befestigt_*`) | totéž úřední vyměřování, jen EPSG:2056 |
| Město Curych (WFS geoportálu), Bern (map.bern.ch), Ticino (wms.geo.ti.ch), Ženeva SITG | 500, 403, 404 nebo jen SPA bez funkční cesty REST (agent, 17. 11.); úřední vyměřování přes geodienste.ch je stejně podrobné |
| geo.llv.li (Lichtenštejnsko) | WMS/WFS cesty 404; lichtenštejnské vyměřování je na geodienste.ch |
| api3.geo.admin.ch identify, úřední vyměřování | jen parcely (OpenData-AV), ne pokryv půdy |

## Co zbývá

- Licence po kantonech: geodienste.ch odkazuje na podmínky kantonů; kantony, jejichž data služba vydá bez přihlášení,
  je sdílejí veřejně, ale přesné znění (OGD s uvedením zdroje, nebo jen prohlížení) jsme po kantonech neprošli.
- Lausanne a Luzern bez vyměřování (kantony Vaud a Luzern); Vaud má vlastní geoportál (nezkoušeno).
- Zóny placeného stání (modrá zóna, Parkieren gegen Gebühr) a parkovací pole měst: nehledáno.
- Sítě: otevřené katastry vedení ve Švýcarsku nejsou (LKMap jen pro oprávněné).
