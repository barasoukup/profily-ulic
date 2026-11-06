"""Convert a JVF DTM (ZPS) XML file to a GeoPackage, one layer per object type.

Run with QGIS's Python:
  /Applications/QGIS-final-4_2_3.app/Contents/MacOS/python tools/jvf_to_gpkg.py IN.xml OUT.gpkg
"""
import sys
import xml.etree.ElementTree as ET

from osgeo import ogr, osr

GML = "{http://www.opengis.net/gml/3.2}"
SKIP_ATTRS = {"SpolecneAtributyVsechObjektu", "SpolecneAtributyObjektuZPS"}


def local(tag):
    return tag.split("}", 1)[-1]


def ring_wkt(poslist, dim):
    v = [float(x) for x in poslist.split()]
    pts = [f"{v[i]} {v[i + 1]}" for i in range(0, len(v), dim)]
    return "(" + ", ".join(pts) + ")"


def geometry(geom_el):
    """Prefer the 2D surface; fall back to curves or points."""
    polys = []
    for poly in geom_el.iter(GML + "Polygon"):
        dim = int(poly.get("srsDimension", "2"))
        rings = [ring_wkt(p.text, dim) for p in poly.iter(GML + "posList")]
        polys.append("(" + ", ".join(rings) + ")")
    if polys:
        return ogr.CreateGeometryFromWkt("MULTIPOLYGON (" + ", ".join(polys) + ")")
    lines = []
    for ls in geom_el.iter(GML + "LineString"):
        dim = int(ls.get("srsDimension", "2"))
        lines.append(ring_wkt(ls.find(GML + "posList").text, dim))
    if lines:
        return ogr.CreateGeometryFromWkt("MULTILINESTRING (" + ", ".join(lines) + ")")
    for pt in geom_el.iter(GML + "pos"):
        v = pt.text.split()
        return ogr.CreateGeometryFromWkt(f"POINT ({v[0]} {v[1]})")
    return None


def main(src, dst):
    srs = osr.SpatialReference()
    srs.ImportFromEPSG(5514)
    ds = ogr.GetDriverByName("GPKG").CreateDataSource(dst)
    layers = {}
    counts = {}
    for _, el in ET.iterparse(src, events=("end",)):
        if local(el.tag) != "ZaznamObjektu":
            continue
        code = el.tag[1:].split("}")[0]  # namespace = object type code, e.g. chopol
        attrs_el = geom_el = None
        for child in el:
            name = local(child.tag)
            if name == "AtributyObjektu":
                attrs_el = child
            elif name == "GeometrieObjektu":
                geom_el = child
        attrs = {}
        if attrs_el is not None:
            id_el = attrs_el.find(".//{atr}ID")
            if id_el is not None:
                attrs["ID"] = id_el.text
            for a in attrs_el:
                if local(a.tag) not in SKIP_ATTRS and len(a) == 0:
                    attrs[local(a.tag)] = a.text
        geom = geometry(geom_el) if geom_el is not None else None
        if code not in layers:
            lyr = ds.CreateLayer(code, srs, ogr.wkbUnknown)
            layers[code] = (lyr, set())
        lyr, fields = layers[code]
        for k in attrs:
            if k not in fields:
                lyr.CreateField(ogr.FieldDefn(k, ogr.OFTString))
                fields.add(k)
        f = ogr.Feature(lyr.GetLayerDefn())
        for k, v in attrs.items():
            f.SetField(k, v)
        if geom is not None:
            f.SetGeometry(geom)
        lyr.CreateFeature(f)
        counts[code] = counts.get(code, 0) + 1
        el.clear()
    ds = None
    for code, n in sorted(counts.items(), key=lambda x: -x[1]):
        print(code, n)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
