import { describe, expect, it } from 'vitest';
import {
  EMPTY_PREFS,
  ROLES,
  STAR_WEIGHTS,
  backfillMainCard,
  cardFor,
  cardForSlot,
  computeHeroWeights,
  computePositionWeights,
  genDailyFortune,
  getOrCreateToday,
  lockCardPick,
  rerollToday,
  seedFor,
  yesterdayFortune,
} from '../generator';
import { CARD_POOL } from '../content/cards';
import { HEROES_BY_ROLE } from '../content/heroes';
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

  // ===== 偏好档（指导书 §5.3，P1 已接入）：40 随机 + 30 偏好 + 20 未推荐 + 10 事件 =====

  it('偏好位置且 fresh 时叠加：随机 10 + 偏好 30 + 未推荐 20', () => {
    const w = computePositionWeights(['duelist'], null, { role: 'duelist', agents: [] });
    expect(w.duelist).toBeCloseTo(60);
    expect(w.initiator).toBeCloseTo(10);
    expect(w.controller).toBeCloseTo(10);
    expect(w.sentinel).toBeCloseTo(10);
  });

  it('偏好位置不在 fresh 中：40 = 随机 10 + 偏好 30', () => {
    const w = computePositionWeights(['controller'], null, { role: 'duelist', agents: [] });
    expect(w.duelist).toBeCloseTo(40);
    expect(w.controller).toBeCloseTo(30);
    expect(w.initiator).toBeCloseTo(10);
    expect(w.sentinel).toBeCloseTo(10);
  });

  it('偏好与事件同位置叠加：40 + 30 + 20 + 10 = 70', () => {
    const w = computePositionWeights(['duelist'], 'duelist', { role: 'duelist', agents: [] });
    expect(w.duelist).toBeCloseTo(70);
    for (const r of ROLES.filter((r) => r !== 'duelist')) expect(w[r]).toBeCloseTo(10);
  });

  it('偏好与事件异位置：偏好 60，事件位置 20', () => {
    const w = computePositionWeights(['duelist'], 'sentinel', { role: 'duelist', agents: [] });
    expect(w.duelist).toBeCloseTo(60);
    expect(w.sentinel).toBeCloseTo(20);
    expect(w.initiator).toBeCloseTo(10);
    expect(w.controller).toBeCloseTo(10);
  });

  it('偏好设置且 fresh 为空时不产生 NaN', () => {
    const w = computePositionWeights([], null, { role: 'controller', agents: [] });
    expect(w.controller).toBeCloseTo(40);
    for (const r of ROLES.filter((r) => r !== 'controller')) expect(w[r]).toBeCloseTo(10);
  });

  it('空偏好与缺省参数逐值相等', () => {
    expect(computePositionWeights(['duelist'], null, EMPTY_PREFS)).toEqual(
      computePositionWeights(['duelist'], null),
    );
  });
});

describe('英雄偏好权重（指导书 §5.4 扩展：pref 6 : normal 3 : recent 1）', () => {
  it('偏好英雄 2×：Omen 6，其余 3', () => {
    const w = computeHeroWeights(HEROES_BY_ROLE.controller, new Set(), ['omen']);
    const omen = HEROES_BY_ROLE.controller.find((h) => h.id === 'Omen')!;
    expect(w[HEROES_BY_ROLE.controller.indexOf(omen)]).toBe(6);
    for (const x of w.filter((_, i) => HEROES_BY_ROLE.controller[i].id !== 'Omen')) {
      expect(x).toBe(3);
    }
  });

  it('recent 与偏好叠加为 2（1×2）', () => {
    const w = computeHeroWeights(HEROES_BY_ROLE.controller, new Set(['Omen']), ['omen']);
    const omenIdx = HEROES_BY_ROLE.controller.findIndex((h) => h.id === 'Omen');
    expect(w[omenIdx]).toBe(2);
    const viperIdx = HEROES_BY_ROLE.controller.findIndex((h) => h.id === 'Viper');
    expect(w[viperIdx]).toBe(3);
  });

  it('recent 非偏好英雄仍为 1', () => {
    const w = computeHeroWeights(HEROES_BY_ROLE.controller, new Set(['Viper']), ['omen']);
    const viperIdx = HEROES_BY_ROLE.controller.findIndex((h) => h.id === 'Viper');
    expect(w[viperIdx]).toBe(1);
    const omenIdx = HEROES_BY_ROLE.controller.findIndex((h) => h.id === 'Omen');
    expect(w[omenIdx]).toBe(6);
  });

  it('偏好 id 经归一化匹配（KAY/O ↔ kayo）', () => {
    const w = computeHeroWeights(HEROES_BY_ROLE.initiator, new Set(), ['KAY/O']);
    const idx = HEROES_BY_ROLE.initiator.findIndex((h) => h.id === 'KAY/O');
    expect(w[idx]).toBe(6);
  });

  it('跨位置偏好不生效：duelist 池 + 偏好 omen 全为 3', () => {
    const w = computeHeroWeights(HEROES_BY_ROLE.duelist, new Set(), ['omen']);
    for (const x of w) expect(x).toBe(3);
  });

  it('池外/未知 id 静默忽略', () => {
    const w = computeHeroWeights(HEROES_BY_ROLE.controller, new Set(), ['nobody', 'miks']);
    for (const x of w) expect(x).toBe(3);
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

describe('偏好接入：统计（全部种子化，确定不 flaky）', () => {
  it('位置偏好 400 天对照：偏好位置出现率显著高于无偏好', () => {
    // 空历史下：偏好位置权重 45/90 = 50%，无偏好 22.5/90 = 25%
    const base = new Date(2026, 0, 1);
    let prefCount = 0;
    let noPrefCount = 0;
    for (let i = 0; i < 400; i++) {
      const date = dateKey(new Date(base.getFullYear(), base.getMonth(), base.getDate() + i));
      const fPref = genDailyFortune('u-pref', date, 0, memStore(), { role: 'duelist', agents: [] });
      const fNo = genDailyFortune('u-nopref', date, 0, memStore());
      if (fPref.position.primary === 'duelist') prefCount++;
      if (fNo.position.primary === 'duelist') noPrefCount++;
    }
    expect(prefCount).toBeGreaterThan(noPrefCount);
    expect(prefCount).toBeGreaterThanOrEqual(130); // 期望 ~200，σ≈10，7σ 裕度
  });

  it('英雄偏好权重 10 万次抽样与理论份额误差 <2%', () => {
    const pool = HEROES_BY_ROLE.controller;
    const weights = computeHeroWeights(pool, new Set(), ['omen']);
    const total = weights.reduce((s, x) => s + x, 0);
    const omenIdx = pool.findIndex((h) => h.id === 'Omen');
    const rng = mulberry32(123);
    const N = 100000;
    let omenCount = 0;
    for (let i = 0; i < N; i++) {
      if (weightedPick(rng, pool, weights).id === 'Omen') omenCount++;
    }
    expect(Math.abs(omenCount / N - weights[omenIdx] / total)).toBeLessThan(0.02);
  });

  it('常用英雄偏好确实流入英雄抽取（有/无英雄偏好结果可区分）', () => {
    // 同 userId 同日，仅 agents 不同：位置权重相同 → 位置结果相同，
    // 英雄权重不同 → 若接线生效，多日采样下必然出现英雄差异；未接线则恒为 0。
    const base = new Date(2026, 5, 1);
    let diff = 0;
    for (let i = 0; i < 400; i++) {
      const date = dateKey(new Date(base.getFullYear(), base.getMonth(), base.getDate() + i));
      const a = genDailyFortune('u-wire', date, 0, memStore(), { role: 'controller', agents: ['omen'] });
      const b = genDailyFortune('u-wire', date, 0, memStore(), { role: 'controller', agents: [] });
      if (a.hero.id !== b.hero.id) diff++;
    }
    expect(diff).toBeGreaterThan(0);
  });
});

describe('偏好缺省回归（无偏好 == 空偏好 == 缺省参数）', () => {
  it('genDailyFortune：缺省与空偏好逐字段相等（reroll 0/1）', () => {
    const store = memStore();
    const a = genDailyFortune('u1', '2026-08-23', 0, store);
    const b = genDailyFortune('u1', '2026-08-23', 0, store, EMPTY_PREFS);
    const c = genDailyFortune('u1', '2026-08-23', 0, store, { role: null, agents: [] });
    expect(a).toEqual(b);
    expect(a).toEqual(c);
    expect(genDailyFortune('u1', '2026-08-23', 1, store)).toEqual(
      genDailyFortune('u1', '2026-08-23', 1, store, EMPTY_PREFS),
    );
  });

  it('getOrCreateToday / rerollToday：缺省与空偏好结果一致', () => {
    const s1 = memStore();
    const s2 = memStore();
    const f1 = getOrCreateToday('u1', s1);
    const f2 = getOrCreateToday('u1', s2, EMPTY_PREFS);
    expect(f1).toEqual(f2);
    const r1 = rerollToday('u1', s1);
    const r2 = rerollToday('u1', s2, EMPTY_PREFS);
    expect(r1).not.toBeNull();
    expect(r2).not.toBeNull();
    expect(r1).toEqual(r2);
  });

  it('偏好改变结果：同 (u, date) 有/无位置偏好多日采样下可区分', () => {
    const base = new Date(2026, 8, 1);
    let diff = 0;
    for (let i = 0; i < 30; i++) {
      const date = dateKey(new Date(base.getFullYear(), base.getMonth(), base.getDate() + i));
      const a = genDailyFortune('u-diff', date, 0, memStore());
      const b = genDailyFortune('u-diff', date, 0, memStore(), { role: 'sentinel', agents: [] });
      if (a.position.primary !== b.position.primary) diff++;
    }
    expect(diff).toBeGreaterThan(0);
  });
});

describe('抽卡页选卡：首选锁定 + 昨日去重', () => {
  it('cardForSlot：同参恒返回同一张卡', () => {
    expect(cardForSlot('u1', '2026-08-23', 0, 3)).toEqual(cardForSlot('u1', '2026-08-23', 0, 3));
    expect(cardForSlot('u1', '2026-08-23', 1, 3)).not.toEqual(cardForSlot('u1', '2026-08-23', 0, 3));
  });

  it('不同卡位产生不同卡面（11 卡位从 10 卡池抽，鸽笼原理必 ≥2 种）', () => {
    const ids = new Set(
      Array.from({ length: 11 }, (_, s) => cardForSlot('u1', '2026-08-23', 0, s).id),
    );
    expect(ids.size).toBeGreaterThanOrEqual(2);
  });

  it('同一卡位不同日期为独立抽取：连续 7 天抽同一卡位不全是同一张', () => {
    const ids = new Set<string>();
    const base = new Date(2026, 0, 1);
    for (let i = 0; i < 7; i++) {
      const date = dateKey(new Date(base.getFullYear(), base.getMonth(), base.getDate() + i));
      ids.add(cardForSlot('u-slot', date, 0, 1).id);
    }
    expect(ids.size).toBeGreaterThanOrEqual(2);
  });

  it('昨日去重：与 avoid 相同重抽一次，命中率从 10% 降到 ~1%', () => {
    const avoid = CARD_POOL[0].id;
    let hit = 0;
    const N = 10000;
    const base = new Date(2026, 1, 1);
    for (let i = 0; i < N; i++) {
      const date = dateKey(new Date(base.getFullYear(), base.getMonth(), base.getDate() + i));
      if (cardForSlot('u-avoid', date, 0, 2, avoid).id === avoid) hit++;
    }
    expect(hit / N).toBeLessThan(0.02); // 期望 ~1%
  });

  it('lockCardPick：按所选卡位锁定卡面并落库，其余运势字段不变', () => {
    const store = memStore();
    const f = genDailyFortune('u1', '2026-08-23', 0, store);
    const next = lockCardPick(f, 3, store);
    const expected = cardForSlot('u1', '2026-08-23', 0, 3);
    expect(next.main.cardId).toBe(expected.id);
    expect(next.main.cardName).toBe(expected.name);
    expect(next.main.title).toBe(expected.title);
    expect(store.get('u1', '2026-08-23')).toEqual(next); // 已落库
    // 卡面以外逐字段不变（星级不可刷）
    expect(next.main.stars).toBe(f.main.stars);
    expect(next.position).toEqual(f.position);
    expect(next.hero).toEqual(f.hero);
    expect(next.weapon).toEqual(f.weapon);
    expect(next.skin).toEqual(f.skin);
    expect(next.map).toEqual(f.map);
    expect(next.advice).toEqual(f.advice);
  });

  it('lockCardPick：确定性（同卡位两次锁定结果一致）', () => {
    const s1 = memStore();
    const s2 = memStore();
    const f1 = genDailyFortune('u1', '2026-08-23', 0, s1);
    const f2 = genDailyFortune('u1', '2026-08-23', 0, s2);
    expect(lockCardPick(f1, 5, s1).main).toEqual(lockCardPick(f2, 5, s2).main);
  });

  it('lockCardPick：去重参数取自最近一次非当日卡面', () => {
    const store = memStore();
    const yesterday = genDailyFortune('u1', '2026-08-22', 0, store);
    store.save(yesterday);
    const f = genDailyFortune('u1', '2026-08-23', 0, store);
    const next = lockCardPick(f, 0, store);
    // 与显式传入昨日卡面的 cardForSlot 结果一致 → avoid 参数接线正确
    expect(next.main.cardId).toBe(
      cardForSlot('u1', '2026-08-23', 0, 0, yesterday.main.cardId).id,
    );
  });
});
