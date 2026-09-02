import type { DailyFortune } from '../../core/types';
import { ROLE_NAMES } from '../../core/content/heroes';
import { heroName } from '../../core/content/heroes';
import { weaponName } from '../../core/content/weapons';
import { mapName } from '../../core/content/maps';

/**
 * 发给队友的文案模板（指导书 §7.5）——UI 融合新格式：
 * 主运行带卡面 title 与卡名，新增宜/忌行。
 */
export function shareTextOf(fortune: DailyFortune): string {
  const stars = '★'.repeat(fortune.main.stars) + '☆'.repeat(5 - fortune.main.stars);
  return [
    `今日瓦运 ${stars}`,
    `主运：${fortune.main.title}（${fortune.main.cardName}）`,
    `宜：${fortune.main.good} ｜ 忌：${fortune.main.bad}`,
    `位置：${ROLE_NAMES[fortune.position.primary]}`,
    `英雄：${heroName(fortune.hero.id)}`,
    `武器：${weaponName(fortune.weapon.id)}`,
    `皮肤：${fortune.skin.skins.join('、')}`,
    `地图：${mapName(fortune.map.id)}`,
    `建议：${fortune.advice.keyword}`,
  ].join('｜');
}
