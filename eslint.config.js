// ESLint only for real errors (undefined names, unused variables, unreachable code, duplicate keys), not for style
// (docs/coding-guidelines.md). Run: node node_modules/eslint/bin/eslint.js   (npm run lint)
import globals from "globals";

const rules = {
  "no-undef": "error",
  "no-unused-vars": ["error", { args: "none", caughtErrors: "none", varsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_", ignoreRestSiblings: true }],
  "no-unreachable": "error",
  "no-dupe-keys": "error",
  "no-redeclare": "error",
};

export default [
  { ignores: ["app/public/leaflet/**", "app/public/fonts/**", "node_modules/**", "vendor/**", "data/**", "evaluation/**", "app/data/**", "app/cache/**"] },
  // The app: ES modules in the browser, Leaflet as the global L.
  { files: ["app/public/**/*.js"], languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: { ...globals.browser, L: "readonly" } }, rules },
  // The local server, the build tools and the tests: Node.
  { files: ["app/*.mjs", "tools/**/*.mjs", "tests/**/*.js", "eslint.config.js"], languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: { ...globals.node } }, rules },
];
