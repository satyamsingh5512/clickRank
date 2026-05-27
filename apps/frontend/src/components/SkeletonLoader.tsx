import { motion } from "framer-motion";

export function SkeletonLoader() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          className="p-6 rounded-2xl bg-zinc-900/20 border border-white/5 h-[140px] flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div className="h-5 w-3/4 skeleton rounded" />
            <div className="h-6 w-20 skeleton rounded-full" />
          </div>
          <div className="flex gap-4">
            <div className="h-4 w-16 skeleton rounded" />
            <div className="h-4 w-12 skeleton rounded" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
