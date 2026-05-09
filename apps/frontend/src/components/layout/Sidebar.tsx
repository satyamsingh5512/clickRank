import { AnimatePresence, motion } from 'framer-motion';
import { BarChart2, Bug, ChevronRight, Command, PanelLeftClose, PanelLeftOpen, Search, Sparkles, Zap } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useIntersectionObserver } from '../../hooks/useAnimations';

const navItems = [
  {
    id: 'search',
    label: 'Search',
    icon: Search,
    desc: 'Ranking Engine',
    gradient: 'var(--gradient-primary)',
  },
  {
    id: 'dashboard',
    label: 'Analytics',
    icon: BarChart2,
    desc: 'Live Metrics',
    gradient: 'var(--gradient-primary)',
  },
  {
    id: 'debug',
    label: 'Debug',
    icon: Bug,
    desc: 'Explainability',
    gradient: 'var(--gradient-primary)',
  },
] as const;

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onOpenCommandPalette: () => void;
}

function NavItem({
  item,
  isActive,
  collapsed,
  onClick,
}: {
  item: typeof navItems[number];
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  const { ref, hasIntersected } = useIntersectionObserver({ threshold: 0.5 });

  return (
    <motion.button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, x: -20 }}
      animate={hasIntersected ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`w-full flex items-center gap-3 rounded-lg overflow-hidden transition-all duration-200 cursor-pointer border ${
        isActive ? 'bg-[rgba(94,106,210,0.1)] border-[rgba(94,106,210,0.2)] text-primary-light' : 'bg-transparent border-transparent text-secondary hover:bg-hover hover:text-primary'
      } ${collapsed ? 'justify-center p-3' : 'justify-start p-3'}`}
    >
      <motion.div
        className={`flex items-center justify-center shrink-0 w-8 h-8 rounded-md ${
          isActive ? 'text-white' : 'text-current'
        }`}
        style={{ background: isActive ? item.gradient : 'transparent' }}
        whileHover={{ scale: isActive ? 1 : 1.05 }}
      >
        <item.icon size={16} />
      </motion.div>

      {!collapsed && (
        <div className="flex-1 text-left min-w-0">
          <div className="text-sm font-semibold">{item.label}</div>
          <div className={`text-xs mt-0.5 ${isActive ? 'text-primary-light opacity-80' : 'text-muted'}`}>
            {item.desc}
          </div>
        </div>
      )}

      {isActive && !collapsed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <ChevronRight size={14} className="opacity-60" />
        </motion.div>
      )}
    </motion.button>
  );
}

export default function Sidebar({
  mobileOpen = false,
  onClose,
  collapsed,
  onToggleCollapsed,
  onOpenCommandPalette,
}: SidebarProps) {
  const { currentPage, setPage } = useAppStore();
  const { ref: layoutRef, hasIntersected } = useIntersectionObserver({ threshold: 0.1 });

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 lg:hidden"
            aria-label="Close sidebar overlay"
          />
        )}
      </AnimatePresence>

      <motion.aside
        ref={layoutRef as React.RefObject<HTMLDivElement>}
        initial={{ opacity: 0 }}
        animate={hasIntersected ? { opacity: 1 } : {}}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={`sidebar transition-all duration-300 ${
          collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'
        } ${mobileOpen ? 'sidebar-open' : ''}`}
      >
        <div className="flex items-center h-16 px-4 border-b">
          <motion.div
            className="flex items-center justify-center shrink-0 w-8 h-8 rounded-lg bg-primary text-white shadow-md cursor-pointer"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <Sparkles size={16} />
          </motion.div>

          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="flex-1 min-w-0 ml-3"
            >
              <p className="text-base font-bold text-primary tracking-tight">
                ClickRank
              </p>
            </motion.div>
          )}

          <motion.button
            type="button"
            onClick={onToggleCollapsed}
            className="p-2 rounded-lg text-muted hover:text-primary hover:bg-hover ml-auto transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            whileTap={{ scale: 0.95 }}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </motion.button>
        </div>

        <div className="p-3">
          <motion.button
            type="button"
            onClick={onOpenCommandPalette}
            className={`w-full flex items-center gap-3 rounded-lg border bg-surface text-muted cursor-pointer transition-all hover:border-strong hover:bg-hover hover:text-primary ${
              collapsed ? 'p-2 justify-center' : 'p-2.5 justify-start'
            }`}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center justify-center w-5 h-5 rounded bg-elevated">
              <Command size={12} />
            </div>
            {!collapsed && (
              <>
                <span className="flex-1 text-left text-sm font-medium">Search</span>
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold border bg-elevated">
                  <Command size={8} />K
                </span>
              </>
            )}
          </motion.button>
        </div>

        {!collapsed && (
          <motion.p
            className="px-5 pt-2 pb-1 text-[10px] font-bold tracking-wider uppercase text-dim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Navigation
          </motion.p>
        )}

        <nav className="flex-1 flex flex-col gap-1 px-3 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={currentPage === item.id}
              collapsed={collapsed}
              onClick={() => { setPage(item.id); onClose?.(); }}
            />
          ))}
        </nav>

        <motion.div
          className="p-3 border-t mt-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center rounded-xl bg-[rgba(16,185,129,0.05)] border border-[rgba(16,185,129,0.2)] overflow-hidden">
            <div className="flex items-center justify-center p-3 bg-[rgba(16,185,129,0.1)]">
              <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_var(--secondary)]" />
            </div>
            {!collapsed && (
              <div className="flex-1 px-3 py-2">
                <span className="block text-sm font-semibold text-secondary">System Live</span>
                <p className="text-[10px] text-muted">All services operational</p>
              </div>
            )}
            {!collapsed && (
              <div className="px-3">
                <Zap size={14} className="text-secondary" />
              </div>
            )}
          </div>
        </motion.div>
      </motion.aside>
    </>
  );
}
