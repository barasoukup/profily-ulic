// Today's exceptions to tests/architecture.test.js. Only ever shortened or lowered (never extended): when a line here
// gets stale the test says so. Counts and lengths are the present ones.
export const STATE_CONDITIONS = {
  "app/public/house-looks.js": 12
};

export const UNUSED_EXPORTS = [
  "app/public/ai-kerbs.js:PARK",
  "app/public/ai-kerbs.js:kind",
  "app/public/countries/FI.js:FI_SPEEDS",
  "app/public/countries/SI.js:SI_SPEEDS",
  "app/public/countries/SI.js:contraflowSI",
  "app/public/floors.js:HALLS",
  "app/public/floors.js:LOW_MAX",
  "app/public/floors.js:PITCHED",
  "app/public/floors.js:PITCHED_SHAPES",
  "app/public/floors.js:TWO_FROM",
  "app/public/floors.js:floorsHOff",
  "app/public/queries.js:IPR",
  "app/public/queries.js:LINE_CODES",
  "app/public/queries.js:POINT_CODES",
  "app/public/search-at.js:WIEN_WFS",
  "app/public/search-sk.js:ZBGIS",
  "app/public/search.js:KINDS",
  "app/public/search.js:MIN_CHARS",
  "app/public/search.js:RUIAN_SEARCH",
  "app/public/site.js:NET_CITIES"
];

export const LONG_FILES = {
  "app/public/app.js": 2787,
  "app/public/derive.js": 3092,
  "app/public/lanes-ortho.js": 1207,
  "app/public/ortho-osm.js": 1478,
  "app/public/profile.js": 3089
};

export const LONG_FUNCTIONS = {
  "app/public/ai-kerbs.js:parkFromAi": 121,
  "app/public/app.js:cutAt": 430,
  "app/public/app.js:fitLabels": 109,
  "app/public/app.js:renderEditor": 250,
  "app/public/derive.js:deriveProfile": 641,
  "app/public/derive.js:splitRoadway": 228,
  "app/public/dmvs.js:dtmAreas": 128,
  "app/public/dmvs.js:fromLines": 107,
  "app/public/houses-america.js:drawAmerican": 566,
  "app/public/lanes-ortho.js:measured": 114,
  "app/public/maplayers.js:createDataLayers": 204,
  "app/public/maplayers.js:draw": 172,
  "app/public/ortho-osm.js:besidePassport": 168,
  "app/public/ortho-osm.js:orthoOsmPolys": 535,
  "app/public/profile.js:(anonymous)": 176,
  "app/public/profile.js:buildSvg": 320,
  "app/public/profile.js:drawItem": 145,
  "app/public/profile.js:drawPrahaBuilding": 1232,
  "app/public/search.js:mountSearch": 174,
  "app/public/signs.js:deriveSigns": 117,
  "app/public/towns/plzen.js:parking": 110
};
