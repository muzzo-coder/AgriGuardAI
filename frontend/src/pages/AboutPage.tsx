import React from 'react';
import { Leaf, ShieldCheck, Database, Globe2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const AboutPage: React.FC = () => {
  const { t } = useTranslation();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.6, 
        ease: [0.16, 1, 0.3, 1] 
      } 
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, scale: 1.05 }}
      variants={containerVariants}
      className="page-container"
    >
      <div className="max-w-5xl mx-auto space-y-24">
        {/* Professional Header */}
        <motion.div variants={itemVariants} className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 dark:bg-teal-900/30 border border-teal-100 dark:border-teal-800 rounded-full">
            <Leaf size={12} className="text-teal-600 dark:text-teal-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">{t('about_header_badge')}</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black font-heading text-gray-900 dark:text-white leading-[1.05]">
            {t('about_header_title')}
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 leading-relaxed max-w-3xl mx-auto font-medium">
            {t('about_header_desc')}
          </p>
        </motion.div>

        {/* Structured Sections - Triple Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Overview */}
          <motion.div variants={itemVariants} className="card-clinical p-8 space-y-6 flex flex-col">
            <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-600/20">
              <Globe2 size={24} />
            </div>
            <div className="flex-1 space-y-4">
                <h3 className="text-xl font-black font-heading uppercase tracking-tight">{t('about_overview_title')}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-[13px] font-medium">
                  {t('about_overview_desc')}
                </p>
            </div>
          </motion.div>

          {/* Key Features */}
          <motion.div variants={itemVariants} className="card-clinical p-8 space-y-6 flex flex-col">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <Sparkles size={24} />
            </div>
            <div className="flex-1 space-y-4">
                <h3 className="text-xl font-black font-heading uppercase tracking-tight">{t('about_features_title')}</h3>
                <ul className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-1.5 w-1 h-1 rounded-full bg-blue-500 shrink-0" />
                      <span className="text-[13px] text-gray-500 dark:text-gray-400 font-medium leading-tight">{t(`about_features_desc_${i}`)}</span>
                    </li>
                  ))}
                </ul>
            </div>
          </motion.div>

          {/* Our Mission */}
          <motion.div variants={itemVariants} className="card-clinical p-8 space-y-6 flex flex-col">
            <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-600/20">
              <ShieldCheck size={24} />
            </div>
            <div className="flex-1 space-y-4">
                <h3 className="text-xl font-black font-heading uppercase tracking-tight">{t('about_mission_title')}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-[13px] font-medium">
                  {t('about_mission_desc')}
                </p>
            </div>
          </motion.div>
        </div>

        {/* Privacy Note */}
        <motion.div variants={itemVariants} className="p-8 bg-teal-50/30 dark:bg-teal-900/10 rounded-[2.5rem] border border-teal-100/50 dark:border-teal-900/30 flex flex-col md:flex-row items-center gap-8">
            <div className="w-16 h-16 bg-white dark:bg-gray-900 rounded-2xl flex items-center justify-center border border-teal-100 dark:border-teal-800 shrink-0 shadow-sm">
               <Database size={24} className="text-teal-600" />
            </div>
            <div className="text-center md:text-left">
               <h4 className="text-xs font-black text-teal-800 dark:text-teal-400 uppercase tracking-[0.2em] mb-2">{t('about_privacy_title', { defaultValue: 'Sovereign Privacy' })}</h4>
               <p className="text-[13px] text-teal-700/70 dark:text-teal-400/60 leading-relaxed font-medium">
                  {t('about_privacy_desc', { defaultValue: 'Field data remains yours. All diagnostics are processed with data sovereignty in mind. We do not store your private specimens on our servers.' })}
               </p>
            </div>
        </motion.div>

        {/* Final CTA - Premium Emerald Design */}
        <motion.div 
          variants={itemVariants}
          className="relative group p-12 md:p-24 bg-emerald-900 text-white rounded-[4rem] text-center space-y-10 overflow-hidden shadow-[0_20px_50px_rgba(6,78,59,0.2)]"
        >
          {/* Animated Background Orbs - Using Emerald Tokens */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] group-hover:bg-emerald-500/30 transition-all duration-1000" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-200/10 rounded-full blur-[100px] group-hover:bg-emerald-200/20 transition-all duration-1000" />
          
          <div className="relative space-y-10">
              <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-950/40 rotate-3 group-hover:rotate-6 transition-transform duration-500">
                <Leaf size={38} className="text-white" />
              </div>
              
              <div className="space-y-4">
                  <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-none">
                    {t('about_cta_title')}
                  </h2>
                  <p className="text-lg text-emerald-100/80 max-w-xl mx-auto font-medium leading-relaxed">
                    {t('about_cta_desc')}
                  </p>
              </div>

              <div className="pt-4">
                <Link 
                    to="/detect" 
                    className="group/btn relative px-12 py-6 bg-emerald-200 text-emerald-950 font-black rounded-[2rem] transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-4 overflow-hidden"
                >
                  <span className="relative z-10 text-xs uppercase tracking-[0.2em]">{t('about_cta_btn')}</span>
                  <Sparkles size={16} className="relative z-10 group-hover/btn:rotate-12 transition-transform" />
                  <div className="absolute inset-0 bg-white opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                </Link>
              </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AboutPage;
