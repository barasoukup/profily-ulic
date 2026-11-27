# Review images: per cut all sources side by side at 0.1 m/px, YOLO boxes (cyan, large vehicles orange), the kerb
# bands (magenta lines) and the hand-made detector of run.mjs (magenta bar in the band: a row of cars).
#   venv/bin/python review.py <city> <model> <n> [<n> …]   → data/<city>/dl/png/<n>.jpg
import json, sys
from pathlib import Path
import numpy as np, cv2
from ultralytics import YOLO
from strip import strip, bands
import os

HERE = Path(__file__).resolve().parent
city, model, cuts = sys.argv[1], sys.argv[2], [int(x) for x in sys.argv[3:]]
DATA = HERE.parent / "data" / city
RES = 0.1
net = YOLO(str(Path(os.environ.get("WEIGHTS", ".")) / f"{model}.pt"))
R = {x["n"]: x for x in json.load(open(DATA / "results.json"))}
SOURCES = ["ipr10", "ipr05", "cuzk12", "cuzk25"] if city == "praha" else ["brno25", "cuzk12", "cuzk25"]
(DATA / "dl" / "png").mkdir(parents=True, exist_ok=True)
for n in cuts:
    r, tiles = R[n], []
    for src in SOURCES:
        rgb, t0 = strip(DATA / "img" / src / f"{n}.png", r["cut"], r["extent"], RES)
        sz = int(np.ceil(max(rgb.shape[:2]) / 32) * 32)
        o = net.predict(rgb[..., ::-1], imgsz=sz, conf=0.25, verbose=False)[0].obb
        im = np.ascontiguousarray(rgb[..., ::-1])
        x = lambda t: int(round((t - t0) / RES))
        for wi, w in enumerate(r["by"][src]["ways"]):
            for k, (a, b) in zip(w["kerbs"], bands(w).values()):
                for t in (a, b): cv2.line(im, (x(t), 0), (x(t), im.shape[0]), (255, 0, 255), 1)
                lab = f"{k['side']}{wi + 1}"  # band name: side and roadway
                cv2.putText(im, lab, (x(a), 392), 0, 0.35, (0, 0, 0), 3); cv2.putText(im, lab, (x(a), 392), 0, 0.35, (255, 0, 255), 1)
                if k.get("cars"): cv2.rectangle(im, (x(a), 195), (x(b), 205), (255, 0, 255), -1)
        for (cx, cy, bw, bh, a), k in zip(o.xywhr.tolist(), o.cls.tolist()):
            name = net.names[int(k)]
            if name not in ("small vehicle", "large vehicle"): continue
            pts = cv2.boxPoints(((cx, cy), (bw, bh), np.degrees(a))).astype(np.int32)
            cv2.polylines(im, [pts], True, (255, 255, 0) if name == "small vehicle" else (0, 128, 255), 1)
        cv2.putText(im, src, (4, 14), 0, 0.45, (0, 0, 0), 3); cv2.putText(im, src, (4, 14), 0, 0.45, (255, 255, 255), 1)
        tiles.append(np.pad(im, ((0, 6), (0, 6), (0, 0)), constant_values=255))
    if len(tiles) % 2: tiles.append(np.full_like(tiles[0], 255))
    grid = np.vstack([np.hstack(tiles[i:i + 2]) for i in range(0, len(tiles), 2)])  # two per row
    cv2.imwrite(str(DATA / "dl" / "png" / f"{n}.jpg"), grid, [cv2.IMWRITE_JPEG_QUALITY, 88])
    print(n, r["name"])
