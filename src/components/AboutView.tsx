import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface AboutViewProps {
  onBack: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onBack }) => {
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
          <h1 className="text-lg font-semibold">About us</h1>
        </div>
      </header>

      <main className="w-full max-w-3xl mx-auto px-4 py-4">
        <p className="text-[15px] leading-relaxed text-slate-900 dark:text-zinc-100">
          SKILLBATTLE is a dynamic leader in the eSports arena, specializing in top-tier tournaments
          for popular games like Free Fire and BGMI. We are committed to creating an unparalleled
          competitive environment where gamers of all levels can challenge themselves and connect
          with others. Our platform ensures smooth tournament execution with real-time updates, fair
          play, and robust support. We take pride in offering engaging and well-organized events
          that celebrate skill and strategy. By leveraging advanced technology and a passion for
          gaming, SKILLBATTLE is dedicated to pushing the boundaries of what&apos;s possible in the
          eSports world. Join us to experience the thrill of competition and be part of a thriving
          gaming community.
        </p>
      </main>
    </div>
  );
};
