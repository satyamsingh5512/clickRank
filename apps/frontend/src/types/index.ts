// Shared TypeScript types for Click Ranking System

export interface SearchResult {
  itemId: string;
  itemName: string;
  category: string;
  score: number;
  rank: number;
  previousRank?: number;
  rankDelta?: number;
  trending?: boolean;
  highEngagement?: boolean;
}

export interface SearchResponse {
  query: string | null;
  category: string | null;
  results: SearchResult[];
  totalResults: number;
  timestamp: number;
}

export interface DebugResult {
  itemId: string;
  clickCount: number;
  avgPosition: number;
  computedScore: number;
  rank: number;
  itemName?: string;
  category?: string;
}

export interface DebugResponse {
  query: string;
  scoringFormula: string;
  results: DebugResult[];
}

export interface ItemRankResponse {
  itemId: string;
  globalRank: number | null;
  totalClicks: number;
}

export interface ClickEvent {
  userId: string;
  itemId: string;
  itemName: string;
  category: string;
  searchQuery: string;
  position: number;
  sessionId: string;
  timestamp?: string;
}

export interface ClickstreamIngestRequest {
  userId: string;
  itemId: string;
  timestamp?: string;
}

export interface ClickstreamIngestResponse {
  status: string;
  eventId: string;
  topic: string;
}

export interface SearchRequest {
  query?: string;
  category?: string;
  limit?: number;
}

export interface RankRequestItem {
  item_id: string;
  ctr: number;
  recency_hours: number;
}

export interface RankUserContext {
  user_id: string;
  segment?: string;
  intent?: string;
}

export interface RankRequest {
  items: RankRequestItem[];
  user_context: RankUserContext;
}

export interface RankedItem {
  item_id: string;
  score: number;
}

export interface RankResponse {
  ranked_items: RankedItem[];
  ranked_at: string;
}

export interface MetricsData {
  totalClicks: number;
  requestsPerSec: number;
  topQueries: TopQuery[];
  topItems: TopItem[];
  categoryDistribution: CategoryData[];
  clickTrend: TrendPoint[];
}

export interface TopQuery {
  query: string;
  count: number;
  growth: number;
}

export interface TopItem {
  itemId: string;
  itemName: string;
  category: string;
  score: number;
  clicks: number;
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export interface TrendPoint {
  time: string;
  clicks: number;
  searches: number;
}

export interface RankItem {
  itemId: string;
  itemName: string;
  score: number;
}

export type RankingMode = 'query' | 'category' | 'global';
export type Page = 'search' | 'dashboard' | 'debug';
