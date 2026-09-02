/**
 * 「先认识一下」页的用户资料（昵称/常打位置/常用英雄）。
 * 与 core 层的运势记录（storage.ts）无关，只是 UI 侧的展示性偏好，单独存放。
 */
import { AGENT_ROLES, type AgentRole } from '../core/content/agents';

const KEY = 'gg.profile.v1';

export interface Profile {
  onboarded: boolean;
  nick: string;
  role: AgentRole | null;
  agents: string[];
}

const DEFAULT_PROFILE: Profile = { onboarded: false, nick: '', role: null, agents: [] };

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Profile>;
      // 运行时校验：损坏/非法数据兜底（非法 role → null；agents 只留字符串）
      const roleOk =
        typeof parsed.role === 'string' && AGENT_ROLES.some((r) => r.id === parsed.role);
      const agentsOk = Array.isArray(parsed.agents)
        ? parsed.agents.filter((a): a is string => typeof a === 'string')
        : [];
      return {
        ...DEFAULT_PROFILE,
        ...parsed,
        role: roleOk ? (parsed.role as AgentRole) : null,
        agents: agentsOk,
      };
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
