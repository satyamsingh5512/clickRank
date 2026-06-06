import { useState, useCallback } from "react";
import { Terminal } from "lucide-react";
import { Omnibox } from "./components/Omnibox";
import { ResultCard, type ResultItem } from "./components/ResultCard";
import { TrendingSidebar } from "./components/TrendingSidebar";
import { TelemetryOverlay } from "./components/TelemetryOverlay";
import { SkeletonLoader } from "./components/SkeletonLoader";

// Mock Data Generators for the UI demonstration
const generateMockResults = (query: string): ResultItem[] => {
  return Array.from({ length: 9 }).map((_, i) => ({
    id: `item-${i}`,
    title: `${query ? query.charAt(0).toUpperCase() + query.slice(1) : 'Enterprise'} Result ${i + 1}`,
    category: ["tech", "cloud", "hardware", "software"][Math.floor(Math.random() * 4)],
    score: 99.9 - (Math.random() * 30),
    recencyDesc: `${Math.floor(Math.random() * 24) + 1}h ago`,
    mlFeatures: {
      ctr: Math.random() * 0.4,
      recencyHours: Math.random() * 72,
      segmentPower: Math.random() > 0.5,
      segmentNew: Math.random() > 0.8,
    }
  })).sort((a, b) => b.score - a.score);
};

const MOCK_TRENDING = [
  { query: "kubernetes ingress", count: 1245 },
  { query: "iphone 15 pro", count: 980 },
  { query: "system design", count: 856 },
  { query: "react hooks", count: 642 },
  { query: "postgres tuning", count: 430 },
];

export default function App() {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    
    setIsSearching(true);
    setHasSearched(true);
    
    // Simulate network + inference latency
    setTimeout(() => {
      setResults(generateMockResults(query));
      setIsSearching(false);
    }, 800);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-primary/30">
      
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-6 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-primary flex items-center justify-center shadow-glow">
              <span className="font-bold text-white tracking-tighter">CR</span>
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              ClickRank
            </span>
          </div>
          
          <button
            onClick={() => setDevMode(!devMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 border ${
              devMode 
                ? "bg-primary/20 border-primary/50 text-primary-light shadow-[0_0_15px_rgba(94,106,210,0.3)]" 
                : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            DEV MODE
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-12 flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Search & Results */}
        <div className="flex-1 flex flex-col items-center">
          
          <div className={`w-full transition-all duration-700 ease-in-out ${hasSearched ? "mb-8" : "mt-[20vh] mb-0"}`}>
            {!hasSearched && (
              <div className="text-center mb-10">
                <h1 className="text-5xl font-bold tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">
                  Intelligent Search.
                </h1>
                <p className="text-lg text-zinc-400 max-w-xl mx-auto">
                  Experience sub-35ms relevance ranking powered by ONNX and XGBoost.
                </p>
              </div>
            )}
            
            <Omnibox onSearch={handleSearch} isLoading={isSearching} />
            
            <TelemetryOverlay 
              isVisible={devMode && hasSearched} 
              metrics={{ totalMs: 32, redisMs: 2, onnxMs: 8, circuitStatus: "CLOSED" }}
            />
          </div>

          <div className="w-full">
            {isSearching ? (
              <SkeletonLoader />
            ) : results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
                {results.map((item, idx) => (
                  <ResultCard key={item.id} item={item} index={idx} showDevMode={devMode} />
                ))}
              </div>
            ) : null}
          </div>

        </div>

        {/* Right Column: Trending Sidebar */}
        <div className="hidden lg:block w-[300px] xl:w-[350px] shrink-0">
          <div className="sticky top-24 h-[calc(100vh-8rem)]">
            <TrendingSidebar queries={MOCK_TRENDING} />
          </div>
        </div>

      </main>
    </div>
  );
}
