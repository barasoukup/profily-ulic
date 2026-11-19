"""Train a small segmentation model on the patches (sample.mjs, fetch_ortho.py) and test it on other cities.

    python evaluation/ai-segmentation/train.py --train praha,wien,berlin --test brno,hamburg --model mnv3 --epochs 30
Writes data/ai-seg/runs/<name>/ (weights, metrics.json) and prints the IoU per class and city.
Class 0 of the labels (no data) is ignored; the model predicts the 9 others.
"""
import argparse, json, math, random, time
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image, ImageDraw
import sys
sys.path.insert(0, str(Path(__file__).parent))
from fetch_ortho import PX, merc
import segmentation_models_pytorch as smp

ROOT = Path("/Users/barasoukupova/streetdesign/data/ai-seg")
CLASSES = ["roadway", "sidewalk", "cycleway", "parking", "tram", "green", "building", "paved", "water"]
MEAN = np.array([0.485, 0.456, 0.406], np.float32)
STD = np.array([0.229, 0.224, 0.225], np.float32)
IGNORE = 255


# OSM hints (osm.mjs) as extra input channels, drawn on the patch's grid (fetch_ortho.py).
HINTS = ["road", "road-width", "foot", "cycle", "tram", "building", "green", "parking"]
ROAD_M = {"motorway": 7.5, "trunk": 7, "primary": 7, "secondary": 6.5, "tertiary": 6, "unclassified": 5, "residential": 5,
          "living_street": 4, "service": 3.5, "busway": 3.5}


def patch_box(p):
    x0, y0 = merc(p["box"][0], p["box"][1])
    x1, y1 = merc(p["box"][2], p["box"][3])
    k = math.cos(math.radians(p["lat"]))
    h = p["half"] / k
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    return (cx - h, cy - h, cx + h, cy + h), k


def osm_channels(jf):
    cache = jf.with_suffix(".osm.npy")
    if cache.exists():
        return np.load(cache)
    p = json.loads(jf.read_text())
    hints = json.loads(jf.with_suffix(".osm.json").read_text())
    b, k = patch_box(p)
    PX = p.get("px", 320)
    px_m = PX / (b[2] - b[0]) / k  # pixels per ground metre
    sx, sy = PX / (b[2] - b[0]), PX / (b[3] - b[1])
    xy = lambda pts: [((mx - b[0]) * sx, (b[3] - my) * sy) for mx, my in (merc(*q) for q in pts)]
    layers = {h: Image.new("L", (PX, PX), 0) for h in HINTS}
    for h in hints:
        pts = xy(h["pts"])
        if len(pts) < 2:
            continue
        kind = h["k"]
        if kind in ("building", "green", "parking") or (kind == "foot" and "hw" not in h):
            if len(pts) >= 3:
                ImageDraw.Draw(layers[kind]).polygon(pts, fill=255)
            continue
        width = {"road": 1.2, "foot": 1.0, "cycle": 1.0, "tram": 1.5}[kind]
        ImageDraw.Draw(layers[kind]).line(pts, fill=255, width=max(1, round(width * px_m)))
        if kind == "road":  # the roadway as OSM suggests it: lanes x 3 m, else by the kind of road
            w = (h.get("lanes") or 0) * 3.0 or 2 * ROAD_M.get(h.get("hw"), 5)
            ImageDraw.Draw(layers["road-width"]).line(pts, fill=255, width=max(1, round(w * px_m)))
    arr = np.stack([np.asarray(layers[h], np.uint8) for h in HINTS], axis=2)
    np.save(cache, arr)
    return arr


# Five basic kinds (Bára 18. 11. 2026): carriageway (with parking), sidewalk (with cycle track), green, building, other.
KINDS5 = ["carriageway", "sidewalk", "green", "building", "other"]
TO5 = np.array([IGNORE, 0, 1, 1, 0, 4, 2, 3, 4, 4])  # the label rasters' 0 (no data) … 9 → the five kinds
# the five kinds → the nine classes the measurement reads (compare.py AI: roadway 0, sidewalk 1, green 5, building 6, paved 7)
FIVE_TO_NINE = [0, 1, 5, 6, 7]


def easy(p):
    """A characteristic patch to begin with (Bára 18. 11. 2026): a plain street, a fair share of carriageway and a sidewalk
    beside it, at most half without data (Berlin's and Hamburg's street maps leave yards and blocks out)."""
    s = p.get("shares") or []
    return len(s) > 2 and s[0] <= 0.5 and 0.15 <= s[1] <= 0.45 and s[2] >= 0.08


def load(city, osm=False, five=False, with_easy=False):
    d = ROOT / "patches" / city
    out = []
    for jpg in sorted(d.glob("*.jpg"), key=lambda p: int(p.stem)):
        png = jpg.with_suffix(".png")
        if png.exists():
            img = np.asarray(Image.open(jpg).convert("RGB"), np.float32) / 255
            if osm:
                img = np.concatenate([img, osm_channels(jpg.with_suffix(".json")).astype(np.float32) / 255], axis=2)
            lab = np.asarray(Image.open(png), np.int64)
            lab = TO5[lab] if five else np.where(lab == 0, IGNORE, lab - 1)
            if with_easy:
                out.append((img, lab, easy(json.loads(jpg.with_suffix(".json").read_text()))))
            else:
                out.append((img, lab))
    return out


def augment(img, lab, crop):
    h, w = lab.shape
    y, x = random.randint(0, h - crop), random.randint(0, w - crop)
    img, lab = img[y:y + crop, x:x + crop], lab[y:y + crop, x:x + crop]
    k = random.randint(0, 3)
    img, lab = np.rot90(img, k), np.rot90(lab, k)
    if random.random() < 0.5:
        img, lab = img[:, ::-1], lab[:, ::-1]
    rgb, extra = img[..., :3], img[..., 3:]
    # colour: other cities' orthophotos differ in brightness, tint and contrast (the main risk across cities)
    rgb = rgb * random.uniform(0.75, 1.25) + random.uniform(-0.08, 0.08)
    rgb = rgb * np.random.uniform(0.9, 1.1, 3).astype(np.float32)
    g = rgb.mean(axis=2, keepdims=True)
    rgb = np.clip(g + (rgb - g) * random.uniform(0.7, 1.3), 0, 1)
    if extra.shape[2]:
        extra = extra.copy()
        if random.random() < 0.1:  # sometimes no OSM at all (the model must not lean on it alone)
            extra[:] = 0
        else:  # and each hint missing now and then (Fable: small towns' OSM lacks paths, widths …)
            for c in range(extra.shape[2]):
                if random.random() < 0.2:
                    extra[..., c] = 0
    return np.concatenate([rgb, extra], axis=2), lab


def to_tensor(imgs):
    x = np.stack(imgs).astype(np.float32)
    x[..., :3] = (x[..., :3] - MEAN) / STD
    return torch.from_numpy(np.ascontiguousarray(x.transpose(0, 3, 1, 2))).float()


# Encoders with weights under Apache 2.0 (timm; commercial use allowed). Not SegFormer: NVIDIA's weights are
# for non-commercial research only (Bára 17. 11. 2026).
ENCODERS = {"mnv3": "tu-mobilenetv3_large_100", "lite0": "tu-efficientnet_lite0", "mnv4": "tu-mobilenetv4_conv_small"}


def build(name, pretrained=True, channels=3, classes=None):
    return smp.Unet(encoder_name=ENCODERS[name], encoder_weights="imagenet" if pretrained else None, in_channels=channels,
                    decoder_channels=(128, 64, 32, 16, 8), classes=classes or len(CLASSES))


def predict(model, img, dev):
    with torch.no_grad():
        x = to_tensor([img]).to(dev)
        return model(x).argmax(1)[0].cpu().numpy()


def evaluate(model, data, dev, names=CLASSES):
    n = len(names)
    conf = np.zeros((n, n), np.int64)
    for img, lab in data:
        pred = predict(model, img, dev)
        m = lab != IGNORE
        conf += np.bincount(lab[m] * n + pred[m], minlength=n * n).reshape(n, n)
    inter = np.diag(conf)
    union = conf.sum(0) + conf.sum(1) - inter
    iou = {c: (float(inter[i] / union[i]) if conf[i].sum() > 0 else None) for i, c in enumerate(names)}
    acc = float(inter.sum() / max(conf.sum(), 1))
    present = [v for v in iou.values() if v is not None]
    return {"iou": iou, "miou": float(np.mean(present)), "acc": acc, "pixels": int(conf.sum())}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--train", default="praha,wien,berlin")
    ap.add_argument("--test", default="brno,hamburg")
    ap.add_argument("--model", default="mnv3", choices=list(ENCODERS))
    ap.add_argument("--epochs", type=int, default=30)
    ap.add_argument("--batch", type=int, default=8)
    ap.add_argument("--crop", type=int, default=256)
    ap.add_argument("--lr", type=float, default=1e-4)
    ap.add_argument("--name", default=None)
    ap.add_argument("--osm", action="store_true", help="OSM hints as 8 more input channels")
    ap.add_argument("--five", action="store_true", help="the five basic kinds instead of nine classes")
    ap.add_argument("--easy-epochs", type=int, default=0, help="the first epochs on characteristic patches only")
    ap.add_argument("--seed", type=int, default=1)
    a = ap.parse_args()
    random.seed(a.seed); np.random.seed(a.seed); torch.manual_seed(a.seed)
    names = KINDS5 if a.five else CLASSES
    dev = "mps" if torch.backends.mps.is_available() else "cpu"
    name = a.name or f"{a.model}-{a.train.replace(',', '+')}"
    out = ROOT / "runs" / name
    out.mkdir(parents=True, exist_ok=True)

    train, val = [], {}
    for c in a.train.split(","):
        d = load(c, a.osm, a.five, with_easy=True)
        random.Random(c).shuffle(d)
        k = max(1, len(d) // 10)
        val[c] = [(x, y) for x, y, _ in d[:k]]
        train += d[k:]
    test = {c: load(c, a.osm, a.five) for c in a.test.split(",") if c}
    print(f"characteristic patches: {sum(e for *_, e in train)} of {len(train)}")
    print(f"train {len(train)} patches, val {sum(map(len, val.values()))}, test {', '.join(f'{c} {len(v)}' for c, v in test.items())}")

    # class weights: rare classes (cycleway, tram, parking) count more
    counts = np.zeros(len(names))
    for _, lab, _ in train:
        counts += np.bincount(lab[lab != IGNORE].ravel(), minlength=len(names))
    w = 1 / np.sqrt(counts / counts.sum() + 1e-4)
    w = torch.tensor(w / w.mean(), dtype=torch.float32).to(dev)

    model = build(a.model, channels=3 + (len(HINTS) if a.osm else 0), classes=len(names)).to(dev)
    opt = torch.optim.AdamW(model.parameters(), lr=a.lr, weight_decay=0.01)
    full = train
    steps = sum(math.ceil(len([s for s in full if ep >= a.easy_epochs or s[2]]) / a.batch) for ep in range(a.epochs))
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=a.lr * 10, total_steps=steps, pct_start=0.1)
    t0 = time.time()
    for ep in range(a.epochs):
        model.train()
        train = [s for s in full if ep >= a.easy_epochs or s[2]]  # characteristic patches first, then all
        random.shuffle(train)
        tot = 0.0
        for i in range(0, len(train), a.batch):
            batch = [augment(s[0], s[1], a.crop) for s in train[i:i + a.batch]]
            x = to_tensor([b[0] for b in batch]).to(dev)
            y = torch.from_numpy(np.stack([np.ascontiguousarray(b[1]) for b in batch])).to(dev)
            logits = model(x)
            loss = F.cross_entropy(logits, y, weight=w, ignore_index=IGNORE)
            opt.zero_grad(); loss.backward(); opt.step(); sched.step()
            tot += loss.item() * len(batch)
        tot_n = len(train)
        model.eval()
        v = {c: evaluate(model, d, dev, names)["miou"] for c, d in val.items()}
        print(f"epoch {ep + 1}/{a.epochs} loss {tot / tot_n:.3f} on {tot_n} val mIoU {json.dumps({k: round(x, 3) for k, x in v.items()})} {time.time() - t0:.0f} s", flush=True)

    model.eval()
    res = {"model": a.model, "osm": a.osm, "five": a.five, "easy_epochs": a.easy_epochs, "seed": a.seed, "train": a.train, "params": sum(p.numel() for p in model.parameters()),
           "val": {c: evaluate(model, d, dev, names) for c, d in val.items()},
           "test": {c: evaluate(model, d, dev, names) for c, d in test.items()}, "seconds": time.time() - t0}
    torch.save(model.state_dict(), out / "model.pt")
    (out / "metrics.json").write_text(json.dumps(res, indent=1))
    for part in ("val", "test"):
        for c, r in res[part].items():
            print(f"{part:4} {c:8} mIoU {r['miou']:.3f} acc {r['acc']:.3f} | " + " ".join(f"{k} {v:.2f}" if v is not None else f"{k} -" for k, v in r["iou"].items()))


if __name__ == "__main__":
    main()
