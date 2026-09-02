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
const OUT_AGENTS = path.join(ROOT, 'src', 'assets', 'agents');
const OUT_AGENTS_BUST = path.join(ROOT, 'src', 'assets', 'agents-bust');
const BUDGET = 3 * 1024 * 1024; // 3MB（含立绘后上调）

fs.mkdirSync(OUT_CARDS, { recursive: true });
fs.mkdirSync(OUT_AGENTS, { recursive: true });
fs.mkdirSync(OUT_AGENTS_BUST, { recursive: true });

const jobs = [];

// 卡面：941×1672 → 424×752 WebP q78（设计稿翻转态 188px 宽 @2x 需求）
for (let i = 1; i <= 10; i++) {
  const src = path.join(DESIGN, 'cards', `${String(i).padStart(2, '0')}.png`);
  const dst = path.join(OUT_CARDS, `${String(i).padStart(2, '0')}.webp`);
  jobs.push({ src, dst, w: 424, h: 752, q: 78, fit: 'contain' });
}

// 英雄头像（初次见面页 · 52px 卡片 @4x）：design/unpacked/agents/<id>.png → 208×208
const agentsDir = path.join(DESIGN, 'agents');
if (fs.existsSync(agentsDir)) {
  for (const file of fs.readdirSync(agentsDir)) {
    if (!file.endsWith('.png')) continue;
    jobs.push({
      src: path.join(agentsDir, file),
      dst: path.join(OUT_AGENTS, file.replace(/\.png$/, '.webp')),
      w: 208,
      h: 208,
      q: 80,
      fit: 'cover',
    });
  }
}

// 英雄立绘（今日运势页角色卡 · 78×104 @2x 需求）：design/unpacked/agents-bust/<id>.png → 240×320
const agentsBustDir = path.join(DESIGN, 'agents-bust');
if (fs.existsSync(agentsBustDir)) {
  for (const file of fs.readdirSync(agentsBustDir)) {
    if (!file.endsWith('.png')) continue;
    jobs.push({
      src: path.join(agentsBustDir, file),
      dst: path.join(OUT_AGENTS_BUST, file.replace(/\.png$/, '.webp')),
      w: 240,
      h: 320,
      q: 82,
      fit: 'cover',
    });
  }
}

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
