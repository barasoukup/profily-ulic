// Lombardy's territory, without imports (towns/lombardy.js asks its DBT here, lanes-ortho.js keeps Bolzano's orthophoto
// out of it).
// The region's box (Regione Lombardia's boundary of 2020, CC0, dati.lombardia.it b7fb-r6ie; tools/lombardy-border.json).
export const LOMBARDY_BOX = [8.49, 44.67, 11.44, 46.64];
// Inside the Italian part of staty.json (towns/italy.js is asked only there) the box overlaps only South Tyrol and
// Modena's northern exclaves. South Tyrol touches Lombardy from the Stelvio (10.45, 46.53) to the Cevedale (10.62, 46.45):
// there the shared border (tools/lombardy-border.json, about 300 m), west of it South Tyrol lies north of 46.6, east of
// it (to 10.65) south of 46.44 and further east south of 46 there is no South Tyrol (Lombardy ends at 45.85 there); Modena lies south of 44.85 east of 10.4, Lombardy north of it. Every vertex
// of the boundaries on its side (tests/italy.test.js).
const STELVIO = [[10.445, 46.535], [10.455, 46.5277], [10.46, 46.5108], [10.467, 46.5035], [10.475, 46.4977], [10.485, 46.4928], [10.49, 46.4977], [10.525, 46.4951], [10.54, 46.4918], [10.55, 46.4924], [10.56, 46.482], [10.575, 46.4734], [10.6, 46.4688], [10.62, 46.4472]];
const stelvioLat = (lon) => {
  const i = STELVIO.findIndex(([x], k) => k && x >= lon), [x0, y0] = STELVIO[i - 1], [x1, y1] = STELVIO[i];
  return y0 + ((lon - x0) / (x1 - x0)) * (y1 - y0);
};
export const inLombardy = (lon, lat) => lon >= LOMBARDY_BOX[0] && lon <= LOMBARDY_BOX[2] && lat >= LOMBARDY_BOX[1] && lat <= LOMBARDY_BOX[3]
  && !(lon > 10.4 && lat < 44.85)
  && (lon < 10.38 || (lon < 10.445 ? lat < 46.6 : lon < 10.62 ? lat < stelvioLat(lon) : lon < 10.65 ? lat < 46.44 : lat < 46));
