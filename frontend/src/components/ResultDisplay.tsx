import React from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ShieldCheck, ClipboardList, Info, Download, Stethoscope, Microscope } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ResultDisplayProps {
  result: any;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  const { t } = useTranslation();
  if (!result || !result.diagnosis) return null;

  const { diagnosis } = result;
  
  const isHealthy = diagnosis.disease?.toLowerCase().includes('healthy');
  const confidenceValue = parseFloat(String(diagnosis.confidence || '0').replace('%', ''));


  const handlePrint = () => {
    window.print();
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6, 
        ease: [0.16, 1, 0.3, 1], 
        staggerChildren: 0.1 
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: {
            duration: 0.4,
            ease: "easeOut"
        }
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-6xl mx-auto px-4 sm:px-0 pb-20"
    >
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: #111 !important; }
          .card-clean { border: 1px solid #eee !important; box-shadow: none !important; margin: 0 !important; }
          .glass-minimal { display: none !important; }
        }
      `}</style>
      
      <div className="card-clean p-12 md:p-16 relative overflow-hidden bg-white dark:bg-[#0F172A]">
        {/* Report Identification */}
        <div className="absolute top-0 right-0 p-8 flex flex-col items-end opacity-20 pointer-events-none">
            <div className="text-[10px] font-black uppercase tracking-[0.4em]">{t('report_title')}</div>
            <div className="text-[10px] font-black uppercase tracking-[0.4em] mt-1">Report ID: {Math.random().toString(36).substring(7).toUpperCase()}</div>
        </div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-12 border-b border-gray-100 dark:border-gray-800 pb-12 mb-12">
          <div className="flex-1 space-y-8">
            <div className="space-y-4">
                <div className={`inline-flex items-center gap-3 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${isHealthy ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40' : 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border-teal-100 dark:border-teal-900/40'}`}>
                    <Microscope size={12} />
                    {t('result_lab_diagnostic', { defaultValue: 'Verified Diagnostic Result' })}
                </div>
                <h2 className={`text-4xl md:text-6xl font-black font-heading tracking-tight leading-[1.1] ${isHealthy ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                {diagnosis.disease}
                </h2>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between max-w-sm">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('result_confidence', { defaultValue: 'Confidence Index' })}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isHealthy ? 'text-emerald-600 dark:text-emerald-400' : 'text-teal-600 dark:text-teal-400'}`}>{diagnosis.confidence} Precision</span>
                </div>
               <div className="w-full max-w-sm h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden p-0.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${confidenceValue}%` }}
                    transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
                    className={`h-full rounded-full shadow-md ${isHealthy ? 'bg-emerald-500' : 'bg-teal-500'}`}
                  />
               </div>
            </div>
          </div>
          
          <motion.div variants={itemVariants} className={`md:w-96 bg-gray-50 dark:bg-gray-900/50 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 space-y-6 ${isHealthy && 'border-emerald-100/50 dark:border-emerald-900/30'}`}>
            <div className="flex items-center gap-3">
              <ClipboardList size={18} className={isHealthy ? 'text-emerald-600 dark:text-emerald-400' : 'text-teal-600 dark:text-teal-400'} />
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">{t('result_cause', { defaultValue: 'Primary Cause' })}</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
              {diagnosis.cause}
            </p>
          </motion.div>
        </div>

        {/* Clinical Protocols */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-[1.25rem] shadow-sm border flex items-center justify-center ${isHealthy ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800' : 'bg-teal-50 dark:bg-teal-900/20 border-teal-100 dark:border-teal-800'}`}>
                <Stethoscope className={`w-6 h-6 ${isHealthy ? 'text-emerald-600 dark:text-emerald-400' : 'text-teal-600 dark:text-teal-400'}`} />
              </div>
              <div>
                  <h4 className="font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight text-base font-heading">{t('result_treatment', { defaultValue: 'Recovery Protocol' })}</h4>
              </div>
            </div>
            <div className="p-8 bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-[2rem] text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium shadow-inner">
              {diagnosis.treatment}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[1.25rem] bg-amber-50 dark:bg-amber-900/20 shadow-sm border border-amber-100 dark:border-amber-800 flex items-center justify-center">
                <ShieldCheck className="text-amber-600 dark:text-amber-400 w-6 h-6" />
              </div>
              <div>
                  <h4 className="font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight text-base font-heading">{t('result_prevention', { defaultValue: 'Prevention Shield' })}</h4>
              </div>
            </div>
            <div className="p-8 bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-[2rem] text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium shadow-inner">
              {diagnosis.prevention}
            </div>
          </motion.div>
        </div>

        {/* Report Footer */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-between gap-10 pt-10 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-start gap-4 max-w-lg">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-500">
                <Info size={16} />
            </div>
            <p className="text-[10px] text-gray-400 font-bold leading-relaxed uppercase tracking-wider">
              {t('report_disclaimer')}
            </p>
          </div>

          <div className="flex items-center gap-4 no-print shrink-0">
              <button 
                onClick={handlePrint}
                className="btn-primary py-4 px-10 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 rounded-2xl shadow-xl shadow-teal-500/10"
              >
                <Download size={16} />
                Download Report
              </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ResultDisplay;
