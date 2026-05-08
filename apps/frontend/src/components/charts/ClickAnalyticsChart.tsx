import { AreaChart, Card } from "@tremor/react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { useIntersectionObserver } from "../../hooks/useAnimations";

const now = Date.now();

const clickSeries = Array.from({ length: 24 }, (_, i) => {
  const hour = new Date(now - (23 - i) * 60 * 60 * 1000);
  return {
    hour: hour.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    clicks: 120 + Math.round(Math.sin(i / 2.6) * 26 + Math.random() * 18),
  };
});

export default function ClickAnalyticsChart() {
  const { ref, hasIntersected } = useIntersectionObserver({ threshold: 0.1 });

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, y: 20 }}
      animate={hasIntersected ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--primary-subtle)' }}
            >
              <TrendingUp size={16} style={{ color: 'var(--primary-light)' }} />
            </div>
            <div>
              <h3 className="text-sm font-bold">Clicks</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Last 24 hours</p>
            </div>
          </div>
          <motion.div
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{
              background: 'var(--accent-green)',
              color: 'var(--accent-green)',
              border: '1px solid var(--accent-green)',
            }}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            +12.5%
          </motion.div>
        </div>
        <AreaChart
          className="mt-4 h-64"
          data={clickSeries}
          index="hour"
          categories={["clicks"]}
          colors={["indigo"]}
          valueFormatter={(value: number) => `${value.toLocaleString()} clicks`}
          yAxisWidth={60}
          showAnimation={hasIntersected}
          animationDuration={900}
          showLegend={false}
          curveType="natural"
          style={{
            "--tremor-background-subtle": "var(--bg-surface)",
          } as React.CSSProperties}
        />
      </div>
    </motion.div>
  );
}
