/** 战术关键词库（指导书 §6.5，PRD §20） */
export interface AdviceEntry {
  keyword: string;
  note: string;
}

export const ADVICE_POOL: AdviceEntry[] = [
  { keyword: '别急', note: '今天你的枪法会奖励耐心。' },
  { keyword: '相信第一判断', note: '想太多反而会慢半拍。' },
  { keyword: '少干拉', note: '今天的大拉，可能只有背景板里才有你。' },
  { keyword: '记得买枪', note: '别省，省下来的钱不会陪你去下一局。' },
  { keyword: '跟队友走', note: '一个人冲上去的结局，通常是 1v5 教学局。' },
  { keyword: '多看小地图', note: '信息不会自己跑进你的眼睛。' },
  { keyword: '不要压力枪', note: '手越抖，枪越飘。' },
  { keyword: '输两把就休息', note: '连败是从「我还能打回来」开始的。' },
  { keyword: '今天适合 Operator', note: '但也别五个人都起大狙。' },
  { keyword: '今天别当英雄', note: '该跑就跑，活着才有下一回合。' },
  { keyword: "DON'T REPEEK", note: '今天最大的敌人不是对面，而是你觉得自己还能再打一个。' },
  { keyword: '稳住，别送', note: '优势是苟出来的。' },
  { keyword: '第三把输了就收手', note: '事不过三。' },
  { keyword: '不要相信你的 Operator', note: '今天的你可能会忍不住 Peek 第二次。' },
  { keyword: '你今天的烟比枪靠谱', note: '把舞台交给队友。' },
  { keyword: '别急着 Peek', note: '等一个更好的时机。' },
];
