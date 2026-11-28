// A stand-in for late.js: the callback of North America is kept for the snapshot to call with the towns.
export const onAmerica = (f) => { globalThis.__orthoAmerica = f; };
export const isLate = () => false;
export const ensurePlace = async () => {};
