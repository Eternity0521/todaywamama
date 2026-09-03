/**
 * 下载 dataURL 图片（旧实现，保留备用）。
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

/**
 * 下载 Blob URL 图片：先把 dataURL 转成 Blob 再下载。
 * 夸克/UC 等浏览器对 data: URL 的 a[download] 支持差，Blob URL 是兼容性更好的标准做法。
 */
export async function downloadBlobUrl(dataUrl: string, filename: string): Promise<boolean> {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // 延迟回收，确保下载已开始
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return true;
  } catch {
    return false;
  }
}
