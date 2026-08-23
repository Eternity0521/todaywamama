import type { DailyFortune } from '../../core/types';
import Stars from './components/Stars';
import { formatDateCN } from '../format';
import './home.css';

interface Props {
  today: DailyFortune | null;
  yesterday: DailyFortune | null;
  onStart: () => void;
}

/** 首页「今日瓦运」（指导书 §7.1，PRD §08/§11） */
export default function Home({ today, yesterday, onStart }: Props) {
  const isFirst = !today && !yesterday;

  return (
    <main className="home">
      <header className="home-head">
        <h1 className="brand">今日瓦运</h1>
        <p className="date">{formatDateCN(new Date())}</p>
      </header>

      {isFirst ? (
        <section className="welcome">
          <p className="welcome-slogan">今天这把，有说法。</p>
          <p className="welcome-sub">看看你今天适合：</p>
          <ul className="welcome-list">
            <li>打什么位置</li>
            <li>玩什么英雄</li>
            <li>用什么皮肤</li>
            <li>去哪张地图转运</li>
          </ul>
        </section>
      ) : (
        yesterday && (
          <section className="yesterday">
            <span className="yesterday-label">昨日运势</span>
            <Stars value={yesterday.main.stars} size="sm" />
            <span className="yesterday-keyword">
              昨日关键词：<b>{yesterday.advice.keyword}</b>
            </span>
          </section>
        )
      )}

      <button className="cta" type="button" onClick={onStart}>
        {today ? '查看今日运势' : isFirst ? '开始测今日运势' : '测测今日瓦运'}
      </button>

      <footer className="footer">仅供娱乐 · 非官方产品</footer>
    </main>
  );
}
