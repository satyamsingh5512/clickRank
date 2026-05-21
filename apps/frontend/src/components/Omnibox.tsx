import { useState, useEffect } from "react";
import { Search, Command } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";

const PLACEHOLDERS = [
  "Search for cloud architecture...",
  "Search for 'iphone 15 pro'...",
  "Search for mechanical keyboards...",
  "Search for software engineering jobs...",
];

interface OmniboxProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export function Omnibox({ onSearch, isLoading }: OmniboxProps) {
  const [query, setQuery] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Rotate placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(query);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [query, onSearch]);

  // Handle Cmd+K to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("omnibox-input")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative w-full max-w-3xl mx-auto"
    >
      <div className="group relative flex items-center w-full overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 transition-all duration-300 focus-within:border-primary/50 focus-within:shadow-primary/20">
        <div className="pl-6 text-zinc-400 group-focus-within:text-primary transition-colors">
          <Search className="w-5 h-5" />
        </div>
        
        <div className="relative flex-1">
          <AnimatePresence mode="wait">
            {!query && (
              <motion.div
                key={placeholderIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-500 pointer-events-none"
              >
                {PLACEHOLDERS[placeholderIndex]}
              </motion.div>
            )}
          </AnimatePresence>
          
          <input
            id="omnibox-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-none text-zinc-100 placeholder:text-transparent focus:outline-none focus:ring-0 py-5 pl-4 pr-16 text-lg font-medium"
            autoComplete="off"
            spellCheck="false"
          />
        </div>

        <div className="absolute right-4 flex items-center gap-2">
          {isLoading ? (
            <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          ) : (
            <div className="hidden sm:flex items-center gap-1 text-xs font-semibold text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-md border border-white/5">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Glow effect underneath */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-indigo-500/30 blur-2xl -z-10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 rounded-3xl" />
    </motion.div>
  );
}
