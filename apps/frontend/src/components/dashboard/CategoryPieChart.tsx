import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import type { CategoryData } from '../../types';
import { useIntersectionObserver } from '../../hooks/useAnimations';

interface CategoryPieChartProps { data: CategoryData[] }

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: CategoryData }[] }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="px-4 py-3 rounded-xl text-sm bg-elevated border shadow-lg"
    >
      <div className="font-bold mb-1" style={{ color: d.payload.color }}>{d.name}</div>
      <div className="text-muted">
        Share: <span className="font-bold text-primary-light">{d.value}%</span>
      </div>
    </motion.div>
  );
};

export default function CategoryPieChart({ data }: CategoryPieChartProps) {
  const { ref, hasIntersected } = useIntersectionObserver({ threshold: 0.1 });

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, y: 20 }}
      animate={hasIntersected ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <defs>
            {data.map((entry, idx) => (
              <linearGradient key={idx} id={`pieGradient${idx}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={4}
            dataKey="value"
            isAnimationActive={hasIntersected}
            animationBegin={0}
            animationDuration={1200}
            animationEasing="ease-out"
          >
            {data.map((entry, idx) => (
              <Cell
                key={idx}
                fill={`url(#pieGradient${idx})`}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-[11px] text-muted">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
