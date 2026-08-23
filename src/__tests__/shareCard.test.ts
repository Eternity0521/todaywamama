import { describe, expect, it } from 'vitest';
import { createCanvas } from '@napi-rs/canvas';
import { drawShareCard, SHARE_W, SHARE_H } from '../share/drawShareCard';
import { genDailyFortune } from '../../core/generator';
import type { DailyFortune } from '../../core/types';
import type { FortuneStore } from '../../core/store';

// node 环境无 document：注入最小 stub（drawShareCard 只用到 createElement('canvas')）
(globalThis as Record<string, unknown>).document = {
  createElement: (tag: string) => (tag === 'canvas' ? createCanvas(1, 1) : null),
};

function memStore(): FortuneStore {
  return {
    getUserId: () => 'share-test-user',
    get: () => null,
    save: () => {},
    history: () => [],
  };
}

describe('分享卡绘制（指导书 §7.5）', () => {
  it('真实渲染不抛错，输出 1500×2668 的合法 PNG', () => {
    const fortune: DailyFortune = genDailyFortune('share-test-user', '2026-08-23', 0, memStore());
    const canvas = drawShareCard(fortune);
    expect(canvas.width).toBe(SHARE_W * 2); // 1500
    expect(canvas.height).toBe(SHARE_H * 2); // 2668

    const dataUrl = canvas.toDataURL('image/png');
    expect(dataUrl.startsWith('data:image/png')).toBe(true);
    // PNG 文件头校验（89 50 4E 47）
    const binary = atob(dataUrl.slice('data:image/png;base64,'.length));
    expect(binary.charCodeAt(0)).toBe(0x89);
    expect(binary.charCodeAt(1)).toBe(0x50);
    expect(binary.charCodeAt(2)).toBe(0x4e);
    expect(binary.charCodeAt(3)).toBe(0x47);
  });

  it('不同运势渲染的 PNG 内容不同', () => {
    const store = memStore();
    const a = drawShareCard(genDailyFortune('u-a', '2026-08-23', 0, store)).toDataURL('image/png');
    const b = drawShareCard(genDailyFortune('u-b', '2026-08-24', 0, store)).toDataURL('image/png');
    expect(a).not.toBe(b);
  });
});
