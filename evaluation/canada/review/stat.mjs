// The sign test and the Wilson interval of the scores here.
const choose = (n, k) => { let c = 1; for (let i = 0; i < k; i++) c = (c * (n - i)) / (i + 1); return c; };
export const sign = (a, b) => { const n = a + b; if (!n) return 1; let s = 0; for (let i = Math.max(a, b); i <= n; i++) s += choose(n, i); return Math.min(1, (2 * s) / 2 ** n); };
export const wilson = (a, n) => { if (!n) return ""; const z = 1.96, p = a / n, d = 1 + (z * z) / n, m = p + (z * z) / (2 * n), q = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n)); return `${Math.round((100 * (m - q)) / d)}–${Math.round((100 * (m + q)) / d)} %`; };
