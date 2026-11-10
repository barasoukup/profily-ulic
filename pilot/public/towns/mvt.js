// A minimal reader of Mapbox vector tiles (protobuf): the layers of a tile with their features' type
// (1 point, 2 line, 3 polygon) and geometry in tile units (0…extent, y down). Attributes are not read
// (Přerov's tiles carry none: the kind of a surface is the name of its layer).
function reader(buf) {
  let pos = 0;
  const varint = () => { let r = 0, s = 0, b; do { b = buf[pos++]; r += (b & 0x7f) * 2 ** s; s += 7; } while (b & 0x80); return r; };
  return {
    get pos() { return pos; }, set pos(p) { pos = p; }, varint,
    fields(end, cb) { while (pos < end) { const tag = varint(), f = tag >> 3, w = tag & 7; const start = pos;
      if (w === 0) cb(f, w, varint()); else if (w === 2) { const len = varint(); const s = pos; pos += len; cb(f, w, [s, s + len]); }
      else if (w === 5) { pos += 4; cb(f, w, null); } else if (w === 1) { pos += 8; cb(f, w, null); } else throw new Error("wire " + w); } },
  };
}
const zz = (n) => (n >>> 1) ^ -(n & 1);
export function decodeMvt(u8) {
  const r = reader(u8), td = new TextDecoder();
  const layers = {};
  r.fields(u8.length, (f, w, v) => {
    if (f !== 3) return;
    const [s, e] = v; const save = r.pos; r.pos = s;
    let name = "", extent = 4096; const feats = [];
    r.fields(e, (lf, lw, lv) => {
      if (lf === 1) name = td.decode(u8.subarray(lv[0], lv[1]));
      else if (lf === 5) extent = lv;
      else if (lf === 2) {
        const save2 = r.pos; r.pos = lv[0]; let type = 0, geom = null;
        r.fields(lv[1], (ff, fw, fv) => { if (ff === 3) type = fv; else if (ff === 4) geom = fv; });
        r.pos = save2;
        if (geom) {
          const save3 = r.pos; r.pos = geom[0];
          const rings = []; let x = 0, y = 0, cur = null;
          while (r.pos < geom[1]) {
            const ci = r.varint(), id = ci & 7, cnt = ci >> 3;
            if (id === 7) { if (cur) cur.push(cur[0]); continue; }
            for (let i = 0; i < cnt; i++) { x += zz(r.varint()); y += zz(r.varint()); if (id === 1) { cur = [[x, y]]; rings.push(cur); } else cur.push([x, y]); }
          }
          r.pos = save3;
          feats.push({ type, rings });
        }
      }
    });
    r.pos = save;
    layers[name] = { extent, features: feats };
  });
  return layers;
}
