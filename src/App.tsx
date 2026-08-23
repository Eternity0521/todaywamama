import { useEffect, useRef, useState } from 'react';
import type { DailyFortune } from '../core/types';
import { todayKey } from '../core/date';
import { getOrCreateToday, rerollToday, yesterdayFortune } from '../core/generator';
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
 */
export default function App() {
  const [userId] = useState(() => localStorageStore.getUserId());
  const [stage, setStage] = useState<Stage>('home');
  const [fortune, setFortune] = useState<DailyFortune | null>(() =>
    localStorageStore.get(userId, todayKey()),
  );
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
    if (fortune) {
      setStage('result');
      return;
    }
    setFortune(getOrCreateToday(userId, localStorageStore));
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

  if (stage === 'home' || fortune === null) {
    return <Home today={fortune} yesterday={yesterday} onStart={handleStart} />;
  }

  switch (stage) {
    case 'pick':
      return <CardPick onPicked={handlePicked} />;
    case 'flip':
      return <FlipReveal fortune={fortune} onDone={handleRevealDone} />;
    case 'share':
      return <ShareCard fortune={fortune} onBack={() => setStage('result')} />;
    default:
      return (
        <FortuneResult
          fortune={fortune}
          canReroll={fortune.reroll === 0}
          onReroll={handleReroll}
          onShare={handleShare}
        />
      );
  }
}
