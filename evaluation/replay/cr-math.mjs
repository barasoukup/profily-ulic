// Correctly rounded Math.sin, cos, tan, atan, atan2, asin, exp, log, sinh for the replay in Node (node.mjs).
// Measured on 28. 11. 2026: the page's engine (Chrome 156 of the Claude app, V8 15) rounds these correctly (9 functions,
// 3 000 values each against mpmath at 300 bits: all equal), Node 26 (V8 14.6, fdlibm) is a bit off in 3–20 % of them,
// and a last bit moves an orthophoto's box in its URL (a miss of the recording) or a pixel. Each function is evaluated
// in double-double arithmetic (about 2^-100) and rounded once; the value is wrong only where the true one lies within
// that of the middle between two doubles (about 2^-47 of the calls). sinh is the page's own formula (below); hypot,
// sqrt, pow and the rest are equal already. Checked against 270 000 values of the page (lat/lon, angles, Web Mercator,
// sigmoid, wide ranges): all equal.
// Not for the app: in the page the engine's own Math is used.

// The engine's own functions: the first guesses refined below and the special values (0, ±∞, NaN).
const E = { sin: Math.sin, cos: Math.cos, tan: Math.tan, exp: Math.exp, log: Math.log, atan: Math.atan, atan2: Math.atan2, asin: Math.asin, sinh: Math.sinh };
const SPLIT = 134217729; // 2^27 + 1
const twoSum = (a, b) => { const s = a + b, bb = s - a; return [s, (a - (s - bb)) + (b - bb)]; };
const quick = (a, b) => { const s = a + b; return [s, b - (s - a)]; };
const twoProd = (a, b) => {
  const p = a * b, ta = SPLIT * a, ah = ta - (ta - a), al = a - ah, tb = SPLIT * b, bh = tb - (tb - b), bl = b - bh;
  return [p, ((ah * bh - p) + ah * bl + al * bh) + al * bl];
};
// Double-double numbers [hi, lo].
const add = (a, b) => { let [s, e] = twoSum(a[0], b[0]); const [t, f] = twoSum(a[1], b[1]); e += t; [s, e] = quick(s, e); e += f; return quick(s, e); };
const neg = (a) => [-a[0], -a[1]];
const sub = (a, b) => add(a, neg(b));
const mul = (a, b) => { const [p, e] = twoProd(a[0], b[0]); return quick(p, e + (a[0] * b[1] + a[1] * b[0])); };
const div = (a, b) => {
  const q1 = a[0] / b[0]; let r = sub(a, mul([q1, 0], b));
  const q2 = r[0] / b[0]; r = sub(r, mul([q2, 0], b));
  const q3 = r[0] / b[0];
  return add(quick(q1, q2), [q3, 0]);
};
const scale = (a, s) => [a[0] * s, a[1] * s]; // s a power of two
const dd = (x) => [x, 0];
const round = (a) => a[0] + a[1];

const PIO2 = [1.5707963267948966, 6.123233995736766e-17, -1.4973849048591698e-33];
const PI = [3.141592653589793, 1.2246467991473532e-16];
const LN2 = [0.6931471805599453, 2.3190468138462996e-17, 5.707708438416212e-34];
const EPS = 1e-36;
// 1/n! as double-doubles (the series below multiply by them, a division costs three times more).
const INV_FACT = [dd(1)];
for (let n = 1; n < 40; n++) INV_FACT.push(div(INV_FACT[n - 1], dd(n)));

// x − k·c for a constant c of three parts, as a double-double.
function reduce(x, k, c) {
  const [p1, e1] = twoProd(k, c[0]), [p2, e2] = twoProd(k, c[1]);
  let r = twoSum(x, -p1);
  r = add(r, dd(-e1));
  r = add(r, [-p2, -e2]);
  return add(r, dd(-k * c[2]));
}
// sin and cos of a double-double r, |r| ≤ π/4, by their series.
function sinCosSmall(r) {
  const r2 = mul(r, r);
  let s = r, c = dd(1), pow = dd(1);
  for (let n = 2, sign = -1; n < 40; n += 2, sign = -sign) {
    pow = mul(pow, r2); // r^n
    const cs = mul(pow, INV_FACT[n]), ss = mul(mul(pow, r), INV_FACT[n + 1]);
    c = sign > 0 ? add(c, cs) : sub(c, cs);
    s = sign > 0 ? add(s, ss) : sub(s, ss);
    if (Math.abs(cs[0]) < EPS) break;
  }
  return [s, c];
}
function sinCos(x) {
  const k = Math.round(x / PIO2[0]), [s, c] = sinCosSmall(reduce(x, k, PIO2)), q = ((k % 4) + 4) % 4;
  return q === 0 ? [s, c] : q === 1 ? [c, neg(s)] : q === 2 ? [neg(s), neg(c)] : [neg(c), s];
}
function expDD(x) {
  const k = Math.round(x / LN2[0]), r = scale(reduce(x, k, LN2), 1 / 1024);
  let s = dd(1), pow = dd(1);
  for (let n = 1; n < 40; n++) { pow = mul(pow, r); const term = mul(pow, INV_FACT[n]); s = add(s, term); if (Math.abs(term[0]) < EPS) break; }
  for (let i = 0; i < 10; i++) s = mul(s, s);
  return { s, k };
}
// atan of a double-double |q| ≤ 1: one step of Newton from the engine's value (its error is a few units of the last bit).
function atanDD(q) {
  const y0 = E.atan(q[0]), [s, c] = sinCos(y0), t = div(s, c);
  return add(dd(y0), div(sub(q, t), add(dd(1), mul(q, t))));
}
const divDoubles = (a, b) => div(dd(a), dd(b));
// e^x − 1, correctly rounded, for 2^-28 ≤ |x| < 22 (sinh below).
const expm1 = (x) => { const { s, k } = expDD(x); return round(sub(scale(s, 2 ** k), dd(1))); };

const crMath = {
  sin: (x) => (x === 0 || !Number.isFinite(x) ? E.sin(x) : round(sinCos(x)[0])),
  cos: (x) => (!Number.isFinite(x) ? E.cos(x) : round(sinCos(x)[1])),
  tan: (x) => { if (x === 0 || !Number.isFinite(x)) return E.tan(x); const [s, c] = sinCos(x); return round(div(s, c)); },
  exp: (x) => {
    if (!Number.isFinite(x) || x > 709 || x < -708) return E.exp(x);
    if (x === 0) return 1;
    const { s, k } = expDD(x);
    return round(s) * 2 ** k;
  },
  log: (x) => {
    if (!(x > 0) || !Number.isFinite(x)) return E.log(x);
    if (x === 1) return 0;
    if (Math.abs(x - 1) < 1 / 16) {
      // Near 1: 2·atanh(u), u = (x − 1)/(x + 1) (x − 1 is exact there).
      const u = div(dd(x - 1), twoSum(x, 1)), u2 = mul(u, u);
      let s = u, pow = u;
      for (let n = 3; Math.abs(pow[0]) > EPS * Math.abs(s[0]); n += 2) { pow = mul(pow, u2); s = add(s, div(pow, dd(n))); }
      return round(scale(s, 2));
    }
    const y0 = E.log(x), { s, k } = expDD(-y0), t = sub(mul(dd(x), scale(s, 2 ** k)), dd(1));
    // log(x) = y0 + log1p(t), t tiny.
    return round(add(dd(y0), sub(t, scale(mul(t, t), 0.5))));
  },
  atan: (x) => {
    if (x === 0 || !Number.isFinite(x)) return E.atan(x);
    if (Math.abs(x) <= 1) return round(atanDD(dd(x)));
    const a = atanDD(divDoubles(1, x));
    return round(x > 0 ? sub([PIO2[0], PIO2[1]], a) : sub(neg([PIO2[0], PIO2[1]]), a));
  },
  atan2: (y, x) => {
    if (y === 0 || x === 0 || !Number.isFinite(x) || !Number.isFinite(y)) return E.atan2(y, x);
    if (Math.abs(y) <= Math.abs(x)) {
      const a = atanDD(divDoubles(y, x));
      return round(x > 0 ? a : y >= 0 ? add(a, PI) : sub(a, PI));
    }
    const a = atanDD(divDoubles(x, y)), half = [PIO2[0], PIO2[1]];
    return round(y > 0 ? sub(half, a) : sub(neg(half), a));
  },
  asin: (x) => {
    if (x === 0 || !(Math.abs(x) < 1)) return E.asin(x);
    const y0 = E.asin(x), [s, c] = sinCos(y0);
    return round(add(dd(y0), div(sub(dd(x), s), c)));
  },
  // Not correctly rounded in the page either: fdlibm's formula over a correctly rounded expm1 (as the engine of the page
  // gives it; 20 000 values of the page equal).
  sinh: (x) => {
    const ax = Math.abs(x), h = x < 0 ? -0.5 : 0.5;
    if (x === 0 || !Number.isFinite(x) || ax >= 22 || ax < 2 ** -28) return E.sinh(x);
    const t = expm1(ax);
    return ax < 1 ? h * (2 * t - (t * t) / (t + 1)) : h * (t + t / (t + 1));
  },
};

// The engine's Math replaced by the correctly rounded functions (inside them E is the engine's own).
// Remembered by argument (the app asks the cosine of one latitude thousands of times), at most CACHE values each; ±0
// not (a Map takes them for one key).
const CACHE = 200000;
export function useCorrectMath() {
  for (const [name, f] of Object.entries(crMath)) {
    const seen = new Map();
    Math[name] = f.length === 2
      ? (y, x) => { if (y === 0 || x === 0) return f(y, x); const k = `${y},${x}`; let v = seen.get(k); if (v === undefined) { if (seen.size > CACHE) seen.clear(); v = f(y, x); seen.set(k, v); } return v; }
      : (x) => { if (x === 0) return f(x); let v = seen.get(x); if (v === undefined) { if (seen.size > CACHE) seen.clear(); v = f(x); seen.set(x, v); } return v; };
  }
}
