/**
 * 英雄名录（初次见面页 · 你常用的英雄）。
 * id 与 src/assets/agents/*.webp 一一对应；name 为国服官方译名。
 */
export type AgentRole = 'duel' | 'init' | 'ctrl' | 'sent';

export interface AgentEntry {
  id: string;
  name: string;
  role: AgentRole;
}

export const AGENT_ROLES: { id: AgentRole; name: string }[] = [
  { id: 'duel', name: '决斗' },
  { id: 'init', name: '先锋' },
  { id: 'ctrl', name: '控场' },
  { id: 'sent', name: '哨卫' },
];

export const AGENT_POOL: AgentEntry[] = [
  { id: 'jett', name: '捷风', role: 'duel' },
  { id: 'raze', name: '雷兹', role: 'duel' },
  { id: 'phoenix', name: '不死鸟', role: 'duel' },
  { id: 'reyna', name: '芮娜', role: 'duel' },
  { id: 'yoru', name: '夜露', role: 'duel' },
  { id: 'neon', name: '霓虹', role: 'duel' },
  { id: 'iso', name: '壹决', role: 'duel' },
  { id: 'waylay', name: '幻棱', role: 'duel' },
  { id: 'sova', name: '猎枭', role: 'init' },
  { id: 'breach', name: '铁臂', role: 'init' },
  { id: 'skye', name: '斯凯', role: 'init' },
  { id: 'fade', name: '黑梦', role: 'init' },
  { id: 'kayo', name: 'K/O', role: 'init' },
  { id: 'gekko', name: '盖可', role: 'init' },
  { id: 'tejo', name: '钛狐', role: 'init' },
  { id: 'omen', name: '幽影', role: 'ctrl' },
  { id: 'viper', name: '蝰蛇', role: 'ctrl' },
  { id: 'brimstone', name: '炼狱', role: 'ctrl' },
  { id: 'astra', name: '星礈', role: 'ctrl' },
  { id: 'harbor', name: '海神', role: 'ctrl' },
  { id: 'clove', name: '暮蝶', role: 'ctrl' },
  { id: 'miks', name: '迷核', role: 'ctrl' },
  { id: 'sage', name: '贤者', role: 'sent' },
  { id: 'cypher', name: '零', role: 'sent' },
  { id: 'killjoy', name: '奇乐', role: 'sent' },
  { id: 'chamber', name: '尚勃勒', role: 'sent' },
  { id: 'deadlock', name: '钢锁', role: 'sent' },
  { id: 'vyse', name: '维斯', role: 'sent' },
  { id: 'veto', name: '禁灭', role: 'sent' },
];

/**
 * core/content/heroes.ts 的 HeroEntry.id 是英文原名（如 'KAY/O'、'Omen'），
 * 这里归一化后去查 AGENT_POOL，取得头像与国服译名。
 */
export function agentByRawId(rawId: string): AgentEntry | undefined {
  const norm = rawId.toLowerCase().replace(/[^a-z0-9]/g, '');
  return AGENT_POOL.find((a) => a.id === norm);
}
