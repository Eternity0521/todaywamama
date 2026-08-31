/**
 * 卡面 / 角色素材映射（指导书 §8 素材管线）。
 * core 层只存 cardId 字符串，UI 层负责 id → 构建产物 URL 的映射。
 * 素材由 scripts/compress-assets.mjs 生成（WebP，总量 ≤2MB）。
 */
const cardImgs = import.meta.glob('../assets/cards/*.webp', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const CARD_IMG_BY_ID: Record<string, string> = {};
for (const [path, url] of Object.entries(cardImgs)) {
  const id = `card-${path.match(/(\d{2})\.webp$/)?.[1] ?? ''}`;
  if (id !== 'card-') CARD_IMG_BY_ID[id] = url;
}

export function cardImageUrl(cardId: string): string {
  return CARD_IMG_BY_ID[cardId] ?? '';
}

import omenBust from '../assets/hero/omen-bust.webp';
import omenHead from '../assets/hero/omen-head.webp';

export { omenBust, omenHead };
