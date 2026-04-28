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
    <footer className="bg-gray-50 dark:bg-[#080D18] border-t border-gray-100 dark:border-gray-900 pt-20 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16">
          {/* Column 1: Brand Section */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-600 rounded-2xl flex items-center justify-center">
                <Leaf className="text-white w-5 h-5" />
              </div>
              <span className="text-2xl font-black tracking-tight text-gray-900 dark:text-white font-heading">
                AgriGuard<span className="text-teal-500">.</span>
              </span>
            </Link>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium max-w-xs">
              {t('footer_brand_tagline')}
            </p>
            <div className="flex gap-4 pt-2">
               <a href="https://www.linkedin.com/in/mujjamil-sofi/" target="_blank" rel="noopener noreferrer" className="p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-gray-400 hover:text-teal-600 hover:border-teal-100 transition-all shadow-sm">
                 <Share2 size={18} />
               </a>
               <a href="#" className="p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-gray-400 hover:text-teal-600 hover:border-teal-100 transition-all shadow-sm">
                 <Globe size={18} />
               </a>
            </div>
          </div>

          {/* Quick Links & Features */}
          {footerSections.map((section, idx) => (
            <div key={idx} className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-600 dark:text-teal-400/60">
                {section.title}
              </h4>
              <ul className="space-y-4">
                {section.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <Link to={link.to} className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-teal-600 transition-all hover:translate-x-1 inline-block">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Column 4: Contact & Tech */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-600 dark:text-teal-400/60">
              {t('footer_contact')}
            </h4>
            <div className="space-y-4">
               <div className="p-4 bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('footer_dev_name')}</p>
                  <p className="text-xs font-black text-gray-700 dark:text-gray-300">Mujjamil Sofi</p>
               </div>
               <div className="p-4 bg-teal-500/5 border border-teal-500/10 rounded-2xl flex items-center gap-3">
                  <Activity size={14} className="text-teal-500 animate-pulse" />
                  <span className="text-[9px] font-black text-teal-700 dark:text-teal-400 uppercase tracking-widest">
                    {t('footer_status_operational')}
                  </span>
               </div>
            </div>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-gray-100 dark:border-gray-900 flex flex-col sm:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
               {t('footer_rights')}
            </p>
            <div className="flex gap-6">
               <span className="text-[9px] font-bold text-gray-300 dark:text-gray-700 uppercase tracking-widest">Privacy Policy</span>
               <span className="text-[9px] font-bold text-gray-300 dark:text-gray-700 uppercase tracking-widest">Terms of Service</span>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
