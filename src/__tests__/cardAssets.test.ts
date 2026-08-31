import { describe, expect, it } from 'vitest';
import { cardImageUrl } from '../ui/cardAssets';

describe('素材映射（指导书 §8 素材管线）', () => {
  it('10 张卡面 id 均有对应产物', () => {
    for (let i = 1; i <= 10; i++) {
      const id = `card-${String(i).padStart(2, '0')}`;
      expect(cardImageUrl(id), `缺素材: ${id}`).toMatch(/\.webp$/);
    }
  });

  it('未知 id 返回空串', () => {
    expect(cardImageUrl('card-99')).toBe('');
  });
});
