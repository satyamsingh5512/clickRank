import { motion } from 'framer-motion';
import type { TopQuery } from '../../types';
import { TrendingUp, TrendingDown, Search } from 'lucide-react';
import { useIntersectionObserver } from '../../hooks/useAnimations';

interface TopQueriesTableProps { queries: TopQuery[] }

export default function TopQueriesTable({ queries }: TopQueriesTableProps) {
  const { ref, hasIntersected } = useIntersectionObserver({ threshold: 0.1 });
  const max = Math.max(...queries.map(q => q.count));

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, y: 20 }}
      animate={hasIntersected ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-2"
    >
      {queries.map((q, i) => (
        <motion.div
          key={q.query}
          initial={{ opacity: 0, x: -20, scale: 0.95 }}
          animate={hasIntersected ? { opacity: 1, x: 0, scale: 1 } : {}}
          transition={{
            delay: i * 0.06,
            duration: 0.3,
            ease: [0.16, 1, 0.3, 1],
          }}
          whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
          className="relative flex items-center rounded-xl overflow-hidden cursor-pointer bg-elevated border hover:border-strong transition-colors"
        >
          <motion.div
            className={`absolute top-0 bottom-0 left-0 rounded-xl ${
              q.growth >= 0 ? 'bg-[rgba(94,106,210,0.15)]' : 'bg-[rgba(236,72,153,0.15)]'
            }`}
            initial={{ width: 0 }}
            animate={hasIntersected ? { width: `${(q.count / max) * 100}%` } : {}}
            transition={{ delay: i * 0.06 + 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />

          <div className="relative flex items-center gap-4 w-full px-4 py-3">
            <motion.div
              className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                i === 0
                  ? 'bg-[rgba(245,158,11,0.2)] text-accent-yellow'
                  : i === 1
                    ? 'bg-hover text-white'
                    : i === 2
                      ? 'bg-[rgba(236,72,153,0.2)] text-accent-pink'
                      : 'bg-hover text-muted'
              }`}
              whileHover={{ scale: 1.1 }}
            >
              #{i + 1}
            </motion.div>

            <div className="w-5 h-5 rounded-md flex items-center justify-center bg-hover shrink-0">
              <Search size={11} className="text-muted" />
            </div>

            <span className="flex-1 text-sm font-medium text-primary">
              {q.query}
            </span>

            <span className="text-sm font-mono font-bold text-secondary">
              {q.count.toLocaleString()}
            </span>

            <motion.div
              className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg border ${
                q.growth >= 0 
                  ? 'bg-[rgba(16,185,129,0.1)] border-[rgba(16,185,129,0.2)] text-secondary' 
                  : 'bg-[rgba(236,72,153,0.1)] border-[rgba(236,72,153,0.2)] text-accent-pink'
              }`}
            >
              {q.growth >= 0 ? (
                <motion.div
                  animate={{ y: [-1, 0, -1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <TrendingUp size={12} />
                </motion.div>
              ) : (
                <motion.div
                  animate={{ y: [1, 0, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <TrendingDown size={12} />
                </motion.div>
              )}
              {Math.abs(q.growth)}%
            </motion.div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
