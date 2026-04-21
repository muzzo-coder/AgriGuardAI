import React from 'react';
import { motion } from 'framer-motion';
import { Droplets, ShieldCheck, AlertCircle, FileText, ClipboardList } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ResultDisplayProps {
  result: any;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  const { t } = useTranslation();
  if (!result || !result.prediction) return null;

  const { prediction } = result;

  const handlePrint = () => {
    window.print();
  };

  const severityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'text-red-700 bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30';
      case 'high': return 'text-orange-700 bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30';
      case 'medium': return 'text-amber-700 bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30';
      default: return 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-6 pb-20 fade-in"
    >
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .glass { border: none !important; box-shadow: none !important; }
        }
      `}</style>
      
      <div className="card-clean p-8 md:p-12 overflow-hidden relative">
        {/* Healthcare report header style */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-slate-100 dark:border-slate-800 pb-10 mb-10">
          <div className="flex-1">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border mb-6 ${severityColor(prediction.severity)}`}>
               {t('result_severity', { severity: prediction.severity })}
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white font-heading leading-tight mb-4">
              {prediction.name}
            </h2>
            <div className="flex items-center gap-4">
               <div className="flex-1 max-w-[200px] h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${prediction.confidence * 100}%` }}
                   transition={{ duration: 1.5, ease: "easeOut" }}
                   className="h-full bg-emerald-500 rounded-full"
                 />
               </div>
               <span className="text-sm font-black text-emerald-600 uppercase tracking-tighter">{Math.round(prediction.confidence * 100)}% Match</span>
            </div>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 w-full md:w-64">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList size={16} className="text-slate-400" />
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('result_diagnostic_summary')}</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              {prediction.description}
            </p>
          </div>
        </div>

        {/* Actionable Insights Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center">
                <Droplets className="text-emerald-600 w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight text-sm font-heading">{t('result_organic_treatment')}</h4>
            </div>
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              {prediction.treatment}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center">
                <ShieldCheck className="text-emerald-600 w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight text-sm font-heading">{t('result_prevention_protocol')}</h4>
            </div>
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              {prediction.prevention}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-3 max-w-md">
            <AlertCircle className="text-amber-500 w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-400 font-bold leading-normal uppercase tracking-wider">
              {t('result_disclaimer')}
            </p>
          </div>

          <button 
            onClick={handlePrint}
            className="btn-secondary no-print py-2.5 px-6 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
          >
            <FileText size={14} />
            {t('result_download_report')}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ResultDisplay;
