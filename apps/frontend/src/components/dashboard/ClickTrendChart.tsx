import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import type { TrendPoint } from '../../types';
import { useIntersectionObserver } from '../../hooks/useAnimations';

interface ClickTrendChartProps { data: TrendPoint[] }

const CustomTooltip = ({
  active,
  payload,
  label
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="px-4 py-3 rounded-xl text-sm"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="mb-2 font-semibold" style={{ color: 'var(--text-muted)' }}>{label}</div>
      {payload.map(p => (
        <div
          key={p.name}
          className="flex items-center gap-2"
          style={{ color: p.color }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{p.name}:</span>
          <span className="font-bold">{p.value}</span>
        </div>
      ))}
    </motion.div>
  );
};

export default function ClickTrendChart({ data }: ClickTrendChartProps) {
  const { ref, hasIntersected } = useIntersectionObserver({ threshold: 0.1 });

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, y: 20 }}
      animate={hasIntersected ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="searchesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              fontSize: 11,
              color: 'var(--text-muted)',
              paddingTop: 6,
            }}
          />
          <Line
            type="monotone"
            dataKey="clicks"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={false}
            activeDot={{
              r: 6,
              strokeWidth: 0,
              fill: '#6366f1',
            }}
            isAnimationActive={hasIntersected}
            animationDuration={1500}
            animationEasing="ease-out"
          />
          <Line
            type="monotone"
            dataKey="searches"
            stroke="#14b8a6"
            strokeWidth={2.5}
            dot={false}
            activeDot={{
              r: 6,
              strokeWidth: 0,
              fill: '#14b8a6',
            }}
            isAnimationActive={hasIntersected}
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
