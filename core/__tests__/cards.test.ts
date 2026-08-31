import { describe, expect, it } from 'vitest';
import { CARD_POOL } from '../content/cards';
import { STAR_TONE } from '../content/starTone';

describe('卡面内容库（指导书 §6.6）', () => {
  it('恰 10 张卡，id 唯一且格式正确', () => {
    expect(CARD_POOL).toHaveLength(10);
    const ids = CARD_POOL.map((c) => c.id);
    expect(new Set(ids).size).toBe(10);
    for (const id of ids) expect(id).toMatch(/^card-\d{2}$/);
  });

  it('每张卡字段非空，read ≤ 60 字', () => {
    for (const c of CARD_POOL) {
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.title.length).toBeGreaterThan(0);
      expect(c.read.length).toBeGreaterThan(0);
      expect(c.read.length).toBeLessThanOrEqual(60);
      expect(c.good.length).toBeGreaterThan(0);
      expect(c.bad.length).toBeGreaterThan(0);
    }
  });

  it('good 以「宜」开头、bad 以「忌」开头', () => {
    for (const c of CARD_POOL) {
      expect(c.good.startsWith('宜')).toBe(true);
      expect(c.bad.startsWith('忌')).toBe(true);
    }
  });

  it('星级基调表覆盖 1–5 星（1★ 娱乐局铁律）', () => {
    expect(STAR_TONE[1]).toBe('娱乐局');
    for (const s of [1, 2, 3, 4, 5] as const) {
      expect(STAR_TONE[s].length).toBeGreaterThan(0);
    }
  });
});
