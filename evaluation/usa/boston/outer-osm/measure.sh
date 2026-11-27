#!/bin/sh
# The A/B of the outer gaps from OSM alone (?outerosm=1, REPORT.md) by the fresh measurement's code:
#   evaluation/usa/boston/outer-osm/measure.sh packages | score
# Profiles: evaluation/universal/data/bos-outer-osm.json (evaluation/usa/collect.js, variants def and ogosm), a copy in results/rows.json.
cd "$(dirname "$0")" || exit 1
export EVAL_DIR="$PWD" EVAL_DATA=bos-outer-osm EVAL_OFF=ogosm EVAL_SAMPLE=sample.json EVAL_WHO="mezerami z OSM" EVAL_NO_U=1
export EVAL_TILES=https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/Massachusetts_Aerial_Imagery_2025/MapServer/tile
node "../../fresh/$1.mjs"
