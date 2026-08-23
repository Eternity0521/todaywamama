/** 日期展示格式：2026 / 08 / 23（PRD §11） */
export function formatDateCN(d: Date): string {
  return d
    .toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .replaceAll('/', ' / ');
}

/** 'YYYY-MM-DD' → 2026 / 08 / 23 */
export function formatKeyCN(key: string): string {
  const [y, m, d] = key.split('-');
  return `${y} / ${m} / ${d}`;
}
