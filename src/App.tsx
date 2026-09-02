import { useEffect, useMemo, useRef, useState } from 'react';
import type { DailyFortune, UserPrefs } from '../core/types';
import { todayKey } from '../core/date';
import { backfillMainCard, getOrCreateToday, lockCardPick } from '../core/generator';
import { AGENT_ROLES, AGENT_ROLE_TO_CORE, normalizeAgentId } from '../core/content/agents';
import { localStorageStore } from './storage';
import { loadProfile, saveProfile, type Profile } from './profileStorage';
import { track } from './analytics';
import Onboard from './ui/Onboard';
import Home from './ui/Home';
import CardPick from './ui/CardPick';
import FlipReveal from './ui/FlipReveal';
import FortuneResult from './ui/FortuneResult';
import ShareCard from './ui/ShareCard';

type Stage = 'onboard' | 'settings' | 'home' | 'pick' | 'flip' | 'result' | 'share';

/** Profile → UserPrefs：非法 role 置 null；agents 归一化 + 去重（防御损坏数据） */
function profileToPrefs(profile: Profile): UserPrefs {
  const role = AGENT_ROLES.find((r) => r.id === profile.role) ?? null;
  return {
    role: role ? AGENT_ROLE_TO_CORE[role.id] : null,
    agents: [...new Set(profile.agents.map(normalizeAgentId))],
  };
}

/**
 * 流程状态机（指导书 §7）：onboard → home → pick → flip → result → share。
 * 运势数据只来自 core（getOrCreateToday），UI 不自行生成。
 * 今天已经抽过时，首页直接跳到 flip（设计稿 homeDrawn → goReveal），不用重走一遍抽卡仪式。
 */
export default function App() {
  const [userId] = useState(() => localStorageStore.getUserId());
  const [profile, setProfile] = useState<Profile>(() => loadProfile());
  const [stage, setStage] = useState<Stage>(() => (profile.onboarded ? 'home' : 'onboard'));
  const [fortune, setFortune] = useState<DailyFortune | null>(() => {
    const f = localStorageStore.get(userId, todayKey());
    return f ? backfillMainCard(f) : null;
  });
  const prefs = useMemo(() => profileToPrefs(profile), [profile]);
  const viewedRef = useRef(false);

  useEffect(() => {
    if (!viewedRef.current) {
      viewedRef.current = true;
      track('view_home');
    }
  }, []);

  function handleStart() {
    if (fortune) {
      track('view_reveal');
      setStage('flip');
      return;
    }
    track('test_start');
    setFortune(getOrCreateToday(userId, localStorageStore, prefs));
    setStage('pick');
  }

  /** 抽卡页选中卡位 → 锁定卡面并落库（首选锁定），其余运势字段不变 */
  function handleLocked(slot: number) {
    if (!fortune) return;
    track('card_pick');
    setFortune(lockCardPick(fortune, slot, localStorageStore));
  }

  function handlePicked() {
    setStage('flip');
  }

  function handleRevealDone() {
    track('fortune_complete');
    setStage('result');
  }

  function handleShare() {
    track('share_open');
    setStage('share');
  }

  function handleOnboardFinish(next: Profile) {
    track('onboard_finish');
    saveProfile(next);
    setProfile(next);
    setStage('home');
  }

  function handleOnboardSkip() {
    track('onboard_skip');
    const next = { ...profile, onboarded: true };
    saveProfile(next);
    setProfile(next);
    setStage('home');
  }

  function handleSettingsSave(next: Profile) {
    track('settings_save');
    saveProfile(next);
    setProfile(next);
    setStage('home');
  }

  let page;
  if (stage === 'onboard') {
    page = <Onboard profile={profile} onFinish={handleOnboardFinish} onSkip={handleOnboardSkip} />;
  } else if (stage === 'settings') {
    page = <Onboard profile={profile} onFinish={handleSettingsSave} mode="edit" />;
  } else if (stage === 'home' || fortune === null) {
    page = <Home today={fortune} onStart={handleStart} onSettings={() => setStage('settings')} />;
  } else {
    switch (stage) {
      case 'pick':
        page = (
          <CardPick
            fortune={fortune}
            onBack={() => setStage('home')}
            onLocked={handleLocked}
            onPicked={handlePicked}
          />
        );
        break;
      case 'flip':
        page = <FlipReveal fortune={fortune} onDone={handleRevealDone} />;
        break;
      case 'share':
        page = (
          <ShareCard
            fortune={fortune}
            nickname={profile.nick || undefined}
            onBack={() => setStage('result')}
            onHome={() => setStage('home')}
          />
        );
        break;
      default:
        page = <FortuneResult fortune={fortune} onShare={handleShare} onHome={() => setStage('home')} />;
    }
  }

  return (
    <div className="app-shell">
      <div className="phone-frame">
        {/* 全局氛围层（设计稿：26px 网格 + 9s 扫描线） */}
        <div className="app-grid" aria-hidden="true" />
        <div className="app-scanline" aria-hidden="true" />
        {page}
      </div>
    </div>
  );
}
