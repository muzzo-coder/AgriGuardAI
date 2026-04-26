import React from 'react';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, Languages, Palette, Trash2, ShieldAlert, CheckCircle2, RotateCcw, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

interface SettingsPageProps {
  darkMode: boolean;
  onToggleTheme: () => void;
  onClearHistory: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ 
  darkMode, 
  onToggleTheme,
  onClearHistory
}) => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  const handleResetAll = () => {
    if (window.confirm(t('settings_reset_confirm') || 'Are you sure you want to reset all settings and history?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'mr', name: 'Marathi', native: 'मराठी' }
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        staggerChildren: 0.1 
      }
    }
  };

  const sectionVariants: Variants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-4xl mx-auto px-6 py-12 pb-32"
    >
      {/* Header Section */}
      <section className="mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 rounded-full">
           <Palette size={12} className="text-teal-600 dark:text-teal-400" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">
             {t('settings_badge')}
           </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black font-heading text-gray-900 dark:text-white">
          {t('settings_title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl">
          {t('settings_subtitle')}
        </p>
      </section>

      <div className="space-y-12">
        {/* Localization Section */}
        <motion.section variants={sectionVariants} className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
              <Languages size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading">{t('settings_lang_title')}</h2>
              <p className="text-sm text-gray-400 font-medium">{t('settings_lang_subtitle')}</p>
            </div>
          </div>

          <div className="card-clinical divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
            {languages.map((lang) => {
              const isActive = i18n.language.startsWith(lang.code);
              return (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all text-left"
                >
                  <div className="flex flex-col">
                    <span className={`text-sm font-black tracking-tight ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      {lang.native}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{lang.name}</span>
                  </div>
                  {isActive && (
                    <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 size={14} className="text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-400 font-medium leading-relaxed italic px-2">
            * Selective localization ensures the interface remains professional and optimized for all supported regions.
          </p>
        </motion.section>

        {/* Interface Section */}
        <motion.section variants={sectionVariants} className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800">
              <Monitor size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading">{t('settings_appearance_title')}</h2>
              <p className="text-sm text-gray-400 font-medium">{t('settings_appearance_subtitle')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => darkMode && onToggleTheme()}
              className={`flex items-center gap-6 p-6 rounded-3xl border-2 transition-all ${
                !darkMode 
                  ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/20 ring-4 ring-teal-500/5' 
                  : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 hover:border-gray-200 dark:hover:border-gray-700'
              }`}
            >
              <div className={`p-4 rounded-2xl ${!darkMode ? 'bg-teal-500 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                <Sun size={24} />
              </div>
              <div className="text-left">
                <p className={`font-black tracking-tight ${!darkMode ? 'text-teal-900 dark:text-teal-100' : 'text-gray-500'}`}>{t('settings_light_mode')}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('settings_light_subtitle')}</p>
              </div>
            </button>

            <button
              onClick={() => !darkMode && onToggleTheme()}
              className={`flex items-center gap-6 p-6 rounded-3xl border-2 transition-all ${
                darkMode 
                  ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/20 ring-4 ring-teal-500/5' 
                  : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 hover:border-gray-200 dark:hover:border-gray-700'
              }`}
            >
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-teal-500 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                <Moon size={24} />
              </div>
              <div className="text-left">
                <p className={`font-black tracking-tight ${darkMode ? 'text-teal-900 dark:text-teal-100' : 'text-gray-500'}`}>{t('settings_dark_mode')}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('settings_dark_subtitle')}</p>
              </div>
            </button>
          </div>
        </motion.section>

        {/* System & Data Section */}
        <motion.section variants={sectionVariants} className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading">{t('settings_data_title')}</h2>
              <p className="text-sm text-gray-400 font-medium">{t('settings_data_subtitle')}</p>
            </div>
          </div>

          <div className="card-clinical p-8 space-y-10">
            {/* Clear History */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 py-2">
              <div className="space-y-1 text-center md:text-left">
                <p className="text-lg font-black tracking-tight text-gray-900 dark:text-white">{t('settings_clear_history')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                  {t('settings_clear_desc')}
                </p>
              </div>
              <button 
                onClick={onClearHistory}
                className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] border border-red-100 dark:border-red-900/30 hover:bg-red-600 hover:text-white transition-all active:scale-95 whitespace-nowrap"
              >
                <Trash2 size={14} /> {t('settings_clear_btn')}
              </button>
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

            {/* Force Reset */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 py-2">
              <div className="space-y-1 text-center md:text-left">
                <p className="text-lg font-black tracking-tight text-gray-900 dark:text-white">{t('settings_reset_title')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                  {t('settings_reset_desc')}
                </p>
              </div>
              <button 
                onClick={handleResetAll}
                className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] border border-amber-100 dark:border-amber-900/30 hover:bg-amber-600 hover:text-white transition-all active:scale-95 whitespace-nowrap"
              >
                <RotateCcw size={14} /> {t('settings_reset_btn')}
              </button>
            </div>
          </div>
        </motion.section>
      </div>

      <footer className="mt-32 pt-12 border-top border-gray-100 dark:border-gray-800 text-center space-y-4">
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">
          {t('settings_version')}
        </div>
        <p className="text-[9px] text-gray-300 dark:text-gray-700 font-bold uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
            {t('settings_license')}
        </p>
      </footer>
    </motion.div>
  );
};

export default SettingsPage;
