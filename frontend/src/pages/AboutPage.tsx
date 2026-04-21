import React from 'react';
import { Leaf, ShieldCheck, Cpu, HeartPulse } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AboutPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="page-container fade-in">
      <div className="max-w-4xl mx-auto space-y-20">
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-extrabold font-heading text-slate-900 dark:text-white leading-tight">
            Bridging Agriculture <br /> & Healthcare
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
            AgriGuard is a production-grade diagnostic system designed to protect crops using clinical neural analysis and sustainable protocols.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600">
              <Leaf size={24} />
            </div>
            <h3 className="text-2xl font-bold font-heading">Our Mission</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We empower farmers and gardeners with professional tools to identify plant diseases instantly. By providing organic treatment protocols, we ensure that food production remains sustainable and chemical-free.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-xl flex items-center justify-center text-sky-600">
              <HeartPulse size={24} />
            </div>
            <h3 className="text-2xl font-bold font-heading">Healthcare Standards</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We apply clinical precision to plant diagnostics. Our UI/UX is inspired by modern medical dashboards to provide clear, actionable, and high-integrity data to field workers.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600">
              <Cpu size={24} />
            </div>
            <h3 className="text-2xl font-bold font-heading">Advanced AI</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Using a custom ResNet-50 architecture trained on thousands of plant pathologies, we achieve over 98% accuracy in localized field testing.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-2xl font-bold font-heading">Data Privacy</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Your field data and scan history are stored locally on your device. We prioritize privacy and offline availability for remote agricultural zones.
            </p>
          </div>
        </div>

        <div className="card-clean p-10 bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-center space-y-6">
          <h3 className="text-2xl font-bold font-heading">Ready to protect your crops?</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Join thousands of growers using AgriGuard to ensure a healthy harvest.
          </p>
          <a href="/detect" className="btn-primary inline-block">
            Get Started Now
          </a>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
