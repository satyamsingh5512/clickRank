import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';
import type { TopItem } from '../../types';
import { useIntersectionObserver } from '../../hooks/useAnimations';

interface TopItemsChartProps { items: TopItem[] }

const COLORS = ['#5E6AD2', '#7E89F0', '#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8b5cf6'];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: TopItem }[] }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="px-4 py-3 rounded-xl text-sm bg-elevated border shadow-lg"
    >
      <div className="font-bold mb-1 text-primary-light">{d.itemName}</div>
      <div className="text-muted">
        Score: <span className="font-bold text-primary">{d.score.toFixed(1)}</span>
      </div>
      <div className="text-muted">
        Clicks: <span className="font-bold text-secondary">{d.clicks.toLocaleString()}</span>
      </div>
    </motion.div>
  );
};

export default function TopItemsChart({ items }: TopItemsChartProps) {
  const { ref, hasIntersected } = useIntersectionObserver({ threshold: 0.1 });
  const data = items.map(i => ({ ...i, name: i.itemName.split(' ').slice(0, 2).join(' ') }));

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, y: 20 }}
      animate={hasIntersected ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            {COLORS.map((color, idx) => (
              <linearGradient key={idx} id={`barGradient${idx}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={1} />
                <stop offset="100%" stopColor={color} stopOpacity={0.6} />
              </linearGradient>
            ))}
          </defs>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
          <Bar
            dataKey="score"
            radius={[8, 8, 0, 0]}
            maxBarSize={48}
            isAnimationActive={hasIntersected}
            animationDuration={1000}
            animationEasing="ease-out"
          >
            {data.map((_, idx) => (
              <Cell
                key={idx}
                fill={`url(#barGradient${idx % COLORS.length})`}
                fillOpacity={0.9}
              />
            ))}
            <LabelList
              dataKey="score"
              position="top"
              formatter={(v: any) => Number(v).toFixed(0)}
              style={{ fontSize: 10, fill: 'var(--text-muted)' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
