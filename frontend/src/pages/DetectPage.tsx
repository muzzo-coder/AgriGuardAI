import React from 'react';
import Uploader from '../components/Uploader';
import ResultDisplay from '../components/ResultDisplay';
import HistoryPanel from '../components/HistoryPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DetectPageProps {
  predictionData: any;
  history: any[];
  onResult: (result: any) => void;
  onReset: () => void;
  onSelectHistory: (item: any) => void;
  onClearHistory: () => void;
}

const DetectPage: React.FC<DetectPageProps> = ({ 
  predictionData, 
  history, 
  onResult, 
  onReset, 
  onSelectHistory, 
  onClearHistory 
}) => {
  const { t } = useTranslation();

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.5, ease: "circOut" }}
      className="page-container"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Diagnostic Area */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-12">
          <AnimatePresence mode="wait">
            {!predictionData ? (
              <motion.div 
                key="uploader"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.4 }}
                className="py-6"
              >
                <div className="text-center mb-16 space-y-6">
                  <div className="inline-block px-4 py-1.5 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 rounded-full mb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400">
                      {t('detect_badge', { defaultValue: 'AI-Powered Crop Diagnosis' })}
                    </span>
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black font-heading text-gray-900 dark:text-white leading-[1.1]">{t('detect_title', { defaultValue: 'Your Digital Plant Doctor' })}</h1>
                  <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
                    {t('detect_subtitle', { defaultValue: 'Upload a photo of your plant for an instant diagnosis powered by AI. Get precise identification and organic treatment protocols.' })}
                  </p>
                </div>
                
                <div className="max-w-3xl mx-auto">
                    <Uploader onResult={onResult} onReset={onReset} />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="results"
                id="diagnostic-results" 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="scroll-mt-24 space-y-12"
              >
                <div className="flex justify-start">
                  <button 
                    onClick={onReset}
                    className="group flex items-center gap-2 px-7 py-3 bg-white dark:bg-gray-900 text-teal-600 dark:text-teal-400 rounded-2xl font-bold text-xs uppercase tracking-widest border border-teal-100 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-all shadow-sm"
                  >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    {t('detect_new_specimen', { defaultValue: 'New Specimen' })}
                  </button>
                </div>
                <ResultDisplay result={predictionData} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-4 xl:col-span-3 space-y-10"
        >
          <div className="sticky top-24">
            <HistoryPanel 
              items={history} 
              onSelect={onSelectHistory} 
              onClear={onClearHistory} 
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DetectPage;
