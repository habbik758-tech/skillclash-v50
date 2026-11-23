import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  FileSignature,
  Gamepad2,
  Gift,
  MoreVertical,
} from 'lucide-react';
import type { UserProfile } from '../types';

interface ReferAndEarnViewProps {
  user: UserProfile;
  onBack: () => void;
}

export const ReferAndEarnView: React.FC<ReferAndEarnViewProps> = ({ user, onBack }) => {
  const [copied, setCopied] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);

  const referralHandle = user.username || user.myReferralCode;

  const handleCopy = () => {
    navigator.clipboard?.writeText(referralHandle).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleReferNow = () => {
    const shareText = `Join SkillBattle Esports Tournaments using my referral code "${referralHandle}" and earn rewards!`;
    if (navigator.share) {
      navigator
        .share({
          title: 'SkillBattle — Refer & Earn',
          text: shareText,
        })
        .catch(() => {
          navigator.clipboard?.writeText(shareText).catch(() => {});
          setShareNote('Referral invite message copied to clipboard!');
          setTimeout(() => setShareNote(null), 2400);
        });
    } else {
      navigator.clipboard?.writeText(shareText).catch(() => {});
      setShareNote('Referral invite message copied to clipboard!');
      setTimeout(() => setShareNote(null), 2400);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
      {/* Black Top Header matching Screenshot */}
      <header className="sticky top-0 z-30 bg-[#0B0C10] text-white">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center text-white"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setShowStats((v) => !v)}
            className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center text-white"
            aria-label="Referral summary"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-5 py-6 flex flex-col items-center text-center">
        {showStats && (
          <div className="w-full mb-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3.5 text-left">
            <div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400">Friends Referred</div>
              <div className="text-lg font-extrabold font-mono-num text-slate-900 dark:text-white">
                {user.referredCount}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400">Referral Earnings</div>
              <div className="text-lg font-extrabold font-mono-num text-emerald-600">
                ₹{user.referralEarnings}
              </div>
            </div>
          </div>
        )}

        <h1 className="text-lg font-semibold text-[#56E698] tracking-wide uppercase">
          REFER MORE TO EARN MORE
        </h1>

        <p className="mt-4 text-[15px] font-medium text-slate-900 dark:text-white leading-snug max-w-md">
          INVITE YOUR FRIENDS AND WIN MONEY PRIZE .TOP 5 REFFEREL WILL GET ₹10,000 RUPEES INSTANTLY.
        </p>

        <p className="mt-4 text-[15px] text-slate-800 dark:text-zinc-200 leading-relaxed max-w-md">
          जो भी टॉप 5 लोग सबसे ज्यादा रेफ़रल करेंगे, उन्हें मिलेंगे ₹10,000 रुपये तक के ईनाम — वो भी
          तुरंत।
        </p>

        {/* Referral Code Section */}
        <div className="mt-7 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#56E698]">
            YOUR REFERRAL CODE
          </div>

          <div className="inline-flex items-center gap-3 pl-6">
            <span className="text-base font-medium text-slate-900 dark:text-white select-all">
              {referralHandle}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy referral code"
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-6 w-full">
          <h2 className="text-lg font-bold text-[#DE8585] mb-4">How It Works</h2>

          <div className="flex items-start justify-center gap-1.5 sm:gap-3">
            {/* Step 1 */}
            <div className="flex flex-col items-center w-24 sm:w-28">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#1DA1F2] text-white flex items-center justify-center shadow-sm">
                <FileSignature className="w-10 h-10 stroke-[1.75]" />
              </div>
              <span className="mt-2.5 text-xs text-slate-800 dark:text-zinc-200 font-medium">
                User Registers
              </span>
            </div>

            <div className="pt-8 sm:pt-10 text-[#56E698] shrink-0">
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center w-24 sm:w-28">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#1DA1F2] text-white flex items-center justify-center shadow-sm">
                <Gamepad2 className="w-11 h-11 stroke-[1.75]" />
              </div>
              <span className="mt-2.5 text-xs text-slate-800 dark:text-zinc-200 font-medium">
                Joins A Match
              </span>
            </div>

            <div className="pt-8 sm:pt-10 text-[#56E698] shrink-0">
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center w-24 sm:w-28">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#1DA1F2] text-white flex items-center justify-center shadow-sm">
                <Gift className="w-10 h-10 stroke-[1.75]" />
              </div>
              <span className="mt-2.5 text-xs text-slate-800 dark:text-zinc-200 font-medium">
                You Get Rewarded
              </span>
            </div>
          </div>
        </div>

        {/* REFER NOW Button */}
        <div className="w-full mt-7">
          <button
            type="button"
            onClick={handleReferNow}
            className="w-full h-12 rounded-md bg-[#56E698] hover:bg-[#46d687] active:scale-[0.99] text-white font-semibold uppercase tracking-wide text-sm shadow-sm transition-all"
          >
            REFER NOW
          </button>
        </div>

        {copied && (
          <p className="mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Referral code copied!
          </p>
        )}
        {shareNote && (
          <p className="mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {shareNote}
          </p>
        )}
      </main>
    </div>
  );
};
