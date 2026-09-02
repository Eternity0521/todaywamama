/**
 * 埋点抽象（指导书 §9）。
 * P0 先输出 console；M5 接入统计服务（umami 等）时只改此文件。
 * 北极星计算：完成率 = fortune_complete / test_start；分享率 = (share_save + share_copy) / fortune_complete。
 */
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
  console.info(`[track] ${name}`, props ?? {});
  // TODO(M5): 接入 umami / 自建统计
}
