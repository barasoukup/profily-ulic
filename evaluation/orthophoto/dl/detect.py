# Parked cars at the kerbs by a pretrained aerial detector (Ultralytics YOLO11-OBB trained on DOTA, or OWLv2).
#   venv/bin/python detect.py <city> <model> [res m/px] [--png dir]
# Per cut, source and kerb band: cars whose centre is in the band (|u| ≤ 20 m), or that reach 0.5 m into it
# (_ovl), and the share of the 40 m along the street that their boxes cover. Output: data/<city>/dl/<model>.json.
import json, sys, time
from pathlib import Path
import numpy as np
from strip import strip, bands, ALONG

HERE = Path(__file__).resolve().parent
city, model = sys.argv[1], sys.argv[2]
res = float(sys.argv[3]) if len(sys.argv) > 3 and not sys.argv[3].startswith("--") else 0.1
pngdir = Path(sys.argv[sys.argv.index("--png") + 1]) if "--png" in sys.argv else None
WEIGHTS = Path(__import__("os").environ.get("WEIGHTS", "."))
DATA = HERE.parent / "data" / city
SOURCES = ["ipr10", "ipr05", "cuzk12", "cuzk25", "brno25"]
CONF = 0.25

if model.startswith("yolo"):
    from ultralytics import YOLO
    net = YOLO(str(WEIGHTS / f"{model}.pt"))
    CARS = {k for k, v in net.names.items() if v in ("small vehicle", "large vehicle")}
    def detect(rgb):
        """Boxes as (cx, cy, w, h, angle, conf, cls) in pixels."""
        sz = int(np.ceil(max(rgb.shape[:2]) / 32) * 32)  # no rescaling: the model sees the chosen GSD
        r = net.predict(rgb[..., ::-1], imgsz=sz, conf=CONF, verbose=False)[0].obb
        out = []
        for (cx, cy, w, h, a), c, k in zip(r.xywhr.tolist(), r.conf.tolist(), r.cls.tolist()):
            if int(k) in CARS: out.append((cx, cy, w, h, a, c, net.names[int(k)]))
        return out
else:  # OWLv2, open vocabulary: "a car seen from above"
    import torch
    from transformers import Owlv2Processor, Owlv2ForObjectDetection
    from PIL import Image
    name = "google/owlv2-base-patch16-ensemble"
    proc, net = Owlv2Processor.from_pretrained(name), Owlv2ForObjectDetection.from_pretrained(name).eval()
    TEXT = [["a car seen from above", "a van seen from above"]]
    def detect(rgb):
        h, w = rgb.shape[:2]
        with torch.no_grad():
            inp = proc(text=TEXT, images=Image.fromarray(rgb), return_tensors="pt")
            o = net(**inp)
        s = max(h, w)  # OWLv2 pads to a square
        r = proc.post_process_object_detection(o, threshold=0.25, target_sizes=torch.tensor([[s, s]]))[0]
        out = []
        for (x0, y0, x1, y1), c in zip(r["boxes"].tolist(), r["scores"].tolist()):
            bw, bh = x1 - x0, y1 - y0
            if max(bw, bh) * res > 7 or min(bw, bh) * res < 1.2: continue  # not car-sized
            out.append(((x0 + x1) / 2, (y0 + y1) / 2, bw, bh, 0.0, c, "car"))
        return out

def along(box):
    """The box's extent along the street (u, metres): its rotated corners projected on y."""
    cx, cy, w, h, a = box[:5]
    half = 0.5 * (abs(w * np.sin(a)) + abs(h * np.cos(a)))
    return ALONG - (cy + half) * res, ALONG - (cy - half) * res

def across(box, t0):
    """The box's extent across the street (t, metres)."""
    cx, cy, w, h, a = box[:5]
    half = 0.5 * (abs(w * np.cos(a)) + abs(h * np.sin(a)))
    return t0 + (cx - half) * res, t0 + (cx + half) * res

def cover(iv):
    """Share of the 40 m covered by the union of the intervals."""
    iv = sorted((max(a, -ALONG), min(b, ALONG)) for a, b in iv if b > -ALONG and a < ALONG)
    tot, end = 0.0, -ALONG
    for a, b in iv:
        if b > end: tot += b - max(a, end); end = b
    return round(tot / (2 * ALONG), 2)

def draw(rgb, boxes, t0, ways, file):
    import cv2
    im = np.ascontiguousarray(rgb[..., ::-1])
    for w in ways:
        for a, b in bands(w).values():
            for t in (a, b):
                x = int(round((t - t0) / res)); cv2.line(im, (x, 0), (x, im.shape[0]), (255, 0, 255), 1)
    for cx, cy, w, h, a, c, k in boxes:
        pts = cv2.boxPoints(((cx, cy), (w, h), np.degrees(a))).astype(np.int32)
        cv2.polylines(im, [pts], True, (0, 255, 255) if k != "large vehicle" else (0, 128, 255), 1)
    cv2.imwrite(str(file), im)

results = json.load(open(DATA / "results.json"))
out, times = [], []
for r in results:
    row = {"n": r["n"], "name": r["name"], "by": {}}
    for src in SOURCES:
        b = r["by"].get(src)
        png = DATA / "img" / src / f"{r['n']}.png"
        if not b or "error" in b or not png.exists(): continue
        rgb, t0 = strip(png, r["cut"], r["extent"], res)
        t = time.time(); boxes = detect(rgb); times.append(time.time() - t)
        ways = []
        for w in b["ways"]:
            kerbs = []
            for side, (s, e) in bands(w).items():
                inb = [x for x in boxes if s <= t0 + x[0] * res <= e]
                # Also the cars that reach ≥ 0.5 m into the band: angled and perpendicular stalls, a profile off by a metre.
                ovl = [x for x in boxes if min(e, across(x, t0)[1]) - max(s, across(x, t0)[0]) >= 0.5]
                kerbs.append({"side": side, "count": len(inb), "cover": cover([along(x) for x in inb]),
                              "count_ovl": len(ovl), "cover_ovl": cover([along(x) for x in ovl]),
                              "conf": [round(x[5], 2) for x in ovl]})
            ways.append({"s": w["s"], "e": w["e"], "kerbs": kerbs})
        row["by"][src] = {"boxes": len(boxes), "ways": ways}
        if pngdir:
            pngdir.mkdir(parents=True, exist_ok=True)
            draw(rgb, boxes, t0, b["ways"], pngdir / f"{r['n']}-{src}.jpg")
    out.append(row)
(DATA / "dl").mkdir(exist_ok=True)
tag = model + ("" if res == 0.1 else f"-{int(res * 1000)}mm")
json.dump({"model": model, "res": res, "conf": CONF, "ms_per_image": round(1000 * float(np.median(times))), "cuts": out},
          open(DATA / "dl" / f"{tag}.json", "w"), ensure_ascii=False)
print(tag, len(out), "cuts,", len(times), "images, median", round(1000 * float(np.median(times))), "ms")
