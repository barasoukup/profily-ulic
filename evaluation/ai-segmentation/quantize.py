"""The model's convolution weights as int8 per output channel (symmetric, DequantizeLinear before each Conv), the rest
float32: about a quarter of the size, the same arithmetic in the browser (onnxruntime-web turns them back to float).
    python evaluation/ai-segmentation/quantize.py app/public/ai/kerbs.onnx app/public/ai/kerbs-int8.onnx
"""
import sys
import numpy as np
import onnx
from onnx import helper, numpy_helper, TensorProto

src, dst = sys.argv[1:3]
m = onnx.load(src)
g = m.graph
conv_w = {n.input[1] for n in g.node if n.op_type == "Conv"}
new_init, new_nodes = [], []
for init in g.initializer:
    w = numpy_helper.to_array(init)
    if init.name not in conv_w or w.dtype != np.float32 or w.ndim != 4 or w.size < 512:
        new_init.append(init)
        continue
    flat = np.abs(w.reshape(w.shape[0], -1)).max(axis=1)
    scale = np.where(flat > 0, flat / 127.0, 1.0).astype(np.float32)
    q = np.clip(np.round(w / scale[:, None, None, None]), -127, 127).astype(np.int8)
    new_init += [numpy_helper.from_array(q, init.name + "_q"), numpy_helper.from_array(scale, init.name + "_s"),
                 numpy_helper.from_array(np.zeros(w.shape[0], np.int8), init.name + "_z")]
    new_nodes.append(helper.make_node("DequantizeLinear", [init.name + "_q", init.name + "_s", init.name + "_z"], [init.name], axis=0))
del g.initializer[:]
g.initializer.extend(new_init)
nodes = list(g.node)
del g.node[:]
g.node.extend(new_nodes + nodes)
onnx.checker.check_model(m)
onnx.save(m, dst)
print(len(new_nodes), "weights quantized")
