/**
 * 确定性随机工具（指导书 §5.1，PRD §26 每日 Seed 的基础）。
 * 铁律：运势生成禁止使用 Math.random —— 同一种子必须产出相同序列。
 */

/** 字符串 → uint32 种子（xmur3 哈希） */
export function xmur3(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** uint32 种子 → [0,1) 均匀分布 PRNG（mulberry32） */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rng = () => number;

/** [min, max] 闭区间整数 */
export function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** 等概率取一 */
export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) throw new Error('pick: empty array');
  return items[Math.floor(rng() * items.length)];
}

/** 按权重取一（weights 与 items 等长，权重非负） */
export function weightedPick<T>(rng: Rng, items: readonly T[], weights: readonly number[]): T {
  if (items.length === 0) throw new Error('weightedPick: empty array');
  if (items.length !== weights.length) throw new Error('weightedPick: length mismatch');
  const total = weights.reduce((s, w) => s + w, 0);
  if (total <= 0) throw new Error('weightedPick: total weight must be > 0');
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r < 0) return items[i];
  }
  return items[items.length - 1];
}

/** Fisher–Yates 洗牌（返回新数组，不修改原数组） */
export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
