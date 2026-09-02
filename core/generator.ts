/**
 * 运势生成器（指导书 §5）。
 *
 * 铁律：确定性生成。同 (userId, date, reroll, prefs) 必须逐字段产出相同结果。
 * 所有随机抽取按固定代码顺序从同一个 PRNG 取数——顺序写死后不允许改动。
 * 偏好（prefs）只影响权重，不进种子、不改变抽取次数与顺序。
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
  UserPrefs,
  WeaponFortune,
} from './types';
import { mulberry32, pick, randInt, shuffle, weightedPick, xmur3, type Rng } from './random';
import { dateKey, todayKey } from './date';
import { HEROES_BY_ROLE, POSITION_REASONS, type HeroEntry } from './content/heroes';
import { WEAPON_POOL } from './content/weapons';
import { BUDDIES, COLOR_CATEGORIES } from './content/skins';
import { MAP_LABELS, MAP_POOL } from './content/maps';
import { ADVICE_POOL } from './content/advice';
import { CARD_POOL, type CardEntry } from './content/cards';
import { normalizeAgentId } from './content/agents';
import type { FortuneStore } from './store';

export const ROLES: Role[] = ['duelist', 'initiator', 'controller', 'sentinel'];

/** 空偏好：与缺省参数行为逐字节一致（供调用方/测试使用） */
export const EMPTY_PREFS: UserPrefs = { role: null, agents: [] };

/** 主运星级权重（指导书 §5.2） */
export const STAR_WEIGHTS: Record<Star, number> = { 1: 4, 2: 16, 3: 30, 4: 32, 5: 18 };

/** 每日种子串 → PRNG 种子（指导书 §5.1；改命追加 |r1） */
export function seedFor(userId: string, date: string, reroll: 0 | 1): number {
  return xmur3(`${userId}|${date}${reroll === 1 ? '|r1' : ''}`);
}

/**
 * 卡面抽取（指导书 §5.2）：独立确定性流，与主 RNG 完全隔离。
 * 同 (userId, date, reroll) 恒返回同一张卡；改命（reroll=1）自动换流重抽。
 * 现在仅用于存量数据补齐（backfillMainCard）；当天新抽卡走 cardForSlot（首选锁定）。
 */
export function cardFor(userId: string, date: string, reroll: 0 | 1): CardEntry {
  const seed = xmur3(`${userId}|${date}${reroll === 1 ? '|r1' : ''}|card`);
  return pick(mulberry32(seed), CARD_POOL);
}

/**
 * 抽卡页选卡卡面（首选锁定）：卡面种子带上所选卡位 slot（0–10）。
 * 同 (userId, date, reroll, slot) 恒返回同一张卡；卡位/日期不同即为独立抽取
 * （连续多天抽同一卡位是多次独立均匀抽取，不会同卡）。
 * avoidCardId：与最近一次（昨日）记录去重——若首抽相同则沿同一 rng 再抽一次
 * （确定性，连续同卡概率 10% → 1%）。
 */
export function cardForSlot(
  userId: string,
  date: string,
  reroll: 0 | 1,
  slot: number,
  avoidCardId?: string,
): CardEntry {
  const seed = xmur3(`${userId}|${date}${reroll === 1 ? '|r1' : ''}|slot-${slot}|card`);
  const rng = mulberry32(seed);
  let card = pick(rng, CARD_POOL);
  if (avoidCardId && card.id === avoidCardId) card = pick(rng, CARD_POOL);
  return card;
}

/**
 * 抽卡页选卡落库（首选锁定，PRD §26 一致性）：按所选卡位重定卡面并保存。
 * 当天首次抽中即锁定——此后重进、分享卡均展示这张；运势其余字段不变（星级不可刷）。
 * 与最近一次（非当日）卡面去重。幂等性由 UI 状态机保证（当日抽过即直达揭晓页）。
 */
export function lockCardPick(fortune: DailyFortune, slot: number, store: FortuneStore): DailyFortune {
  const last = store.history(fortune.userId, 2).find((f) => f.date !== fortune.date);
  const card = cardForSlot(fortune.userId, fortune.date, fortune.reroll, slot, last?.main.cardId);
  const next: DailyFortune = {
    ...fortune,
    main: {
      ...fortune.main,
      cardId: card.id,
      cardName: card.name,
      title: card.title,
      desc: card.read,
      good: card.good,
      bad: card.bad,
    },
  };
  store.save(next);
  return next;
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
 * 偏好已设置 → 随机档 40 + 偏好档 30 + 近期未推荐档 20 + 特殊事件档 10；
 * 偏好未设置 → 维持 P0 降级（偏好并入随机档，70/20/10，逐值与旧行为一致）。
 */
export function computePositionWeights(
  fresh: Role[],
  event: Role | null,
  prefs?: UserPrefs,
): Record<Role, number> {
  const weights = {} as Record<Role, number>;
  const prefRole = prefs?.role ?? null;
  const randomShare = (prefRole ? 40 : 70) / ROLES.length;
  const freshShare = fresh.length > 0 ? 20 / fresh.length : 0;
  for (const role of ROLES) {
    let w = randomShare;
    if (fresh.includes(role)) w += freshShare;
    if (prefRole === role) w += 30;
    if (event === role) w += 10;
    weights[role] = w;
  }
  return weights;
}

/**
 * 英雄池权重（指导书 §5.4 扩展，导出以便单测）：
 * 近 7 天推荐过 1 : 正常 3；偏好英雄 ×2（pref 6 : normal 3 : recent 1，recent 与偏好叠加为 2）。
 * 池只含 primary 位置英雄，跨位置偏好在调用侧天然不生效；heroes.ts 没有的池外 id 静默忽略。
 */
export function computeHeroWeights(
  pool: readonly HeroEntry[],
  recentIds: ReadonlySet<string>,
  prefAgents: readonly string[],
): number[] {
  const prefIds = new Set(prefAgents.map(normalizeAgentId));
  return pool.map((h) => {
    const base = recentIds.has(h.id) ? 1 : 3;
    return prefIds.has(normalizeAgentId(h.id)) ? base * 2 : base;
  });
}

/**
 * 生成一份当日运势（纯函数，不落库）。
 * store 仅用于读取历史（近期未推荐 / Advice 去重），不产生副作用。
 * prefs（可选）：onboarding 收集的常打位置/常用英雄，仅作权重输入不进种子；
 * 缺省 = 无偏好 = 与接入前行为逐字节一致。确定性契约：同 (userId, date, reroll, prefs)。
 */
export function genDailyFortune(
  userId: string,
  date: string,
  reroll: 0 | 1,
  store: FortuneStore,
  prefs?: UserPrefs,
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
  const position = genPosition(rng, date, history, prefs);

  // 3. 幸运英雄（§5.4）
  const hero = genHero(rng, position.primary, history, prefs);

  // 4. 幸运武器（§5.5）
  const weapon = genWeapon(rng);

  // 5. 幸运皮肤（§5.6）
  const skin = genSkin(rng);

  // 6. 幸运地图（§5.7）
  const map = genMap(rng);

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

  return { date, userId, reroll, main, position, hero, weapon, skin, map, advice };
}

/** 取当日运势：已存在则直接返回（PRD §26 一致性，prefs 不触发重生成），否则生成并保存 */
export function getOrCreateToday(userId: string, store: FortuneStore, prefs?: UserPrefs): DailyFortune {
  const date = todayKey();
  const existing = store.get(userId, date);
  if (existing) return existing;
  const fortune = genDailyFortune(userId, date, 0, store, prefs);
  store.save(fortune);
  return fortune;
}

/** 改命（PRD §26）：仅当今日存在且 reroll=0 时允许，返回新运势；否则返回 null */
export function rerollToday(userId: string, store: FortuneStore, prefs?: UserPrefs): DailyFortune | null {
  const date = todayKey();
  const existing = store.get(userId, date);
  if (!existing || existing.reroll !== 0) return null;
  const fortune = genDailyFortune(userId, date, 1, store, prefs);
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

function genPosition(rng: Rng, date: string, history: DailyFortune[], prefs?: UserPrefs): PositionFortune {
  const recent = new Set(history.map((f) => f.position.primary));
  const fresh = ROLES.filter((r) => !recent.has(r));
  const event = specialEventOf(date);
  const weights = computePositionWeights(fresh, event, prefs);
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

function genHero(rng: Rng, role: Role, history: DailyFortune[], prefs?: UserPrefs): HeroFortune {
  const pool = HEROES_BY_ROLE[role];
  const recentHeroes = new Set(history.map((f) => f.hero.id));
  // 近 7 天推荐过 1 : 正常 3；偏好英雄 ×2（pref 6 : normal 3 : recent 1）
  const weights = computeHeroWeights(pool, recentHeroes, prefs?.agents ?? []);
  const hero = weightedPick(rng, pool, weights);
  return {
    id: hero.id,
    match: randInt(rng, 88, 96),
    keywords: shuffle(rng, hero.keywords).slice(0, 3),
    blurb: pick(rng, hero.blurbs),
  };
}

/** 「幸运XX」专用星级：只在 4–5 星浮动——既然叫幸运，就不该抽到差评（PRD §16/§18） */
function genLuckyStar(rng: Rng): Star {
  return weightedPick(rng, [4, 5] as Star[], [STAR_WEIGHTS[4], STAR_WEIGHTS[5]]);
}

function genWeapon(rng: Rng): WeaponFortune {
  const weapon = weightedPick(rng, WEAPON_POOL, WEAPON_POOL.map((w) => w.weight));
  const avoid = pick(rng, WEAPON_POOL.filter((w) => w.id !== weapon.id));
  const stars = genLuckyStar(rng);
  return {
    id: weapon.id,
    stars,
    reason: pick(rng, weapon.reasons),
    avoid: { id: avoid.id, reason: pick(rng, avoid.avoidReasons) },
  };
}

function genSkin(rng: Rng): SkinFortune {
  const category = pick(rng, COLOR_CATEGORIES);
  const color = pick(rng, category.names);
  const blurb = pick(rng, category.blurbs);
  const count = randInt(rng, 2, 3);
  const skins = shuffle(rng, category.skins).slice(0, count);
  return {
    skins,
    match: randInt(rng, 90, 98),
    color,
    buddy: pick(rng, BUDDIES),
    blurb,
  };
}

function genMap(rng: Rng): MapFortune {
  const map = pick(rng, MAP_POOL);
  const stars = genLuckyStar(rng);
  return { id: map.id, stars, label: pick(rng, MAP_LABELS[stars]) };
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
