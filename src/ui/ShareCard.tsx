import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import type { DailyFortune } from '../../core/types';
import { agentByRawId, AGENT_ROLES } from '../../core/content/agents';
import { weaponName } from '../../core/content/weapons';
import { mapName } from '../../core/content/maps';
import { formatDateMD, extractCN } from '../format';
import { agentImageUrl } from './agentAssets';
import { downloadDataUrl } from '../share/saveImage';
import { shareTextOf } from '../share/shareText';
import { track } from '../analytics';
import { copyText } from '../clipboard';
import './share.css';

interface Props {
  fortune: DailyFortune;
  nickname?: string;
  onBack: () => void;
  onHome: () => void;
}

function StarSvg({ on }: { on: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill={on ? 'var(--acc)' : 'none'}
      stroke={on ? 'none' : 'var(--acc-30)'}
      strokeWidth="1.7"
    >
      <path d="M12 1.8l3.1 6.5 7.1.9-5.2 4.9 1.3 7-6.3-3.4-6.3 3.4 1.3-7L1.8 9.2l7.1-.9z" />
    </svg>
  );
}

/**
 * 分享卡页（指导书 §7.5）——设计稿 isShare 屏：卡片本体是活的 HTML/CSS，
 * 和其它屏幕同一套字体渲染；「保存图片」直接把这个 DOM 节点原样栅格化成 PNG，
 * 保证下载下来的图和眼前看到的一模一样。
 */
export default function ShareCard({ fortune, nickname, onBack, onHome }: Props) {
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const { hero, weapon, map, main } = fortune;
  const agent = agentByRawId(hero.id);
  const roleName = agent ? AGENT_ROLES.find((r) => r.id === agent.role)?.name : undefined;

  async function handleSave() {
    track('share_save');
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true, skipFonts: true });
      downloadDataUrl(dataUrl, `今日瓦运-${fortune.date}.png`);
      setToast('已开始下载；若没有反应，请长按上方图片保存');
    } catch {
      setToast('生成图片失败，请长按上方图片保存');
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    track('share_copy');
    const ok = await copyText(shareTextOf(fortune));
    setToast(ok ? '已复制，去发给队友吧' : '复制失败，请手动截图');
  }

  return (
    <main className="share">
      <div className="share-inner">
        <header className="share-head">
          <button className="share-back" type="button" onClick={onBack} aria-label="返回完整运势">
            <svg
              width="11"
              height="19"
              viewBox="0 0 11 19"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9.5 1.5 2 9.5l7.5 8" />
            </svg>
          </button>
          <span className="share-step">分享卡</span>
        </header>

        <div className="share-stage">
          <div className="share-card" ref={cardRef}>
            <div className="share-card-grid" aria-hidden="true" />
            <div className="share-card-content">
              <div className="share-card-top">
                <div className="share-card-id">
                  {agent && <img src={agentImageUrl(agent.id)} alt="" draggable={false} />}
                  <span>{nickname ? `${nickname} 的今日瓦运` : '今日瓦运'}</span>
                </div>
                <span className="share-card-date">{formatDateMD(fortune.date)}</span>
              </div>

              <div className="share-card-stars" aria-label={`${main.stars} 星`}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <StarSvg key={s} on={s <= main.stars} />
                ))}
              </div>

              <div className="share-card-title">{main.title}</div>

              <div className="share-card-grid-2x2">
                <div className="share-card-cell">
                  <div className="share-card-cell-label">今日角色</div>
                  <div className="share-card-cell-value">
                    {agent ? `${roleName ?? ''} · ${agent.name}` : hero.id}
                  </div>
                </div>
                <div className="share-card-cell">
                  <div className="share-card-cell-label">幸运武器</div>
                  <div className="share-card-cell-value">{extractCN(weaponName(weapon.id))}</div>
                </div>
                <div className="share-card-cell">
                  <div className="share-card-cell-label">幸运地图</div>
                  <div className="share-card-cell-value">{extractCN(mapName(map.id))}</div>
                </div>
                <div className="share-card-cell accent">
                  <div className="share-card-cell-label">今日忌</div>
                  <div className="share-card-cell-value">{main.bad}</div>
                </div>
              </div>

              <div className="share-card-footer">
                <div className="share-card-brand">
                  <span className="share-card-diamond" aria-hidden="true" />
                  <span>今日瓦运</span>
                </div>
                <div className="share-card-qr" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        <div className="share-actions">
          <button className="share-btn primary" type="button" onClick={handleSave} disabled={saving}>
            {saving ? '生成中…' : '保存图片'}
          </button>
          <button className="share-btn secondary" type="button" onClick={handleCopy}>
            分享给好友
          </button>
          <button className="share-btn ghost" type="button" onClick={onHome}>
            返回首页
          </button>
        </div>
      </div>
      {toast && <p className="share-toast">{toast}</p>}
    </main>
  );
}
