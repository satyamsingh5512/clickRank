import { motion } from "framer-motion";
import { Server, Zap, ShieldCheck } from "lucide-react";
import { cn } from "../lib/utils";

interface TelemetryOverlayProps {
  isVisible: boolean;
  metrics: {
    totalMs: number;
    redisMs: number;
    onnxMs: number;
    circuitStatus: "CLOSED" | "OPEN" | "HALF_OPEN";
  };
}

export function TelemetryOverlay({ isVisible, metrics }: TelemetryOverlayProps) {
  if (!isVisible) return null;

  const isHealthy = metrics.circuitStatus === "CLOSED";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full max-w-3xl mx-auto mt-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md shadow-2xl font-mono text-xs">
        
        {/* Latency Breakdown */}
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-amber-400/90">{metrics.totalMs}ms</span>
            <span className="text-[10px] uppercase tracking-widest opacity-60">End-to-End</span>
          </div>
          <span className="opacity-30">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-300">{metrics.redisMs}ms</span>
            <span className="text-[10px] uppercase tracking-widest opacity-60">Redis MGET</span>
          </div>
          <span className="opacity-30">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-300">{metrics.onnxMs}ms</span>
            <span className="text-[10px] uppercase tracking-widest opacity-60">ONNX Inference</span>
          </div>
        </div>

        {/* Circuit Breaker Status */}
        <div className={cn(
          "flex items-center gap-2 px-2.5 py-1 rounded-md border shadow-inner",
          isHealthy ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
        )}>
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="uppercase tracking-widest font-bold text-[10px]">
            Circuit: {metrics.circuitStatus} {isHealthy ? "(Healthy)" : "(Tripped)"}
          </span>
        </div>

      </div>
    </motion.div>
  );
}
