import { Activity, Command, Menu, RefreshCw, Search, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { useMagnetic } from '../../hooks/useAnimations';

const pageTitles = {
  search: { title: 'Search Engine', sub: 'ML-powered click-through ranking' },
  dashboard: { title: 'Live Analytics', sub: 'Real-time ranking metrics & intelligence' },
  debug: { title: 'Debug Console', sub: 'Ranking explainability & scoring breakdown' },
};

interface HeaderProps {
  onOpenSidebar?: () => void;
  onOpenCommandPalette: () => void;
}

function MagneticButton({ children, onClick, className, style }: { children: React.ReactNode; onClick?: () => void; className?: string, style?: React.CSSProperties }) {
  const { ref, position, isHovering } = useMagnetic({ strength: 0.2, ease: 0.15 });

  return (
    <motion.button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type="button"
      onClick={onClick}
      className={className}
      style={{
        ...style,
        x: isHovering ? position.x : 0,
        y: isHovering ? position.y : 0,
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.button>
  );
}

export default function Header({ onOpenSidebar, onOpenCommandPalette }: HeaderProps) {
  const { currentPage, totalClicks, requestsPerSec } = useAppStore();
  const meta = pageTitles[currentPage];

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="header-container justify-between"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <MagneticButton
          onClick={onOpenSidebar}
          className="btn-ghost btn-icon lg:hidden flex shrink-0"
        >
          <Menu size={20} className="text-primary" />
        </MagneticButton>

        <div className="flex items-center gap-3 min-w-0">
          <div className="hidden md:flex items-center justify-center shrink-0 w-8 h-8 rounded-lg bg-primary text-white shadow-md">
            <Sparkles size={16} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-primary tracking-tight leading-tight truncate">
              {meta.title}
            </h1>
            <p className="hidden md:block text-xs text-muted leading-tight mt-0.5 truncate">
              {meta.sub}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <MagneticButton
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border hover:bg-hover hover:border-strong transition-all"
        >
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-elevated">
            <Search size={12} className="text-muted" />
          </div>
          <span className="hidden md:inline text-sm font-medium">Search</span>
          <span className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-elevated text-dim border">
            <Command size={10} />K
          </span>
        </MagneticButton>

        <motion.div
          className="hidden lg:flex items-center gap-2.5 px-4 py-2 rounded-xl bg-surface border transition-colors hover:border-strong"
        >
          <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-[rgba(94,106,210,0.1)] text-primary-light">
            <Activity size={14} />
          </div>
          <span className="text-xs font-medium text-muted">Clicks</span>
          <motion.span
            className="font-mono text-sm font-bold text-primary-light"
            key={totalClicks}
            initial={{ scale: 1.2, color: 'var(--secondary)' }}
            animate={{ scale: 1, color: 'var(--primary-light)' }}
            transition={{ duration: 0.3 }}
          >
            {totalClicks.toLocaleString()}
          </motion.span>
        </motion.div>

        <motion.div
          className="hidden lg:flex items-center gap-2.5 px-4 py-2 rounded-xl bg-surface border transition-colors hover:border-strong"
        >
          <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-[rgba(16,185,129,0.1)] text-secondary">
            <RefreshCw size={14} className="animate-spin" />
          </div>
          <motion.span
            className="font-mono text-sm font-bold text-secondary"
            key={requestsPerSec}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {requestsPerSec}
          </motion.span>
          <span className="text-xs font-medium text-muted">req/s</span>
        </motion.div>

        <motion.div
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)]"
          whileHover={{ scale: 1.05 }}
        >
          <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_var(--secondary)]" />
          <span className="text-xs font-semibold text-secondary">Live</span>
        </motion.div>
      </div>
    </motion.header>
  );
}
