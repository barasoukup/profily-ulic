// Module hooks: while basemaps.js is read in Node, the modules that need the page (the map, the data layers, the boundaries
// fetched from the site, the late loading of North America) are the stand-ins of ortho-stubs/.
let pub = "";
export function initialize(data) { pub = data.pub; }
const STUBS = { "app/map.js": "map.js", "maplayers.js": "maplayers.js", "app/boundaries.js": "boundaries.js", "late.js": "late.js" };
export async function resolve(specifier, context, nextResolve) {
  const out = await nextResolve(specifier, context);
  for (const [file, stub] of Object.entries(STUBS)) {
    if (out.url === `file://${pub}/${file}`) return { url: new URL(`./ortho-stubs/${stub}`, import.meta.url).href, shortCircuit: true };
  }
  return out;
}
