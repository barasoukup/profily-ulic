// The estimate's switches, one object every part of it reads (derive/, ortho/): what ?off=… and the other addresses of
// flags.js decide, as app/options.js applies them once at the start, and what the evaluation scripts set for an A/B.
// The defaults here are the ones of a script that does not load app/options.js (the tests, evaluation/ortho-osm/
// regression.mjs): the fixes on, the trials (stretchOn, aiWalk) off; the app turns them on by its own switches below.
// The tuning numbers of the kerb search are not here (KERB_SCORE in kerbs.js, constants since 28. 11. 2026).
export const P = {
  // A Set of the fixes switched off (?off=a,b,c; flags.js lists them), null: none. The evaluation scripts set it per arm.
  off: null,
  // A side the user stretched beyond the usual reach goes on past the last path or sidewalk (?dosah=0 turns it off).
  stretchOn: false,
  // The street's own roadway that the axis does not cross (?axisroad=0 turns it off).
  axisroad: true,
  // The model's kinds decide sidewalk, green and other from the kerb to the house (?aiplochy=0 turns it off).
  aiWalk: false,
  // Evaluation only: an object that collects counters (facade.js), null in the app.
  dbg: null,
};
