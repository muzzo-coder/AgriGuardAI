import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Loader2, AlertCircle, RefreshCcw, Mic, MicOff, Stethoscope } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatAssistantProps {
  prediction: any;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ prediction }) => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorType, setErrorType] = useState<'server' | 'api' | null>(null);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-start chat with prediction context
  useEffect(() => {
    if (prediction && messages.length === 0) {
      handleAutoStart();
    }
  }, [prediction]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = i18n.language;
      
      let finalTranscript = '';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setInput(finalTranscript + interimTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        if (isListening) {
          try {
            recognition.start();
          } catch (e) {
            console.error("Failed to restart recognition:", e);
          }
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [i18n.language]);

  useEffect(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Start failed:", e);
      }
    } else {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert(t('err_mic_fail'));
      return;
    }
    setIsListening(prev => !prev);
  };

  const handleAutoStart = async () => {
    setIsLoading(true);
    setErrorType(null);
    try {
      const response = await api.post('/chatbot', {
        message: '',
        prediction: prediction,
        language: i18n.language.split('-')[0]
      });
      setMessages([{ role: 'assistant', content: response.data.response }]);
    } catch (error: any) {
      console.error('Chatbot error:', error);
      setErrorType(error.code === 'ERR_NETWORK' || !error.response ? 'server' : 'api');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);
    setErrorType(null);

    try {
      const response = await api.post('/chatbot', {
        message: userMsg,
        prediction: prediction,
        language: i18n.language.split('-')[0]
      });
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error: any) {
      setErrorType(error.code === 'ERR_NETWORK' || !error.response ? 'server' : 'api');
      setMessages(prev => [...prev, { role: 'assistant', content: 'Unexpected connection issue. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.section 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto px-6 mb-20 fade-in"
    >
      <div className="card-clean h-[600px] flex flex-col overflow-hidden">
        
        {/* Clean Healthcare-Style Header */}
        <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center border border-emerald-200/50 dark:border-emerald-800/50">
              <Stethoscope className="text-emerald-600 w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-heading">{t('chat_title')}</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest">{t('chat_subtitle')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messaging Interface */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth bg-white dark:bg-slate-900"
        >
          <AnimatePresence mode="popLayout">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                  msg.role === 'user' 
                    ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' 
                    : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/30 text-emerald-600'
                }`}>
                  {msg.role === 'user' ? <User size={14} /> : <Stethoscope size={14} />}
                </div>
                <div className={`max-w-[80%] p-5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-slate-800 dark:bg-emerald-600 text-white rounded-tr-none' 
                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-800'
                }`}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg flex items-center justify-center text-emerald-600 border border-emerald-100 dark:border-emerald-900/30">
                <Stethoscope size={14} />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex gap-1.5 items-center">
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0 }} className="w-1 h-1 bg-emerald-500 rounded-full" />
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }} className="w-1 h-1 bg-emerald-500 rounded-full" />
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }} className="w-1 h-1 bg-emerald-500 rounded-full" />
              </div>
            </div>
          )}
        </div>

        {/* Professional Input Section */}
        <form 
          onSubmit={handleSendMessage}
          className="p-6 bg-slate-50/50 dark:bg-slate-950/30 border-t border-slate-100 dark:border-slate-800"
        >
          <div className="relative flex items-center gap-3">
            <div className="relative flex-1">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isLoading ? t('chat_processing') : isListening ? t('chat_listening') : t('chat_placeholder')}
                disabled={isLoading || errorType === 'server'}
                className={`w-full pl-6 pr-14 py-4 bg-white dark:bg-slate-900 border ${isListening ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200 dark:border-slate-800'} rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all disabled:opacity-50 text-sm font-medium dark:text-white shadow-soft`}
              />
              <button
                type="button"
                onClick={toggleListening}
                disabled={isLoading || errorType === 'server'}
                className={`absolute right-2 top-2 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-emerald-600'
                }`}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            </div>
            
            <button
              type="submit"
              disabled={!input.trim() || isLoading || errorType === 'server'}
              className="w-12 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/10 flex items-center justify-center transition-all active:scale-95 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 shrink-0"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </motion.section>
  );
};

export default ChatAssistant;
