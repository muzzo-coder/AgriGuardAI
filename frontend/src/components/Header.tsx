import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Leaf, Sun, Moon, Menu, X, Settings, Info, Search, Home } from 'lucide-react';
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
    <header className="fixed top-0 left-0 right-0 z-50 glass-minimal border-b border-black/5 dark:border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Branding */}
        <Link to="/" className="flex items-center gap-3 active:scale-95 transition-transform">
          <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            <Leaf className="text-white w-5 h-5" />
          </div>
          <span className="text-2xl font-bold tracking-tighter text-zinc-900 dark:text-white font-heading">
            AgriGuard<span className="text-emerald-500">.</span>
          </span>
        </Link>
        
        {/* Desktop Nav - Spatial Pill */}
        <nav className="hidden lg:flex items-center gap-1 p-1 bg-white/50 dark:bg-[#121214]/60 backdrop-blur-xl rounded-2xl border border-black/5 dark:border-white/10 shadow-lg shadow-black/5">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => 
                `flex items-center gap-2 px-6 py-2.5 text-xs font-semibold tracking-wide transition-all rounded-xl ${
                  isActive 
                    ? 'text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/10 shadow-sm' 
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-zinc-50 dark:hover:bg-white/5'
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
          <div className="hidden md:flex items-center gap-1 p-1 bg-white/50 dark:bg-[#121214]/60 backdrop-blur-xl rounded-xl border border-black/5 dark:border-white/10">
            {['en', 'hi', 'mr'].map((lng) => (
              <button
                key={lng}
                onClick={() => {
                  i18n.changeLanguage(lng);
                  localStorage.setItem('i18nextLng', lng);
                }}
                className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                  i18n.language.startsWith(lng)
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {lng}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-black/10 dark:bg-white/10 mx-1 hidden md:block"></div>

          {/* Theme Toggle */}
          <button 
            onClick={onToggleTheme}
            className="p-3 bg-white/50 dark:bg-[#121214]/60 backdrop-blur-xl text-zinc-500 hover:text-emerald-500 border border-black/5 dark:border-white/10 rounded-xl shadow-sm transition-all active:scale-95 hidden sm:block"
            aria-label="Toggle Theme"
          >
            {darkMode ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} />}
          </button>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-3 bg-white/50 dark:bg-[#121214]/60 backdrop-blur-xl text-zinc-500 hover:text-emerald-500 border border-black/5 dark:border-white/10 rounded-xl shadow-sm transition-all"
            aria-label="Toggle mobile navigation menu"
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
            className="lg:hidden bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-3xl border-b border-black/5 dark:border-white/10 absolute top-20 left-0 right-0 py-8 px-6 space-y-4 shadow-2xl"
          >
            <div className="grid grid-cols-1 gap-3">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => 
                    `flex items-center gap-5 p-5 text-sm font-bold rounded-2xl transition-all ${
                      isActive 
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl' 
                        : 'text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-[#121214] border border-black/5 dark:border-white/5'
                    }`
                  }
                >
                  {link.icon}
                  {link.label}
                </NavLink>
              ))}
            </div>
            
            <div className="pt-6 mt-4 border-t border-black/5 dark:border-white/10 flex justify-between items-center">
               <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Appearance</span>
               <button 
                onClick={onToggleTheme} 
                className="flex items-center gap-3 px-6 py-3 bg-zinc-50 dark:bg-[#121214] rounded-2xl border border-black/5 dark:border-white/5 font-bold text-xs"
               >
                  {darkMode ? <Sun size={16} className="text-amber-500" /> : <Moon size={16} className="text-emerald-500" />}
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
