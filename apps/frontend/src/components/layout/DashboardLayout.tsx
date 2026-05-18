import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useIntersectionObserver } from '../../hooks/useAnimations';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function DashboardLayout({
  children,
  title = 'Analytics Command Center',
  subtitle = 'Real-time click ranking, velocity tracking, and ML scoring intelligence',
}: DashboardLayoutProps) {
  const { ref, hasIntersected } = useIntersectionObserver({ threshold: 0.1 });

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-base -z-10 pointer-events-none" />

      <motion.div
        ref={ref as React.RefObject<HTMLDivElement>}
        initial={{ opacity: 0, y: 24 }}
        animate={hasIntersected ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-end justify-between gap-4 flex-wrap mb-8"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-6 rounded-full" style={{ background: 'var(--gradient-primary)', boxShadow: '0 0 10px var(--primary-glow)' }} />
            <h2 className="text-2xl font-bold text-primary tracking-tight">
              {title}
            </h2>
          </div>
          <p className="ml-4 text-sm text-muted">
            {subtitle}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={hasIntersected ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border"
        >
          <div className="w-2 h-2 rounded-full badge-success" />
          <span className="text-xs font-semibold text-secondary">
            Auto-refreshing every 4s
          </span>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={hasIntersected ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}
