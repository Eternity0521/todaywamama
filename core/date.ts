/**
 * 日期工具（指导书 §5.10）。
 * 「今天」一律取本地时区，跨 0 点后日期变化 → 每日种子变化 → 运势自然刷新。
 */

/** 本地时区 YYYY-MM-DD */
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 今天的 YYYY-MM-DD */
export function todayKey(): string {
  return dateKey(new Date());
}
