import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Minus, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useIntersectionObserver } from '../../hooks/useAnimations';

export interface RankingItem {
  id: string;
  title: string;
  rank: number;
  previousRank: number;
  ctr: number;
}

interface RankingListProps {
  items: RankingItem[];
}

function rankDelta(rank: number, previousRank: number) {
  return previousRank - rank;
}

export default function RankingList({ items }: RankingListProps) {
  const { ref, hasIntersected } = useIntersectionObserver({ threshold: 0.1 });
  const sorted = [...items].sort((a, b) => a.rank - b.rank);

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, y: 20 }}
      animate={hasIntersected ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card hover glow>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--accent-yellow)' }}
            >
              <Trophy size={16} style={{ color: 'var(--accent-yellow)' }} />
            </div>
            <CardTitle>Live Ranking</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {sorted.map((item, index) => {
            const delta = rankDelta(item.rank, item.previousRank);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={hasIntersected ? { opacity: 1, x: 0 } : {}}
                transition={{
                  duration: 0.3,
                  delay: index * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
                whileHover={{
                  scale: 1.01,
                  transition: { duration: 0.15 },
                }}
                className="flex items-center justify-between rounded-xl p-4 cursor-pointer"
                style={{
                  background: 'var(--bg-surface)',
                  border: `1px solid ${
                    delta > 0
                      ? 'var(--accent-green)'
                      : delta < 0
                        ? 'var(--accent-red)'
                        : 'var(--border-subtle)'
                  }`,
                }}
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold relative overflow-hidden"
                    style={{
                      background:
                        item.rank === 1
                          ? 'var(--accent-yellow))'
                          : item.rank === 2
                            ? 'var(--bg-elevated))'
                            : item.rank === 3
                              ? 'var(--accent-orange))'
                              : 'var(--bg-elevated)',
                      color:
                        item.rank <= 3
                          ? item.rank === 1
                            ? '#fbbf24'
                            : item.rank === 2
                              ? '#94a3b8'
                              : '#f97316'
                          : 'var(--text-muted)',
                    }}
                    whileHover={{ scale: 1.05 }}
                  >
                    #{item.rank}
                    {item.rank <= 3 && (
                      <div
                        className="absolute inset-0 rounded-xl opacity-30"
                        style={{
                          background: 'transparent',
                        }}
                      />
                    )}
                  </motion.div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {item.title}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      CTR {item.ctr.toFixed(2)}%
                    </p>
                  </div>
                </div>

                <motion.div
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={hasIntersected ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: index * 0.05 + 0.2 }}
                  style={
                    delta > 0
                      ? {
                          background: 'var(--accent-green)',
                          color: 'var(--accent-green)',
                          border: '1px solid var(--accent-green)',
                        }
                      : delta < 0
                        ? {
                            background: 'var(--accent-red)',
                            color: 'var(--accent-red)',
                            border: '1px solid var(--accent-red)',
                          }
                        : {
                            background: 'var(--bg-elevated)',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border-subtle)',
                          }
                  }
                >
                  {delta > 0 ? <ArrowUp size={12} /> : null}
                  {delta < 0 ? <ArrowDown size={12} /> : null}
                  {delta === 0 ? <Minus size={12} /> : null}
                  {delta === 0 ? 'No change' : `${Math.abs(delta)} rank`}
                </motion.div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
}
