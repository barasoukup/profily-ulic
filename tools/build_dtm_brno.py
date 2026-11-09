"""Brno technical-map tiles from the public DTM of Jihomoravský kraj (IS DMVS ČÚZK).

The public data sets (ZPS, "kresba" = ZPS_KR) are free to download without logging in, one zip
per Brno district (MOMC). In them the surfaces are not polygons: an area is drawn by its boundary
lines ("hranice …", "vnitřní členění …") and named by a definition point inside it (e.g. "pokdef"
= provozní plocha pozemní komunikace). This script polygonizes the boundaries of every district,
names each polygon by the definition point inside, turns the DTM classes into the codes of Prague's
MTVU (so derive.js reads Brno as it reads Prague) and writes small grid tiles in WGS 84:

  data/dtm-tiles/<ix>_<iy>.json = {"p": [[code, [ring, …]], …], "l": [[code, [[lon, lat], …]], …]}

p are the surfaces (rings of [lon, lat]), l the barrier lines (fences, walls, railings, guard rails,
terrain edges) under the codes of IPR's line layer. Tiles are 0.005° like the OSM tiles.

Run with QGIS's Python (GDAL with GEOS):
  Q=/Applications/QGIS-final-4_2_3.app/Contents
  PROJ_DATA=$Q/Resources/qgis/proj GDAL_DATA=$Q/Resources/qgis/gdal \
    $Q/MacOS/python tools/build_dtm_brno.py data/dtm-brno/zip pilot/data/brno/dtm-tiles
On GitHub Actions: python3 with python3-gdal. The zips come from tools/fetch_dtm_brno.sh.
"""
import json
import math
import os
import shutil
import sys
import xml.etree.ElementTree as ET
import zipfile
from collections import defaultdict

from osgeo import ogr, osr

ogr.UseExceptions()
osr.UseExceptions()

TILE = 0.005
GML = "{http://www.opengis.net/gml/3.2}"
ATR = "{atr}"

# Definition points of DTM areas → MTVU code (see the labels in pilot/public/city.js).
AREA = {
    "pokdef": 701,  # provozní plocha pozemní komunikace (roadway)
    "ppkdef": 701,  # přidružená plocha pozemní komunikace (lay-bys, shoulders)
    "movdef": 701,  # mostní váha
    "pmkdef": 700,  # plocha mostní konstrukce (a bridge deck: roadway and sidewalks alike)
    "chodef": 702,  # chodník
    "najdef": 702,  # nájezd (driveway across a sidewalk)
    "nasdef": 702,  # nástupiště (stop platform)
    "doodef": 702,  # dopravní ostrůvek
    "schdef": 702,  # schodiště
    "ramdef": 702,  # rampa
    "cykdef": 703,  # cyklostezka
    "paodef": 704,  # parkoviště, odstavná plocha
    "tradef": 705,  # tramvajová dráha
    "deldef": 401,  # dělící pás
    "upzdef": 401,  # udržovaná plocha zeleně
    "vgmdef": 401,  # vegetační mísa
    "pnzdef": 402,  # příkop, násep, zářez dopravní stavby
    "hnpdef": 402,  # hospodářsky nevyužívaná plocha
    "hrbdef": 402,  # hřbitov
    "zahdef": 300,  # zahrada
    "lesdef": 200,  # les
    "zepdef": 100,  # zemědělská plocha
    "votdef": 501, "sukdef": 501, "mpzdef": 501,  # watercourse, channel, ditch
    "nsvdef": 502, "nbvdef": 502,  # reservoirs
    "hradef": 503, "stpdef": 503,  # dam, gravel barrier
    "buddef": 601,  # budova
    "zeddef": 602, "poddef": 602, "terdef": 602, "komdef": 602, "skldef": 602, "zabdef": 602,
    "pdmdef": 602, "cepdef": 602, "szpdef": 602, "dssdef": 602, "dksdef": 602, "ozsdef": 602,
    "zasdef": 602, "przdef": 602, "ptudef": 602, "ppodef": 602,
    "dvndef": 603,  # dvůr, nádvoří
    "hridef": 901,  # hřiště
    "mapdef": 1003,  # manipulační plocha
    "spzdef": 1100,  # souhrnná plocha železničních drah
}
# When a polygon holds definition points of several kinds, the more specific one wins.
PRIORITY = [705, 703, 704, 702, 701, 601, 602, 603, 401, 402, 300, 501, 502, 503, 901, 1003, 1100, 200, 100, 700]

# Lines that do not bound areas: service connections (technical infrastructure) and the outline of
# underground objects. Every other line of the ZPS may close an area: besides the "hranice …" and
# "vnitřní členění …" lines, a fence, a wall or a driveway edge often is the boundary itself.
NOT_BOUNDARY = {"toelin", "trkapr", "tvplin", "hrapoo"}

# Barrier lines, under the codes of IPR's line layer that derive.js knows (TECH_ITEM, FENCE_LINES).
LINES = {
    "plotli": 61210,  # plot
    "zedlin": 71210,  # zeď
    "proste": 71210,  # protihluková stěna
    "zabrad": 61530,  # zábradlí
    "svodid": 71522,  # svodidlo
    "terhra": 42105,  # terénní hrana
}

SRC = osr.SpatialReference()
SRC.ImportFromEPSG(5514)
DST = osr.SpatialReference()
DST.ImportFromEPSG(4326)
for s in (SRC, DST):
    s.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
TO_WGS = osr.CoordinateTransformation(SRC, DST)


def local(tag):
    return tag.split("}", 1)[-1]


def coords(text, dim):
    v = text.split()
    return [(float(v[i]), float(v[i + 1])) for i in range(0, len(v), dim)]


def read_district(path):
    """Boundary lines and definition points per level, barrier lines, from one ZPS_KR zip."""
    bounds = defaultdict(list)  # level → [[(x, y), …], …]
    defs = defaultdict(list)  # level → [(x, y, code)]
    lines = []  # (code, [(x, y), …])
    with zipfile.ZipFile(path) as z:
        name = next(n for n in z.namelist() if n.endswith(".xml"))
        with z.open(name) as f:
            for _, el in ET.iterparse(f, events=("end",)):
                if local(el.tag) != "ZaznamObjektu":
                    continue
                ns = el.tag[1:].split("}")[0]
                if ns in AREA or ns not in NOT_BOUNDARY:
                    lvl = el.find(f".//{ATR}UrovenUmisteniObjektuZPS")
                    level = int(lvl.text) if lvl is not None and lvl.text else 0
                    if level >= 0:
                        level = min(level, 1)  # 0 = on the ground, 1 = above it (bridges)
                        if ns in AREA:
                            pos = el.find(f".//{GML}pos")
                            if pos is not None:
                                x, y = coords(pos.text, 3)[0]
                                defs[level].append((x, y, AREA[ns]))
                        else:
                            for ls in el.iter(GML + "LineString"):
                                pl = ls.find(GML + "posList")
                                pts = coords(pl.text, int(ls.get("srsDimension", "2")))
                                if len(pts) < 2:
                                    continue
                                bounds[level].append(pts)
                                if ns in LINES and level == 0:
                                    lines.append((LINES[ns], pts))
                el.clear()
    return bounds, defs, lines


def polygonize(segments):
    ml = ogr.Geometry(ogr.wkbMultiLineString)
    for pts in segments:
        ls = ogr.Geometry(ogr.wkbLineString)
        for x, y in pts:
            ls.AddPoint_2D(x, y)
        ml.AddGeometry(ls)
    polys = ml.UnaryUnion().Polygonize()
    return [polys.GetGeometryRef(i).Clone() for i in range(polys.GetGeometryCount())] if polys else []


GRID = 50.0  # m, index of polygon envelopes
GUESS_AREA, GUESS_WIDTH = 3.0, 10.0  # m², m
GUESSED_SIDEWALK = 702


def name_polygons(polys, points):
    """Code of each polygon from the definition points inside (None when there is none)."""
    index = defaultdict(list)
    envs = []
    for i, p in enumerate(polys):
        x0, x1, y0, y1 = p.GetEnvelope()
        envs.append((x0, x1, y0, y1))
        for gx in range(math.floor(x0 / GRID), math.floor(x1 / GRID) + 1):
            for gy in range(math.floor(y0 / GRID), math.floor(y1 / GRID) + 1):
                index[(gx, gy)].append(i)
    found = defaultdict(set)
    pt = ogr.Geometry(ogr.wkbPoint)
    for x, y, code in points:
        pt.SetPoint_2D(0, x, y)
        for i in index.get((math.floor(x / GRID), math.floor(y / GRID)), ()):
            x0, x1, y0, y1 = envs[i]
            if x0 <= x <= x1 and y0 <= y <= y1 and polys[i].Contains(pt):
                found[i].add(code)
                break
    rank = {c: k for k, c in enumerate(PRIORITY)}
    names = {i: min(codes, key=lambda c: rank.get(c, 99)) for i, codes in found.items()}
    # Some areas have no definition point (in Brno-střed about 7 % of the surface, e.g. the sidewalks
    # of Husova). A narrow one (mean width up to GUESS_WIDTH) next to a roadway, car park or tram
    # surface is taken for a sidewalk: what lies between a street and its houses.
    for i, p in enumerate(polys):
        if i in names:
            continue
        area = p.GetArea()
        perim = p.Boundary().Length()
        if area < GUESS_AREA or not perim or 2 * area / perim > GUESS_WIDTH:
            continue
        x0, x1, y0, y1 = envs[i]
        near = {j for gx in range(math.floor(x0 / GRID), math.floor(x1 / GRID) + 1)
                for gy in range(math.floor(y0 / GRID), math.floor(y1 / GRID) + 1) for j in index[(gx, gy)]}
        if any(names.get(j) in (701, 704, 705) and polys[j].Intersects(p) for j in near if j != i):
            names[i] = GUESSED_SIDEWALK
    return names


def to_wgs(ring):
    out = []
    for x, y in ring:
        lon, lat, _ = TO_WGS.TransformPoint(x, y)
        p = [round(lon, 7), round(lat, 7)]
        if not out or out[-1] != p:
            out.append(p)
    return out


def tiles_of(env):
    lon0, lon1, lat0, lat1 = env
    return [(ix, iy) for ix in range(math.floor(lon0 / TILE), math.floor(lon1 / TILE) + 1)
            for iy in range(math.floor(lat0 / TILE), math.floor(lat1 / TILE) + 1)]


def rings_of(g):
    """Rings of a (multi)polygon as lists of [lon, lat], one list of rings per polygon."""
    t = ogr.GT_Flatten(g.GetGeometryType())
    if t == ogr.wkbPolygon:
        return [[g.GetGeometryRef(k).GetPoints() for k in range(g.GetGeometryCount())]]
    if t in (ogr.wkbMultiPolygon, ogr.wkbGeometryCollection):
        out = []
        for i in range(g.GetGeometryCount()):
            out += rings_of(g.GetGeometryRef(i))
        return out
    return []


def main(src_dir, out_dir):
    tiles = defaultdict(lambda: {"p": [], "l": []})
    seen = set()  # areas and lines on district borders come in both districts
    zips = sorted(f for f in os.listdir(src_dir) if f.endswith("_ZPS_KR.jvf.zip"))
    stats = defaultdict(int)
    for n, zname in enumerate(zips, 1):
        bounds, defs, lines = read_district(os.path.join(src_dir, zname))
        kept = 0
        # Bridges (level 1) go before the ground in every tile, so a cut on a bridge reads the
        # bridge, and a street under a bridge is not the profile (Bára).
        for level in (1, 0):
            if not bounds[level]:
                continue
            polys = polygonize(bounds[level])
            names = name_polygons(polys, defs[level])
            for i, code in names.items():
                g = polys[i]
                g.Transform(TO_WGS)
                env = g.GetEnvelope()
                key = (code, round(g.GetArea() * 1e10), round(env[0], 6), round(env[2], 6))
                if key in seen:
                    continue
                seen.add(key)
                cells = tiles_of(env)
                for ix, iy in cells:
                    part = g
                    if len(cells) > 1:
                        box = ogr.CreateGeometryFromWkt(
                            f"POLYGON(({ix * TILE} {iy * TILE},{(ix + 1) * TILE} {iy * TILE},{(ix + 1) * TILE} {(iy + 1) * TILE},"
                            f"{ix * TILE} {(iy + 1) * TILE},{ix * TILE} {iy * TILE}))")
                        try:
                            part = g.Intersection(box)
                        except RuntimeError:  # a self-touching ring after the transform
                            g = g.MakeValid()
                            part = g.Intersection(box)
                        if part is None or part.IsEmpty():
                            continue
                    for poly in rings_of(part):
                        rings = [[[round(x, 7), round(y, 7)] for x, y, *_ in r] for r in poly]
                        rings = [r for r in rings if len(r) >= 4]
                        if rings:
                            tiles[(ix, iy)]["p"].append([level, code, rings])
                stats[code] += 1
                kept += 1
        for code, pts in lines:
            key = (code, pts[0], pts[-1])
            if key in seen:
                continue
            seen.add(key)
            wgs = to_wgs(pts)
            lons = [p[0] for p in wgs]
            lats = [p[1] for p in wgs]
            for cell in tiles_of((min(lons), max(lons), min(lats), max(lats))):
                tiles[cell]["l"].append([code, wgs])
        print(f"{n}/{len(zips)} {zname}: {sum(len(b) for b in bounds.values())} hranic, "
              f"{sum(len(d) for d in defs.values())} def. bodů → {kept} ploch, {len(lines)} linií", flush=True)
    # Within a tile the order of the list is the order of lookup: bridges before the ground.
    shutil.rmtree(out_dir, ignore_errors=True)
    os.makedirs(out_dir)
    for (ix, iy), t in tiles.items():
        t["p"] = [p[1:] for p in sorted(t["p"], key=lambda p: -p[0])]
        with open(os.path.join(out_dir, f"{ix}_{iy}.json"), "w") as f:
            json.dump(t, f, separators=(",", ":"))
    print(f"{len(tiles)} dlaždic v {out_dir}; plochy podle kódu: {dict(sorted(stats.items()))}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
