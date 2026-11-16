import { test } from "node:test";
import assert from "node:assert/strict";
import { SEND } from "../tools/build_root_site.mjs";

// Where the root page and 404.html send an address (tools/build_root_site.mjs).
const sent = (href) => {
  const u = new URL(href);
  let to = null;
  const location = { hostname: u.hostname, pathname: u.pathname, search: u.search, hash: u.hash, replace: (x) => { to = x; } };
  new Function("location", `return ${SEND}`)(location);
  return to;
};

test("kořen webu: staré odkazy a kořen domény vedou do profily/ i s řezem, adresy v profily/ zůstávají", () => {
  assert.equal(sent("https://streetspace.eu/"), "/profily/");
  assert.equal(sent("https://streetspace.eu/#rez=50.1,14.4,-99,22.0,22.0"), "/profily/#rez=50.1,14.4,-99,22.0,22.0");
  assert.equal(sent("https://streetspace.eu/?mesto=brno#rez=49.2,16.6,10"), "/profily/?mesto=brno#rez=49.2,16.6,10");
  assert.equal(sent("https://streetspace.eu/brno/#rez=49.2,16.6,10"), "/profily/brno/#rez=49.2,16.6,10");
  assert.equal(sent("https://streetspace.eu/profily/neni.html"), null);
  // Before the domain is set: the project site of GitHub Pages.
  assert.equal(sent("https://barasoukup.github.io/profily-ulic/#rez=50.1,14.4,0"), "/profily-ulic/profily/#rez=50.1,14.4,0");
  assert.equal(sent("https://barasoukup.github.io/profily-ulic/jihlava/"), "/profily-ulic/profily/jihlava/");
});
