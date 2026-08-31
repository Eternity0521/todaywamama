import type { DailyFortune } from '../../core/types';
import { formatDateShortCN } from '../format';
import './home.css';

interface Props {
  today: DailyFortune | null;
  yesterday: DailyFortune | null;
  onStart: () => void;
}

/** 卡背菱形符号（设计稿内联 SVG，居中卡加大透明度） */
function CardBackSvg({ dim = false }: { dim?: boolean }) {
  return (
    <svg
      className="card-back-svg"
      style={dim ? { opacity: 0.28 } : { opacity: 0.75 }}
      viewBox="0 0 100 178"
      preserveAspectRatio="none"
      fill="none"
      stroke="var(--acc)"
      strokeWidth="0.7"
      vectorEffect="non-scaling-stroke"
      aria-hidden="true"
    >
      <rect x="7" y="7" width="86" height="164" />
      <path d="M50 34 76 89 50 144 24 89Z" />
      <path d="M50 55 63 89 50 123 37 89Z" />
      <path d="M7 89h17M76 89h17M50 7v27M50 144v27" />
      <circle cx="50" cy="89" r="3" fill="var(--acc)" stroke="none" />
    </svg>
  );
}

/** 首页「今日瓦运」（指导书 §7.1，PRD §08/§11）——设计稿 home 屏版式 */
export default function Home({ today, yesterday, onStart }: Props) {
  const isFirst = !today && !yesterday;

  return (
    <main className="home">
      <div className="home-inner">
        <header className="home-head">
          <div>
            <div className="home-kicker">每日一卦</div>
            <h1 className="home-brand">今日瓦运</h1>
          </div>
          <p className="home-date">{formatDateShortCN(new Date())}</p>
        </header>

        {!isFirst && yesterday && (
          <p className="home-yesterday">
            昨日 · {yesterday.advice.keyword} ｜{'★'.repeat(yesterday.main.stars)}
            {'☆'.repeat(5 - yesterday.main.stars)}
          </p>
        )}

        <div className="home-cards" aria-hidden="true">
          <div className="card-back card-back-side-l">
            <CardBackSvg dim />
          </div>
          <div className="card-back card-back-main">
            <CardBackSvg />
          </div>
          <div className="card-back card-back-side-r">
            <CardBackSvg dim />
          </div>
        </div>

        <div className="home-slogan">
          <h2>今天这把，<br />有说法。</h2>
          <p>{isFirst ? '抽张卡牌，看看你的今日游戏运势。' : '昨日已读档，今天抽张新的。'}</p>
        </div>

        <div className="home-actions">
          <button className="home-cta" type="button" onClick={onStart}>
            <span>测测今日瓦运</span>
            <span className="home-cta-arrow">→</span>
          </button>
          <div className="home-secondary">
            <button type="button" onClick={onStart}>今天用哪套皮肤？</button>
            <button type="button" onClick={onStart}>给队友算一卦</button>
          </div>
        </div>

        <footer className="home-footer">仅供娱乐 · 非官方产品</footer>
      </div>
    </main>
  );
}
