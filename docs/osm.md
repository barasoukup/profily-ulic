# Dlaždice OSM

Jak se OSM balí a čte (ČR, Slovensko a další státy), balíky na R2.

## Dlaždice OSM

Jedna sada dlaždic pro všechna města (`app/data/osm-tiles`, na webu `data/osm-tiles`) z výřezu Geofabrik Česká
republika:

```bash
mkdir -p data/osm && curl -fL -o data/osm/cz.osm.pbf https://download.geofabrik.de/europe/czech-republic-latest.osm.pbf
NAME=cz tools/build_osm_data.sh data/osm/cz.osm.pbf app/data/osm-tiles
```

Na Macu s QGIS přidejte před příkaz `OGR=/Applications/QGIS-final-4_2_3.app/Contents/MacOS/ogr2ogr
PROJ_DATA=…/Resources/qgis/proj GDAL_DATA=…/Resources/qgis/gdal`. Exporty ogr2ogr trvají asi 8 min, dlaždice
(`tools/build_osm_tiles.mjs`) se zapisují proudově za 1–2 min. Úsporný zápis (`app/public/osmtile.js`): jen značky,
které profil čte nebo by mohl (zóny, rychlosti, povrch, zastávky, přechody, druhy stromů, šířky, značky), chodníky
a pěšiny jen u ulic (v parcích, lesích a polích ne), bez polních cest; souřadnice jako rozdíly celých čísel (budovy
na 1 m); dlouhé cesty rozdělené po dlaždicích a v aplikaci zase spojené. Do 15. 11. 2026 asi 800 MB ve 245 000
dlaždicích.
Přesné výběry jsou ve skriptu `tools/build_osm_data.sh`: ulice, parkování, stromy, nástupiště, mobiliář, bariéry
(i obruby `barrier=kerb`), předzahrádky, budovy, zeleň, voda a plochy vozovek (`area:highway`). Overpass se nepoužívá.

Od 15. 11. 2026 (Bára) jsou v dlaždicích **všechny budovy**, nejen ty s výškou nebo počtem podlaží; ty bez výšky
jen do 60–90 m od silnice. V Česku zůstává hlavním zdrojem domů RÚIAN a technická mapa, OSM je tam kvůli místům
bez technické mapy (`ortho-osm.js`) a kvůli zahraničí. U budov se drží i `start_date`, `roof:shape`,
`building:material` a `building:min_level`. **Dům, který mapa nemá** (Bára 27. 11. 2026, Moravská v České Třebové: dům v OSM, v RÚIAN ne, technická mapa tam kreslila
zpevněnou plochu a profil pokračoval dvorem): kde mapa povrchů kreslí budovy a žádná z nich nepokrývá aspoň čtvrtinu budovy z OSM, kterou řez
protíná, vezme se budova z OSM (`derive.js` `withOsmBuildings`, v `classify` jako slabá budova: vyhraje nad volnou plochou, dvorem a
zelení, ne nad vozovkou, chodníkem, tramvají a stáním). Vzhled domu čte z OSM jako dosud (`buildingAt`). Úřední budova má přednost. `?off=osmdomy` vypne. **Zelené plochy** (`landuse` grass, meadow, village_green, flowerbed,
forest, orchard, recreation_ground; `leisure` park, garden; `natural` grass, grassland, scrub, wood, heath) a **voda,
zahrádky a hřbitovy** se rozřežou po dlaždicích (každá dlaždice má svůj kus, na 1 m) a drží se jen v dlaždicích, kudy
vede silnice. Pražský výřez: 88 → 116 MB (+32 %), celá ČR 0,84 → 1,39 GB (domy bez výšky 279 MB, zeleň 236 MB):
přes limit GitHub Pages 1 GB, proto se čeká na dlaždice na Cloudflare R2 (Bára 15. 11. 2026: zatím nepushovat).

Na webu (Bára 15. 11. 2026) jsou dlaždice každého státu (ČR, Slovensko) zabalené do jednoho souboru
(`tools/pack_osm_tiles.mjs`, formát v `app/public/osmpack.js`: slovník tagů, krátký zápis prvků, každá dlaždice
zvlášť gzip, dvouúrovňový index) a aplikace z něj čte jen potřebné kousky přes HTTP Range. Soubory leží na
Cloudflare R2 (kbelík `profily-ulic-osm`, `https://data.streetspace.eu/osm/`) a tytéž na Pages (`data/osm-pack/`),
kam aplikace sáhne, když R2 neodpovídá. `index.json` vedle nich jmenuje soubor každého státu; týdenní obnova je
nahrává pod novým jménem s datem. ČR asi 281 MB místo 1,3 GB ve 246 000 souborech, Slovensko 107 MB.
Lokálně: `node tools/pack_osm_tiles.mjs app/data/osm-tiles app/data/osm-pack/cz.posm` a aplikace s `?osm=balik`
(soubory z místního serveru) nebo `?osm=r2` (z R2); bez přepínače čte místní server dlaždice jako dřív.
Kontrola balíku proti dlaždicím: `node evaluation/osm_pack_check.mjs <dlaždice> <soubor nebo URL> [samples.json …] --all`.
