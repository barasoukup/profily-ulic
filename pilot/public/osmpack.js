// The OSM tiles of one country in one file (tools/pack_osm_tiles.mjs), read in pieces over HTTP Range:
// a trial (?osm=r2) of keeping them on Cloudflare R2 instead of 245 000 files on GitHub Pages. The tiles
// are the ones of osmtile.js (same grid of TILE degrees, same elements), only written shorter:
//
//   file = "POSM" | u32 version | u32 length of the head | head (gzip JSON) | blocks …
//   head = { v, tile, block, extent, keys: [key…], pairs: [[key index, value]…], blocks: [[bx, by, leaf, leafLength, data]…], … }
//   (offsets of leaves and data from the end of the head; a block is BLOCK × BLOCK tiles from tile bx·BLOCK, by·BLOCK)
//   block = leaf (gzip of BLOCK² u32 little endian: byte length of each tile, row by row) | tiles (gzip each)
//
// The head (index of blocks and the dictionary of tags) is read once; the leaf of a block when a tile of
// it is first needed; a tile is one range (neighbouring tiles of one cut are read together).
//
// A tile is a JSON array of elements [type, id, tags, g, o, h], trailing empty fields left out:
//   type 0 way, 1 area, 2 node, 3 area to 1e-5° (buildings, "q": 5 in osmtile.js);
//   tags: numbers are pairs of the dictionary, -1-n is key n of the dictionary followed by its value, a
//   string is a key followed by its value (names and other rare values stay in the tile);
//   g: coordinates as in osmtile.js (differences, integers of 1e-6° or 1e-5°), only the first point is
//   counted from the south-west corner of the tile; o: index of the first point of a cut line (or null),
//   h: holes.
export const MAGIC = "POSM", VERSION = 1;
const TYPES = ["way", "area", "node", "area"];
const CODE = { way: 0, area: 1, node: 2 };

// Encoding (the packer): a line of an osmtile.js tile (parsed: { t, i, k, g, o, h, q }) → the short array.
// dict: { pair(k, v) → index or undefined, key(k) → index or undefined }; ix, iy: the tile.
export function encodeElement(el, dict, ix, iy) {
  // Areas come to 1e-6° or, with "q": 5, to 1e-5° (buildings, green, water); another precision needs a type of its own.
  if (el.q !== undefined && !(el.q === 5 && el.t === "a")) throw new Error(`přesnost q=${el.q} u prvku ${el.t} formát nezná`);
  const step = el.q === 5 ? 500 : 5000; // TILE in integers of the coordinates
  const tags = [];
  for (const [k, v] of Object.entries(el.k || {})) {
    const p = dict.pair(k, v);
    if (p !== undefined) { tags.push(p); continue; }
    const ki = dict.key(k);
    tags.push(ki !== undefined ? -1 - ki : k, v);
  }
  const g = [...el.g];
  if (g.length) { g[0] -= ix * step; g[1] -= iy * step; }
  const out = [el.t === "a" && el.q === 5 ? 3 : CODE[TYPES_SHORT[el.t]], el.i, tags, g, el.o ?? null, el.h ?? null];
  while (out.length > 4 && out[out.length - 1] === null) out.pop();
  return out;
}
const TYPES_SHORT = { w: "way", a: "area", n: "node" };

const decodeGeom = (g, q, x0, y0) => {
  const pts = [];
  let x = x0, y = y0;
  for (let i = 0; i < g.length; i += 2) {
    x += g[i]; y += g[i + 1];
    pts.push({ lat: y / q, lon: x / q });
  }
  return pts;
};

// A tile (its JSON text) → the elements of decodeTile (osmtile.js), the same objects.
export function decodePackedTile(text, head, ix, iy) {
  const out = [];
  for (const [type, id, tagList, g = [], o, h] of JSON.parse(text)) {
    const q = type === 3 ? 1e5 : 1e6, step = Math.round(0.005 * q);
    const tags = {};
    for (let i = 0; i < tagList.length; i++) {
      const t = tagList[i];
      if (typeof t === "number" && t >= 0) { const [k, v] = head.pairs[t]; tags[head.keys[k]] = v; }
      else tags[typeof t === "number" ? head.keys[-1 - t] : t] = tagList[++i];
    }
    const el = { type: TYPES[type], id, tags, geometry: decodeGeom(g, q, ix * step, iy * step) };
    if (h) el.holes = h.map((r) => decodeGeom(r, q, 0, 0));
    if (o !== undefined && o !== null) el.o = o;
    out.push(el);
  }
  return out;
}

export async function gunzip(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
const text = (bytes) => new TextDecoder().decode(bytes);

// Reader of one country's file. read(start, end) → Promise of { bytes: Uint8Array, etag } for bytes
// start..end (inclusive), e.g. a fetch with a Range header. A file replaced meanwhile (another ETag: the
// weekly refresh) is read again from its head.
export class Pack {
  constructor(read, first = 32 * 1024) {
    this.read = read;
    this.first = first;
    this.reset();
  }

  reset() {
    this.headP = null;
    this.leaves = new Map();
    this.etag = undefined;
  }

  async range(start, end) {
    const r = await this.read(start, end);
    if (this.etag !== undefined && r.etag && r.etag !== this.etag) {
      this.reset();
      throw Object.assign(new Error("soubor dlaždic se změnil"), { changed: true });
    }
    return r;
  }

  head() {
    this.headP ??= (async () => {
      const r = await this.read(0, this.first - 1);
      this.etag = r.etag;
      let bytes = r.bytes;
      if (text(bytes.subarray(0, 4)) !== MAGIC) throw new Error("není soubor dlaždic OSM");
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      if (view.getUint32(4, true) !== VERSION) throw new Error("jiná verze souboru dlaždic OSM");
      const len = view.getUint32(8, true);
      if (12 + len > bytes.length) {
        const rest = (await this.range(bytes.length, 12 + len - 1)).bytes;
        const all = new Uint8Array(12 + len);
        all.set(bytes);
        all.set(rest, bytes.length);
        bytes = all;
      }
      const head = JSON.parse(text(await gunzip(bytes.subarray(12, 12 + len))));
      head.base = 12 + len; // offsets of the head count from the end of it
      head.byBlock = new Map(head.blocks.map((b) => [`${b[0]}_${b[1]}`, b]));
      return head;
    })().catch((err) => { this.headP = null; throw err; });
    return this.headP;
  }

  // Offsets of the tiles of a block: [start of each tile …, end].
  leaf(head, b) {
    const key = `${b[0]}_${b[1]}`;
    if (!this.leaves.has(key)) {
      this.leaves.set(key, this.range(head.base + b[2], head.base + b[2] + b[3] - 1).then(async ({ bytes }) => {
        const raw = await gunzip(bytes);
        const lengths = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
        const n = head.block * head.block, offs = new Float64Array(n + 1);
        offs[0] = head.base + b[4];
        for (let i = 0; i < n; i++) offs[i + 1] = offs[i] + lengths.getUint32(i * 4, true);
        return offs;
      }).catch((err) => { this.leaves.delete(key); throw err; }));
    }
    return this.leaves.get(key);
  }

  // The elements of the tiles names ("ix_iy"), each an array (empty: no data there), in the order given.
  async tiles(names) {
    try {
      return await this.tilesOnce(names);
    } catch (err) {
      if (!err.changed) throw err;
      return this.tilesOnce(names);
    }
  }

  async tilesOnce(names) {
    const head = await this.head();
    const B = head.block;
    const want = await Promise.all(names.map(async (n) => {
      const [ix, iy] = n.split("_").map(Number);
      const b = head.byBlock.get(`${Math.floor(ix / B)}_${Math.floor(iy / B)}`);
      if (!b) return { n, ix, iy };
      const offs = await this.leaf(head, b);
      const i = (iy - b[1] * B) * B + (ix - b[0] * B);
      return { n, ix, iy, start: offs[i], end: offs[i + 1] };
    }));
    // Neighbouring tiles of one block lie next to each other: one request for a run with gaps under 32 kB.
    const runs = [];
    for (const w of want.filter((w) => w.end > w.start).sort((a, b) => a.start - b.start)) {
      const last = runs[runs.length - 1];
      if (last && w.start - last.end < 32 * 1024) { last.end = Math.max(last.end, w.end); last.items.push(w); }
      else runs.push({ start: w.start, end: w.end, items: [w] });
    }
    await Promise.all(runs.map(async (run) => {
      const { bytes } = await this.range(run.start, run.end - 1);
      await Promise.all(run.items.map(async (w) => {
        w.els = decodePackedTile(text(await gunzip(bytes.subarray(w.start - run.start, w.end - run.start))), head, w.ix, w.iy);
      }));
    }));
    return want.map((w) => w.els || []);
  }
}

// A read() for Pack over fetch with a Range header (timeout: ms for each request).
export const rangeFetch = (url, timeout, f = (...a) => fetch(...a)) => async (start, end) => {
  const r = await f(url, { headers: { Range: `bytes=${start}-${end}` }, signal: timeout ? AbortSignal.timeout(timeout) : undefined });
  if (r.status !== 206 && r.status !== 200) throw new Error(`dlaždice OSM ${r.status}`);
  let bytes = new Uint8Array(await r.arrayBuffer());
  if (r.status === 200) bytes = bytes.subarray(start, end + 1); // a server without Range: the whole file came
  return { bytes, etag: r.headers.get("ETag") || undefined };
};

// The files of all countries at one of several places (R2, then the same files on Pages): index.json there names
// them, { "files": { "cz": "cz-2026-11-16.posm", … } } (tools/pack_osm_tiles.mjs). A new week's files get new
// names, so a reader never mixes two weeks. A place that fails (its index or a piece) gives way to the next; when
// the last one fails too, the next cut starts again from the first.
export class PackSet {
  constructor(bases, { timeout, fetch: f = (...a) => fetch(...a) } = {}) {
    // at: the first place to ask (one whose index failed gives way to the next until every place has failed).
    Object.assign(this, { bases, timeout, f, at: 0, places: new Map() });
  }

  // The files of one place: { code: Pack with its box }, its index read once (a failed index is asked again later).
  open(at = this.at) {
    const base = this.bases[at];
    if (!this.places.has(base)) {
      this.places.set(base, (async () => {
        const r = await this.f(`${base}/index.json`, { cache: "no-cache", signal: this.timeout ? AbortSignal.timeout(this.timeout) : undefined });
        if (!r.ok) throw new Error(`dlaždice OSM ${r.status}`);
        const { files, bbox = {} } = await r.json();
        return Object.fromEntries(Object.entries(files).map(([code, file]) => [code, Object.assign(new Pack(rangeFetch(`${base}/${file}`, this.timeout, this.f)), { code, box: bbox[code] })]));
      })().catch((err) => { this.places.delete(base); throw err; }));
    }
    return this.places.get(base);
  }

  // The element lists of the tiles names ("ix_iy") in all countries (a tile on a border may be in two), for mergePieces.
  // Only the files whose box (index.json bbox) holds one of the tiles are asked. A file that fails is asked at the next
  // place (Pages) on its own, while the others keep answering from the first (the review of Germany: one bad file sent
  // every state to the fallback without AT and DE; and a neighbour answering empty must not hide a failed file).
  // Only when no place has a file answering does the cut fail; the next cut starts again from the first place.
  async tiles(names) {
    const ij = names.map((n) => n.split("_").map(Number));
    const holds = (p) => !p.box || ij.some(([x, y]) => x >= p.box[0] && x <= p.box[2] && y >= p.box[1] && y <= p.box[3]);
    let first, err;
    for (; this.at < this.bases.length; this.at++) {
      try { first = await this.open(this.at); break; } catch (e) { err = e; console.warn("dlaždice OSM jinde", this.bases[this.at], e.message); }
    }
    if (!first) { this.at = 0; throw err; }
    const lists = [];
    let answered = 0, failed = null;
    await Promise.all(Object.values(first).filter(holds).map(async (p) => {
      for (let at = this.at; at < this.bases.length; at++) {
        try {
          const pack = at === this.at ? p : (await this.open(at))[p.code];
          if (!pack) break; // the next place has no file of this state (Pages: only CZ and SK)
          lists.push(await pack.tiles(names));
          answered++;
          return;
        } catch (e) { failed = e; console.warn("dlaždice OSM", p.code, this.bases[at], e.message); }
      }
    }));
    if (!answered && failed) { this.at = 0; this.places.clear(); throw failed; }
    return names.flatMap((_, i) => lists.map((list) => list[i]).filter((els) => els.length));
  }
}
