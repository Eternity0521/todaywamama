/**
 * 下载 dataURL 图片。
 * 注意：iOS Safari / 微信内置浏览器的 a[download] 不可靠，
 * 页面须同时提供「长按图片保存」兜底提示（指导书 §7.5）。
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
