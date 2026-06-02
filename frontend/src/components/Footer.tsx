import React from 'react';
import { Leaf, Share2, Globe, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
  const { t } = useTranslation();

  const footerSections = [
    {
      title: t('footer_quick_links'),
      links: [
        { label: t('nav_home'), to: '/' },
        { label: t('nav_detect'), to: '/detect' },
        { label: t('nav_about'), to: '/about' }
      ]
    },
    {
      title: t('footer_features'),
      links: [
        { label: t('footer_feature_detection'), to: '/detect' },
        { label: t('footer_feature_organic'), to: '/detect' }
      ]
    }
  ];

  return (
    <footer className="bg-white dark:bg-[#09090b] border-t border-black/5 dark:border-white/5 pt-24 pb-12 px-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/10 dark:bg-emerald-500/[0.02] rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16">
          {/* Column 1: Brand Section */}
          <div className="space-y-8">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <Leaf className="text-white w-6 h-6" />
              </div>
              <span className="text-3xl font-bold tracking-tighter text-zinc-900 dark:text-white font-heading">
                AgriGuard<span className="text-emerald-500">.</span>
              </span>
            </Link>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium max-w-xs">
              {t('footer_brand_tagline')}
            </p>
            <div className="flex gap-4 pt-2">
               <a href="https://www.linkedin.com/in/mujjamil-sofi/" target="_blank" rel="noopener noreferrer" className="p-3 bg-zinc-50 dark:bg-[#121214] border border-black/5 dark:border-white/5 rounded-xl text-zinc-400 hover:text-emerald-500 hover:border-emerald-500/30 transition-all shadow-sm">
                 <Share2 size={18} />
               </a>
               <a href="#" className="p-3 bg-zinc-50 dark:bg-[#121214] border border-black/5 dark:border-white/5 rounded-xl text-zinc-400 hover:text-emerald-500 hover:border-emerald-500/30 transition-all shadow-sm">
                 <Globe size={18} />
               </a>
            </div>
          </div>

          {/* Quick Links & Features */}
          {footerSections.map((section, idx) => (
            <div key={idx} className="space-y-6">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">
                {section.title}
              </h4>
              <ul className="space-y-4">
                {section.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <Link to={link.to} className="text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all hover:translate-x-1 inline-block">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Column 4: Contact & Tech */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">
              {t('footer_contact')}
            </h4>
            <div className="space-y-4">
               <div className="p-5 bg-zinc-50 dark:bg-[#121214] border border-black/5 dark:border-white/5 rounded-2xl space-y-2">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('footer_dev_name')}</p>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">Mujjamil Sofi</p>
               </div>
               <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                  <Activity size={16} className="text-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                    {t('footer_status_operational')}
                  </span>
               </div>
            </div>
          </div>
        </div>

        <div className="mt-24 pt-8 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
               {t('footer_rights')}
            </p>
            <div className="flex gap-6">
               <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest cursor-pointer hover:text-emerald-500 transition-colors">Privacy Policy</span>
               <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest cursor-pointer hover:text-emerald-500 transition-colors">Terms of Service</span>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
