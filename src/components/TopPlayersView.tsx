import React, { useMemo, useState } from 'react';
import { ArrowLeft, Crown, User } from 'lucide-react';
import { GoldCoinIcon } from './BrandIcons';
import type { LeaderboardEntry, UserProfile } from '../types';

interface TopPlayersViewProps {
  user: UserProfile;
  leaderboard: LeaderboardEntry[];
  onBack: () => void;
}

const GAME_FILTERS = [
  'All Games',
  'Battle Royale',
  'BR - SURVIVAL',
  'LW/CS MIX 1V1 ( SKILL ON/OFF )',
  'CS/LW 1V1',
  'CS/LW 2V2',
] as const;

const PERIOD_MULTIPLIER: Record<'WEEKLY' | 'MONTHLY' | 'OVERALL', number> = {
  WEEKLY: 1,
  MONTHLY: 3.4,
  OVERALL: 9.2,
};

const GAME_OFFSET: Record<string, number> = {
  'All Games': 1,
  'Battle Royale': 0.86,
  'BR - SURVIVAL': 0.74,
  'LW/CS MIX 1V1 ( SKILL ON/OFF )': 0.68,
  'CS/LW 1V1': 0.62,
  'CS/LW 2V2': 0.55,
};

export const TopPlayersView: React.FC<TopPlayersViewProps> = ({
  user,
  leaderboard,
  onBack,
}) => {
  const [selectedGame, setSelectedGame] = useState<string>('All Games');
  const [period, setPeriod] = useState<'WEEKLY' | 'MONTHLY' | 'OVERALL'>('WEEKLY');

  const computedEntries = useMemo(() => {
    const mult = PERIOD_MULTIPLIER[period] * (GAME_OFFSET[selectedGame] ?? 1);
    return leaderboard
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
        winnings: Math.round(entry.winnings * mult),
      }))
      .sort((a, b) => b.winnings - a.winnings)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }));
  }, [leaderboard, period, selectedGame]);

  const first = computedEntries[0];
  const second = computedEntries[1];
  const third = computedEntries[2];
  const rest = computedEntries.slice(3, 10);

  const userMatchIndex = computedEntries.findIndex(
    (e) => e.username.toLowerCase() === user.username.toLowerCase(),
  );
  const userRank = userMatchIndex >= 0 ? userMatchIndex + 1 : null;
  const userDisplayWinnings = user.amountWon > 6 ? user.amountWon : 0;

  const renderAvatarCircle = (username: string, variant: 'first' | 'second' | 'third' | 'row') => {
    const sizeCls =
      variant === 'first'
        ? 'w-20 h-20 ring-3 ring-amber-400 bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 text-amber-300'
        : variant === 'second'
          ? 'w-16 h-16 ring-2 ring-slate-300 bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800'
          : variant === 'third'
            ? 'w-16 h-16 ring-2 ring-zinc-700 bg-white dark:bg-zinc-900 text-slate-400'
            : 'w-9 h-9 ring-1 ring-zinc-800 dark:ring-zinc-600 bg-white dark:bg-zinc-900 text-slate-400';

    if (variant === 'first') {
      return (
        <div
          className={`${sizeCls} rounded-full flex items-center justify-center font-extrabold text-xl shadow-md`}
        >
          <span className="tracking-tight">{username.replace('@', '').slice(0, 2).toUpperCase()}</span>
        </div>
      );
    }
    if (variant === 'second') {
      return (
        <div
          className={`${sizeCls} rounded-full flex items-center justify-center font-extrabold text-base shadow-sm`}
        >
          <span>{username.slice(0, 2).toUpperCase()}</span>
        </div>
      );
    }
    return (
      <div className={`${sizeCls} rounded-full flex items-center justify-center shrink-0`}>
        <User className={variant === 'third' ? 'w-9 h-9 stroke-[1.6]' : 'w-5 h-5 stroke-[1.7]'} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-zinc-950 pb-24">
      {/* White Top Header matching Screenshot */}
      <header className="sticky top-0 z-30 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center text-slate-800 dark:text-white"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium text-slate-900 dark:text-white">Top Players</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-4 space-y-4">
        {/* Title & Crown */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Leaderboard
            </h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
              Compete. Conquer. Claim your spot.
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900 flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
        </div>

        {/* Game Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {GAME_FILTERS.map((game) => {
            const active = selectedGame === game;
            return (
              <button
                key={game}
                type="button"
                onClick={() => setSelectedGame(game)}
                className={`px-4 py-2 rounded-full text-xs whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'border-2 border-zinc-900 dark:border-white text-zinc-950 dark:text-white font-semibold bg-white dark:bg-zinc-900'
                    : 'border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 font-medium bg-white dark:bg-zinc-900'
                }`}
              >
                {game}
              </button>
            );
          })}
        </div>

        {/* WEEKLY / MONTHLY / OVERALL Segmented Bar */}
        <div className="grid grid-cols-3 rounded-full border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-0.5">
          {(['WEEKLY', 'MONTHLY', 'OVERALL'] as const).map((tab) => {
            const active = period === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setPeriod(tab)}
                className={`py-2.5 rounded-full text-xs tracking-wide transition-all ${
                  active
                    ? 'border-2 border-zinc-900 dark:border-white text-zinc-950 dark:text-white font-bold'
                    : 'text-slate-500 dark:text-zinc-400 font-semibold'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Top 3 Podium */}
        {first && second && third && (
          <section className="grid grid-cols-3 items-end gap-2 pt-5 pb-3 text-center">
            {/* Rank #2 */}
            <div className="flex flex-col items-center">
              <div className="relative">
                {renderAvatarCircle(second.username, 'second')}
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-slate-400 text-white text-[11px] font-bold flex items-center justify-center border-2 border-white dark:border-zinc-950">
                  2
                </span>
              </div>
              <div className="mt-3 text-xs font-bold text-slate-900 dark:text-white truncate max-w-full px-1">
                {second.username}
              </div>
              <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold font-mono-num text-slate-800 dark:text-zinc-100">
                <GoldCoinIcon className="w-3.5 h-3.5" />
                <span>{second.winnings}</span>
              </div>
            </div>

            {/* Rank #1 */}
            <div className="flex flex-col items-center -mt-4">
              <Crown className="w-5 h-5 text-amber-400 fill-amber-400 mb-1" />
              <div className="relative">
                {renderAvatarCircle(first.username, 'first')}
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-amber-400 text-white text-xs font-extrabold flex items-center justify-center border-2 border-white dark:border-zinc-950">
                  1
                </span>
              </div>
              <div className="mt-3.5 text-sm font-bold text-slate-900 dark:text-white truncate max-w-full px-1">
                {first.username}
              </div>
              <div className="mt-1.5 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FFF9E6] dark:bg-amber-950/60 border border-[#F5DFA0] dark:border-amber-700/60 text-xs font-extrabold font-mono-num text-slate-900 dark:text-amber-200">
                <GoldCoinIcon className="w-3.5 h-3.5" />
                <span>{first.winnings}</span>
              </div>
            </div>

            {/* Rank #3 */}
            <div className="flex flex-col items-center">
              <div className="relative">
                {renderAvatarCircle(third.username, 'third')}
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#9B7A67] text-white text-[11px] font-bold flex items-center justify-center border-2 border-white dark:border-zinc-950">
                  3
                </span>
              </div>
              <div className="mt-3 text-xs font-bold text-slate-900 dark:text-white truncate max-w-full px-1">
                {third.username}
              </div>
              <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold font-mono-num text-slate-800 dark:text-zinc-100">
                <GoldCoinIcon className="w-3.5 h-3.5" />
                <span>{third.winnings}</span>
              </div>
            </div>
          </section>
        )}

        {/* Rank Table (#4 - #10) */}
        <section className="pt-1">
          <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider text-slate-400 uppercase pb-2 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-5">
              <span className="w-8">RANK</span>
              <span>PLAYER</span>
            </div>
            <span>WINNINGS</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {rest.map((entry) => (
              <div key={entry.username} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-4 min-w-0">
                  <span className="w-9 text-sm font-bold font-mono-num text-slate-700 dark:text-zinc-300">
                    #{entry.rank}
                  </span>
                  {renderAvatarCircle(entry.username, 'row')}
                  <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {entry.username}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 font-bold font-mono-num text-sm text-slate-900 dark:text-white">
                  <GoldCoinIcon className="w-4 h-4" />
                  <span>{entry.winnings}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Sticky YOUR RANK Card */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-zinc-950 dark:via-zinc-950/95">
        <div className="max-w-3xl mx-auto rounded-xl bg-[#FFF9E6] dark:bg-amber-950/40 border border-[#F3DF9E] dark:border-amber-700/50 px-3.5 py-2.5 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-7 h-7 rounded-full bg-[#E5C97B] text-amber-950 font-extrabold text-xs flex items-center justify-center shrink-0">
              {userRank ? `#${userRank}` : '-'}
            </span>
            <div className="w-9 h-9 rounded-full ring-1 ring-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-center text-slate-400 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold tracking-wider text-amber-700 dark:text-amber-300 uppercase">
                YOUR RANK
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                You ({user.username}) • {userRank ? `Rank #${userRank}` : 'not ranked'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 font-extrabold font-mono-num text-sm text-slate-900 dark:text-white">
            <GoldCoinIcon className="w-4 h-4" />
            <span>{userDisplayWinnings}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
