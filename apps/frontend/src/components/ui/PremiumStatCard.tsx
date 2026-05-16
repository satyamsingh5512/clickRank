import { motion, useSpring, useTransform } from 'framer-motion';
import { useId, type ReactNode, useEffect } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { useIntersectionObserver } from '../../hooks/useAnimations';

interface SparkPoint {
  label: string;
  value: number;
}

interface PremiumStatCardProps {
  title: string;
  value: string | number;
  changePercent: number;
  icon: ReactNode;
  sparklineData: SparkPoint[];
  subtitle?: string;
  onClick?: () => void;
  progress?: number;
  delay?: number;
}

interface SparklineTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
}

function SparklineTooltip({ active, payload, label }: SparklineTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl px-3 py-2 text-sm bg-elevated border shadow-lg"
    >
      <p className="text-xs mb-0.5 text-muted">{label}</p>
      <p className="font-bold text-primary-light">
        {Number(payload[0]?.value ?? 0).toLocaleString()}
      </p>
    </motion.div>
  );
}

function ProgressRing({ progress, size = 64, strokeWidth = 4, color = 'var(--primary)' }: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        strokeWidth={strokeWidth}
        stroke="var(--border-subtle)"
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <motion.circle
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ stroke: color }}
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  );
}

export default function PremiumStatCard({
  title,
  value,
  changePercent,
  icon,
  sparklineData,
  subtitle,
  onClick,
  progress,
  delay = 0,
}: PremiumStatCardProps) {
  const isPositive = changePercent >= 0;
  const gradientId = useId().replace(/:/g, '-');
  const { ref, hasIntersected } = useIntersectionObserver({ threshold: 0.2 });

  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
  const springValue = useSpring(0, { stiffness: 100, damping: 20 });

  useEffect(() => {
    if (hasIntersected) {
      springValue.set(numericValue);
    }
  }, [hasIntersected, numericValue, springValue]);

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, y: 30 }}
      animate={hasIntersected ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: delay * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="h-full"
    >
      <motion.button
        type="button"
        whileHover={{
          y: -4,
          transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
        }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`card p-6 text-left w-full h-full relative block bg-surface border transition-colors hover:bg-elevated hover:border-strong ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <motion.div
          className="absolute top-0 left-0 right-0 h-1 origin-left"
          style={{ background: isPositive ? 'var(--gradient-primary)' : 'var(--secondary)' }}
          initial={{ scaleX: 0 }}
          animate={hasIntersected ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8, delay: delay * 0.1 + 0.2, ease: [0.16, 1, 0.3, 1] }}
        />

        <div
          className={`absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-10 blur-2xl pointer-events-none ${
            isPositive ? 'bg-primary' : 'bg-secondary'
          }`}
        />

        <div className="flex items-start justify-between relative">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted">
              {title}
            </p>
            <motion.h3
              className="mt-2 text-3xl font-bold tracking-tight text-primary"
            >
              {typeof value === 'string' && value.includes('%')
                ? `${Math.round(numericValue)}%`
                : typeof value === 'string' && value.includes('K')
                  ? `${(numericValue / 1000).toFixed(1)}K`
                  : value}
            </motion.h3>
            {subtitle && (
              <p className="text-xs mt-1 text-muted">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {progress !== undefined && (
              <div className="relative">
                <ProgressRing
                  progress={progress}
                  size={56}
                  strokeWidth={4}
                  color={isPositive ? 'var(--primary)' : 'var(--secondary)'}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-muted">
                  {progress}%
                </span>
              </div>
            )}
            <motion.div
              className={`flex items-center justify-center rounded-xl w-12 h-12 border ${
                isPositive ? 'bg-[rgba(94,106,210,0.1)] border-[rgba(94,106,210,0.2)] text-primary-light' : 'bg-[rgba(16,185,129,0.1)] border-[rgba(16,185,129,0.2)] text-secondary'
              }`}
              whileHover={{ scale: 1.05 }}
            >
              {icon}
            </motion.div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <motion.div
            className={`flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded-lg border ${
              isPositive ? 'bg-[rgba(16,185,129,0.1)] border-[rgba(16,185,129,0.2)] text-secondary' : 'bg-[rgba(236,72,153,0.1)] border-[rgba(236,72,153,0.2)] text-accent-pink'
            }`}
            initial={{ opacity: 0, x: -10 }}
            animate={hasIntersected ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.3, delay: delay * 0.1 + 0.3 }}
          >
            {isPositive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            {Math.abs(changePercent).toFixed(1)}%
          </motion.div>

          <motion.div
            className="h-14 w-36"
            initial={{ opacity: 0 }}
            animate={hasIntersected ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: delay * 0.1 + 0.4 }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id={`${gradientId}-positive`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id={`${gradientId}-negative`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-pink)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--accent-pink)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Tooltip content={<SparklineTooltip />} cursor={false} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={isPositive ? 'var(--primary)' : 'var(--accent-pink)'}
                  strokeWidth={2}
                  fill={isPositive ? `url(#${gradientId}-positive)` : `url(#${gradientId}-negative)`}
                  fillOpacity={1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </motion.button>
    </motion.div>
  );
}
