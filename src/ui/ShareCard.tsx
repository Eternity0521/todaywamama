import { useEffect, useState } from 'react';
import type { DailyFortune } from '../../core/types';
import { drawShareCard } from '../share/drawShareCard';
import { downloadDataUrl } from '../share/saveImage';
import { track } from '../analytics';
import { copyText } from '../clipboard';
import { shareTextOf } from './FortuneResult';
import './share.css';

interface Props {
  fortune: DailyFortune;
  onBack: () => void;
}

/** 分享卡页（指导书 §7.5）：Canvas 生成图片 + 下载/长按保存/复制文案 */
export default function ShareCard({ fortune, onBack }: Props) {
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
      {imgUrl ? (
        <img className="share-img" src={imgUrl} alt="今日瓦运分享卡" />
      ) : (
        <div className="share-loading">生成中…</div>
      )}
      <p className="share-hint">💡 点不开下载时，长按图片即可保存</p>
      <div className="share-actions">
        <button className="share-btn primary" type="button" onClick={handleSave}>
          保存图片
        </button>
        <button className="share-btn" type="button" onClick={handleCopy}>
          发给队友
        </button>
        <button className="share-btn ghost" type="button" onClick={onBack}>
          返回完整运势
        </button>
      </div>
      {toast && <p className="share-toast">{toast}</p>}
    </main>
  );
}
