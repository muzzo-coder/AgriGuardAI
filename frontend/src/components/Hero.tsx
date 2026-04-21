import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Sprout } from 'lucide-react';

const Hero: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="pt-32 pb-20 px-6 overflow-hidden relative">
      {/* Natural Background Element */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-emerald-50/50 dark:bg-emerald-950/5 rounded-full blur-3xl -z-10" />
      
      <div className="max-w-4xl mx-auto text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          {/* Subtle Healthcare-Agri Icon */}
          <div className="mb-10 p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-800">
            <Sprout className="text-emerald-500 w-8 h-8" />
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-8 font-heading leading-[1.1]">
            Plant Disease Detection <br />
            <span className="text-emerald-600">& Care Assistant</span>
          </h1>
          
          <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
            Professional-grade diagnostics powered by neural analysis. 
            Identify pathologies instantly and receive <span className="text-emerald-600 dark:text-emerald-400 font-bold">certified organic treatment protocols</span> to protect your crops naturally.
          </p>

          <div className="mt-12 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <span className="w-8 h-px bg-slate-200 dark:bg-slate-800" />
            Empowering Sustainable Agriculture
            <span className="w-8 h-px bg-slate-200 dark:bg-slate-800" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
