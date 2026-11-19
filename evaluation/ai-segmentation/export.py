"""Export a trained run to ONNX for the browser (onnxruntime-web) and Node.
    python evaluation/ai-segmentation/export.py <run name>
Writes data/ai-seg/runs/<name>/model.onnx: input "image" float32 [1, 3 (+ 8 OSM hints), H, W] (normalised as in train.py),
output "logits" [1, 9 or 5 (five kinds), H, W] (H, W multiples of 32).
"""
import sys
from pathlib import Path
import json
import torch
sys.path.insert(0, str(Path(__file__).parent))
from train import build, HINTS, KINDS5

run = Path("/Users/barasoukupova/streetdesign/data/ai-seg/runs") / sys.argv[1]
meta = json.loads((run / "metrics.json").read_text())
channels = 3 + (len(HINTS) if meta.get("osm") else 0)
model = build(meta["model"], pretrained=False, channels=channels, classes=len(KINDS5) if meta.get("five") else None)
model.load_state_dict(torch.load(run / "model.pt", map_location="cpu"))
model.eval()

x = torch.randn(1, channels, 320, 320)
torch.onnx.export(model, (x,), str(run / "model.onnx"), input_names=["image"], output_names=["logits"],
                  dynamic_axes={"image": {2: "h", 3: "w"}, "logits": {2: "h", 3: "w"}}, opset_version=17, dynamo=False)
print(run / "model.onnx", round((run / "model.onnx").stat().st_size / 1e6, 1), "MB")
