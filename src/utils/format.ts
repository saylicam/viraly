/** 1 240 → « 1,2 k », 3 400 000 → « 3,4 M ». */
export const formatCount = (n?: number | null) => {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  const one = (v: number) => (v >= 100 ? Math.round(v).toString() : v.toFixed(1).replace(/\.0$/, '').replace('.', ','));
  if (abs >= 1_000_000) return `${one(n / 1_000_000)} M`;
  if (abs >= 10_000) return `${Math.round(n / 1000)} k`;
  if (abs >= 1_000) return `${one(n / 1000)} k`;
  return String(Math.round(n));
};

/** +12 / −4 */
export const formatDelta = (n: number) => (n > 0 ? `+${formatCount(n)}` : n < 0 ? `−${formatCount(-n)}` : '=');
