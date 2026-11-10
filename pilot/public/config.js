// Where the app gets its data. false: through the local server (node pilot/server.mjs), which
// caches the IPR answers. true: straight from the browser (static hosting, e.g. GitHub Pages);
// the deploy workflow rewrites this file with STATIC = true.
export const STATIC = false;

// Mapy.com API key (street panorama). Not kept in the repository: the deploy workflow fills it in
// from the repository secret MAPY_KEY; locally it comes from config.local.js (git-ignored,
// export const MAPY_KEY = "…"). Without a key the panorama button stays hidden.
export const MAPY_KEY = "";
