import type { Star } from '../types';

/** 地图池（指导书 §6.4，PRD §18） */
export interface MapEntry {
  id: string;
  name: string;
}

export const MAP_POOL: MapEntry[] = [
  { id: 'Ascent', name: 'Ascent（亚海悬城）' },
  { id: 'Haven', name: 'Haven（避风港湾）' },
  { id: 'Bind', name: 'Bind（极地寒港）' },
  { id: 'Lotus', name: 'Lotus（莲花古城）' },
  { id: 'Breeze', name: 'Breeze（微风岛屿）' },
];

/** 各星级评语池 */
export const MAP_LABELS: Record<Star, string[]> = {
  5: ['上分圣地', '福地洞天'],
  4: ['可以一战', '状态在线'],
  3: ['五五开', '旗鼓相当'],
  2: ['容易坐牢', '慎重排位'],
  1: ['今天最好别碰', '此地不宜久留'],
};

/** 地图 id → 展示名（未知 id 原样返回） */
export function mapName(id: string): string {
  return MAP_POOL.find((m) => m.id === id)?.name ?? id;
}
