#!/bin/sh
# The A/B of San Francisco's fixes of 26. 11. 2026 (REPORT.md): evaluation/usa/sf/fixes/measure.sh packages | score
# Profiles: evaluation/universal/data/sf-fixes.json (variants def and sfold = ?off=sfosmpark,axisroad). Esri World Imagery for
# the judges as in ../measure.sh (not kept).
cd "$(dirname "$0")" || exit 1
export EVAL_DIR="$PWD" EVAL_DATA=sf-fixes EVAL_OFF=sfold EVAL_SAMPLE=${EVAL_SAMPLE:-sample.json} EVAL_WHO="opravami" EVAL_NO_U=1
export EVAL_ORTHO_MAX=400 EVAL_ORTHO_FINEST=0.16 EVAL_ORTHO=https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/export
node "../../fresh/$1.mjs"
