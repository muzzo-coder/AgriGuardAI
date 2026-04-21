import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Layout from './components/Layout';
import Home from './pages/Home';
import DetectPage from './pages/DetectPage';
import ChatbotPage from './pages/ChatbotPage';
import AboutPage from './pages/AboutPage';
import SettingsPage from './pages/SettingsPage';

/**
 * Main Application Orchestrator with Multi-Page Routing
 */
const App: React.FC = () => {
  const [predictionData, setPredictionData] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('agri-history');
      return saved ? JSON.parse(saved) : [];
    } catch (err) {
      console.error('Failed to parse history:', err);
      return [];
    }
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('agri-theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    } catch {
      return false;
    }
  });

  // Sync theme with DOM and localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('agri-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('agri-theme', 'light');
    }
  }, [darkMode]);

  // Sync history with localStorage
  useEffect(() => {
    localStorage.setItem('agri-history', JSON.stringify(history));
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

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout darkMode={darkMode} onToggleTheme={() => setDarkMode(!darkMode)} />}>
          <Route path="/" element={<Home />} />
          <Route 
            path="/detect" 
            element={
              <DetectPage 
                predictionData={predictionData} 
                history={history} 
                onResult={handleResult} 
                onReset={handleReset} 
                onSelectHistory={handleSelectHistory} 
                onClearHistory={handleClearHistory} 
              />
            } 
          />
          <Route 
            path="/chatbot" 
            element={<ChatbotPage prediction={predictionData} />} 
          />
          <Route path="/about" element={<AboutPage />} />
          <Route 
            path="/settings" 
            element={
              <SettingsPage 
                darkMode={darkMode} 
                onToggleTheme={() => setDarkMode(!darkMode)} 
                onClearHistory={handleClearHistory} 
              />
            } 
          />
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
