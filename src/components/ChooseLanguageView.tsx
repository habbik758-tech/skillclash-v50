import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { AppLanguage } from '../types';

interface ChooseLanguageViewProps {
  currentLanguage: AppLanguage;
  onBack: () => void;
  onContinue: (language: AppLanguage) => Promise<void>;
}

export const ChooseLanguageView: React.FC<ChooseLanguageViewProps> = ({
  currentLanguage,
  onBack,
  onContinue,
}) => {
  const [selected, setSelected] = useState<AppLanguage>(currentLanguage || 'en');
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    setSaving(true);
    try {
      await onContinue(selected);
      onBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
      {/* Black Top Header matching Screenshot */}
      <header className="sticky top-0 z-30 bg-[#0B0C10] text-white">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center text-white"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Choose Language</h1>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-5 py-6 flex flex-col justify-between">
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setSelected('en')}
            className="w-full border border-[#5A8D93] dark:border-teal-600 rounded-xs px-4 py-6 flex items-center gap-6 text-left bg-white dark:bg-zinc-900"
          >
            <span className="w-5 h-5 rounded-full border-2 border-zinc-950 dark:border-white flex items-center justify-center shrink-0">
              {selected === 'en' && (
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-950 dark:bg-white" />
              )}
            </span>
            <span className="text-[15px] font-medium text-slate-900 dark:text-white">English</span>
          </button>
        </div>

        <div className="pt-6 pb-2">
          <button
            type="button"
            disabled={saving}
            onClick={handleContinue}
            className="w-full h-12 rounded-md bg-[#56E698] hover:bg-[#46d687] disabled:opacity-60 text-white font-semibold uppercase tracking-wide text-sm shadow-xs transition-colors"
          >
            {saving ? 'SAVING...' : 'CONTINUE'}
          </button>
        </div>
      </main>
    </div>
  );
};
