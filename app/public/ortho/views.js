// The registry's areas as tools/build_coverage.mjs reads them (the map of coverage): by chain, the box (and town) of each source, and the
// boxes where a state's orthophoto is not used.
import { CHAINS, SOURCES } from "./registry.js";

const areas = (chain) => Object.fromEntries(CHAINS[chain].members.map((m) => [m.id, { ...m.area }]));
export const IT_ORTHO = areas("it");
export const FI_ORTHO = areas("fi");
export const US_ORTHO = areas("us");
export const CA_ORTHO = areas("ca");
export const PT_MAINLAND = CHAINS.pt.members[0].area.box;
export const ES_NOT_PNOA = SOURCES.es.area.except;
