import { useEffect, useRef, useState } from 'react';
import type { DailyFortune } from '../core/types';
import { todayKey } from '../core/date';
import { backfillMainCard, getOrCreateToday, rerollToday, yesterdayFortune } from '../core/generator';
import { localStorageStore } from './storage';
import { track } from './analytics';
import Home from './ui/Home';
import CardPick from './ui/CardPick';
import FlipReveal from './ui/FlipReveal';
import FortuneResult from './ui/FortuneResult';
import ShareCard from './ui/ShareCard';

type Stage = 'home' | 'pick' | 'flip' | 'result' | 'share';

/**
 * 流程状态机（指导书 §7）：home → pick → flip → result → share。
 * 运势数据只来自 core（getOrCreateToday / rerollToday），UI 不自行生成。
 * 旧数据（无卡面字段）在初始化处经 backfillMainCard 补齐（UI 融合迁移）。
 */
export default function App() {
  const [userId] = useState(() => localStorageStore.getUserId());
  const [stage, setStage] = useState<Stage>('home');
  const [fortune, setFortune] = useState<DailyFortune | null>(() => {
    const f = localStorageStore.get(userId, todayKey());
    return f ? backfillMainCard(f) : null;
  });
  const [yesterday] = useState<DailyFortune | null>(() =>
    yesterdayFortune(userId, localStorageStore),
  );
  const viewedRef = useRef(false);

  useEffect(() => {
    if (!viewedRef.current) {
      viewedRef.current = true;
      track('view_home');
    }
  }, []);

  function handleStart() {
    track('test_start');
    // 每次进入都走完整仪式（抽卡 → 卡面解读 → 运势）；已有结果不跳转，
    // 只在无结果时生成（PRD §26 确定性不受影响：结果逐字段一致）
    if (!fortune) {
      setFortune(getOrCreateToday(userId, localStorageStore));
    }
    setStage('pick');
  }

  function handlePicked() {
    track('card_pick');
    setStage('flip');
  }

  function handleRevealDone() {
    track('fortune_complete');
    setStage('result');
  }

  function handleReroll() {
    track('reroll_click');
    const f = rerollToday(userId, localStorageStore);
    if (f) setFortune(f);
  }

  function handleShare() {
    track('share_open');
    setStage('share');
  }

  let page;
  if (stage === 'home' || fortune === null) {
    page = <Home today={fortune} yesterday={yesterday} onStart={handleStart} />;
  } else {
    switch (stage) {
      case 'pick':
        page = <CardPick fortune={fortune} onBack={() => setStage('home')} onPicked={handlePicked} />;
        break;
      case 'flip':
        page = <FlipReveal fortune={fortune} onDone={handleRevealDone} />;
        break;
      case 'share':
        page = (
          <ShareCard
            fortune={fortune}
            onBack={() => setStage('result')}
            onHome={() => setStage('home')}
          />
        );
        break;
      default:
        page = (
          <FortuneResult
            fortune={fortune}
            canReroll={fortune.reroll === 0}
            onReroll={handleReroll}
            onShare={handleShare}
            onHome={() => setStage('home')}
          />
        );
    }
  }

  return (
    <>
      {/* 全局氛围层（设计稿：26px 网格 + 9s 扫描线） */}
      <div className="app-grid" aria-hidden="true" />
      <div className="app-scanline" aria-hidden="true" />
      {page}
    </>
  );
}
