import type { ReactNode } from 'react';
import './components.css';

interface Props {
  icon: string;
  title: string;
  children: ReactNode;
}

/** 结果页分节卡片（指导书 §7.4） */
export default function SectionCard({ icon, title, children }: Props) {
  return (
    <section className="section-card">
      <h2 className="section-title">
        <span aria-hidden="true">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
