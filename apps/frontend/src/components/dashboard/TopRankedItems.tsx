import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowUp, Minus, TrendingUp } from 'lucide-react';
import { useIntersectionObserver } from '../../hooks/useAnimations';

export interface RankedItem {
  id: string;
  title: string;
  rank: number;
  previousRank: number;
  ctr: number;
}

interface TopRankedItemsProps {
  items: RankedItem[];
}

function rankDelta(rank: number, previousRank: number) {
  return previousRank - rank;
}

export default function TopRankedItems({ items }: TopRankedItemsProps) {
  const { ref, hasIntersected } = useIntersectionObserver({ threshold: 0.1 });
  const sorted = [...items].sort((a, b) => a.rank - b.rank);

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, y: 20 }}
      animate={hasIntersected ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="p-6"
    >
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[rgba(236,72,153,0.1)]">
            <TrendingUp size={18} className="text-secondary" />
          </div>
          <h3 className="text-base font-semibold text-primary">Top Ranked Items</h3>
        </div>
        <p className="text-xs mt-1 ml-12 text-muted">
          Real-time order shifts with smooth motion
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <AnimatePresence>
          {sorted.map((item, index) => {
            const delta = rankDelta(item.rank, item.previousRank);

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={hasIntersected ? { opacity: 1, y: 0, scale: 1 } : {}}
                exit={{ opacity: 0, y: -12, scale: 0.95 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 30,
                  delay: index * 0.05,
                }}
                whileHover={{
                  scale: 1.02,
                  transition: { duration: 0.2 },
                }}
                className={`flex items-center justify-between rounded-2xl p-3 cursor-pointer bg-elevated border hover:shadow-md transition-shadow ${
                  delta > 0 ? 'border-[rgba(16,185,129,0.3)]' : delta < 0 ? 'border-[rgba(236,72,153,0.3)]' : 'border-subtle'
                }`}
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold relative ${
                      item.rank === 1 ? 'bg-[rgba(245,158,11,0.2)] text-accent-yellow' : item.rank === 2 ? 'bg-hover text-white' : item.rank === 3 ? 'bg-[rgba(236,72,153,0.2)] text-accent-pink' : 'bg-hover text-muted'
                    }`}
                    whileHover={{ scale: 1.1 }}
                  >
                    #{item.rank}
                    {item.rank <= 3 && (
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-transparent"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                  <div>
                    <p className="text-sm font-semibold text-primary">{item.title}</p>
                    <p className="text-xs text-muted mt-0.5">
                      CTR {item.ctr.toFixed(2)}%
                    </p>
                  </div>
                </div>

                <motion.div
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold border ${
                    delta > 0
                      ? 'bg-[rgba(16,185,129,0.1)] text-secondary border-[rgba(16,185,129,0.3)]'
                      : delta < 0
                        ? 'bg-[rgba(236,72,153,0.1)] text-accent-pink border-[rgba(236,72,153,0.3)]'
                        : 'bg-hover text-muted border-subtle'
                  }`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={hasIntersected ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: index * 0.05 + 0.2 }}
                >
                  {delta > 0 ? <ArrowUp size={11} /> : null}
                  {delta < 0 ? <ArrowDown size={11} /> : null}
                  {delta === 0 ? <Minus size={11} /> : null}
                  {delta === 0 ? 'Stable' : `${Math.abs(delta)} rank`}
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
