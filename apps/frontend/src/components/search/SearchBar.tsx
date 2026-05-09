import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2, ArrowRight, Clock, TrendingUp } from 'lucide-react';
import { useIntersectionObserver } from '../../hooks/useAnimations';

const suggestions = [
  { text: 'running shoes', icon: TrendingUp, trend: 'hot' },
  { text: 'wireless headphones', icon: TrendingUp, trend: 'hot' },
  { text: 'laptop', icon: Clock, trend: 'recent' },
  { text: 'smartphone', icon: TrendingUp, trend: 'hot' },
  { text: 'tv 4k', icon: Clock, trend: 'recent' },
  { text: 'gaming mouse', icon: TrendingUp, trend: 'hot' },
  { text: 'smartwatch', icon: Clock, trend: 'recent' },
  { text: 'camera', icon: TrendingUp, trend: 'hot' },
];

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  initialValue?: string;
}

export default function SearchBar({ onSearch, isLoading = false, initialValue = '' }: SearchBarProps) {
  const [value, setValue] = useState(initialValue);
  const [focused, setFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const { ref: containerRef, hasIntersected } = useIntersectionObserver({ threshold: 0.1 });

  const filtered = value.length > 0
    ? suggestions.filter(s => s.text.toLowerCase().includes(value.toLowerCase()) && s.text !== value)
    : suggestions;

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (focused && value.length >= 0) setShowSuggestions(true);
    else setShowSuggestions(false);
    setSelectedSuggestion(-1);
  }, [focused, value]);

  const handleSubmit = useCallback((q: string) => {
    setValue(q);
    setShowSuggestions(false);
    inputRef.current?.blur();
    onSearch(q);
  }, [onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (selectedSuggestion >= 0 && filtered[selectedSuggestion]) {
        handleSubmit(filtered[selectedSuggestion].text);
      } else if (value.trim()) {
        handleSubmit(value.trim());
      }
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestion(prev => Math.min(prev + 1, filtered.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestion(prev => Math.max(prev - 1, -1));
    }
  };

  return (
    <motion.div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, y: 20 }}
      animate={hasIntersected ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-2xl mx-auto z-50"
    >
      <motion.div
        animate={{
          boxShadow: focused
            ? '0 0 0 2px rgba(94, 106, 210, 0.5), 0 8px 32px rgba(94, 106, 210, 0.2)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          borderColor: focused ? 'var(--primary)' : 'var(--border-default)',
        }}
        className={`flex items-center rounded-2xl overflow-hidden border transition-colors duration-200 ${focused ? 'bg-elevated' : 'bg-surface'}`}
      >
        <motion.div
          className="pl-5 pr-3 flex items-center"
          animate={{ scale: focused ? 1.05 : 1 }}
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 size={20} className="text-primary-light" />
            </motion.div>
          ) : (
            <motion.div
              animate={{ scale: focused ? 1.1 : 1, color: focused ? 'var(--primary-light)' : 'var(--text-muted)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <Search size={20} />
            </motion.div>
          )}
        </motion.div>

        <motion.input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder="Search products, categories, items..."
          className="flex-1 py-4 px-2 bg-transparent outline-none border-none text-sm text-primary caret-primary"
        />

        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => { setValue(''); inputRef.current?.focus(); }}
              className="p-2 mr-2 rounded-lg text-muted hover:bg-hover hover:text-primary transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={16} />
            </motion.button>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => value.trim() && handleSubmit(value.trim())}
          className="m-2 py-2 px-6 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-light shadow-md transition-colors relative overflow-hidden"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="relative z-10">Search</span>
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {showSuggestions && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50 bg-elevated border shadow-lg backdrop-blur-xl"
          >
            <div className="p-2">
              {!value && (
                <p className="text-[10px] uppercase tracking-wider font-bold text-dim px-3 py-2">
                  Popular Searches
                </p>
              )}
              {filtered.map((s, i) => {
                const Icon = s.icon;
                const isSelected = selectedSuggestion === i;

                return (
                  <motion.button
                    key={s.text}
                    onMouseDown={() => handleSubmit(s.text)}
                    onMouseEnter={() => setSelectedSuggestion(i)}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left relative overflow-hidden cursor-pointer transition-colors ${
                      isSelected ? 'bg-[rgba(94,106,210,0.1)] border border-[rgba(94,106,210,0.2)] text-primary' : 'bg-transparent border border-transparent text-secondary hover:text-primary'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center relative z-10 ${
                        s.trend === 'hot' ? 'bg-[rgba(236,72,153,0.1)] text-accent-pink' : 'bg-hover text-muted'
                      }`}
                    >
                      <Icon size={14} />
                    </div>

                    <span className="flex-1 text-sm font-medium relative z-10">{s.text}</span>

                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg relative z-10 bg-[rgba(94,106,210,0.2)] text-primary-light"
                      >
                        <span>Go</span>
                        <ArrowRight size={10} />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            <div className="px-4 py-3 flex items-center justify-between border-t bg-surface">
              <div className="flex items-center gap-4 text-[10px] text-dim">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border bg-elevated">↑</kbd>
                  <kbd className="px-1.5 py-0.5 rounded border bg-elevated">↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border bg-elevated">↵</kbd>
                  Select
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-dim">
                <span>Press</span>
                <kbd className="px-1.5 py-0.5 rounded border bg-elevated">Esc</kbd>
                <span>to close</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
