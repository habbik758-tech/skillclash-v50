import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Award,
  ChevronRight,
  ChevronUp,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Wallet,
  X,
} from 'lucide-react';
import { AddCoinsFlow } from './AddCoinsFlow';
import type { UserProfile, WalletTransaction } from '../types';

interface MyWalletViewProps {
  user: UserProfile;
  transactions: WalletTransaction[];
  onBack: () => void;
  onDeposit: (amount: number, method: string, utr?: string) => Promise<void>;
  onWithdraw: (amount: number, upiId: string) => Promise<void>;
  onOpenSupport?: () => void;
  minWithdrawal?: number;
  merchantUpiId?: string;
  upiLabel?: string;
}

type WalletSheet = null | 'withdraw' | 'transactions' | 'earnings' | 'payouts';

function WalletCoinsIllustration() {
  return (
    <svg
      viewBox="0 0 96 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-20 h-16 shrink-0 drop-shadow-sm"
      aria-hidden="true"
    >
      {/* Top Gold Coins */}
      <circle cx="56" cy="20" r="12" fill="#F59E0B" />
      <circle cx="56" cy="20" r="9" fill="#FBBF24" />
      <text x="56" y="24" textAnchor="middle" fill="#B45309" fontSize="11" fontWeight="bold">
        ₹
      </text>
      <circle cx="42" cy="24" r="11" fill="#D97706" />
      <circle cx="42" cy="24" r="8.5" fill="#FCD34D" />

      {/* Blue 3D Wallet Body */}
      <rect x="26" y="24" width="48" height="38" rx="9" fill="#7C98F8" />
      <rect x="26" y="24" width="48" height="38" rx="9" fill="url(#walletGrad)" />
      <path d="M26 33C26 28 30 24 35 24H67C71 24 74 27 74 31V33H26Z" fill="#6884EC" />

      {/* Wallet Clasp */}
      <rect x="54" y="38" width="22" height="14" rx="7" fill="#9BB2FA" />
      <circle cx="62" cy="45" r="3.5" fill="#EEF2FF" />

      {/* Front Gold Coin */}
      <circle cx="28" cy="60" r="11" fill="#D97706" />
      <circle cx="28" cy="59" r="9" fill="#FBBF24" />
      <text x="28" y="63" textAnchor="middle" fill="#B45309" fontSize="11" fontWeight="bold">
        ₹
      </text>

      <defs>
        <linearGradient id="walletGrad" x1="26" y1="24" x2="74" y2="62" gradientUnits="userSpaceOnUse">
          <stop stopColor="#93AEFC" />
          <stop offset="1" stopColor="#6D87EB" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export const MyWalletView: React.FC<MyWalletViewProps> = ({
  user,
  transactions,
  onBack,
  onDeposit,
  onWithdraw,
  onOpenSupport,
  minWithdrawal = 20,
  merchantUpiId,
  upiLabel,
}) => {
  const effectiveMinW = Math.max(10, minWithdrawal || 20);
  const [showAddCoins, setShowAddCoins] = useState(false);
  const [activeSheet, setActiveSheet] = useState<WalletSheet>(null);
  const [amountInput, setAmountInput] = useState('50');
  const [upiInput, setUpiInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [txFilter, setTxFilter] = useState<'ALL' | 'DEPOSIT' | 'WITHDRAW' | 'WINNING'>('ALL');

  const openSheet = (sheet: WalletSheet) => {
    setMsg(null);
    setErr(null);
    if (sheet === 'withdraw') setAmountInput(String(Math.max(effectiveMinW, Math.floor(user.winningBalance))));
    setActiveSheet(sheet);
  };

  if (showAddCoins) {
    return (
      <AddCoinsFlow
        onBackToWallet={() => setShowAddCoins(false)}
        onCompleteDeposit={onDeposit}
        onOpenSupport={onOpenSupport}
        merchantUpiId={merchantUpiId}
        upiLabel={upiLabel}
      />
    );
  }

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setLoading(true);
    try {
      const amt = Number(amountInput);
      await onWithdraw(amt, upiInput);
      setMsg(`₹${amt.toFixed(1)} withdrawal initiated to ${upiInput}. Processed within 12 Hours!`);
      setUpiInput('');
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  const filteredTx = transactions.filter((t) => {
    if (txFilter === 'ALL') return true;
    if (txFilter === 'WINNING') return t.type === 'WINNING' || t.type === 'BONUS';
    return t.type === txFilter;
  });

  const payoutTx = transactions.filter((t) => t.type === 'WITHDRAW');
  const earningTx = transactions.filter((t) => t.type === 'WINNING' || t.type === 'BONUS');

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-zinc-950 pb-20">
      {/* Top White Bar matching Screenshot */}
      <header className="sticky top-0 z-30 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center text-slate-900 dark:text-white"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">My Wallet</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-3.5 sm:px-6 py-4 space-y-4">
        {/* Hero Total Balance Card */}
        <section className="rounded-2xl bg-gradient-to-r from-[#EEF2FF] via-[#E5ECFF] to-[#D6E1FF] dark:from-zinc-900 dark:via-indigo-950/60 dark:to-zinc-900 border border-indigo-100 dark:border-zinc-800 px-4 sm:px-5 py-4 flex items-center justify-between gap-3 shadow-xs">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              TOTAL BALANCE
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono-num text-slate-900 dark:text-white mt-0.5">
              ₹{user.balance.toFixed(1)}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="hidden xs:block sm:block">
              <WalletCoinsIllustration />
            </div>
            <button
              type="button"
              onClick={() => openSheet('transactions')}
              className="inline-flex items-center gap-1.5 bg-[#2A2D34] hover:bg-zinc-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Transactions ›</span>
            </button>
          </div>
        </section>

        {/* 4-Row Wallet Breakdown Card */}
        <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/70 dark:border-zinc-800 shadow-xs divide-y divide-slate-100 dark:divide-zinc-800">
          {/* Row 1: Deposited */}
          <div className="px-4 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#ECECFF] dark:bg-indigo-950/60 text-[#5B5CE6] dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                  Deposited
                </div>
                <div className="text-lg font-extrabold font-mono-num text-slate-900 dark:text-white">
                  ₹{user.depositedBalance.toFixed(1)}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAddCoins(true)}
              className="inline-flex items-center gap-1 px-4 py-2.5 rounded-full bg-[#10A36C] hover:bg-[#0d8d5d] active:scale-[0.98] text-white text-xs font-bold whitespace-nowrap shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add Coins ›</span>
            </button>
          </div>

          {/* Row 2: Winning */}
          <div className="px-4 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#ECECFF] dark:bg-indigo-950/60 text-[#5B5CE6] dark:text-indigo-400 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Winning</div>
                <div className="text-lg font-extrabold font-mono-num text-slate-900 dark:text-white">
                  ₹{user.winningBalance.toFixed(1)}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openSheet('withdraw')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#ECEEF2] hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 active:scale-[0.98] text-slate-900 dark:text-white text-xs font-bold whitespace-nowrap transition-all"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Withdraw ›</span>
            </button>
          </div>

          {/* Row 3: Earnings */}
          <button
            type="button"
            onClick={() => openSheet('earnings')}
            className="w-full px-4 py-4 flex items-center justify-between gap-3 text-left hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#FEF9E3] dark:bg-amber-950/50 text-amber-500 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                  Earnings
                </div>
                <div className="text-lg font-extrabold font-mono-num text-slate-900 dark:text-white">
                  {user.amountWon}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Row 4: PAYOUTS */}
          <button
            type="button"
            onClick={() => openSheet('payouts')}
            className="w-full px-4 py-4 flex items-center justify-between gap-3 text-left hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors rounded-b-2xl"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#E6F8F0] dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium uppercase">
                  PAYOUTS
                </div>
                <div className="text-lg font-extrabold font-mono-num text-slate-900 dark:text-white">
                  {user.payoutsCount}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </section>

        {/* Bottom Guarantee Card matching Screenshot */}
        <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/70 dark:border-zinc-800 shadow-xs px-4 py-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#6366F1] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="text-xs sm:text-sm leading-snug">
            <p className="text-slate-600 dark:text-zinc-400">Only winnings can be redeemed.</p>
            <p className="font-bold text-slate-900 dark:text-white mt-0.5">
              Fast Withdrawals, Processed Within{' '}
              <span className="text-[#6366F1] dark:text-indigo-400">12 Hours!</span>
            </p>
          </div>
        </section>
      </main>

      {/* Interactive Sub-Sheets for Add Coins / Withdraw / Transactions / Earnings / Payouts */}
      {activeSheet && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-lg bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                {activeSheet === 'withdraw'
                  ? 'Withdraw Winnings'
                  : activeSheet === 'transactions'
                    ? 'All Transactions'
                    : activeSheet === 'earnings'
                      ? 'Winnings & Earnings'
                      : 'Payout History'}
              </h2>
              <button
                type="button"
                onClick={() => setActiveSheet(null)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-500"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
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

              {activeSheet === 'withdraw' && (
                <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                  <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/50 p-3 flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-zinc-300">
                      Redeemable Winning Balance
                    </span>
                    <strong className="font-mono-num text-sm text-indigo-700 dark:text-indigo-300">
                      ₹{user.winningBalance.toFixed(1)}
                    </strong>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                      Withdraw Amount (Min ₹{effectiveMinW} · Winnings Only)
                    </label>
                    <input
                      type="number"
                      min={effectiveMinW}
                      required
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono-num"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                      UPI ID (e.g. name@okaxis)
                    </label>
                    <input
                      type="text"
                      required
                      value={upiInput}
                      onChange={(e) => setUpiInput(e.target.value)}
                      placeholder="player@upi"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-[#16181D] hover:bg-zinc-800 text-white font-extrabold text-sm uppercase tracking-wide"
                  >
                    {loading ? 'Submitting Withdrawal...' : `Withdraw ₹${amountInput}`}
                  </button>
                </form>
              )}

              {activeSheet === 'transactions' && (
                <div className="space-y-3">
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {(['ALL', 'DEPOSIT', 'WITHDRAW', 'WINNING'] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setTxFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                          txFilter === f
                            ? 'bg-[#16181D] text-white'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <TransactionList items={filteredTx} emptyText="No transactions found." />
                </div>
              )}

              {activeSheet === 'earnings' && (
                <TransactionList items={earningTx} emptyText="No match earnings recorded yet." />
              )}

              {activeSheet === 'payouts' && (
                <TransactionList items={payoutTx} emptyText="No withdrawals requested yet." />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function TransactionList({ items, emptyText }: { items: WalletTransaction[]; emptyText: string }) {
  if (items.length === 0) {
    return <p className="text-center text-xs text-slate-500 py-8">{emptyText}</p>;
  }
  return (
    <div className="space-y-2 max-h-72 overflow-y-auto">
      {items.map((tx) => {
        const isCredit = tx.type === 'DEPOSIT' || tx.type === 'WINNING' || tx.type === 'BONUS';
        return (
          <div
            key={tx.id}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/70"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
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
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {tx.title}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                  {tx.upiOrRef} · {new Date(tx.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="text-right shrink-0 ml-2">
              <div
                className={`text-xs font-extrabold font-mono-num ${
                  tx.status === 'REJECTED'
                    ? 'text-slate-400 line-through'
                    : isCredit
                      ? 'text-emerald-600'
                      : 'text-rose-500'
                }`}
              >
                {isCredit ? '+' : '-'}₹{tx.amount.toFixed(1)}
              </div>
              {tx.status !== 'SUCCESS' && (
                <span
                  className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                    tx.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {tx.status}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
