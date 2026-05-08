import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import DashboardPage from './pages/DashboardPage';
import DebugPage from './pages/DebugPage';
import SearchPage from './pages/SearchPage';
import CommandPalette from './components/layout/CommandPalette';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import { ThemeProvider } from './context/ThemeContext';
import { useAppStore } from './store/useAppStore';

function AppShell() {
  const { currentPage } = useAppStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandPaletteOpen((open) => !open);
      }

      if (event.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);

  return (
    <div className="app-container">
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((state) => !state)}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      <div className={`main-wrapper ${sidebarCollapsed ? 'main-wrapper-collapsed' : 'main-wrapper-expanded'}`}>
        <Header
          onOpenSidebar={() => setMobileSidebarOpen(true)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />

        <main className="main-content">
          <AnimatePresence mode="wait">
            {currentPage === 'search' && (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <SearchPage />
              </motion.div>
            )}
            {currentPage === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <DashboardPage />
              </motion.div>
            )}
            {currentPage === 'debug' && (
              <motion.div
                key="debug"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <DebugPage />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
