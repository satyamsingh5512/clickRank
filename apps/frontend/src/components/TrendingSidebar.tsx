import { motion } from "framer-motion";
import { TrendingUp, Activity } from "lucide-react";

interface TrendingQuery {
  query: string;
  count: number;
}

interface TrendingSidebarProps {
  queries: TrendingQuery[];
}

export function TrendingSidebar({ queries }: TrendingSidebarProps) {
  return (
    <div className="w-full h-full flex flex-col p-6 rounded-3xl bg-zinc-900/20 border border-white/5 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-widest flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Live Trending
        </h3>
        
        {/* Pulsing Live Dot */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Live</span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {queries.map((q, idx) => (
          <motion.div 
            key={q.query}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.4 }}
            className="group flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-zinc-600 font-bold w-4">{idx + 1}</span>
              <span className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors capitalize">
                {q.query}
              </span>
            </div>
            
            {/* Sparkline approximation (Visual only) */}
            <div className="flex items-end gap-0.5 h-4 opacity-40 group-hover:opacity-100 transition-opacity">
              {[...Array(5)].map((_, i) => (
                <motion.div 
                  key={i}
                  initial={{ height: "20%" }}
                  animate={{ height: `${Math.max(20, Math.random() * 100)}%` }}
                  transition={{ repeat: Infinity, duration: 1.5, repeatType: "mirror", delay: Math.random() }}
                  className="w-1 bg-primary/60 rounded-t-sm"
                />
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-auto pt-6 border-t border-white/5">
        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
          <Activity className="w-3 h-3" />
          5-Min Kafka Window
        </div>
      </div>
    </div>
  );
}
