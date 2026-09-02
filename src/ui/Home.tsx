import type { DailyFortune } from '../../core/types';
import './home.css';

interface Props {
  today: DailyFortune | null;
  onStart: () => void;
  onSettings: () => void;
}

/** 「我的设定」按钮图标（设计稿内联 SVG：简笔头像） */
function SettingsIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <circle cx="6" cy="4" r="2.1" />
      <path d="M1.8 11c0-2.3 1.9-3.6 4.2-3.6S10.2 8.7 10.2 11" />
    </svg>
  );
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

/** 首页「今日瓦运」（设计稿 isHome 屏：两种状态——今天没测过 / 今天已测过） */
export default function Home({ today, onStart, onSettings }: Props) {
  const drawn = today !== null;

  return (
    <main className="home">
      <div className="home-inner">
        <header className="home-head">
          <div>
            <div className="home-kicker">每日一卦</div>
            <h1 className="home-brand">今日瓦运</h1>
          </div>
          <div className="home-head-right">
            <button className="home-settings" type="button" onClick={onSettings}>
              <SettingsIcon />
              <span>我的设定</span>
            </button>
          </div>
        </header>

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
          {drawn ? (
            <>
              <h2>
                今天的牌，
                <br />
                已经翻开。
              </h2>
              <p>一天一卦，明天 0 点后可以再来。</p>
            </>
          ) : (
            <>
              <h2>
                今天这把，
                <br />
                有说法。
              </h2>
              <p>抽张卡牌，看看你的今日游戏运势。</p>
            </>
          )}
        </div>

        <div className="home-actions">
          <button className="home-cta" type="button" onClick={onStart}>
            <span>{drawn ? '查看今日运势' : '测测今日瓦运'}</span>
            <span className="home-cta-arrow">→</span>
          </button>
        </div>

        <footer className="home-footer">仅供娱乐 · 非官方产品</footer>
      </div>
    </main>
  );
}
