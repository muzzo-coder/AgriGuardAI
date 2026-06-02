import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="pt-32 pb-16 px-6 overflow-hidden relative min-h-[85vh] flex items-center justify-center card-3d-wrapper">
      {/* Dynamic 3D Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div 
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[60vw] h-[60vw] max-w-[1000px] max-h-[1000px] bg-emerald-500/10 dark:bg-emerald-500-[0.03] rounded-full blur-[100px] mix-blend-screen"
        />
        <motion.div 
          animate={{ 
            y: [0, -50, 0],
            x: [0, 30, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-[10%] w-[400px] h-[400px] bg-teal-500/10 dark:bg-teal-500/[0.04] rounded-full blur-[80px]"
        />
        
        {/* Floating Glass Panels for Spatial Depth */}
        <motion.div
          animate={{ y: [-20, 20, -20], rotateX: [10, -5, 10], rotateY: [-10, 5, -10] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] left-[5%] w-64 h-80 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-3xl hidden lg:block shadow-2xl shadow-black/20"
        />
        <motion.div
          animate={{ y: [20, -20, 20], rotateX: [-10, 5, -10], rotateY: [10, -5, 10] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[20%] right-[5%] w-72 h-64 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-3xl hidden lg:block shadow-2xl shadow-black/20"
        />
      </div>
      
      <div className="max-w-5xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center"
        >
          {/* Spatial Badge */}
          <motion.div 
            whileHover={{ scale: 1.05, y: -2 }}
            className="mb-10 flex items-center gap-3 px-5 py-2 bg-white/50 dark:bg-[#121214]/60 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-full shadow-lg shadow-black/5"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-widest uppercase text-zinc-800 dark:text-zinc-200">
              {t('hero_badge', { defaultValue: 'Next-Gen Neural Diagnostics' })}
            </span>
          </motion.div>

          <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-500 tracking-tighter mb-8 font-heading leading-[1.02] drop-shadow-sm">
            {t('hero_title', { defaultValue: 'Protect crops with Advanced Intelligence' })}
          </h1>
          
          <p className="text-lg md:text-2xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto leading-relaxed font-normal mb-12">
            {t('hero_subtitle', { defaultValue: 'Instantly identify plant leaf diseases using our state-of-the-art neural network. Upload a photo and get precise diagnostics with organic treatment recommendations.' })}
          </p>

          <Link
            to="/detect"
            className="inline-flex px-10 py-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-2xl font-bold tracking-wide shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-98 transition-all duration-300 text-lg items-center gap-3"
          >
            <Sparkles size={20} />
            Start Analysis
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
