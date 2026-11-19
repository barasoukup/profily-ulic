"""The model's probabilities along each cut, averaged along the street, and a profile that makes sense read from them
(Bára 18. 11. 2026: "chodník bývá vedle budov a vedle vozovky").

1. Along the street: the class probabilities on lines u = -12 … +12 m (every 2 m) across the street, averaged per point
   of the cut (t every 20 cm). A parked car, a tree's crown or a shadow covers a few metres of the street; the street
   itself stays the same along it.
2. The grammar of a street: the most likely sequence of parts from one end to the other (Viterbi), in this order:
       outside – sidewalk – strip – carriageway (– median – carriageway)* – strip – sidewalk – outside
   any part but the carriageway may be missing; outside = houses, yards, gardens; strip = green, parking, tree row
   between a sidewalk and the carriageway; median = green, tram bed or paving between two carriageways. Each change of
   part costs SWITCH (log), so a blip of a few pixels is not a part of its own. The cut neither starts nor ends in the
   carriageway, and within 1.5 m of the clicked OSM way (the cut's axis) lies a carriageway or a median.
Writes cuts/<city>/ai-<run>-avg.json (b) and ai-<run>-avg-vit.json (c) with the classes compare.py reads.
    python evaluation/ai-segmentation/decode.py <run> <city> [--switch 6] [--along 12]
"""
import json, math, sys
from pathlib import Path

import numpy as np
import torch
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from fetch_ortho import CUTS, merc
from train import CLASSES, HINTS, MEAN, STD, build, osm_channels, patch_box

RUNS = Path("/Users/barasoukupova/streetdesign/data/ai-seg/runs")
C = {c: i for i, c in enumerate(CLASSES)}  # roadway sidewalk cycleway parking tram green building paved water
# The parts of the grammar and the model's classes each may show.
STATES = ["out_A", "walk_A", "strip_A", "road", "median", "strip_B", "walk_B", "out_B"]
SHOWS = {
    "out": ["building", "green", "paved", "water", "tram", "parking", "sidewalk", "cycleway"],
    "walk": ["sidewalk", "cycleway"],
    "strip": ["green", "parking", "paved", "tram"],
    "road": ["roadway", "parking"],
    "median": ["green", "tram", "paved", "sidewalk"],
}
# What may follow what (left to right, A to B): forward only, parts may be skipped, the carriageway is required and
# a median leads back to a carriageway.
NEXT = {
    "out_A": ["walk_A", "strip_A", "road"], "walk_A": ["strip_A", "road"], "strip_A": ["road"],
    "road": ["median", "strip_B", "walk_B", "out_B"], "median": ["road"],
    "strip_B": ["walk_B", "out_B"], "walk_B": ["out_B"], "out_B": [],
}
# The outside favours what is not street: a sidewalk there is weaker evidence than in a "walk" part.
OUT_WEIGHT = {"sidewalk": 0.3, "cycleway": 0.3, "parking": 0.5}


def emissions(P):
    """log P(part | the point's class probabilities), per point x part."""
    E = np.zeros((len(P), len(STATES)))
    for j, s in enumerate(STATES):
        kind = s.split("_")[0]
        w = np.zeros(len(CLASSES))
        for c in SHOWS[kind]:
            w[C[c]] = OUT_WEIGHT.get(c, 1.0) if kind == "out" else 1.0
        E[:, j] = np.log(P @ w + 1e-4)
    return E


AXIS = 1.5  # m: the clicked OSM way lies on a carriageway (or a median between two): only those parts there


def viterbi(P, switch, ts):
    E = emissions(P)
    road_only = np.abs(np.asarray(ts)) <= AXIS
    for j, s in enumerate(STATES):
        if s not in ("road", "median"):
            E[road_only, j] = -1e9
    n, k = E.shape
    idx = {s: i for i, s in enumerate(STATES)}
    score = np.full((n, k), -np.inf)
    back = np.zeros((n, k), int)
    # start and end beside the street, never in the carriageway (the cut reaches 40 m each way)
    for s in ["out_A", "walk_A", "strip_A"]:
        score[0, idx[s]] = E[0, idx[s]]
    for i in range(1, n):
        for j, s in enumerate(STATES):
            best, arg = score[i - 1, j], j  # stay
            for p, ps in enumerate(STATES):
                if s in NEXT[ps] and score[i - 1, p] - switch > best:
                    best, arg = score[i - 1, p] - switch, p
            score[i, j] = best + E[i, j]
            back[i, j] = arg
    ends = [idx[s] for s in ["strip_B", "walk_B", "out_B"]]
    j = max(ends, key=lambda e: score[-1, e])
    path = [j]
    for i in range(n - 1, 0, -1):
        j = back[i, j]
        path.append(j)
    return [STATES[j] for j in reversed(path)]


def to_classes(path, P):
    """The decoded parts as the classes compare.py measures: the carriageway, the sidewalk, a building (where the
    outside is most likely a building: the sidewalk is measured up to it), else other."""
    out = []
    for s, p in zip(path, P):
        kind = s.split("_")[0]
        out.append(C["roadway"] if kind == "road" else C["sidewalk"] if kind == "walk"
                   else C["building"] if kind == "out" and p.argmax() == C["building"] else C["paved"])
    return out


def main():
    args = sys.argv[1:]
    opt = lambda k, d: float(args[args.index(k) + 1]) if k in args else d
    switch, along = opt("--switch", 6.0), opt("--along", 12.0)
    run, city = [a for i, a in enumerate(args) if not a.startswith("--") and (i == 0 or not args[i - 1].startswith("--"))][:2]
    meta = json.loads((RUNS / run / "metrics.json").read_text())
    osm = bool(meta.get("osm"))
    model = build(meta["model"], pretrained=False, channels=3 + (len(HINTS) if osm else 0))
    model.load_state_dict(torch.load(RUNS / run / "model.pt", map_location="cpu"))
    dev = "mps" if torch.backends.mps.is_available() else "cpu"
    model = model.to(dev).eval()
    avg, vit = {}, {}
    us = np.arange(-along, along + 0.01, 2.0)
    for jf in sorted((q for q in (CUTS / city).glob("*.json") if q.stem.isdigit()), key=lambda p: int(p.stem)):
        jpg = jf.with_suffix(".jpg")
        if not jpg.exists():
            continue
        p = json.loads(jf.read_text())
        img = np.asarray(Image.open(jpg).convert("RGB"), np.float32) / 255
        if osm:
            img = np.concatenate([img, osm_channels(jf).astype(np.float32) / 255], axis=2)
        x = img.copy(); x[..., :3] = (x[..., :3] - MEAN) / STD
        with torch.no_grad():
            prob = torch.softmax(model(torch.from_numpy(x.transpose(2, 0, 1)[None].copy()).float().to(dev)), 1)[0].cpu().numpy()
        b, _ = patch_box(p)
        px = p["px"]
        sx, sy = px / (b[2] - b[0]), px / (b[3] - b[1])
        c = p["cut"]
        br = math.radians(c["bearing"])
        d, nrm = (math.sin(br), math.cos(br)), (-math.cos(br), math.sin(br))
        kx, ky = 111320 * math.cos(math.radians(c["lat"])), 110574
        P = np.zeros((len(p["ts"]), len(CLASSES)))
        for i, t in enumerate(p["ts"]):
            acc, m = np.zeros(len(CLASSES)), 0
            for u in us:
                lon, lat = c["lon"] + (nrm[0] * t + d[0] * u) / kx, c["lat"] + (nrm[1] * t + d[1] * u) / ky
                mx, my = merc(lon, lat)
                col, row = int((mx - b[0]) * sx), int((b[3] - my) * sy)
                if 0 <= row < px and 0 <= col < px:
                    acc += prob[:, row, col]; m += 1
            P[i] = acc / m if m else np.full(len(CLASSES), 1 / len(CLASSES))
        avg[p["n"]] = [int(v) for v in P.argmax(1)]
        vit[p["n"]] = to_classes(viterbi(P, switch, p["ts"]), P)
    tag = f"ai-{run}-avg" + ("" if along == 12 else f"{int(along)}")
    (CUTS / city / f"{tag}.json").write_text(json.dumps(avg))
    (CUTS / city / f"{tag}-vit{'' if switch == 6 else int(switch)}.json").write_text(json.dumps(vit))
    print(city, tag, len(avg), "cuts")


if __name__ == "__main__":
    main()
