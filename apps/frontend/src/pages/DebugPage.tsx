import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ZAxis,
} from 'recharts';
import { useAppStore } from '../store/useAppStore';
import SearchBar from '../components/search/SearchBar';
import Tooltip2 from '../components/ui/Tooltip';
import type { DebugResult } from '../types';
import { HelpCircle, Info, Trophy, TrendingUp, FlaskConical } from 'lucide-react';
import { Badge } from '../components/ui/badge';

const SCATTER_COLORS = ['#00d2ef', '#f6339a', '#10b889', '#ef4444', '#fbbf24', '#f97316'];

const ScoreVsPositionChart = ({ data }: { data: DebugResult[] }) => {
  if (!data.length) return null;

  const chartData = data.map((row) => ({
    x: row.avgPosition,
    y: row.computedScore,
    z: row.clickCount,
    name: row.itemName || row.itemId,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <ScatterChart margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="x"
          type="number"
          name="Avg Position"
          tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
          axisLine={false}
          tickLine={false}
          label={{ value: 'Avg Position', position: 'insideBottom', offset: -4, fontSize: 10, fill: 'var(--text-muted)' }}
        />
        <YAxis
          dataKey="y"
          type="number"
          name="Score"
          tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
          axisLine={false}
          tickLine={false}
        />
        <ZAxis dataKey="z" range={[50, 180]} />
        <Tooltip
          cursor={{ strokeDasharray: '3 3', stroke: 'var(--primary)' }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const point = payload[0].payload;
            return (
              <div className="px-4 py-3 rounded-xl text-sm bg-elevated border shadow-lg">
                <div className="font-bold mb-2 text-primary-light">{point.name}</div>
                <div className="text-muted text-xs">
                  Avg Position: <span className="font-bold text-primary">{point.x}</span>
                </div>
                <div className="text-muted text-xs">
                  Score: <span className="font-bold text-secondary">{Number(point.y).toFixed(4)}</span>
                </div>
                <div className="text-muted text-xs">
                  Clicks: <span className="font-bold text-accent-pink">{point.z}</span>
                </div>
              </div>
            );
          }}
        />
        <Scatter data={chartData}>
          {chartData.map((_, idx) => <Cell key={idx} fill={SCATTER_COLORS[idx % SCATTER_COLORS.length]} />)}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
};

const ExplainabilityCard = ({ item, rank }: { item: DebugResult; rank: number }) => {
  const positionBias = 1 / (Math.log2(item.avgPosition + 1) || 1);
  const recomputed = item.clickCount * positionBias;
  const isTopRanked = rank === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card flex flex-col gap-4 p-5 ${
        isTopRanked ? 'border-[rgba(245,158,11,0.3)] shadow-[0_0_30px_rgba(245,158,11,0.1)]' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            {isTopRanked && <Trophy size={16} className="text-accent-yellow" />}
            <span className="font-bold text-sm">{item.itemName || item.itemId}</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            {item.category && <Badge variant="primary">{item.category}</Badge>}
            <span className="text-xs text-muted">Rank #{rank}</span>
          </div>
        </div>
        <span className="text-2xl font-bold font-mono text-primary-light">
          {recomputed.toFixed(4)}
        </span>
      </div>

      <div className="p-3 rounded-xl font-mono text-xs bg-elevated border">
        <span className="text-muted">score = </span>
        <span className="text-primary-light">count × (1 / log₂(avgPosition + 1))</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-xl bg-surface border">
          <div className="font-mono font-bold text-base text-primary">{item.clickCount}</div>
          <div className="text-[10px] mt-1 text-muted">click count</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-surface border">
          <div className="font-mono font-bold text-base text-accent-pink">{item.avgPosition.toFixed(2)}</div>
          <div className="text-[10px] mt-1 text-muted">avg position</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-surface border">
          <div className="font-mono font-bold text-base text-secondary">{positionBias.toFixed(3)}</div>
          <div className="text-[10px] mt-1 text-muted">position bias</div>
        </div>
      </div>
    </motion.div>
  );
};

export default function DebugPage() {
  const { debugResults, isDebugging, performDebug, debugQuery, scoringFormula } = useAppStore();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const topRanked = useMemo(() => debugResults[0], [debugResults]);

  return (
    <div className="p-8 flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-primary">
            <FlaskConical size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Debug Console</h2>
          </div>
        </div>
        <p className="text-sm ml-[52px] text-muted">
          Inspect score mechanics and explain why items rank where they do
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-2xl">
          <SearchBar onSearch={performDebug} isLoading={isDebugging} initialValue={debugQuery} />
        </div>
        <Tooltip2
          position="right"
          content={
            <div className="flex flex-col gap-2 p-1">
              <div className="font-bold text-sm pb-2 border-b">Scoring Formula</div>
              <code className="block px-3 py-2 rounded-lg text-xs bg-surface text-primary border shadow-inner">
                {scoringFormula}
              </code>
              <p className="text-muted text-[11px]">
                Higher click count improves score, while deeper average positions reduce the position-bias weight.
              </p>
            </div>
          }
        >
          <button className="btn-ghost btn-icon p-2.5">
            <HelpCircle size={18} />
          </button>
        </Tooltip2>
      </div>

      <AnimatePresence mode="wait">
        {debugResults.length > 0 && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-6">
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-5">
                <Info size={16} className="text-primary-light" />
                <div>
                  <h3 className="text-sm font-bold">Score vs Avg Position</h3>
                  <p className="text-xs text-muted">
                    Bubble size = click count. Higher score with lower position tends to rank better.
                  </p>
                </div>
              </div>
              <ScoreVsPositionChart data={debugResults} />
            </div>

            {topRanked && (
              <div className="card p-5">
                <h3 className="text-sm font-bold mb-3">Why is this ranked #1?</h3>
                <div className="flex items-start gap-3 p-4 rounded-xl text-sm bg-[rgba(245,158,11,0.05)] border border-[rgba(245,158,11,0.15)]">
                  <TrendingUp size={16} className="text-accent-yellow mt-0.5 shrink-0" />
                  <span className="text-accent-yellow">
                    {topRanked.itemName || topRanked.itemId} leads because its current computed score is highest.
                    It combines click count {topRanked.clickCount} with average position {topRanked.avgPosition.toFixed(2)} using the formula {scoringFormula}.
                  </span>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-bold mb-4">Item Scoring Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {debugResults.map((item, idx) => (
                  <ExplainabilityCard key={item.itemId} item={item} rank={idx + 1} />
                ))}
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between border-b">
                <h3 className="text-sm font-bold">Raw Debug Data</h3>
                <span className="text-xs text-muted">from /api/search/debug</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      {['Rank', 'Item ID', 'Click Count', 'Avg Position', 'Computed Score'].map((header) => (
                        <th key={header} className="px-5 py-3 text-left font-semibold text-xs text-muted">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {debugResults.map((row, index) => (
                      <tr
                        key={row.itemId}
                        onClick={() => setSelectedItemId((prev) => prev === row.itemId ? null : row.itemId)}
                        className={`border-b cursor-pointer transition-colors ${
                          selectedItemId === row.itemId ? 'bg-[rgba(94,106,210,0.05)]' : 'bg-transparent hover:bg-hover'
                        }`}
                      >
                        <td className={`px-5 py-4 font-mono ${index === 0 ? 'text-accent-yellow' : 'text-muted'}`}>#{index + 1}</td>
                        <td className="px-5 py-4 font-mono text-secondary">{row.itemId}</td>
                        <td className="px-5 py-4 font-mono text-primary">{row.clickCount}</td>
                        <td className="px-5 py-4 font-mono text-accent-pink">{row.avgPosition.toFixed(4)}</td>
                        <td className="px-5 py-4 font-mono font-bold text-primary-light">{row.computedScore.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {!isDebugging && debugResults.length === 0 && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-28">
            <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center text-3xl bg-surface border">
              🔬
            </div>
            <h3 className="text-xl font-bold mb-2">Debug a query</h3>
            <p className="text-sm max-w-md mx-auto text-muted">
              Enter a query above to inspect click count, average position, and score explanation
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
