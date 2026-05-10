import { motion } from 'framer-motion';
import { type ReactNode, type ElementType } from 'react';
import { Search, Inbox, FileQuestion, AlertCircle, RefreshCw, type LucideIcon } from 'lucide-react';

type EmptyStateVariant = 'search' | 'inbox' | 'question' | 'error' | 'refresh';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const variantIcons: Record<EmptyStateVariant, LucideIcon> = {
  search: Search,
  inbox: Inbox,
  question: FileQuestion,
  error: AlertCircle,
  refresh: RefreshCw,
};

const variantGradients: Record<EmptyStateVariant, string> = {
  search: 'from-indigo-500/20 to-purple-500/20',
  inbox: 'from-slate-500/20 to-zinc-500/20',
  question: 'from-amber-500/20 to-orange-500/20',
  error: 'from-red-500/20 to-rose-500/20',
  refresh: 'from-cyan-500/20 to-teal-500/20',
};

const variantIconColors: Record<EmptyStateVariant, string> = {
  search: 'var(--primary-light)',
  inbox: 'var(--text-muted)',
  question: 'var(--accent-yellow)',
  error: 'var(--accent-red)',
  refresh: 'var(--accent-sky)',
};

export function EmptyState({
  variant = 'search',
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  const Icon = icon || variantIcons[variant];
  const gradient = variantGradients[variant];
  const iconColor = variantIconColors[variant];

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: 'transparent',
          }}
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: variant === 'refresh' ? [0, 360] : [0, 5, -5, 0],
          }}
          transition={{
            duration: variant === 'refresh' ? 2 : 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Icon size={32} style={{ color: iconColor }} />
        </motion.div>

        <motion.div
          className="absolute -inset-1 rounded-2xl opacity-20"
          style={{
            background: iconColor,
          }}
          animate={{
            opacity: [0.1, 0.2, 0.1],
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>

      <motion.h3
        className="text-lg font-semibold mb-2"
        style={{ color: 'var(--text-primary)' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {title}
      </motion.h3>

      {description && (
        <motion.p
          className="text-sm max-w-sm mx-auto"
          style={{ color: 'var(--text-muted)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          {description}
        </motion.p>
      )}

      {action && (
        <motion.button
          className="btn btn-primary mt-6"
          onClick={action.onClick}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}
