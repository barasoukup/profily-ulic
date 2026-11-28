// The recording of the app's own canvases (the orthophoto's images, the model's OSM hints: lanes-ortho.js, ai-kerbs.js),
// as both players read it: the page records what getImageData gave (?replay=canvas, harness.js), Node gives it back
// (node-browser.mjs). Chrome draws these canvases on the GPU: its bilinear sampling and its antialiased lines differ by
// a unit here and there from any canvas in Node (measured 28. 11. 2026, README "Přehrávka v Node"), so the pixels are
// recorded like the sources' answers. A readback is keyed by what was drawn on its canvas before it: the images (by
// the hash of their bytes) with where they were drawn, in any order (tiles come as the network gives them), and the
// lines and fills with their styles, in order.

// A string of what one call drew (numbers as JavaScript writes them: the same in the page and in Node).
export const opText = (name, args) => `${name}(${args.map(String).join(",")})`;
// cyrb53 twice with two seeds: 106 bits, quick and synchronous (getImageData is).
function cyrb(str, seed) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
}
// The key of a readback: the canvas's size, its images (sorted), its other drawing (in order), the box read.
export function canvasKey(width, height, ops, box) {
  const images = ops.filter((o) => o.startsWith("drawImage(")).sort(), rest = ops.filter((o) => !o.startsWith("drawImage("));
  const text = `${width}x${height}|${images.join(";")}|${rest.join(";")}|${box.join(",")}`;
  return `CANVAS ${cyrb(text, 1)}${cyrb(text, 2)} ${text.length}`;
}
// The calls and properties that draw (what the app uses on these canvases).
export const DRAWS = ["drawImage", "clearRect", "fillRect", "beginPath", "moveTo", "lineTo", "closePath", "stroke", "fill", "rect", "arc"];
export const STYLES = ["lineWidth", "strokeStyle", "fillStyle", "lineCap", "lineJoin", "globalAlpha", "globalCompositeOperation", "imageSmoothingEnabled", "imageSmoothingQuality"];
