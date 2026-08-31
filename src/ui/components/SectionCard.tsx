import type { ReactNode } from 'react';
import './components.css';

interface Props {
  title: string;
  children: ReactNode;
}

/** 结果页分节卡片（指导书 §7.4）——设计稿小标签标题，无图标 */
export default function SectionCard({ title, children }: Props) {
  return (
    <section className="section-card">
      <h2 className="section-title">{title}</h2>
      {children}
    </section>
  );
}
