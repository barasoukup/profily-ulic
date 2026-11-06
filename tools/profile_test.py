"""Cut a perpendicular line across an OSM street axis and list the DTM surfaces it crosses.

  python tools/profile_test.py OSM.json ZPS.gpkg [position 0..1] [half_length_m]
"""
import json
import math
import sys

from osgeo import ogr, osr

ogr.UseExceptions()
osr.UseExceptions()

# Object type codes from JVF DTM (subset relevant for street profiles).
NAMES = {
    "chopol": "chodník",
    "pokpol": "vozovka (pozemní komunikace)",
    "budpol": "budova",
    "zahpol": "zahrada",
    "upzpol": "udržovaná zeleň",
    "zedpol": "zeď",
    "schpol": "schodiště",
    "dvnpol": "dvůr / nádvoří",
    "szppol": "stavba / zpevněná plocha",
    "cykpol": "cyklostezka",
    "dkspol": "drážní těleso",
    "pdmpol": "podchod / most",
    "paopol": "parkoviště",
    "delpol": "dělicí pás",
    "ozspol": "ostrůvek",
}


def main(osm_path, gpkg, pos=0.5, half=40.0):
    wgs = osr.SpatialReference()
    wgs.ImportFromEPSG(4326)
    wgs.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
    krovak = osr.SpatialReference()
    krovak.ImportFromEPSG(5514)
    tr = osr.CoordinateTransformation(wgs, krovak)

    ways = json.load(open(osm_path))["elements"]
    way = max(ways, key=lambda w: len(w["geometry"]))
    pts = [tr.TransformPoint(p["lon"], p["lat"])[:2] for p in way["geometry"]]
    axis = ogr.Geometry(ogr.wkbLineString)
    for x, y in pts:
        axis.AddPoint_2D(x, y)
    print("OSM way", way["id"], way["tags"])

    # Point and direction at the requested position along the axis.
    target = axis.Length() * pos
    run = 0.0
    for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
        seg = math.hypot(x2 - x1, y2 - y1)
        if run + seg >= target:
            t = (target - run) / seg
            cx, cy = x1 + t * (x2 - x1), y1 + t * (y2 - y1)
            dx, dy = (x2 - x1) / seg, (y2 - y1) / seg
            break
        run += seg
    nx, ny = -dy, dx
    a = (cx - nx * half, cy - ny * half)
    cut = ogr.Geometry(ogr.wkbLineString)
    cut.AddPoint_2D(*a)
    cut.AddPoint_2D(cx + nx * half, cy + ny * half)

    ds = ogr.Open(gpkg)
    pieces = []
    for i in range(ds.GetLayerCount()):
        lyr = ds.GetLayerByIndex(i)
        lyr.SetSpatialFilter(cut)
        for f in lyr:
            g = f.GetGeometryRef()
            if g is None or not g.Intersects(cut):
                continue
            inter = g.Intersection(cut)
            for k in range(max(inter.GetGeometryCount(), 1)):
                part = inter.GetGeometryRef(k) if inter.GetGeometryCount() else inter
                if part.GetGeometryType() not in (ogr.wkbLineString, ogr.wkbLineString25D):
                    continue
                d = sorted(math.hypot(part.GetX(j) - a[0], part.GetY(j) - a[1])
                           for j in range(part.GetPointCount()))
                label = NAMES.get(lyr.GetName(), lyr.GetName())
                if f.GetFieldIndex("CTVUK_POPIS") >= 0:  # IPR MTVU layer
                    label = f.GetField("CTVUK_POPIS").strip()
                pieces.append((d[0] - half, d[-1] - half, label))
    pieces.sort()
    print(f"\nŘez kolmo na osu ve {pos:.0%} délky, ±{half:.0f} m (0 = osa OSM):")
    for s, e, label in pieces:
        print(f"{s:7.2f} … {e:7.2f} m  {e - s:6.2f} m  {label}")
    walls = [p for p in pieces if p[2] in ("budova", "zástavba - budovy")]
    left = max((p[1] for p in walls if p[1] <= 0), default=None)
    right = min((p[0] for p in walls if p[0] >= 0), default=None)
    if left is not None and right is not None:
        print(f"\nŠířka mezi budovami: {right - left:.2f} m")


if __name__ == "__main__":
    args = sys.argv[1:]
    main(args[0], args[1], *(float(x) for x in args[2:]))
