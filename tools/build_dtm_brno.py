"""Brno technical-map tiles from the public DTM of Jihomoravský kraj (IS DMVS ČÚZK).

The public data sets are free to download without logging in, one zip per Brno district (MOMC):
ZPS "kresba" (ZPS_KR) and the transport infrastructure (DI). In ZPS_KR the surfaces are not polygons:
an area is drawn by its boundary lines and named by a definition point inside it (e.g. "pokdef" =
provozní plocha pozemní komunikace). This script

1. reads all districts together, so an area on a district border closes (the lines of both sides);
2. closes small gaps: a line end that stops short of another line (up to GAP m) is joined to it;
3. polygonizes the lines in overlapping windows and names each polygon by the definition points in it,
   turning the DTM classes into the codes of Prague's MTVU (so derive.js reads Brno as it reads Prague);
4. completes what the public DTM leaves open (Bára: where the boundaries are, the kind can be inferred).
   Many streets, above all the big roads, lack the kerb line between the roadway and its sidewalks, so
   roadway, sidewalks and greenery run together into one area. Such an area (or one with no
   definition point) is split along OSM: a band round each street axis as wide as its lanes (width,
   lanes tags) is roadway, the rest is cut into pieces, each named by the definition points in it, a
   narrow piece next to the roadway with none taken for a sidewalk. These parts are marked as
   estimated (the app shows them as "odhad");
5. writes small grid tiles in WGS 84:

  data/dtm-tiles/<ix>_<iy>.json = {"p": [[code, [ring, …], guess?], …], "l": [[code, [[lon, lat], …]], …]}

p are the surfaces (rings of [lon, lat]; a third element 1 marks an estimated part), l the barrier lines
(fences, walls, railings, guard rails, terrain edges) under the codes of IPR's line layer and the tram
track axes of the DI (code 55010, as IPR's). Tiles are 0.005° like the OSM tiles.

Run with QGIS's Python (GDAL and shapely 2):
  Q=/Applications/QGIS-final-4_2_3.app/Contents
  PROJ_DATA=$Q/Resources/qgis/proj GDAL_DATA=$Q/Resources/qgis/gdal \\
    $Q/MacOS/python tools/build_dtm_brno.py data/dtm-brno/zip data/osm/brno_ways.geojsonl pilot/data/brno/dtm-tiles
On GitHub Actions: python3 with python3-gdal and shapely. The zips come from tools/fetch_dtm_brno.sh, the
OSM ways from tools/build_osm_data.sh (NAME=brno).
"""
import json
import math
import multiprocessing
import os
import re
import shutil
import sys
import xml.etree.ElementTree as ET
import zipfile
from collections import defaultdict

import numpy as np
import shapely
from shapely import LineString, Point, Polygon, MultiPolygon, STRtree
from osgeo import osr

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
    "mpzdef": 402,  # meliorační příkop, žlab: along roads a drainage gutter, not water (test of 100 cuts)
    "zahdef": 300,  # zahrada
    "lesdef": 200,  # les
    "zepdef": 100,  # zemědělská plocha
    "votdef": 501, "sukdef": 501,  # watercourse, channel
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
RANK = {c: k for k, c in enumerate(PRIORITY)}
ROAD = {701, 704, 705}
SIDE = {702, 703, 401, 402, 300}  # what lies beside a roadway behind a kerb

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
TRAM_AXIS = "osktra"  # DI: osa koleje tramvajové dráhy → IPR code 55010

GAP = 1.0  # m: a line end this close to another line is joined to it
CELL, MARGIN = 1000.0, 450.0  # m: windows for polygonizing (core cell plus margin on every side)
GUESS_WIDTH = 10.0  # m: mean width up to which a piece without a definition point next to roadway is sidewalk
MERGED_AREA = 4000.0  # m²: an area holding roadway and other kinds above this is split along OSM
# OSM streets that are roadway, and their lane width (m) when the width is not tagged.
OSM_ROADS = {"motorway": 3.5, "trunk": 3.5, "primary": 3.25, "secondary": 3.25, "tertiary": 3.0,
             "motorway_link": 3.5, "trunk_link": 3.5, "primary_link": 3.25, "secondary_link": 3.25, "tertiary_link": 3.0,
             "unclassified": 3.0, "residential": 3.0, "living_street": 3.0, "service": 3.0}

SRC = osr.SpatialReference()
SRC.ImportFromEPSG(5514)
DST = osr.SpatialReference()
DST.ImportFromEPSG(4326)
for s in (SRC, DST):
    s.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
TO_WGS = osr.CoordinateTransformation(SRC, DST)
TO_JTSK = osr.CoordinateTransformation(DST, SRC)
# ONLY="lon,lat;lon,lat": build only the windows holding these points (to try a change quickly).
ONLY = [TO_JTSK.TransformPoint(*map(float, q.split(",")))[:2] for q in os.environ.get("ONLY", "").split(";") if q]


def local(tag):
    return tag.split("}", 1)[-1]


def coords(text, dim):
    v = text.split()
    return [(float(v[i]), float(v[i + 1])) for i in range(0, len(v), dim)]


def read_zip(path, bounds, defs, lines, tracks):
    """Boundary lines and definition points per level, barrier lines and tram axes of one zip."""
    di = path.endswith("_DI.jvf.zip")  # from the DI only the tram axes: its road axes and parcel
    with zipfile.ZipFile(path) as z:  # outlines would cut the areas (the test of 100 cuts, Fišova)
        name = next(n for n in z.namelist() if n.endswith(".xml"))
        with z.open(name) as f:
            for _, el in ET.iterparse(f, events=("end",)):
                if local(el.tag) != "ZaznamObjektu":
                    continue
                ns = el.tag[1:].split("}")[0]
                if di and ns != TRAM_AXIS:
                    el.clear()
                    continue
                lvl = el.find(f".//{ATR}UrovenUmisteniObjektuZPS")
                if lvl is None:
                    lvl = el.find(f".//{ATR}UrovenUmisteniObjektuDI")
                level = int(lvl.text) if lvl is not None and lvl.text else 0
                if level < 0:
                    el.clear()
                    continue
                level = min(level, 1)  # 0 = on the ground, 1 = above it (bridges)
                # Coordinates stay exact: a line ending on another one must still touch it (rounded,
                # it ends a few mm short and the areas on both sides run together). Lines that come in
                # two districts are the same text, so they are kept once by their exact coordinates.
                if ns in AREA:
                    pos = el.find(f".//{GML}pos")
                    if pos is not None:
                        x, y = coords(pos.text, 3)[0]
                        defs[level].add((x, y, AREA[ns]))
                elif ns not in NOT_BOUNDARY:
                    for ls in el.iter(GML + "LineString"):
                        pts = tuple(coords(ls.find(GML + "posList").text, int(ls.get("srsDimension", "2"))))
                        if len(pts) < 2:
                            continue
                        if ns == TRAM_AXIS:
                            if level == 0:
                                tracks.add(pts)
                            continue
                        bounds[level].add(pts)
                        if ns in LINES and level == 0:
                            lines.add((LINES[ns], pts))
                el.clear()


def read_osm(path):
    """OSM street axes in S-JTSK with the roadway width they get: [(LineString, half width)]."""
    out = []
    with open(path) as f:
        for line in f:
            if not line.strip():
                continue
            feat = json.loads(line)
            p = feat["properties"]
            hw = p.get("highway")
            if hw not in OSM_ROADS or feat["geometry"]["type"] != "LineString":
                continue
            other = p.get("other_tags") or ""
            tag = lambda k: (m.group(1) if (m := re.search(rf'"{re.escape(k)}"=>"([^"]*)"', other)) else None)
            if (tag("tunnel") or "no") != "no" or (tag("layer") or "0").lstrip("-").isdigit() and int(tag("layer") or 0) < 0:
                continue
            if hw == "service" and tag("service") in ("parking_aisle", "driveway", "drive-through"):
                continue
            width = None
            try:
                width = float((tag("width") or "").replace(",", ".").replace(" m", ""))
            except ValueError:
                pass
            if not width:
                try:
                    lanes = int(tag("lanes") or 0)
                except ValueError:
                    lanes = 0
                oneway = tag("oneway") in ("yes", "1", "-1") or hw.endswith("_link") and tag("oneway") != "no"
                lanes = lanes or (1 if oneway or hw in ("service", "living_street") else 2)
                width = lanes * OSM_ROADS[hw]
            pts = [TO_JTSK.TransformPoint(lon, lat)[:2] for lon, lat in feat["geometry"]["coordinates"]]
            out.append((LineString(pts), width / 2))
    return out


def close_gaps(lines):
    """Join every line end that touches no other line to the nearest other line within GAP m."""
    geoms = np.array(lines, dtype=object)
    tree = STRtree(geoms)
    starts = shapely.get_point(geoms, 0)
    ends = shapely.get_point(geoms, -1)
    pts = np.concatenate([starts, ends])
    own = np.concatenate([np.arange(len(geoms)), np.arange(len(geoms))])
    # ends that touch another line are fine; the rest are dangles
    p_idx, g_idx = tree.query(pts, predicate="dwithin", distance=1e-6)
    touched = np.zeros(len(pts), bool)
    touched[p_idx[g_idx != own[p_idx]]] = True
    loose = np.flatnonzero(~touched)
    if not len(loose):
        return []
    p_idx, g_idx = tree.query(pts[loose], predicate="dwithin", distance=GAP)
    keep = g_idx != own[loose][p_idx]
    p_idx, g_idx = p_idx[keep], g_idx[keep]
    if not len(p_idx):
        return []
    d = shapely.distance(pts[loose][p_idx], geoms[g_idx])
    best = {}
    for k, (pi, gi) in enumerate(zip(p_idx, g_idx)):
        if pi not in best or d[k] < best[pi][0]:
            best[pi] = (d[k], gi)
    return [shapely.shortest_line(pts[loose][pi], geoms[gi]) for pi, (_, gi) in best.items()]


def kinds(poly, defs_tree, defs_pts, defs_code):
    idx = defs_tree.query(poly, predicate="contains")
    return [int(defs_code[i]) for i in idx]


def best(codes):
    return min(codes, key=lambda c: RANK.get(c, 99)) if codes else None


def split_merged(poly, roads, roads_tree, defs_tree, defs_pts, defs_code):
    """Parts of one area that runs together what kerbs should part: (code, polygon, estimated).
    A band round each OSM street axis as wide as its lanes is roadway; the rest is shared out to the
    definition points in it, each taking what lies nearer to it than to the others (Voronoi cells)."""
    out = []
    rest = poly
    near = roads_tree.query(poly, predicate="intersects")
    if len(near):
        band = shapely.union_all([roads[i][0].buffer(roads[i][1], cap_style="flat") for i in near]).intersection(poly)
        if not band.is_empty and band.area >= 20:
            out.append((701, band, True))
            rest = poly.difference(band)
    idx = defs_tree.query(rest, predicate="contains") if not rest.is_empty else []
    if not len(idx):
        return out
    if len(idx) == 1:
        cells = [(int(defs_code[idx[0]]), rest)]
    else:
        pts = defs_pts[idx]
        vor = shapely.voronoi_polygons(shapely.MultiPoint(list(pts)), extend_to=rest.envelope)
        cells = []
        for cell in shapely.get_parts(vor):
            inside = [k for k, q in enumerate(pts) if cell.contains(q)]
            if inside:
                cells.append((int(defs_code[idx[inside[0]]]), cell.intersection(rest)))
    by_code = defaultdict(list)
    for code, g in cells:
        if not g.is_empty:
            by_code[code].append(g)
    for code, gs in by_code.items():
        merged = shapely.union_all(gs)
        for piece in (shapely.get_parts(merged) if merged.geom_type != "Polygon" else [merged]):
            if piece.geom_type == "Polygon" and piece.area >= 1:
                out.append((code, piece, True))
    return out


def polygonize_window(lines_tree, lines_geoms, box, defs, roads, roads_tree):
    """Named polygons of one window: [(code, polygon, estimated)]."""
    idx = lines_tree.query(box, predicate="intersects")
    if not len(idx):
        return []
    win = list(lines_geoms[idx])
    win += close_gaps(win)
    # The window edge closes what runs out of it: where kerbs are missing, roadway, sidewalks and
    # greenery of a whole quarter can be one area, larger than any window (Hněvkovského, Zborovská).
    # Not for bridges: there the rest of the window would become one area above the ground.
    if roads is not None:
        win.append(box.exterior)
    polys = list(shapely.get_parts(shapely.polygonize(shapely.get_parts(shapely.union_all(win)))))
    defs_tree, defs_pts, defs_code = defs
    found = []
    for p in polys:
        codes = kinds(p, defs_tree, defs_pts, defs_code)
        found.append(codes)
    out = []
    named = {}
    handled = set()
    for i, (p, codes) in enumerate(zip(polys, found)):
        if p.area > MERGED_AREA and roads is not None:
            # a large area holding several kinds, or a street with no roadway point: kerbs are missing
            on_street = len(roads_tree.query(p, predicate="intersects")) > 0
            if len(set(codes)) > 1 or (on_street and 701 not in codes):
                out += split_merged(p, roads, roads_tree, defs_tree, defs_pts, defs_code)
                handled.add(i)
                continue
        if not codes and roads is not None and len(roads_tree.query(p, predicate="intersects")):
            out += split_merged(p, roads, roads_tree, defs_tree, defs_pts, defs_code)
            handled.add(i)
            continue
        if codes:
            named[i] = best(codes)
            out.append((named[i], p, False))
    # A narrow piece without a definition point next to roadway (and not shut in between roadways,
    # like a median) is taken for a sidewalk, as before.
    ptree = STRtree(polys)
    for i, p in enumerate(polys):
        if found[i] or i in named or i in handled:
            continue
        if p.area < 3 or 2 * p.area / p.length > GUESS_WIDTH:
            continue
        nb = [named.get(j) for j in ptree.query(p, predicate="touches") if j != i]
        if any(c in ROAD for c in nb) and any(c is not None and c not in ROAD for c in nb):
            out.append((702, p, True))
    return out


JOB = None


def window_job(cell):
    """Parts of one window that belong to its core (by their representative point), as WKB."""
    cx, cy = cell
    tree, geoms, defs, roads, roads_tree = JOB
    core = shapely.box(cx, cy, cx + CELL, cy + CELL)
    box = shapely.box(cx - MARGIN, cy - MARGIN, cx + CELL + MARGIN, cy + CELL + MARGIN)
    got = polygonize_window(tree, geoms, box, defs, roads, roads_tree)
    return [(code, shapely.to_wkb(p), guess) for code, p, guess in got if core.contains(p.representative_point())]


def to_wgs_rings(poly):
    rings = [poly.exterior, *poly.interiors]
    out = []
    for r in rings:
        pts = TO_WGS.TransformPoints(list(r.coords))
        ring = []
        for lon, lat, *_ in pts:
            q = [round(lon, 7), round(lat, 7)]
            if not ring or ring[-1] != q:
                ring.append(q)
        if len(ring) >= 4:
            out.append(ring)
    return out


def tiles_of(env):
    lon0, lat0, lon1, lat1 = env
    return [(ix, iy) for ix in range(math.floor(lon0 / TILE), math.floor(lon1 / TILE) + 1)
            for iy in range(math.floor(lat0 / TILE), math.floor(lat1 / TILE) + 1)]


def main(src_dir, osm_path, out_dir):
    bounds, defs, lines, tracks = defaultdict(set), defaultdict(set), set(), set()
    zips = sorted(f for f in os.listdir(src_dir) if f.endswith(("_ZPS_KR.jvf.zip", "_DI.jvf.zip")))
    for n, z in enumerate(zips, 1):
        read_zip(os.path.join(src_dir, z), bounds, defs, lines, tracks)
        print(f"{n}/{len(zips)} {z}", flush=True)
    print(f"hranic {sum(len(b) for b in bounds.values())}, def. bodů {sum(len(d) for d in defs.values())}, "
          f"linií {len(lines)}, os kolejí {len(tracks)}", flush=True)
    roads = read_osm(osm_path)
    roads_tree = STRtree([r[0] for r in roads])
    print(f"ulic z OSM {len(roads)}", flush=True)

    parts = []  # (level, code, polygon in S-JTSK, estimated)
    for level in (1, 0):
        geoms = np.array([LineString(l) for l in bounds[level]], dtype=object)
        if not len(geoms):
            continue
        tree = STRtree(geoms)
        dl = sorted(defs[level])
        dpts = np.array([Point(x, y) for x, y, _ in dl], dtype=object)
        dcode = np.array([c for _, _, c in dl])
        dtree = STRtree(dpts)
        x0, y0, x1, y1 = shapely.total_bounds(geoms)
        cells = [(cx, cy) for cx in np.arange(math.floor(x0 / CELL) * CELL, x1, CELL) for cy in np.arange(math.floor(y0 / CELL) * CELL, y1, CELL)]
        if ONLY:  # trial run: only the cells holding these points
            cells = [c for c in cells if any(c[0] <= x < c[0] + CELL and c[1] <= y < c[1] + CELL for x, y in ONLY)]
        global JOB
        JOB = (tree, geoms, (dtree, dpts, dcode), roads if level == 0 else None, roads_tree)
        # windows are independent: one per processor core (the data is shared by fork)
        with multiprocessing.get_context("fork").Pool() as pool:
            for k, got in enumerate(pool.imap_unordered(window_job, cells, chunksize=2)):
                parts += [(level, code, shapely.from_wkb(w), guess) for code, w, guess in got]
                if k % 50 == 0:
                    print(f"úroveň {level}: okno {k + 1}/{len(cells)}, ploch {len(parts)}", flush=True)

    tiles = defaultdict(lambda: {"p": [], "l": []})
    stats = defaultdict(int)
    for level, code, p, guess in parts:
        polys = [p] if p.geom_type == "Polygon" else [g for g in getattr(p, "geoms", []) if g.geom_type == "Polygon"]
        for poly in polys:
            rings = to_wgs_rings(poly)
            if not rings:
                continue
            wgs = Polygon(rings[0], rings[1:])
            if not wgs.is_valid:
                wgs = shapely.make_valid(wgs)
            for ix, iy in tiles_of(wgs.bounds):
                cell = shapely.box(ix * TILE, iy * TILE, (ix + 1) * TILE, (iy + 1) * TILE)
                piece = wgs if cell.contains(wgs) else wgs.intersection(cell)
                for g in ([piece] if piece.geom_type == "Polygon" else [q for q in getattr(piece, "geoms", []) if q.geom_type == "Polygon"]):
                    if g.is_empty:
                        continue
                    rr = [[[round(x, 7), round(y, 7)] for x, y in r.coords] for r in [g.exterior, *g.interiors]]
                    rec = [level, code, rr] + ([1] if guess else [])
                    tiles[(ix, iy)]["p"].append(rec)
            stats[(code, guess)] += 1
    for code, pts in [*lines, *((55010, t) for t in tracks)]:
        wgs = [[round(lon, 7), round(lat, 7)] for lon, lat, *_ in TO_WGS.TransformPoints(list(pts))]
        lons = [q[0] for q in wgs]
        lats = [q[1] for q in wgs]
        for cell in tiles_of((min(lons), min(lats), max(lons), max(lats))):
            tiles[cell]["l"].append([code, wgs])
    # Within a tile the order of the list is the order of lookup: bridges before the ground.
    shutil.rmtree(out_dir, ignore_errors=True)
    os.makedirs(out_dir)
    for (ix, iy), t in tiles.items():
        t["p"] = [p[1:] for p in sorted(t["p"], key=lambda p: -p[0])]
        with open(os.path.join(out_dir, f"{ix}_{iy}.json"), "w") as f:
            json.dump(t, f, separators=(",", ":"))
    measured = {c: n for (c, g), n in sorted(stats.items()) if not g}
    guessed = {c: n for (c, g), n in sorted(stats.items()) if g}
    print(f"{len(tiles)} dlaždic v {out_dir}; plochy podle kódu: {measured}; domyšlené: {guessed}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3])
