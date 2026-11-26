#!/bin/sh
# The fresh measurement of Boston's and Cambridge's maps by Washington's code (as evaluation/canada/measure.sh):
#   evaluation/usa/boston/measure.sh packages | score
# Profiles: evaluation/universal/data/bos-fresh.json (evaluation/usa/collect.js, variants def and bos0; osm separately).
cd "$(dirname "$0")" || exit 1
export EVAL_DIR="$PWD" EVAL_DATA=bos-fresh EVAL_OFF=bos0 EVAL_SAMPLE=fresh.json EVAL_WHO="mapou Bostonu a Cambridge"
export EVAL_TILES=https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/Massachusetts_Aerial_Imagery_2025/MapServer/tile
node "../fresh/$1.mjs"
