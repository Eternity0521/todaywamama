# 开局运势（GG Oracle）

游戏前「抽卡测运势」娱乐工具。定位：**不是游戏数据工具，而是玩家开局前的仪式工具**（抽卡 → 揭晓 → 带着结果进入游戏，全程 ≤30 秒）。

## 必读文档

- 需求原文：`游戏前测运势小程序 PRD V0.1.md`
- 开发标准：`开发指导书.md`（需求拆解、技术方案、算法规格、内容库规格、页面规格、里程碑、验收标准）——**动手开发前必读对应章节**
- 进度现状：`功能完成记录.md`（P0 已完成功能、UI 融合记录、测试覆盖、待真机验证清单、P1/P2 预留）
- 美术设计稿：`design/unpacked/`（「电竞终端数据感 · 霓虹紫」方向的 5 屏交互 Demo 与素材源文件）

## 已定决策

- **H5 先行**（Vite + React + TS + 原生 CSS，纯前端无后端，localStorage），验证后迁移微信小程序
- 首版只做 **P0 完整版**（指导书 §3 功能清单），P1/P2 只预留扩展点
- 唯一游戏：VALORANT
- **UI 采用美术设计稿**（紫黑 `#0c0910` + 霓虹紫 `#c084d8` + 全直角 + 网格/扫描线氛围），素材 WebP 化进 `src/assets/`

## 关键约束

- 核心逻辑全部放 `core/`，必须平台无关（纯函数、无 DOM / localStorage / window 依赖），为小程序迁移做准备
- 运势结果必须**确定性生成**：seed = hash(userId | date)，禁止 `Math.random`
- 主运卡面由独立种子流 `cardFor(userId, date, reroll)` 抽取（不消耗主 RNG）；旧数据经 `backfillMainCard()` 补齐（幂等）
- 文案必须游戏梗风格，禁止星座腔；1★ 也必须轻松（「娱乐局」框架，`core/content/starTone.ts` 兜底），禁止「今天不适合游戏」
- 不接任何游戏数据 API，不涉付费抽奖；页脚常驻「仅供娱乐 · 非官方产品」
- 埋点统一走 `src/analytics.ts` 的 `track()`，事件名见指导书 §9
- 素材更新：改 `design/unpacked/` 后重跑 `npx --yes -p sharp node scripts/compress-assets.mjs`（总量 ≤2MB 预算）
