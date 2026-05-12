import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Zap, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { SearchResult } from '../../types';
import { Badge } from '../ui/badge';
import { useIntersectionObserver } from '../../hooks/useAnimations';

interface ResultCardProps {
  result: SearchResult;
  index: number;
  onClickItem: (result: SearchResult) => void;
}

const categoryColors: Record<string, string> = {
  Electronics: 'primary',
  Footwear: 'sky',
  Clothing: 'green',
  'Home Appliances': 'orange',
  default: 'violet',
} as const;

function RankBadge({ rank, index = 0 }: { rank: number; previousRank?: number; index?: number }) {
  const { ref, hasIntersected } = useIntersectionObserver({ threshold: 0.5 });
  const getRankStyle = () => {
    if (rank === 1) return {
      bg: 'bg-[rgba(245,158,11,0.15)]',
      border: 'border-[rgba(245,158,11,0.3)]',
      text: 'text-accent-yellow',
      shadow: 'shadow-[0_2px_16px_rgba(245,158,11,0.2)]',
      emoji: '🥇',
    };
    if (rank === 2) return {
      bg: 'bg-elevated',
      border: 'border',
      text: 'text-primary',
      shadow: 'shadow-[0_2px_16px_rgba(255,255,255,0.05)]',
      emoji: '🥈',
    };
    if (rank === 3) return {
      bg: 'bg-[rgba(236,72,153,0.15)]',
      border: 'border-[rgba(236,72,153,0.3)]',
      text: 'text-accent-pink',
      shadow: 'shadow-[0_2px_16px_rgba(236,72,153,0.2)]',
      emoji: '🥉',
    };
    return {
      bg: 'bg-surface',
      border: 'border',
      text: 'text-muted',
      shadow: '',
      emoji: null,
    };
  };

  const style = getRankStyle();

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={hasIntersected ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.3, delay: index * 0.05, type: 'spring', stiffness: 400, damping: 25 }}
      className={`shrink-0 flex items-center justify-center rounded-2xl font-bold relative w-12 h-12 ${style.bg} ${style.border} ${style.text} ${style.shadow} ${rank <= 3 ? 'text-xl' : 'text-base'}`}
      whileHover={{ scale: 1.05 }}
    >
      {rank <= 3 ? (
        <motion.span
          initial={{ rotate: -10, opacity: 0 }}
          animate={hasIntersected ? { rotate: 0, opacity: 1 } : {}}
          transition={{ delay: index * 0.05 + 0.2, type: 'spring', stiffness: 400 }}
        >
          {style.emoji}
        </motion.span>
      ) : (
        <span className="font-mono">#{rank}</span>
      )}

      {rank <= 3 && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-transparent"
          animate={hasIntersected ? {
            opacity: [0.3, 0.6, 0.3],
          } : {}}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </motion.div>
  );
}

function RankChange({ rank, previousRank }: { rank: number; previousRank?: number }) {
  if (!previousRank) return null;
  const diff = previousRank - rank;

  if (diff === 0) {
    return (
      <motion.span
        initial={{ opacity: 0, x: -5 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-1 text-xs text-muted"
      >
        <Minus size={12} /> 0
      </motion.span>
    );
  }

  const isUp = diff > 0;
  return (
    <motion.span
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-1 text-xs font-semibold ${isUp ? 'text-secondary' : 'text-accent-pink'}`}
    >
      {isUp ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
      {Math.abs(diff)}
    </motion.span>
  );
}

export default function ResultCard({ result, index, onClickItem }: ResultCardProps) {
  const { ref, hasIntersected } = useIntersectionObserver({ threshold: 0.1 });
  const catColor = result.category ? (categoryColors[result.category] || categoryColors.default) : categoryColors.default;
  const prevRank = result.previousRank;
  const isRising = prevRank !== undefined && prevRank > result.rank;
  const isFalling = prevRank !== undefined && prevRank < result.rank;
  const estimatedClicks = Math.max(1, Math.round(result.score * 12));
  const estimatedPosition = Math.max(1, result.rank);

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      layoutId={result.itemId}
      initial={{ opacity: 0, y: 24 }}
      animate={hasIntersected ? { opacity: 1, y: 0 } : {}}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
      onClick={() => onClickItem(result)}
      className={`relative overflow-hidden rounded-2xl p-4 cursor-pointer transition-all duration-200 border bg-surface hover:bg-elevated hover:shadow-lg ${
        isRising ? 'border-[rgba(16,185,129,0.3)]' : isFalling ? 'border-[rgba(236,72,153,0.3)]' : 'border-subtle'
      }`}
    >
      <AnimatePresence>
        {isRising && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.05 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none bg-secondary"
          />
        )}
        {isFalling && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.05 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none bg-accent-pink"
          />
        )}
      </AnimatePresence>

      <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-10 pointer-events-none blur-3xl ${
        isRising ? 'bg-secondary' : isFalling ? 'bg-accent-pink' : 'bg-primary'
      }`} />

      <div className="flex items-center gap-4 relative">
        <RankBadge rank={result.rank} previousRank={result.previousRank} index={index} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <motion.span
              className="font-semibold text-base text-primary hover:text-primary-light"
            >
              {result.itemName}
            </motion.span>
            {result.trending && (
              <Badge variant="yellow" glow>
                <TrendingUp size={12} /> Trending
              </Badge>
            )}
            {result.highEngagement && (
              <Badge variant="sky" glow>
                <Zap size={12} /> High Engagement
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {result.category && (
              <Badge variant={catColor as any}>
                {result.category}
              </Badge>
            )}
            <span className="text-xs text-muted">
              {estimatedClicks.toLocaleString()} est clicks
            </span>
            <span className="text-xs text-muted">
              avg pos ~{estimatedPosition}
            </span>
            <RankChange rank={result.rank} previousRank={result.previousRank} />
          </div>
        </div>

        <motion.div
          className="text-right shrink-0"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={hasIntersected ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: index * 0.05 + 0.2 }}
        >
          <div className="text-2xl font-bold font-mono text-primary-light">
            {result.score.toFixed(1)}
          </div>
          <div className="text-[10px] uppercase tracking-wider font-semibold text-dim">
            score
          </div>
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-0 left-0 h-0.5 rounded-full opacity-70"
        style={{ background: 'var(--gradient-primary)' }}
        initial={{ width: 0 }}
        animate={hasIntersected ? { width: `${Math.min(100, result.score * 5)}%` } : {}}
        transition={{ duration: 0.8, delay: index * 0.05 + 0.3, ease: [0.16, 1, 0.3, 1] }}
      />
    </motion.div>
  );
}
