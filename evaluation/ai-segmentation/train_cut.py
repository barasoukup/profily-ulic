"""A model whose output is the cut (Bára 18. 11. 2026): from the strip around a cut (cutdata.py: the street turned to
run along it, photo + OSM hints), the part at every 20 cm across the street, in five basic kinds (Bára: "jen základní
kategorie"): carriageway (with parking), sidewalk (with cycle track), green, building, other.

The penalty is first for wrong parts (Bára: "trest hlavně v chybně určených prvcích"):
- at every point of the cut, the wrong kind costs (cross entropy), so a sidewalk read as green costs over its width;
- a kind missing from the cut or added to it costs on its own (presence), however narrow it is.
The metres of the kerbs follow from the first.
    python evaluation/ai-segmentation/train_cut.py --train praha,wien,berlin,hamburg --epochs 30
Then: python evaluation/ai-segmentation/train_cut.py --predict <run> brno|target → cuts/<city>/ai-<run>.json
"""
import argparse, json, math, random, sys, time
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F
import segmentation_models_pytorch as smp

sys.path.insert(0, str(Path(__file__).parent))
from cutdata import NT, NU, RES, TS, inputs, strip
from fetch_ortho import CUTS

ROOT = Path("/Users/barasoukupova/streetdesign/data/ai-seg")
KINDS = ["carriageway", "sidewalk", "green", "building", "other"]
# the patches' 9 classes (+ 0 no data) → the five kinds (255: no data, not taught)
TO5 = np.array([255, 0, 1, 1, 0, 4, 2, 3, 4, 4], np.uint8)
# the five kinds → the classes compare.py reads (train.py CLASSES: roadway 0, sidewalk 1, green 5, building 6, paved 7)
TO_COMPARE = [0, 1, 5, 6, 7]
MEAN = np.array([0.485, 0.456, 0.406], np.float32)
STD = np.array([0.229, 0.224, 0.225], np.float32)
IGNORE = 255
RUNS = ROOT / "runs"


def model_of(channels):
    return smp.Unet(encoder_name="tu-mobilenetv3_large_100", encoder_weights=None, in_channels=channels,
                    decoder_channels=(128, 64, 32, 16, 8), classes=len(KINDS))


def logits_of(net, x):
    """(B, C, NU, NT) → the cut's logits (B, kinds, NT): the strip averaged along the street."""
    return net(x).mean(dim=2)


def full_logits(net, x):
    return net(x)


def norm(x):
    x = x.astype(np.float32) / 255
    x[..., :3] = (x[..., :3] - MEAN) / STD
    return x


def augment(x, y):
    if random.random() < 0.5:  # the cut seen from the other side
        x, y = x[:, ::-1], y[:, ::-1]
    if random.random() < 0.5:  # the street run the other way
        x, y = x[::-1], y[::-1]
    rgb, osm = x[..., :3].astype(np.float32), x[..., 3:].astype(np.float32)
    rgb = rgb * random.uniform(0.75, 1.25) + random.uniform(-20, 20)
    rgb = rgb * np.random.uniform(0.9, 1.1, 3)
    g = rgb.mean(axis=2, keepdims=True)
    rgb = g + (rgb - g) * random.uniform(0.7, 1.3)
    # OSM hints dropped one by one (Fable: the model must not hang on one of them) and sometimes all
    if random.random() < 0.1:
        osm[:] = 0
    else:
        for c in range(osm.shape[2]):
            if random.random() < 0.2:
                osm[..., c] = 0
    return np.concatenate([np.clip(rgb, 0, 255), osm], axis=2), y


def presence(y):
    """(B, NT) kinds → (B, kinds) 1 where a kind holds at least 0.6 m of the cut."""
    out = np.zeros((len(y), len(KINDS)), np.float32)
    for i, row in enumerate(y):
        for k in range(len(KINDS)):
            out[i, k] = (row == k).sum() >= 3
    return out


def load(cities):
    X, Y, P = [], [], []
    for c in cities:
        z = np.load(ROOT / "cutsets" / f"{c}.npz")
        X.append(z["X"]); Y.append(TO5[z["Y"]]); P += [f"{c}-{int(m[0])}" for m in z["meta"]]
    return np.concatenate(X), np.concatenate(Y), np.array(P)


def train(a):
    random.seed(a.seed); np.random.seed(a.seed); torch.manual_seed(a.seed)
    dev = "mps" if torch.backends.mps.is_available() else "cpu"
    X, Y, P = load(a.train.split(","))
    # validation: 10 % of the patches (all cuts of a patch together, its neighbours are alike)
    patches = sorted(set(P)); random.Random(1).shuffle(patches)
    val = set(patches[: len(patches) // 10])
    vi = np.array([p in val for p in P]); ti = ~vi
    print(f"train {ti.sum()} cuts, val {vi.sum()}")
    yt = Y[ti]
    counts = np.bincount(yt[yt != IGNORE].ravel(), minlength=len(KINDS)).astype(float)
    w = torch.tensor(1 / np.sqrt(counts / counts.sum()), dtype=torch.float32); w = (w / w.mean()).to(dev)
    net = model_of(X.shape[-1])
    # the encoder's ImageNet weights (timm, Apache 2.0) for the photo's three channels
    pre = smp.Unet(encoder_name="tu-mobilenetv3_large_100", encoder_weights="imagenet", in_channels=X.shape[-1], classes=len(KINDS))
    net.encoder.load_state_dict(pre.encoder.state_dict()); del pre
    net = net.to(dev)
    opt = torch.optim.AdamW(net.parameters(), lr=a.lr, weight_decay=0.01)
    idx = np.where(ti)[0]
    steps = a.epochs * math.ceil(len(idx) / a.batch)
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=a.lr * 10, total_steps=steps, pct_start=0.1)
    t0 = time.time()
    for ep in range(a.epochs):
        net.train(); np.random.shuffle(idx); tot = 0
        for i in range(0, len(idx), a.batch):
            b = [augment(X[j], Y[j]) for j in idx[i:i + a.batch]]
            x = torch.from_numpy(np.stack([norm(v[0]) for v in b]).transpose(0, 3, 1, 2).copy()).to(dev)
            yy = np.stack([np.ascontiguousarray(v[1]) for v in b])
            y = torch.from_numpy(yy.astype(np.int64)).to(dev)
            full = full_logits(net, x)
            # every point of the strip: the wrong kind costs (v2; the strip is the street, the same across its length)
            loss = F.cross_entropy(full, y, weight=w, ignore_index=IGNORE)
            lg = full.mean(dim=2)
            # presence on the cut line: the most a kind shows anywhere on the cut against whether it is there
            pr = torch.from_numpy(presence(yy[:, NU // 2])).to(dev)
            pmax = torch.logsumexp(F.log_softmax(lg, 1) * 4, dim=2) / 4  # a soft maximum over the cut (log)
            loss = loss + a.presence * F.binary_cross_entropy(pmax.exp().clamp(1e-4, 1 - 1e-4), pr)
            opt.zero_grad(); loss.backward(); opt.step(); sched.step()
            tot += loss.item() * len(b)
        net.eval()
        acc = accuracy(net, X[vi], Y[vi], dev)
        print(f"epoch {ep + 1}/{a.epochs} loss {tot / len(idx):.3f} val point accuracy {acc:.3f} {time.time() - t0:.0f} s", flush=True)
    out = RUNS / a.name; out.mkdir(parents=True, exist_ok=True)
    torch.save(net.state_dict(), out / "model.pt")
    (out / "metrics.json").write_text(json.dumps({"kind": "cut", "train": a.train, "channels": int(X.shape[-1]), "epochs": a.epochs, "seed": a.seed,
                                                  "val_accuracy": acc, "seconds": time.time() - t0}))


def predict_batch(net, xs, dev):
    with torch.no_grad():
        x = torch.from_numpy(np.stack([norm(v) for v in xs]).transpose(0, 3, 1, 2).copy()).to(dev)
        return logits_of(net, x).argmax(1).cpu().numpy()


def accuracy(net, X, Y, dev):
    ok = n = 0
    for i in range(0, len(X), 64):
        p = predict_batch(net, X[i:i + 64], dev)
        y = Y[i:i + 64][:, NU // 2] if Y.ndim == 3 else Y[i:i + 64]
        m = y != IGNORE
        ok += (p[m] == y[m]).sum(); n += m.sum()
    return float(ok / max(n, 1))


def predict(run, city):
    dev = "mps" if torch.backends.mps.is_available() else "cpu"
    meta = json.loads((RUNS / run / "metrics.json").read_text())
    net = model_of(meta["channels"]); net.load_state_dict(torch.load(RUNS / run / "model.pt", map_location="cpu")); net = net.to(dev).eval()
    out = {}
    for jf in sorted((q for q in (CUTS / city).glob("*.json") if q.stem.isdigit()), key=lambda q: int(q.stem)):
        if not jf.with_suffix(".jpg").exists():
            continue
        p = json.loads(jf.read_text())
        arr = inputs(jf, p)  # the test patch is centred on the cut
        x = (strip(arr, p, 0.0, 0.0, p["cut"]["bearing"]) * 255).astype(np.uint8)
        kinds = predict_batch(net, [x], dev)[0]
        cls = []
        for t in p["ts"]:
            i = int(round(t / RES + (NT - 1) / 2))
            cls.append(TO_COMPARE[kinds[i]] if 0 <= i < NT and abs(t) <= TS[-1] + 0.1 else -1)
        out[p["n"]] = cls
    (CUTS / city / f"ai-{run}.json").write_text(json.dumps(out))
    print(city, f"ai-{run}", len(out), "cuts")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--train", default="praha,wien,berlin,hamburg")
    ap.add_argument("--epochs", type=int, default=30)
    ap.add_argument("--batch", type=int, default=32)
    ap.add_argument("--lr", type=float, default=1e-4)
    ap.add_argument("--presence", type=float, default=0.5)
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--name", default="cut-v1")
    ap.add_argument("--predict", nargs=2, metavar=("RUN", "CITY"))
    a = ap.parse_args()
    if a.predict:
        predict(*a.predict)
    else:
        train(a)
