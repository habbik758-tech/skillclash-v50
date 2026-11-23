import React from 'react';
import { Check, Share2, Youtube } from 'lucide-react';
import { IMAGES, YOUTUBE_URL } from '../constants/assets';
import { GoldCoinIcon, SkillClashEmblem } from './BrandIcons';
import type { ModalType } from './HomePlayView';
import type { UserProfile } from '../types';

interface MoreViewProps {
  user: UserProfile;
  onOpenModal: (modal: ModalType) => void;
}

export const MoreView: React.FC<MoreViewProps> = ({ user, onOpenModal }) => {
  return (
    <div className="min-h-screen bg-[#F2F3F7] dark:bg-zinc-950 pb-24 lg:pb-10">
      {/* Black Top Bar matching Screenshot 9 */}
      <header className="bg-[#0B0C10] text-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-semibold">More</h1>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onOpenModal('refer')}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center text-white hover:text-emerald-400 transition-colors"
              aria-label="Share SkillBattle"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => onOpenModal('wallet')}
              className="inline-flex items-center gap-1.5 bg-white text-zinc-900 px-2.5 py-1 rounded-md text-xs font-extrabold font-mono-num"
            >
              <GoldCoinIcon className="w-4 h-4" />
              <span>{user.balance.toFixed(1)}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 py-4 grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Banner 1: REFER EARN */}
        <button
          type="button"
          onClick={() => onOpenModal('refer')}
          className="relative w-full aspect-[16/6.2] rounded-xl overflow-hidden bg-zinc-950 text-white shadow-sm group text-left"
        >
          <img
            src={IMAGES.MORE_PROMO}
            alt="Refer and Earn"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-black/75" />
          <div className="relative z-10 h-full px-5 flex items-center justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow">
              REFER
            </span>
            <div className="flex flex-col items-end gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-300 drop-shadow">
                EARN
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white text-[11px] font-extrabold uppercase tracking-wide shadow">
                SHARE <Share2 className="w-3 h-3" />
              </span>
            </div>
          </div>
        </button>

        {/* Banner 2: CREATE & EARN! SkillClash App Promo Challenge */}
        <button
          type="button"
          onClick={() => onOpenModal('promo_yt')}
          className="relative w-full aspect-[16/6.2] rounded-xl overflow-hidden bg-zinc-950 text-white shadow-sm group text-left"
        >
          <img
            src={IMAGES.BATTLE_ART}
            alt="Create and Earn Promo Challenge"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-red-950/75 to-black/90" />
          <div className="relative z-10 h-full px-4 sm:px-5 flex items-center justify-between gap-3">
            <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/10 items-center justify-center shrink-0">
              <Youtube className="w-8 h-8 text-red-500" />
            </div>
            <div className="ml-auto text-right space-y-1 max-w-[78%]">
              <div className="text-base sm:text-xl font-extrabold tracking-tight leading-none">
                CREATE &amp; <span className="text-rose-500">EARN!</span>
              </div>
              <div className="text-[11px] text-zinc-200 font-semibold">
                SkillBattle App Promo Challenge
              </div>
              <div className="inline-block bg-black/80 border border-white/25 rounded px-2.5 py-1 text-[11px] sm:text-xs font-extrabold">
                GET 250 RUPEES <span className="text-amber-300">FOR 5K+ VIEWS ON YT SHORTS</span>
              </div>
              <div className="pt-0.5">
                <span className="inline-block px-3.5 py-1 rounded-full bg-sky-500 text-white text-[10px] sm:text-xs font-extrabold uppercase">
                  TAP TO JOIN
                </span>
              </div>
            </div>
          </div>
        </button>

        {/* Banner 3: SKILLCLASH PVT CONTEST RULES */}
        <button
          type="button"
          onClick={() => onOpenModal('pvt_rules')}
          className="relative w-full aspect-[16/6.2] rounded-xl overflow-hidden bg-slate-900 text-white shadow-sm group text-left"
        >
          <img
            src={IMAGES.HEADSHOT_ART}
            alt="SkillBattle Private Contest Rules"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-slate-900/60 to-black/85" />
          <div className="relative z-10 h-full px-4 sm:px-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-black border border-white/20 overflow-hidden flex items-center justify-center shadow">
                <SkillClashEmblem className="w-full h-full" />
              </div>
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
            </div>
            <div className="text-right space-y-1.5">
              <span className="inline-block px-3 py-0.5 rounded-full bg-emerald-500 text-zinc-950 text-[10px] font-extrabold uppercase">
                READ RULES
              </span>
              <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-amber-300">
                SKILLBATTLE PVT CONTEST RULES
              </div>
              <div className="text-lg sm:text-2xl font-extrabold italic tracking-tight text-white">
                TAP TO READ
              </div>
            </div>
          </div>
        </button>

        {/* Banner 5: SUBSCRIBE SKILLBATTLE OFFICIAL */}
        <a
          href={YOUTUBE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="relative w-full aspect-[16/6.2] rounded-xl overflow-hidden bg-sky-950 text-white shadow-sm group text-left block"
        >
          <img
            src={IMAGES.HERO_GUIDE}
            alt="Subscribe SkillBattle Official"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-sky-950/90 via-cyan-800/75 to-sky-900/90" />
          <div className="relative z-10 h-full px-5 flex items-center justify-between gap-4">
            <div className="w-14 h-14 rounded-full bg-black border border-white/25 overflow-hidden flex items-center justify-center shadow shrink-0">
              <SkillClashEmblem className="w-full h-full" />
            </div>
            <div className="text-right space-y-1">
              <span className="inline-block px-3 py-0.5 rounded-full bg-cyan-300 text-zinc-950 text-[10px] font-extrabold uppercase">
                FOLLOW US ON YOUTUBE · SKILLBATTLE
              </span>
              <div className="text-lg sm:text-2xl font-extrabold uppercase tracking-tight">
                SUBSCRIBE SKILLBATTLE OFFICIAL
              </div>
            </div>
          </div>
        </a>
      </main>
    </div>
  );
};
