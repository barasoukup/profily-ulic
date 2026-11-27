#!/bin/sh
# The parking by NYC DOT's signs (?nycsigns=1, REPORT.md) by the fresh measurement's code: evaluation/usa/nyc/park/measure.sh packages | score
# Profiles: evaluation/universal/data/nyc-signs.json (evaluation/usa/collect.js, variants def and nycsigns) and nyc-signs-osm.json
# (OSM only), copies in results/rows.json and results/rows-osm.json. In score.md "mapa" is def (without the signs), "odhad"
# and "bez mapy" are ?nycsigns=1.
cd "$(dirname "$0")" || exit 1
export EVAL_DIR="$PWD" EVAL_DATA=nyc-signs EVAL_OFF=nycsigns EVAL_SAMPLE=sample.json EVAL_WHO="mapou bez značek"
export EVAL_ORTHO=https://orthos.its.ny.gov/arcgis/rest/services/wms/2024/MapServer/export
node "../../fresh/$1.mjs"
