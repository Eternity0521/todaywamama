/**
 * 「先认识一下」页的用户资料（昵称/常打位置/常用英雄）。
 * 与 core 层的运势记录（storage.ts）无关，只是 UI 侧的展示性偏好，单独存放。
 */
const KEY = 'gg.profile.v1';

export interface Profile {
  onboarded: boolean;
  nick: string;
  role: string | null;
  agents: string[];
}

const DEFAULT_PROFILE: Profile = { onboarded: false, nick: '', role: null, agents: [] };

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Profile>;
      return { ...DEFAULT_PROFILE, ...parsed };
    }
  } catch {
    // 数据损坏则重置
  }
  return { ...DEFAULT_PROFILE };
}

export function saveProfile(profile: Profile): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    // 存储满/隐私模式等异常静默降级
  }
}
