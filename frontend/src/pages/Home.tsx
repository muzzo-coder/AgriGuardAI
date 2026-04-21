import React from 'react';
import Hero from '../components/Hero';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, MessageSquare, ShieldCheck, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Home: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="fade-in">
      <Hero />
      
      <section className="page-container -mt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature Card: Detect */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="card-clean p-8 flex flex-col items-start gap-4"
          >
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600">
              <Search size={24} />
            </div>
            <h3 className="text-xl font-bold font-heading">{t('nav_detect_title', { defaultValue: 'Disease Detection' })}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('home_detect_desc', { defaultValue: 'Use our advanced neural network to identify pathologies in seconds.' })}
            </p>
            <Link 
              to="/detect" 
              className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-sm hover:gap-3 transition-all"
            >
              Analyze Leaf <ArrowRight size={16} />
            </Link>
          </motion.div>

          {/* Feature Card: AI Chat */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="card-clean p-8 flex flex-col items-start gap-4"
          >
            <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-xl flex items-center justify-center text-sky-600">
              <MessageSquare size={24} />
            </div>
            <h3 className="text-xl font-bold font-heading">{t('nav_chatbot', { defaultValue: 'AI Assistant' })}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('home_chat_desc', { defaultValue: 'Get personalized organic treatment protocols from our AI expert.' })}
            </p>
            <Link 
              to="/chatbot" 
              className="mt-4 flex items-center gap-2 text-sky-600 font-bold text-sm hover:gap-3 transition-all"
            >
              Consult Assistant <ArrowRight size={16} />
            </Link>
          </motion.div>

          {/* Feature Card: Safety/About */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="card-clean p-8 flex flex-col items-start gap-4"
          >
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-bold font-heading">{t('nav_about', { defaultValue: 'About Project' })}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('home_about_desc', { defaultValue: 'Built at the intersection of Agriculture and Technology for sustainable farming.' })}
            </p>
            <Link 
              to="/about" 
              className="mt-4 flex items-center gap-2 text-amber-600 font-bold text-sm hover:gap-3 transition-all"
            >
              Learn More <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>

        {/* Informational Section */}
        <div className="mt-24 card-clean p-10 md:p-16 flex flex-col md:flex-row items-center gap-12 bg-emerald-700 dark:bg-emerald-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="flex-1 space-y-6 relative z-10">
            <h2 className="text-3xl md:text-5xl font-extrabold font-heading leading-tight">
              Sustainable Protection <br /> for Your Harvest.
            </h2>
            <p className="text-emerald-50 max-w-lg leading-relaxed opacity-90">
              AgriGuard isn't just a detector; it's a dedicated companion for modern farmers. 
              We prioritize organic treatments to help you grow healthy, chemical-free crops.
            </p>
            <Link 
              to="/detect" 
              className="inline-block px-8 py-3 bg-white text-emerald-800 font-bold rounded-xl hover:bg-emerald-50 transition-colors shadow-xl shadow-emerald-950/20"
            >
              Start Free Diagnosis
            </Link>
          </div>
          <div className="flex-1 flex justify-center w-full md:w-auto">
            <div className="w-64 h-64 bg-emerald-600/50 rounded-3xl rotate-12 flex items-center justify-center border border-white/10 shadow-2xl">
              <ShieldCheck className="w-32 h-32 text-white/20 -rotate-12" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
