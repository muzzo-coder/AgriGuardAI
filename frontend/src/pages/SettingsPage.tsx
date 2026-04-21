import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Moon, Sun, Monitor, Languages, Palette, Trash2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

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

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
    { code: 'es', name: 'Español', flag: '🇪🇸' }
  ];

  return (
    <div className="page-container fade-in max-w-4xl">
      <div className="mb-12 space-y-2">
        <h1 className="text-3xl font-extrabold font-heading text-slate-900 dark:text-white">System Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Configure your preferences and manage local field data.</p>
      </div>

      <div className="space-y-8">
        {/* Language Section */}
        <section className="card-clean p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600">
              <Languages size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading">Display Language</h2>
              <p className="text-xs text-slate-400">Select your preferred language for the interface.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  i18n.language.startsWith(lang.code) 
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                    : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <span className="text-sm font-bold">{lang.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Theme Section */}
        <section className="card-clean p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-2 bg-sky-50 dark:bg-sky-900/30 rounded-lg text-sky-600">
              <Palette size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading">Appearance</h2>
              <p className="text-xs text-slate-400">Switch between light and dark modes.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => darkMode && onToggleTheme()}
              className={`flex items-center justify-between p-6 rounded-xl border-2 transition-all ${
                !darkMode 
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                  : 'border-slate-100 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-4">
                <Sun size={20} className={!darkMode ? 'text-emerald-600' : 'text-slate-400'} />
                <span className="font-bold">Light Mode</span>
              </div>
              {!darkMode && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
            </button>

            <button
              onClick={() => !darkMode && onToggleTheme()}
              className={`flex items-center justify-between p-6 rounded-xl border-2 transition-all ${
                darkMode 
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                  : 'border-slate-100 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-4">
                <Moon size={20} className={darkMode ? 'text-emerald-600' : 'text-slate-400'} />
                <span className="font-bold">Dark Mode</span>
              </div>
              {darkMode && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
            </button>
          </div>
        </section>

        {/* Data Management */}
        <section className="card-clean p-8 border-red-100/50 dark:border-red-900/20">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600">
              <AlertCircle size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading text-red-600">Data Management</h2>
              <p className="text-xs text-slate-400">Clear your local field history and preferences.</p>
            </div>
          </div>

          <div className="p-6 bg-red-50/50 dark:bg-red-950/10 rounded-xl border border-red-100 dark:border-red-900/30 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Clear Field History</p>
              <p className="text-xs text-slate-500">This will permanently delete all saved scan results.</p>
            </div>
            <button 
              onClick={onClearHistory}
              className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg font-bold text-xs hover:bg-red-700 transition-all active:scale-95"
            >
              <Trash2 size={14} /> Delete All Data
            </button>
          </div>
        </section>
      </div>

      <div className="mt-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
        AgriGuard v2.1.0 • Built for Sustainable Farming
      </div>
    </div>
  );
};

export default SettingsPage;
