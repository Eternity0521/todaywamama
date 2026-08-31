/**
 * 运势生成器（指导书 §5）。
 *
 * 铁律：确定性生成。同 (userId, date, reroll) 必须逐字段产出相同结果。
 * 所有随机抽取按固定代码顺序从同一个 PRNG 取数——顺序写死后不允许改动。
 * 本文件禁止出现 Math.random 与任何非确定性数据源。
 */
import type {
  Advice,
  DailyFortune,
  HeroFortune,
  MainLuck,
  MapFortune,
  PositionFortune,
  Role,
  SkinFortune,
  Star,
  WeaponFortune,
} from './types';
import { mulberry32, pick, randInt, shuffle, weightedPick, xmur3, type Rng } from './random';
import { dateKey, todayKey } from './date';
import { HEROES_BY_ROLE, POSITION_REASONS } from './content/heroes';
import { WEAPON_POOL } from './content/weapons';
import { BUDDIES, SKIN_POOL } from './content/skins';
import { MAP_LABELS, MAP_POOL } from './content/maps';
import { ADVICE_POOL } from './content/advice';
import { CARD_POOL, type CardEntry } from './content/cards';
import type { FortuneStore } from './store';

export const ROLES: Role[] = ['duelist', 'initiator', 'controller', 'sentinel'];

/** 主运星级权重（指导书 §5.2） */
export const STAR_WEIGHTS: Record<Star, number> = { 1: 4, 2: 16, 3: 30, 4: 32, 5: 18 };

/** 每日种子串 → PRNG 种子（指导书 §5.1；改命追加 |r1） */
export function seedFor(userId: string, date: string, reroll: 0 | 1): number {
  return xmur3(`${userId}|${date}${reroll === 1 ? '|r1' : ''}`);
}

/**
 * 卡面抽取（指导书 §5.2）：独立确定性流，与主 RNG 完全隔离。
 * 同 (userId, date, reroll) 恒返回同一张卡；改命（reroll=1）自动换流重抽。
 */
export function cardFor(userId: string, date: string, reroll: 0 | 1): CardEntry {
  const seed = xmur3(`${userId}|${date}${reroll === 1 ? '|r1' : ''}|card`);
  return pick(mulberry32(seed), CARD_POOL);
}

/**
 * 旧数据补齐（UI 融合迁移）：旧结构 main 无 cardId 时，按运势自身参数
 * 精确补算卡面字段。幂等、确定性、无副作用，可重复调用。
 * 旧结构只存在于存量 localStorage 数据中（类型系统里不存在），
 * 故用 LegacyMain 显式处理。
 */
type LegacyMain = Omit<MainLuck, 'cardId' | 'cardName' | 'good' | 'bad'>;

export function backfillMainCard(f: DailyFortune): DailyFortune {
  const main = f.main as LegacyMain;
  if ('cardId' in main) return f;
  const c = cardFor(f.userId, f.date, f.reroll);
  return {
    ...f,
    main: {
      ...main,
      cardId: c.id,
      cardName: c.name,
      title: c.title,
      desc: c.read,
      good: c.good,
      bad: c.bad,
    },
  };
}

/** 特殊事件钩子（指导书 §5.3）：P0 恒返回 null，P1 接入（如赛季/节日加成） */
export function specialEventOf(_date: string): Role | null {
  return null;
}

/**
 * 位置权重计算（指导书 §5.3，导出以便单测）：
 * 随机档 70 均分给全部位置 + 近期未推荐档 20 均分给 fresh 位置 + 特殊事件档 10 给事件位置。
 * （偏好档 30 为 P1，未设置时并入随机档。）
 */
export function computePositionWeights(fresh: Role[], event: Role | null): Record<Role, number> {
  const weights = {} as Record<Role, number>;
  const randomShare = 70 / ROLES.length;
  const freshShare = fresh.length > 0 ? 20 / fresh.length : 0;
  for (const role of ROLES) {
    let w = randomShare;
    if (fresh.includes(role)) w += freshShare;
    if (event === role) w += 10;
    weights[role] = w;
  }
  return weights;
}

/**
 * 生成一份当日运势（纯函数，不落库）。
 * store 仅用于读取历史（近期未推荐 / Advice 去重），不产生副作用。
 */
export function genDailyFortune(
  userId: string,
  date: string,
  reroll: 0 | 1,
  store: FortuneStore,
): DailyFortune {
  const rng = mulberry32(seedFor(userId, date, reroll));
  // 近期 7 天历史（排除当天自身）
  const history = store
    .history(userId, 8)
    .filter((f) => f.date !== date)
    .slice(0, 7);

  // ===== 以下抽取顺序固定，不可调整 =====
  // 1. 主运星级（§5.2）
  const stars = weightedPick(
    rng,
    ROLES.map((_, i) => (i + 1) as Star),
    ROLES.map((_, i) => STAR_WEIGHTS[(i + 1) as Star]),
  );

  // 2. 幸运位置（§5.3）
  const position = genPosition(rng, date, history);

  // 3. 幸运英雄（§5.4）
  const hero = genHero(rng, position.primary, history);

  // 4. 幸运武器（§5.5）
  const weapon = genWeapon(rng);

  // 5. 幸运皮肤（§5.6）
  const skin = genSkin(rng);

  // 6. 幸运地图（§5.7）
  const maps = genMaps(rng);

  // 7. 今日 Advice（§5.8）
  const advice = genAdvice(rng, history);
  // ===== 抽取顺序结束 =====

  // 8. 卡面（§5.2）：独立种子流，不消耗主 RNG（不扰动既有 7 步抽取）
  const card = cardFor(userId, date, reroll);
  const main = {
    stars,
    cardId: card.id,
    cardName: card.name,
    title: card.title,
    desc: card.read,
    good: card.good,
    bad: card.bad,
  };

  return { date, userId, reroll, main, position, hero, weapon, skin, maps, advice };
}

/** 取当日运势：已存在则直接返回（PRD §26 一致性），否则生成并保存 */
export function getOrCreateToday(userId: string, store: FortuneStore): DailyFortune {
  const date = todayKey();
  const existing = store.get(userId, date);
  if (existing) return existing;
  const fortune = genDailyFortune(userId, date, 0, store);
  store.save(fortune);
  return fortune;
}

/** 改命（PRD §26）：仅当今日存在且 reroll=0 时允许，返回新运势；否则返回 null */
export function rerollToday(userId: string, store: FortuneStore): DailyFortune | null {
  const date = todayKey();
  const existing = store.get(userId, date);
  if (!existing || existing.reroll !== 0) return null;
  const fortune = genDailyFortune(userId, date, 1, store);
  store.save(fortune);
  return fortune;
}

/** 昨日运势（首页展示，PRD §11）；昨日未测过则返回 null */
export function yesterdayFortune(userId: string, store: FortuneStore): DailyFortune | null {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return store.get(userId, dateKey(d));
}

// ============ 内部生成函数（顺序不可变） ============

function genPosition(rng: Rng, date: string, history: DailyFortune[]): PositionFortune {
  const recent = new Set(history.map((f) => f.position.primary));
  const fresh = ROLES.filter((r) => !recent.has(r));
  const event = specialEventOf(date);
  const weights = computePositionWeights(fresh, event);
  const primary = weightedPick(rng, ROLES, ROLES.map((r) => weights[r]));

  // 四位置指数：primary 固定 5★，其余从 [4,3,2] 洗牌分配
  const scores = {} as Record<Role, Star>;
  scores[primary] = 5;
  const others = shuffle(rng, ROLES.filter((r) => r !== primary));
  ([4, 3, 2] as Star[]).forEach((s, i) => {
    scores[others[i]] = s;
  });

  // 该位置推荐 3 个英雄（展示用）
  const heroes = shuffle(rng, HEROES_BY_ROLE[primary])
    .slice(0, 3)
    .map((h) => h.name);

  return { primary, scores, reason: pick(rng, POSITION_REASONS[primary]), heroes };
}

function genHero(rng: Rng, role: Role, history: DailyFortune[]): HeroFortune {
  const pool = HEROES_BY_ROLE[role];
  const recentHeroes = new Set(history.map((f) => f.hero.id));
  // 近 7 天推荐过的英雄权重降为 1/3
  const weights = pool.map((h) => (recentHeroes.has(h.id) ? 1 : 3));
  const hero = weightedPick(rng, pool, weights);
  return {
    id: hero.id,
    match: randInt(rng, 88, 96),
    keywords: shuffle(rng, hero.keywords).slice(0, 3),
    blurb: pick(rng, hero.blurbs),
  };
}

function genWeapon(rng: Rng): WeaponFortune {
  const weapon = pick(rng, WEAPON_POOL);
  const avoid = pick(rng, WEAPON_POOL.filter((w) => w.id !== weapon.id));
  return {
    id: weapon.id,
    reason: pick(rng, weapon.reasons),
    avoid: { id: avoid.id, reason: pick(rng, avoid.avoidReasons) },
  };
}

function genSkin(rng: Rng): SkinFortune {
  const skin = pick(rng, SKIN_POOL);
  return {
    id: skin.id,
    match: randInt(rng, 90, 98),
    color: pick(rng, skin.colors),
    buddy: pick(rng, BUDDIES),
    blurb: pick(rng, skin.blurbs),
  };
}

function genMaps(rng: Rng): MapFortune[] {
  const stars = shuffle(rng, [5, 4, 3, 2, 1] as Star[]);
  const maps = shuffle(rng, MAP_POOL);
  return maps
    .map((m, i) => ({ id: m.id, stars: stars[i], label: pick(rng, MAP_LABELS[stars[i]]) }))
    .sort((a, b) => b.stars - a.stars); // 降序：[0] = 幸运地图，[last] = 今日雷区
}

function genAdvice(rng: Rng, history: DailyFortune[]): Advice {
  const lastKeyword = history[0]?.advice.keyword;
  let advice = pick(rng, ADVICE_POOL);
  // 避免与最近一次重复（池子 >1 时必然收敛）
  while (advice.keyword === lastKeyword) {
    advice = pick(rng, ADVICE_POOL);
  }
  return { ...advice };
}
