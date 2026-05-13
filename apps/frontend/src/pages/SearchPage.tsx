import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import SearchBar from '../components/search/SearchBar';
import ResultCard from '../components/search/ResultCard';
import ControlPanel from '../components/controls/ControlPanel';
import type { SearchResult } from '../types';
import { postClick } from '../services/api';
import { TrendingUp, Zap, RefreshCw, Sparkles, Search } from 'lucide-react';

const HERO_QUERIES = ['running shoes', 'new phone', 'best sneakers', 'casual shoes'];

export default function SearchPage() {
  const {
    searchResults,
    isSearching,
    performSearch,
    searchQuery,
    rankingMode,
    selectedCategory,
    autoRefresh,
    setAutoRefresh,
    incrementClicks,
  } = useAppStore();

  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>('');

  useEffect(() => {
    const effectiveQuery = searchQuery || (rankingMode === 'category' ? selectedCategory : 'global');
    if (!autoRefresh || (!effectiveQuery && rankingMode !== 'global')) return;

    const id = setInterval(() => {
      performSearch(effectiveQuery);
      setLastUpdatedAt(new Date().toLocaleTimeString());
    }, 5000);

    return () => clearInterval(id);
  }, [autoRefresh, performSearch, rankingMode, searchQuery, selectedCategory]);

  const handleClickItem = useCallback(async (result: SearchResult) => {
    incrementClicks(1);
    try {
      await postClick({
        userId: `user-${Math.floor(Math.random() * 1000)}`,
        itemId: result.itemId,
        itemName: result.itemName,
        category: result.category,
        searchQuery: searchQuery || 'global',
        position: result.rank,
        sessionId: `session-${Date.now()}`,
      });
    } catch {
      // Silent failure so demo UX remains smooth
    }
  }, [incrementClicks, searchQuery]);

  const isEmpty = searchResults.length === 0 && !isSearching;
  const contextLabel = rankingMode === 'category' ? `category:${selectedCategory}` : rankingMode;

  return (
    <div className="h-full">
      <div className="pt-12 pb-10 px-8 text-center relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 badge-primary">
            <Sparkles size={14} />
            <span>ML-Powered Ranking</span>
          </div>
          <h2 className="text-4xl font-bold mb-4 tracking-tight">
            <span className="text-gradient">Intelligent</span> Search
          </h2>
          <p className="text-base text-muted max-w-lg mx-auto mb-10">
            Results ranked by position-bias corrected score with real-time ML intelligence
          </p>
          <SearchBar
            onSearch={(query) => {
              performSearch(query);
              setLastUpdatedAt(new Date().toLocaleTimeString());
            }}
            isLoading={isSearching}
            initialValue={searchQuery}
          />
        </motion.div>

        <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
          <span className="text-xs text-muted">Quick search:</span>
          {HERO_QUERIES.map((query) => (
            <motion.button
              key={query}
              onClick={() => {
                performSearch(query);
                setLastUpdatedAt(new Date().toLocaleTimeString());
              }}
              className="text-xs px-4 py-2 rounded-lg bg-surface border text-secondary hover:text-primary transition-colors"
              whileHover={{ y: -2 }}
            >
              {query}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="px-8 pb-10 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <ControlPanel />
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 text-xs px-4 py-2.5 rounded-lg border cursor-pointer ${
                autoRefresh ? 'bg-[rgba(16,185,129,0.1)] border-[rgba(16,185,129,0.3)] text-secondary' : 'bg-surface text-muted'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RefreshCw size={14} className={autoRefresh ? 'animate-spin' : ''} />
              Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
            </motion.button>
            {(searchQuery || rankingMode === 'global') && (
              <motion.button
                onClick={() => {
                  performSearch(searchQuery || 'global');
                  setLastUpdatedAt(new Date().toLocaleTimeString());
                }}
                className="btn btn-secondary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Refresh
              </motion.button>
            )}
          </div>
        </div>

        {searchResults.length > 0 && (
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <span className="text-sm text-muted">
              <span className="text-primary font-medium">{searchResults.length} results</span>
              {' for '}<span className="text-primary font-medium">&quot;{searchQuery || 'global'}&quot;</span>
              {' · '}<span>{contextLabel} ranking</span>
              {lastUpdatedAt ? ` · updated ${lastUpdatedAt}` : ''}
            </span>
            <div className="flex items-center gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <TrendingUp size={14} className="text-accent-yellow" /> Trending
              </span>
              <span className="flex items-center gap-1.5">
                <Zap size={14} className="text-primary-light" /> High Engagement
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {isSearching ? (
              <motion.div key="skeleton" className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="skeleton h-20 rounded-xl" />
                ))}
              </motion.div>
            ) : (
              searchResults.map((result, index) => (
                <ResultCard key={result.itemId} result={result} index={index} onClickItem={handleClickItem} />
              ))
            )}
          </AnimatePresence>
        </div>

        {isEmpty && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center bg-surface border shadow-inner">
              <Search size={32} className="text-muted" />
            </div>
            <h3 className="text-xl font-bold mb-2">Search for anything</h3>
            <p className="text-sm text-muted max-w-md mx-auto">
              Type a query and hit Search to see bias-corrected ranking updates powered by ML
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
