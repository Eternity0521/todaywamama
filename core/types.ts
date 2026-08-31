/**
 * 数据模型（指导书 §4.4）。
 * 本文件是 core 层唯一的数据契约，UI 与算法都只依赖这里的类型。
 */

/** 位置：决斗 / 先锋 / 控场 / 哨卫 */
export type Role = 'duelist' | 'initiator' | 'controller' | 'sentinel';

export type Star = 1 | 2 | 3 | 4 | 5;

/** 今日总运 / 主运卡（PRD §12/13；UI 融合后：卡面为主运核心内容，星级独立） */
export interface MainLuck {
  stars: Star;
  cardId: string;   // 抽中的卡面 id（'card-01'…'card-10'，对应 src/assets/cards/*.webp）
  cardName: string; // 卡名，如「相信直觉」
  title: string;    // 卡面大字标题，如「别犹豫」
  desc: string;     // 卡面解读段
  good: string;     // 宜，如「宜先动」
  bad: string;      // 忌，如「忌回头」
}

/** 幸运位置（PRD §14） */
export interface PositionFortune {
  primary: Role;
  scores: Record<Role, Star>; // 决斗指数/先锋指数/控场指数/哨卫指数
  reason: string;             // 例：「今日更适合控制节奏，而不是创造混乱。」
  heroes: string[];           // 该位置推荐 3 个英雄名（展示用，如 Omen/Clove/Viper）
}

/** 幸运英雄（PRD §15） */
export interface HeroFortune {
  id: string;
  match: number;      // 契合度 88–96
  keywords: string[]; // 3 个，如 冷静/信息差/偷 timing
  blurb: string;      // 一句趣味解释
}

/** 幸运武器（PRD §16） */
export interface WeaponFortune {
  id: string;
  reason: string;
  avoid: { id: string; reason: string }; // 今日不推荐
}

/** 幸运皮肤（PRD §17） */
export interface SkinFortune {
  id: string;
  match: number; // 契合度 90–98
  color: string; // 幸运颜色，如「绿色」
  buddy: string; // 幸运饰品，如「RGX Butterfly」
  blurb: string; // 例：「今天科技感会给你一点额外的自信。」
}

/** 地图运势（PRD §18） */
export interface MapFortune {
  id: string;
  stars: Star;
  label: string; // 5★上分圣地 / 4★可以一战 / 3★五五开 / 2★容易坐牢 / 1★今天最好别碰
}

/** 今日战术建议（PRD §20） */
export interface Advice {
  keyword: string; // 例：「DON'T REPEEK」
  note: string;    // 例：「今天最大的敌人不是对面，而是你觉得自己还能再打一个。」
}

/** 一份完整的当日运势 */
export interface DailyFortune {
  date: string;   // 'YYYY-MM-DD'（本地时区）
  userId: string;
  reroll: 0 | 1;  // 0 = 今日首次，1 = 改命后
  main: MainLuck;
  position: PositionFortune;
  hero: HeroFortune;
  weapon: WeaponFortune;
  skin: SkinFortune;
  maps: MapFortune[]; // 按星级降序；[0] = 幸运地图，[last] = 今日雷区
  advice: Advice;
}
