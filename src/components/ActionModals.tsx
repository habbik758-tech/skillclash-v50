import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Copy,
  Crown,
  Gift,
  Headphones,
  Megaphone,
  Play,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Ticket,
  X,
  Youtube,
} from 'lucide-react';
import { INSTAGRAM_URL, TELEGRAM_URL, WHATSAPP_GROUP_URL, YOUTUBE_URL } from '../constants/assets';
import { GoldCoinIcon } from './BrandIcons';
import type { ModalType } from './HomePlayView';
import type {
  AnnouncementItem,
  FeedbackEntry,
  LeaderboardEntry,
  UserProfile,
  WalletTransaction,
} from '../types';

interface ActionModalsProps {
  modal: ModalType;
  onClose: () => void;
  user: UserProfile;
  transactions: WalletTransaction[];
  leaderboard: LeaderboardEntry[];
  feedbacks: FeedbackEntry[];
  announcements: AnnouncementItem[];
  onDeposit: (amount: number, method: string, utr?: string) => Promise<void>;
  onWithdraw: (amount: number, upiId: string) => Promise<void>;
  onSpinLuckyDraw: () => Promise<number>;
  onSubmitPromo: (videoUrl: string, channelName: string) => Promise<void>;
  onSubmitFeedback: (rating: number, comment: string) => Promise<void>;
  onUpdateProfile: (payload: {
    firstName: string;
    lastName: string;
    mobile: string;
    email: string;
  }) => Promise<void>;
}

export const ActionModals: React.FC<ActionModalsProps> = ({
  modal,
  onClose,
  user,
  transactions,
  leaderboard,
  feedbacks,
  announcements,
  onDeposit,
  onWithdraw,
  onSpinLuckyDraw,
  onSubmitPromo,
  onSubmitFeedback,
  onUpdateProfile,
}) => {
  const [walletTab, setWalletTab] = useState<'add' | 'withdraw' | 'history'>('add');
  const [amountInput, setAmountInput] = useState('50');
  const [upiInput, setUpiInput] = useState('');
  const [utrInput, setUtrInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Lucky draw
  const [spinResult, setSpinResult] = useState<number | null>(null);

  // YT Shorts promo
  const [videoUrl, setVideoUrl] = useState('');
  const [channelName, setChannelName] = useState('');

  // Feedback
  const [fbRating, setFbRating] = useState(5);
  const [fbComment, setFbComment] = useState('');

  // Profile editor
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [mobile, setMobile] = useState(user.mobile);
  const [email, setEmail] = useState(user.email);

  if (!modal) return null;

  const resetMessages = () => {
    setMsg(null);
    setErr(null);
  };

  const titleMap: Record<Exclude<ModalType, null>, string> = {
    wallet: 'My Wallet',
    refer: 'Refer & Earn',
    tutorial: 'App Guide & Tutorial',
    leaders: 'Top Players Leaderboard',
    support: 'Customer Support',
    announcements: 'Announcements',
    feedback: 'Player Feedback',
    lucky_draw: 'Lucky Draw Ticket',
    promo_yt: 'Create & Earn ₹250 Challenge',
    pvt_rules: 'SkillBattle Pvt Contest Rules',
    profile: 'My Profile',
    about: 'About SkillBattle',
    terms: 'Terms & Conditions',
    rewards: 'My Rewards',
    orders: 'My Order & Entry History',
    statistics: 'My Statistics',
    community: 'Join SkillBattle Community',
    language: 'Choose Language',
  };

  const handleWalletAction = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const amt = Number(amountInput);
      if (walletTab === 'add') {
        await onDeposit(amt, 'UPI Instant', utrInput);
        setMsg(`UTR submitted! ₹${amt} deposit is pending admin verification.`);
        setUtrInput('');
      } else {
        await onWithdraw(amt, upiInput);
        setMsg(`₹${amt} withdrawal request submitted to ${upiInput}!`);
        setUpiInput('');
      }
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLuckySpin = async () => {
    resetMessages();
    setLoading(true);
    try {
      const won = await onSpinLuckyDraw();
      setSpinResult(won);
      setMsg(won > 0 ? `Congratulations! ₹${won} bonus reward submitted for verification!` : 'Better luck next spin!');
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Spin failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      await onSubmitPromo(videoUrl, channelName);
      setMsg('YT Shorts link submitted! Review takes 24h for 5K+ views verification.');
      setVideoUrl('');
      setChannelName('');
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      await onSubmitFeedback(fbRating, fbComment);
      setMsg('Thanks for sharing your feedback!');
      setFbComment('');
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Unable to post feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      await onUpdateProfile({ firstName, lastName, mobile, email });
      setMsg('Profile updated successfully.');
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            {titleMap[modal]}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {err && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 p-3 text-xs text-rose-700 dark:text-rose-200">
              {err}
            </div>
          )}
          {msg && (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 p-3 text-xs text-emerald-700 dark:text-emerald-200">
              {msg}
            </div>
          )}

          {/* WALLET */}
          {(modal === 'wallet' || modal === 'orders') && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#16181D] text-white p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-zinc-400">Available Wallet Balance</div>
                  <div className="text-2xl font-extrabold font-mono-num flex items-center gap-2 mt-1">
                    <GoldCoinIcon className="w-6 h-6" />
                    <span>₹ {user.balance.toFixed(2)}</span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-400">Instant UPI</span>
              </div>

              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-zinc-800">
                {[
                  { id: 'add', label: 'Add Coins' },
                  { id: 'withdraw', label: 'Withdraw' },
                  { id: 'history', label: 'History' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      resetMessages();
                      setWalletTab(tab.id as 'add' | 'withdraw' | 'history');
                    }}
                    className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                      walletTab === tab.id
                        ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {walletTab !== 'history' ? (
                <form onSubmit={handleWalletAction} className="space-y-3">
                  <div className="flex gap-2">
                    {['10', '20', '50', '100'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmountInput(preset)}
                        className={`flex-1 py-2 rounded-lg border text-xs font-bold font-mono-num ${
                          amountInput === preset
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                            : 'border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300'
                        }`}
                      >
                        ₹{preset}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={walletTab === 'add' ? 10 : 20}
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono-num"
                    />
                  </div>

                  {walletTab === 'add' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                        Payment UTR / Reference ID
                      </label>
                      <input
                        type="text"
                        required
                        value={utrInput}
                        onChange={(e) => setUtrInput(e.target.value)}
                        placeholder="Enter 12-digit UTR number"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>
                  )}

                  {walletTab === 'withdraw' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                        Your UPI ID
                      </label>
                      <input
                        type="text"
                        required
                        value={upiInput}
                        onChange={(e) => setUpiInput(e.target.value)}
                        placeholder="e.g. player@okaxis"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 rounded-xl bg-[#54E397] hover:bg-[#43d688] text-zinc-950 font-extrabold text-xs uppercase tracking-wide"
                  >
                    {loading
                      ? 'Processing...'
                      : walletTab === 'add'
                        ? `Add ₹${amountInput} Now`
                        : `Withdraw ₹${amountInput} via UPI`}
                  </button>
                </form>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {transactions.length === 0 ? (
                    <p className="text-center text-xs text-slate-500 py-6">No transactions yet.</p>
                  ) : (
                    transactions.map((tx) => {
                      const isCredit =
                        tx.type === 'DEPOSIT' || tx.type === 'WINNING' || tx.type === 'BONUS';
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/70"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isCredit
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                              }`}
                            >
                              {isCredit ? (
                                <ArrowDownLeft className="w-4 h-4" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4" />
                              )}
                            </span>
                            <div>
                              <div className="text-xs font-bold text-slate-900 dark:text-white">
                                {tx.title}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                                {tx.upiOrRef}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span
                              className={`text-xs font-extrabold font-mono-num ${
                                isCredit ? 'text-emerald-600' : 'text-rose-500'
                              }`}
                            >
                              {isCredit ? '+' : '-'}₹{tx.amount}
                            </span>
                            {tx.status !== 'SUCCESS' && (
                              <div className="text-[9px] font-bold uppercase text-amber-600">
                                {tx.status}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* REFER & EARN */}
          {modal === 'refer' && (
            <div className="space-y-4 text-center">
              <div className="rounded-2xl bg-gradient-to-br from-zinc-900 to-indigo-950 text-white p-5 space-y-2">
                <Gift className="w-8 h-8 text-amber-400 mx-auto" />
                <h3 className="text-base font-extrabold">Invite Friends, Earn ₹10 Each</h3>
                <p className="text-xs text-zinc-300">
                  Share your referral code. Your friend gets ₹15 signup bonus and you earn ₹10!
                </p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800">
                <span className="font-mono-num font-extrabold text-base text-slate-900 dark:text-white">
                  {user.myReferralCode}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(user.myReferralCode);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 1500);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16181D] text-white text-xs font-bold"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'Copied' : 'Copy Code'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800">
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">Friends Joined</div>
                  <div className="text-lg font-extrabold font-mono-num text-slate-900 dark:text-white">
                    {user.referredCount}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800">
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">Total Earned</div>
                  <div className="text-lg font-extrabold font-mono-num text-emerald-600">
                    ₹{user.referralEarnings}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const text = `Join SkillBattle tournaments with my referral code ${user.myReferralCode} and get ₹15 bonus!`;
                  if (navigator.share) {
                    navigator.share({ title: 'SkillBattle', text }).catch(() => {});
                  } else {
                    navigator.clipboard?.writeText(text);
                    setMsg('Referral invite message copied to clipboard!');
                  }
                }}
                className="w-full h-11 rounded-xl bg-[#7E7AF2] text-white font-bold text-xs uppercase flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share Invite Link
              </button>
            </div>
          )}

          {/* LUCKY DRAW */}
          {modal === 'lucky_draw' && (
            <div className="space-y-4 text-center">
              <div className="rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 text-white p-6 space-y-2">
                <Ticket className="w-10 h-10 mx-auto" />
                <h3 className="text-xl font-extrabold uppercase">Daily Lucky Draw</h3>
                <p className="text-xs text-white/90">
                  Try your luck and win instant bonus coins up to ₹25 directly in your wallet!
                </p>
                {spinResult !== null && (
                  <div className="pt-2 text-2xl font-extrabold font-mono-num">
                    {spinResult > 0 ? `+ ₹${spinResult} WON!` : '₹0 — Spin Again!'}
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleLuckySpin}
                className="w-full h-12 rounded-xl bg-[#16181D] hover:bg-zinc-800 text-white font-extrabold text-sm uppercase tracking-wide flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                {loading ? 'Drawing Ticket...' : 'Try Your Luck Now'}
              </button>
            </div>
          )}

          {/* YT SHORTS PROMO */}
          {modal === 'promo_yt' && (
            <form onSubmit={handlePromo} className="space-y-3.5">
              <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-3.5 flex items-start gap-3">
                <Youtube className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 dark:text-zinc-300 space-y-1">
                  <p className="font-bold text-slate-900 dark:text-white">
                    Get ₹250 for 5K+ Views on YT Shorts!
                  </p>
                  <p>
                    Post a SkillBattle match clip or app promo on YouTube Shorts and submit your link
                    below.
                  </p>
                </div>
              </div>

              <input
                type="text"
                required
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="Your YouTube Channel Name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
              <input
                type="url"
                required
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/shorts/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs uppercase"
              >
                {loading ? 'Submitting...' : 'Submit Challenge Entry'}
              </button>
            </form>
          )}

          {/* LEADERBOARD */}
          {modal === 'leaders' && (
            <div className="space-y-2.5">
              {leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/70"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${
                        entry.rank === 1
                          ? 'bg-amber-400 text-zinc-950'
                          : entry.rank === 2
                            ? 'bg-slate-300 text-zinc-900'
                            : entry.rank === 3
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200'
                      }`}
                    >
                      {entry.rank}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        {entry.username}
                        {entry.rank === 1 && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                        {entry.tier} · {entry.kills} Kills · {entry.matches} Matches
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-extrabold font-mono-num text-emerald-600 dark:text-emerald-400">
                    ₹{entry.winnings}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TUTORIAL */}
          {modal === 'tutorial' && (
            <div className="space-y-3">
              {[
                {
                  step: '01',
                  title: 'Pick Your Tournament Mode',
                  desc: 'Tap Play on Top Games to browse all 13 Free Fire & Clash Squad modes or Pvt Contests.',
                },
                {
                  step: '02',
                  title: 'Enter Free Fire IGN & UID',
                  desc: 'Confirm your slot using wallet coins. Room ID & Password unlock right inside the match card.',
                },
                {
                  step: '03',
                  title: 'Join Room 10 Mins Early & Win',
                  desc: 'Play FairPlay matches, earn per-kill and Booyah rewards, and withdraw instantly via UPI.',
                },
              ].map((s) => (
                <div
                  key={s.step}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/70 flex items-start gap-3"
                >
                  <span className="w-8 h-8 rounded-lg bg-[#16181D] text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                    {s.step}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{s.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={onClose}
                className="w-full h-11 rounded-xl bg-[#16181D] text-white font-bold text-xs uppercase flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" /> Got It, Let&apos;s Play
              </button>
            </div>
          )}

          {/* PVT CONTEST RULES */}
          {modal === 'pvt_rules' && (
            <div className="space-y-2.5 text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <ShieldCheck className="w-5 h-5" /> FairPlay &amp; Private Contest Rules
              </div>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>No hacks, panels, GFX scripts, or emulator bypasses allowed.</li>
                <li>Only registered Free Fire UID players may enter the custom room.</li>
                <li>Teaming in Solo or 1v1 Lone Wolf matches leads to instant disqualification.</li>
                <li>In Only Head modes, body-shot kills or unauthorized weapons forfeit the round.</li>
                <li>Record screen proof in case of any dispute and submit via Customer Support.</li>
              </ul>
            </div>
          )}

          {/* ANNOUNCEMENTS */}
          {modal === 'announcements' && (
            <div className="space-y-3">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/70 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-900 dark:text-white">
                      <Megaphone className="w-3.5 h-3.5 text-rose-500" />
                      {a.title}
                    </span>
                    <span className="text-[11px] text-slate-400">{a.date}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-zinc-300">{a.body}</p>
                </div>
              ))}
            </div>
          )}

          {/* FEEDBACK */}
          {modal === 'feedback' && (
            <div className="space-y-4">
              <form onSubmit={handleFeedback} className="space-y-3">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setFbRating(r)}
                      className="p-1"
                      aria-label={`Rate ${r} stars`}
                    >
                      <Star
                        className={`w-6 h-6 ${
                          r <= fbRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  required
                  rows={3}
                  value={fbComment}
                  onChange={(e) => setFbComment(e.target.value)}
                  placeholder="Share your feedback about SkillBattle..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-[#54E397] text-zinc-950 font-extrabold text-xs uppercase"
                >
                  {loading ? 'Posting...' : 'Submit Feedback'}
                </button>
              </form>

              <div className="space-y-2 max-h-48 overflow-y-auto pt-2 border-t border-slate-100 dark:border-zinc-800">
                {feedbacks.map((f) => (
                  <div key={f.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">{f.username}</span>
                      <span className="text-amber-400">{'★'.repeat(f.rating)}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-zinc-300 mt-0.5">{f.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROFILE */}
          {modal === 'profile' && (
            <form onSubmit={handleProfileSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500">Mobile</label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-[#16181D] text-white font-bold text-xs uppercase"
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          )}

          {/* STATISTICS & REWARDS */}
          {(modal === 'statistics' || modal === 'rewards') && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Matches Played', val: String(user.matchesPlayed) },
                { label: 'Total Kills', val: String(user.totalKilled) },
                { label: 'Win Rate', val: `${user.winRate}%` },
                { label: 'Amount Won', val: `₹ ${user.amountWon}` },
                { label: 'Rank Tier', val: user.rankTitle },
                { label: 'Referral Bonus', val: `₹ ${user.referralEarnings}` },
              ].map((s) => (
                <div key={s.label} className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/70">
                  <div className="text-xs text-slate-500 dark:text-zinc-400">{s.label}</div>
                  <div className="text-lg font-extrabold font-mono-num text-slate-900 dark:text-white mt-0.5">
                    {s.val}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SUPPORT / ABOUT / TERMS / COMMUNITY */}
          {(modal === 'support' ||
            modal === 'about' ||
            modal === 'terms' ||
            modal === 'community') && (
            <div className="space-y-3 text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
              {modal === 'support' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800 flex items-center gap-3">
                    <Headphones className="w-6 h-6 text-cyan-600 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        24×7 SkillBattle Helpdesk
                      </div>
                      <div>Support Hours: 9:00 AM – 11:30 PM IST · support@skillbattle.gg</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMsg('Support ticket #SB-4092 opened! Our team will reply shortly.')}
                    className="w-full h-11 rounded-xl bg-[#16181D] text-white font-bold uppercase"
                  >
                    Create Instant Support Ticket
                  </button>
                </div>
              )}
              {modal === 'about' && (
                <p>
                  SkillBattle (Version 19) is India&apos;s skill-based mobile esports arena built for
                  Free Fire Battle Royale, Lone Wolf, and Clash Squad competitors. Every room is
                  FairPlay verified with transparent prize pools and instant UPI payouts.
                </p>
              )}
              {modal === 'terms' && (
                <p>
                  Players must be 18+ and abide by FairPlay anti-cheat guidelines. Duplicate
                  accounts, teaming, or third-party scripts result in permanent suspension and prize
                  forfeiture.
                </p>
              )}
              {modal === 'community' && (
                <div className="space-y-2">
                  <p>
                    Follow SkillBattle Official channels for daily giveaways, live room updates, and
                    ₹250 YouTube Shorts challenges!
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={WHATSAPP_GROUP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 font-bold text-slate-900 dark:text-white text-left block"
                    >
                      WhatsApp Group
                    </a>
                    <a
                      href={INSTAGRAM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 font-bold text-slate-900 dark:text-white text-left block"
                    >
                      Instagram @emotex_flow
                    </a>
                    <a
                      href={TELEGRAM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 font-bold text-slate-900 dark:text-white text-left block"
                    >
                      Telegram Group
                    </a>
                    <a
                      href={YOUTUBE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 font-bold text-slate-900 dark:text-white text-left block"
                    >
                      YouTube Official
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
