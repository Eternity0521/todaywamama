import { beforeEach, describe, expect, it } from 'vitest';
import { localStorageStore } from '../storage';
import type { DailyFortune } from '../../core/types';

// node 环境无 localStorage：挂一个内存版 mock（storage.ts 在调用时才访问它）
const mem = new Map<string, string>();
beforeEach(() => {
  mem.clear();
});
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
};

/** 构造最小合法 DailyFortune */
function makeFortune(userId: string, date: string): DailyFortune {
  return {
    date,
    userId,
    reroll: 0,
    main: { stars: 4, cardId: 'card-01', cardName: '注意协作', title: '别单走', desc: '测试描述', good: '宜报点', bad: '忌单摸' },
    position: {
      primary: 'controller',
      scores: { duelist: 2, initiator: 3, controller: 5, sentinel: 4 },
      reason: '测试理由',
      heroes: ['Omen', 'Clove', 'Viper'],
    },
    hero: { id: 'Omen', match: 92, keywords: ['冷静', '信息差', '偷 timing'], blurb: '测试解释' },
    weapon: { id: 'Phantom', reason: '测试理由', avoid: { id: 'Operator', reason: '测试理由' } },
    skin: { id: 'RGX 11z Pro', match: 95, color: '绿色', buddy: 'RGX Butterfly', blurb: '测试文案' },
    maps: [
      { id: 'Ascent', stars: 5, label: '上分圣地' },
      { id: 'Haven', stars: 4, label: '可以一战' },
      { id: 'Bind', stars: 3, label: '五五开' },
      { id: 'Lotus', stars: 2, label: '容易坐牢' },
      { id: 'Breeze', stars: 1, label: '今天最好别碰' },
    ],
    advice: { keyword: '别急', note: '今天你的枪法会奖励耐心。' },
  };
}

describe('localStorageStore', () => {
  it('getUserId 稳定且持久', () => {
    const a = localStorageStore.getUserId();
    const b = localStorageStore.getUserId();
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(0);
  });

  it('save / get 往返一致，同日覆盖写入', () => {
    const f = makeFortune('u1', '2026-08-23');
    localStorageStore.save(f);
    expect(localStorageStore.get('u1', '2026-08-23')).toEqual(f);

    const f2 = { ...makeFortune('u1', '2026-08-23'), reroll: 1 as const };
    localStorageStore.save(f2);
    expect(localStorageStore.get('u1', '2026-08-23')!.reroll).toBe(1);
    expect(localStorageStore.get('u1', '2026-08-24')).toBeNull();
  });

  it('history 按日期降序，跨月正确', () => {
    localStorageStore.save(makeFortune('u1', '2026-07-31'));
    localStorageStore.save(makeFortune('u1', '2026-08-01'));
    localStorageStore.save(makeFortune('u2', '2026-08-02'));
    const h = localStorageStore.history('u1');
    expect(h.map((f) => f.date)).toEqual(['2026-08-01', '2026-07-31']);
  });

  it('90 天上限：只保留最新 90 天', () => {
    const base = new Date(2026, 0, 1);
    for (let i = 0; i < 100; i++) {
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      localStorageStore.save(makeFortune('u1', `${y}-${m}-${day}`));
    }
    const h = localStorageStore.history('u1');
    expect(h).toHaveLength(90);
    expect(h[0].date).toBe('2026-04-10'); // 100 天中最新一天
  });
});
