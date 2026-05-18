import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { useIntersectionObserver } from '../../hooks/useAnimations';

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  color?: string;
  delta?: number;
  animate?: boolean;
  delay?: number;
}

export default function MetricCard({
  label,
  value,
  sub,
  icon,
  color = 'var(--primary-light)',
  delta,
  animate = true,
  delay = 0,
}: MetricCardProps) {
  const { ref, hasIntersected } = useIntersectionObserver({ threshold: 0.2 });
  const Comp = animate ? motion.div : 'div';
  const animProps = animate
    ? {
        initial: { opacity: 0, y: 20 },
        animate: hasIntersected ? { opacity: 1, y: 0 } : {},
        transition: { duration: 0.4, delay: delay * 0.1, ease: [0.16, 1, 0.3, 1] as const },
      }
    : {};

  return (
    <Comp
      ref={ref as React.RefObject<HTMLDivElement>}
      {...animProps}
      className="card p-5 flex flex-col gap-3 relative overflow-hidden"
    >
      <motion.div
        className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-5"
        style={{
          background: color,
          filter: 'blur(30px)',
        }}
        animate={hasIntersected ? {
          opacity: [0.05, 0.08, 0.05],
          scale: [1, 1.1, 1],
        } : {}}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <div className="flex items-start justify-between relative">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
        {icon && (
          <motion.div
            className="flex items-center justify-center rounded-xl"
            style={{
              width: 40, height: 40,
              background: `${color}12`,
              border: `1px solid ${color}20`,
            }}
            whileHover={{ scale: 1.05, borderColor: `${color}30` }}
          >
            <span style={{ color }}>{icon}</span>
          </motion.div>
        )}
      </div>

      <motion.div
        className="flex items-end gap-3"
        initial={animate ? { opacity: 0 } : {}}
        animate={hasIntersected ? { opacity: 1 } : {}}
        transition={{ duration: 0.3, delay: delay * 0.1 + 0.1 }}
      >
        <span className="text-3xl font-bold tracking-tight" style={{ color }}>
          {value}
        </span>
        {delta !== undefined && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={hasIntersected ? { opacity: 1, scale: 1 } : {}}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`flex items-center gap-0.5 text-xs font-bold mb-1 px-2 py-1 rounded-lg ${
              delta >= 0 ? 'badge-green' : 'badge-red'
            }`}
          >
            {delta >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {Math.abs(delta)}%
          </motion.span>
        )}
      </motion.div>

      {sub && (
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {sub}
        </span>
      )}
    </Comp>
  );
}
