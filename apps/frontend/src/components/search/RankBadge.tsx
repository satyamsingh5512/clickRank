import { motion } from 'framer-motion';
import { useIntersectionObserver } from '../../hooks/useAnimations';

interface RankBadgeProps {
  rank: number;
  previousRank?: number;
  size?: 'sm' | 'md' | 'lg';
}

const rankColors: Record<number, { bg: string; color: string; shadow: string; gradient: string }> = {
  1: {
    bg: 'var(--accent-yellow)',
    color: '#f59e0b',
    shadow: '0 0 16px var(--accent-yellow)',
    gradient: 'var(--accent-yellow))',
  },
  2: {
    bg: 'var(--bg-elevated)',
    color: '#9ca3af',
    shadow: 'var(--shadow-sm)',
    gradient: 'var(--border-default)',
  },
  3: {
    bg: 'var(--accent-orange)',
    color: '#b45309',
    shadow: 'var(--shadow-sm)',
    gradient: 'var(--accent-orange)',
  },
};

const sizeMap = {
  sm: { w: 'w-7 h-7', text: 'text-xs', badge: 'text-[10px]' },
  md: { w: 'w-9 h-9', text: 'text-sm', badge: 'text-xs' },
  lg: { w: 'w-11 h-11', text: 'text-base', badge: 'text-sm' },
};

export default function RankBadge({ rank, previousRank, size = 'md' }: RankBadgeProps) {
  const { ref, hasIntersected } = useIntersectionObserver({ threshold: 0.5 });
  const style = rankColors[rank] ?? {
    bg: 'var(--primary-subtle)',
    color: 'var(--text-secondary)',
    shadow: 'none',
    gradient: 'var(--bg-elevated)',
  };
  const sz = sizeMap[size];

  const rankDelta = previousRank !== undefined ? previousRank - rank : 0;
  const isRising = rankDelta > 0;
  const isFalling = rankDelta < 0;

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      className="flex flex-col items-center gap-0.5"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={hasIntersected ? { opacity: 1, scale: 1 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <motion.div
        className={`${sz.w} rounded-full flex items-center justify-center ${sz.text} font-bold font-mono relative overflow-hidden`}
        style={{
          background: style.gradient,
          color: style.color,
          boxShadow: style.shadow,
          border: `1px solid ${style.color}30`,
        }}
        whileHover={{ scale: 1.1 }}
        animate={rank <= 3 ? {
          boxShadow: [
            style.shadow,
            style.shadow.replace('16px', '24px').replace('0.35', '0.5'),
            style.shadow,
          ],
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <span className="relative z-10">#{rank}</span>
        {rank <= 3 && (
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'transparent',
            }}
          />
        )}
      </motion.div>

      {rankDelta !== 0 && (
        <motion.span
          initial={{ opacity: 0, y: -5 }}
          animate={hasIntersected ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className={`${sz.badge} font-bold flex items-center gap-0.5 ${
            isRising ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {isRising ? (
            <>
              <motion.span
                animate={{ y: [-1, 0, -1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                ↑
              </motion.span>
              {rankDelta}
            </>
          ) : (
            <>
              <motion.span
                animate={{ y: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                ↓
              </motion.span>
              {Math.abs(rankDelta)}
            </>
          )}
        </motion.span>
      )}
    </motion.div>
  );
}
