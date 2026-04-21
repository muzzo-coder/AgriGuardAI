import React from 'react';
import Uploader from '../components/Uploader';
import ResultDisplay from '../components/ResultDisplay';
import HistoryPanel from '../components/HistoryPanel';
import WeatherWidget from '../components/WeatherWidget';
import { motion, AnimatePresence } from 'framer-motion';

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
  return (
    <div className="page-container fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Main Diagnostic Area */}
        <div className="lg:col-span-3 space-y-12">
          {!predictionData ? (
             <div className="py-12">
               <div className="text-center mb-12 space-y-4">
                 <h2 className="text-3xl font-extrabold font-heading text-slate-900 dark:text-white">Disease Detection</h2>
                 <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                   Upload a clear photo of the infected leaf or use your camera for real-time analysis.
                 </p>
               </div>
               <Uploader onResult={onResult} onReset={onReset} />
             </div>
          ) : (
            <div id="diagnostic-results" className="scroll-mt-24 space-y-12">
              <div className="flex justify-start">
                <button 
                  onClick={onReset}
                  className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  ← New Analysis
                </button>
              </div>
              <ResultDisplay result={predictionData} />
            </div>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-8">
          <WeatherWidget />
          <div className="sticky top-24">
            <HistoryPanel 
              items={history} 
              onSelect={onSelectHistory} 
              onClear={onClearHistory} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetectPage;
