import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import type { RankingMode } from '../../types';
import { useMagnetic } from '../../hooks/useAnimations';

const MODES: { label: string; value: RankingMode }[] = [
  { label: 'Query', value: 'query' },
  { label: 'Category', value: 'category' },
  { label: 'Global', value: 'global' },
];

const TOP_N = [5, 10, 15, 20];
const CATEGORIES = ['shoes', 'electronics', 'clothing', 'home', 'global'];

function MagneticButton({ children, onClick, className, style }: { children: React.ReactNode; onClick?: () => void; className?: string, style?: React.CSSProperties }) {
  const { ref, position, isHovering } = useMagnetic({ strength: 0.15, ease: 0.15 });

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
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.button>
  );
}

export default function ControlPanel() {
  const {
    rankingMode,
    setRankingMode,
    topN,
    setTopN,
    selectedCategory,
    setSelectedCategory,
  } = useAppStore();

  return (
    <motion.div
      style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        style={{
          display: 'inline-flex', gap: '4px', padding: '4px', borderRadius: '12px',
          background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
        }}
      >
        {MODES.map((m) => {
          const isActive = rankingMode === m.value;
          return (
            <MagneticButton
              key={m.value}
              onClick={() => setRankingMode(m.value)}
              style={{
                padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: isActive ? '0 2px 10px rgba(0,0,0,0.2)' : 'none',
              }}
            >
              {m.label}
            </MagneticButton>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>Top</span>
        <div
          style={{
            display: 'inline-flex', gap: '4px', padding: '4px', borderRadius: '12px',
            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
          }}
        >
          {TOP_N.map((n) => {
            const isActive = topN === n;
            return (
              <motion.button
                key={n}
                onClick={() => setTopN(n)}
                style={{
                  padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                  background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: isActive ? '0 2px 10px rgba(0,0,0,0.2)' : 'none',
                  border: 'none', outline: 'none'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {n}
              </motion.button>
            );
          })}
        </div>
      </div>

      {rankingMode === 'category' && (
        <motion.div
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>Category</span>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="input"
              style={{
                padding: '8px 32px 8px 16px', borderRadius: '12px', fontSize: '12px', cursor: 'pointer',
                appearance: 'none', width: 'auto', minWidth: '120px',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)'
              }}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <div
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
