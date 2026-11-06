// Where the app gets its data. false: through the local server (node pilot/server.mjs), which
// caches the IPR answers. true: straight from the browser (static hosting, e.g. GitHub Pages);
// the deploy workflow rewrites this file with STATIC = true.
export const STATIC = false;
