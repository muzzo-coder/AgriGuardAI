import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Leaf, Sun, Moon, Menu, X, Settings, Info, MessageSquare, Search, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  darkMode: boolean;
  onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ darkMode, onToggleTheme }) => {
  const { t, i18n } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: t('nav_home', { defaultValue: 'Home' }), icon: <Home size={14} /> },
    { to: '/detect', label: t('nav_detect', { defaultValue: 'Detect' }), icon: <Search size={14} /> },
    { to: '/about', label: t('nav_about', { defaultValue: 'About' }), icon: <Info size={14} /> },
    { to: '/settings', label: t('nav_settings', { defaultValue: 'Settings' }), icon: <Settings size={14} /> },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-minimal">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Branding */}
        <Link to="/" className="flex items-center gap-3 active:scale-95 transition-transform">
          <div className="w-10 h-10 bg-teal-700 dark:bg-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-900/10">
            <Leaf className="text-white w-5 h-5" />
          </div>
          <span className="text-2xl font-black tracking-tight text-gray-900 dark:text-white font-heading">
            AgriGuard<span className="text-teal-500">.</span>
          </span>
        </Link>
        
        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-2 p-1.5 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-800">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => 
                `flex items-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] transition-all rounded-xl ${
                  isActive 
                    ? 'text-teal-700 dark:text-teal-400 bg-white dark:bg-gray-900 shadow-sm border border-teal-100 dark:border-teal-800' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-teal-600'
                }`
              }
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4">

          {/* Language Switcher */}
          <div className="hidden md:flex items-center gap-1 p-1 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800">
            {['en', 'hi', 'mr'].map((lng) => (
              <button
                key={lng}
                onClick={() => {
                  i18n.changeLanguage(lng);
                  localStorage.setItem('i18nextLng', lng);
                }}
                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
                  i18n.language.startsWith(lng)
                    ? 'bg-white dark:bg-gray-900 text-teal-700 dark:text-teal-400 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                }`}
              >
                {lng}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 mx-1 hidden md:block"></div>

          {/* Theme Toggle */}
          <button 
            onClick={onToggleTheme}
            className="p-3 bg-white dark:bg-gray-900 text-gray-500 hover:text-teal-600 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm transition-all active:scale-95 hidden sm:block"
            aria-label="Toggle Theme"
          >
            {darkMode ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} />}
          </button>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-3 bg-white dark:bg-gray-900 text-gray-500 hover:text-teal-600 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm transition-all"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl border-b border-gray-100 dark:border-gray-800 absolute top-20 left-0 right-0 py-8 px-6 space-y-4 shadow-2xl"
          >
            <div className="grid grid-cols-1 gap-3">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => 
                    `flex items-center gap-5 p-5 text-sm font-black rounded-2xl transition-all ${
                      isActive 
                        ? 'bg-teal-700 text-white shadow-lg shadow-teal-900/20' 
                        : 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800'
                    }`
                  }
                >
                  {link.icon}
                  {link.label}
                </NavLink>
              ))}
            </div>
            
            <div className="pt-6 mt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
               <span className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Appearance</span>
               <button 
                onClick={onToggleTheme} 
                className="flex items-center gap-3 px-6 py-3 bg-gray-50 dark:bg-gray-900/60 rounded-2xl border border-gray-100 dark:border-gray-800 font-bold text-xs"
               >
                  {darkMode ? <Sun size={16} className="text-amber-500" /> : <Moon size={16} className="text-teal-600" />}
                  {darkMode ? 'Light' : 'Dark'}
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
