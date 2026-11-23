import React, { useEffect, useState } from 'react';
import {
  Bell,
  Check,
  ChevronRight,
  Crown,
  Headphones,
  Megaphone,
  Play,
  Plus,
  ShieldCheck,
  Star,
  Trophy,
  User,
  Users,
  Wallet,
  BookOpen,
  Youtube,
  Instagram,
  Send,
  MessageCircle,
  Zap,
} from 'lucide-react';
import {
  COPY,
  IMAGES,
  INSTAGRAM_URL,
  TELEGRAM_URL,
  WHATSAPP_GROUP_URL,
  YOUTUBE_URL,
} from '../constants/assets';
import { GoldCoinIcon } from './BrandIcons';
import type {
  AnnouncementItem,
  AppNotification,
  BannerItem,
  FeedbackEntry,
  TournamentMatch,
  UserProfile,
  WithdrawalTicker,
} from '../types';

export type ModalType =
  | null
  | 'wallet'
  | 'refer'
  | 'tutorial'
  | 'leaders'
  | 'support'
  | 'announcements'
  | 'feedback'
  | 'lucky_draw'
  | 'promo_yt'
  | 'pvt_rules'
  | 'profile'
  | 'about'
  | 'terms'
  | 'rewards'
  | 'orders'
  | 'statistics'
  | 'community'
  | 'language';

interface HomePlayViewProps {
  user: UserProfile;
  joinedMatches: TournamentMatch[];
  feedbacks: FeedbackEntry[];
  recentWithdrawals: WithdrawalTicker[];
  announcements: AnnouncementItem[];
  banners?: BannerItem[];
  notifications?: AppNotification[];
  onOpenTournaments: () => void;
  onOpenContests: () => void;
  onOpenMyMatches: () => void;
  onOpenModal: (modal: ModalType) => void;
}

export const HomePlayView: React.FC<HomePlayViewProps> = ({
  user,
  joinedMatches,
  feedbacks,
  recentWithdrawals,
  announcements,
  banners = [],
  notifications = [],
  onOpenTournaments,
  onOpenContests,
  onOpenMyMatches,
  onOpenModal,
}) => {
  const [bannerIndex, setBannerIndex] = useState(0);
  const [feedbackIdx, setFeedbackIdx] = useState(0);
  const [withdrawalIdx, setWithdrawalIdx] = useState(0);
  const t = COPY[user.language] || COPY.en;
  const latestFeedback = feedbacks[feedbackIdx % Math.max(1, feedbacks.length)];
  const latestWithdrawal =
    recentWithdrawals[withdrawalIdx % Math.max(1, recentWithdrawals.length)];
  const nextUpcoming = joinedMatches.find((m) => m.status === 'UPCOMING');
  const pinnedNotice =
    announcements[0]?.title ||
    notifications[0]?.title ||
    'Follow The Rules → Enjoy Fair Gameplay ♦ SkillBattle = Safe, Secure & Trusted ♦';
  const totalSlides = 2 + banners.length;
  const activeSlide = bannerIndex % totalSlides;

  const topFeedbackId = feedbacks[0]?.id;
  const topWithdrawalId = recentWithdrawals[0]?.id;

  useEffect(() => {
    setFeedbackIdx(0);
  }, [topFeedbackId]);

  useEffect(() => {
    setWithdrawalIdx(0);
  }, [topWithdrawalId]);

  useEffect(() => {
    if (feedbacks.length <= 1 && recentWithdrawals.length <= 1) return;
    const timer = window.setInterval(() => {
      if (feedbacks.length > 1) {
        setFeedbackIdx((i) => (i + 1) % feedbacks.length);
      }
      if (recentWithdrawals.length > 1) {
        setWithdrawalIdx((i) => (i + 1) % recentWithdrawals.length);
      }
    }, 4500);
    return () => window.clearInterval(timer);
  }, [feedbacks.length, recentWithdrawals.length]);

  const winDashOffset = 100 - Math.min(100, Math.max(0, user.winRate));

  return (
    <div className="space-y-4 pb-24 lg:pb-10">
      {/* Top User + Wallet Bar (Mobile & Tablet; Desktop also shows cleanly) */}
      <div className="bg-white dark:bg-zinc-900 px-4 py-3 border-b border-slate-100 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Profile Summary */}
          <button
            type="button"
            onClick={() => onOpenModal('profile')}
            className="flex items-center gap-3 text-left min-h-[44px] group"
          >
            <div className="relative">
              <div className="w-11 h-11 rounded-full border-2 border-slate-800 dark:border-zinc-300 bg-slate-50 dark:bg-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-200 overflow-hidden">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold flex items-center justify-center">
                {user.level}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-900 dark:text-white text-[15px] leading-tight">
                  {user.username}
                </span>
                <Check className="w-3.5 h-3.5 text-slate-700 dark:text-emerald-400 stroke-[3]" />
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span>{user.rankTitle}</span>
              </div>
            </div>
          </button>

          {/* Right Actions: Bell + Balance Wallet Pill */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onOpenModal('announcements')}
              className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors relative"
              aria-label="Announcements"
            >
              <Bell className="w-5 h-5 fill-slate-800 dark:fill-zinc-200" />
            </button>

            <div className="flex items-center gap-2 bg-[#16181D] text-white pl-3 pr-1.5 py-1.5 rounded-xl shadow-sm">
              <button
                type="button"
                onClick={() => onOpenModal('wallet')}
                className="text-left leading-none pr-1"
              >
                <div className="text-[10px] text-zinc-400 font-medium">Balance</div>
                <div className="text-sm font-bold font-mono-num mt-0.5">
                  ₹ {user.balance.toFixed(2)}
                </div>
              </button>
              <button
                type="button"
                onClick={() => onOpenModal('wallet')}
                className="w-8 h-8 rounded-full bg-white text-zinc-900 flex items-center justify-center hover:bg-emerald-400 transition-colors"
                aria-label="Add coins to wallet"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 space-y-4">
        {/* Notice Ticker Bar */}
        <button
          type="button"
          onClick={() => onOpenModal('announcements')}
          className="w-full bg-[#1C1D22] hover:bg-[#23252C] text-white rounded-xl px-2.5 py-2 flex items-center gap-2.5 overflow-hidden transition-colors"
        >
          <span className="inline-flex items-center gap-1.5 bg-[#2A2C34] text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shrink-0 tracking-wide">
            <Megaphone className="w-3.5 h-3.5 text-rose-400" />
            NOTICE
          </span>
          <div className="flex-1 overflow-hidden text-left">
            <div className="animate-notice-marquee text-xs font-medium text-zinc-100">
              <span className="pr-10">
                {pinnedNotice} &nbsp;&nbsp;&nbsp; 100% FairPlay Anti-Hack Active &nbsp;&nbsp;&nbsp; Instant UPI Payouts
              </span>
              <span className="pr-10" aria-hidden="true">
                {pinnedNotice} &nbsp;&nbsp;&nbsp; 100% FairPlay Anti-Hack Active &nbsp;&nbsp;&nbsp; Instant UPI Payouts
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
        </button>

        {/* Desktop Split: Hero Carousel + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Hero Carousel */}
          <div className="lg:col-span-7 relative rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm border border-slate-200/70 dark:border-zinc-800">
            {activeSlide === 0 ? (
              <button
                type="button"
                onClick={() => onOpenModal('tutorial')}
                className="w-full text-left relative aspect-[16/7.2] sm:aspect-[16/6.5] flex items-center overflow-hidden group"
              >
                <img
                  src={IMAGES.HERO_GUIDE}
                  alt="Watch SkillBattle App Guide Video"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover object-left"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/75 to-white/95 dark:via-zinc-900/80 dark:to-zinc-900/95" />
                <div className="relative z-10 ml-auto w-[62%] sm:w-[56%] pr-4 sm:pr-7 py-3 flex flex-col items-center text-center">
                  <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-zinc-300">
                    IF YOU&apos;RE NEW HERE
                  </span>
                  <div className="flex items-center gap-1.5 text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-none mt-0.5">
                    <span>WATCH</span>
                    <span className="w-6 h-5 sm:w-8 sm:h-6 rounded bg-amber-400/90 text-zinc-900 inline-flex items-center justify-center">
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </span>
                  </div>
                  <div className="mt-2 w-full max-w-[230px] rounded-md bg-white/95 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 px-2.5 py-1 text-[10px] sm:text-xs font-extrabold text-slate-800 dark:text-zinc-100 shadow-xs">
                    APP GUIDE VIDEO
                  </div>
                  <div className="mt-1.5 w-full max-w-[230px] rounded-md bg-white/95 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 px-2.5 py-1.5 text-[11px] sm:text-sm font-extrabold text-slate-900 dark:text-white shadow-xs group-hover:bg-amber-400 group-hover:text-zinc-900 group-hover:border-amber-400 transition-colors">
                    TAP TO WATCH
                  </div>
                </div>
              </button>
            ) : activeSlide === 1 ? (
              <button
                type="button"
                onClick={() => onOpenModal('wallet')}
                className="w-full text-left relative aspect-[16/7.2] sm:aspect-[16/6.5] flex items-center overflow-hidden bg-zinc-950 text-white"
              >
                <img
                  src={IMAGES.MORE_PROMO}
                  alt="Deposit Now Instant UPI"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover opacity-65"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
                <div className="relative z-10 px-6 py-4 max-w-md">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
                    INSTANT UPI WALLET
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1">
                    DEPOSIT NOW &amp; JOIN ₹10 ROOMS
                  </h3>
                  <p className="text-xs text-zinc-300 mt-1">
                    Zero commission on FairPlay rooms. Withdraw winnings 24×7 to your UPI ID.
                  </p>
                  <span className="inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 rounded-lg bg-emerald-400 text-zinc-950 font-bold text-xs">
                    ADD COINS NOW
                  </span>
                </div>
              </button>
            ) : (
              (() => {
                const adminBanner = banners[activeSlide - 2];
                return (
                  <button
                    type="button"
                    onClick={onOpenTournaments}
                    className="w-full text-left relative aspect-[16/7.2] sm:aspect-[16/6.5] flex items-center overflow-hidden bg-zinc-950 text-white"
                  >
                    <img
                      src={adminBanner?.imageUrl || IMAGES.MORE_PROMO}
                      alt={adminBanner?.title || 'SkillBattle Featured Tournament'}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />
                    <div className="relative z-10 px-6 py-4 max-w-md">
                      {adminBanner?.badgeText && (
                        <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                          {adminBanner.badgeText}
                        </span>
                      )}
                      <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1">
                        {adminBanner?.title || 'FEATURED TOURNAMENT'}
                      </h3>
                      {adminBanner?.subtitle && (
                        <p className="text-xs text-zinc-300 mt-1">{adminBanner.subtitle}</p>
                      )}
                      <span className="inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 rounded-lg bg-[#54E397] text-zinc-950 font-bold text-xs">
                        JOIN TOURNAMENTS
                      </span>
                    </div>
                  </button>
                );
              })()
            )}

            {/* Carousel Controls */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
              {Array.from({ length: totalSlides }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setBannerIndex(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    activeSlide === idx ? 'w-5 bg-zinc-900 dark:bg-white' : 'w-2 bg-zinc-400/60'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 5 Quick Actions Row */}
          <div className="lg:col-span-5 grid grid-cols-5 lg:grid-cols-5 gap-2 sm:gap-3 items-center">
            {[
              {
                label: 'Refer & Earn',
                icon: Users,
                color: 'text-teal-700 dark:text-teal-300',
                bg: 'bg-teal-50 dark:bg-teal-950/60',
                action: () => onOpenModal('refer'),
              },
              {
                label: 'App Tutorial',
                icon: BookOpen,
                color: 'text-blue-600 dark:text-blue-300',
                bg: 'bg-blue-50 dark:bg-blue-950/60',
                action: () => onOpenModal('tutorial'),
              },
              {
                label: 'My Wallet',
                icon: Wallet,
                color: 'text-amber-600 dark:text-amber-300',
                bg: 'bg-amber-50 dark:bg-amber-950/60',
                action: () => onOpenModal('wallet'),
              },
              {
                label: 'Leaders',
                icon: Crown,
                color: 'text-yellow-600 dark:text-yellow-300',
                bg: 'bg-yellow-50 dark:bg-yellow-950/60',
                action: () => onOpenModal('leaders'),
              },
              {
                label: 'Support',
                icon: Headphones,
                color: 'text-cyan-700 dark:text-cyan-300',
                bg: 'bg-cyan-50 dark:bg-cyan-950/60',
                action: () => onOpenModal('support'),
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.action}
                  className="flex flex-col items-center gap-1.5 group min-h-[44px]"
                >
                  <div
                    className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs flex items-center justify-center group-hover:scale-105 group-active:scale-95 transition-transform`}
                  >
                    <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-slate-700 dark:text-zinc-300 text-center leading-tight whitespace-nowrap">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TOP GAMES Section */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {t.topGames}
                </h2>
                <Zap className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                🚀 {t.skillsMeetRewards}
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenTournaments}
              className="px-3.5 py-2 rounded-full bg-[#16181D] hover:bg-zinc-800 text-white text-xs font-bold whitespace-nowrap shrink-0 min-h-[36px] transition-colors"
            >
              {t.viewAll}
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: Free Fire Tournaments */}
            <button
              type="button"
              onClick={onOpenTournaments}
              className="relative aspect-[16/10.5] rounded-2xl overflow-hidden shadow-sm border border-slate-200/70 dark:border-zinc-800 group text-left"
            >
              <img
                src={IMAGES.TOP_GAME}
                alt="Free Fire Tournaments"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
              <span className="absolute top-0 left-0 inline-flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-br-xl">
                <ShieldCheck className="w-3 h-3" />
                FairPlay : ON
              </span>
              <span className="absolute bottom-2.5 left-2.5 text-xs font-extrabold text-white drop-shadow">
                Tournaments (13)
              </span>
              <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 bg-white text-zinc-900 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow">
                Play <Play className="w-3 h-3 fill-current" />
              </span>
            </button>

            {/* Card 2: Private Contests */}
            <button
              type="button"
              onClick={onOpenContests}
              className="relative aspect-[16/10.5] rounded-2xl overflow-hidden shadow-sm border border-slate-200/70 dark:border-zinc-800 group text-left"
            >
              <img
                src={IMAGES.TOP_GAME}
                alt="Private Contests"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover hue-rotate-15 group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
              <span className="absolute top-0 left-0 inline-flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-br-xl">
                <ShieldCheck className="w-3 h-3" />
                FairPlay : ON
              </span>
              <span className="absolute bottom-2.5 left-2.5 text-xs font-extrabold text-white drop-shadow">
                PVT Contest
              </span>
              <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 bg-white text-zinc-900 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow">
                Play <Play className="w-3 h-3 fill-current" />
              </span>
            </button>

            {/* Extra desktop cards for clean 4-column presence on lg: */}
            <button
              type="button"
              onClick={onOpenTournaments}
              className="hidden lg:block relative aspect-[16/10.5] rounded-2xl overflow-hidden shadow-sm border border-slate-200/70 dark:border-zinc-800 group text-left"
            >
              <img
                src={IMAGES.BATTLE_ART}
                alt="Battle Royale Solo"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />
              <span className="absolute top-0 left-0 inline-flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-br-xl">
                <ShieldCheck className="w-3 h-3" />
                FairPlay : ON
              </span>
              <span className="absolute bottom-2.5 left-2.5 text-xs font-extrabold text-white">
                Battle Royale
              </span>
              <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 bg-white text-zinc-900 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow">
                Play <Play className="w-3 h-3 fill-current" />
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenTournaments}
              className="hidden lg:block relative aspect-[16/10.5] rounded-2xl overflow-hidden shadow-sm border border-slate-200/70 dark:border-zinc-800 group text-left"
            >
              <img
                src={IMAGES.HEADSHOT_ART}
                alt="Only Head 1v1"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />
              <span className="absolute top-0 left-0 inline-flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-br-xl">
                <ShieldCheck className="w-3 h-3" />
                FairPlay : ON
              </span>
              <span className="absolute bottom-2.5 left-2.5 text-xs font-extrabold text-white">
                Only Head 1v1
              </span>
              <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 bg-white text-zinc-900 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow">
                Play <Play className="w-3 h-3 fill-current" />
              </span>
            </button>
          </div>
        </section>

        {/* MY TOURNAMENTS Card */}
        <section className="bg-white dark:bg-zinc-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200/70 dark:border-zinc-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {t.myTournaments}
                </h2>
                <span className="w-4 h-4 rounded-full bg-rose-600 text-white inline-flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">⚡ {t.playMoreWinMore}</p>
            </div>
            <button
              type="button"
              onClick={onOpenMyMatches}
              className="px-3.5 py-2 rounded-full bg-[#16181D] hover:bg-zinc-800 text-white text-xs font-bold whitespace-nowrap shrink-0 transition-colors"
            >
              {t.viewAll}
            </button>
          </div>

          <div className="grid grid-cols-12 gap-3 items-stretch">
            {/* Left: Upcoming Match / Empty Explore */}
            <div className="col-span-7 sm:col-span-8 rounded-xl border border-slate-100 dark:border-zinc-800 bg-[#FAFAFC] dark:bg-zinc-950/60 p-3 flex flex-col items-center justify-center text-center min-h-[120px]">
              {nextUpcoming ? (
                <div className="w-full text-left space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                      {nextUpcoming.title}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      Joined
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    {nextUpcoming.map} · {nextUpcoming.startTime}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-mono-num text-slate-700 dark:text-zinc-300">
                      Room: {nextUpcoming.roomId}
                    </span>
                    <button
                      type="button"
                      onClick={onOpenMyMatches}
                      className="px-3 py-1 rounded-full bg-[#16181D] text-white text-[11px] font-bold"
                    >
                      DETAILS
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <Trophy className="w-6 h-6 text-zinc-900 dark:text-zinc-100 mb-1.5" />
                  <p className="text-[11px] sm:text-xs font-medium text-slate-600 dark:text-zinc-400 mb-2.5">
                    {t.noUpcoming}
                  </p>
                  <button
                    type="button"
                    onClick={onOpenTournaments}
                    className="px-4 py-1.5 rounded-full bg-[#16181D] hover:bg-zinc-800 text-white text-[11px] font-extrabold tracking-wide uppercase transition-colors"
                  >
                    {t.explore}
                  </button>
                </>
              )}
            </div>

            {/* Right: WIN BIG EVERYDAY Trophy Card */}
            <button
              type="button"
              onClick={() => onOpenModal('leaders')}
              className="col-span-5 sm:col-span-4 rounded-xl overflow-hidden relative border border-amber-200/70 dark:border-zinc-800 group text-left min-h-[120px]"
            >
              <img
                src={IMAGES.WIN_TROPHY}
                alt="Win Big Everyday"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/50 to-transparent dark:from-zinc-950/90 dark:via-zinc-950/50" />
              <div className="relative z-10 p-2.5 sm:p-3 flex flex-col justify-center h-full max-w-[68%]">
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-tight uppercase">
                  WIN BIG
                  <br />
                  EVERYDAY
                </span>
              </div>
            </button>
          </div>
        </section>

        {/* 3-Column User Metrics Strip */}
        <section className="grid grid-cols-3 gap-2.5 sm:gap-4">
          {/* Total Matches */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3 sm:p-4 border border-slate-200/70 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 font-medium">
              {t.totalMatches}
            </span>
            <div className="text-xl sm:text-2xl font-extrabold font-mono-num text-slate-900 dark:text-white mt-1">
              {user.matchesPlayed}
            </div>
            <svg viewBox="0 0 120 24" className="w-full h-5 mt-1 text-indigo-500" fill="none">
              <path
                d="M2 20 C 24 19, 44 17, 64 13 C 82 10, 96 15, 118 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Win Rate */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3 sm:p-4 border border-slate-200/70 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 font-medium">
              {t.winRate}
            </span>
            <div className="flex items-center justify-between gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-extrabold font-mono-num text-indigo-600 dark:text-indigo-400">
                {user.winRate}%
              </span>
              <svg viewBox="0 0 36 36" className="w-9 h-9 -rotate-90 shrink-0">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  className="text-slate-100 dark:text-zinc-800"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeDasharray="88"
                  strokeDashoffset={(88 * winDashOffset) / 100}
                  strokeLinecap="round"
                  className="text-indigo-500"
                />
              </svg>
            </div>
          </div>

          {/* Total Winnings */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3 sm:p-4 border border-slate-200/70 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 font-medium">
              {t.totalWinnings}
            </span>
            <div className="flex items-end justify-between gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-extrabold font-mono-num text-emerald-500">
                ₹ {user.amountWon}
              </span>
              <GoldCoinIcon className="w-7 h-7 shrink-0" />
            </div>
          </div>
        </section>

        {/* FEEDBACK & RECENT WITHDRAWAL (Real-time WebSocket synced) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Feedback Card */}
          <button
            type="button"
            onClick={() => onOpenModal('feedback')}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-3.5 border border-slate-200/70 dark:border-zinc-800 shadow-xs text-left hover:border-indigo-300 dark:hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                FEEDBACK
              </span>
              {feedbacks.length > 1 && (
                <span className="text-[10px] font-mono-num text-slate-400 dark:text-zinc-500">
                  {(feedbackIdx % feedbacks.length) + 1}/{feedbacks.length}
                </span>
              )}
            </div>
            {latestFeedback ? (
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full border border-slate-300 dark:border-zinc-700 flex items-center justify-center shrink-0 text-slate-600 dark:text-zinc-300 overflow-hidden">
                  {latestFeedback.avatarUrl ? (
                    <img
                      src={latestFeedback.avatarUrl}
                      alt={latestFeedback.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {latestFeedback.username}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < latestFeedback.rating ? 'fill-amber-400' : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                    {latestFeedback.comment}
                  </p>
                </div>
              </div>
            ) : null}
          </button>

          {/* Recent Withdrawal Card */}
          <button
            type="button"
            onClick={() => onOpenModal('wallet')}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-3.5 border border-slate-200/70 dark:border-zinc-800 shadow-xs text-left hover:border-emerald-300 dark:hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                RECENT WITHDRAWAL
              </span>
              {latestWithdrawal?.timeAgo && (
                <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">
                  {latestWithdrawal.timeAgo}
                </span>
              )}
            </div>
            {latestWithdrawal ? (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full border border-slate-300 dark:border-zinc-700 flex items-center justify-center shrink-0 text-slate-600 dark:text-zinc-300 overflow-hidden">
                  {latestWithdrawal.avatarUrl ? (
                    <img
                      src={latestWithdrawal.avatarUrl}
                      alt={latestWithdrawal.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {latestWithdrawal.username}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold font-mono-num text-emerald-600 dark:text-emerald-400 mt-0.5">
                    <span>₹{latestWithdrawal.amount}</span>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>
              </div>
            ) : null}
          </button>
        </section>

        {/* Join Our Community */}
        <section className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 border border-slate-200/70 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-slate-200 dark:bg-zinc-800" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-zinc-200 whitespace-nowrap">
              {t.joinCommunity}
            </h3>
            <div className="h-px flex-1 bg-slate-200 dark:bg-zinc-800" />
          </div>

          <div className="flex items-center justify-center gap-4 sm:gap-6">
            {[
              {
                name: 'WhatsApp',
                icon: MessageCircle,
                bg: 'bg-[#25D366]',
                href: WHATSAPP_GROUP_URL,
              },
              {
                name: 'Telegram',
                icon: Send,
                bg: 'bg-[#229ED9]',
                href: TELEGRAM_URL,
              },
              {
                name: 'Instagram',
                icon: Instagram,
                bg: 'bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]',
                href: INSTAGRAM_URL,
              },
              {
                name: 'YouTube',
                icon: Youtube,
                bg: 'bg-[#FF0000]',
                href: YOUTUBE_URL,
              },
            ].map((soc) => {
              const Icon = soc.icon;
              if (soc.href) {
                return (
                  <a
                    key={soc.name}
                    href={soc.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Join ${soc.name}`}
                    className={`w-12 h-12 rounded-xl ${soc.bg} text-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </a>
                );
              }
              return (
                <button
                  key={soc.name}
                  type="button"
                  onClick={() => onOpenModal('community')}
                  aria-label={`Join ${soc.name}`}
                  className={`w-12 h-12 rounded-xl ${soc.bg} text-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-transform`}
                >
                  <Icon className="w-6 h-6" />
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
