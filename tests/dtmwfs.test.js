// The regions' DTM read as polygons from their WFS (pilot/public/dtmwfs.js): the GML of MapServer, the region of
// a cut by kraje.json, the box in S-JTSK.
import { test } from "node:test";
import assert from "node:assert/strict";

const W = await import("../pilot/public/dtmwfs.js");

// A shortened answer of jck.krajdtm.cz (one sidewalk with a hole, one fence), as MapServer writes it.
const GML = `<?xml version='1.0' encoding="UTF-8" ?>
<wfs:FeatureCollection xmlns:ms="http://mapserver.gis.umn.edu/mapserver" numberMatched="2" numberReturned="2">
  <wfs:member><wfs:FeatureCollection numberMatched="1" numberReturned="1">
    <wfs:member>
      <ms:zps_p_chod gml:id="zps_p_chod.1">
        <ms:msGeometry><gml:MultiSurface gml:id="zps_p_chod.1.1" srsName="urn:ogc:def:crs:EPSG::5514"><gml:surfaceMember>
          <gml:Polygon gml:id="zps_p_chod.1.2">
            <gml:exterior><gml:LinearRing><gml:posList srsDimension="3">-755800 -1166240 0 -755790 -1166240 0 -755790 -1166230 0 -755800 -1166230 0 -755800 -1166240 0</gml:posList></gml:LinearRing></gml:exterior>
            <gml:interior><gml:LinearRing><gml:posList srsDimension="3">-755797 -1166237 0 -755793 -1166237 0 -755793 -1166233 0 -755797 -1166237 0</gml:posList></gml:LinearRing></gml:interior>
          </gml:Polygon>
        </gml:surfaceMember></gml:MultiSurface></ms:msGeometry>
        <ms:id>1</ms:id>
        <ms:objektovytypnazev>chodník</ms:objektovytypnazev>
        <ms:urovenumisteniobjektuzps>0</ms:urovenumisteniobjektuzps>
        <ms:datumvkladu gml:id="zps_p_chod.1.datumvkladu"><gml:timePosition>2026-01-29T09:51:43Z</gml:timePosition></ms:datumvkladu>
      </ms:zps_p_chod>
    </wfs:member>
  </wfs:FeatureCollection></wfs:member>
  <wfs:member><wfs:FeatureCollection numberMatched="1" numberReturned="1">
    <wfs:member>
      <ms:zps_l_prisl_st_plot_kov gml:id="zps_l_prisl_st_plot_kov.7">
        <ms:msGeometry><gml:LineString gml:id="zps_l_prisl_st_plot_kov.7.1"><gml:posList srsDimension="2">-755800 -1166250 -755780 -1166250</gml:posList></gml:LineString></ms:msGeometry>
        <ms:objektovytypnazev>plot kovový</ms:objektovytypnazev>
      </ms:zps_l_prisl_st_plot_kov>
    </wfs:member>
  </wfs:FeatureCollection></wfs:member>
</wfs:FeatureCollection>`;

test("GML z WFS DTM kraje: polygony s dírami, čáry, atributy", () => {
  const [walk, fence] = W.parseGml(GML);
  assert.equal(walk.type, "zps_p_chod");
  assert.equal(walk.attrs.objektovytypnazev, "chodník");
  assert.equal(walk.attrs.urovenumisteniobjektuzps, "0");
  assert.equal(walk.polygons.length, 1);
  assert.equal(walk.polygons[0].length, 2); // exterior and a hole
  assert.deepEqual(walk.polygons[0][0][1], [-755790, -1166240]);
  assert.equal(fence.type, "zps_l_prisl_st_plot_kov");
  assert.deepEqual(fence.lines, [[[-755800, -1166250], [-755780, -1166250]]]);
});

test("kraj řezu: WFS jen v krajích, které ho mají, a ne u hranice s krajem bez něj", async () => {
  const box = (lon, lat, d = 0.0008) => [lon - d, lat - d, lon + d, lat + d].join(",");
  assert.deepEqual(await W.regionsAt(box(14.474, 48.974)), ["jck"]); // České Budějovice
  assert.deepEqual(await W.regionsAt(box(15.7766, 50.038)), ["pak"]); // Pardubice
  assert.deepEqual(await W.regionsAt(box(15.056, 50.77)), ["lbk"]); // Liberec
  assert.deepEqual(await W.regionsAt(box(14.42, 50.08)), []); // Praha (IPR)
  assert.deepEqual(await W.regionsAt(box(17.251, 49.594)), []); // Olomouc (no WFS)
  assert.deepEqual(await W.regionsAt(box(13.378, 49.748)), []); // Plzeň (no WFS)
});

test("obálka v S-JTSK kolem obálky ve stupních", async () => {
  const [x0, y0, x1, y1] = W.sjtskBox("14.4733,48.9735,14.4747,48.9745");
  assert.ok(x0 < x1 && y0 < y1);
  const { fromWgs } = await import("../pilot/public/towns/sjtsk.js");
  const [cx, cy] = fromWgs(14.474, 48.974);
  assert.ok(cx > x0 && cx < x1 && cy > y0 && cy < y1, `${x0} ${y0}`);
  assert.ok(x1 - x0 > 95 && x1 - x0 < 130, `${x1 - x0}`);
});

test("CSP stránky pustí prohlížeč na WFS všech krajů", async () => {
  const fs = await import("node:fs");
  const html = fs.readFileSync(new URL("../pilot/public/index.html", import.meta.url), "utf8");
  const connect = html.match(/connect-src [^;]*/)[0];
  for (const host of W.WFS_HOSTS) assert.ok(connect.includes(host), host);
});
