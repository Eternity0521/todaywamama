/**
 * 一次性素材压缩脚本（指导书 §8 素材管线）：
 * 把设计稿 PNG（design/unpacked/）压缩为 WebP 放进 src/assets/。
 *
 * 运行（sharp 临时安装，不留依赖）：
 *   npx --yes -p sharp node scripts/compress-assets.mjs
 *
 * 素材更新后重跑即可。总量预算 ≤2MB，超标脚本会报错。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DESIGN = path.join(ROOT, 'design', 'unpacked');
const OUT_CARDS = path.join(ROOT, 'src', 'assets', 'cards');
const OUT_HERO = path.join(ROOT, 'src', 'assets', 'hero');
const BUDGET = 2 * 1024 * 1024; // 2MB

fs.mkdirSync(OUT_CARDS, { recursive: true });
fs.mkdirSync(OUT_HERO, { recursive: true });

const jobs = [];

// 卡面：941×1672 → 424×752 WebP q78（设计稿翻转态 188px 宽 @2x 需求）
for (let i = 1; i <= 10; i++) {
  const src = path.join(DESIGN, 'cards', `${String(i).padStart(2, '0')}.png`);
  const dst = path.join(OUT_CARDS, `${String(i).padStart(2, '0')}.webp`);
  jobs.push({ src, dst, w: 424, h: 752, q: 78, fit: 'contain' });
}

// 幽影立绘：860×1180 → 320×440（结果页 78×104 @2x 需求）
jobs.push({ src: path.join(DESIGN, 'omen-bust.png'), dst: path.join(OUT_HERO, 'omen-bust.webp'), w: 320, h: 440, q: 80, fit: 'contain' });
// 幽影头像：640×640 → 96×96
jobs.push({ src: path.join(DESIGN, 'omen-head.png'), dst: path.join(OUT_HERO, 'omen-head.webp'), w: 96, h: 96, q: 80, fit: 'cover' });

let total = 0;
for (const { src, dst, w, h, q, fit } of jobs) {
  if (!fs.existsSync(src)) throw new Error(`素材缺失: ${src}`);
  await sharp(src).resize(w, h, { fit }).webp({ quality: q }).toFile(dst);
  const size = fs.statSync(dst).size;
  total += size;
  console.log(`${path.relative(ROOT, dst)}  ${(size / 1024).toFixed(0)}KB`);
}

console.log(`合计 ${(total / 1024 / 1024).toFixed(2)}MB / 预算 ${BUDGET / 1024 / 1024}MB`);
if (total > BUDGET) throw new Error('素材总量超标，请降低分辨率或质量');
console.log('✓ 素材管线完成');
