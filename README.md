# Profily ulic

Příčné profily pražských ulic na jedno kliknutí. Klikněte v mapě na ulici a aplikace z technické
mapy IPR Praha (šířky ploch) a z OpenStreetMap (pruhy, tramvaje, cyklopruhy, parkování, stromy,
mobiliář) sestaví profil od fasády k fasádě. Profil pak můžete upravit, porovnat stav s návrhem,
vyexportovat jako SVG nebo PNG, uložit jako JSON nebo otevřít ve [Streetmixu](https://streetmix.net).

**Aplikace běží na https://barasoukup.github.io/profily-ulic/**

Na konkrétní řez se dá odkázat, například
[Poděbradská](https://barasoukup.github.io/profily-ulic/#rez=50.103357,14.517910,-99,22.0,22.0).

## Spuštění u sebe

```bash
node pilot/server.mjs
```

Pak otevřete http://localhost:5173. Potřebujete Node.js 22 nebo novější a připojení k internetu.
Lokální server ukládá odpovědi IPR do cache, takže se místa, kde už jste byli, načítají hned.
Dlaždice OSM si nejdřív vyrobte (stáhne výřez BBBike a potřebuje ogr2ogr z GDAL nebo QGIS):

```bash
tools/build_osm_data.sh
```

a hranice zón placeného stání (jednou, soubor `pilot/data/zps.json`):

```bash
node tools/build_zps.mjs
```

## Jak to funguje

- Řez se vede kolmo na osu ulice z OSM, mimo křižovatky a přechody; u ulice ze dvou jednosměrných
  vozovek se posune doprostřed.
- Šířky ploch (vozovka, chodník, zeleň, tramvajové těleso, parkoviště…) se měří z Mapy technického
  využití území (MTVU) IPR Praha.
- Vozovka se rozdělí na pruhy podle tagů OSM a os kolejí z technické mapy; úseky parkování v zónách
  placeného stání jsou z TSK.
- Co data neznají, se doplní jako odhad (krajnice / šrafy, podélné stání v místních ulicích) a
  v profilu je to označené červeným proužkem.

Podrobný popis pravidel je v [pilot/README.md](pilot/README.md), vyhodnocení na 100 náhodných řezech
v [evaluation/ZPRAVA.md](evaluation/ZPRAVA.md).

## Struktura

- `pilot/public/` – aplikace (bez sestavování, ES moduly; `derive.js` skládá profil)
- `pilot/server.mjs` – lokální server s cache dotazů na IPR
- `tools/` – výroba dlaždic OSM a pomocné skripty
- `evaluation/` – vyhodnocení na 100 náhodných řezech nad ortofotem
- `.github/workflows/pages.yml` – nasazení na GitHub Pages (dlaždice OSM se vyrobí při nasazení)

## Licence a zdroje

- Kód: MIT, © 2026 Bára Soukupová ([LICENSE](LICENSE)).
- Ilustrace: © [Streetmix](https://github.com/streetmix/streetmix), CC BY-SA 4.0
  (`pilot/public/streetmix/LICENSE`).
- Technická mapa, MTVU, mapové podklady a ortofoto: © IPR Praha (CC BY 4.0); úseky parkování © TSK
  hl. m. Prahy; ortofoto © ČÚZK.
- Data OpenStreetMap: © přispěvatelé OpenStreetMap, ODbL 1.0. Dlaždice OSM na webu jsou z nich
  odvozená databáze pod ODbL.

Podrobnosti jsou v [LICENCE-A-ZDROJE.md](LICENCE-A-ZDROJE.md).
