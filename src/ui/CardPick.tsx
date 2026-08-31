import { useEffect, useRef, useState } from 'react';
import type { DailyFortune } from '../../core/types';
import { cardImageUrl } from './cardAssets';
import './pick.css';

interface Props {
  fortune: DailyFortune;
  onBack: () => void;
  onPicked: () => void;
}

type Phase = 'idle' | 'chosen' | 'flip';

/** 卡背菱形符号（设计稿内联 SVG） */
function CardBackFace() {
  return (
    <svg
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

/**
 * 抽卡页（指导书 §7.2）——设计稿 draw 屏：手动翻转、可翻回、卡面解读按钮。
 * 三张卡指向同一份今日运势（纯仪式，非随机源）；翻面显示当日真实卡面。
 */
export default function CardPick({ fortune, onBack, onPicked }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [turns, setTurns] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
  }, []);

  function choose(i: number) {
    if (phase === 'idle') {
      setPicked(i);
      setPhase('chosen');
      timerRef.current = window.setTimeout(() => {
        setPhase('flip');
        setTurns(1);
      }, 450);
      return;
    }
    if (picked !== i) return;
    // 已选中的牌：翻面 ⇄ 翻回
    setPhase((p) => (p === 'flip' ? 'chosen' : 'flip'));
    setTurns((t) => (t === 0 ? 1 : 0));
  }

  const flipped = phase === 'flip' && picked !== null;
  const cardUrl = cardImageUrl(fortune.main.cardId);

  return (
    <main className="pick">
      <div className="pick-inner">
        <header className="pick-head">
          <button className="pick-back" type="button" onClick={onBack} aria-label="返回首页">
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
          <span className="pick-step">第二步 · 抽牌</span>
        </header>

        <div className="pick-slogan">
          <h1>凭感觉<br />选一张。</h1>
          <p>别想太多，第一感觉最准。</p>
        </div>

        <div className="pick-stage">
          <div className={`pick-cards phase-${phase}`}>
            {[0, 1, 2].map((i) => {
              const chosen = picked === i;
              const isFlipped = flipped && chosen;
              return (
                <div
                  key={i}
                  className={`pick-card pick-card-${i}${chosen ? ' chosen' : ''}`}
                  onClick={() => choose(i)}
                  role="button"
                  aria-label={`第 ${i + 1} 张牌`}
                >
                  <div
                    className="pick-card-inner"
                    style={{ transform: `rotateY(${isFlipped ? turns * 180 : 0}deg)` }}
                  >
                    <div className="pick-card-face pick-card-backface">
                      <CardBackFace />
                    </div>
                    <div className="pick-card-face pick-card-front">
                      {cardUrl ? (
                        <img src={cardUrl} alt={fortune.main.cardName} draggable={false} />
                      ) : (
                        <span className="pick-card-name">{fortune.main.cardName}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {phase !== 'idle' ? (
          <div className="pick-done">
            <p className="pick-done-label">你抽到了{fortune.main.cardName}</p>
            <button className="pick-cta" type="button" onClick={onPicked}>
              <span>卡面解读</span>
              <span className="pick-cta-arrow">→</span>
            </button>
          </div>
        ) : (
          <p className="pick-hint">三张里选一张</p>
        )}
      </div>
    </main>
  );
}
