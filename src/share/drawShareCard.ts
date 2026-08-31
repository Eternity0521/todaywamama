/**
 * Canvas 分享卡绘制（指导书 §7.5，PRD §21）——设计稿 2×2 网格版式。
 * 逻辑尺寸 750×1334（9:16），渲染倍率 ×2（1500×2668）保证清晰度。
 * 颜色与 tokens.css 同步（Canvas 无法读取 CSS 变量，常量副本）。
 */
import type { DailyFortune } from '../../core/types';
import { ROLE_NAMES, heroName } from '../../core/content/heroes';
import { weaponName } from '../../core/content/weapons';
import { mapName } from '../../core/content/maps';

export const SHARE_W = 750;
export const SHARE_H = 1334;
const SCALE = 2;

/* 色板常量（与 tokens.css 一致） */
const C_ACC = '#c084d8';
const C_ACC_04 = 'rgba(192, 132, 216, 0.04)';
const C_ACC_30 = 'rgba(192, 132, 216, 0.3)';
const C_ACC_55 = 'rgba(192, 132, 216, 0.55)';
const C_INK = '#ece7f2';
const C_INK_30 = 'rgba(236, 231, 242, 0.3)';
const C_INK_45 = 'rgba(236, 231, 242, 0.45)';
const C_INK_14 = 'rgba(236, 231, 242, 0.14)';
const C_TITLE = '#f7f3fa';
const C_BTN_INK = '#170e1c';
const C_ON_LIGHT_DIM = 'rgba(12, 9, 16, 0.55)';

const FONT_SANS = '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';
const FONT_MONO = '"JetBrains Mono", "Cascadia Code", Consolas, monospace';

/** 设计稿五角星路径（24×24 viewBox）按 size 缩放，中心 (cx, cy) */
function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  fill: string | null,
  stroke: string | null,
): void {
  const pts: [number, number][] = [
    [12, 1.8], [15.1, 8.3], [22.2, 9.2], [17, 14.1], [18.3, 21.2],
    [12, 17.8], [5.7, 21.2], [7, 14.1], [1.8, 9.2], [8.9, 8.3],
  ];
  const s = size / 24;
  ctx.beginPath();
  pts.forEach(([x, y], i) => {
    const px = cx + (x - 12) * s;
    const py = cy + (y - 12) * s;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = size / 20;
    ctx.stroke();
  }
}

/** 旋转 45° 的菱形方块（品牌符号） */
function drawDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, stroke: string): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.PI / 4);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = size / 9;
  ctx.strokeRect(-size / 2, -size / 2, size, size);
  ctx.restore();
}

export interface ShareCardOptions {
  /** 玩家昵称（P1 预留）；缺省时头部只画「今日瓦运」 */
  nickname?: string;
}

/** 绘制分享卡并返回 canvas（调用方自行 toDataURL / toBlob） */
export function drawShareCard(fortune: DailyFortune, opts: ShareCardOptions = {}): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = SHARE_W * SCALE;
  canvas.height = SHARE_H * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');
  ctx.scale(SCALE, SCALE);

  // 背景渐变（设计稿 170deg #1a1224 → #100c17）
  const bg = ctx.createLinearGradient(0, 0, SHARE_W, SHARE_H);
  bg.addColorStop(0, '#1a1224');
  bg.addColorStop(1, '#100c17');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SHARE_W, SHARE_H);

  // 22px 网格纹理（设计稿 4% 紫线）
  ctx.strokeStyle = C_ACC_04;
  ctx.lineWidth = 1;
  for (let x = 18; x <= SHARE_W - 18; x += 22) {
    ctx.beginPath();
    ctx.moveTo(x, 18);
    ctx.lineTo(x, SHARE_H - 18);
    ctx.stroke();
  }
  for (let y = 18; y <= SHARE_H - 18; y += 22) {
    ctx.beginPath();
    ctx.moveTo(18, y);
    ctx.lineTo(SHARE_W - 18, y);
    ctx.stroke();
  }

  // 直角描边
  ctx.strokeStyle = C_ACC_55;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(18, 18, SHARE_W - 36, SHARE_H - 36);

  // ===== 头部：品牌菱形 + 标题 + 日期 =====
  drawDiamond(ctx, 44, 100, 28, C_ACC_55);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = C_INK;
  ctx.font = `900 30px ${FONT_SANS}`;
  ctx.fillText(opts.nickname ? `${opts.nickname} 的今日瓦运` : '今日瓦运', 68, 100);

  const [, m2, d2] = fortune.date.split('-');
  ctx.textAlign = 'right';
  ctx.fillStyle = C_INK_30;
  ctx.font = `500 22px ${FONT_MONO}`;
  ctx.fillText(`${Number(m2)}月${Number(d2)}日`, 682, 100);

  // ===== 星级行（紫色实心 / acc-30 描边空心）=====
  for (let i = 0; i < 5; i++) {
    const cx = 68 + 23 + i * 46;
    const on = i < fortune.main.stars;
    drawStar(ctx, cx, 170, 40, on ? C_ACC : null, on ? null : C_ACC_30);
  }

  // ===== 大字标题 =====
  ctx.textAlign = 'left';
  ctx.fillStyle = C_TITLE;
  ctx.font = `900 92px ${FONT_SANS}`;
  ctx.fillText(fortune.main.title, 68, 300);

  // ===== 2×2 网格（设计稿：角色 / 武器 / 地图 / 忌）=====
  const gridX = 68;
  const gridW = SHARE_W - gridX * 2; // 614
  const colW = (gridW - 1) / 2;
  const rowTop1 = 360;
  const rowTop2 = rowTop1 + 196 + 1;
  const rowH = 196;

  // gutter 底色（1px 缝隙露出 ink-14）
  ctx.fillStyle = C_INK_14;
  ctx.fillRect(gridX, rowTop1, gridW, rowH * 2 + 1);

  const cells: {
    x: number; y: number; w: number; h: number;
    label: string; value: string;
    accent?: boolean;
  }[] = [
    {
      x: gridX + 1, y: rowTop1 + 1, w: colW, h: rowH,
      label: '今日角色',
      value: `${ROLE_NAMES[fortune.position.primary]} · ${heroName(fortune.hero.id)}`,
    },
    {
      x: gridX + colW + 1, y: rowTop1 + 1, w: colW, h: rowH,
      label: '幸运武器',
      value: weaponName(fortune.weapon.id),
    },
    {
      x: gridX + 1, y: rowTop2, w: colW, h: rowH,
      label: '幸运地图',
      value: mapName(fortune.maps[0].id),
    },
    {
      x: gridX + colW + 1, y: rowTop2, w: colW, h: rowH,
      label: '今日忌',
      value: fortune.main.bad,
      accent: true,
    },
  ];

  for (const cell of cells) {
    ctx.fillStyle = cell.accent ? C_ACC : '#130f1a';
    ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
    ctx.textAlign = 'left';
    ctx.fillStyle = cell.accent ? C_ON_LIGHT_DIM : C_INK_30;
    ctx.font = `500 20px ${FONT_MONO}`;
    ctx.fillText(cell.label, cell.x + 26, cell.y + 44);
    ctx.fillStyle = cell.accent ? C_BTN_INK : C_INK;
    ctx.font = `900 32px ${FONT_SANS}`;
    ctx.fillText(cell.value, cell.x + 26, cell.y + 96);
  }

  // ===== 底部：品牌 + 二维码占位 =====
  drawDiamond(ctx, 86, 832, 28, C_ACC);
  ctx.textAlign = 'left';
  ctx.fillStyle = C_INK_45;
  ctx.font = `700 22px ${FONT_SANS}`;
  ctx.fillText('今日瓦运', 108, 832);

  // 二维码占位：60×60 十字纹理
  const qrX = 622;
  const qrY = 802;
  ctx.fillStyle = C_INK_14;
  ctx.fillRect(qrX, qrY, 60, 60);
  ctx.strokeStyle = C_INK_45;
  ctx.lineWidth = 2;
  for (let i = 1; i < 15; i++) {
    const p = 4 * i;
    ctx.beginPath();
    ctx.moveTo(qrX + p, qrY);
    ctx.lineTo(qrX + p, qrY + 60);
    ctx.moveTo(qrX, qrY + p);
    ctx.lineTo(qrX + 60, qrY + p);
    ctx.stroke();
  }

  // ===== 免责页脚（铁律）=====
  ctx.textAlign = 'center';
  ctx.fillStyle = C_INK_45;
  ctx.font = `400 20px ${FONT_SANS}`;
  ctx.fillText('仅供娱乐 · 非官方产品', SHARE_W / 2, SHARE_H - 56);

  return canvas;
}
