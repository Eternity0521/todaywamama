import { describe, expect, it } from 'vitest';
import { xmur3, mulberry32, randInt, pick, weightedPick, shuffle } from '../random';

describe('xmur3', () => {
  it('同一字符串产出相同种子', () => {
    expect(xmur3('user-1|2026-08-23')).toBe(xmur3('user-1|2026-08-23'));
  });

  it('不同输入产出不同种子', () => {
    expect(xmur3('a')).not.toBe(xmur3('b'));
  });

  it('种子为 uint32 非负整数', () => {
    const s = xmur3('anything');
    expect(Number.isInteger(s)).toBe(true);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(0xffffffff);
  });
});

describe('mulberry32', () => {
  it('同种子产出相同序列', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 100; i++) expect(a()).toBe(b());
  });

  it('值域为 [0,1)', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 10000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('分布近似均匀（均值接近 0.5）', () => {
    const rng = mulberry32(123);
    let sum = 0;
    const N = 10000;
    for (let i = 0; i < N; i++) sum += rng();
    expect(Math.abs(sum / N - 0.5)).toBeLessThan(0.02);
  });
});

describe('randInt', () => {
  it('始终落在闭区间内', () => {
    const rng = mulberry32(9);
    for (let i = 0; i < 1000; i++) {
      const v = randInt(rng, 88, 96);
      expect(v).toBeGreaterThanOrEqual(88);
      expect(v).toBeLessThanOrEqual(96);
    }
  });
});

describe('pick', () => {
  it('空数组抛错', () => {
    expect(() => pick(mulberry32(1), [])).toThrow();
  });

  it('单元素数组恒返回该元素', () => {
    expect(pick(mulberry32(1), ['x'])).toBe('x');
  });
});

describe('weightedPick', () => {
  it('权重分布近似正确', () => {
    const rng = mulberry32(5);
    const counts = [0, 0];
    const N = 100000;
    for (let i = 0; i < N; i++) {
      counts[weightedPick(rng, [0, 1], [80, 20])]++;
    }
    const ratio = counts[0] / N;
    expect(Math.abs(ratio - 0.8)).toBeLessThan(0.03);
  });

  it('权重与元素长度不一致时抛错', () => {
    expect(() => weightedPick(mulberry32(1), ['a'], [1, 2])).toThrow();
  });
});

describe('shuffle', () => {
  it('返回同长度排列且不修改原数组', () => {
    const src = [1, 2, 3, 4, 5];
    const out = shuffle(mulberry32(3), src);
    expect(out).toHaveLength(5);
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5]);
    expect(src).toEqual([1, 2, 3, 4, 5]);
  });

  it('同种子序列下结果确定', () => {
    const a = shuffle(mulberry32(11), [1, 2, 3, 4, 5]);
    const b = shuffle(mulberry32(11), [1, 2, 3, 4, 5]);
    expect(a).toEqual(b);
  });
});
