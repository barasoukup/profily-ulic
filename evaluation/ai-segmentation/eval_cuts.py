"""The model on the regression's cuts (cuts.mjs): the class at every 20 cm along each cut (majority of three lines
3 m apart), saved for compare.py, which measures the model and the app's estimate with one function.
    python evaluation/ai-segmentation/eval_cuts.py <run> brno [--drop foot,road-width]
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


def main():
    # python eval_cuts.py <run> <city> [--drop foot,road-width]: the classes along each cut -> cuts/<city>/ai-<run>[-no-…].json
    args = sys.argv[1:]
    drop = args[args.index("--drop") + 1].split(",") if "--drop" in args else []
    run, city = [a for a in args if not a.startswith("--") and a not in drop][:2]
    meta = json.loads((RUNS / run / "metrics.json").read_text())
    osm = bool(meta.get("osm"))
    from train import KINDS5, FIVE_TO_NINE
    five = bool(meta.get("five"))
    model = build(meta["model"], pretrained=False, channels=3 + (len(HINTS) if osm else 0), classes=len(KINDS5) if five else None)
    model.load_state_dict(torch.load(RUNS / run / "model.pt", map_location="cpu"))
    dev = "mps" if torch.backends.mps.is_available() else "cpu"
    model = model.to(dev).eval()
    out = {}
    for jf in sorted((q for q in (CUTS / city).glob("*.json") if q.stem.isdigit()), key=lambda p: int(p.stem)):
        jpg = jf.with_suffix(".jpg")
        if not jpg.exists():
            continue
        p = json.loads(jf.read_text())
        img = np.asarray(Image.open(jpg).convert("RGB"), np.float32) / 255
        if osm:
            ch = osm_channels(jf).astype(np.float32) / 255
            for h in drop:
                ch[..., HINTS.index(h)] = 0
            img = np.concatenate([img, ch], axis=2)
        x = img.copy(); x[..., :3] = (x[..., :3] - MEAN) / STD
        with torch.no_grad():
            pred = model(torch.from_numpy(x.transpose(2, 0, 1)[None].copy()).float().to(dev)).argmax(1)[0].cpu().numpy()
        if five:
            pred = np.array(FIVE_TO_NINE)[pred]
        b, _ = patch_box(p)
        px = p["px"]
        sx, sy = px / (b[2] - b[0]), px / (b[3] - b[1])
        votes = []
        for line in p["lines"]:
            cls = []
            for lon, lat in line:
                mx, my = merc(lon, lat)
                c, r = int((mx - b[0]) * sx), int((b[3] - my) * sy)
                cls.append(int(pred[r, c]) if 0 <= r < px and 0 <= c < px else -1)
            votes.append(cls)
        votes = np.array(votes)
        out[p["n"]] = [int(np.bincount(col[col >= 0], minlength=len(CLASSES)).argmax()) if (col >= 0).any() else -1 for col in votes.T]
    name = f"ai-{run}" + (f"-no-{'+'.join(drop)}" if drop else "")
    (CUTS / city / f"{name}.json").write_text(json.dumps(out))
    print(city, name, len(out), "cuts")


if __name__ == "__main__":
    main()
