// The USA (Bára 24. 11. 2026, phase 2): DC's orthophoto of 2025 (OCTO, Ortho2025_WebMercator, a tile cache in Web Mercator to level 23,
// 7.5 cm at level 21; flown 27. 3. 2025, 8 cm; CORS for the origin asking; CC BY 4.0 by opendata.dc.gov, "Office of the Chief Technology
// Officer"), read through its export in Web Mercator, only inside the District (towns-us.json) and 60 m beyond it (`area.near`; the cache
// is white farther out). Elsewhere in the metro (Maryland, Virginia) no orthophoto yet: the estimate from OSM.
// New York City (26. 11. 2026): the orthophoto of the State of New York of 2024 (NYS ITS Geospatial Services, the 2024 flight over the
// five boroughs, 0.5 ft; a tile cache in Web Mercator to level 19, its export finer; CORS for the origin asking; "available at no cost",
// no licence stated: gis.ny.gov), only inside the city and 30 m beyond it.
// Boston's metro (Bára 26. 11. 2026): MassGIS's spring orthophoto of 2025 (15 cm, a tile cache in Web Mercator to level 23 on ArcGIS
// Online, read at level 20 as {z}/{y}/{x}; CORS for the origin asking; "No restrictions apply to these data … Acknowledgement of MassGIS
// would be appreciated", the item's licence), over the metro (towns-us.json "bostonmetro").
// The map's layers come with a cut there (late.js), each only over its city (towns-us.json).
export const chain = { id: "us", pick: "area" };
export const sources = [
  { id: "us-dc", chain: "us", res: 0.1, credit: "credits.orthophotoDcOfficeChief", area: { box: [-77.12, 38.79, -76.909, 38.997], town: "washington", near: 60 },
    service: { type: "ags", base: "https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Ortho2025_WebMercator/MapServer" },
    map: { kind: "bbox", late: true, town: "washington", limit: "inside", bounds: "box" } },
  { id: "us-nyc", chain: "us", res: 0.15, credit: "credits.orthophotoNysGeospatialServices", area: { box: [-74.27, 40.47, -73.68, 40.93], town: "newyork", near: 30 },
    service: { type: "ags", base: "https://orthos.its.ny.gov/arcgis/rest/services/wms/2024/MapServer" },
    map: { kind: "bbox", late: true, town: "newyork", limit: "inside", bounds: "box" } },
  { id: "us-ma", chain: "us", res: 0.15, credit: "credits.orthophotoMassgisBureauGeographic", area: { box: [-71.9, 41.98, -70.64, 42.74], town: "bostonmetro", near: 60 },
    service: { type: "xyz", base: "https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/Massachusetts_Aerial_Imagery_2025/MapServer/tile", z: 20, px: 256 },
    map: { kind: "tiles", late: true, town: "bostonmetro", limit: "inside", bounds: "box", maxNativeZoom: 20 } },
];
