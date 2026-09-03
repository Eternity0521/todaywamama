/**
 * 埋点抽象（指导书 §9）。
 * 已接入百度统计：部署上线后注册站点（tongji.baidu.com）并把统计 ID 填进
 * BAIDU_TONGJI_ID 即可，无需改其它代码；ID 为空时仅本地 console（开发态）。
 * 事件不携带任何个人内容（昵称/运势详情均不上报，仅事件名与可选参数）。
 * 北极星计算：完成率 = fortune_complete / test_start；分享率 = (share_save + share_copy) / fortune_complete。
 */

/**
 * 百度统计站点 ID（hm.js URL 中 ? 后的字符串，形如 'a1b2c3d4e5f6...'）。
 * 注册步骤：tongji.baidu.com → 管理 → 新增网站（填部署域名，如 ggoracle.vercel.app）
 * → 代码获取页复制 ID → 粘贴到此处 → 重新构建部署。
 */
const BAIDU_TONGJI_ID = '';

declare global {
  interface Window {
    _hmt?: unknown[];
  }
}

let hmInjected = false;

/** 注入百度统计 hm.js（标准做法：先建队列再加载脚本，注入前的事件不会丢） */
function ensureHm(): void {
  if (hmInjected || !BAIDU_TONGJI_ID || typeof document === 'undefined') return;
  hmInjected = true;
  window._hmt = window._hmt ?? [];
  const s = document.createElement('script');
  s.src = `https://hm.baidu.com/hm.js?${BAIDU_TONGJI_ID}`;
  s.async = true;
  document.head.appendChild(s);
}

type EventName =
  | 'view_home'
  | 'view_reveal'
  | 'onboard_finish'
  | 'onboard_skip'
  | 'settings_save'
  | 'test_start'
  | 'card_pick'
  | 'fortune_complete'
  | 'share_open'
  | 'share_save'
  | 'share_copy';

export function track(name: EventName, props?: Record<string, unknown>): void {
  if (import.meta.env.DEV) console.info(`[track] ${name}`, props ?? {});
  ensureHm();
  // 百度统计事件：_trackEvent(类别, 动作, 标签, 值)；标签放 props JSON
  window._hmt?.push(['_trackEvent', 'gg_oracle', name, props ? JSON.stringify(props) : undefined]);
}
