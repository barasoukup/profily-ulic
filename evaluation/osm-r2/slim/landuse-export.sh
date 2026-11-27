#!/bin/bash
# The land use areas Bára asked to measure (26. 11. 2026; not in the app): landuse=residential, industrial, commercial,
# retail, railway and the grounds of schools, universities, colleges, kindergartens and hospitals, from a PBF to GeoJSONSeq.
#   evaluation/osm-r2/slim/landuse-export.sh data/osm/at.osm.pbf data/slimtest/lu-at.geojsonl
set -euo pipefail
PBF=$1; OUT=$2
OGR=${OGR:-/Applications/QGIS-final-4_2_3.app/Contents/MacOS/ogr2ogr}
TMP=$(dirname "$OUT")/lu-$(basename "$OUT" .geojsonl).osm.pbf
osmium tags-filter "$PBF" a/landuse=residential,industrial,commercial,retail,railway a/amenity=school,university,college,kindergarten,hospital -o "$TMP" --overwrite
rm -f "$OUT"
"$OGR" -f GeoJSONSeq "$OUT" "$TMP" multipolygons -where "landuse IN ('residential','industrial','commercial','retail','railway') OR amenity IN ('school','university','college','kindergarten','hospital')" -select osm_id,osm_way_id,landuse,amenity
rm -f "$TMP"
wc -l "$OUT"
