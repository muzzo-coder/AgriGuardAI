import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Check, AlertCircle, Loader2, Camera, RefreshCcw, Image as ImageIcon } from 'lucide-react';
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
        setError('Please select an image file (PNG, JPG, HEIF).');
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('language', i18n.language.split('-')[0]);

    try {
      const response = await api.post('/api/predict', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data.status === 'success') {
        onResult(response.data);
      } else {
        setError(response.data.message || 'Analysis failed.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || t('err_server_fail'));
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
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1024 }, height: { ideal: 1024 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOpen(true);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(t('err_camera_fail'));
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
            const capturedFile = new File([blob], `webcam_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setFile(capturedFile);
            setPreview(URL.createObjectURL(capturedFile));
            stopCamera();
          }
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
    <div className="max-w-2xl mx-auto px-6 mb-20 fade-in">
      <div className={`card-clean p-8 ${file ? 'border-emerald-500 bg-emerald-50/5' : 'border-dashed border-2'}`}>
        <input 
          type="file" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange}
          accept="image/*"
        />

        <div className="text-center">
          <AnimatePresence mode="wait">
            {isCameraOpen ? (
              <motion.div 
                key="camera"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                <div className="relative w-full aspect-video bg-slate-900 rounded-xl overflow-hidden shadow-clinical">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover mirror"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                
                <div className="mt-8 flex gap-3">
                  <button onClick={stopCamera} className="btn-secondary px-5">
                    <X size={20} />
                  </button>
                  <button 
                    onClick={captureImage}
                    className="btn-primary flex items-center gap-3"
                  >
                    <Camera size={20} />
                    {t('btn_capture')}
                  </button>
                </div>
              </motion.div>
            ) : !file ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center py-6"
              >
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl flex items-center justify-center mb-6">
                  <ImageIcon className="text-emerald-600 w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 font-heading">{t('upload_title')}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-10 max-w-xs mx-auto">
                  {t('upload_subtitle')}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                   <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-primary flex items-center justify-center gap-3"
                   >
                    <Upload size={18} />
                    {t('btn_analyze')}
                   </button>
                   <button 
                    onClick={startCamera}
                    className="btn-secondary flex items-center justify-center gap-3"
                   >
                    <Camera size={18} />
                    {t('btn_open_camera')}
                   </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="preview"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center"
              >
                <div className="relative w-full max-w-md aspect-square bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden shadow-clinical border border-slate-200 dark:border-slate-800">
                  <img src={preview!} className="w-full h-full object-cover" alt="Preview" />
                  <button 
                    onClick={clearFile}
                    className="absolute top-4 right-4 p-2 bg-slate-900/60 text-white rounded-lg hover:bg-red-500 backdrop-blur-md transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                <div className="mt-8 flex flex-col items-center w-full">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-5 py-2 rounded-full border border-emerald-100 dark:border-emerald-900 mb-8 uppercase tracking-widest">
                    <Check size={14} /> {file.name.length > 20 ? file.name.substring(0, 17) + '...' : file.name}
                  </div>
                  
                  <div className="flex gap-4 w-full justify-center">
                    <button
                      onClick={handleUpload}
                      disabled={isLoading}
                      className="btn-primary flex-1 max-w-[200px] flex items-center justify-center gap-3"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {t('btn_analyzing')}
                        </>
                      ) : (
                        <>
                          <Check size={18} />
                          {t('btn_analyze')}
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => { clearFile(); startCamera(); }}
                      disabled={isLoading}
                      className="btn-secondary px-5"
                      title={t('btn_retake')}
                    >
                      <RefreshCcw size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400 text-sm font-semibold shadow-sm"
          >
            <AlertCircle size={18} /> {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Uploader;
