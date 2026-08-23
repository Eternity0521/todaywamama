import { useEffect, useRef, useState } from 'react';
import './pick.css';

interface Props {
  onPicked: () => void;
}

/**
 * 三选一抽卡（指导书 §7.2，PRD §12）。
 * 三张卡指向同一份当日运势（PRD §26 一致性），选择是仪式不是随机源。
 */
export default function CardPick({ onPicked }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);

  function handlePick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    timerRef.current = window.setTimeout(onPicked, 750);
  }

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  return (
    <main className="pick">
      <h1 className="pick-title">凭感觉选一张</h1>
      <p className="pick-sub">三张牌，指向同一份今日运势</p>
      <div className="cards">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            type="button"
            className={`card ${picked === i ? 'picked' : ''} ${picked !== null && picked !== i ? 'dim' : ''}`}
            onClick={() => handlePick(i)}
            aria-label={`选择第 ${i + 1} 张卡`}
          >
            <span className="card-inner">
              <span className="card-face card-front">
                🎴
                <em>今日瓦运</em>
              </span>
              <span className="card-face card-back">
                ✦
                <em>今日主运</em>
              </span>
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}
