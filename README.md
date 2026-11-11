# Profily ulic

Příčné profily českých ulic na jedno kliknutí. Klikněte v mapě na ulici (nebo ji najděte podle adresy) a aplikace
z technické mapy (šířky ploch) a z OpenStreetMap (pruhy, tramvaje, cyklopruhy, parkování, stromy, mobiliář) sestaví
profil od fasády k fasádě. Profil pak můžete upravit, porovnat stav s návrhem, vyexportovat jako SVG nebo PNG,
uložit jako JSON a sdílet odkazem.

**Aplikace běží na https://barasoukup.github.io/profily-ulic/**

Na konkrétní řez se dá odkázat, například
[Poděbradská](https://barasoukup.github.io/profily-ulic/#rez=50.103357,14.517910,-99,22.0,22.0).

## Města a zdroje

Je to jedna stránka pro celou Českou republiku. Město se pozná podle místa řezu a s ním se mění zdroje dat,
ilustrace i texty. Staré adresy `/brno/`, `/jihlava/`… přesměrují na hlavní stránku i s řezem.

- **Praha:** technická mapa IPR (MTVU, koleje, bariéry, body), úseky parkování TSK, otevřená data Geoportálu
  Praha (stromy, třídy ulic), podlažnosti a vývoj zástavby IPR.
- **Města s vlastními zdroji:** Brno, Jihlava, Most, Opava, Plzeň, Ostrava, Frýdek-Místek, Karviná, Třebíč,
  Přerov a Ústí nad Labem (technické mapy, pasporty komunikací nebo parkovací místa měst).
- **Zbytek Česka** (i Pardubice): celostátní technická mapa ČÚZK (v devíti krajích jako polygony z WFS kraje),
  budovy a parcely RÚIAN.
- Všude: OpenStreetMap z vlastních dlaždic celé ČR, ortofoto ČÚZK.
- Vlastní ilustrace vozidel MHD má Praha, Brno, Jihlava, Most, Opava, Pardubice, Plzeň, Ostrava a Ústí,
  a navíc Olomouc, Liberec, Hradec Králové, České Budějovice a Zlín (ty berou data jako zbytek Česka).

## Spuštění u sebe

```bash
node pilot/server.mjs
```

Pak otevřete http://localhost:5173. Potřebujete Node.js 22 nebo novější a připojení k internetu.
Lokální server ukládá odpovědi IPR do cache, takže se místa, kde už jste byli, načítají hned.
Dlaždice OSM celé ČR si nejdřív vyrobte z výřezu Geofabrik (potřebuje ogr2ogr z GDAL nebo QGIS):

```bash
mkdir -p data/osm && curl -fL -o data/osm/cz.osm.pbf https://download.geofabrik.de/europe/czech-republic-latest.osm.pbf
NAME=cz tools/build_osm_data.sh data/osm/cz.osm.pbf pilot/data/osm-tiles
```

a hranice zón placeného stání v Praze (jednou, soubor `pilot/data/zps.json`):

```bash
node tools/build_zps.mjs
```

Další statická data (otevřená data Prahy, vývoj zástavby, parkování v Brně, zóny v Plzni) popisuje
[pilot/README.md](pilot/README.md). Bez nich aplikace běží taky, jen víc odhaduje.

Server poslouchá jen na tomto počítači. Pro vyzkoušení z telefonu ve stejné síti ho spusťte s
`HOST=0.0.0.0 node pilot/server.mjs`.

Testy (syntaxe všech skriptů a testy v `tests/`; běží i před každým nasazením):

```bash
npm test
```

## Jak to funguje

- Řez se vede kolmo na osu ulice z OSM, mimo křižovatky a přechody; u ulice ze dvou jednosměrných
  vozovek se posune doprostřed.
- Šířky ploch (vozovka, chodník, zeleň, tramvajové těleso, parkoviště…) se měří z technické mapy města
  nebo kraje.
- Vozovka se rozdělí na pruhy podle tagů OSM a os kolejí; parkování je z dat měst (v Praze úseky TSK) a z OSM.
- Co data neznají, se doplní jako odhad (krajnice / šrafy, podélné stání podle zákona) a v profilu je to
  označené šedým proužkem.
- Pod profilem je řádek dopravních značek podle dat; v Návrhu se dají měnit.

Podrobný popis pravidel a zdrojů je v [pilot/README.md](pilot/README.md), vyhodnocení na 100 náhodných řezech
v [evaluation/ZPRAVA.md](evaluation/ZPRAVA.md) (další města v `evaluation/<město>/ZPRAVA.md`).

## Struktura

- `pilot/public/` – aplikace (bez sestavování, ES moduly; `derive.js` skládá profil, `city.js` města)
- `pilot/public/towns/` – zdroje dat jednotlivých měst a zbytku Česka
- `pilot/server.mjs` – lokální server s cache dotazů na IPR
- `pilot/public/queries.js` – co se ptá IPR (vrstvy, pole), společné pro server i web
- `pilot/navrhy-ilustraci/` – nepoužívané varianty pražských ilustrací (nenasazují se)
- `tests/` – testy pravidel, převodu do Streetmixu, dotazů, zdrojů měst a odhadu profilu z OSM
- `tools/` – výroba dlaždic OSM, statických dat a pomocné skripty
- `evaluation/` – vyhodnocení řezů nad ortofotem a A/B testy zdrojů
- `logging/` – záznam řezů (Cloudflare Worker a D1)
- `.github/workflows/pages.yml` – nasazení na GitHub Pages (dlaždice OSM a statická data se vyrobí při nasazení)

## Licence a zdroje

- Kód: MIT, © 2026 Bára Soukupová ([LICENSE](LICENSE)).
- Ilustrace: © [Streetmix](https://github.com/streetmix/streetmix), CC BY-SA 4.0
  (`pilot/public/streetmix/LICENSE`). Ilustrace měst (`pilot/public/praha/`, `brno/`…): MIT jako kód.
- IPR Praha: technická mapa, MTVU a mapové podklady (povinně zveřejňovaná data); podlažnosti a vývoj
  zástavby 1840–2010 (CC BY 4.0). Úseky parkování © TSK hl. m. Prahy, otevřená data Geoportálu Praha
  (CC BY 4.0).
- Technické mapy a služby měst a krajů, IS DMVS ČÚZK: čtou se při kliknutí, nešíří se. RÚIAN a ortofoto
  © ČÚZK (CC BY 4.0). Panorama z ulice © Seznam.cz, a.s. / Mapy.com (přes jejich API).
- Data OpenStreetMap: © přispěvatelé OpenStreetMap, ODbL 1.0. Dlaždice OSM na webu jsou z nich
  odvozená databáze pod ODbL.
- Písmo Inter (SIL OFL 1.1) a Leaflet (BSD-2-Clause) leží na našem webu.
- Aplikace zaznamenává jen řezy a použité funkce, bez IP adres a cookies
  ([logging/README.md](logging/README.md#soukromí)).

Podrobnosti jsou v [LICENCE-A-ZDROJE.md](LICENCE-A-ZDROJE.md).
