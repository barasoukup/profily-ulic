# The cut's strip at any resolution, from the cached orthophoto (EPSG:3857) — the same frame as run.mjs strip():
# x = t across the street (A → B) from extent[0] − 3 m, y = u along it, top = +20 m.
import json, math
import numpy as np
from PIL import Image

R, ALONG, PAD = 6378137, 20, 3

def frame(cut):
    b = math.radians(cut["bearing"])
    d, nrm = (math.sin(b), math.cos(b)), (-math.cos(b), math.sin(b))
    kx = R * math.cos(math.radians(cut["lat"])) * math.pi / 180
    ky = R * math.pi / 180
    def merc(t, u):  # (t, u) in metres → Web Mercator x, y
        lon = cut["lon"] + (nrm[0] * t + d[0] * u) / kx
        lat = cut["lat"] + (nrm[1] * t + d[1] * u) / ky
        return R * np.radians(lon), R * np.log(np.tan(np.pi / 4 + np.radians(lat) / 2))
    return merc

def strip(png, cut, extent, res):
    """RGB array (nu × nt × 3) of the strip at res m/px, bilinear; t0 its left edge in metres."""
    img = np.asarray(Image.open(png).convert("RGB"), dtype=np.float32)
    x0, y0, x1, y1 = json.load(open(str(png) + ".json"))["bbox"]
    t0, t1 = extent[0] - PAD, extent[1] + PAD
    nt, nu = round((t1 - t0) / res), round(2 * ALONG / res)
    t = t0 + (np.arange(nt) + 0.5) * res
    u = ALONG - (np.arange(nu) + 0.5) * res
    mx, my = frame(cut)(t[None, :], u[:, None])
    h, w = img.shape[:2]
    px = (mx - x0) / (x1 - x0) * w - 0.5
    py = (y1 - my) / (y1 - y0) * h - 0.5
    i0 = np.clip(np.floor(px).astype(int), 0, w - 2); j0 = np.clip(np.floor(py).astype(int), 0, h - 2)
    fx = np.clip(px - i0, 0, 1)[..., None]; fy = np.clip(py - j0, 0, 1)[..., None]
    out = (img[j0, i0] * (1 - fx) * (1 - fy) + img[j0, i0 + 1] * fx * (1 - fy)
           + img[j0 + 1, i0] * (1 - fx) * fy + img[j0 + 1, i0 + 1] * fx * fy)
    return out.clip(0, 255).astype(np.uint8), t0

def bands(way):
    """The two kerb bands of a roadway (image metres), as in run.mjs."""
    return {"A": (way["s"] + 0.25, way["s"] + 2.2), "B": (way["e"] - 2.2, way["e"] - 0.25)}
