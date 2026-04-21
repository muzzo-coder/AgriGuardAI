import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  darkMode: boolean;
  onToggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({ darkMode, onToggleTheme }) => {
  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 selection:bg-emerald-500/10 selection:text-emerald-900 dark:selection:text-emerald-200 transition-colors duration-500">
      <Header darkMode={darkMode} onToggleTheme={onToggleTheme} />
      
      {/* Spacer for fixed Header */}
      <div className="h-16" />
      
      <main className="relative min-h-[calc(100vh-16rem)] flex flex-col">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default Layout;
