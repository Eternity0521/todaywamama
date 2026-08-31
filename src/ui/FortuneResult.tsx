import { useState } from 'react';
import type { DailyFortune, Role } from '../../core/types';
import { ROLE_NAMES, heroName } from '../../core/content/heroes';
import { weaponName } from '../../core/content/weapons';
import { mapName } from '../../core/content/maps';
import { STAR_TONE } from '../../core/content/starTone';
import { formatDateShortCN } from '../format';
import { omenBust } from './cardAssets';
import './result.css';

interface Props {
  fortune: DailyFortune;
  canReroll: boolean;
  onReroll: () => void;
  onShare: () => void;
  onHome: () => void;
}

const ROLE_ORDER: Role[] = ['duelist', 'initiator', 'controller', 'sentinel'];

/** 五星计数行（设计稿 mono 风格，如「★★★★☆」） */
function StarCount({ n }: { n: number }) {
  return (
    <span className="star-count" aria-label={`${n} 星`}>
      {'★'.repeat(n)}
      <span className="star-count-off">{'★'.repeat(5 - n)}</span>
    </span>
  );
}

/**
 * 完整运势结果页（指导书 §7.4，PRD §13–§20）——设计稿 fortune 屏：
 * 今日角色卡（幽影立绘）/ 幸运武器与地图 / 幸运颜色与皮肤 / 地图运势 / 今日忌。
 * 四位置指数、武器不推荐、改命以设计语言保留。
 */
export default function FortuneResult({ fortune, canReroll, onReroll, onShare, onHome }: Props) {
  const [confirmReroll, setConfirmReroll] = useState(false);
  const { main, position, hero, weapon, skin, maps, advice } = fortune;

  function handleReroll() {
    if (!confirmReroll) {
      setConfirmReroll(true);
      return;
    }
    setConfirmReroll(false);
    onReroll();
  }

  const luckyMap = maps[0];
  const dangerMap = maps[maps.length - 1];

  return (
    <main className="result">
      <div className="result-inner">
        <header className="result-head">
          <span>今日运势</span>
          <span className="result-date">{formatDateShortCN(new Date())}</span>
        </header>

        <div className="result-scroll">
          {/* 主运星级副标行（1★ 娱乐局铁律兜底） */}
          <div className="result-mainline">
            <span className="result-mainline-text">
              主运 · {main.title}（{main.cardName}）
            </span>
            <span className="result-mainline-stars">
              <StarCount n={main.stars} />
              <span className="result-mainline-tone">{STAR_TONE[main.stars]}</span>
            </span>
          </div>

          {/* 今日角色卡 */}
          <section className="hero-card">
            <div className="hero-card-ring" aria-hidden="true" />
            <div className="hero-card-top">
              <span className="hero-card-label">今日角色</span>
              <span className="hero-card-match">
                <b>{hero.match}%</b>
                <span>契合度</span>
              </span>
            </div>
            <div className="hero-card-body">
              {/* 幽影立绘先顶着（27 英雄图后续补齐） */}
              <img className="hero-card-img" src={omenBust} alt="" aria-hidden="true" draggable={false} />
              <div className="hero-card-info">
                <div className="hero-card-role">{ROLE_NAMES[position.primary]}型</div>
                <div className="hero-card-name">{heroName(hero.id)}</div>
              </div>
            </div>
            <div className="hero-card-chips">
              {hero.keywords.map((k) => (
                <span key={k} className="hero-card-chip">
                  {k}
                </span>
              ))}
            </div>
            <p className="hero-card-blurb">{hero.blurb}</p>

            {/* 四位置指数（PRD §14，设计语言：mono 四格 + 星数） */}
            <div className="role-scores">
              {ROLE_ORDER.map((r) => (
                <div
                  key={r}
                  className={`role-score${r === position.primary ? ' role-score-primary' : ''}`}
                >
                  <span>{ROLE_NAMES[r]}</span>
                  <StarCount n={position.scores[r]} />
                </div>
              ))}
            </div>
            <p className="role-scores-note">{position.reason}</p>
            <p className="role-scores-note role-scores-heroes">
              同位置顺带试试：{position.heroes.join(' / ')}
            </p>
          </section>

          {/* 幸运武器 + 幸运地图 */}
          <div className="result-duo">
            <section className="duo-card">
              <div className="duo-label">幸运武器</div>
              <div className="duo-name">{weaponName(weapon.id)}</div>
              <p className="duo-note">{weapon.reason}</p>
              <p className="duo-avoid">
                今日别碰：<b>{weaponName(weapon.avoid.id)}</b>——{weapon.avoid.reason}
              </p>
            </section>
            <section className="duo-card">
              <span className="duo-badge">今日有说法</span>
              <div className="duo-label">幸运地图</div>
              <div className="duo-name">{mapName(luckyMap.id)}</div>
              <div className="duo-stars">
                <StarCount n={luckyMap.stars} />
              </div>
              <p className="duo-note">{luckyMap.label}</p>
            </section>
          </div>

          {/* 幸运颜色 + 推荐皮肤 */}
          <section className="skin-block">
            <div className="skin-block-label">幸运颜色</div>
            <div className="skin-color-row">
              <div className="skin-color-swatch" aria-hidden="true" />
              <div>
                <div className="skin-color-name">{skin.color}</div>
                <p className="skin-color-note">{skin.blurb}</p>
              </div>
            </div>

            <div className="skin-divider" />
            <div className="skin-block-label">推荐皮肤</div>
            <div className="skin-list">
              <div className="skin-item">
                <div className="skin-item-name">{skin.id}</div>
                <p className="skin-item-note">今日契合 {skin.match}%</p>
              </div>
              <div className="skin-item">
                <div className="skin-item-name">幸运饰品 · {skin.buddy}</div>
                <p className="skin-item-note">带上它，和今天的运势一起出发。</p>
              </div>
            </div>
          </section>

          {/* 地图运势全列表 */}
          <section className="map-block">
            <div className="skin-block-label">地图运势</div>
            <ul className="map-list">
              {maps.map((m, i) => (
                <li
                  key={m.id}
                  className={
                    i === 0 ? 'map-lucky' : i === maps.length - 1 ? 'map-danger' : ''
                  }
                >
                  <span className="map-name">{mapName(m.id)}</span>
                  <span className="map-label">{m.label}</span>
                  <StarCount n={m.stars} />
                </li>
              ))}
            </ul>
            <p className="map-danger-note">今日雷区：{mapName(dangerMap.id)}</p>
          </section>

          {/* 今日忌（Advice）大块 */}
          <section className="advice-block">
            <div className="advice-block-label">今日忌</div>
            <div className="advice-block-keyword">{advice.keyword}</div>
            <p className="advice-block-note">{advice.note}</p>
          </section>

          {canReroll && (
            <button className="reroll" type="button" onClick={handleReroll}>
              {confirmReroll ? '确认再抽一次？' : '命运并非不可改变 · 再抽一次'}
            </button>
          )}
        </div>

        <div className="result-actions">
          <button className="result-cta" type="button" onClick={onShare}>
            <span>生成我的今日瓦运</span>
            <span className="result-cta-arrow">→</span>
          </button>
          <button className="result-home" type="button" onClick={onHome}>
            返回首页
          </button>
        </div>

        <footer className="result-footer">仅供娱乐 · 非官方产品</footer>
      </div>
    </main>
  );
}
