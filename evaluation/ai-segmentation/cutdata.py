"""Cuts across streets for a model whose output is the cut itself (Bára 18. 11. 2026: "výstupem spíš odhadovaný řez než
mapa povrchu"), made from the patches already fetched (sample.mjs, fetch_ortho.py, osm.mjs), no new request.

For every OSM street (car road) passing near a patch's centre, cuts across it: a strip turned so the street runs
along it, t across the street (-19.2 … +19.2 m, 192 points of 20 cm) and u along it (-6.4 … +6.4 m, 64 points):
the photo and the OSM hints resampled on that grid, and the truth over the whole strip from the patch's labels (v1 taught only the line u = 0: 60 times less to learn from).
The same function makes the strip of a test cut (cuts.mjs, target-truth.mjs: lat, lon, bearing of the cut).
    python evaluation/ai-segmentation/cutdata.py praha wien berlin hamburg   → data/ai-seg/cutsets/<city>.npz
"""
import json, math, sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from train import osm_channels

ROOT = Path("/Users/barasoukupova/streetdesign/data/ai-seg")
NT, NU, RES = 192, 64, 0.2
TS = (np.arange(NT) - (NT - 1) / 2) * RES   # across the street, m
US = (np.arange(NU) - (NU - 1) / 2) * RES   # along it, m
REACH = math.hypot(TS[-1], US[-1])          # how far from the cut's centre the strip reaches


def local(p, lon, lat):
    """east, north metres of a point from the patch's centre"""
    kx, ky = 111320 * math.cos(math.radians(p["lat"])), 110574
    return (lon - p["lon"]) * kx, (lat - p["lat"]) * ky


def strip(arr, p, east, north, bearing, order=1):
    """arr (H, W, C) of the patch (20 cm, its centre at the middle) sampled on the cut's grid → (NU, NT, C)."""
    h, w = arr.shape[:2]
    b = math.radians(bearing)
    d = np.array([math.sin(b), math.cos(b)])      # along the street (east, north)
    n = np.array([-math.cos(b), math.sin(b)])     # across it, t (as lib.mjs frame: normal = dir turned left)
    E = east + TS[None, :] * n[0] + US[:, None] * d[0]
    N = north + TS[None, :] * n[1] + US[:, None] * d[1]
    col = (w - 1) / 2 + E / RES
    row = (h - 1) / 2 - N / RES
    if order == 0:
        r, c = np.clip(np.rint(row).astype(int), 0, h - 1), np.clip(np.rint(col).astype(int), 0, w - 1)
        out = arr[r, c]
        out[(row < 0) | (row > h - 1) | (col < 0) | (col > w - 1)] = 0
        return out
    r0, c0 = np.floor(row).astype(int), np.floor(col).astype(int)
    fr, fc = (row - r0)[..., None], (col - c0)[..., None]
    g = lambda rr, cc: arr[np.clip(rr, 0, h - 1), np.clip(cc, 0, w - 1)].astype(np.float32)
    return g(r0, c0) * (1 - fr) * (1 - fc) + g(r0, c0 + 1) * (1 - fr) * fc + g(r0 + 1, c0) * fr * (1 - fc) + g(r0 + 1, c0 + 1) * fr * fc


def inputs(jf, p):
    img = np.asarray(Image.open(jf.with_suffix(".jpg")).convert("RGB"), np.float32) / 255
    osm = osm_channels(jf).astype(np.float32) / 255
    return np.concatenate([img, osm], axis=2)


def cuts_of_patch(p, hints, room):
    """Cut centres and bearings: on each car road of OSM, the points within `room` m of the patch's centre, every 2 m."""
    out = []
    for h in hints:
        if h["k"] != "road" or len(h["pts"]) < 2:
            continue
        pts = [local(p, *q) for q in h["pts"]]
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            L = math.hypot(x1 - x0, y1 - y0)
            if L < 1:
                continue
            for s in np.arange(0, L, 2.0):
                x, y = x0 + (x1 - x0) * s / L, y0 + (y1 - y0) * s / L
                if math.hypot(x, y) <= room:
                    out.append((x, y, math.degrees(math.atan2(x1 - x0, y1 - y0))))
    return out


def build(city):
    d = ROOT / "patches" / city
    X, Y, meta = [], [], []
    for jf in sorted((q for q in d.glob("*.json") if q.stem.isdigit()), key=lambda q: int(q.stem)):
        if not jf.with_suffix(".jpg").exists() or not jf.with_suffix(".png").exists():
            continue
        p = json.loads(jf.read_text())
        half = p["half"]
        room = half - REACH
        if room <= 0:
            continue
        hints = json.loads(jf.with_suffix(".osm.json").read_text())
        arr = inputs(jf, p)
        lab = np.asarray(Image.open(jf.with_suffix(".png")), np.uint8)[..., None]
        for east, north, bearing in cuts_of_patch(p, hints, room):
            x = strip(arr, p, east, north, bearing)
            y = strip(lab, p, east, north, bearing, order=0)[..., 0]  # the truth over the whole strip (NU, NT)
            if (y[NU // 2] == 1).sum() < 10:  # no roadway on the cut: not a street cut (a bridge, a mapping gap)
                continue
            X.append((x * 255).astype(np.uint8)); Y.append(y); meta.append((int(jf.stem), east, north, bearing))
    np.savez_compressed(ROOT / "cutsets" / f"{city}.npz", X=np.stack(X), Y=np.stack(Y), meta=np.array(meta))
    print(city, len(X), "cuts")


if __name__ == "__main__":
    (ROOT / "cutsets").mkdir(exist_ok=True)
    for c in sys.argv[1:]:
        build(c)
