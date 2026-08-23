import { useEffect, useState } from 'react';
import type { DailyFortune } from '../../core/types';
import Stars from './components/Stars';
import './reveal.css';

interface Props {
  fortune: DailyFortune;
  onDone: () => void;
}

/** 是否偏好减弱动画（指导书 §7.3 无障碍） */
const REDUCED =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 翻牌揭晓：3D 翻转 → 星级逐颗渐显 → 标题/描述淡入（指导书 §7.3，PRD §12/13） */
export default function FlipReveal({ fortune, onDone }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), REDUCED ? 300 : 1800);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <main className="reveal">
      <div className="reveal-card">
        <Stars value={fortune.main.stars} size="lg" animate />
        <h1 className="reveal-title">{fortune.main.title}</h1>
        <p className="reveal-desc">{fortune.main.desc}</p>
      </div>
      {ready && (
        <button className="reveal-cta" type="button" onClick={onDone}>
          查看完整运势
        </button>
      )}
    </main>
  );
}
