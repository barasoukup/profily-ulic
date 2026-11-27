"""The app's estimate, the model and a constant measured with ONE function on the same cuts (Fable's review 18. 11. 2026):
the carriageway nearest the axis (runs of roadway and parking, gaps up to 0.6 m bridged, within 4 m of the axis, as
the truth in evaluation/ortho-osm/lib.mjs truthOf), its two kerbs; the sidewalk per side with a facade in the truth,
summed outward from the kerb until a building or the end of what the method gives. A method that finds no carriageway
counts as a miss (99 m), not as a cut left out. Paired comparison per cut with a bootstrap interval.
    python evaluation/ai-segmentation/compare.py brno estimate-brno10 ai-mnv3-rgb ai-mnv3-osm …
"""
import json, sys
from pathlib import Path
import numpy as np

CUTS = Path("/Users/barasoukupova/streetdesign/data/ai-seg/cuts")
MISS = 99.0
CARRIAGE, SIDEWALK, BUILDING, OTHER, END = 1, 2, 7, 0, -1
# the model's classes (train.py CLASSES) -> the measure's
AI = {0: CARRIAGE, 1: SIDEWALK, 2: SIDEWALK, 3: CARRIAGE, 4: OTHER, 5: OTHER, 6: BUILDING, 7: OTHER, 8: OTHER, -1: END}
# the estimate's parts (derive.js types): as regression.mjs ROAD and SIDEWALK, a cycle track counted as the truth does (703)
ROAD = {"pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu", "tramvaj_pruh", "krajnice", "parkovani", "cyklopruh",
        "ochranny_pruh", "obsluzna"}
WALK = {"chodnik", "chodnik_kola", "stezka_sdilena", "cyklostezka"}


def estimate_classes(rec, ts):
    if not rec.get("parts"):
        return None
    out = np.full(len(ts), END)
    for i, t in enumerate(ts):
        for p in rec["parts"]:
            if p["s"] <= t < p["e"]:
                out[i] = CARRIAGE if p["type"] in ROAD else SIDEWALK if p["type"] in WALK else OTHER
                break
    return out


def measure(cls, ts, truth):
    """{kerbs: [lo error, hi error], sidewalk: {side: error}} or None (no carriageway near the axis)."""
    step = ts[1] - ts[0]
    runs, start = [], None
    for i, v in enumerate(list(cls == CARRIAGE) + [False]):
        if v and start is None:
            start = i
        elif not v and start is not None:
            runs.append([start, i - 1]); start = None
    merged = []
    for r in runs:
        if merged and (r[0] - merged[-1][1] - 1) * step <= 0.6:
            merged[-1][1] = r[1]
        else:
            merged.append(r)
    gap = lambda r: 0 if ts[r[0]] <= 0 <= ts[r[1]] else min(abs(ts[r[0]]), abs(ts[r[1]]))
    near = [r for r in merged if gap(r) <= 4]
    if not near:
        return None
    r = min(near, key=gap)
    lo, hi = ts[r[0]] - step / 2, ts[r[1]] + step / 2
    tlo, thi = sorted((truth["way"]["s"], truth["way"]["e"]))
    sw = {}
    for side, rng in (("A", range(r[0] - 1, -1, -1)), ("B", range(r[1] + 1, len(ts)))):
        width = 0.0
        for i in rng:
            if cls[i] in (BUILDING, END):
                break
            if cls[i] == SIDEWALK:
                width += step
        sw[side] = width
    return {"kerbs": [lo - tlo, hi - thi], "sidewalk": sw}


def sides(truth):
    return [s for s in ("A", "B") if truth["facade"].get(s) is not None and (truth.get("side") or {}).get(s)]


def collect(city, method):
    """per cut: (|kerb errors| x2, {side: |sidewalk error|})"""
    data = json.loads((CUTS / city / f"{method}.json").read_text()) if not method.startswith("const") else None
    out = {}
    for jf in sorted((q for q in (CUTS / city).glob("*.json") if q.stem.isdigit()), key=lambda p: int(p.stem)):
        p = json.loads(jf.read_text())
        ts, truth, n = np.array(p["ts"]), p["truth"], str(p["n"])
        if method.startswith("const"):  # every sidewalk this wide (m), kerbs not estimated
            w = float(method.split("-")[1])
            out[n] = (None, {s: abs(w - truth["side"][s]["sidewalk"]) for s in sides(truth)})
            continue
        if n not in data:
            continue
        cls = estimate_classes(data[n], ts) if method.startswith("estimate") else np.array([AI[c] for c in data[n]])
        m = measure(cls, ts, truth) if cls is not None else None
        if not m:
            out[n] = ([MISS, MISS], {s: MISS for s in sides(truth)})
        else:
            out[n] = ([abs(e) for e in m["kerbs"]], {s: abs(m["sidewalk"][s] - truth["side"][s]["sidewalk"]) for s in sides(truth)})
    return out


def summary(res):
    k = np.array([e for v in res.values() if v[0] for e in v[0]])
    s = np.array([e for v in res.values() for e in v[1].values()])
    miss = sum(1 for v in res.values() if v[0] and v[0][0] >= MISS)
    kt = f"obruby medián {np.median(k):.2f} m, do 0,5 m {(k <= .5).mean():.0%}, do 1 m {(k <= 1).mean():.0%}, selhání {miss}" if len(k) else "obruby –"
    return f"{kt} · chodník medián {np.median(s):.2f} m, do 1 m {(s <= 1).mean():.0%} ({len(s)} stran)"


def paired(a, b, key, rng):
    ns = sorted(set(a) & set(b))
    if key == "kerb":
        ns = [n for n in ns if a[n][0] and b[n][0]]
        A = [np.array(a[n][0]) for n in ns]; B = [np.array(b[n][0]) for n in ns]
    else:
        ns = [n for n in ns if a[n][1]]
        A = [np.array(list(a[n][1].values())) for n in ns]; B = [np.array([b[n][1][s] for s in a[n][1]]) for n in ns]

    def d(idx):
        x = np.concatenate([A[i] for i in idx]); y = np.concatenate([B[i] for i in idx])
        return [np.median(y) - np.median(x), (y <= .5).mean() - (x <= .5).mean(), (y <= 1).mean() - (x <= 1).mean()]
    base = d(range(len(ns)))
    bs = np.array([d(rng.integers(0, len(ns), len(ns))) for _ in range(3000)])
    lo, hi = np.percentile(bs, [2.5, 97.5], axis=0)
    better = sum(B[i].mean() < A[i].mean() for i in range(len(ns))); worse = sum(B[i].mean() > A[i].mean() for i in range(len(ns)))
    f = lambda i, pct: (f"{base[i]:+.0%} [{lo[i]:+.0%}, {hi[i]:+.0%}]" if pct else f"{base[i]:+.2f} [{lo[i]:+.2f}, {hi[i]:+.2f}]")
    return f"medián {f(0, False)} m, do 0,5 m {f(1, True)}, do 1 m {f(2, True)}; lepší na {better}, horší na {worse} z {len(ns)} řezů"


def main():
    city, methods = sys.argv[1], sys.argv[2:]
    rng = np.random.default_rng(0)
    res = {m: collect(city, m) for m in methods}
    for m in methods:
        print(f"{m:28} {summary(res[m])}")
    base = methods[0]
    for m in methods[1:]:
        for key in ("kerb", "sidewalk"):
            if key == "kerb" and (base.startswith("const") or m.startswith("const")):
                continue
            print(f"  {m} proti {base}, {'obruby' if key == 'kerb' else 'chodník'}: {paired(res[base], res[m], key, rng)}")


if __name__ == "__main__":
    main()
