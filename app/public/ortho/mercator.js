// Web Mercator, as every orthophoto of the registry is asked in it.
export const R = 6378137;
export const merc = (lon, lat) => [(R * lon * Math.PI) / 180, R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))];
// A Web Mercator box in degrees (the services that have no Web Mercator are asked in CRS:84).
export const mercToDeg = ([x0, y0, x1, y1]) => [x0, y0, x1, y1].map((v, i) => (i % 2 === 0 ? (v / R) * (180 / Math.PI) : (Math.atan(Math.sinh(v / R)) * 180) / Math.PI));
