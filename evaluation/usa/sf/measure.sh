#!/bin/sh
# The fresh measurement of San Francisco by Washington's code: evaluation/usa/sf/measure.sh packages | score
# San Francisco has no open orthophoto (USGS's NAIP is 0.6–1 m): the judges get Esri World Imagery, as Lombardy's A/B did;
# its images stay in data/ (git ignores it) and are not published.
cd "$(dirname "$0")" || exit 1
export EVAL_DIR="$PWD" EVAL_DATA=${EVAL_DATA:-us-sf-fresh} EVAL_OFF=${EVAL_OFF:-sf0} EVAL_SAMPLE=fresh.json EVAL_WHO="mapou San Franciska"
export EVAL_ORTHO_MAX=400 EVAL_ORTHO_FINEST=0.16 EVAL_ORTHO=https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/export
node "../fresh/$1.mjs"
