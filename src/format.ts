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

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

/** 设计稿日期格式：8月23日 星期日 */
export function formatDateShortCN(d: Date): string {
  return `${d.getMonth() + 1}月${d.getDate()}日 星期${WEEKDAYS[d.getDay()]}`;
}
