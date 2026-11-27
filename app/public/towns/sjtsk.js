// S-JTSK (EPSG:5514, Křovák East-North, the negative coordinates of Czech GIS) ↔ WGS 84 by the transformation
// EPSG 1623 (S-JTSK to WGS 84 (1), the "S_JTSK_To_WGS_1984_1" the towns' ArcGIS queries ask for): within
// 0.1 m of RÚIAN and the orthophoto. For services that answer only in S-JTSK (Přerov's vector tiles).
const D = Math.PI / 180;
const A = 6377397.155, E2 = 0.006674372230614, E = Math.sqrt(E2);
const PHI0 = 49.5 * D, LAM0 = 24.83333333333333 * D, S0 = 78.5 * D, K0 = 0.9999;
const ALPHA = Math.sqrt(1 + (E2 * Math.cos(PHI0) ** 4) / (1 - E2));
const U0 = Math.asin(Math.sin(PHI0) / ALPHA);
const G = ((1 + E * Math.sin(PHI0)) / (1 - E * Math.sin(PHI0))) ** ((ALPHA * E) / 2);
const K = (Math.tan(U0 / 2 + Math.PI / 4) / Math.tan(PHI0 / 2 + Math.PI / 4) ** ALPHA) * G;
const N0 = (A * Math.sqrt(1 - E2)) / (1 - E2 * Math.sin(PHI0) ** 2);
const N = Math.sin(S0), RHO0 = (K0 * N0) / Math.tan(S0);
const ADr = Math.PI / 2 - 1.04216856380474; // 90° − the latitude of the Křovák pole (59°42′42.69689″)
function bessel(xe, yn) {
  const x = -yn, y = -xe; // southing, westing
  const rho = Math.hypot(x, y), eps = Math.atan2(y, x), d = eps / Math.sin(S0);
  const s = 2 * (Math.atan((RHO0 / rho) ** (1 / N) * Math.tan(S0 / 2 + Math.PI / 4)) - Math.PI / 4);
  const u = Math.asin(Math.cos(ADr) * Math.sin(s) - Math.sin(ADr) * Math.cos(s) * Math.cos(d));
  const dv = Math.asin((Math.cos(s) * Math.sin(d)) / Math.cos(u));
  const lam = LAM0 - dv / ALPHA;
  let phi = u;
  for (let i = 0; i < 10; i++) {
    phi = 2 * (Math.atan(K ** (-1 / ALPHA) * Math.tan(u / 2 + Math.PI / 4) ** (1 / ALPHA) * ((1 + E * Math.sin(phi)) / (1 - E * Math.sin(phi))) ** (E / 2)) - Math.PI / 4);
  }
  return [phi, lam];
}
// Helmert 1623: tx 570.8 ty 85.7 tz 462.8, rx 4.998 ry 1.587 rz 5.261 (arc s), ds 3.56 ppm, position vector.
const TX = 570.8, TY = 85.7, TZ = 462.8, RX = (4.998 / 3600) * D, RY = (1.587 / 3600) * D, RZ = (5.261 / 3600) * D, DS = 3.56e-6;
const WA = 6378137, WF = 1 / 298.257223563, WE2 = WF * (2 - WF);
export function toWgs(xe, yn) {
  const [phi, lam] = bessel(xe, yn);
  const nu = A / Math.sqrt(1 - E2 * Math.sin(phi) ** 2);
  const X = nu * Math.cos(phi) * Math.cos(lam), Y = nu * Math.cos(phi) * Math.sin(lam), Z = nu * (1 - E2) * Math.sin(phi);
  const m = 1 + DS;
  const X2 = TX + m * (X - RZ * Y + RY * Z), Y2 = TY + m * (RZ * X + Y - RX * Z), Z2 = TZ + m * (-RY * X + RX * Y + Z);
  const lon = Math.atan2(Y2, X2), p = Math.hypot(X2, Y2);
  let lat = Math.atan2(Z2, p * (1 - WE2));
  for (let i = 0; i < 6; i++) { const n = WA / Math.sqrt(1 - WE2 * Math.sin(lat) ** 2); lat = Math.atan2(Z2 + WE2 * n * Math.sin(lat), p); }
  return [lon / D, lat / D];
}

// WGS 84 → S-JTSK: Newton's method on toWgs (three or four steps to a millimetre).
export function fromWgs(lon, lat, start = [-600000, -1100000]) {
  let [x, y] = start;
  for (let i = 0; i < 8; i++) {
    const [l0, b0] = toWgs(x, y), [l1, b1] = toWgs(x + 1, y), [l2, b2] = toWgs(x, y + 1);
    const a = l1 - l0, b = l2 - l0, c = b1 - b0, d = b2 - b0, det = a * d - b * c;
    const dl = lon - l0, db = lat - b0;
    const dx = (d * dl - b * db) / det, dy = (-c * dl + a * db) / det;
    x += dx; y += dy;
    if (Math.abs(dx) + Math.abs(dy) < 1e-4) break;
  }
  return [x, y];
}
