import React, { useEffect, useState } from 'react';
import { ArrowLeft, Clock, Copy, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { GoldCoinIcon } from './BrandIcons';
import { getRoomRevealInfo } from '../utils/matchSchedule';
import type { MatchStatus, TournamentMatch, UserProfile } from '../types';

interface MyMatchesViewProps {
  user: UserProfile;
  joinedMatches: TournamentMatch[];
  onBack: () => void;
  onExploreTournaments: () => void;
  onOpenWallet: () => void;
}

export const MyMatchesView: React.FC<MyMatchesViewProps> = ({
  user,
  joinedMatches,
  onBack,
  onExploreTournaments,
  onOpenWallet,
}) => {
  const [activeTab, setActiveTab] = useState<MatchStatus>('UPCOMING');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const visibleMatches = joinedMatches.filter((m) => m.status === activeTab);

  const emptyMessage =
    activeTab === 'ONGOING'
      ? 'No Ongoing Match Found.'
      : activeTab === 'UPCOMING'
        ? 'No Upcoming Match Found.'
        : 'No Match Results Found.';

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col pb-24">
      {/* Black top header matching Screenshot 2 */}
      <header className="bg-[#0B0C10] text-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center text-white"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">My Matches</h1>
          </div>

          <button
            type="button"
            onClick={onOpenWallet}
            className="inline-flex items-center gap-1.5 bg-white text-zinc-900 px-2.5 py-1 rounded-md text-xs font-extrabold font-mono-num"
          >
            <GoldCoinIcon className="w-4 h-4" />
            <span>{user.balance.toFixed(1)}</span>
          </button>
        </div>

        {/* 3-Tab Black Strip: ONGOING | UPCOMING | RESULTS */}
        <div className="max-w-7xl mx-auto grid grid-cols-3 text-center">
          {(['ONGOING', 'UPCOMING', 'RESULTS'] as MatchStatus[]).map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`py-3 text-xs font-extrabold tracking-wider uppercase transition-colors border-b-2 ${
                  active
                    ? 'text-white border-white'
                    : 'text-zinc-500 border-transparent hover:text-zinc-300'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 flex flex-col">
        {visibleMatches.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-24">
            <p className="text-base font-medium text-slate-800 dark:text-zinc-200">
              {emptyMessage}
            </p>
            <button
              type="button"
              onClick={onExploreTournaments}
              className="mt-4 px-5 py-2.5 rounded-full bg-[#16181D] text-white text-xs font-bold uppercase tracking-wide hover:bg-zinc-800 transition-colors"
            >
              Explore Tournaments
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleMatches.map((m) => {
              const reveal = getRoomRevealInfo(m, nowMs, true);
              return (
                <div
                  key={m.id}
                  className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {m.mode}
                      </div>
                      <h2 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {m.title}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        {m.map} · {m.startTime}
                      </p>
                    </div>
                    <span className="text-xs font-mono-num font-bold text-indigo-600 dark:text-indigo-400">
                      ₹{m.prizePool} Pool
                    </span>
                  </div>

                  {reveal.isUnlocked ? (
                    <div className="rounded-xl bg-slate-50 dark:bg-zinc-950 p-3 flex items-center justify-between text-xs font-mono-num">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-200">
                          <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                          Room ID: <strong>{m.roomId}</strong>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-200">
                          <Lock className="w-3.5 h-3.5 text-emerald-500" />
                          Password: <strong>{m.roomPassword}</strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(`ID: ${m.roomId} | Pass: ${m.roomPassword}`);
                          setCopiedId(m.id);
                          setTimeout(() => setCopiedId(null), 1500);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#16181D] text-white font-sans font-bold text-xs"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copiedId === m.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 p-3 space-y-1 text-xs">
                      <div className="flex items-center justify-between font-bold text-amber-800 dark:text-amber-300">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          Reveals at {reveal.revealClock}
                        </span>
                        <span className="font-mono-num">{reveal.countdownLabel}</span>
                      </div>
                      <p className="text-[11px] text-amber-700 dark:text-amber-200/80">
                        Room ID &amp; Password automatically unlock 10 minutes before match start.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
