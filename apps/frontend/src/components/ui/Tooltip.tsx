import { type ReactNode, useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  maxWidth?: number;
}

export default function Tooltip({
  children,
  content,
  position = 'top',
  delay = 200,
  maxWidth = 280,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = useCallback(() => {
    timeoutRef.current = setTimeout(() => setVisible(true), delay);
  }, [delay]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setVisible(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2.5',
  };

  const arrowPosition = {
    top: 'bottom-[-5px] left-1/2 -translate-x-1/2 rotate-45',
    bottom: 'top-[-5px] left-1/2 -translate-x-1/2 rotate-45',
    left: 'right-[-5px] top-1/2 -translate-y-1/2 rotate-45',
    right: 'left-[-5px] top-1/2 -translate-y-1/2 rotate-45',
  };

  const bgColor = 'var(--bg-elevated)';
  const borderColor = 'var(--border-default)';

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 4 : position === 'bottom' ? -4 : 0, x: position === 'left' ? 4 : position === 'right' ? -4 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={cn('absolute z-50 flex flex-col', positionStyles[position])}
            style={{ maxWidth }}
            role="tooltip"
          >
            <div
              className="px-3 py-2 rounded-xl text-xs leading-relaxed"
              style={{
                background: bgColor,
                border: `1px solid ${borderColor}`,
                color: 'var(--text-secondary)',
                boxShadow: 'var(--shadow-sm)',
                backdropFilter: 'blur(12px)',
              }}
            >
              {content}
            </div>
            <div
              className="absolute w-2 h-2"
              style={{
                background: bgColor,
                border: `1px solid ${borderColor}`,
                borderRadius: '2px',
                ...(position === 'top' && { top: 'auto', bottom: '-5px', borderTop: 'none', borderLeft: 'none' }),
                ...(position === 'bottom' && { top: '-5px', bottom: 'auto', borderBottom: 'none', borderRight: 'none' }),
                ...(position === 'left' && { left: 'auto', right: '-5px', borderBottom: 'none', borderLeft: 'none' }),
                ...(position === 'right' && { left: '-5px', right: 'auto', borderTop: 'none', borderRight: 'none' }),
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
