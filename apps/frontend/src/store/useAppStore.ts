import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { SearchResult, DebugResult, MetricsData, RankingMode } from '../types';
import {
  mockSearchResults,
  mockDebugResults,
  mockMetrics,
  buildMetricsFromResults,
} from '../lib/mockData';
import * as api from '../services/api';

interface AppState {
  // Navigation
  currentPage: 'search' | 'dashboard' | 'debug';
  setPage: (page: 'search' | 'dashboard' | 'debug') => void;

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: SearchResult[];
  isSearching: boolean;
  searchError: string | null;
  topN: number;
  setTopN: (n: number) => void;
  rankingMode: RankingMode;
  setRankingMode: (mode: RankingMode) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  autoRefresh: boolean;
  setAutoRefresh: (enabled: boolean) => void;
  performSearch: (query: string) => Promise<void>;

  // Debug
  debugQuery: string;
  setDebugQuery: (q: string) => void;
  debugResults: DebugResult[];
  isDebugging: boolean;
  debugError: string | null;
  scoringFormula: string;
  performDebug: (query: string) => Promise<void>;

  // Metrics
  metrics: MetricsData;
  isLoadingMetrics: boolean;
  refreshMetrics: () => Promise<void>;

  // Live counters
  totalClicks: number;
  requestsPerSec: number;
  incrementClicks: (delta: number) => void;
}

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    // Navigation
    currentPage: 'search',
    setPage: (page) => set({ currentPage: page }),

    // Search
    searchQuery: '',
    setSearchQuery: (q) => set({ searchQuery: q }),
    searchResults: [],
    isSearching: false,
    searchError: null,
    topN: 10,
    setTopN: (n) => set({ topN: n }),
    rankingMode: 'query',
    setRankingMode: (mode) => set({ rankingMode: mode }),
    selectedCategory: 'shoes',
    setSelectedCategory: (category) => set({ selectedCategory: category }),
    autoRefresh: true,
    setAutoRefresh: (enabled) => set({ autoRefresh: enabled }),

    performSearch: async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed && get().rankingMode !== 'global') return;

      set({ isSearching: true, searchError: null, searchQuery: query });
      try {
        const prev = get().searchResults;
        const { rankingMode, topN, selectedCategory } = get();

        const response = await api.searchItems({
          query: rankingMode === 'global' ? undefined : trimmed,
          category: rankingMode === 'category' ? selectedCategory : undefined,
          limit: topN,
        });

        const merged = response.results.map((result) => {
          const prevItem = prev.find((item) => item.itemId === result.itemId);
          const previousRank = prevItem?.rank;
          const rankDelta = previousRank !== undefined ? previousRank - result.rank : undefined;
          return {
            ...result,
            previousRank,
            rankDelta,
            trending: result.rank <= 3 || (rankDelta ?? 0) > 0,
            highEngagement: result.score >= 1.8,
          };
        });

        const metrics = buildMetricsFromResults(merged);
        set({
          searchResults: merged,
          isSearching: false,
          metrics: {
            ...metrics,
            totalClicks: Math.max(metrics.totalClicks, get().totalClicks),
            requestsPerSec: get().requestsPerSec,
          },
        });
      } catch {
        const fallback = mockSearchResults.slice(0, get().topN);
        set({
          searchResults: fallback,
          isSearching: false,
          searchError: null,
          metrics: buildMetricsFromResults(fallback),
        });
      }
    },

    // Debug
    debugQuery: '',
    setDebugQuery: (q) => set({ debugQuery: q }),
    debugResults: [],
    isDebugging: false,
    debugError: null,
    scoringFormula: 'count × (1 / log₂(avgPosition + 1))',

    performDebug: async (query: string) => {
      if (!query.trim()) return;
      set({ isDebugging: true, debugError: null, debugQuery: query });
      try {
        const results = await api.debugSearch(query);
        set({
          debugResults: results,
          isDebugging: false,
          scoringFormula: 'count × (1 / log₂(avgPosition + 1))',
        });
      } catch {
        set({
          debugResults: mockDebugResults,
          isDebugging: false,
          debugError: null,
          scoringFormula: 'count × (1 / log₂(avgPosition + 1))',
        });
      }
    },

    // Metrics
    metrics: mockMetrics,
    isLoadingMetrics: false,
    refreshMetrics: async () => {
      const current = get().metrics;
      const nextRequestsPerSec = Math.max(20, Math.floor(70 + Math.random() * 120));
      const clicksDelta = Math.max(1, Math.round(nextRequestsPerSec * (0.2 + Math.random() * 0.5)));

      const nextTrend = [...current.clickTrend.slice(-29)];
      nextTrend.push({
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        clicks: clicksDelta,
        searches: Math.max(5, Math.round(clicksDelta * 0.65)),
      });

      let nextTopQueries = current.topQueries;
      try {
        const trending = await api.getTrendingQueries();
        if (trending && trending.length > 0) {
           nextTopQueries = trending.map((t, index) => ({
             query: t.query,
             count: Math.max(100, Math.floor(t.score * 100)),
             growth: index < 3 ? Math.floor(Math.random() * 20) + 5 : Math.floor(Math.random() * 10) - 5,
           }));
        }
      } catch (e) {
        // Fallback to existing
      }

      set((state) => ({
        metrics: {
          ...state.metrics,
          totalClicks: state.totalClicks + clicksDelta,
          requestsPerSec: nextRequestsPerSec,
          clickTrend: nextTrend,
          topQueries: nextTopQueries
        },
        totalClicks: state.totalClicks + clicksDelta,
        requestsPerSec: nextRequestsPerSec,
      }));
    },

    // Live counters
    totalClicks: mockMetrics.totalClicks,
    requestsPerSec: 127,
    incrementClicks: (delta) => set((s) => ({ totalClicks: s.totalClicks + delta })),
  }))
);
