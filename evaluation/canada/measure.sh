#!/bin/sh
# The fresh measurement of Toronto by Washington's code: evaluation/canada/measure.sh packages | score
cd "$(dirname "$0")" || exit 1
export EVAL_DIR="$PWD" EVAL_DATA=ca-fresh EVAL_OFF=map0 EVAL_SAMPLE=fresh.json EVAL_WHO="mapou Toronta"
export EVAL_ORTHO=https://gis.toronto.ca/arcgis/rest/services/basemap/cot_ortho/MapServer/export
node "../usa/fresh/$1.mjs"
