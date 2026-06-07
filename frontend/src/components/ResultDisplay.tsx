import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ShieldCheck, ClipboardList, Info, Download, Loader2, Stethoscope, Activity, Maximize2, Scan, Compass, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

interface ResultDisplayProps {
  result: any;
}

const resolveImageUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8088';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  const { t } = useTranslation();
  const [isDownloading, setIsDownloading] = useState(false);

  if (!result || !result.diagnosis) return null;

  const { diagnosis } = result;
  
  const prediction = result.prediction || {};
  const { 
    scientific_name = '', 
    severity = 'Medium', 
    severity_action = '', 
    fungicides = [], 
    pesticides = [], 
    recovery_timeline = '', 
    reference_sources = '' 
  } = prediction;
  
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
                <motion.div 
                  variants={itemVariants} 
                  className={`inline-flex items-center gap-3 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm ${
                    result.mode === 'symptoms' 
                      ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 shadow-indigo-500/5' 
                      : result.mode === 'hybrid'
                      ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20 shadow-teal-500/5'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-emerald-500/5'
                  }`}
                >
                    <Activity size={14} />
                    {result.mode === 'symptoms' 
                      ? t('result_symptom_match', { defaultValue: 'Symptom-Based Match' })
                      : result.mode === 'hybrid'
                      ? t('result_hybrid_fusion', { defaultValue: 'Fused Multimodal Diagnosis' })
                      : t('result_image_diagnosis', { defaultValue: 'Verified Image Diagnosis' })
                    }
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

        {/* AI Pathology Visualizer Section */}
        {result.diseaseAreaDetected && (
          <motion.div 
            variants={itemVariants} 
            className="mb-16 bg-zinc-50 dark:bg-zinc-900/40 p-8 md:p-10 rounded-[2.5rem] border border-black/5 dark:border-white/10 relative z-10 space-y-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-teal-500/10 rounded-2xl text-teal-600 dark:text-teal-400">
                  <Scan size={22} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                    AI Pathology Spotting & Auto-Zoom
                    <span className="text-[10px] font-black uppercase bg-teal-500/10 text-teal-600 dark:text-teal-400 px-2.5 py-1 rounded-md tracking-wider">Active</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium tracking-wide mt-1">
                    Computer vision has automatically segmented the leaf and focused on the active disease spot.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 shrink-0 bg-white dark:bg-zinc-900 px-4 py-2.5 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
                <Compass className="text-teal-600 dark:text-teal-400 w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Used Prediction: {result.usedCrop ? "Disease Crop (Higher Precision)" : "Full Specimen View"}
                </span>
              </div>
            </div>

            {/* Bounding box images grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 1. Original Specimen */}
              <div className="group relative bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-black/5 dark:border-white/5 shadow-md flex flex-col items-center">
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-950">
                  <img src={resolveImageUrl(result.originalUrl || result.imageUrl)} alt="Original Specimen" className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-3 left-3 bg-zinc-950/60 backdrop-blur-md text-[9px] font-black text-white px-2.5 py-1 rounded-md uppercase tracking-wider">
                    Original Specimen
                  </div>
                </div>
                <div className="mt-4 w-full flex items-center justify-between text-[11px] font-bold text-zinc-500">
                  <span>Confidence Level</span>
                  <span className="text-zinc-800 dark:text-zinc-200">{result.fullImageConfidence}</span>
                </div>
              </div>

              {/* 2. Detected Region */}
              <div className="group relative bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-black/5 dark:border-white/5 shadow-md flex flex-col items-center">
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-950">
                  <img src={resolveImageUrl(result.highlightedUrl)} alt="Detected Region" className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-3 left-3 bg-amber-500/80 text-[9px] font-black text-white px-2.5 py-1 rounded-md uppercase tracking-wider">
                    Pathology Detected
                  </div>
                </div>
                <div className="mt-4 w-full flex items-center justify-between text-[11px] font-bold text-zinc-500">
                  <span>Infection Coordinates</span>
                  <span className="text-amber-500">{result.boxCoordinates ? `X:${result.boxCoordinates[0]} Y:${result.boxCoordinates[1]} W:${result.boxCoordinates[2]} H:${result.boxCoordinates[3]}` : "N/A"}</span>
                </div>
              </div>

              {/* 3. Zoomed Crop */}
              <div className="group relative bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-black/5 dark:border-white/5 shadow-md flex flex-col items-center">
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-950">
                  <img src={resolveImageUrl(result.croppedUrl)} alt="Zoomed Crop" className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute top-3 left-3 bg-teal-500/80 text-[9px] font-black text-white px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1">
                    <Maximize2 size={10} /> Auto-Zoom Close-up
                  </div>
                </div>
                <div className="mt-4 w-full flex items-center justify-between text-[11px] font-bold text-zinc-500">
                  <span>Confidence Level</span>
                  <span className="text-teal-600 dark:text-teal-400 font-bold">{result.cropConfidence}</span>
                </div>
              </div>
            </div>

            {/* Precision Improvement Graph */}
            <div className="bg-white dark:bg-[#121214] p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-inner flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={14} className="text-teal-500" />
                  Confidence Improvement Analysis
                </h4>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                  {result.usedCrop 
                    ? "The Auto-Zoom crop yielded a higher confidence score, enabling a more reliable diagnosis." 
                    : "The full specimen view offered better feature context and was chosen for diagnosis."
                  }
                </p>
              </div>

              {/* Graphical confidence comparison */}
              <div className="flex items-center gap-6 shrink-0 w-full sm:w-auto">
                <div className="text-right">
                  <div className="text-[9px] uppercase tracking-wider text-zinc-400">Full Image</div>
                  <div className="text-sm font-extrabold text-zinc-700 dark:text-zinc-300">{result.fullImageConfidence}</div>
                </div>
                
                <div className="flex flex-col items-center justify-center relative w-16 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-full border border-black/5 dark:border-white/5">
                  <span className="text-[9px] font-black text-teal-600 dark:text-teal-400">
                    {result.usedCrop 
                      ? `+${Math.max(0, parseInt(result.cropConfidence) - parseInt(result.fullImageConfidence))}%` 
                      : "0%"
                    }
                  </span>
                  <span className="text-[7px] uppercase tracking-wider text-zinc-400 font-bold">Delta</span>
                </div>

                <div>
                  <div className="text-[9px] uppercase tracking-wider text-zinc-400">Zoom Crop</div>
                  <div className={`text-sm font-extrabold ${result.usedCrop ? 'text-teal-600 dark:text-teal-400' : 'text-zinc-700 dark:text-zinc-300'}`}>{result.cropConfidence}</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}


        {/* Multimodal Fusion Analysis Dashboard */}
        {result.fusionDetails && (
          <motion.div 
            variants={itemVariants}
            className="mb-16 bg-zinc-50 dark:bg-zinc-900/40 p-8 md:p-10 rounded-[2.5rem] border border-black/5 dark:border-white/10 relative z-10 space-y-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-teal-500/10 rounded-2xl text-teal-600 dark:text-teal-400">
                  <Sparkles size={22} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                    Multimodal Fusion Decision
                    <span className="text-[10px] font-black uppercase bg-teal-500/10 text-teal-600 dark:text-teal-400 px-2.5 py-1 rounded-md tracking-wider">Active</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium tracking-wide mt-1">
                    Combined CNN Computer Vision analysis of the leaf image with RAG semantic symptom matching.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 shrink-0 bg-white dark:bg-zinc-900 px-4 py-2.5 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Status: 
                </span>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  result.fusionDetails.agreement 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}>
                  {result.fusionDetails.agreement ? "Models Agree (Confidence Fused)" : "Models Disagree (Higher Confidence Selected)"}
                </span>
              </div>
            </div>

            {/* Model Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* CNN Image Model */}
              <div className={`p-6 rounded-3xl border shadow-sm transition-all duration-300 relative overflow-hidden ${
                result.fusionDetails.preferred === 'image' 
                  ? 'bg-white dark:bg-zinc-900 border-teal-500/30 ring-1 ring-teal-500/10' 
                  : 'bg-white/50 dark:bg-zinc-900/40 border-black/5 dark:border-white/5 opacity-70'
              }`}>
                {result.fusionDetails.preferred === 'image' && (
                  <div className="absolute top-0 right-0 bg-teal-500 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-2xl">
                    Selected Path
                  </div>
                )}
                
                <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">CNN Computer Vision Model</h4>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-zinc-500">Predicted Pathology</span>
                    <div className="text-base font-bold text-zinc-900 dark:text-white mt-1">{result.fusionDetails.imgClass}</div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-zinc-500 mb-1">
                      <span>Model Confidence</span>
                      <span className="font-extrabold text-teal-600 dark:text-teal-400">{result.fusionDetails.imgConfidence}</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        style={{ width: result.fusionDetails.imgConfidence }}
                        className="h-full bg-teal-500 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* RAG Symptom Matcher */}
              <div className={`p-6 rounded-3xl border shadow-sm transition-all duration-300 relative overflow-hidden ${
                result.fusionDetails.preferred === 'text' 
                  ? 'bg-white dark:bg-zinc-900 border-indigo-500/30 ring-1 ring-indigo-500/10' 
                  : 'bg-white/50 dark:bg-zinc-900/40 border-black/5 dark:border-white/5 opacity-70'
              }`}>
                {result.fusionDetails.preferred === 'text' && (
                  <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-2xl">
                    Selected Path
                  </div>
                )}
                
                <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">RAG Semantic Matcher</h4>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-zinc-500">Matched Symptoms</span>
                    <div className="text-base font-bold text-zinc-900 dark:text-white mt-1">{result.fusionDetails.textClass}</div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-zinc-500 mb-1">
                      <span>Semantic Similarity</span>
                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{result.fusionDetails.textConfidence}</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        style={{ width: result.fusionDetails.textConfidence }}
                        className="h-full bg-indigo-500 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fusion Formula Explanation Banner */}
            <div className="p-5 bg-white dark:bg-zinc-900/80 rounded-3xl border border-black/5 dark:border-white/5 shadow-inner text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              <span className="font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider block mb-1">Multimodal Fusion Rule Applied:</span>
              {result.fusionDetails.agreement 
                ? `Both models agreed on "${result.fusionDetails.imgClass}". The system applied the weighted fusion formula: 60% Image (CNN) + 40% Symptoms (RAG), resulting in a unified confidence score of ${result.diagnosis.confidence}.`
                : `The models disagreed (CNN classified as "${result.fusionDetails.imgClass}", RAG semantic matching classified as "${result.fusionDetails.textClass}"). The system prioritized the higher-confidence channel (${result.fusionDetails.preferred === 'image' ? 'Image CNN' : 'Symptom RAG'}), resulting in the diagnosis of "${result.diagnosis.disease}" with ${result.diagnosis.confidence} confidence.`
              }
            </div>
          </motion.div>
        )}

        {/* Differential Diagnosis (Symptom Matching Rank) */}
        {result.top3Differential && result.top3Differential.length > 0 && (
          <motion.div 
            variants={itemVariants}
            className="mb-16 bg-zinc-50 dark:bg-zinc-900/40 p-8 md:p-10 rounded-[2.5rem] border border-black/5 dark:border-white/10 relative z-10 space-y-8"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400">
                <ClipboardList size={22} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                  Differential Diagnosis
                  <span className="text-[10px] font-black uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-md tracking-wider">Semantic Match Rank</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium tracking-wide mt-1">
                  Pathology symptom analysis matched against the agricultural knowledge base using sentence embeddings.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {result.top3Differential.map((item: any, idx: number) => {
                const confVal = parseFloat(item.confidence.replace('%', ''));
                return (
                  <div key={idx} className="bg-white dark:bg-zinc-900/60 p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-extrabold text-zinc-500">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">{item.name}</span>
                      </div>
                      <span className="text-xs font-black uppercase tracking-wider text-zinc-400">{item.confidence} match</span>
                    </div>
                    
                    <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${confVal}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: idx * 0.2 }}
                        className={`h-full rounded-full ${
                          idx === 0 ? 'bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.3)]' : 
                          idx === 1 ? 'bg-indigo-500' : 'bg-zinc-400'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Scientific Recovery Protocol */}
        {!isHealthy && (
          <motion.div 
            variants={itemVariants}
            className="mb-16 bg-zinc-50 dark:bg-zinc-900/40 p-8 md:p-10 rounded-[2.5rem] border border-black/5 dark:border-white/10 relative z-10 space-y-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck size={22} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                    Scientific Recovery Protocol
                    <span className="text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-md tracking-wider">Active</span>
                  </h3>
                  {scientific_name && (
                    <p className="text-sm italic text-zinc-500 dark:text-zinc-400 font-medium">
                      Pathogen: {scientific_name}
                    </p>
                  )}
                </div>
              </div>
              
              {recovery_timeline && (
                <div className="flex items-center gap-2 shrink-0 bg-white dark:bg-zinc-900 px-4 py-2.5 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Est. Recovery:
                  </span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    {recovery_timeline}
                  </span>
                </div>
              )}
            </div>

            {/* Severity Alert Banner */}
            {severity && (
              <div className={`p-6 rounded-3xl border flex flex-col md:flex-row gap-4 items-start md:items-center justify-between transition-all duration-300 ${
                severity === 'Critical' 
                  ? 'bg-red-500/5 border-red-500/20 text-red-900 dark:text-red-200' 
                  : severity === 'High' 
                  ? 'bg-amber-500/5 border-amber-500/20 text-amber-900 dark:text-amber-200' 
                  : severity === 'Medium' 
                  ? 'bg-yellow-500/5 border-yellow-500/20 text-yellow-900 dark:text-yellow-200' 
                  : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-900 dark:text-emerald-200'
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      severity === 'Critical' 
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400' 
                        : severity === 'High' 
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                        : severity === 'Medium' 
                        ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' 
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {severity} Severity
                    </span>
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Crop Intervention Advisory</span>
                  </div>
                  <p className="text-xs font-medium mt-1 opacity-90 leading-relaxed">
                    {severity_action}
                  </p>
                </div>
              </div>
            )}

            {/* Chemical Tables */}
            {(fungicides.length > 0 || pesticides.length > 0) ? (
              <div className="space-y-8">
                {fungicides.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles size={12} className="text-emerald-500" />
                      Recommended Fungicides
                    </h4>
                    <div className="overflow-x-auto rounded-3xl border border-black/5 dark:border-white/5 shadow-sm">
                      <table className="w-full text-left border-collapse bg-white dark:bg-zinc-900/60">
                        <thead>
                          <tr className="bg-zinc-100 dark:bg-zinc-800 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                            <th className="p-4">Chemical Name</th>
                            <th className="p-4">Active Ingredient</th>
                            <th className="p-4">Mode of Action</th>
                            <th className="p-4">Dosage</th>
                            <th className="p-4">Frequency</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          {fungicides.map((f: any, idx: number) => (
                            <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                              <td className="p-4 font-bold text-zinc-900 dark:text-white">{f.name}</td>
                              <td className="p-4">{f.active_ingredient}</td>
                              <td className="p-4 text-zinc-500 dark:text-zinc-400">{f.mode_of_action}</td>
                              <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold">{f.dosage}</td>
                              <td className="p-4 text-zinc-500 dark:text-zinc-400">{f.frequency}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {pesticides.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles size={12} className="text-amber-500" />
                      Recommended Pesticides
                    </h4>
                    <div className="overflow-x-auto rounded-3xl border border-black/5 dark:border-white/5 shadow-sm">
                      <table className="w-full text-left border-collapse bg-white dark:bg-zinc-900/60">
                        <thead>
                          <tr className="bg-zinc-100 dark:bg-zinc-800 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                            <th className="p-4">Chemical Name</th>
                            <th className="p-4">Active Ingredient</th>
                            <th className="p-4">Mode of Action</th>
                            <th className="p-4">Dosage</th>
                            <th className="p-4">Frequency</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          {pesticides.map((p: any, idx: number) => (
                            <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                              <td className="p-4 font-bold text-zinc-900 dark:text-white">{p.name}</td>
                              <td className="p-4">{p.active_ingredient}</td>
                              <td className="p-4 text-zinc-500 dark:text-zinc-400">{p.mode_of_action}</td>
                              <td className="p-4 text-amber-600 dark:text-amber-400 font-bold">{p.dosage}</td>
                              <td className="p-4 text-zinc-500 dark:text-zinc-400">{p.frequency}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 bg-white dark:bg-zinc-900/80 rounded-3xl border border-black/5 dark:border-white/5 shadow-inner text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
                No targeted chemical controls are recommended. Follow the standard recovery protocol steps below.
              </div>
            )}

            {/* Safety Notice Warning Banner */}
            <div className="p-5 bg-red-500/5 dark:bg-red-950/20 border border-red-500/20 rounded-3xl text-xs text-red-600 dark:text-red-400 leading-relaxed font-bold">
              <span className="uppercase tracking-wider block mb-1">⚠️ Safety Notice:</span>
              Always follow local agricultural regulations and label instructions before applying any chemical treatment.
            </div>

            {/* Scientific References */}
            {reference_sources && (
              <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium tracking-wide">
                Scientific References: {reference_sources}
              </div>
            )}
          </motion.div>
        )}

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
