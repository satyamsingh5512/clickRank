import type {
  SearchResult, DebugResult, MetricsData, CategoryData,
  TrendPoint, TopQuery, TopItem
} from '../types';

// ---- Mock Search Results ----
export const mockSearchResults: SearchResult[] = [
  {
    itemId: 'nike-123', itemName: 'Nike Air Max 270', category: 'Footwear',
    score: 94.7, rank: 1, previousRank: 2,
    trending: true, highEngagement: true,
  },
  {
    itemId: 'macbook-002', itemName: 'Apple MacBook Pro M3', category: 'Electronics',
    score: 88.3, rank: 2, previousRank: 1,
    trending: true, highEngagement: false,
  },
  {
    itemId: 'samsung-003', itemName: 'Samsung 4K OLED TV 65"', category: 'Electronics',
    score: 76.1, rank: 3, previousRank: 3,
    trending: false, highEngagement: true,
  },
  {
    itemId: 'levi-004', itemName: 'Levi\'s 501 Original Jeans', category: 'Clothing',
    score: 65.8, rank: 4, previousRank: 6,
    trending: true, highEngagement: false,
  },
  {
    itemId: 'sony-005', itemName: 'Sony WH-1000XM5 Headphones', category: 'Electronics',
    score: 59.2, rank: 5, previousRank: 4,
    trending: false, highEngagement: false,
  },
  {
    itemId: 'dyson-006', itemName: 'Dyson V15 Vacuum', category: 'Home Appliances',
    score: 51.4, rank: 6, previousRank: 5,
    trending: false, highEngagement: true,
  },
  {
    itemId: 'adidas-007', itemName: 'Adidas Ultraboost 22', category: 'Footwear',
    score: 44.9, rank: 7, previousRank: 9,
    trending: true, highEngagement: false,
  },
  {
    itemId: 'kindle-008', itemName: 'Kindle Paperwhite', category: 'Electronics',
    score: 38.6, rank: 8, previousRank: 7,
    trending: false, highEngagement: false,
  },
];

// ---- Mock Debug Results ----
export const mockDebugResults: DebugResult[] = [
  { itemId: 'nike-123', itemName: 'Nike Air Max 270', category: 'Footwear', clickCount: 1847, avgPosition: 1.2, computedScore: 94.7, rank: 1 },
  { itemId: 'macbook-002', itemName: 'Apple MacBook Pro M3', category: 'Electronics', clickCount: 1502, avgPosition: 1.5, computedScore: 88.3, rank: 2 },
  { itemId: 'samsung-003', itemName: 'Samsung 4K OLED TV', category: 'Electronics', clickCount: 1143, avgPosition: 2.1, computedScore: 76.1, rank: 3 },
  { itemId: 'levi-004', itemName: 'Levi\'s 501 Original Jeans', category: 'Clothing', clickCount: 978, avgPosition: 2.5, computedScore: 65.8, rank: 4 },
  { itemId: 'sony-005', itemName: 'Sony WH-1000XM5', category: 'Electronics', clickCount: 843, avgPosition: 2.8, computedScore: 59.2, rank: 5 },
  { itemId: 'dyson-006', itemName: 'Dyson V15 Vacuum', category: 'Home Appliances', clickCount: 712, avgPosition: 3.2, computedScore: 51.4, rank: 6 },
];

// ---- Mock Metrics ----
export const mockMetrics: MetricsData = {
  totalClicks: 48321,
  requestsPerSec: 127,
  topQueries: [
    { query: 'shoes', count: 4821, growth: 12.4 },
    { query: 'laptop', count: 3912, growth: 8.7 },
    { query: 'headphones', count: 2847, growth: -2.1 },
    { query: 'tv 4k', count: 2341, growth: 22.3 },
    { query: 'running shoes', count: 1987, growth: 15.8 },
  ],
  topItems: [
    { itemId: 'nike-123', itemName: 'Nike Air Max 270', category: 'Footwear', score: 94.7, clicks: 1847 },
    { itemId: 'macbook-002', itemName: 'Apple MacBook Pro M3', category: 'Electronics', score: 88.3, clicks: 1502 },
    { itemId: 'samsung-003', itemName: 'Samsung 4K OLED TV', category: 'Electronics', score: 76.1, clicks: 1143 },
    { itemId: 'levi-004', itemName: 'Levi\'s 501 Jeans', category: 'Clothing', score: 65.8, clicks: 978 },
    { itemId: 'sony-005', itemName: 'Sony WH-1000XM5', category: 'Electronics', score: 59.2, clicks: 843 },
    { itemId: 'dyson-006', itemName: 'Dyson V15 Vacuum', category: 'Home Appliances', score: 51.4, clicks: 712 },
    { itemId: 'adidas-007', itemName: 'Adidas Ultraboost 22', category: 'Footwear', score: 44.9, clicks: 634 },
  ],
  categoryDistribution: [
    { name: 'Electronics', value: 38, color: '#6366f1' },
    { name: 'Footwear', value: 24, color: '#06b6d4' },
    { name: 'Clothing', value: 18, color: '#10b981' },
    { name: 'Home Appliances', value: 12, color: '#f59e0b' },
    { name: 'Others', value: 8, color: '#f43f5e' },
  ] as CategoryData[],
  clickTrend: generateTrend(),
};

function generateTrend(): TrendPoint[] {
  const points: TrendPoint[] = [];
  const now = Date.now();
  let baseClicks = 80;
  let baseSearches = 50;
  for (let i = 29; i >= 0; i--) {
    baseClicks += Math.floor(Math.random() * 30) - 10;
    baseSearches += Math.floor(Math.random() * 20) - 8;
    baseClicks = Math.max(20, Math.min(200, baseClicks));
    baseSearches = Math.max(10, Math.min(120, baseSearches));
    const t = new Date(now - i * 60000);
    points.push({
      time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      clicks: baseClicks,
      searches: baseSearches,
    });
  }
  return points;
}

// Compute score using the ranking formula: count × (1 / log₂(avgPosition + 1))
export function computeScore(clickCount: number, avgPosition: number): number {
  const positionBias = 1 / (Math.log2(avgPosition + 1) || 1);
  return clickCount * positionBias;
}

export function buildMetricsFromResults(results: SearchResult[]): MetricsData {
  const safeResults = results.length ? results : mockSearchResults;

  const categoryMap = safeResults.reduce<Record<string, number>>((acc, result) => {
    acc[result.category] = (acc[result.category] ?? 0) + 1;
    return acc;
  }, {});

  const total = safeResults.length;
  const palette = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];
  const categoryDistribution: CategoryData[] = Object.entries(categoryMap).map(([name, count], idx) => ({
    name,
    value: Math.max(1, Math.round((count / total) * 100)),
    color: palette[idx % palette.length],
  }));

  const topItems: TopItem[] = safeResults.slice(0, 10).map((result) => ({
    itemId: result.itemId,
    itemName: result.itemName,
    category: result.category,
    score: Number(result.score.toFixed(3)),
    clicks: Math.max(10, Math.round(result.score * 10)),
  }));

  const topQueries: TopQuery[] = [
    { query: 'running shoes', count: 1880, growth: 12.5 },
    { query: 'new phone', count: 1560, growth: 9.1 },
    { query: 'best sneakers', count: 1320, growth: 4.7 },
    { query: 'casual shoes', count: 1180, growth: -1.2 },
    { query: 'wireless headphones', count: 980, growth: 7.9 },
  ];

  return {
    totalClicks: topItems.reduce((sum, item) => sum + item.clicks, 0),
    requestsPerSec: 110,
    topQueries,
    topItems,
    categoryDistribution,
    clickTrend: generateTrend(),
  };
}
