import React from 'react';
import ChatAssistant from '../components/ChatAssistant';
import { useTranslation } from 'react-i18next';
import { MessageSquare, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ChatbotPageProps {
  prediction: any;
}

const ChatbotPage: React.FC<ChatbotPageProps> = ({ prediction }) => {
  const { t } = useTranslation();

  return (
    <div className="page-container fade-in min-h-[calc(100vh-16rem)] flex flex-col items-center">
      <div className="w-full max-w-4xl text-center mb-10 space-y-4">
        <h2 className="text-3xl font-extrabold font-heading text-slate-900 dark:text-white">AI Agri-Assistant</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Ask questions about plant care, disease prevention, and organic treatment protocols.
        </p>
      </div>

      {!prediction ? (
        <div className="w-full max-w-4xl card-clean p-12 text-center bg-slate-50/50 dark:bg-slate-900/50 border-dashed border-2">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-xl font-bold font-heading mb-4 text-slate-900 dark:text-white">No Diagnostic Context</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">
            To get personalized advice for a specific plant, please perform a disease scan first.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/detect" className="btn-primary">
              Run Disease Scan
            </Link>
            <button 
              onClick={() => window.location.reload()} 
              className="btn-secondary"
            >
              Start General Chat
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full">
          <ChatAssistant prediction={prediction.prediction} />
        </div>
      )}
    </div>
  );
};

export default ChatbotPage;
