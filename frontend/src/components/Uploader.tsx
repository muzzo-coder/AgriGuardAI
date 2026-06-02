import React, { useState, useRef, useEffect } from 'react';
import { X, AlertCircle, Loader2, Camera, Image as ImageIcon, Sparkles, BrainCircuit, TextQuote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

interface UploaderProps {
  onResult: (result: any) => void;
  onReset: () => void;
}

const Uploader: React.FC<UploaderProps> = ({ onResult, onReset }) => {
  const { t, i18n } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraInitializing, setIsCameraInitializing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [processStep, setProcessStep] = useState(0); // 0: Uploading, 1: Analyzing, 2: Generating
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelection(selectedFile);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select a valid diagnostic image (PNG, JPG).');
      return;
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setError(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelection(droppedFile);
    }
  };

  const compressImage = (file: File, maxWidth: number = 800): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.8
        );
      };
      img.onerror = () => {
        resolve(file); // fallback to original if error
      };
    });
  };

  const handleUpload = async () => {
    console.log("Sending description:", description);
    
    if (!file && !description.trim()) {
      alert("Please upload image or describe symptoms");
      setError('Please provide an image or describe symptoms.');
      return;
    }

    setIsLoading(true);
    setProcessStep(0);
    setError(null);
    
    // Process step simulation
    const stepInterval = setInterval(() => {
        setProcessStep(prev => (prev < 2 ? prev + 1 : prev));
    }, 1200);

    // Abort controller
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const formData = new FormData();
    if (file) {
        const compressedFile = await compressImage(file);
        formData.append('image', compressedFile);
    }
    if (description.trim()) formData.append('description', description);
    formData.append('language', i18n.language.split('-')[0]);

    try {
      // 60s request timeout handled by AbortController
      const timeoutId = setTimeout(() => abortControllerRef.current?.abort(), 60000);

      const response = await api.post('/api/diagnose', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        signal: abortControllerRef.current.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.data.status === 'success') {
        onResult(response.data);
      } else {
        setError(response.data.error || 'Diagnostic analysis failed.');
      }
    } catch (err: any) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        console.log("Request was canceled due to timeout or manual abort.");
        setError('Analysis timed out. Falling back, please try again.');
      } else {
        console.error("API Error:", err);
        setError(err.response?.data?.error || 'Unable to analyze. Please check your network and try again.');
      }
    } finally {
      clearInterval(stepInterval);
      setIsLoading(false);
      setProcessStep(0);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    onReset();
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Camera not supported in this browser");
      setError('Camera interface not supported in this environment.');
      return;
    }
    setIsCameraOpen(true);
    setIsCameraInitializing(true);
    setError(null);
  };

  useEffect(() => {
    if (isCameraOpen) {
      const initCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
          });
          streamRef.current = stream;
          console.log("Camera stream:", stream);

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().catch(e => console.error("Play error:", e));
              setIsCameraInitializing(false);
              console.log("Video ready:", videoRef.current?.videoWidth);
            };
          }
        } catch (err: any) {
            console.error('Camera Access Error:', err);
            setIsCameraOpen(false);
            setIsCameraInitializing(false);
            if (err.name === 'NotAllowedError') {
              alert("Camera permission denied");
              setError('Permission denied. Please enable camera access in your browser settings.');
            } else if (err.name === 'NotFoundError') {
              alert("No camera device found");
              setError('No camera found on this device.');
            } else {
              alert("Camera error occurred");
              setError('Camera access denied or not supported.');
            }
        }
      };
      
      // Allow video element to mount before requesting stream
      const timer = setTimeout(initCamera, 100);
      return () => clearTimeout(timer);
    }
  }, [isCameraOpen]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setIsCameraInitializing(false);
  };

  const captureImage = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) {
      alert("Camera not ready");
      return;
    }
    
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (!blob) {
            alert("Capture failed");
            return;
          }
          const capturedFile = new File([blob], 'leaf.jpg', { type: 'image/jpeg' });
          setFile(capturedFile);
          setPreview(URL.createObjectURL(capturedFile));
          stopCamera();
        }, 'image/jpeg', 0.9);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div id="upload-section" className="w-full max-w-5xl mx-auto space-y-12 relative z-20 perspective-[2000px]">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

      <div 
        className={`card-clean overflow-hidden transition-all duration-500 transform-gpu ${isDragging ? 'scale-[1.02] border-emerald-500/50 shadow-emerald-500/20' : 'scale-100'} ${isLoading ? 'opacity-50 pointer-events-none blur-sm' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[500px]">
          {/* Left side: Upload Area */}
          <div className="p-10 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-black/5 dark:border-white/5 relative group">
            {/* Ambient hover glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-transparent to-teal-500/0 group-hover:from-emerald-500/5 group-hover:to-teal-500/5 transition-all duration-700 pointer-events-none" />

                <AnimatePresence mode="wait">
                    {isCameraOpen ? (
                    <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        <div className="relative aspect-square bg-gray-950 rounded-3xl overflow-hidden shadow-2xl border border-white/5 flex items-center justify-center">
                            {isCameraInitializing && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/80 z-10 space-y-4">
                                    <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                                    <span className="text-[10px] font-black tracking-widest text-teal-500 uppercase">Initializing Camera...</span>
                                </div>
                            )}
                            <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover transition-opacity duration-300 ${isCameraInitializing ? 'opacity-0' : 'opacity-100'}`} />
                            <canvas ref={canvasRef} className="hidden" />
                        </div>
                        <div className="flex justify-center gap-4">
                            <button onClick={stopCamera} className="btn-secondary rounded-2xl w-14 h-14 flex items-center justify-center p-0"><X size={24} /></button>
                            <button onClick={captureImage} disabled={isCameraInitializing} className="btn-primary rounded-2xl px-8 flex items-center gap-4 shadow-xl shadow-teal-500/20 disabled:opacity-50"><Camera size={20} /> Capture</button>
                        </div>
                    </motion.div>
                    ) : file ? (
                    <motion.div key="preview" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 flex flex-col items-center">
                        <div className="relative group w-full max-w-sm aspect-square bg-gray-100 dark:bg-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800">
                            <img src={preview!} className="w-full h-full object-cover" alt="Specimen Preview" />
                            <button onClick={clearFile} className="absolute top-4 right-4 p-3 bg-gray-950/40 hover:bg-red-600 text-white rounded-2xl backdrop-blur-xl transition-all shadow-xl"><X size={20} /></button>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="flex items-center gap-3 text-[9px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest bg-teal-50 dark:bg-teal-900/30 px-4 py-3 rounded-xl">
                                <ImageIcon size={14} /> Specimen Loaded
                            </div>
                            <button onClick={() => { clearFile(); startCamera(); }} className="btn-secondary px-4 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                                <Camera size={14} /> Retake
                            </button>
                        </div>
                    </motion.div>
                    ) : (
                    <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 relative z-10">
                        <div className="w-24 h-24 bg-zinc-50 dark:bg-zinc-800/50 border border-black/5 dark:border-white/10 rounded-full flex items-center justify-center mx-auto shadow-inner group-hover:shadow-emerald-500/20 cursor-pointer transition-all duration-500" onClick={() => fileInputRef.current?.click()}>
                            <ImageIcon className="text-zinc-400 dark:text-zinc-500 w-10 h-10 group-hover:scale-110 group-hover:text-emerald-500 transition-transform duration-500" />
                        </div>
                        <div>
                            <h4 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">{t('upload_drag_drop', { defaultValue: 'Drag & drop leaf image here' })}</h4>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium tracking-wide mt-2">{t('upload_or_browse', { defaultValue: 'or click to browse files' })}</p>
                        </div>
                        <div className="flex gap-4 justify-center">
                            <button onClick={() => fileInputRef.current?.click()} className="btn-secondary px-8">{t('btn_browser')}</button>
                            <button onClick={startCamera} className="btn-secondary px-8 flex items-center gap-2"><Camera size={16}/> {t('btn_camera')}</button>
                        </div>
                    </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Right side: Text Input */}
            <div className="p-10 flex flex-col justify-center bg-zinc-50/50 dark:bg-[#09090b]/50 relative">
                <div className="space-y-6 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                            <TextQuote size={20} />
                        </div>
                        <div>
                            <h4 className="text-base font-semibold text-zinc-900 dark:text-white tracking-tight">{t('symptom_title')}</h4>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium tracking-wide mt-1">{t('symptom_subtitle')}</p>
                        </div>
                    </div>
                    
                    <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t('symptom_placeholder')}
                        className="w-full h-48 p-6 bg-white dark:bg-[#121214] border border-black/5 dark:border-white/10 rounded-2xl outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-sm font-medium dark:text-zinc-200 resize-none shadow-sm"
                        disabled={isLoading}
                    />
                    
                    <div className="flex flex-wrap gap-2">
                        {[
                            { text: 'Yellow leaves', key: 'tip_yellow_leaves' },
                            { text: 'White powder', key: 'tip_white_powder' },
                            { text: 'Dry edges', key: 'tip_dry_edges' },
                            { text: 'Spotting', key: 'tip_spotting' }
                        ].map(tip => (
                            <button 
                                key={tip.key}
                                onClick={() => setDescription(prev => prev ? `${prev}, ${t(tip.key).toLowerCase()}` : t(tip.key))}
                                className="px-4 py-2 bg-white dark:bg-[#121214] border border-black/5 dark:border-white/10 text-xs font-medium text-zinc-600 dark:text-zinc-400 rounded-xl hover:border-emerald-500/30 hover:text-emerald-500 transition-all shadow-sm active:scale-95"
                            >
                                + {t(tip.key)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Execute Section */}
      <div className="flex flex-col items-center space-y-6 relative z-30">
          {isLoading && (
            <motion.div initial={{ opacity: 0, scale: 0.95, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -20 }} className="w-full max-w-lg card-clean p-8 space-y-6 mb-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500/5 animate-pulse rounded-3xl" />
                <div className="relative z-10 flex justify-between items-center">
                    <span className="text-xs font-semibold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">Analysis Progress</span>
                    <span className="text-xs font-bold text-zinc-500">{Math.min(100, (processStep + 1) * 33)}%</span>
                </div>
                <div className="relative z-10 w-full bg-zinc-100 dark:bg-zinc-800/50 h-1.5 rounded-full overflow-hidden">
                    <motion.div 
                        className="h-full bg-emerald-500"
                        initial={{ width: '0%' }}
                        animate={{ width: `${(processStep + 1) * 33}%` }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                    />
                </div>
                <div className="relative z-10 space-y-4 pt-2">
                    <div className="flex items-center gap-4 text-sm">
                        <Loader2 className={`w-4 h-4 ${processStep === 0 ? 'text-emerald-500 animate-spin' : 'text-emerald-500/30'}`} />
                        <span className={processStep === 0 ? 'text-zinc-900 dark:text-white font-semibold' : 'text-zinc-400 dark:text-zinc-500'}>Uploading image to neural network...</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <Loader2 className={`w-4 h-4 ${processStep === 1 ? 'text-emerald-500 animate-spin' : 'text-zinc-300 dark:text-zinc-700'}`} />
                        <span className={processStep === 1 ? 'text-zinc-900 dark:text-white font-semibold' : 'text-zinc-400 dark:text-zinc-500'}>Running CNN diagnosis...</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <Loader2 className={`w-4 h-4 ${processStep === 2 ? 'text-emerald-500 animate-spin' : 'text-zinc-300 dark:text-zinc-700'}`} />
                        <span className={processStep === 2 ? 'text-zinc-900 dark:text-white font-semibold' : 'text-zinc-400 dark:text-zinc-500'}>Synthesizing treatment plan via LLM...</span>
                    </div>
                </div>
            </motion.div>
          )}

          <motion.button
            whileHover={!isLoading && (file || description.trim()) ? { scale: 1.02, y: -2 } : {}}
            whileTap={!isLoading && (file || description.trim()) ? { scale: 0.98 } : {}}
            onClick={handleUpload}
            disabled={isLoading || (!file && !description.trim())}
            className="w-full max-w-lg py-5 bg-zinc-900 hover:bg-black disabled:bg-zinc-100 dark:bg-white dark:hover:bg-zinc-100 dark:disabled:bg-zinc-800/50 disabled:text-zinc-400 dark:disabled:text-zinc-600 text-white dark:text-zinc-900 rounded-2xl font-semibold tracking-wide transition-all flex items-center justify-center gap-3 shadow-xl disabled:shadow-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('btn_analyzing', { defaultValue: 'Processing...' })}
              </>
            ) : (
              <>
                <BrainCircuit size={20} />
                {t('btn_analyze', { defaultValue: 'Analyze Specimen' })}
              </>
            )}
          </motion.button>
          
          <div className="flex items-center gap-3 opacity-50">
              <Sparkles size={14} className="text-emerald-500" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{t('neural_engine_active')}</span>
          </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-[2rem] flex items-center gap-6 shadow-xl">
            <AlertCircle size={24} className="text-red-600 shrink-0" />
            <p className="text-xs font-black uppercase tracking-tight text-red-800 dark:text-red-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Uploader;
