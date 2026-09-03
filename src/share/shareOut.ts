/**
 * 平台适配的「保存图片 / 分享给朋友」出口（指导书 §7.5 补充）。
 * 原则：能用系统能力就用系统能力，逐级降级，永远给用户兜底路径。
 *
 * 保存图片：
 *   - iOS Safari：a[download] 会打开新标签页而非保存 → 弹系统分享面板（「存储图像」）
 *   - 安卓 / 桌面：直接下载（安卓 Chrome 静默存入下载目录，不弹文件夹选择）
 *   - 微信内置浏览器：下载受限 → 提示长按保存（微信原生能力）
 * 分享给朋友：
 *   - 移动端：弹系统分享面板，直接发分享卡图片文件（微信 / QQ 在面板里直接收到图）
 *   - 桌面：复制图片到剪贴板，去聊天窗口粘贴（比复制文字直观）
 *   - 再降级：分享「文案 + 链接」（navigator.share）→ 复制文案 → 长按兜底
 * 分享链接：本地调试（localhost）无公开链接；部署后自动带上当前页面地址。
 */
import { copyText } from '../clipboard';
import { downloadDataUrl } from './saveImage';

const isWeChat =
  typeof navigator !== 'undefined' && /MicroMessenger/i.test(navigator.userAgent);
const isIOS =
  typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);

function isTouchDevice(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    (navigator.maxTouchPoints > 0 || 'ontouchstart' in window)
  );
}

/** 分享链接：本地调试无公开链接返回 null，部署后自动带上当前页面地址 */
function appShareUrl(): string | null {
  if (typeof location === 'undefined') return null;
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return null;
  return location.href;
}

async function dataUrlToFile(dataUrl: string, name: string): Promise<File | null> {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], name, { type: 'image/png' });
  } catch {
    return null;
  }
}

type ShareResult = 'shared' | 'cancelled' | 'unavailable';

async function shareFiles(file: File, text: string): Promise<ShareResult> {
  try {
    await navigator.share({ files: [file], title: '今日瓦运', text });
    return 'shared';
  } catch (e) {
    return e instanceof DOMException && e.name === 'AbortError' ? 'cancelled' : 'unavailable';
  }
}

async function shareTextViaSheet(text: string, url: string | null): Promise<ShareResult> {
  if (typeof navigator === 'undefined' || !navigator.share) return 'unavailable';
  try {
    await navigator.share({ title: '今日瓦运', text, url: url ?? undefined });
    return 'shared';
  } catch (e) {
    return e instanceof DOMException && e.name === 'AbortError' ? 'cancelled' : 'unavailable';
  }
}

/** 复制图片到剪贴板（桌面 Chrome/Edge；Firefox 等不支持则返回 false 走降级） */
async function copyImageToClipboard(file: File): Promise<boolean> {
  try {
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': file })]);
      return true;
    }
  } catch {
    // 继续走降级
  }
  return false;
}

/** 保存图片：返回给用户的提示文案（空串 = 无需提示） */
export async function saveFortuneImage(dataUrl: string, filename: string): Promise<string> {
  // iOS 上 a[download] 会打开新标签页而不是保存 → 走系统分享面板（「存储图像」）
  if (isIOS && !isWeChat) {
    const file = await dataUrlToFile(dataUrl, filename);
    // 直接尝试，不支持文件的浏览器由 shareFiles 内部捕获后走下载兜底
    if (file && 'share' in navigator) {
      const r = await shareFiles(file, filename);
      if (r === 'shared') return '已弹出面板：点「存储图像」即可保存到相册';
    }
  }
  // 桌面 / 安卓：直接下载（安卓存入下载目录，相册中可见）
  downloadDataUrl(dataUrl, filename);
  if (isWeChat) return '微信内下载受限：请长按上方图片保存到相册';
  return '已开始下载：图片会保存到手机下载目录，相册中可见';
}

/** 分享给朋友：返回给用户的提示文案（空串 = 无需提示） */
export async function shareFortune(text: string, dataUrl: string, filename: string): Promise<string> {
  const url = appShareUrl();
  const file = await dataUrlToFile(dataUrl, filename);

  // 1. 移动端：系统分享面板直接发图片文件（微信 / QQ 收到图；不支持自动降级）
  if (file && isTouchDevice() && 'share' in navigator) {
    const r = await shareFiles(file, text);
    if (r === 'shared') return '已弹出分享面板：选微信 / QQ 即可发送图片';
    if (r === 'cancelled') return '';
  }

  // 2. 桌面：复制图片到剪贴板，去聊天窗口粘贴
  if (file && !isTouchDevice() && (await copyImageToClipboard(file))) {
    return '已复制图片，去微信 / QQ 聊天窗口粘贴即可';
  }

  // 3. 系统分享面板发「文案 + 链接」
  const shareResult = await shareTextViaSheet(text, url);
  if (shareResult === 'shared') return '已弹出分享面板';
  if (shareResult === 'cancelled') return '';

  // 4. 复制文案兜底（小米/UC 等无分享面板的浏览器、微信内置浏览器也落在这里）
  const full = url ? `${text}｜${url}` : text;
  const ok = await copyText(full);
  if (ok) {
    return isWeChat
      ? '微信内无法弹出分享：已复制文案，或长按上方图片发送'
      : '已复制运势文案（含链接）：粘贴发送；想发图可长按上方图片';
  }
  return '分享失败：请长按上方图片保存后手动发送';
}
