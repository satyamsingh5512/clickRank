import { motion } from 'framer-motion';

interface SkeletonShimmerProps {
  className?: string;
  animated?: boolean;
  delay?: number;
  style?: React.CSSProperties;
}

export default function SkeletonShimmer({
  className = '',
  animated = true,
  delay = 0,
  style,
}: SkeletonShimmerProps) {
  if (!animated) {
    return (
      <div
        className={`skeleton ${className}`}
        aria-hidden="true"
        style={{ ...style, animation: 'none' }}
      />
    );
  }

  return (
    <motion.div
      className={`skeleton ${className}`}
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay }}
      style={style}
    />
  );
}

export function SkeletonLine({ width = '100%', height = 16, className = '', style }: {
  width?: string | number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      className={`skeleton ${className}`}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <motion.div
      className="card"
      style={{ padding: '24px' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <SkeletonLine width={120} height={12} />
        <SkeletonLine width={48} height={48} style={{ borderRadius: '12px' }} />
      </div>
      <SkeletonLine width="60%" height={32} style={{ marginBottom: '16px' }} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <SkeletonLine width={80} height={24} style={{ borderRadius: '999px' }} />
        <SkeletonLine width={60} height={24} style={{ borderRadius: '999px' }} />
      </div>
    </motion.div>
  );
}
