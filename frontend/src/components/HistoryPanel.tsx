import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronRight, Trash2, Download, Database } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HistoryItem {
  id: number;
  timestamp: string;
  result: any;
}

interface HistoryPanelProps {
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ items, onSelect, onClear }) => {
  const { t } = useTranslation();

  return (
    <div className="card-clean p-8 h-fit shadow-clinical border-gray-100/50 dark:border-gray-800/30">
      <div className="flex items-center justify-between mb-10 px-1">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-50 dark:bg-gray-900 rounded-xl flex items-center justify-center border border-gray-100 dark:border-gray-800 shadow-sm">
            <Database className="text-teal-600 dark:text-teal-400 w-5 h-5" />
          </div>
          <div>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] font-heading">{t('history_title')}</h3>
              <p className="text-[8px] text-gray-300 font-bold uppercase tracking-widest mt-0.5">{t('history_vault')}</p>
          </div>
        </div>
        
        {items.length > 0 && (
          <button 
            onClick={onClear}
            className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
            title={t('history_clear')}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 border-2 border-dashed border-gray-100 dark:border-gray-800/50 rounded-3xl"
            >
              <p className="text-[10px] text-gray-300 font-black uppercase tracking-[0.3em]">{t('history_empty')}</p>
            </motion.div>
          ) : (
            items.map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                onClick={() => onSelect(item)}
                className="w-full group flex items-center gap-4 p-4 rounded-2xl border border-gray-50 dark:border-gray-800/40 hover:border-teal-200/50 dark:hover:border-teal-900/40 hover:bg-teal-50/20 dark:hover:bg-teal-950/10 transition-all text-left shadow-sm bg-white dark:bg-gray-900/20"
              >
                <div className="w-14 h-14 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shrink-0 shadow-inner">
                  <img 
                    src={import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}${item.result.imageUrl}` : `http://localhost:8080${item.result.imageUrl}`} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700 grayscale-[0.2] group-hover:grayscale-0" 
                    alt="Scan thumbnail" 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[11px] font-black text-gray-800 dark:text-gray-200 truncate leading-none mb-2 uppercase tracking-tight font-heading">
                    {item.result.prediction.name.split('-')[1]?.trim() || item.result.prediction.name.split('-')[0].trim()}
                  </h4>
                  <div className="flex items-center gap-3">
                    <span className="text-[8px] font-black px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase tracking-widest rounded-md border border-gray-200/50 dark:border-gray-700/50">
                      {item.result.prediction.severity}
                    </span>
                    <span className="text-[8px] text-gray-300 font-bold uppercase tracking-widest flex items-center gap-1.5 leading-none">
                      <Clock size={10} /> {item.timestamp.split(',')[0]}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
              </motion.button>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-4">
        {items.length > 0 && (
          <button className="btn-secondary w-full py-4 text-[10px] font-black uppercase tracking-[0.25em] flex items-center justify-center gap-3 rounded-2xl">
            <Download size={14} /> {t('history_export_btn', { defaultValue: 'Export Vault Data' })}
          </button>
        )}
        <div className="flex items-start gap-4 px-3 opacity-60">
            <Clock size={12} className="text-gray-300 shrink-0 mt-0.5" />
            <p className="text-[9px] text-gray-400 font-bold leading-relaxed uppercase tracking-widest">
                {t('history_disclaimer')}
            </p>
        </div>
      </div>
    </div>
  );
};

export default HistoryPanel;
