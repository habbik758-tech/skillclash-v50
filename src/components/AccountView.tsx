import React, { useState } from 'react';
import {
  BarChart2,
  ChevronRight,
  FileText,
  Flag,
  Gamepad2,
  Gift,
  Globe,
  Headphones,
  HelpCircle,
  Info,
  LogOut,
  Share2,
  ShoppingCart,
  Star,
  User,
  Users,
} from 'lucide-react';
import { GoldCoinIcon, SkillClashEmblem } from './BrandIcons';
import type { ModalType } from './HomePlayView';
import type { UserProfile } from '../types';

interface AccountViewProps {
  user: UserProfile;
  onToggleDarkMode: (next: boolean) => void;
  onOpenMyMatches: () => void;
  onOpenModal: (modal: ModalType) => void;
  onLogout: () => Promise<void> | void;
}

export const AccountView: React.FC<AccountViewProps> = ({
  user,
  onToggleDarkMode,
  onOpenMyMatches,
  onOpenModal,
  onLogout,
}) => {
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setLoggingOut(false);
      setConfirmLogoutOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-zinc-950 pb-24 lg:pb-10">
      {/* Black top header matching Screenshots 3, 6, 8 */}
      <header className="bg-[#0B0C10] text-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center">
          <h1 className="text-lg font-semibold">Me</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3.5 sm:px-6 py-4 space-y-3.5">
        {/* User Summary Card */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-xs border border-slate-200/70 dark:border-zinc-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-full bg-black overflow-hidden flex items-center justify-center shrink-0 shadow-xs border border-zinc-800">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <SkillClashEmblem className="w-full h-full" />
              )}
            </div>
            <div>
              <div className="text-xs text-slate-400 dark:text-zinc-400 font-medium">Username</div>
              <div className="text-base font-bold text-slate-900 dark:text-white">
                {user.username}
              </div>
              <div className="text-xs text-slate-400 dark:text-zinc-400 font-medium mt-1">
                Balance
              </div>
              <button
                type="button"
                onClick={() => onOpenModal('wallet')}
                className="flex items-center gap-1.5 text-sm font-bold font-mono-num text-slate-900 dark:text-white mt-0.5 hover:text-emerald-600"
              >
                <GoldCoinIcon className="w-4 h-4" />
                <span>{user.balance.toFixed(1)}</span>
              </button>
            </div>
          </div>

          <div className="w-12 h-12 rounded-full bg-black overflow-hidden shrink-0 border border-zinc-800">
            <SkillClashEmblem className="w-full h-full" />
          </div>
        </section>

        {/* Account Actions Stats Card */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl p-3.5 shadow-xs border border-slate-200/70 dark:border-zinc-800 space-y-2.5">
          <h2 className="text-xs font-medium text-slate-400 dark:text-zinc-400">
            Account Actions
          </h2>
          <div className="bg-[#F6F7FB] dark:bg-zinc-950 rounded-xl py-3.5 grid grid-cols-3 divide-x divide-slate-200 dark:divide-zinc-800 text-center">
            <div className="flex flex-col items-center gap-1 px-2">
              <Gamepad2 className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
              <div className="text-base font-bold font-mono-num text-slate-900 dark:text-white">
                {user.matchesPlayed}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-zinc-400">MatchesPlayed</div>
            </div>
            <div className="flex flex-col items-center gap-1 px-2">
              <BarChart2 className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
              <div className="text-base font-bold font-mono-num text-slate-900 dark:text-white">
                {user.totalKilled}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-zinc-400">TotalKilled</div>
            </div>
            <div className="flex flex-col items-center gap-1 px-2">
              <GoldCoinIcon className="w-5 h-5" />
              <div className="text-base font-bold font-mono-num text-slate-900 dark:text-white">
                {user.amountWon}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-zinc-400">AmountWon</div>
            </div>
          </div>
        </section>

        {/* Settings Card */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl p-3.5 shadow-xs border border-slate-200/70 dark:border-zinc-800 space-y-2">
          <h2 className="text-xs font-medium text-slate-400 dark:text-zinc-400">Settings</h2>
          <div className="flex items-center justify-between min-h-[44px]">
            <button
              type="button"
              onClick={() => onOpenModal('profile')}
              className="flex-1 flex items-center justify-between pr-3 text-left"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  My Profile
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>

            <button
              type="button"
              role="switch"
              aria-checked={user.darkMode}
              aria-label="Toggle dark theme"
              onClick={() => onToggleDarkMode(!user.darkMode)}
              className={`w-11 h-6 rounded-full transition-colors p-0.5 shrink-0 ${
                user.darkMode ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  user.darkMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </section>

        {/* My Statistics Card (2x3 Grid matching Screenshot 3) */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl p-3.5 shadow-xs border border-slate-200/70 dark:border-zinc-800 space-y-2.5">
          <h2 className="text-xs font-medium text-slate-400 dark:text-zinc-400">
            My Statistics Card
          </h2>
          <div className="grid grid-cols-2 gap-x-4 divide-y divide-slate-100 dark:divide-zinc-800">
            {[
              { label: 'My Matches', icon: Gamepad2, onClick: onOpenMyMatches },
              { label: 'My Order', icon: ShoppingCart, onClick: () => onOpenModal('orders') },
              { label: 'My Statistics', icon: BarChart2, onClick: () => onOpenModal('statistics') },
              { label: 'My Rewards', icon: Gift, onClick: () => onOpenModal('rewards') },
              { label: 'My Referrals', icon: Users, onClick: () => onOpenModal('refer') },
              { label: 'Announcement', icon: Flag, onClick: () => onOpenModal('announcements') },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  className="flex items-center gap-3 py-3.5 px-1 text-left hover:bg-slate-50 dark:hover:bg-zinc-800/60 rounded-lg transition-colors min-h-[48px]"
                >
                  <Icon className="w-4.5 h-4.5 text-zinc-900 dark:text-zinc-100 shrink-0" />
                  <span className="text-sm font-medium text-slate-800 dark:text-zinc-100 truncate">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Platform Information Card (new) matching Screenshots 3 & 6 */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl p-3.5 shadow-xs border border-slate-200/70 dark:border-zinc-800 space-y-1">
          <h2 className="text-xs font-medium text-slate-400 dark:text-zinc-400 mb-1">
            Platform Information Card (new)
          </h2>

          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {[
              { label: 'Top Players', icon: Star, onClick: () => onOpenModal('leaders') },
              { label: 'App Tutorial', icon: HelpCircle, onClick: () => onOpenModal('tutorial') },
              { label: 'About us', icon: Info, onClick: () => onOpenModal('about') },
              {
                label: 'Terms & Conditions',
                icon: FileText,
                onClick: () => onOpenModal('terms'),
              },
              {
                label: 'Customer Support',
                icon: Headphones,
                onClick: () => onOpenModal('support'),
              },
              { label: 'Share App', icon: Share2, onClick: () => onOpenModal('refer') },
              {
                label: 'Change Language',
                icon: Globe,
                onClick: () => onOpenModal('language'),
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  className="w-full flex items-center justify-between py-3.5 px-1 text-left hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors min-h-[48px]"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4.5 h-4.5 text-zinc-900 dark:text-zinc-100 shrink-0" />
                    <span className="text-sm font-medium text-slate-800 dark:text-zinc-100">
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setConfirmLogoutOpen(true)}
              className="w-full flex items-center justify-between py-3.5 px-1 text-left hover:bg-rose-50/70 dark:hover:bg-rose-950/30 transition-colors min-h-[48px]"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-4.5 h-4.5 text-zinc-900 dark:text-zinc-100 shrink-0" />
                <span className="text-sm font-medium text-rose-500">Logout</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </section>

        <div className="text-center text-xs font-medium text-slate-400 dark:text-zinc-500 pt-1">
          Version : 19
        </div>
      </main>

      {confirmLogoutOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-confirm-title"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h2
                  id="logout-confirm-title"
                  className="text-base font-bold text-slate-900 dark:text-white"
                >
                  Confirm Logout
                </h2>
                <p className="text-sm text-slate-600 dark:text-zinc-300 mt-0.5">
                  Are you sure you want to logout?
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                disabled={loggingOut}
                onClick={() => setConfirmLogoutOpen(false)}
                className="h-11 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loggingOut}
                onClick={handleConfirmLogout}
                className="h-11 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm transition-colors disabled:opacity-60"
              >
                {loggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
