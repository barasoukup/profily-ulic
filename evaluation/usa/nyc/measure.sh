#!/bin/sh
# The fresh measurement of New York by Washington's code (as evaluation/canada/measure.sh): evaluation/usa/nyc/measure.sh packages | score
# Profiles: evaluation/universal/data/us-nyc.json (variants def, nyc0) and us-nyc-osm.json (OSM only), collected in the app's page
# with evaluation/usa/collect.js from sample-all.json (sample.json and sample-u.json).
cd "$(dirname "$0")" || exit 1
export EVAL_DIR="$PWD" EVAL_DATA=us-nyc EVAL_OFF=nyc0 EVAL_SAMPLE=sample-all.json EVAL_WHO="mapou New Yorku"
export EVAL_ORTHO=https://orthos.its.ny.gov/arcgis/rest/services/wms/2024/MapServer/export
node "../fresh/$1.mjs"
