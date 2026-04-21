import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronRight, History, Trash2, Download } from 'lucide-react';
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
    <div className="card-clean p-6 h-fit fade-in">
      <div className="flex items-center justify-between mb-8 px-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700">
            <History className="text-slate-500 dark:text-slate-400 w-4 h-4" />
          </div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-heading">{t('history_title')}</h3>
        </div>
        
        {items.length > 0 && (
          <button 
            onClick={onClear}
            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
            title={t('history_clear')}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-100 dark:border-slate-800/50 rounded-2xl">
              <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.2em]">{t('history_empty')}</p>
            </div>
          ) : (
            items.map((item) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => onSelect(item)}
                className="w-full group flex items-center gap-4 p-3 rounded-xl border border-slate-50 dark:border-slate-800/50 hover:border-emerald-100 dark:hover:border-emerald-900/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all text-left shadow-sm"
              >
                <div className="w-12 h-12 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0">
                  <img 
                    src={import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}${item.result.imageUrl}` : `http://localhost:8080${item.result.imageUrl}`} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500 grayscale-[0.3] group-hover:grayscale-0" 
                    alt="Scan thumbnail" 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate leading-none mb-1.5 uppercase tracking-tight font-heading">
                    {item.result.prediction.name.split('-')[1]?.trim() || item.result.prediction.name.split('-')[0].trim()}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-widest rounded-md">
                      {item.result.prediction.severity}
                    </span>
                    <span className="text-[8px] text-slate-300 font-bold uppercase tracking-widest flex items-center gap-1">
                      <Clock size={8} /> {item.timestamp.split(',')[0]}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-emerald-500 transition-colors" />
              </motion.button>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
        {items.length > 0 && (
          <button className="btn-secondary w-full py-2.5 text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
            <Download size={12} /> {t('history_export')}
          </button>
        )}
        <p className="text-[9px] text-slate-400 font-bold text-center leading-normal uppercase tracking-widest px-2">
          {t('history_disclaimer')}
        </p>
      </div>
    </div>
  );
};

export default HistoryPanel;
