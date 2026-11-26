#!/bin/sh
# The A/B of the outer gaps (ZPRAVA.md) by the fresh measurement's code: evaluation/usa/boston/outer/measure.sh packages | score
# Profiles: evaluation/universal/data/bos-outer.json (evaluation/usa/collect.js, variants def and og0).
cd "$(dirname "$0")" || exit 1
export EVAL_DIR="$PWD" EVAL_DATA=bos-outer EVAL_OFF=og0 EVAL_SAMPLE=sample.json EVAL_WHO="mezerami podle OSM a ortofota" EVAL_NO_U=1
export EVAL_TILES=https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/Massachusetts_Aerial_Imagery_2025/MapServer/tile
node "../../fresh/$1.mjs"
