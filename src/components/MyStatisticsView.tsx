import React from 'react';
import { ArrowLeft } from 'lucide-react';
import type { MatchStatEntry } from '../types';

interface MyStatisticsViewProps {
  stats: MatchStatEntry[];
  onBack: () => void;
}

export const MyStatisticsView: React.FC<MyStatisticsViewProps> = ({ stats, onBack }) => {
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
          <h1 className="text-lg font-semibold">My Statistics</h1>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto">
        {/* Mint Green Table Header matching Screenshot */}
        <div className="bg-[#56E698] text-white px-4 py-2.5 flex items-center text-[15px] font-medium">
          <div className="w-7 shrink-0">#</div>
          <div className="flex-1 pr-2">Match Info</div>
          <div className="w-16 text-center shrink-0">Paid</div>
          <div className="w-14 text-center shrink-0">Won</div>
        </div>

        {stats.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400 dark:text-zinc-500">
            No match statistics found yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
            {stats.map((row, idx) => (
              <div
                key={row.id}
                className="px-4 py-3.5 flex items-start text-[15px] text-slate-900 dark:text-zinc-100"
              >
                <div className="w-7 shrink-0 text-slate-700 dark:text-zinc-300 font-mono-num">
                  {idx + 1}
                </div>
                <div className="flex-1 pr-3 min-w-0">
                  <div className="leading-snug text-slate-900 dark:text-white break-words">
                    {row.matchInfo}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-zinc-400 mt-1">
                    {row.dateTime}
                  </div>
                </div>
                <div className="w-16 text-center shrink-0 font-mono-num text-slate-800 dark:text-zinc-200 pt-0.5">
                  {row.paid}
                </div>
                <div className="w-14 text-center shrink-0 font-mono-num text-slate-800 dark:text-zinc-200 pt-0.5">
                  {row.won}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
