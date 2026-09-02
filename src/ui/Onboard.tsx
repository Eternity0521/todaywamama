import { useState } from 'react';
import { AGENT_POOL, AGENT_ROLES, type AgentRole } from '../../core/content/agents';
import { agentImageUrl } from './agentAssets';
import type { Profile } from '../profileStorage';
import './onboard.css';

interface Props {
  profile: Profile;
  onFinish: (profile: Profile) => void;
  onSkip?: () => void;
  /** 'onboard'（首次见面，默认）｜ 'edit'（首页「我的设定」进来的重新编辑，去掉标题和跳过） */
  mode?: 'onboard' | 'edit';
}

/** 「初次见面 · 先认识一下」页 / 「我的设定」编辑页（设计稿 isOnboard 屏，逐字段还原） */
export default function Onboard({ profile, onFinish, onSkip, mode = 'onboard' }: Props) {
  const [nick, setNick] = useState(profile.nick);
  const [role, setRole] = useState<AgentRole | null>((profile.role as AgentRole) ?? null);
  const [agents, setAgents] = useState<string[]>(profile.agents);

  function toggleRole(id: AgentRole) {
    setRole((r) => (r === id ? null : id));
  }

  function toggleAgent(id: string) {
    setAgents((a) => (a.includes(id) ? a.filter((x) => x !== id) : a.concat(id)));
  }

  function finish() {
    onFinish({ onboarded: true, nick, role, agents });
  }

  const visibleAgents = role ? AGENT_POOL.filter((a) => a.role === role) : AGENT_POOL;

  return (
    <main className="onboard">
      <div className="onboard-inner">
        {mode === 'onboard' && (
          <header className="onboard-head">
            <div className="onboard-kicker">初次见面</div>
            <h1 className="onboard-title">先认识一下</h1>
          </header>
        )}

        <div className="onboard-field" style={mode === 'edit' ? { marginTop: 0 } : undefined}>
          <div className="onboard-label">你的昵称</div>
          <input
            className="onboard-input"
            value={nick}
            onChange={(e) => setNick(e.target.value.slice(0, 12))}
            placeholder="随便写，占卜看的是心意"
          />
        </div>

        <div className="onboard-body">
          <div className="onboard-label">你常打的位置</div>
          <div className="onboard-roles">
            {AGENT_ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`onboard-role${role === r.id ? ' is-on' : ''}`}
                onClick={() => toggleRole(r.id)}
              >
                {r.name}
              </button>
            ))}
          </div>

          <div className="onboard-label onboard-label-agents">你常用的英雄</div>
          <div className="onboard-agents">
            {visibleAgents.map((a) => {
              const on = agents.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  className={`onboard-agent${on ? ' is-on' : ''}`}
                  onClick={() => toggleAgent(a.id)}
                >
                  <span className="onboard-agent-thumb">
                    <img src={agentImageUrl(a.id)} alt="" draggable={false} />
                  </span>
                  <span className="onboard-agent-name">{a.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="onboard-actions">
          <button className="onboard-cta" type="button" onClick={finish}>
            <span>{mode === 'edit' ? '保存' : '开始占卜'}</span>
            <span className="onboard-cta-arrow">→</span>
          </button>
          {mode === 'onboard' && (
            <button className="onboard-skip" type="button" onClick={onSkip}>
              随缘，先跳过
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
