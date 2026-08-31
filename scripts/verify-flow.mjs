/**
 * 5 屏流程验证脚本（开发工具，零依赖）：
 * 用 Edge 无头模式 + Chrome DevTools Protocol（Node 原生 WebSocket）走一遍
 * home → pick → flip → result → share 流程，逐步断言关键文案并截图。
 *
 * 运行：node scripts/verify-flow.mjs
 * 前提：dev server 已在 http://localhost:5173 运行；截图输出到 shots/。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const URL = 'http://localhost:5173';
const SHOTS = path.join(ROOT, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9222;
// profile 放系统临时目录：放项目内会让 Vite 文件监听器 watch 浏览器临时文件而崩溃
const PROFILE = path.join(os.tmpdir(), 'gg-oracle-edge-profile');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 启动 Edge 无头 + 远程调试（独立 profile 避免与日常浏览器冲突）
const edge = spawn(
  EDGE,
  [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE}`,
    '--window-size=390,844',
    'about:blank',
  ],
  { stdio: 'ignore' },
);

let ws;
let msgId = 0;
const pending = new Map();

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function cdpEval(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error('eval 异常: ' + JSON.stringify(r.exceptionDetails.exception?.description ?? r.exceptionDetails));
  return r.result?.value;
}

async function click(selector) {
  const ok = await cdpEval(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; el.click(); return true; })()`);
  if (!ok) throw new Error(`元素不存在: ${selector}`);
}

async function assertText(needles, label) {
  const text = await cdpEval(`document.body.innerText`);
  for (const n of needles) {
    if (!text.includes(n)) throw new Error(`[${label}] 缺少文案: ${n}`);
  }
  console.log(`✓ ${label}`);
}

async function shot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(SHOTS, `${name}.png`), Buffer.from(r.data, 'base64'));
  console.log(`  📸 shots/${name}.png`);
}

async function main() {
  // 等待调试端口就绪
  let targets = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      targets = await res.json();
      break;
    } catch {
      await sleep(300);
    }
  }
  const page = targets?.find((t) => t.type === 'page');
  if (!page) throw new Error('无法连接 Edge 调试端口');

  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    }
  };

  await send('Page.enable');
  await send('Page.navigate', { url: URL });
  // 等待 React 首屏
  for (let i = 0; i < 20; i++) {
    const has = await cdpEval(`!!document.querySelector('.home-cta')`);
    if (has) break;
    await sleep(300);
  }

  // 幂等：清掉上次运行留下的运势，重载出首次态
  await cdpEval(`localStorage.removeItem('gg.state.v1')`);
  await send('Page.navigate', { url: URL });
  for (let i = 0; i < 20; i++) {
    const has = await cdpEval(`!!document.querySelector('.home-cta')`);
    if (has) break;
    await sleep(300);
  }

  console.log('— 1. 首页 —');
  await assertText(['今天这把', '今日瓦运', '测测今日瓦运', '仅供娱乐'], '首页');
  await shot('01-home');

  console.log('— 2. 抽卡 —');
  await click('.home-cta');
  await sleep(400);
  await assertText(['凭感觉', '第二步 · 抽牌'], '抽卡页');
  await shot('02-pick');

  console.log('— 3. 选卡翻转 —');
  await click('.pick-card-0');
  await sleep(700); // 450ms 后翻面
  await assertText(['你抽到了', '卡面解读'], '翻面后');
  await shot('03-pick-flipped');

  console.log('— 4. 揭晓 —');
  await click('.pick-cta');
  await sleep(600);
  await assertText(['已翻开', '今日宜', '今日忌', '查看详细运势'], '揭晓页');
  await shot('04-reveal');

  console.log('— 5. 完整运势 —');
  await click('.reveal-cta');
  await sleep(400);
  await assertText(['今日运势', '今日角色', '幸运武器', '幸运地图', '今日忌', '命运并非不可改变'], '结果页');
  await shot('05-result');
  const firstPass = await cdpEval(`(() => {
    const s = JSON.parse(localStorage.getItem('gg.state.v1'));
    const f = s.fortunes.find((x) => x.reroll === 0);
    return { cardId: f.main.cardId, title: f.main.title };
  })()`);

  console.log('— 6. 分享卡 —');
  await click('.result-cta');
  await sleep(800); // canvas 生成
  await assertText(['分享卡', '保存图片', '分享给队友'], '分享页');
  await shot('06-share');

  console.log('— 7. 刷新后二次仪式（确定性：结果与首次一致） —');
  await send('Page.navigate', { url: URL });
  for (let i = 0; i < 20; i++) {
    const has = await cdpEval(`!!document.querySelector('.home-cta')`);
    if (has) break;
    await sleep(300);
  }
  await assertText(['测测今日瓦运'], '刷新后首页（仍走仪式入口）');
  await click('.home-cta');
  await sleep(400);
  await assertText(['凭感觉'], '二次仪式进入抽卡页');
  await click('.pick-card-2');
  await sleep(700);
  await click('.pick-cta');
  await sleep(600);
  await click('.reveal-cta');
  await sleep(400);
  await assertText(['今日运势', '今日角色'], '二次仪式到达结果页');
  const secondPass = await cdpEval(`(() => {
    const s = JSON.parse(localStorage.getItem('gg.state.v1'));
    const f = s.fortunes.find((x) => x.reroll === 0);
    return { cardId: f.main.cardId, title: f.main.title };
  })()`);
  if (firstPass.cardId !== secondPass.cardId || firstPass.title !== secondPass.title) {
    throw new Error('确定性被破坏：两次仪式结果不一致');
  }
  console.log(`  ✓ 两次仪式结果一致（${secondPass.cardId} / ${secondPass.title}）`);

  console.log('— 8. 旧数据迁移（无 cardId 的存量运势） —');
  await cdpEval(`(() => {
    const key = 'gg.state.v1';
    const s = JSON.parse(localStorage.getItem(key));
    const f = s.fortunes.find((x) => x.reroll === 0);
    delete f.main.cardId; delete f.main.cardName; delete f.main.good; delete f.main.bad;
    localStorage.setItem(key, JSON.stringify(s));
  })()`);
  await send('Page.navigate', { url: URL });
  for (let i = 0; i < 20; i++) {
    const has = await cdpEval(`!!document.querySelector('.home-cta')`);
    if (has) break;
    await sleep(300);
  }
  await assertText(['测测今日瓦运'], '旧数据刷新后不崩');
  // 走完整仪式验证 backfill 生效（内存补齐，UI 不崩）
  await click('.home-cta');
  await sleep(400);
  await click('.pick-card-1');
  await sleep(700);
  await click('.pick-cta');
  await sleep(600);
  await click('.reveal-cta');
  await sleep(400);
  await assertText(['今日运势', '今日角色'], '旧数据走完仪式（backfill 生效）');
  console.log('  ✓ 旧结构已被兼容（cardId 内存补齐）');

  console.log('\n✅ 全流程验证通过');
}

main()
  .catch((e) => {
    console.error('❌ 验证失败:', e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      if (ws && ws.readyState === 1) ws.close();
    } catch {}
    edge.kill();
    await sleep(500);
  });
