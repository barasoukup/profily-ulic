// Asks the registry of searches for one query. A service is { id, looksLike(query, ctx), find(query, ctx) } plus, where it
// needs them: label (named in the warning when it fails), merge (the place of its items among the others when they are
// ranked: ties keep this order), parallel (asked together with the service before it), recover(err, query, ctx) (what a
// failure means: items, or throws to fail the whole search; the default is a warning and no items), lastResort
// ({ order, when }: asked after all the others, if not asked yet and `when`), owns(item) and locate(item, ctx) (the
// service that knows where its items are).
// The array's order is the order of asking: the state's own services first (the state lists them, looksLike says so),
// the guesses from the query's letters after them, each only when the ones before found nothing (ctx.found).
// ctx: getJSON, signal, near() ([lat, lon] of the map's centre), inVienna, inCzechia, listed(id) (the services the state of
// the map lists), and while asking asked(id), found(...ids) (any of them has items), foundAny(), itemsOf(id).

const warnAndNothing = (service) => (err) => { console.warn(`hledání ${service.label}`, err); return []; };

export async function runSearch(services, query, ctx) {
  const results = new Map(), asked = new Set();
  const live = {
    ...ctx,
    asked: (id) => asked.has(id),
    itemsOf: (id) => results.get(id) || [],
    found: (...ids) => ids.some((id) => results.get(id)?.length),
    foundAny: () => [...results.values()].some((items) => items.length),
  };
  const ask = async (service) => {
    asked.add(service.id);
    try {
      results.set(service.id, await service.find(query, live));
    } catch (err) {
      if (err.name === "AbortError") throw err;
      results.set(service.id, (service.recover || warnAndNothing(service))(err, query, live));
    }
  };
  // Steps: a service with `parallel` goes with the one before it (their conditions are read before either answers).
  const steps = [];
  for (const service of services) {
    if (service.parallel && steps.length) steps.at(-1).push(service); else steps.push([service]);
  }
  for (const step of steps) {
    const wanted = step.filter((service) => service.looksLike(query, live));
    await Promise.all(wanted.map(ask));
  }
  const last = services.filter((s) => s.lastResort).sort((a, b) => a.lastResort.order - b.lastResort.order);
  for (const service of last) if (!asked.has(service.id) && service.lastResort.when(query, live)) await ask(service);
  return [...services].sort((a, b) => a.merge - b.merge).flatMap((service) => results.get(service.id) || []);
}
