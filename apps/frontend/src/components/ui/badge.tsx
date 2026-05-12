import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

type BadgeVariant = 'primary' | 'secondary' | 'pink' | 'orange' | 'green' | 'yellow' | 'red' | 'sky' | 'violet' | 'muted';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  glow?: boolean;
  pulse?: boolean;
  animated?: boolean;
}

const variantClasses: Record<BadgeVariant, { base: string; glow: string }> = {
  primary: {
    base: 'bg-[var(--primary-subtle)] text-[var(--primary-light)] border-[var(--primary-subtle)]',
    glow: 'shadow-none',
  },
  secondary: {
    base: 'bg-[var(--accent-cyan)] text-[var(--secondary-light)] border-[var(--accent-cyan)]',
    glow: 'shadow-none',
  },
  pink: {
    base: 'bg-[var(--accent-pink)] text-[var(--accent-pink)] border-[var(--accent-pink)]',
    glow: 'shadow-none',
  },
  orange: {
    base: 'bg-[var(--accent-orange)] text-[var(--accent-orange)] border-[var(--accent-orange)]',
    glow: 'shadow-none',
  },
  green: {
    base: 'bg-[var(--accent-green)] text-[var(--accent-green)] border-[var(--accent-green)]',
    glow: 'shadow-none',
  },
  yellow: {
    base: 'bg-[var(--accent-yellow)] text-[var(--accent-yellow)] border-[var(--accent-yellow)]',
    glow: 'shadow-none',
  },
  red: {
    base: 'bg-[var(--accent-red)] text-[var(--accent-red)] border-[var(--accent-red)]',
    glow: 'shadow-none',
  },
  sky: {
    base: 'bg-[var(--accent-cyan)] text-[var(--accent-sky)] border-[var(--accent-cyan)]',
    glow: 'shadow-none',
  },
  violet: {
    base: 'bg-[var(--primary-subtle)] text-[var(--accent-violet)] border-[var(--primary-subtle)]',
    glow: 'shadow-none',
  },
  muted: {
    base: 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)]',
    glow: '',
  },
};

export function Badge({
  className,
  variant = 'primary',
  glow = false,
  pulse = false,
  animated = false,
  children,
  ...props
}: BadgeProps) {
  const styles = variantClasses[variant];

  const badgeContent = (
    <span
      className={cn(
        "badge relative inline-flex items-center gap-1.5",
        styles.base,
        glow && styles.glow,
        className
      )}
      {...props}
    >
      {animated && (
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{
            background: 'currentColor',
            opacity: 0.1,
          }}
          animate={pulse ? {
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          } : {}}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
      {children}
    </span>
  );

  if (animated) {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05, y: -1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {badgeContent}
      </motion.span>
    );
  }

  return badgeContent;
}
