/**
 * Canvas 分享卡绘制（指导书 §7.5，PRD §21）。
 * 逻辑尺寸 750×1334（9:16），渲染倍率 ×2（1500×2668）保证清晰度。
 */
import type { DailyFortune } from '../../core/types';
import { ROLE_NAMES, heroName } from '../../core/content/heroes';
import { weaponName } from '../../core/content/weapons';
import { mapName } from '../../core/content/maps';
import { formatKeyCN } from '../format';

export const SHARE_W = 750;
export const SHARE_H = 1334;
const SCALE = 2;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 绘制分享卡并返回 canvas（调用方自行 toDataURL / toBlob） */
export function drawShareCard(fortune: DailyFortune): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = SHARE_W * SCALE;
  canvas.height = SHARE_H * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');
  ctx.scale(SCALE, SCALE);

  // 背景渐变
  const bg = ctx.createLinearGradient(0, 0, 0, SHARE_H);
  bg.addColorStop(0, '#161e3d');
  bg.addColorStop(1, '#0a0e1a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SHARE_W, SHARE_H);

  // 顶部霓虹光晕
  const glow = ctx.createRadialGradient(SHARE_W / 2, 140, 0, SHARE_W / 2, 140, 380);
  glow.addColorStop(0, 'rgba(124, 92, 255, 0.30)');
  glow.addColorStop(1, 'rgba(124, 92, 255, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, SHARE_W, 520);

  // 描边
  ctx.strokeStyle = 'rgba(124, 92, 255, 0.45)';
  ctx.lineWidth = 2;
  roundRect(ctx, 16, 16, SHARE_W - 32, SHARE_H - 32, 24);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 品牌与日期
  ctx.fillStyle = '#e8ecf8';
  ctx.font = '800 44px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('今日瓦运', SHARE_W / 2, 96);
  ctx.fillStyle = '#8b94b3';
  ctx.font = '400 24px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(formatKeyCN(fortune.date), SHARE_W / 2, 150);

  // 大星级
  const step = 76;
  const starStartX = (SHARE_W - step * 5) / 2 + step / 2;
  ctx.font = '700 64px serif';
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < fortune.main.stars ? '#ffc94d' : '#38415f';
    ctx.fillText(i < fortune.main.stars ? '★' : '☆', starStartX + step * i, 250);
  }

  // 今日关键词（主运标题）
  ctx.fillStyle = '#2dd4bf';
  ctx.font = '700 36px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(fortune.main.title, SHARE_W / 2, 330);

  // 分隔线
  ctx.strokeStyle = 'rgba(139, 148, 179, 0.25)';
  ctx.beginPath();
  ctx.moveTo(72, 396);
  ctx.lineTo(SHARE_W - 72, 396);
  ctx.stroke();

  // 核心字段列表
  const rows: [string, string][] = [
    ['幸运位置', ROLE_NAMES[fortune.position.primary]],
    ['幸运英雄', heroName(fortune.hero.id)],
    ['幸运武器', weaponName(fortune.weapon.id)],
    ['幸运皮肤', fortune.skin.id],
    ['幸运地图', mapName(fortune.maps[0].id)],
    ['今日雷区', mapName(fortune.maps[fortune.maps.length - 1].id)],
  ];
  let y = 462;
  for (const [label, value] of rows) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#8b94b3';
    ctx.font = '400 28px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(label, 96, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#e8ecf8';
    ctx.font = '600 28px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(value, SHARE_W - 96, y);
    y += 92;
  }

  // 今日建议
  ctx.textAlign = 'center';
  ctx.fillStyle = '#8b94b3';
  ctx.font = '400 24px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('今日建议', SHARE_W / 2, y + 40);
  ctx.fillStyle = '#ffc94d';
  ctx.font = '700 40px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(fortune.advice.keyword, SHARE_W / 2, y + 96);

  // 页脚
  ctx.fillStyle = '#8b94b3';
  ctx.font = '400 20px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('仅供娱乐 · 非官方产品', SHARE_W / 2, SHARE_H - 56);

  return canvas;
}
