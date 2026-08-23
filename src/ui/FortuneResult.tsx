import { useState } from 'react';
import type { DailyFortune, Role } from '../../core/types';
import { ROLE_NAMES, heroName } from '../../core/content/heroes';
import { weaponName } from '../../core/content/weapons';
import { mapName } from '../../core/content/maps';
import Stars from './components/Stars';
import SectionCard from './components/SectionCard';
import { copyText } from '../clipboard';
import { track } from '../analytics';
import './result.css';

interface Props {
  fortune: DailyFortune;
  canReroll: boolean;
  onReroll: () => void;
  onShare: () => void;
}

const ROLE_ORDER: Role[] = ['duelist', 'initiator', 'controller', 'sentinel'];

/** 发给队友的文案模板（指导书 §7.5） */
export function shareTextOf(fortune: DailyFortune): string {
  const stars = '★'.repeat(fortune.main.stars) + '☆'.repeat(5 - fortune.main.stars);
  return [
    `今日瓦运 ${stars}`,
    `位置：${ROLE_NAMES[fortune.position.primary]}`,
    `英雄：${heroName(fortune.hero.id)}`,
    `武器：${weaponName(fortune.weapon.id)}`,
    `皮肤：${fortune.skin.id}`,
    `地图：${mapName(fortune.maps[0].id)}`,
    `雷区：${mapName(fortune.maps[fortune.maps.length - 1].id)}`,
    `Advice：${fortune.advice.keyword}`,
  ].join('｜');
}

/** 完整运势结果页（指导书 §7.4，PRD §13–§20） */
export default function FortuneResult({ fortune, canReroll, onReroll, onShare }: Props) {
  const [copied, setCopied] = useState(false);
  const [confirmReroll, setConfirmReroll] = useState(false);

  async function handleCopy() {
    track('share_copy');
    const ok = await copyText(shareTextOf(fortune));
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleReroll() {
    if (!confirmReroll) {
      setConfirmReroll(true);
      return;
    }
    setConfirmReroll(false);
    onReroll();
  }

  return (
    <main className="result">
      {/* 今日总运 */}
      <section className="hero-block">
        <Stars value={fortune.main.stars} size="lg" />
        <h1 className="hero-title">{fortune.main.title}</h1>
        <p className="hero-desc">{fortune.main.desc}</p>
      </section>

      <SectionCard icon="🎯" title="幸运位置">
        <div className="pos-primary">
          <span className="pos-name">{ROLE_NAMES[fortune.position.primary]}</span>
          <Stars value={5} size="md" />
        </div>
        <p className="pos-reason">{fortune.position.reason}</p>
        <p className="pos-heroes">推荐：{fortune.position.heroes.join(' / ')}</p>
        <ul className="pos-scores">
          {ROLE_ORDER.map((r) => (
            <li key={r}>
              <span>{ROLE_NAMES[r]}指数</span>
              <Stars value={fortune.position.scores[r]} size="sm" />
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard icon="⚔️" title="幸运英雄">
        <div className="row">
          <span className="row-main">{heroName(fortune.hero.id)}</span>
          <span className="match">
            今日契合度 <b>{fortune.hero.match}%</b>
          </span>
        </div>
        <p className="chips">
          {fortune.hero.keywords.map((k) => (
            <span key={k} className="chip">
              {k}
            </span>
          ))}
        </p>
        <p className="blurb">{fortune.hero.blurb}</p>
      </SectionCard>

      <SectionCard icon="🔫" title="幸运武器">
        <span className="row-main">{weaponName(fortune.weapon.id)}</span>
        <p className="blurb">{fortune.weapon.reason}</p>
        <p className="avoid">
          今日不推荐：<b>{weaponName(fortune.weapon.avoid.id)}</b> —— {fortune.weapon.avoid.reason}
        </p>
      </SectionCard>

      <SectionCard icon="💎" title="幸运皮肤">
        <div className="row">
          <span className="row-main">{fortune.skin.id}</span>
          <span className="match">
            今日契合 <b>{fortune.skin.match}%</b>
          </span>
        </div>
        <p className="skin-meta">
          幸运颜色：<b>{fortune.skin.color}</b> · 幸运饰品：<b>{fortune.skin.buddy}</b>
        </p>
        <p className="blurb">{fortune.skin.blurb}</p>
      </SectionCard>

      <SectionCard icon="🗺️" title="地图运势">
        <ul className="map-list">
          {fortune.maps.map((m, i) => (
            <li
              key={m.id}
              className={
                i === 0 ? 'map-lucky' : i === fortune.maps.length - 1 ? 'map-danger' : ''
              }
            >
              <span className="map-name">{mapName(m.id)}</span>
              <span className="map-right">
                <span className="map-label">{m.label}</span>
                <Stars value={m.stars} size="sm" />
              </span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard icon="💬" title="今日 Advice">
        <p className="advice-keyword">{fortune.advice.keyword}</p>
        <p className="advice-note">{fortune.advice.note}</p>
      </SectionCard>

      {canReroll && (
        <button className="reroll" type="button" onClick={handleReroll}>
          {confirmReroll ? '确认再抽一次？' : '命运并非不可改变 · 再抽一次'}
        </button>
      )}

      <div className="action-bar">
        <button className="action primary" type="button" onClick={onShare}>
          保存今日瓦运
        </button>
        <button className="action" type="button" onClick={handleCopy}>
          {copied ? '已复制 ✓' : '发给队友'}
        </button>
      </div>

      <footer className="footer">仅供娱乐 · 非官方产品</footer>
    </main>
  );
}
