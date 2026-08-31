import { useEffect, useState } from 'react';
import type { DailyFortune } from '../../core/types';
import { drawShareCard } from '../share/drawShareCard';
import { downloadDataUrl } from '../share/saveImage';
import { shareTextOf } from '../share/shareText';
import { track } from '../analytics';
import { copyText } from '../clipboard';
import './share.css';

interface Props {
  fortune: DailyFortune;
  onBack: () => void;
  onHome: () => void;
}

/** 分享卡页（指导书 §7.5）——设计稿 share 屏：保存图片 / 分享给队友 / 返回首页 */
export default function ShareCard({ fortune, onBack, onHome }: Props) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const canvas = drawShareCard(fortune);
    setImgUrl(canvas.toDataURL('image/png'));
  }, [fortune]);

  function handleSave() {
    track('share_save');
    if (imgUrl) downloadDataUrl(imgUrl, `今日瓦运-${fortune.date}.png`);
    setToast('已开始下载；若没有反应，请长按上方图片保存');
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
          {imgUrl ? (
            <img className="share-img" src={imgUrl} alt="今日瓦运分享卡" />
          ) : (
            <div className="share-loading">生成中…</div>
          )}
        </div>

        <div className="share-actions">
          <button className="share-btn primary" type="button" onClick={handleSave}>
            保存图片
          </button>
          <button className="share-btn secondary" type="button" onClick={handleCopy}>
            分享给队友
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
