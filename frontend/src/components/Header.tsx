import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Leaf, Sun, Moon, Globe, Activity, Menu, X, Settings, Info, MessageSquare, Search, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  darkMode: boolean;
  onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ darkMode, onToggleTheme }) => {
  const { t, i18n } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
    { code: 'es', name: 'Español', flag: '🇪🇸' }
  ];

  const navLinks = [
    { to: '/', label: 'Home', icon: <Home size={14} /> },
    { to: '/detect', label: 'Detect', icon: <Search size={14} /> },
    { to: '/chatbot', label: 'Chatbot', icon: <MessageSquare size={14} /> },
    { to: '/about', label: 'About', icon: <Info size={14} /> },
    { to: '/settings', label: 'Settings', icon: <Settings size={14} /> },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-minimal">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Organic Branding */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/10 group-hover:scale-110 transition-transform">
            <Leaf className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
            AgriGuard<span className="text-emerald-500">.</span>
          </span>
        </Link>
        
        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => 
                `flex items-center gap-2 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest transition-all rounded-lg ${
                  isActive 
                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600'
                }`
              }
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Quick Support Status */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-full border border-slate-100 dark:border-slate-800 uppercase tracking-widest">
            <Activity size={12} className="text-emerald-500" />
            <span className="text-[9px] font-black text-slate-400">{t('ai_core_online')}</span>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>

          {/* Theme Toggle - Desktop */}
          <button 
            onClick={onToggleTheme}
            className="p-2 text-slate-500 hover:text-emerald-600 transition-all active:scale-95 hidden sm:block"
            aria-label="Toggle Theme"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-slate-500 hover:text-emerald-600 transition-all"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 absolute top-16 left-0 right-0 py-6 px-6 space-y-4 shadow-xl fade-in">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => 
                `flex items-center gap-4 p-4 text-sm font-bold rounded-xl transition-all ${
                  isActive 
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`
              }
            >
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center border border-slate-100 dark:border-slate-800">
                {link.icon}
              </div>
              {link.label}
            </NavLink>
          ))}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Theme</span>
             <button onClick={onToggleTheme} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                {darkMode ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-slate-600" />}
             </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
