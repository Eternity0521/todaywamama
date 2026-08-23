/** 武器库（指导书 §6.2） */
export interface WeaponEntry {
  id: string;
  name: string;          // 展示名（英文为主 + PRD 确认的中文名）
  reasons: string[];     // 推荐理由模板
  avoidReasons: string[]; // 「今日不推荐它」模板（PRD §16）
}

export const WEAPON_POOL: WeaponEntry[] = [
  {
    id: 'Phantom',
    name: 'Phantom（幻影）',
    reasons: [
      '今天适合少一点赌枪，多一点稳定输出。',
      '幻影的稳定性今天会帮你兜底，中距离就靠它了。',
    ],
    avoidReasons: [
      '今天的你拿着幻影可能会忍不住开扫，枪口一飘就露了位置。',
      '今天幻影的弹道会跟你开小玩笑，别赌那颗头。',
    ],
  },
  {
    id: 'Vandal',
    name: 'Vandal（狂徒）',
    reasons: [
      '今天你的第一枪会比平时更准，一枪一个不是梦。',
      '今天适合相信自己的瞄准，狂徒的一发头是对面最怕的。',
    ],
    avoidReasons: [
      '今天你的随机弹道可能不太听话，马枪集锦预警。',
      '今天的狂徒会给你虚假的自信，看见人就大拉。',
    ],
  },
  {
    id: 'Operator',
    name: 'Operator（狙击枪）',
    reasons: [
      '今天你的架点比干拉值钱，大狙在手对面不敢露。',
      '今天适合打防守枪，一发入魂的机会比平时多。',
    ],
    avoidReasons: [
      '今天的你可能会忍不住 Peek 第二次。',
      '今天不适合赌枪，一枪打空等于白给。',
    ],
  },
  {
    id: 'Sheriff',
    name: 'Sheriff（警长）',
    reasons: [
      '今天手枪局是你的主场，一颗头的浪漫说来就来。',
      '今天你的准星会自己找人，沙鹰警告。',
    ],
    avoidReasons: [
      '今天你的手可能比枪抖，一发不中就是背景板。',
      '别迷信警长的浪漫，今天它可能会放你鸽子。',
    ],
  },
  {
    id: 'Spectre',
    name: 'Spectre',
    reasons: [
      '今天混烟冲点比架枪更有说法，小冲锋的射速是优势。',
      '今天适合打近身，贴脸的时候没人快过你。',
    ],
    avoidReasons: [
      '小冲锋今天容易被对面大枪教育，别硬换。',
      '今天拿它打中距离会有点尴尬，打不死还被反杀。',
    ],
  },
  {
    id: 'Judge',
    name: 'Judge',
    reasons: [
      '今天守点的时候别站太远，喷子教做人。',
      '今天转角遇到爱的概率很高，一喷一个准。',
    ],
    avoidReasons: [
      '今天喷子的弹丸会绕过所有人，贴脸也能空枪。',
      '别拿喷子打大图，今天的它只有威慑力没有杀伤力。',
    ],
  },
  {
    id: 'Guardian',
    name: 'Guardian',
    reasons: [
      '今天适合一发一发的冷静输出，点射节奏在你手里。',
      '今天你的开镜会比对面快半拍，中远距离是你的天下。',
    ],
    avoidReasons: [
      '今天你的点射会慢半拍，等不起就别拿它。',
      '别用它打贴脸，今天的你开镜速度不够救命。',
    ],
  },
  {
    id: 'Bulldog',
    name: 'Bulldog',
    reasons: [
      '中距离今天随缘三连发有说法，经济局神器。',
      '今天它的三连发会自己修正，闭眼点两下也行。',
    ],
    avoidReasons: [
      '今天的随缘三连发可能只有随缘，没有三连。',
      '别指望它跟大枪对枪，今天的弹道不听劝。',
    ],
  },
];

/** 武器 id → 展示名（未知 id 原样返回） */
export function weaponName(id: string): string {
  return WEAPON_POOL.find((w) => w.id === id)?.name ?? id;
}
