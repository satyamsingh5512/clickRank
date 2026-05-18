import { motion } from 'framer-motion';
import { Activity, MousePointerClick, TrendingUp, Users, Workflow } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import CategoryPieChart from '../components/dashboard/CategoryPieChart';
import ClickstreamVelocityChart from '../components/dashboard/ClickstreamVelocityChart';
import TopItemsChart from '../components/dashboard/TopItemsChart';
import TopQueriesTable from '../components/dashboard/TopQueriesTable';
import TopRankedItems, { type RankedItem } from '../components/dashboard/TopRankedItems';
import DashboardLayout from '../components/layout/DashboardLayout';
import PremiumStatCard from '../components/ui/PremiumStatCard';
import SkeletonShimmer from '../components/ui/SkeletonShimmer';
import { useAppStore } from '../store/useAppStore';

const CARD_REVEAL = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } as any,
};

export default function DashboardPage() {
  const { metrics, totalClicks, requestsPerSec, refreshMetrics } = useAppStore();
  const previousRankMapRef = useRef<Map<string, number>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootTimer = window.setTimeout(() => setIsLoading(false), 950);
    const refreshId = window.setInterval(() => {
      void refreshMetrics();
    }, 4000);

    return () => {
      window.clearTimeout(bootTimer);
      window.clearInterval(refreshId);
    };
  }, [refreshMetrics]);

  const rankingItems: RankedItem[] = useMemo(() => {
    const prevMap = previousRankMapRef.current;

    const computed = metrics.topItems
      .map((item, index) => {
        const rank = index + 1;
        const previousRank = prevMap.get(item.itemId) ?? rank;

        return {
          id: item.itemId,
          title: item.itemName,
          rank,
          previousRank,
          ctr: Math.min(99.99, Number(((item.clicks / Math.max(1, totalClicks)) * 100).toFixed(2))),
        };
      })
      .slice(0, 8);

    const nextMap = new Map<string, number>();
    computed.forEach((item) => nextMap.set(item.id, item.rank));
    previousRankMapRef.current = nextMap;

    return computed;
  }, [metrics.topItems, totalClicks]);

  const sparkline = useMemo(
    () =>
      metrics.clickTrend.slice(-10).map((point) => ({
        label: point.time,
        value: point.clicks,
      })),
    [metrics.clickTrend],
  );

  const activeUsers = Math.max(130, Math.floor(requestsPerSec * 1.7));
  const velocityDelta = Number((((requestsPerSec - 100) / 100) * 100).toFixed(1));
  const clicksDelta = Number((((totalClicks - 12000) / 12000) * 100).toFixed(1));

  return (
    <DashboardLayout
      title="ClickRank Analytics"
      subtitle="Real-time ranking intelligence and performance metrics"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        {isLoading ? (
          <>
            <div className="card col-span-1 lg:col-span-2 p-6">
              <SkeletonShimmer style={{ height: '12px', width: '112px', marginBottom: '16px' }} />
              <SkeletonShimmer style={{ height: '40px', width: '144px', marginBottom: '16px' }} />
              <SkeletonShimmer style={{ height: '64px', width: '100%' }} />
            </div>
            <div className="card col-span-1 lg:col-span-2 p-6">
              <SkeletonShimmer style={{ height: '12px', width: '128px', marginBottom: '16px' }} />
              <SkeletonShimmer style={{ height: '40px', width: '160px', marginBottom: '16px' }} />
              <SkeletonShimmer style={{ height: '64px', width: '100%' }} />
            </div>
            <div className="card col-span-1 lg:col-span-2 p-6">
              <SkeletonShimmer style={{ height: '12px', width: '96px', marginBottom: '16px' }} />
              <SkeletonShimmer style={{ height: '40px', width: '128px', marginBottom: '16px' }} />
              <SkeletonShimmer style={{ height: '64px', width: '100%' }} />
            </div>
          </>
        ) : (
          <>
            <motion.div {...CARD_REVEAL} className="col-span-1 lg:col-span-2">
              <PremiumStatCard
                title="Total Clicks"
                value={totalClicks.toLocaleString()}
                changePercent={clicksDelta}
                subtitle="all-time engagement"
                icon={<MousePointerClick size={20} className="text-primary-light" />}
                sparklineData={sparkline}
              />
            </motion.div>
            <motion.div {...CARD_REVEAL} transition={{ duration: 0.4, delay: 0.05 }} className="col-span-1 lg:col-span-2">
              <PremiumStatCard
                title="Velocity"
                value={`${requestsPerSec} / sec`}
                changePercent={velocityDelta}
                subtitle="ingestion throughput"
                icon={<Workflow size={20} className="text-secondary" />}
                sparklineData={sparkline}
              />
            </motion.div>
            <motion.div {...CARD_REVEAL} transition={{ duration: 0.4, delay: 0.1 }} className="col-span-1 lg:col-span-2">
              <PremiumStatCard
                title="Active Users"
                value={activeUsers.toLocaleString()}
                changePercent={6.4}
                subtitle="estimated sessions"
                icon={<Users size={20} className="text-accent-pink" />}
                sparklineData={sparkline.map((point, index) => ({ ...point, value: point.value + index * 2 }))}
              />
            </motion.div>
          </>
        )}

        <motion.section {...CARD_REVEAL} transition={{ duration: 0.4, delay: 0.15 }} className="col-span-1 md:col-span-2 lg:col-span-4 card p-6">
          <ClickstreamVelocityChart data={metrics.clickTrend} />
        </motion.section>

        <motion.section
          {...CARD_REVEAL}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="col-span-1 md:col-span-2 lg:col-span-2 card"
        >
          <TopRankedItems items={rankingItems} />
        </motion.section>

        <motion.section
          {...CARD_REVEAL}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="col-span-1 md:col-span-2 lg:col-span-2 card p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold">Category Split</h3>
              <p className="text-xs text-muted mt-1">
                Click distribution
              </p>
            </div>
            <div className="p-2 bg-base border rounded-lg">
              <Activity size={18} className="text-primary" />
            </div>
          </div>
          <CategoryPieChart data={metrics.categoryDistribution} />
        </motion.section>

        <motion.section
          {...CARD_REVEAL}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="col-span-1 md:col-span-2 lg:col-span-4 card p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold">Main Ranking Graph</h3>
              <p className="text-xs text-muted mt-1">
                Position-bias corrected scoring lane
              </p>
            </div>
            <div className="p-2 bg-base border rounded-lg">
              <TrendingUp size={18} className="text-secondary" />
            </div>
          </div>
          <TopItemsChart items={metrics.topItems} />
        </motion.section>

        <motion.section
          {...CARD_REVEAL}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="card col-span-1 lg:col-span-6 p-6"
        >
          <div className="mb-5">
            <h3 className="text-base font-semibold">Top Queries</h3>
            <p className="text-xs text-muted mt-1">
              What users search most right now
            </p>
          </div>
          <TopQueriesTable queries={metrics.topQueries} />
        </motion.section>
      </div>
    </DashboardLayout>
  );
}
