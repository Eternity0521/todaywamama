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

const RAIL_N = 11;
const CARD_W = 124;
const GAP = 16;
const STEP = CARD_W + GAP;
const R = 296;

function wrap(u: number, n: number): number {
  const h = n / 2;
  return (((u + h) % n) + n) % n - h;
}

/** 卡片在弧形轨道上的位置/朝向/透明度（设计稿 draw 屏物理原版移植） */
function arc(u: number) {
  const ang = 360 / RAIL_N;
  const w = wrap(u, RAIL_N);
  const th = (w * ang * Math.PI) / 180;
  const px = R * Math.sin(th);
  const z = R * Math.cos(th) - R;
  const a = Math.abs(w);
  const k = Math.max(0, 1 - a * 0.55);
  const front = Math.cos(th);
  return {
    tf: `translate3d(${px.toFixed(1)}px,${(-10 * k).toFixed(1)}px,${z.toFixed(1)}px) rotateY(${(w * ang).toFixed(2)}deg)`,
    op: Math.max(0, 0.16 + 0.84 * k) * Math.min(1, Math.max(0, (front + 0.55) / 0.7)),
    z: Math.round(z),
    a,
  };
}

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
 * 抽卡页（指导书 §7.2）——设计稿 draw 屏：11 张卡弧形轨道，拖拽/滚轮左右转动，
 * 点中间那张（或底部按钮）抽取；抽到的牌原地翻面，可再点大卡翻回。
 * 无论转到哪张、抽到的都是同一份今日运势（纯仪式，非随机源）。
 */
export default function CardPick({ fortune, onBack, onPicked }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [turns, setTurns] = useState(0);
  const [bigIn, setBigIn] = useState(false);

  const railRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const x = useRef(0);
  const v = useRef(0);
  const dragging = useRef(false);
  const dragFlag = useRef(false);
  const fade = useRef(1);
  const hi = useRef(1);
  const rafId = useRef(0);
  const watchId = useRef(0);
  const lastFrame = useRef(0);
  const phaseRef = useRef<Phase>('idle');
  const timers = useRef<number[]>([]);

  phaseRef.current = phase;

  function centerIndex(): number {
    return Math.round(x.current / STEP);
  }

  function paint() {
    lastFrame.current = performance.now();
    rafId.current = requestAnimationFrame(paint);
    const tr = trackRef.current;
    if (!tr) return;

    if (!dragging.current) {
      if (Math.abs(v.current) > 0.4) {
        x.current += v.current;
        v.current *= 0.93;
      } else {
        v.current = 0;
        const snap = Math.round(x.current / STEP) * STEP;
        const d = snap - x.current;
        if (Math.abs(d) > 0.15) x.current += d * 0.16;
        else x.current = snap;
      }
    }

    const sx = x.current;
    const target = phaseRef.current === 'idle' ? 1 : 0;
    fade.current += (target - fade.current) * 0.14;
    if (Math.abs(fade.current - target) < 0.004) fade.current = target;
    const f = fade.current;

    const snapNow = Math.round(sx / STEP) * STEP;
    const moving = dragging.current || Math.abs(v.current) > 0.4 || Math.abs(snapNow - sx) > 1.5;
    const ht = moving ? 0 : 1;
    hi.current += (ht - hi.current) * (moving ? 0.3 : 0.12);
    const hiv = hi.current;

    const kids = tr.children;
    for (let i = 0; i < kids.length; i++) {
      const t = arc((i * STEP - sx) / STEP);
      const k = Math.max(0, 1 - t.a * 0.55) * hiv;
      const el = kids[i] as HTMLElement;
      el.style.zIndex = String(600 + t.z);
      el.style.transform = `${t.tf} scale(${(0.94 + 0.06 * k * f).toFixed(3)})`;
      el.style.opacity = (t.op * f).toFixed(3);
      const hot = t.a < 0.34 && hiv > 0.6;
      el.style.borderColor = hot ? 'var(--acc)' : 'var(--acc-30)';
      el.style.boxShadow = hot ? '0 18px 44px -20px var(--acc-55)' : 'none';
      el.style.pointerEvents = target ? 'auto' : 'none';
    }
  }

  useEffect(() => {
    x.current = Math.floor(RAIL_N / 2) * STEP;
    rafId.current = requestAnimationFrame(paint);
    watchId.current = window.setInterval(() => {
      if (performance.now() - lastFrame.current > 250) {
        cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(paint);
      }
    }, 300);
    return () => {
      cancelAnimationFrame(rafId.current);
      clearInterval(watchId.current);
      timers.current.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function later(fn: () => void, ms: number) {
    timers.current.push(window.setTimeout(fn, ms));
  }

  function draw() {
    if (phaseRef.current !== 'idle') return;
    setPhase('chosen');
    setTurns(0);
    setBigIn(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setBigIn(true)));
    later(() => {
      setPhase('flip');
      setTurns(1);
    }, 620);
  }

  function choose(slot: number) {
    if (dragFlag.current || phaseRef.current !== 'idle') return;
    const cur = centerIndex();
    if ((((slot - cur) % RAIL_N) + RAIL_N) % RAIL_N !== 0) {
      v.current = 0;
      x.current = (cur + wrap(slot - cur, RAIL_N)) * STEP;
      return;
    }
    draw();
  }

  function reflip() {
    if (phase === 'idle') return;
    setPhase((p) => (p === 'flip' ? 'chosen' : 'flip'));
    setTurns((t) => t + 1);
  }

  function onWheel(e: React.WheelEvent) {
    if (phaseRef.current !== 'idle') return;
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    v.current = Math.max(-40, Math.min(40, v.current + d * 0.22));
  }

  function onRailPointerDown(e: React.PointerEvent) {
    if (phaseRef.current !== 'idle') return;
    const el = railRef.current;
    if (!el) return;
    el.setPointerCapture?.(e.pointerId);
    const x0 = e.clientX;
    const sx0 = x.current;
    let last = e.clientX;
    let moved = 0;
    dragging.current = true;
    v.current = 0;

    const move = (ev: PointerEvent) => {
      moved = Math.max(moved, Math.abs(ev.clientX - x0));
      x.current = sx0 - (ev.clientX - x0);
      v.current = -(ev.clientX - last) * 0.9;
      last = ev.clientX;
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      dragging.current = false;
      if (moved > 6) {
        dragFlag.current = true;
        setTimeout(() => {
          dragFlag.current = false;
        }, 80);
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  const cardUrl = cardImageUrl(fortune.main.cardId);
  const flipped = phase === 'flip';
  const bigScale = bigIn ? 1 : 0.553;

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
          <h1>
            凭感觉
            <br />
            选一张。
          </h1>
          <p>别想太多，第一感觉最准。</p>
        </div>

        <div className="pick-stage">
          <div
            ref={railRef}
            className="pick-rail"
            onPointerDown={onRailPointerDown}
            onWheel={onWheel}
            style={{
              pointerEvents: phase === 'idle' ? 'auto' : 'none',
              cursor: phase === 'idle' ? 'grab' : undefined,
            }}
          >
            <div ref={trackRef} className="pick-track">
              {Array.from({ length: RAIL_N }, (_, i) => (
                <div key={i} className="pick-rail-card" onClick={() => choose(i)}>
                  <CardBackFace />
                </div>
              ))}
            </div>
          </div>

          {phase !== 'idle' && (
            <div className="pick-big-wrap">
              <div
                className="pick-big"
                onClick={reflip}
                style={{ transform: `scale(${bigScale}) rotateY(${turns * 180}deg)`, opacity: bigIn ? 1 : 0.4 }}
              >
                <div
                  className={`pick-big-face${flipped ? ' is-flipped' : ''}`}
                  style={{ transform: `rotateY(${turns * 180}deg)` }}
                >
                  {!flipped && (
                    <div className="pick-big-back">
                      <CardBackFace />
                    </div>
                  )}
                  {flipped &&
                    (cardUrl ? (
                      <img src={cardUrl} alt={fortune.main.cardName} draggable={false} />
                    ) : (
                      <span className="pick-card-name">{fortune.main.cardName}</span>
                    ))}
                </div>
              </div>
            </div>
          )}
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
          <div className="pick-idle-actions">
            <button className="pick-draw-btn" type="button" onClick={draw}>
              抽取这张
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
