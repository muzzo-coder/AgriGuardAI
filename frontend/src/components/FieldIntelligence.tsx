import React from 'react';
import { AlertCircle, CheckCircle2, Info, Waves, Zap, ShieldCheck, Activity, Sprout } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface FieldIntelligenceProps {
  prediction?: any;
}

const FieldIntelligence: React.FC<FieldIntelligenceProps> = ({ prediction }) => {
  const { t } = useTranslation();

  const getUrgencyData = (severity: string) => {
    const s = severity?.toLowerCase();
    if (s === 'critical' || s === 'high') {
      return {
        label: 'High Urgency',
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-950/20',
        border: 'border-red-100 dark:border-red-900/40',
        icon: <Zap size={14} className="fill-current" />
      };
    }
    if (s === 'medium') {
      return {
        label: 'Medium Risk',
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-950/20',
        border: 'border-amber-100 dark:border-amber-900/40',
        icon: <AlertCircle size={14} />
      };
    }
    return {
      label: 'Monitoring',
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-50 dark:bg-teal-950/20',
      border: 'border-teal-100 dark:border-teal-900/40',
      icon: <ShieldCheck size={14} />
    };
  };

  const urgency = getUrgencyData(prediction?.severity);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-clean p-8 shadow-clinical border-gray-100/50 dark:border-gray-800/30 glass-minimal backdrop-blur-3xl overflow-hidden relative"
    >
      {/* Decorative Background Elements */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-teal-500/10 rounded-full blur-[60px] pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-[60px] pointer-events-none" />

      <div className="flex flex-col gap-8 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/20 rounded-2xl flex items-center justify-center border border-teal-100/50 dark:border-teal-800/50 shadow-inner">
                  <Waves size={18} className="text-teal-600 dark:text-teal-400" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] font-heading">{t('intel_badge')}</h3>
                <span className="text-[8px] font-bold text-teal-600/60 dark:text-teal-400/50 uppercase tracking-[0.1em]">{t('intel_subtitle')}</span>
              </div>
          </div>
          
          <AnimatePresence mode="wait">
            {prediction && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${urgency.bg} ${urgency.color} ${urgency.border} text-[9px] font-black uppercase tracking-widest shadow-lg shadow-teal-900/5`}
              >
                {urgency.icon}
                {urgency.label}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!prediction ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
             <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900/50 rounded-full flex items-center justify-center border border-dashed border-gray-200 dark:border-gray-800">
                <Activity size={24} className="text-gray-300 animate-pulse" />
             </div>
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
               {t('intel_waiting')}
             </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="p-5 bg-white/40 dark:bg-gray-900/60 rounded-3xl border border-gray-100 dark:border-gray-800">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">{t('intel_urgency')}</span>
                  <span className={`text-sm font-black ${urgency.color}`}>{prediction.severity || 'Normal'}</span>
               </div>
               <div className="p-5 bg-white/40 dark:bg-gray-900/60 rounded-3xl border border-gray-100 dark:border-gray-800">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Source Confidence</span>
                  <span className="text-sm font-black text-gray-900 dark:text-white">{(prediction.confidence * 100).toFixed(1)}%</span>
               </div>
            </div>

            <div className="p-6 bg-teal-500/5 dark:bg-teal-400/5 rounded-[2rem] border border-teal-500/10 dark:border-teal-400/10 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-teal-500/20" />
              <div className="space-y-3">
                 <div className="flex items-center gap-2">
                    <Sprout size={14} className="text-teal-600 dark:text-teal-400" />
                    <span className="text-[9px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest">{t('intel_recommendation')}</span>
                 </div>
                 <p className="text-[12px] text-gray-600 dark:text-gray-300 leading-relaxed font-bold">
                    {prediction.severity?.toLowerCase() === 'low' 
                      ? 'No immediate chemical application required. Continue biological monitoring.' 
                      : 'Immediate preventative protocol deployment recommended to safeguard yield.'}
                 </p>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Info size={12} /> {t('intel_next_steps')}
              </span>
              <ul className="grid grid-cols-1 gap-2">
                {[
                  'Isolate infected specimen zones',
                  'Calibrate automated irrigation humidity',
                  'Apply organic surfactant solutions'
                ].map((step, i) => (
                  <li key={i} className="flex items-center gap-3 px-4 py-3 bg-gray-50/50 dark:bg-gray-900/30 rounded-xl border border-gray-100 dark:border-gray-800 text-[11px] font-medium text-gray-500 dark:text-gray-400 transition-all hover:bg-white dark:hover:bg-gray-800">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500/40" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FieldIntelligence;
