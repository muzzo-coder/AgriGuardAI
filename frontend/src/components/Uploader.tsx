import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Check, AlertCircle, Loader2, Camera, RefreshCcw, Image as ImageIcon, Sparkles, BrainCircuit, TextQuote, Send } from 'lucide-react';
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please select a valid diagnostic image (PNG, JPG).');
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError(null);
    }
  };

  const handleUpload = async () => {
    console.log("Sending description:", description);
    
    if (!file && !description.trim()) {
      alert("Please upload image or describe symptoms");
      setError('Please provide an image or describe symptoms.');
      return;
    }

    setIsLoading(true);
    setError(null);
    const formData = new FormData();
    if (file) formData.append('image', file);
    if (description.trim()) formData.append('description', description);
    formData.append('language', i18n.language.split('-')[0]);

    try {
      const response = await api.post('/api/diagnose', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data.status === 'success') {
        onResult(response.data);
      } else {
        setError(response.data.error || 'Diagnostic analysis failed.');
      }
    } catch (err: any) {
      console.error("API Error:", err);
      setError(err.response?.data?.error || 'Unable to analyze. Please check your network and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    onReset();
  };

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera interface not supported in this environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOpen(true);
      setError(null);
    } catch (err: any) {
      console.error('Camera Access Error:', err);
      let errorMsg = 'Camera access denied or not supported.';
      if (err.name === 'NotAllowedError') errorMsg = 'Permission denied. Please enable camera access in your browser settings.';
      if (err.name === 'NotFoundError') errorMsg = 'No camera found on this device.';
      setError(errorMsg);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const capturedFile = new File([blob], `neural_scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setFile(capturedFile);
            setPreview(URL.createObjectURL(capturedFile));
            stopCamera();
          }
        }, 'image/jpeg', 0.95);
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
    <div className="w-full max-w-4xl mx-auto mb-20 px-4 sm:px-0 space-y-10">
      <div className={`card-clean overflow-hidden transition-all duration-500 ${(file || isCameraOpen || description) ? 'border-teal-500 bg-teal-50/5' : 'border-dashed border-2 bg-gray-50/30'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left side: Image Input */}
            <div className="p-8 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800 flex flex-col justify-center min-h-[350px]">
                <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                    accept="image/*"
                />

                <AnimatePresence mode="wait">
                    {isCameraOpen ? (
                    <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        <div className="relative aspect-square bg-gray-950 rounded-3xl overflow-hidden shadow-2xl border border-white/5">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            <canvas ref={canvasRef} className="hidden" />
                        </div>
                        <div className="flex justify-center gap-4">
                            <button onClick={stopCamera} className="btn-secondary rounded-2xl w-14 h-14 flex items-center justify-center p-0"><X size={24} /></button>
                            <button onClick={captureImage} className="btn-primary rounded-2xl px-8 flex items-center gap-4 shadow-xl shadow-teal-500/20"><Camera size={20} /> Capture</button>
                        </div>
                    </motion.div>
                    ) : file ? (
                    <motion.div key="preview" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 flex flex-col items-center">
                        <div className="relative group w-full max-w-sm aspect-square bg-gray-100 dark:bg-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800">
                            <img src={preview!} className="w-full h-full object-cover" alt="Specimen Preview" />
                            <button onClick={clearFile} className="absolute top-4 right-4 p-3 bg-gray-950/40 hover:bg-red-600 text-white rounded-2xl backdrop-blur-xl transition-all shadow-xl"><X size={20} /></button>
                        </div>
                        <div className="flex items-center gap-3 text-[9px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest bg-teal-50 dark:bg-teal-900/30 px-4 py-2 rounded-xl">
                            <ImageIcon size={14} /> Specimen Loaded
                        </div>
                    </motion.div>
                    ) : (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6">
                        <div className="w-20 h-20 bg-teal-50 dark:bg-teal-900/10 rounded-[1.75rem] flex items-center justify-center mx-auto shadow-inner group cursor-pointer hover:scale-105 transition-all" onClick={() => fileInputRef.current?.click()}>
                            <ImageIcon className="text-teal-600 dark:text-teal-400 w-8 h-8 group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Leaf Specimen</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Upload image or use camera</p>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => fileInputRef.current?.click()} className="btn-secondary py-3 px-6 text-[9px] font-black uppercase tracking-widest rounded-xl">Browser</button>
                            <button onClick={startCamera} className="btn-secondary py-3 px-6 text-[9px] font-black uppercase tracking-widest rounded-xl">Camera</button>
                        </div>
                    </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Right side: Text Input */}
            <div className="p-8 flex flex-col justify-center bg-gray-50/30 dark:bg-gray-900/10">
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <TextQuote size={18} className="text-teal-600 dark:text-teal-400" />
                        <div>
                            <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Symptom Description</h4>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Describe in your own words</p>
                        </div>
                    </div>
                    
                    <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Example: Yellow spots appearing on the edges of lower leaves. Some leaves are drying up..."
                        className="w-full h-48 p-5 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-3xl outline-none focus:border-teal-500 transition-all text-sm font-medium dark:text-white resize-none shadow-inner"
                        disabled={isLoading}
                    />
                    
                    <div className="flex flex-wrap gap-2">
                        {['Yellow leaves', 'White powder', 'Dry edges', 'Spotting'].map(tip => (
                            <button 
                                key={tip}
                                onClick={() => setDescription(prev => prev ? `${prev}, ${tip.toLowerCase()}` : tip)}
                                className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-[9px] font-black text-gray-400 uppercase tracking-widest rounded-lg hover:border-teal-500 hover:text-teal-600 transition-all"
                            >
                                + {tip}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Execute Section */}
      <div className="flex flex-col items-center space-y-6">
          <button
            onClick={handleUpload}
            disabled={isLoading || (!file && !description.trim())}
            className="w-full max-w-md py-6 bg-teal-700 hover:bg-teal-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-teal-900/20 active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Plant Condition...
              </>
            ) : (
              <>
                <BrainCircuit size={22} />
                Analyze Specimen
              </>
            )}
          </button>
          
          <div className="flex items-center gap-3 opacity-30">
              <Sparkles size={14} className="text-teal-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Neural Engine RAG-Enhanced Active</span>
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
