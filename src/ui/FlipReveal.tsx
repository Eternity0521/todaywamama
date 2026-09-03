import type { DailyFortune } from '../../core/types';
import { cardImageUrl } from './cardAssets';
import { formatDateShortCN } from '../format';
import './reveal.css';

interface Props {
  fortune: DailyFortune;
  onDone: () => void;
}

/** 五星行（设计稿 SVG 星形，紫色实心 / acc-30 描边空心） */
function StarSvg({ on }: { on: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill={on ? 'var(--acc)' : 'none'}
      stroke={on ? 'none' : 'var(--acc-30)'}
      strokeWidth="1.6"
    >
      <path d="M12 1.8l3.1 6.5 7.1.9-5.2 4.9 1.3 7-6.3-3.4-6.3 3.4 1.3-7L1.8 9.2l7.1-.9z" />
    </svg>
  );
}

/** 翻牌揭晓（指导书 §7.3）——设计稿 isReveal 屏：卡面图 + 星级 + 大字标题 + 解读 + 宜/忌。 */
export default function FlipReveal({ fortune, onDone }: Props) {
  const { main } = fortune;
  const cardUrl = cardImageUrl(main.cardId);

  return (
    <main className="reveal">
      <div className="reveal-inner">
        <header className="reveal-head">
          <span>已翻开 · {main.cardName}</span>
          <span className="reveal-date">{formatDateShortCN(new Date())}</span>
        </header>

        <div className="reveal-stage">
          <div className="reveal-card-wrap">
            {cardUrl && <img className="reveal-card-img" src={cardUrl} alt={main.cardName} draggable={false} />}
            <div className="reveal-stars" role="img" aria-label={`${main.stars} 星`}>
              {[1, 2, 3, 4, 5].map((s) => (
                <StarSvg key={s} on={s <= main.stars} />
              ))}
            </div>
          </div>
        </div>

        <div className="reveal-body">
          <h1 className="reveal-title">{main.title}</h1>
          <p className="reveal-desc">{main.desc}</p>

          <div className="reveal-yj">
            <div className="reveal-yj-cell">
              <div className="reveal-yj-label">
                <span className="reveal-yj-badge reveal-yj-badge-good">宜</span>
                <span>今日宜</span>
              </div>
              <div className="reveal-yj-text">{main.good.replace('宜', '')}</div>
            </div>
            <div className="reveal-yj-cell">
              <div className="reveal-yj-label">
                <span className="reveal-yj-badge reveal-yj-badge-bad">忌</span>
                <span>今日忌</span>
              </div>
              <div className="reveal-yj-text reveal-yj-text-bad">{main.bad.replace('忌', '')}</div>
            </div>
          </div>

          <button className="reveal-cta" type="button" onClick={onDone}>
            <span>查看详细运势</span>
            <span className="reveal-cta-arrow">→</span>
          </button>
        </div>
      </div>
    </main>
  );
}
