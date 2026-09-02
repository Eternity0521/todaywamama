import type { Role } from '../types';

/** 英雄条目（指导书 §6.1）。id 为跨文件引用 key。 */
export interface HeroEntry {
  id: string;
  name: string;       // 展示名（英文 + 国服官方译名，与 core/content/agents.ts 保持一致）
  role: Role;
  keywords: string[]; // 3–5 个风格关键词
  blurbs: string[];   // 2–3 条趣味解释（游戏梗风格）
}

/** 位置中文名 */
export const ROLE_NAMES: Record<Role, string> = {
  duelist: '决斗',
  initiator: '先锋',
  controller: '控场',
  sentinel: '哨卫',
};

/** 位置理由池（幸运位置 reason 文案，PRD §14） */
export const POSITION_REASONS: Record<Role, string[]> = {
  duelist: [
    '今天你的反应力在线，正面突破有说法。',
    '今日适合打头阵，你的第一枪会为队伍打开局面。',
  ],
  initiator: [
    '今天信息比枪法更值钱，把地图点亮再说。',
    '今日适合先把对面搅乱，队友自然知道该怎么打。',
  ],
  controller: [
    '今日更适合控制节奏，而不是创造混乱。',
    '今天把烟下到位，这一局就已经赢了一半。',
  ],
  sentinel: [
    '今天守住后点比到处找人打更划算。',
    '今日适合当队伍的定海神针，稳住就能赢。',
  ],
};

export const HEROES: HeroEntry[] = [
  // ============ 决斗 duelist ============
  {
    id: 'Jett',
    name: 'Jett（捷风）',
    role: 'duelist',
    keywords: ['拉枪线', '机动', '接刀'],
    blurbs: [
      '今天你的位移会快过对面的准星——但别把队友甩在后面。',
      '风一样的女人，今天适合把节奏带起来，第一个进点的可以是你。',
    ],
  },
  {
    id: 'Raze',
    name: 'Raze（雷兹）',
    role: 'duelist',
    keywords: ['爆破', '莽', '雷王'],
    blurbs: [
      '今天你扔出去的东西都会响。别忘了有些是留给自己的。',
      '别问，问就是炸。今天让对面体验一下什么叫雷区蹦迪。',
    ],
  },
  {
    id: 'Reyna',
    name: 'Reyna（芮娜）',
    role: 'duelist',
    keywords: ['残局', '连杀', '独狼'],
    blurbs: [
      '今天残局有说法，但你得先拿到第一滴血。',
      '你的状态越好，她的能量越足。今天适合一个人把局面打穿。',
    ],
  },
  {
    id: 'Phoenix',
    name: 'Phoenix（不死鸟）',
    role: 'duelist',
    keywords: ['回血', '纵火', '莽撞'],
    blurbs: [
      '不死鸟今天手感在线，记得给自己留个闪。',
      '今天适合打得像太阳一样耀眼——但别把自己闪了。',
    ],
  },
  {
    id: 'Yoru',
    name: 'Yoru（夜露）',
    role: 'duelist',
    keywords: ['诱敌', '分神', '鬼祟'],
    blurbs: [
      '今天声东击西有奇效，对面永远猜不到你在哪。',
      '夜露的玩法就是让对面以为你在这里。今天你的戏可以多一点。',
    ],
  },
  {
    id: 'Neon',
    name: 'Neon（霓虹）',
    role: 'duelist',
    keywords: ['速度', '冲锋', '莽'],
    blurbs: [
      '今天你的手速快过脑速，冲之前先看清有几个枪口。',
      '闪电侠附体，今天适合把节奏拉到对面喘不过气。',
    ],
  },
  {
    id: 'Iso',
    name: 'Iso（壹决）',
    role: 'duelist',
    keywords: ['单挑', '护盾', '冷静'],
    blurbs: [
      '今天单挑胜率高，但别每把都喊人出来 solo。',
      '开了盾就别怂，今天你的正面胜率值得信任。',
    ],
  },
  {
    id: 'Waylay',
    name: 'Waylay（幻棱）',
    role: 'duelist',
    keywords: ['突进', '棱镜', '追击'],
    blurbs: [
      '今天你的突进时机很准，冲进去之前记得让队友补个闪。',
      '光速进场，今天适合打对面一个措手不及。',
    ],
  },

  // ============ 先锋 initiator ============
  {
    id: 'Sova',
    name: 'Sova（猎枭）',
    role: 'initiator',
    keywords: ['侦查', '鹰眼', '透视'],
    blurbs: [
      '今天信息会自己送上门，开局一箭先看清三个人。',
      '猎人之眼，今天你看到的东西比别人多——记得说给队友听。',
    ],
  },
  {
    id: 'Breach',
    name: 'Breach（铁臂）',
    role: 'initiator',
    keywords: ['震地', '闪光', '破点'],
    blurbs: [
      '今天你的道具会把对面震到怀疑人生，然后队友进场收割。',
      '大力出奇迹，今天适合把墙后面的胆小鬼全抖出来。',
    ],
  },
  {
    id: 'Skye',
    name: 'Skye（斯凯）',
    role: 'initiator',
    keywords: ['治疗', '群闪', '指路'],
    blurbs: [
      '今天你的鹰和狗都比对面清醒，信息流拉满。',
      '带治疗打先锋，今天你就是队伍里最可靠的人。',
    ],
  },
  {
    id: 'KAY/O',
    name: 'KAY/O（K/O）',
    role: 'initiator',
    keywords: ['压制', '沉默', '无情'],
    blurbs: [
      '今天让对面的技能闭嘴很有用，他们的大招全憋在手里。',
      '机器人都比你冷静的时候，说明今天状态对了。',
    ],
  },
  {
    id: 'Fade',
    name: 'Fade（黑梦）',
    role: 'initiator',
    keywords: ['恐惧', '追踪', '暗影'],
    blurbs: [
      '今天对面的恐惧都写在你眼里，追着影子打就完事了。',
      '噩梦成真，今天适合把对面一个个揪出来。',
    ],
  },
  {
    id: 'Gekko',
    name: 'Gekko（盖可）',
    role: 'initiator',
    keywords: ['回收', '整活', '轮转'],
    blurbs: [
      '今天你的小怪会自己回家，省得你跑去捡。',
      '盖可的快乐就是反复扔，今天适合把技能轮转玩到极致。',
    ],
  },
  {
    id: 'Tejo',
    name: 'Tejo（钛狐）',
    role: 'initiator',
    keywords: ['轰炸', '精准', '压制'],
    blurbs: [
      '今天你的导弹指哪打哪，对面只能从角落里爬出来。',
      '空中支援已就位，今天适合让对面先掉一层皮。',
    ],
  },

  // ============ 控场 controller ============
  {
    id: 'Omen',
    name: 'Omen（幽影）',
    role: 'controller',
    keywords: ['冷静', '信息差', '偷时机'],
    blurbs: [
      '今天别人看不到你的时候，往往就是你的机会。',
      '烟雾里的世界归你管，今天适合打信息差。',
    ],
  },
  {
    id: 'Brimstone',
    name: 'Brimstone（炼狱）',
    role: 'controller',
    keywords: ['战术', '封烟', '指挥'],
    blurbs: [
      '今天你指哪烟就下哪，队友跟着你的节奏打。',
      '老兵的判断今天值得信赖，开局就定好这一局的剧本。',
    ],
  },
  {
    id: 'Viper',
    name: 'Viper（蝰蛇）',
    role: 'controller',
    keywords: ['毒', '压制', '残局'],
    blurbs: [
      '今天你的毒会让对面每走一步都掉血，拖到残局就是你的主场。',
      '毒雾里的残局是你的天下，今天别急着现身。',
    ],
  },
  {
    id: 'Astra',
    name: 'Astra（星礈）',
    role: 'controller',
    keywords: ['星图', '控制', '大局'],
    blurbs: [
      '今天你俯瞰全局，对面的一举一动都在你的星图上。',
      '星图一开，今天这张地图的规则由你写。',
    ],
  },
  {
    id: 'Harbor',
    name: 'Harbor（海神）',
    role: 'controller',
    keywords: ['水墙', '推进', '保护'],
    blurbs: [
      '今天你的水墙会挡住所有子弹，队友跟着你冲就完了。',
      '水到渠成，今天适合把推进变成一场艺术。',
    ],
  },
  {
    id: 'Clove',
    name: 'Clove（暮蝶）',
    role: 'controller',
    keywords: ['不怂', '死后烟', '双闪'],
    blurbs: [
      '暮蝶最不怕死，今天适合打得凶一点——反正死了还能封烟。',
      '今天死了也别闲着，你的烟还能帮队友翻盘。',
    ],
  },

  // ============ 哨卫 sentinel ============
  {
    id: 'Sage',
    name: 'Sage（贤者）',
    role: 'sentinel',
    keywords: ['治疗', '守护', '复活'],
    blurbs: [
      '今天队友的命都靠你续，站后面一点比什么都强。',
      '贤者的墙今天立得又直又硬，复活留给最值得的人。',
    ],
  },
  {
    id: 'Cypher',
    name: 'Cypher（零）',
    role: 'sentinel',
    keywords: ['监控', '陷阱', '情报'],
    blurbs: [
      '今天整个后点都在你的镜头里，对面偷不了任何人。',
      '你的陷阱今天总能等到有缘人，残局也别把情报咽肚子里。',
    ],
  },
  {
    id: 'Killjoy',
    name: 'Killjoy（奇乐）',
    role: 'sentinel',
    keywords: ['科技宅', '陷阱', '守点'],
    blurbs: [
      '今天你的小玩意会把点位守得滴水不漏，人来人亡。',
      '科技宅的胜利，今天适合让对面碰一鼻子灰再送。',
    ],
  },
  {
    id: 'Chamber',
    name: 'Chamber（尚勃勒）',
    role: 'sentinel',
    keywords: ['优雅', '狙击', '秒杀'],
    blurbs: [
      '今天你的手枪打得像步枪，传送永远比对面快一步。',
      '他的高贵今天写在弹道里，第一枪就是警告。',
    ],
  },
  {
    id: 'Deadlock',
    name: 'Deadlock（钢锁）',
    role: 'sentinel',
    keywords: ['束缚', '钢铁', '守点'],
    blurbs: [
      '今天想跑的人都会被你的网拽回来，一个都别想走。',
      '今天适合把后点变成对面的禁入区。',
    ],
  },
  {
    id: 'Vyse',
    name: 'Vyse（维斯）',
    role: 'sentinel',
    keywords: ['禁锢', '钩刺', '反打'],
    blurbs: [
      '今天你的荆棘会让对面有来无回，反打时机抓得准。',
      '她最懂什么叫瓮中捉鳖，今天适合守株待兔。',
    ],
  },
];

/** 按位置分组（供生成器使用） */
export const HEROES_BY_ROLE: Record<Role, HeroEntry[]> = {
  duelist: HEROES.filter((h) => h.role === 'duelist'),
  initiator: HEROES.filter((h) => h.role === 'initiator'),
  controller: HEROES.filter((h) => h.role === 'controller'),
  sentinel: HEROES.filter((h) => h.role === 'sentinel'),
};

/** 英雄 id → 展示名（未知 id 原样返回） */
export function heroName(id: string): string {
  return HEROES.find((h) => h.id === id)?.name ?? id;
}
