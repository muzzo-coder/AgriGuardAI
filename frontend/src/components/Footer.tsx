import React from 'react';
import { Leaf, Globe, Share2, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-2 space-y-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Leaf className="text-white w-4 h-4" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
                AgriGuard<span className="text-emerald-500">.</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
              Advancing sustainable agriculture through clinical-grade neural diagnostics and organic treatment intelligence.
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors">
                <Share2 size={18} />
              </a>
              <a href="#" className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors">
                <Globe size={18} />
              </a>
              <a href="#" className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors">
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Platform</h4>
            <ul className="space-y-3">
              <li><Link to="/" className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-widest">Dashboard</Link></li>
              <li><Link to="/detect" className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-widest">Disease Scans</Link></li>
              <li><Link to="/chatbot" className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-widest">AI Consultant</Link></li>
              <li><Link to="/settings" className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-widest">Preferences</Link></li>
            </ul>
          </div>

          {/* Resources Links */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Resources</h4>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-widest">Scientific Basis</Link></li>
              <li><a href="#" className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-widest">Privacy Policy</a></li>
              <li><a href="#" className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-widest">API Documentation</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            © {currentYear} AgriGuard Neural Systems. Global Laboratory Standards.
          </p>
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-full border border-emerald-100 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">V2.1 Production-Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
