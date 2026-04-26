import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Leaf } from 'lucide-react';
import Layout from './components/Layout';
import Home from './pages/Home';
import DetectPage from './pages/DetectPage';
import AboutPage from './pages/AboutPage';
import SettingsPage from './pages/SettingsPage';
import { getSafeItem, setSafeItem, clearSafeItems } from './utils/storage';

/**
 * Global Error Boundary for the React tree
 */
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Layout/Render Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-10">
             <div className="w-20 h-20 bg-amber-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-amber-500/20">
                <Leaf className="text-amber-500 w-10 h-10" />
             </div>
             <div className="space-y-4">
                <h1 className="text-3xl font-black text-white font-heading">System Integrity Check</h1>
                <p className="text-gray-400 leading-relaxed text-sm">
                   The application encountered a critical runtime exception. This often results from corrupted local storage or an incompatible browser state.
                </p>
             </div>
             <div className="flex flex-col gap-4">
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-white font-black rounded-2xl transition-all shadow-lg shadow-teal-500/20 text-xs uppercase tracking-widest"
                >
                  Reload Neural Interface
                </button>
                <button 
                  onClick={() => { clearSafeItems(['agri-theme', 'agri-history', 'i18nextLng']); window.location.reload(); }}
                  className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-gray-400 font-black rounded-2xl transition-all text-xs uppercase tracking-widest"
                >
                  Reset All Local Data
                </button>
             </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Creative Animated Routes Wrapper
 */
const AnimatedRoutes: React.FC<any> = ({ 
  predictionData, 
  history, 
  onResult, 
  onReset, 
  onSelectHistory, 
  onClearHistory,
  darkMode,
  onToggleTheme
}) => {
  const location = useLocation();

  return (
    <ErrorBoundary>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route element={<Layout darkMode={darkMode} onToggleTheme={onToggleTheme} />}>
            <Route path="/" element={<Home />} />
            <Route 
              path="/detect" 
              element={
                <DetectPage 
                  predictionData={predictionData} 
                  history={history} 
                  onResult={onResult} 
                  onReset={onReset} 
                  onSelectHistory={onSelectHistory} 
                  onClearHistory={onClearHistory} 
                />
              } 
            />
            <Route path="/about" element={<AboutPage />} />
            <Route 
              path="/settings" 
              element={
                <SettingsPage 
                  darkMode={darkMode} 
                  onToggleTheme={onToggleTheme} 
                  onClearHistory={onClearHistory} 
                />
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </ErrorBoundary>
  );
};

const App: React.FC = () => {
  const [predictionData, setPredictionData] = useState<any | null>(null);
  
  // Safe history initialization
  const [history, setHistory] = useState<any[]>(() => 
    getSafeItem('agri-history', [], (val) => Array.isArray(val))
  );

  // Safe theme initialization
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = getSafeItem('agri-theme', '');
    const allowed = ['light', 'dark'];
    const validated = allowed.includes(saved) ? saved : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    return validated === 'dark';
  });

  // Sync theme with DOM and localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      setSafeItem('agri-theme', 'dark');
    } else {
      root.classList.remove('dark');
      setSafeItem('agri-theme', 'light');
    }
  }, [darkMode]);

  // Sync history with localStorage
  useEffect(() => {
    setSafeItem('agri-history', history);
  }, [history]);

  const handleResult = (result: any) => {
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      result: result
    };
    
    setHistory(prev => [newEntry, ...prev].slice(0, 10)); // Keep last 10
    setPredictionData(result);
  };

  const handleSelectHistory = (entry: any) => {
    setPredictionData(entry.result);
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your field history? This action cannot be undone.')) {
      setHistory([]);
      localStorage.removeItem('agri-history');
    }
  };

  const handleReset = () => {
    setPredictionData(null);
  };

  const handleToggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <BrowserRouter>
      <AnimatedRoutes 
        predictionData={predictionData}
        history={history}
        onResult={handleResult}
        onReset={handleReset}
        onSelectHistory={handleSelectHistory}
        onClearHistory={handleClearHistory}
        darkMode={darkMode}
        onToggleTheme={handleToggleTheme}
      />
    </BrowserRouter>
  );
};

export default App;
