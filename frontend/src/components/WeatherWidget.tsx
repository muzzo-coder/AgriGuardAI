import React, { useState } from 'react';
import { CloudRain, Thermometer, Wind, AlertTriangle, CheckCircle2, Droplets, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const WeatherWidget: React.FC = () => {
  // Simulating environmental data
  const [weather] = useState({
    temp: 24,
    humidity: 82,
    wind: 12,
    condition: 'Overcast'
  });

  const getFungalRisk = (humidity: number, temp: number) => {
    if (humidity > 80 && temp > 20 && temp < 28) return { level: 'High Risk', color: 'text-red-700', bg: 'bg-red-50 dark:bg-red-900/10', icon: <AlertTriangle size={14} /> };
    if (humidity > 60) return { level: 'Moderate', color: 'text-amber-700', bg: 'bg-amber-50 dark:bg-amber-900/10', icon: <Info size={14} /> };
    return { level: 'Optimal', color: 'text-emerald-700', bg: 'bg-emerald-50 dark:bg-emerald-900/10', icon: <CheckCircle2 size={14} /> };
  };

  const risk = getFungalRisk(weather.humidity, weather.temp);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-clean p-6 fade-in"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-heading">Field Intelligence</h3>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-800 ${risk.bg} ${risk.color} text-[9px] font-black uppercase tracking-widest`}>
            {risk.icon}
            {risk.level}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800/50">
            <Thermometer className="text-orange-500 w-4 h-4 mb-2" />
            <span className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">{weather.temp}°C</span>
            <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Ambient</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800/50">
            <Droplets className="text-sky-500 w-4 h-4 mb-2" />
            <span className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">{weather.humidity}%</span>
            <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Moisture</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800/50">
            <Wind className="text-slate-400 w-4 h-4 mb-2" />
            <span className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">{weather.wind}k/h</span>
            <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Velocity</span>
          </div>
        </div>

        <div className="mt-2 p-3 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-slate-50 dark:border-slate-800/50">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-medium italic">
            Current humidity and temperature suggest active fungal spore monitoring. Ensure airflow in dense zones.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default WeatherWidget;
