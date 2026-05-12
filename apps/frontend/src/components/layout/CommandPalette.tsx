import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, Bug, Command, CornerDownLeft, MoonStar, Search, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAppStore } from '../../store/useAppStore';
import type { Page } from '../../types';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  label: string;
  hint: string;
  icon: typeof Search;
  category: string;
  shortcut?: string[];
  action: () => void;
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const { setPage } = useAppStore();
  const { setTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  const goToPage = useCallback((page: Page) => {
    setPage(page);
    onClose();
  }, [setPage, onClose]);

  const commands = useMemo<CommandItem[]>(() => [
    {
      id: 'go-search',
      label: 'Go to Search',
      hint: 'ML-powered ranking engine',
      icon: Search,
      category: 'Navigate',
      shortcut: ['G', 'S'],
      action: () => goToPage('search'),
    },
    {
      id: 'go-dashboard',
      label: 'Go to Analytics',
      hint: 'Live ranking & metrics',
      icon: BarChart3,
      category: 'Navigate',
      shortcut: ['G', 'A'],
      action: () => goToPage('dashboard'),
    },
    {
      id: 'go-debug',
      label: 'Go to Debug',
      hint: 'Explainability & scoring',
      icon: Bug,
      category: 'Navigate',
      shortcut: ['G', 'D'],
      action: () => goToPage('debug'),
    },
    {
      id: 'theme-midnight',
      label: 'Theme: Nova Dark',
      hint: 'Modern dark theme',
      icon: MoonStar,
      category: 'Theme',
      action: () => { setTheme('midnight'); onClose(); },
    },
  ], [goToPage, onClose, setTheme]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const lowerQuery = query.toLowerCase();
    return commands.filter(c =>
      `${c.label} ${c.hint} ${c.category}`.toLowerCase().includes(lowerQuery)
    );
  }, [commands, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, filtered.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter' && filtered[activeIndex]) {
      filtered[activeIndex].action();
    }
  }, [filtered, activeIndex]);

  const grouped: Record<string, CommandItem[]> = useMemo(() => {
    const result: Record<string, CommandItem[]> = {};
    filtered.forEach(c => {
      if (!result[c.category]) result[c.category] = [];
      result[c.category].push(c);
    });
    return result;
  }, [filtered]);

  const categories = Object.keys(grouped);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div
              className="fixed inset-0 z-50 bg-[rgba(10,12,16,0.45)] backdrop-blur-sm"
              onClick={onClose}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-[10%] z-50 w-[92vw] max-w-[576px] -translate-x-1/2 bg-elevated border rounded-3xl shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b bg-elevated">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 2 }}
              >
                <Search size={18} className="text-primary-light" />
              </motion.div>
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Search commands, pages, settings..."
                className="flex-1 bg-transparent text-sm outline-none border-none text-primary caret-primary"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg font-medium bg-surface text-muted border"
              >
                <Command size={10} />
                <span>K</span>
              </motion.div>
            </div>

            <div className="p-2 max-h-[380px] overflow-y-auto">
              {categories.length > 0 ? (
                categories.map((category, catIndex) => (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: catIndex * 0.03 }}
                    className="mb-1"
                  >
                    <p className="text-[10px] uppercase tracking-wider font-bold text-dim px-3 py-2.5">{category}</p>
                    {grouped[category].map((cmd) => {
                      const Icon = cmd.icon;
                      const globalIdx = filtered.indexOf(cmd);
                      const isActive = activeIndex === globalIdx;

                      return (
                        <motion.button
                          key={cmd.id}
                          type="button"
                          onClick={cmd.action}
                          onMouseEnter={() => setActiveIndex(globalIdx)}
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.99 }}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl text-left relative overflow-hidden cursor-pointer transition-all duration-200 border ${
                            isActive ? 'bg-[rgba(94,106,210,0.1)] border-[rgba(94,106,210,0.2)]' : 'bg-transparent border-transparent'
                          }`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="commandActiveBg"
                              className="absolute inset-0 bg-[rgba(94,106,210,0.05)]"
                              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                          )}

                          <motion.div
                            className={`flex items-center justify-center rounded-xl shrink-0 relative z-10 w-9 h-9 border ${
                              isActive ? 'bg-gradient-primary text-white border-transparent shadow-[0_2px_12px_rgba(94,106,210,0.4)]' : 'bg-surface text-secondary border-subtle shadow-none'
                            }`}
                            whileHover={{ scale: isActive ? 1 : 1.05 }}
                          >
                            <Icon size={15} />
                          </motion.div>

                          <div className="flex-1 min-w-0 relative z-10">
                            <p className={`text-sm font-semibold ${isActive ? 'text-primary-light' : 'text-primary'}`}>
                              {cmd.label}
                            </p>
                            <p className="text-xs mt-0.5 text-muted">
                              {cmd.hint}
                            </p>
                          </div>

                          {cmd.shortcut && (
                            <div className="flex items-center gap-1 relative z-10">
                              {cmd.shortcut.map((key, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-surface border text-dim"
                                >
                                  {key}
                                </span>
                              ))}
                            </div>
                          )}

                          {isActive && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-semibold relative z-10 bg-[rgba(94,106,210,0.1)] text-primary-light"
                            >
                              <CornerDownLeft size={10} />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16"
                >
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-surface border"
                  >
                    <Search size={28} className="text-muted opacity-40" />
                  </motion.div>
                  <p className="text-sm font-semibold text-primary">
                    No matching commands
                  </p>
                  <p className="text-xs mt-1 text-muted">
                    Try searching for pages, settings, or actions
                  </p>
                </motion.div>
              )}
            </div>

            <motion.div
              className="flex items-center justify-between px-5 py-3 border-t bg-elevated"
            >
              <div className="flex items-center gap-5 text-[11px] text-dim">
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-surface border font-inherit">↑</kbd>
                  <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-surface border font-inherit">↓</kbd>
                  <span className="text-muted">Navigate</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-surface border font-inherit">↵</kbd>
                  <span className="text-muted">Select</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-surface border font-inherit">Esc</kbd>
                  <span className="text-muted">Close</span>
                </span>
              </div>
              <motion.div
                className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg font-medium bg-surface text-secondary border hover:border-default transition-colors"
              >
                <Sparkles size={12} className="text-primary-light" />
                ClickRank
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
