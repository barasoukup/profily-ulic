// Canada (Bára 25. 11. 2026): the City of Toronto's orthophoto of the current year (cot_ortho; 2025, 8 cm, a tile cache in Web Mercator
// to level 23; CORS for the origin asking; Open Government Licence – Toronto by the catalogue's "Web Map Services"), read as DC's, only
// inside the city (towns-ca.json) and 30 m beyond it. Around the city no orthophoto yet.
export const chain = { id: "ca", pick: "area" };
export const sources = [
  { id: "ca-tor", chain: "ca", res: 0.1, credit: "credits.orthophotoCityToronto2025", area: { box: [-79.645, 43.575, -79.11, 43.86], town: "toronto", near: 30 },
    service: { type: "ags", base: "https://gis.toronto.ca/arcgis/rest/services/basemap/cot_ortho/MapServer" },
    map: { kind: "bbox", late: true, town: "toronto", limit: "inside", bounds: "box" } },
];
