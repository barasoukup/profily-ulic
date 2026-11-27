#!/usr/bin/env bash
# Builds the OSM tiles the app reads (pilot/data/osm-tiles): for the whole Czech Republic (as the deploy does)
#   NAME=cz tools/build_osm_data.sh data/osm/cz.osm.pbf pilot/data/osm-tiles   (Geofabrik's extract)
# or, as before, from the BBBike Prague extract:
# exports the needed features with ogr2ogr into data/osm/praha_*.geojsonl, then tiles them.
#   tools/build_osm_data.sh [Prag.osm.pbf] [out dir]
# Brno: NAME=brno tools/build_osm_data.sh data/osm/Brno.osm.pbf pilot/data/brno/osm-tiles
# A town (no BBBike extract; tools/cities.mjs): NAME=jihlava tools/build_osm_data.sh data/osm/towns/jihlava.osm.pbf pilot/data/jihlava/osm-tiles,
# the pbf cut from Geofabrik's Czech Republic with osmium (as the deploy does), or SPAT="x0 y0 x1 y1" to
# read only that box of a bigger pbf.
# OGR=/path/to/ogr2ogr overrides the ogr2ogr binary (on a Mac with QGIS:
# OGR=/Applications/QGIS-final-4_2_3.app/Contents/MacOS/ogr2ogr, with PROJ_DATA/GDAL_DATA set).
# The tiles are a database derived from OpenStreetMap: © OpenStreetMap contributors, ODbL 1.0.
set -euo pipefail
cd "$(dirname "$0")/.."

PBF=${1:-data/osm/Prag.osm.pbf}
OUT=${2:-pilot/data/osm-tiles}
OGR=${OGR:-ogr2ogr}
DIR=${DIR:-data/osm} # where the GeoJSONSeq exports go
NAME=${NAME:-praha} # prefix of the exports; the BBBike extract of that city when PBF is missing
case "$NAME" in praha) BBBIKE=Prag ;; brno) BBBIKE=Brno ;; *) BBBIKE= ;; esac
mkdir -p "$DIR"

if [ ! -f "$PBF" ] && [ -z "$BBBIKE" ]; then
  echo "chybí $PBF (výřez z Geofabriku, osmium extract)" >&2
  exit 1
fi
if [ ! -f "$PBF" ]; then
  mkdir -p "$(dirname "$PBF")"
  curl -fL -o "$PBF" "https://download.bbbike.org/osm/bbbike/$BBBIKE/$BBBIKE.osm.pbf"
fi

tag() { echo "other_tags LIKE '%\"$1\"=>\"$2\"%'"; }

export_layer() { # file layer where select
  # GeoJSONSeq does not overwrite: without this a second run appends to the old export
  rm -f "$DIR/${NAME}_$1.geojsonl"
  # shellcheck disable=SC2086
  "$OGR" -f GeoJSONSeq "$DIR/${NAME}_$1.geojsonl" "$PBF" "$2" -where "$3" -select "$4" -overwrite ${SPAT:+-spat $SPAT}
}

# Railways on the ground beside streets too (Bára 27. 11. 2026: the profile's "železnice"); build_osm_tiles.mjs keeps of
# rail, narrow_gauge and subway only the tracks at ground level near a road.
export_layer ways lines "highway IS NOT NULL OR railway IN ('tram', 'light_rail', 'rail', 'narrow_gauge', 'subway')" osm_id,name,highway,railway,other_tags
export_layer parking multipolygons "amenity = 'parking'" osm_id,osm_way_id,amenity,other_tags
export_layer trees points "$(tag natural tree)" osm_id,other_tags
export_layer treerows lines "$(tag natural tree_row)" osm_id,other_tags
export_layer platforms_area multipolygons "$(tag public_transport platform) OR $(tag railway platform) OR $(tag highway platform)" osm_id,osm_way_id,other_tags
export_layer furniture points "highway IN ('street_lamp', 'bus_stop', 'turning_circle', 'turning_loop') OR barrier IN ('bollard', 'planter') OR $(tag amenity bench) OR $(tag amenity bicycle_parking) OR $(tag amenity bicycle_rental) OR $(tag amenity shelter) OR $(tag amenity taxi) OR $(tag information board) OR $(tag information guidepost) OR $(tag information map) OR $(tag railway tram_stop) OR $(tag public_transport platform)" osm_id,highway,barrier,other_tags
export_layer barriers lines "barrier IN ('fence', 'wall', 'city_wall', 'retaining_wall', 'hedge', 'guard_rail', 'jersey_barrier', 'handrail', 'kerb')" osm_id,barrier,other_tags
export_layer outdoor multipolygons "leisure = 'outdoor_seating'" osm_way_id,leisure,other_tags
export_layer outdoor_pts points "$(tag leisure outdoor_seating)" osm_id,other_tags
# All buildings (Bára 15. 11. 2026): without a technical map (ortho-osm.js) the OSM footprints are the facades. Those
# with no height or floors are kept near the roads only (build_osm_tiles.mjs).
export_layer buildings multipolygons "building IS NOT NULL" osm_id,osm_way_id,building,other_tags
# Green areas (Bára 15. 11. 2026): lawns, parks, gardens, woods beside a street, for the profile without a technical
# map (ortho-osm.js); cut by tiles and kept near the roads only (build_osm_tiles.mjs).
# Without a technical map (abroad) OSM has to tell the rest too (Bára 15. 11. 2026): the outlines of carriageways and
# sidewalks where they are mapped (area:highway), water and the plots that end a profile (allotments, cemeteries).
export_layer areas multipolygons "other_tags LIKE '%\"area:highway\"%'" osm_id,osm_way_id,other_tags
export_layer water multipolygons "natural = 'water' OR landuse IN ('reservoir', 'basin', 'allotments', 'cemetery') OR other_tags LIKE '%\"waterway\"=>\"riverbank\"%' OR other_tags LIKE '%\"water\"=>\"river\"%'" osm_id,osm_way_id,landuse,natural,other_tags
# Bridge decks (man_made=bridge, Bára 26. 11. 2026): a street on a bridge ends at the deck's edge (with a railing),
# and the water between two decks of one bridge stays water (ortho-osm.js, derive.js).
export_layer bridges multipolygons "man_made = 'bridge'" osm_id,osm_way_id,name,man_made,other_tags
export_layer green multipolygons "landuse IN ('grass', 'meadow', 'village_green', 'flowerbed', 'forest', 'orchard', 'recreation_ground') OR leisure IN ('park', 'garden') OR natural IN ('grass', 'grassland', 'scrub', 'wood', 'heath')" osm_id,osm_way_id,name,landuse,leisure,natural,barrier,other_tags

node tools/build_osm_tiles.mjs "$OUT" "$DIR"/"$NAME"_{ways,parking,trees,treerows,platforms_area,furniture,barriers,outdoor,outdoor_pts,buildings,green,areas,water,bridges}.geojsonl
