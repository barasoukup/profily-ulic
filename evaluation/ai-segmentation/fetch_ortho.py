"""The orthophoto and the label raster of each patch (sample.mjs): 320 x 320 px of 20 cm, Web Mercator square.

The same orthophotos the app reads (pilot/public/lanes-ortho.js): IPR in Prague, Brno's 2025 tiles (with their
shift), basemap.at in Vienna, the DOP 20 of Berlin and Hamburg. One request (or a few tiles) per patch, a pause
between patches, nothing fetched twice.
    python evaluation/ai-segmentation/fetch_ortho.py praha
Writes <n>.jpg (photo) and <n>.png (class per pixel, 0 = no data) next to <n>.json.
"""
import io, json, math, sys, time, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw

ROOT = Path("/Users/barasoukupova/streetdesign/data/ai-seg/patches")
CUTS = Path("/Users/barasoukupova/streetdesign/data/ai-seg/cuts")  # patches around the regression cuts (cuts.mjs)
PX = 320
R = 6378137.0
UA = {"User-Agent": "profily-ulic ai-segmentation pilot (github.com/barasoukup/profily-ulic)"}
CLASS_OF = {700: 1, 701: 1, 702: 2, 703: 3, 704: 4, 705: 5, 100: 6, 200: 6, 300: 6, 401: 6, 402: 6, 601: 7, 602: 7,
            603: 8, 901: 8, 1003: 8, 1100: 8, 501: 9, 502: 9, 503: 9}


def merc(lon, lat):
    return R * math.radians(lon), R * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))


def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=12) as r:
        if r.status != 200:
            raise RuntimeError(f"HTTP {r.status}")
        data = r.read()
    return Image.open(io.BytesIO(data)).convert("RGB")


def wms(base, layers, b, extra=None, PX=PX):
    q = {"service": "WMS", "request": "GetMap", "version": "1.3.0", "layers": layers, "styles": "", "crs": "EPSG:3857",
         "bbox": ",".join(f"{v:.3f}" for v in b), "width": PX, "height": PX, "format": "image/jpeg", **(extra or {})}
    return get(f"{base}?{urllib.parse.urlencode(q)}")


def export_image(base, b, PX=PX):
    q = {"bbox": ",".join(f"{v:.3f}" for v in b), "bboxSR": 3857, "imageSR": 3857, "size": f"{PX},{PX}", "format": "jpg", "f": "image"}
    return get(f"{base}/exportImage?{urllib.parse.urlencode(q)}")


def tiles(base, z, b, ext="", px=256, PX=PX):
    size = 2 * math.pi * R / 2 ** z
    tx0, tx1 = int((b[0] + math.pi * R) // size), int((b[2] + math.pi * R) // size)
    ty0, ty1 = int((math.pi * R - b[3]) // size), int((math.pi * R - b[1]) // size)
    canvas = Image.new("RGB", ((tx1 - tx0 + 1) * px, (ty1 - ty0 + 1) * px))
    cells = [(tx, ty) for ty in range(ty0, ty1 + 1) for tx in range(tx0, tx1 + 1)]
    with ThreadPoolExecutor(4) as pool:  # a few tiles at once, as a browser does
        imgs = list(pool.map(lambda c: get(f"{base}/{z}/{c[1]}/{c[0]}{ext}"), cells))
    for (tx, ty), im in zip(cells, imgs):
        canvas.paste(im.resize((px, px)), ((tx - tx0) * px, (ty - ty0) * px))
    # crop the patch's box out of the tiles' box, then to PX
    gx0, gy1 = tx0 * size - math.pi * R, math.pi * R - ty0 * size
    scale = px / size
    crop = ((b[0] - gx0) * scale, (gy1 - b[3]) * scale, (b[2] - gx0) * scale, (gy1 - b[1]) * scale)
    return canvas.crop(tuple(round(v) for v in crop)).resize((PX, PX), Image.BILINEAR)


def photo(city, b, k, PX=PX):
    if city == "praha":
        return export_image("https://gs-pub.praha.eu/imgs/rest/services/ort/letecke_snimkovani/ImageServer", b, PX=PX)
    if city == "brno":  # the ground is shown moved by (1.06, 3.09) m (lanes-ortho.js)
        sx, sy = 1.06 / k, 3.09 / k
        return tiles("https://gis.brno.cz/ags1/rest/services/OMI/OMI_basemaps_ortofoto_2025_wgs/MapServer/tile", 20,
                     (b[0] + sx, b[1] + sy, b[2] + sx, b[3] + sy), PX=PX)
    if city == "wien":
        # level 19 is about 20 cm on the ground here, the patch's own resolution (and a quarter of the tiles of 20)
        return tiles("https://mapsneu.wien.gv.at/basemap/bmaporthofoto30cm/normal/google3857", 19, b, ".jpeg", PX=PX)
    if city == "berlin":
        return wms("https://isk.geobasis-bb.de/mapproxy/dop20c/service/wms", "bebb_dop20c", b, PX=PX)
    if city == "hamburg":
        return wms("https://geodienste.hamburg.de/wms_dop_zeitreihe_belaubt", "dop_zeitreihe_belaubt", b, {"time": "2024"}, PX=PX)
    if city in ("sk", "petrzalka", "ruzinov"):  # ZBGIS Ortofoto_hres, 512 px tiles of z19 (lanes-ortho.js sk; the app balances its colours, the model gets them raw)
        return tiles("https://zbgis.skgeodesy.sk/zbgis/rest/services/Ortofoto_hres/MapServer/tile", 19, b, px=512, PX=PX)
    if city == "aachen":  # North Rhine-Westphalia's DOP
        return wms("https://www.wms.nrw.de/geobasis/wms_nw_dop", "nw_dop_rgb", b, PX=PX)
    raise ValueError(city)


def label(feats, b, PX=PX):
    out = Image.new("L", (PX, PX), 0)
    draw = ImageDraw.Draw(out)
    sx, sy = PX / (b[2] - b[0]), PX / (b[3] - b[1])
    px = lambda ring: [((mx - b[0]) * sx, (b[3] - my) * sy) for mx, my in (merc(*p[:2]) for p in ring)]
    for f in feats:
        c = CLASS_OF.get(f["code"])
        rings = [r for r in f["rings"] if len(r) >= 3]
        if not c or not rings:
            continue
        if len(rings) == 1:  # most polygons: drawn straight away
            draw.polygon(px(rings[0]), fill=c)
            continue
        mask = Image.new("1", (PX, PX), 0)
        for ring in rings:
            m = Image.new("1", (PX, PX), 0)
            ImageDraw.Draw(m).polygon(px(ring), fill=1)
            mask = ImageChops.logical_xor(mask, m)  # even-odd: holes cut out
        out.paste(c, mask=mask)
    return out


def main(city, root=ROOT):
    d = root / city
    for jf in sorted((q for q in d.glob("*.json") if q.stem.isdigit()), key=lambda p: int(p.stem)):
        jpg, png = jf.with_suffix(".jpg"), jf.with_suffix(".png")
        p = json.loads(jf.read_text())
        x0, y0 = merc(p["box"][0], p["box"][1])
        x1, y1 = merc(p["box"][2], p["box"][3])
        cx, cy, k = (x0 + x1) / 2, (y0 + y1) / 2, math.cos(math.radians(p["lat"]))
        h = p["half"] / k  # half of the square in Web Mercator metres
        px = p.get("px", PX)
        b = (cx - h, cy - h, cx + h, cy + h)
        if not png.exists():
            label(p["feats"], b, PX=px).save(png)
        if jpg.exists():
            continue
        for attempt in range(3):
            try:
                photo(p.get("src", city), b, k, PX=px).save(jpg, quality=92)
                break
            except Exception as e:  # noqa: BLE001
                print(f"{jf.name}: {e}")
                time.sleep(5 * (attempt + 1))
        time.sleep(0.6)
    print(city, len(list(d.glob("*.jpg"))), "photos")


if __name__ == "__main__":
    main(sys.argv[1], CUTS if "--cuts" in sys.argv else ROOT)
