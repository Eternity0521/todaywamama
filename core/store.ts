import type { DailyFortune } from './types';

/**
 * 存储抽象（平台无关）。
 * H5 用 localStorage 实现（src/storage.ts）；
 * 迁移微信小程序时换 wx.setStorageSync 实现，core 层零改动。
 */
export interface FortuneStore {
  /** 取用户 ID；不存在则生成并持久化 */
  getUserId(): string;
  /** 取某用户某日的运势；无则返回 null */
  get(userId: string, date: string): DailyFortune | null;
  /** 保存运势（同一天覆盖写入，即「改命」覆盖） */
  save(fortune: DailyFortune): void;
  /** 历史运势，按日期降序；供昨日运势展示与去重算法使用 */
  history(userId: string, days?: number): DailyFortune[];
}
