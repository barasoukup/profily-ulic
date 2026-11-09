#!/usr/bin/env bash
# Downloads the public DTM of Jihomoravský kraj for Brno (ZPS "kresba" and the transport
# infrastructure DI with the tram track axes, one zip each per district) from
# IS DMVS ČÚZK: public data sets, no login. The list of links comes from the portal's open-data API
# (the same as "Veřejné datové sady → Stáhnout seznam odkazů"); the newest month is taken.
#   tools/fetch_dtm_brno.sh [out dir]   (default data/dtm-brno/zip)
# Then: python3 tools/build_dtm_brno.py data/dtm-brno/zip pilot/data/brno/dtm-tiles
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=${1:-data/dtm-brno/zip}
mkdir -p "$OUT"
LIST=$(mktemp)
curl -fsS --retry 3 -m 120 -X POST https://dmvs.cuzk.gov.cz/api/rest/open-data/datove-sady/stavove/seznam-url \
  -H 'Content-Type: application/json' -d '{"isDtmk":["CZ064"]}' -o "$LIST"
# Brno's 29 districts (MOMC 55xxxx), the "kresba" set of the newest month.
LATEST=$(grep -o 'MOMC_55[0-9]*_[0-9]\{8\}_ZPS_KR' "$LIST" | sed -E 's/.*_([0-9]{8})_ZPS_KR/\1/' | sort -u | tail -1)
grep -E "MOMC_55[0-9]*_${LATEST}_(ZPS_KR|DI).jvf.zip" "$LIST" > "$LIST.brno"
echo "DTM Brno ${LATEST}: $(wc -l < "$LIST.brno") souborů (KR a DI po městských částech)"
rm -f "$OUT"/*_ZPS_KR.jvf.zip "$OUT"/*_DI.jvf.zip
while read -r url; do
  curl -fsSL --retry 3 -m 600 -o "$OUT/$(basename "$url")" "$url"
done < "$LIST.brno"
rm -f "$LIST" "$LIST.brno"
