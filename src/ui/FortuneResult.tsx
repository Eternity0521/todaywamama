import type { DailyFortune } from '../../core/types';
import { agentByRawId, AGENT_ROLES } from '../../core/content/agents';
import { weaponName } from '../../core/content/weapons';
import { mapName } from '../../core/content/maps';
import { formatDateShortCN, extractCN } from '../format';
import { agentBustUrl } from './agentAssets';
import { colorSwatchHex } from './colorSwatch';
import './result.css';

interface Props {
  fortune: DailyFortune;
  onShare: () => void;
  onHome: () => void;
}

/** 今日运势详情页（指导书 §7.4）——设计稿 isFortune 屏，逐字段还原。 */
export default function FortuneResult({ fortune, onShare, onHome }: Props) {
  const { hero, weapon, skin, map, main, advice } = fortune;

  const agent = agentByRawId(hero.id);
  const roleName = agent ? AGENT_ROLES.find((r) => r.id === agent.role)?.name : undefined;

  return (
    <main className="result">
      <div className="result-inner">
        <header className="result-head">
          <span>今日运势</span>
          <span className="result-date">{formatDateShortCN(new Date())}</span>
        </header>

        <div className="result-scroll">
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
              {agent && (
                <img
                  className="hero-card-img"
                  src={agentBustUrl(agent.id)}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                />
              )}
              <div className="hero-card-info">
                {roleName && <div className="hero-card-role">{roleName}型</div>}
                <div className="hero-card-name">{agent?.name ?? hero.id}</div>
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
          </section>

          {/* 幸运武器 + 幸运地图 */}
          <div className="result-duo">
            <section className="duo-card">
              <div className="duo-label">幸运武器</div>
              <div className="duo-name">{extractCN(weaponName(weapon.id))}</div>
              <div className="duo-stars" aria-label={`${weapon.stars} 星`}>
                {'★'.repeat(weapon.stars)}
                <span className="duo-stars-off">{'★'.repeat(5 - weapon.stars)}</span>
              </div>
              <p className="duo-note">{weapon.reason}</p>
            </section>
            <section className="duo-card">
              <span className="duo-badge">今日有说法</span>
              <div className="duo-label">幸运地图</div>
              <div className="duo-name">{extractCN(mapName(map.id))}</div>
              <div className="duo-stars" aria-label={`${map.stars} 星`}>
                {'★'.repeat(map.stars)}
                <span className="duo-stars-off">{'★'.repeat(5 - map.stars)}</span>
              </div>
              <p className="duo-note">{map.label}</p>
            </section>
          </div>

          {/* 幸运颜色 + 推荐皮肤 */}
          <section className="skin-block">
            <div className="skin-block-label">幸运颜色</div>
            <div className="skin-color-row">
              <div className="skin-color-swatch" style={{ background: colorSwatchHex(skin.color) }} aria-hidden="true" />
              <div>
                <div className="skin-color-name">{skin.color}</div>
                <p className="skin-color-note">{skin.blurb}</p>
              </div>
            </div>

            <div className="skin-divider" />
            <div className="skin-block-label">推荐皮肤</div>
            <div className="skin-list">
              {skin.skins.map((name) => (
                <div key={name} className="skin-item-name">
                  {name}
                </div>
              ))}
            </div>
            <p className="skin-item-note">今日契合 {skin.match}%</p>
          </section>

          {/* 今日忌 */}
          <section className="advice-block">
            <div className="advice-block-label">今日忌</div>
            <div className="advice-block-keyword">{main.bad}</div>
            <p className="advice-block-note">{advice.note}</p>
          </section>
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
      </div>
    </main>
  );
}
