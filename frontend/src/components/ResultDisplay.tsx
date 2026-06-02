import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ShieldCheck, ClipboardList, Info, Download, Loader2, Stethoscope, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

interface ResultDisplayProps {
  result: any;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  const { t } = useTranslation();
  const [isDownloading, setIsDownloading] = useState(false);

  if (!result || !result.diagnosis) return null;

  const { diagnosis } = result;
  
  const isHealthy = diagnosis.disease?.toLowerCase().includes('healthy');
  const confidenceValue = parseFloat(String(diagnosis.confidence || '0').replace('%', ''));

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      const response = await api.post('/api/export/pdf', result, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Agriguard_AI_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
    } catch (err) {
      console.error("Failed to download PDF report:", err);
      alert("Failed to download PDF report. Falling back to print version.");
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.8, 
        ease: [0.16, 1, 0.3, 1], 
        staggerChildren: 0.15 
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: {
            duration: 0.6,
            ease: "easeOut"
        }
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-6xl mx-auto px-4 sm:px-0 pb-24 relative z-30 perspective-[2000px]"
    >
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: #111 !important; }
          .card-clean { border: 1px solid #eee !important; box-shadow: none !important; margin: 0 !important; }
        }
      `}</style>
      
      <div className="card-clean p-10 md:p-14 relative overflow-hidden transform-gpu transform-style-3d">
        {/* Subtle Ambient Background Light */}
        <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none mix-blend-screen opacity-20 ${isHealthy ? 'bg-emerald-500' : 'bg-emerald-500'}`} />

        {/* Report Identification */}
        <div className="absolute top-0 right-0 p-8 flex flex-col items-end opacity-30 pointer-events-none">
            <div className="text-[9px] font-semibold uppercase tracking-widest text-zinc-500">{t('report_title')}</div>
            <div className="text-[9px] font-semibold uppercase tracking-widest text-zinc-500 mt-1">ID: {Math.random().toString(36).substring(7).toUpperCase()}</div>
        </div>

        {/* Header Section - 3D Layered */}
        <div className="flex flex-col lg:flex-row gap-12 border-b border-black/5 dark:border-white/10 pb-12 mb-12 relative z-10">
          <div className="flex-1 space-y-8">
            <div className="space-y-6">
                <motion.div variants={itemVariants} className={`inline-flex items-center gap-3 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm ${isHealthy ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'}`}>
                    <Activity size={14} />
                    {t('result_lab_diagnostic', { defaultValue: 'Verified Diagnostic Result' })}
                </motion.div>
                <motion.h2 variants={itemVariants} className={`text-5xl md:text-7xl font-bold tracking-tighter leading-[1.05] ${isHealthy ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-white'}`}>
                {diagnosis.disease}
                </motion.h2>
            </div>

            <motion.div variants={itemVariants} className="space-y-4 max-w-md bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-inner">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{t('result_confidence', { defaultValue: 'Confidence Index' })}</span>
                    <span className={`text-xs font-bold uppercase tracking-widest ${isHealthy ? 'text-emerald-600 dark:text-emerald-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{diagnosis.confidence} Precision</span>
                </div>
               <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${confidenceValue}%` }}
                    transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1], delay: 0.5 }}
                    className={`h-full rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] ${isHealthy ? 'bg-emerald-500' : 'bg-emerald-500'}`}
                  />
               </div>
            </motion.div>
          </div>
          
          <motion.div variants={itemVariants} className={`lg:w-[450px] bg-zinc-50/80 dark:bg-[#121214]/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-black/5 dark:border-white/10 space-y-6 shadow-2xl ${isHealthy ? 'shadow-emerald-500/5' : 'shadow-emerald-500/5'}`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-black/5 dark:border-white/5">
                <ClipboardList size={20} className={isHealthy ? 'text-emerald-600 dark:text-emerald-400' : 'text-emerald-600 dark:text-emerald-400'} />
              </div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest">{t('result_cause', { defaultValue: 'Primary Cause' })}</h4>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
              {diagnosis.cause}
            </p>
          </motion.div>
        </div>

        {/* Clinical Protocols */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 relative z-10">
          <motion.div variants={itemVariants} className="space-y-6 group perspective-[1000px]">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl shadow-lg border flex items-center justify-center transition-transform duration-500 group-hover:translate-z-10 ${isHealthy ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20'}`}>
                <Stethoscope className={`w-6 h-6 ${isHealthy ? 'text-emerald-600 dark:text-emerald-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
              </div>
              <div>
                  <h4 className="font-bold text-zinc-900 dark:text-white tracking-tight text-lg">{t('result_treatment', { defaultValue: 'Recovery Protocol' })}</h4>
              </div>
            </div>
            <div className="p-8 bg-zinc-50 dark:bg-[#121214] border border-black/5 dark:border-white/5 rounded-3xl text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium shadow-inner transition-all duration-500 group-hover:border-emerald-500/30 group-hover:bg-white dark:group-hover:bg-[#18181b]">
              {diagnosis.treatment}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-6 group perspective-[1000px]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 shadow-lg border border-black/5 dark:border-white/5 flex items-center justify-center transition-transform duration-500 group-hover:translate-z-10">
                <ShieldCheck className="text-zinc-600 dark:text-zinc-400 w-6 h-6" />
              </div>
              <div>
                  <h4 className="font-bold text-zinc-900 dark:text-white tracking-tight text-lg">{t('result_prevention', { defaultValue: 'Prevention Shield' })}</h4>
              </div>
            </div>
            <div className="p-8 bg-zinc-50 dark:bg-[#121214] border border-black/5 dark:border-white/5 rounded-3xl text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium shadow-inner transition-all duration-500 group-hover:border-zinc-300 dark:group-hover:border-zinc-700 group-hover:bg-white dark:group-hover:bg-[#18181b]">
              {diagnosis.prevention}
            </div>
          </motion.div>
        </div>

        {/* Report Footer */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-between gap-10 pt-10 border-t border-black/5 dark:border-white/10 relative z-10">
          <div className="flex items-start gap-4 max-w-lg">
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-500">
                <Info size={16} />
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold leading-relaxed uppercase tracking-widest mt-1">
              {t('report_disclaimer')}
            </p>
          </div>

          <div className="flex items-center gap-4 no-print shrink-0">
              <button 
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="btn-primary py-4 px-8 text-xs font-bold uppercase tracking-widest flex items-center gap-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isDownloading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Download Report
                  </>
                )}
              </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ResultDisplay;
