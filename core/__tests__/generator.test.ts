import { describe, expect, it } from 'vitest';
import {
  ROLES,
  STAR_WEIGHTS,
  backfillMainCard,
  cardFor,
  computePositionWeights,
  genDailyFortune,
  getOrCreateToday,
  rerollToday,
  seedFor,
  yesterdayFortune,
} from '../generator';
import { CARD_POOL } from '../content/cards';
import { mulberry32, weightedPick } from '../random';
import { dateKey } from '../date';
import type { DailyFortune, Star } from '../types';
import type { FortuneStore } from '../store';

/** 内存版 FortuneStore（测试用） */
function memStore(seedFortunes: DailyFortune[] = []): FortuneStore & { data: DailyFortune[] } {
  const data: DailyFortune[] = [...seedFortunes];
  return {
    data,
    getUserId: () => 'test-user',
    get: (userId, date) => data.find((f) => f.userId === userId && f.date === date) ?? null,
    save: (f) => {
      const i = data.findIndex((x) => x.userId === f.userId && x.date === f.date);
      if (i >= 0) data[i] = f;
      else data.push(f);
    },
    history: (userId, days) => {
      const list = data
        .filter((f) => f.userId === userId)
        .sort((a, b) => (a.date < b.date ? 1 : -1));
      return days === undefined ? list : list.slice(0, days);
    },
  };
}

describe('确定性（指导书 §11.1）', () => {
  it('同参数两次生成逐字段相等', () => {
    const store = memStore();
    const a = genDailyFortune('u1', '2026-08-23', 0, store);
    const b = genDailyFortune('u1', '2026-08-23', 0, store);
    expect(a).toEqual(b);
  });

  it('不同 userId / 日期 / reroll 结果不同', () => {
    const store = memStore();
    const base = genDailyFortune('u1', '2026-08-23', 0, store);
    expect(genDailyFortune('u2', '2026-08-23', 0, store)).not.toEqual(base);
    expect(genDailyFortune('u1', '2026-08-24', 0, store)).not.toEqual(base);
    expect(genDailyFortune('u1', '2026-08-23', 1, store)).not.toEqual(base);
  });

  it('seedFor：reroll 与首次种子不同', () => {
    expect(seedFor('u1', '2026-08-23', 0)).not.toBe(seedFor('u1', '2026-08-23', 1));
  });
});

describe('位置权重（指导书 §5.3）', () => {
  it('无事件时：随机档 70 均分 + 未推荐档 20 均分给 fresh', () => {
    const w = computePositionWeights(['duelist'], null);
    expect(w.duelist).toBeCloseTo(37.5); // 17.5 + 20
    expect(w.initiator).toBeCloseTo(17.5);
    expect(w.controller).toBeCloseTo(17.5);
    expect(w.sentinel).toBeCloseTo(17.5);
  });

  it('事件档 10 只加给事件位置', () => {
    const w = computePositionWeights(['duelist'], 'controller');
    expect(w.controller).toBeCloseTo(27.5); // 17.5 + 10
    expect(w.initiator).toBeCloseTo(17.5);
  });

  it('fresh 覆盖全部位置时退回均分', () => {
    const w = computePositionWeights(ROLES, null);
    for (const r of ROLES) expect(w[r]).toBeCloseTo(22.5);
  });

  it('fresh 为空时不产生 NaN', () => {
    const w = computePositionWeights([], null);
    for (const r of ROLES) expect(Number.isFinite(w[r])).toBe(true);
  });
});

describe('星级分布（指导书 §5.2）', () => {
  it('10 万次抽样与权重表误差 <2%', () => {
    const rng = mulberry32(123);
    const stars = [1, 2, 3, 4, 5] as Star[];
    const counts: Record<Star, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const N = 100000;
    const total = stars.reduce((s, x) => s + STAR_WEIGHTS[x], 0);
    for (let i = 0; i < N; i++) {
      counts[weightedPick(rng, stars, stars.map((s) => STAR_WEIGHTS[s]))]++;
    }
    for (const s of stars) {
      const expected = STAR_WEIGHTS[s] / total;
      expect(Math.abs(counts[s] / N - expected)).toBeLessThan(0.02);
    }
  });
});

describe('地图 / 武器星级（指导书 §11.6，「幸运」只在 4–5 星浮动）', () => {
  it('幸运地图 / 幸运武器星级恒为 4 或 5', () => {
    const f = genDailyFortune('u1', '2026-08-23', 0, memStore());
    expect([4, 5]).toContain(f.map.stars);
    expect([4, 5]).toContain(f.weapon.stars);
  });

  it('多次生成能同时覆盖到 4★ 和 5★（不是恒定值）', () => {
    const store = memStore();
    const mapStarsSeen = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const f = genDailyFortune(`u${i}`, '2026-08-23', 0, store);
      mapStarsSeen.add(f.map.stars);
    }
    expect(mapStarsSeen).toEqual(new Set([4, 5]));
  });
});

describe('契合度区间（指导书 §5.4/5.6）', () => {
  it('英雄 88–96，皮肤 90–98', () => {
    const f = genDailyFortune('u1', '2026-08-23', 0, memStore());
    expect(f.hero.match).toBeGreaterThanOrEqual(88);
    expect(f.hero.match).toBeLessThanOrEqual(96);
    expect(f.skin.match).toBeGreaterThanOrEqual(90);
    expect(f.skin.match).toBeLessThanOrEqual(98);
    expect(f.hero.keywords).toHaveLength(3);
  });
});

describe('位置去重（指导书 §11.4）', () => {
  it('模拟 400 天：同一位置最长连推不超过 7 天', () => {
    const store = memStore();
    const base = new Date(2026, 0, 1);
    let maxStreak = 0;
    let streak = 1;
    let prev: string | null = null;
    for (let i = 0; i < 400; i++) {
      const date = dateKey(new Date(base.getFullYear(), base.getMonth(), base.getDate() + i));
      const f = genDailyFortune('u1', date, 0, store);
      store.save(f);
      if (f.position.primary === prev) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 1;
      }
      prev = f.position.primary;
    }
    expect(maxStreak).toBeLessThanOrEqual(7);
  });
});

describe('Advice 去重（指导书 §5.8）', () => {
  it('次日关键词与最近一次不同', () => {
    const store = memStore();
    const d1 = genDailyFortune('u1', '2026-08-22', 0, store);
    store.save(d1);
    const d2 = genDailyFortune('u1', '2026-08-23', 0, store);
    expect(d2.advice.keyword).not.toBe(d1.advice.keyword);
  });
});

describe('流程编排（指导书 §5.9/§5.10）', () => {
  it('getOrCreateToday：当天已存在则原样返回，不重新生成', () => {
    const store = memStore();
    const first = getOrCreateToday('u1', store);
    const second = getOrCreateToday('u1', store);
    expect(second).toEqual(first);
    expect(store.get('u1', first.date)).toEqual(first);
  });

  it('rerollToday：仅 reroll=0 时允许，覆盖保存且结果改变', () => {
    const store = memStore();
    expect(rerollToday('u1', store)).toBeNull(); // 无今日运势 → 拒绝
    const first = getOrCreateToday('u1', store);
    const second = rerollToday('u1', store);
    expect(second).not.toBeNull();
    expect(second!.reroll).toBe(1);
    expect(second).not.toEqual(first);
    expect(store.get('u1', first.date)).toEqual(second); // 已覆盖
    expect(rerollToday('u1', store)).toBeNull(); // 已改命 → 拒绝
  });

  it('yesterdayFortune：返回昨日运势，昨日未测则为 null', () => {
    const store = memStore();
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = dateKey(d);
    const f = genDailyFortune('u1', yesterday, 0, store);
    store.save(f);
    expect(yesterdayFortune('u1', store)).toEqual(f);
    expect(yesterdayFortune('u2', store)).toBeNull();
  });
});

describe('卡面（指导书 §5.2，UI 融合）', () => {
  it('cardFor：同参恒返回同一张卡，改命换流', () => {
    const a = cardFor('u1', '2026-08-23', 0);
    const b = cardFor('u1', '2026-08-23', 0);
    expect(a).toEqual(b);
    expect(cardFor('u1', '2026-08-23', 1)).not.toEqual(a);
    expect(cardFor('u2', '2026-08-23', 0)).not.toEqual(a);
  });

  it('生成的主运卡面字段与卡面池一致', () => {
    const f = genDailyFortune('u1', '2026-08-23', 0, memStore());
    const card = CARD_POOL.find((c) => c.id === f.main.cardId);
    expect(card).toBeDefined();
    expect(f.main.cardName).toBe(card!.name);
    expect(f.main.title).toBe(card!.title);
    expect(f.main.desc).toBe(card!.read);
    expect(f.main.good).toBe(card!.good);
    expect(f.main.bad).toBe(card!.bad);
  });

  it('backfillMainCard：旧结构补齐且幂等', () => {
    const f = genDailyFortune('u1', '2026-08-23', 0, memStore());
    const old = { ...f, main: { stars: f.main.stars, title: '旧标题', desc: '旧描述' } } as unknown as DailyFortune;
    const filled = backfillMainCard(old);
    expect(filled.main.cardId).toBe(cardFor('u1', '2026-08-23', 0).id);
    expect(filled.main.title).not.toBe('旧标题');
    expect(backfillMainCard(filled)).toBe(filled); // 已有 cardId 原样返回
    expect(backfillMainCard(filled)).toEqual(filled);
  });
});
