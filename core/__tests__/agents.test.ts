import { describe, expect, it } from 'vitest';
import {
  AGENT_POOL,
  AGENT_ROLES,
  AGENT_ROLE_TO_CORE,
  agentByRawId,
  normalizeAgentId,
} from '../content/agents';
import { HEROES } from '../content/heroes';

describe('特工名录工具（core/content/agents.ts）', () => {
  it('normalizeAgentId：小写 + 去非字母数字', () => {
    expect(normalizeAgentId('KAY/O')).toBe('kayo');
    expect(normalizeAgentId('Omen')).toBe('omen');
    expect(normalizeAgentId('Jett!')).toBe('jett');
  });

  it('agentByRawId：显示风格 id 归一化命中', () => {
    expect(agentByRawId('KAY/O')?.id).toBe('kayo');
    expect(agentByRawId('Omen')?.name).toBe('幽影');
    expect(agentByRawId('nobody')).toBeUndefined();
  });

  it('AGENT_ROLE_TO_CORE：四个位置映射正确', () => {
    expect(AGENT_ROLE_TO_CORE).toEqual({
      duel: 'duelist',
      init: 'initiator',
      ctrl: 'controller',
      sent: 'sentinel',
    });
    for (const r of AGENT_ROLES) {
      expect(AGENT_ROLE_TO_CORE[r.id]).toBeDefined();
    }
  });

  it('归一化 id 无碰撞（防匹配歧义）', () => {
    const ids = AGENT_POOL.map((a) => normalizeAgentId(a.id));
    expect(new Set(ids).size).toBe(AGENT_POOL.length);
  });

  it('跨库一致性：英雄库每个 id 都能命中特工名录', () => {
    for (const h of HEROES) {
      expect(agentByRawId(h.id)).toBeDefined();
    }
  });

  it('跨库缺口绊线：仅 miks / veto 在特工名录中但英雄库未收录', () => {
    // 这两个特工 onboarding 可选但英雄池无内容，偏好权重静默忽略；
    // 将来补 heroes.ts 内容时此断言会明确报出该更新什么。
    const agentIds = new Set(AGENT_POOL.map((a) => a.id));
    const heroIds = new Set(HEROES.map((h) => normalizeAgentId(h.id)));
    const missing = [...agentIds].filter((id) => !heroIds.has(id)).sort();
    expect(missing).toEqual(['miks', 'veto']);
  });
});
