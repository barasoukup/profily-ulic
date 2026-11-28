// What a test borrows from the browser: the page's address and the storage, put back when the test is done.

// Runs fn with globalThis.location set (an object, or null for none), then restores what was there.
export async function withLocation(location, fn) {
  const had = Object.getOwnPropertyDescriptor(globalThis, "location");
  try {
    if (location === null) delete globalThis.location; else globalThis.location = location;
    return await fn();
  } finally {
    if (had) Object.defineProperty(globalThis, "location", had); else delete globalThis.location;
  }
}

export function fakeStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), clear: () => m.clear() };
}
