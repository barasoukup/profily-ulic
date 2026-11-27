# Precision and recall per source against the visual check (truth.json): the hand-made detector of run.mjs
# (kerbs[].cars) and each model's rules (a car centred in the band, or reaching 0.5 m into it).
#   python3 eval.py yolo11n-obb yolo11m-obb …
import json, sys
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
truth = json.load(open(HERE / "truth.json"))
models = sys.argv[1:]
stats = defaultdict(lambda: [0, 0, 0, 0])  # (method, source) → tp, fp, fn, tn

def add(key, pred, real):
    s = stats[key]; s[0 if pred and real else 1 if pred else 2 if real else 3] += 1

for city, cuts in truth.items():
    if city == "_": continue
    R = {str(x["n"]): x for x in json.load(open(HERE.parent / "data" / city / "results.json"))}
    M = {m: {str(x["n"]): x for x in json.load(open(HERE.parent / "data" / city / "dl" / f"{m}.json"))["cuts"]} for m in models}
    for n, by in cuts.items():
        for src, marks in by.items():
            hand = [k for w in R[n]["by"][src]["ways"] for k in w["kerbs"]]
            assert len(hand) == len(marks), (city, n, src)
            dl = {m: [k for w in M[m][n]["by"][src]["ways"] for k in w["kerbs"]] for m in models}
            for i, c in enumerate(marks):
                if c == "?": continue
                real = c == "1"
                for s in (src, "all"):
                    add(("ruční", s), bool(hand[i].get("cars")), real)
                    for m in models:
                        add((m + " střed", s), dl[m][i]["count"] >= 1, real)
                        add((m + " překryv", s), dl[m][i]["count_ovl"] >= 1, real)
                        add((m + " překryv ≥ 2", s), dl[m][i]["count_ovl"] >= 2, real)  # a row, not one passing car

print("| metoda | zdroj | pásů | auta | TP | FP | FN | přesnost | záchyt |\n|---|---|---|---|---|---|---|---|---|")
order = ["ipr10", "ipr05", "brno25", "cuzk12", "cuzk25", "all"]
for (meth, src), (tp, fp, fn, tn) in sorted(stats.items(), key=lambda kv: (kv[0][0], order.index(kv[0][1]))):
    p = f"{tp / (tp + fp):.0%}" if tp + fp else "–"
    r = f"{tp / (tp + fn):.0%}" if tp + fn else "–"
    print(f"| {meth} | {src} | {tp + fp + fn + tn} | {tp + fn} | {tp} | {fp} | {fn} | {p} | {r} |")
