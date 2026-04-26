import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';

const Hero: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="pt-32 pb-16 px-6 overflow-hidden relative">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] bg-teal-50/40 dark:bg-teal-950/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-amber-100/20 dark:bg-amber-900/5 rounded-full blur-[100px] -z-10" />
      
      <div className="max-w-5xl mx-auto text-center relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center"
        >
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 flex items-center gap-2 px-4 py-1.5 bg-white dark:bg-gray-900/40 border border-teal-100 dark:border-teal-900/50 rounded-full shadow-sm"
          >
            <Sparkles size={14} className="text-teal-600 dark:text-teal-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">
              {t('hero_badge', { defaultValue: 'Next-Gen Neural Diagnostics' })}
            </span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-8 font-heading leading-[1.05]">
            {t('hero_title', { defaultValue: 'Protect your crops with Advanced Intelligence' })}
          </h1>
          
          <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed font-medium">
            {t('hero_subtitle', { defaultValue: 'Instantly identify plant leaf diseases using our state-of-the-art neural network. Upload a photo and get precise diagnostics with organic treatment recommendations.' })}
          </p>

          <div className="mt-16 flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
            <span className="w-12 h-px bg-gray-200 dark:bg-gray-800" />
            {t('hero_footer', { defaultValue: 'Empowering Global Soil Health' })}
            <span className="w-12 h-px bg-gray-200 dark:bg-gray-800" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
