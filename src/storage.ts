/**
 * localStorage 版 FortuneStore 实现（指导书 §4.4）。
 * 单一 JSON key，全量读写；最多保留 90 天历史。
 * 迁移微信小程序时：换 wx.setStorageSync 实现同接口即可，core 层零改动。
 */
import type { DailyFortune } from '../core/types';
import type { FortuneStore } from '../core/store';

const KEY = 'gg.state.v1';
const MAX_DAYS = 90;

interface PersistedState {
  userId: string;
  fortunes: DailyFortune[];
}

/** 生成用户 ID（仅用于标识，不参与运势随机；随机数来源无确定性要求） */
function newUserId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `u-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

function load(): PersistedState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      if (parsed && typeof parsed.userId === 'string' && Array.isArray(parsed.fortunes)) {
        return parsed;
      }
    }
  } catch {
    // 数据损坏则重置
  }
  return { userId: '', fortunes: [] };
}

function persist(state: PersistedState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // 存储满/隐私模式等异常静默降级（本次会话数据不持久）
  }
}

export const localStorageStore: FortuneStore = {
  getUserId(): string {
    const state = load();
    if (state.userId) return state.userId;
    const id = newUserId();
    persist({ ...state, userId: id });
    return id;
  },

  get(userId: string, date: string): DailyFortune | null {
    return load().fortunes.find((f) => f.userId === userId && f.date === date) ?? null;
  },

  save(fortune: DailyFortune): void {
    const state = load();
    const idx = state.fortunes.findIndex(
      (f) => f.userId === fortune.userId && f.date === fortune.date,
    );
    if (idx >= 0) state.fortunes[idx] = fortune;
    else state.fortunes.push(fortune);
    // 按日期降序，超出 90 天上限丢弃最旧
    state.fortunes.sort((a, b) => (a.date < b.date ? 1 : -1));
    state.fortunes = state.fortunes.slice(0, MAX_DAYS);
    persist(state);
  },

  history(userId: string, days?: number): DailyFortune[] {
    const list = load()
      .fortunes.filter((f) => f.userId === userId)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    return days === undefined ? list : list.slice(0, days);
  },
};
