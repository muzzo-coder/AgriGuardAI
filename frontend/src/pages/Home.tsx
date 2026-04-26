import React from 'react';
import Hero from '../components/Hero';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, MessageSquare, ShieldCheck, ArrowRight, Zap, Target, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Home: React.FC = () => {
  const { t } = useTranslation();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, scale: 1.02 }}
      variants={containerVariants}
      className="pb-20"
    >
      <Hero />
      
      <section className="page-container -mt-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature Card: Detect */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -8 }}
            className="card-clean p-10 flex flex-col items-start gap-6 card-hover"
          >
            <div className="w-14 h-14 bg-teal-50 dark:bg-teal-900/20 rounded-2xl flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Search size={28} />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold font-heading">{t('nav_detect_title', { defaultValue: 'Disease Detection' })}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {t('home_detect_desc', { defaultValue: 'Advanced neural analysis to identify crop pathologies with clinical precision.' })}
              </p>
            </div>
            <Link 
              to="/detect" 
              className="mt-4 flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-sm hover:gap-3 transition-all group"
            >
              {t('home_begin_diagnostic', { defaultValue: 'Begin Diagnostic' })} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Feature Card: AI Chat */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -8 }}
            className="card-clean p-10 flex flex-col items-start gap-6 card-hover"
          >
            <div className="w-14 h-14 bg-teal-50 dark:bg-teal-900/20 rounded-2xl flex items-center justify-center text-teal-600 dark:text-teal-400">
              <MessageSquare size={28} />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold font-heading">{t('nav_chatbot', { defaultValue: 'AI Assistant' })}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {t('home_chat_desc', { defaultValue: 'Personalized organic treatment protocols and preventive strategies.' })}
              </p>
            </div>
            <Link 
              to="/chatbot" 
              className="mt-4 flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-sm hover:gap-3 transition-all group"
            >
              {t('home_consult_expert', { defaultValue: 'Consult Expert' })} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Feature Card: Safety/About */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -8 }}
            className="card-clean p-10 flex flex-col items-start gap-6 card-hover"
          >
            <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ShieldCheck size={28} />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold font-heading">{t('nav_about', { defaultValue: 'About Project' })}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {t('home_about_desc', { defaultValue: 'Bridging the gap between AI and sustainable agricultural practices.' })}
              </p>
            </div>
            <Link 
              to="/about" 
              className="mt-4 flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm hover:gap-3 transition-all group"
            >
              {t('home_mission_link', { defaultValue: 'Our Mission' })} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {/* Stats / Proof Section */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="space-y-4">
            <Zap className="mx-auto text-teal-600" size={32} />
            <h4 className="text-3xl font-black font-heading">2.4s</h4>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('stats_speed', { defaultValue: 'Diagnosis Speed' })}</p>
          </div>
          <div className="space-y-4">
            <Target className="mx-auto text-teal-600" size={32} />
            <h4 className="text-3xl font-black font-heading">98.2%</h4>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('stats_accuracy', { defaultValue: 'Prediction Accuracy' })}</p>
          </div>
          <div className="space-y-4">
            <Heart className="mx-auto text-teal-600" size={32} />
            <h4 className="text-3xl font-black font-heading">100%</h4>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('stats_organic', { defaultValue: 'Organic Recommended' })}</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-32 p-12 md:p-20 rounded-[3rem] bg-teal-900 dark:bg-[#0F172A] text-white relative overflow-hidden shadow-2xl shadow-teal-900/20">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[100px] -mr-64 -mt-64" />
          <div className="max-w-3xl relative z-10 space-y-8">
            <h2 className="text-4xl md:text-6xl font-black font-heading leading-[1.1]">
              {t('home_cta_title')}<br />
              {t('home_cta_subtitle')}
            </h2>
            <p className="text-lg text-teal-100/80 leading-relaxed max-w-xl">
              {t('home_cta_desc')}
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link 
                to="/detect" 
                className="px-10 py-4 bg-teal-500 hover:bg-teal-400 text-white font-black rounded-2xl transition-all shadow-lg shadow-teal-950/40 active:scale-95"
              >
                {t('home_scan_now')}
              </Link>
              <Link 
                to="/about" 
                className="px-10 py-4 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl transition-all backdrop-blur-md active:scale-95"
              >
                {t('home_read_docs')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default Home;
