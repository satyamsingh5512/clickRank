import { motion } from "framer-motion";
import { Clock, Tag, Cpu, Activity, Info } from "lucide-react";
import { cn } from "../lib/utils";

export interface MLFeatures {
  ctr: number;
  recencyHours: number;
  segmentPower: boolean;
  segmentNew: boolean;
}

export interface ResultItem {
  id: string;
  title: string;
  category: string;
  score: number; // e.g. 98.4
  recencyDesc: string; // e.g. "2h ago"
  mlFeatures?: MLFeatures;
}

interface ResultCardProps {
  item: ResultItem;
  index: number;
  showDevMode?: boolean;
}

export function ResultCard({ item, index, showDevMode }: ResultCardProps) {
  const isHighMatch = item.score >= 90;
  const isMediumMatch = item.score >= 70 && item.score < 90;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      whileHover={{ scale: 1.02 }}
      className="group relative flex flex-col justify-between p-6 rounded-2xl bg-zinc-900/40 backdrop-blur-sm border border-white/5 hover:border-primary/40 transition-all duration-300"
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="flex justify-between items-start mb-4 z-10">
        <h3 className="text-lg font-semibold text-zinc-100 line-clamp-2 leading-tight">
          {item.title}
        </h3>
        
        {/* ML Relevance Badge */}
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-inner border",
          isHighMatch ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
          isMediumMatch ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : 
          "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
        )}>
          <Activity className="w-3.5 h-3.5" />
          {item.score.toFixed(1)}% Match
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-500 z-10">
        <div className="flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-zinc-600" />
          <span className="uppercase tracking-wider">{item.category}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-zinc-600" />
          <span>{item.recencyDesc}</span>
        </div>
      </div>

      {/* Dev Mode Overlay */}
      {showDevMode && item.mlFeatures && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 pt-4 border-t border-white/5 z-10"
        >
          <div className="flex items-center gap-2 text-xs text-primary/80 mb-2">
            <Cpu className="w-3.5 h-3.5" />
            <span className="font-mono tracking-tight uppercase font-semibold">XGBoost Features</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="bg-black/30 rounded p-1.5 border border-white/5">
              <span className="text-zinc-500">CTR:</span> <span className="text-emerald-400">{item.mlFeatures.ctr.toFixed(4)}</span>
            </div>
            <div className="bg-black/30 rounded p-1.5 border border-white/5">
              <span className="text-zinc-500">AGE:</span> <span className="text-amber-400">{item.mlFeatures.recencyHours.toFixed(1)}h</span>
            </div>
            <div className="bg-black/30 rounded p-1.5 border border-white/5">
              <span className="text-zinc-500">PWR:</span> <span className="text-indigo-400">{item.mlFeatures.segmentPower ? '1' : '0'}</span>
            </div>
            <div className="bg-black/30 rounded p-1.5 border border-white/5">
              <span className="text-zinc-500">NEW:</span> <span className="text-indigo-400">{item.mlFeatures.segmentNew ? '1' : '0'}</span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
