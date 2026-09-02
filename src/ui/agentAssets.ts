/**
 * 英雄头像素材映射（同 cardAssets.ts 的 id → 构建产物 URL 模式）。
 * 头像用于初次见面页网格 / 分享卡小图；立绘用于今日运势页角色卡。
 */
function buildMap(glob: Record<string, string>): Record<string, string> {
  const byId: Record<string, string> = {};
  for (const [path, url] of Object.entries(glob)) {
    const id = path.match(/([a-z0-9]+)\.webp$/)?.[1] ?? '';
    if (id) byId[id] = url;
  }
  return byId;
}

const AGENT_IMG_BY_ID = buildMap(
  import.meta.glob('../assets/agents/*.webp', { eager: true, import: 'default' }) as Record<string, string>,
);

const AGENT_BUST_BY_ID = buildMap(
  import.meta.glob('../assets/agents-bust/*.webp', { eager: true, import: 'default' }) as Record<string, string>,
);

export function agentImageUrl(agentId: string): string {
  return AGENT_IMG_BY_ID[agentId] ?? '';
}

/** 立绘（半身像，今日运势页角色卡专用） */
export function agentBustUrl(agentId: string): string {
  return AGENT_BUST_BY_ID[agentId] ?? '';
}
