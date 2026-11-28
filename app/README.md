# Profily ulic – aplikace

Kliknete na ulici v mapě (nebo ji najdete podle adresy) a aplikace z technické mapy a z OSM sestaví příčný profil
od fasády k fasádě. Ten pak upravujete: šířky tažením, typy, pořadí, přidávání, mazání a slučování částí, dopravní
značky, stav / návrh / porovnání, export SVG a PNG, uložení a načtení profilu (JSON), sdílení návrhu odkazem.

## Spuštění

```bash
node app/server.mjs
```

Pak otevřete http://localhost:5173. Potřebujete Node.js 22 nebo novější a připojení
k internetu (podkladové mapy, technické mapy IPR, měst a ČÚZK). Rozpracovaný profil si prohlížeč
pamatuje i po zavření. Server poslouchá jen na tomto počítači (`HOST=0.0.0.0` ho otevře místní síti).

Statická data, která web dostane při nasazení, si lokálně vyrobíte takto (bez nich aplikace běží, jen víc odhaduje):

| Data | Příkaz | Kam |
|---|---|---|
| dlaždice OSM celé ČR | `NAME=cz tools/build_osm_data.sh data/osm/cz.osm.pbf app/data/osm-tiles` | `app/data/osm-tiles` |
| hranice zón placeného stání v Praze | `node tools/build_zps.mjs` | `app/data/zps.json` |
| otevřená data Prahy (stromy, zákaz stání, třídy ulic) | `node tools/build_praha_opendata.mjs` | `app/data/praha/opendata` |
| vývoj zástavby Prahy | `node tools/build_built_up_age.mjs` | `app/data/built-up-age` |
| placené stání v Brně | `node tools/build_parking_brno.mjs app/data/brno` | `app/data/brno/parking` |
| zóny placeného stání v Plzni | `node tools/build_zones_plzen.mjs` | `app/data/plzen/zones.json` |

Server je vydává pod `data/…`, stejně jako web.

## Obsah dokumentace

Popis aplikace je rozdělený podle témat. Pravidla pro práci s kódem a data jsou v `CLAUDE.md` v kořeni repa.

- Odvození profilu (jak se profil skládá): [docs/profile-derivation.md](../docs/profile-derivation.md)
- Stav, Návrh a úpravy: [docs/editing.md](../docs/editing.md); hospodaření s vodou: [docs/water.md](../docs/water.md)
- Státy, města a zdroje: [docs/countries/README.md](../docs/countries/README.md)
- Dlaždice OSM: [docs/osm.md](../docs/osm.md); parkování: [docs/parking.md](../docs/parking.md); budovy: [docs/buildings.md](../docs/buildings.md)
- Dopravní značky: [docs/signs.md](../docs/signs.md); mapa: [docs/map.md](../docs/map.md); železnice: [docs/rail.md](../docs/rail.md)
- Test nového zdroje (A/B) a měření: [docs/measuring.md](../docs/measuring.md)
- Export: [docs/export.md](../docs/export.md); jazyky: [docs/languages.md](../docs/languages.md); záznam řezů: [docs/logging.md](../docs/logging.md)
- Nasazení: [docs/deployment.md](../docs/deployment.md); licence a uvedení zdrojů: [docs/licences.md](../docs/licences.md)
