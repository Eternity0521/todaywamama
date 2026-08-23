import type { Star } from '../../../core/types';
import './components.css';

interface Props {
  value: Star;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

/** 星级展示组件（指导书 §8）：★ 实心 + ☆ 空心，支持逐颗渐显 */
export default function Stars({ value, size = 'md', animate = false }: Props) {
  return (
    <span className={`stars stars-${size}`} aria-label={`${value} 星`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`star ${i <= value ? 'star-on' : 'star-off'}${animate ? ' star-anim' : ''}`}
          style={animate ? { animationDelay: `${(i - 1) * 120}ms` } : undefined}
        >
          ★
        </span>
      ))}
    </span>
  );
}
