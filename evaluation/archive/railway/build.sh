#!/bin/zsh
# The railway measurement's data (Bára 27. 11. 2026): the town boxes of a state (osmium, see REPORT.md) → the "ways" layer
# exactly as tools/build_osm_data.sh exports it (ogr2ogr) → tools/build_osm_tiles.mjs (the real builder, with its rule for
# railways) → only the railway lines of those tiles. node evaluation/archive/railway/pack.mjs then packs them into the small pack
# that is read beside a state's own (a pack "rail" in app/data/osm-pack/index.json).
#   evaluation/archive/railway/build.sh <data dir> <ISO>
set -e
D=$1; iso=$2; R=${0:A:h}/../../..
OGR=${OGR:-/Applications/QGIS-final-4_2_3.app/Contents/MacOS/ogr2ogr}
export PROJ_DATA=${PROJ_DATA:-/Applications/QGIS-final-4_2_3.app/Contents/Resources/qgis/proj} GDAL_DATA=${GDAL_DATA:-/Applications/QGIS-final-4_2_3.app/Contents/Resources/qgis/gdal}
l=${iso:l}
files=()
for pbf in $D/$l-*.osm.pbf; do
  out=${pbf%.osm.pbf}_ways.geojsonl
  [ -s $out ] || "$OGR" -f GeoJSONSeq $out $pbf lines -where "highway IS NOT NULL OR railway IN ('tram', 'light_rail', 'rail', 'narrow_gauge', 'subway')" -select osm_id,name,highway,railway,other_tags -overwrite -q
  files+=($out)
done
node $R/tools/build_osm_tiles.mjs $D/tiles-$iso $files
