// A stand-in for app/map.js (the Leaflet map) when basemaps.js is read in Node (ortho-snapshot.js).
export const map = globalThis.__orthoMap;
