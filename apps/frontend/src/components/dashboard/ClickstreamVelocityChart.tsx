import { AreaChart, type CustomTooltipProps } from '@tremor/react';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import type { TrendPoint } from '../../types';
import { useIntersectionObserver } from '../../hooks/useAnimations';
import { Activity } from 'lucide-react';

interface ClickstreamVelocityChartProps {
  data: TrendPoint[];
}

export default function ClickstreamVelocityChart({ data }: ClickstreamVelocityChartProps) {
  const { ref, hasIntersected } = useIntersectionObserver({ threshold: 0.1 });
  const chartData = useMemo(
    () =>
      data.map((point) => ({
        time: point.time,
        velocity: point.clicks,
      })),
    [data],
  );

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, y: 20 }}
      animate={hasIntersected ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[rgba(94,106,210,0.1)]">
            <Activity size={18} className="text-primary-light" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-primary">Clickstream Velocity</h3>
            <p className="text-xs mt-1 text-muted">
              Events throughput over time
            </p>
          </div>
        </div>
        <motion.div
          className="px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-[rgba(94,106,210,0.1)] text-primary-light border border-[rgba(94,106,210,0.3)]"
          animate={{ scale: [1, 1.05, 1], boxShadow: ['0 0 0 rgba(94,106,210,0)', '0 0 15px rgba(94,106,210,0.3)', '0 0 0 rgba(94,106,210,0)'] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Live
        </motion.div>
      </div>

      <div className="h-[300px]">
        <AreaChart
          className="h-full"
          data={chartData}
          index="time"
          categories={["velocity"]}
          colors={["indigo"]}
          showLegend={false}
          showAnimation={hasIntersected}
          animationDuration={900}
          curveType="natural"
          yAxisWidth={60}
          valueFormatter={(value: number) => `${value.toLocaleString()} events`}
          customTooltip={({ payload, active, label }: CustomTooltipProps) => {
            if (!active || !payload?.length) {
              return null;
            }

            const value = payload[0]?.value;
            const parsedValue = Array.isArray(value) ? value[0] : value;
            const formattedValue = typeof parsedValue === 'number' ? parsedValue.toLocaleString() : String(parsedValue ?? '0');

            return (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.14 }}
                className="px-4 py-3 rounded-xl text-sm bg-elevated border shadow-lg"
              >
                <p className="text-xs mb-1 text-muted">{label}</p>
                <p className="font-bold text-primary-light">{formattedValue} events</p>
              </motion.div>
            );
          }}
        />
      </div>
    </motion.div>
  );
}
