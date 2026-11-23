import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Headphones,
  Hourglass,
  Info,
  Pencil,
  Radio,
  ReceiptText,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react';
import { GoldCoinIcon, SkillClashEmblem } from './BrandIcons';

const DEFAULT_MERCHANT_UPI_ID = 'chhatishx21@fam';
const DEFAULT_MERCHANT_NAME = 'SkillBattle';

interface AddCoinsFlowProps {
  onBackToWallet: () => void;
  onCompleteDeposit: (amount: number, method: string, utr?: string) => Promise<void>;
  onOpenSupport?: () => void;
  merchantUpiId?: string;
  upiLabel?: string;
}

type PaymentGateway = 'ZapUPI' | 'TranzUPI';

function UpiWalletBadgeIcon() {
  return (
    <svg viewBox="0 0 40 36" fill="none" className="w-9 h-8 shrink-0" aria-hidden="true">
      <rect x="6" y="3" width="26" height="14" rx="3" fill="#22C55E" />
      <rect x="10" y="6" width="24" height="14" rx="3" fill="#38BDF8" opacity="0.85" />
      <rect x="3" y="10" width="32" height="22" rx="5" fill="#F59E0B" />
      <rect x="25" y="17" width="12" height="8" rx="4" fill="#FCD34D" />
      <circle cx="29" cy="21" r="1.8" fill="#B45309" />
    </svg>
  );
}

function MiniWalletIllustration() {
  return (
    <svg viewBox="0 0 88 74" fill="none" className="w-16 h-14 shrink-0" aria-hidden="true">
      <circle cx="52" cy="18" r="10" fill="#F59E0B" />
      <circle cx="52" cy="18" r="7.5" fill="#FBBF24" />
      <rect x="24" y="22" width="44" height="34" rx="8" fill="#7D98F8" />
      <path d="M24 30C24 25.5 27.5 22 32 22H60C64.5 22 68 25.5 68 30V31H24V30Z" fill="#6884EC" />
      <rect x="50" y="34" width="20" height="13" rx="6.5" fill="#9BB2FA" />
      <circle cx="57" cy="40.5" r="3" fill="#EEF2FF" />
      <circle cx="26" cy="54" r="10" fill="#D97706" />
      <circle cx="26" cy="53" r="8" fill="#FBBF24" />
      <text x="26" y="57" textAnchor="middle" fill="#92400E" fontSize="10" fontWeight="bold">
        ₹
      </text>
    </svg>
  );
}

function RealUpiQrCode({ upiUri, onDataUrl }: { upiUri: string; onDataUrl: (url: string) => void }) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(upiUri, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0B0C10',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (active) {
          setDataUrl(url);
          onDataUrl(url);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [upiUri, onDataUrl]);

  if (!dataUrl) {
    return (
      <div className="w-48 h-48 sm:w-52 sm:h-52 bg-slate-100 rounded-lg animate-pulse flex items-center justify-center text-xs text-slate-400">
        Generating QR...
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt="UPI Payment QR Code"
      className="w-48 h-48 sm:w-52 sm:h-52 object-contain bg-white"
    />
  );
}

export const AddCoinsFlow: React.FC<AddCoinsFlowProps> = ({
  onBackToWallet,
  onCompleteDeposit,
  onOpenSupport,
  merchantUpiId = DEFAULT_MERCHANT_UPI_ID,
  upiLabel = DEFAULT_MERCHANT_NAME,
}) => {
  const activeUpiId = merchantUpiId.trim() || DEFAULT_MERCHANT_UPI_ID;
  const activeUpiName = upiLabel.trim() || DEFAULT_MERCHANT_NAME;
  const [step, setStep] = useState<'select' | 'checkout'>('select');
  const [gateway, setGateway] = useState<PaymentGateway>('ZapUPI');
  const [amountStr, setAmountStr] = useState('10');
  const [error, setError] = useState<string | null>(null);

  // Page 2 state
  const [txnId, setTxnId] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(476); // 07:56
  const [utrInput, setUtrInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifiedMsg, setVerifiedMsg] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step !== 'checkout') return;
    const id = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

  const parsedAmount = Number(amountStr);
  const upiUri = `upi://pay?pa=${encodeURIComponent(activeUpiId)}&pn=${encodeURIComponent(
    activeUpiName,
  )}&am=${(Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : 10).toFixed(
    2,
  )}&cu=INR&tn=${encodeURIComponent(`SkillBattle ${txnId}`)}`;

  const handlePayNow = () => {
    setError(null);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 10 || parsedAmount > 10000) {
      setError('Please enter or select an amount between ₹10 and ₹10,000.');
      return;
    }
    const prefix = gateway === 'ZapUPI' ? 'ZU' : 'TU';
    const randomHex = Array.from({ length: 14 }, () =>
      Math.floor(Math.random() * 16)
        .toString(16)
        .toUpperCase(),
    ).join('');
    setTxnId(`#${prefix}${randomHex}`);
    setSecondsLeft(476);
    setUtrInput('');
    setVerifiedMsg(null);
    setStep('checkout');
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `SkillBattle-UPI-QR-${parsedAmount}.png`;
    link.click();
  };

  const handleVerifyUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanUtr = utrInput.trim();
    if (cleanUtr.length < 6) {
      setError('Please enter a valid UTR / Reference number (minimum 6 characters).');
      return;
    }
    setVerifying(true);
    try {
      await onCompleteDeposit(parsedAmount, gateway, cleanUtr);
      setVerifiedMsg(
        `UTR submitted! ₹${parsedAmount.toFixed(2)} is pending admin verification and will appear in your wallet shortly.`,
      );
      setTimeout(() => {
        onBackToWallet();
      }, 1700);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify UTR');
    } finally {
      setVerifying(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // PAGE 2: QR PAYMENT CHECKOUT (Screenshot 2)
  if (step === 'checkout') {
    const progressPct = Math.max(4, Math.round((secondsLeft / 480) * 100));

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#DFC7FF] via-[#D8B8FF] to-[#C69EFF] px-4 py-6 flex flex-col items-center justify-between relative">
        <div className="w-full max-w-md space-y-4">
          {/* Ticket Card */}
          <div className="rounded-3xl overflow-hidden shadow-xl bg-white">
            {/* Dark Header */}
            <div className="bg-[#111216] text-white px-5 pt-5 pb-6 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-black border border-white/20 overflow-hidden flex items-center justify-center shrink-0">
                    <SkillClashEmblem className="w-full h-full" />
                  </div>
                  <span className="text-sm font-bold tracking-tight">
                    SkillBattle - Safe &amp; Secure
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep('select');
                  }}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-200 transition-colors"
                  aria-label="Close payment sheet"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center mt-5 space-y-1">
                <div className="text-[11px] font-semibold tracking-widest uppercase text-zinc-400">
                  AMOUNT TO PAY
                </div>
                <div className="text-3xl font-extrabold font-mono-num flex items-center justify-center gap-1">
                  <span className="text-emerald-400 text-2xl">₹</span>
                  <span>{parsedAmount.toFixed(2)}</span>
                </div>
                <div className="text-[11px] font-mono-num text-zinc-400 pt-0.5">
                  TXN {txnId}
                </div>
              </div>
            </div>

            {/* Perforated Divider */}
            <div className="relative bg-white flex items-center">
              <span className="w-5 h-5 rounded-full bg-[#DBBFFF] -ml-2.5 shrink-0" />
              <div className="flex-1 border-t-2 border-dashed border-zinc-900/20" />
              <span className="w-5 h-5 rounded-full bg-[#DBBFFF] -mr-2.5 shrink-0" />
            </div>

            {/* QR Code Section */}
            <div className="px-6 py-6 flex flex-col items-center text-center space-y-4">
              <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-md">
                <RealUpiQrCode upiUri={upiUri} onDataUrl={setQrDataUrl} />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download QR</span>
                </button>

                <a
                  href={upiUri}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#111216] hover:bg-zinc-800 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <span>Pay in UPI App</span>
                </a>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs text-slate-500 max-w-[260px] leading-relaxed">
                  Scan with any UPI app to pay instantly — no fees, no fuss.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(activeUpiId);
                    setCopiedUpi(true);
                    setTimeout(() => setCopiedUpi(false), 1500);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-mono-num font-bold text-indigo-600 hover:text-indigo-700"
                >
                  <span>UPI: {activeUpiId}</span>
                  {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Expires In Timer Card */}
          <div className="rounded-2xl bg-white px-4 py-3.5 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-zinc-800 flex items-center justify-center shrink-0">
                <Hourglass className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  EXPIRES IN
                </div>
                <div className="text-lg font-extrabold font-mono-num text-slate-900 leading-tight">
                  {formatTimer(secondsLeft)}
                </div>
              </div>
            </div>

            <div className="w-24 sm:w-28 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Already Paid? Enter UTR Card */}
          <form
            onSubmit={handleVerifyUtr}
            className="rounded-2xl bg-white px-4 py-4 shadow-sm space-y-3"
          >
            <div className="flex items-center gap-2 text-xs font-extrabold tracking-wide uppercase text-slate-900">
              <ReceiptText className="w-4 h-4 text-slate-700" />
              <span>ALREADY PAID? ENTER UTR</span>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
                {error}
              </div>
            )}
            {verifiedMsg && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{verifiedMsg}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={utrInput}
                onChange={(e) => setUtrInput(e.target.value)}
                placeholder="UTR / Reference number"
                className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={verifying || secondsLeft === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#111216] hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-bold shrink-0 transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                <span>{verifying ? 'Verifying...' : 'Verify'}</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Find UTR in your bank app transaction history</span>
            </div>
          </form>

          {/* Powered by footer */}
          <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-700 pt-1">
            <ShieldCheck className="w-4 h-4 text-slate-600" />
            <span>Powered by {gateway}</span>
          </div>
        </div>

        {/* Bottom-right Contact Us button */}
        <div className="w-full max-w-md flex justify-end pt-4">
          <button
            type="button"
            onClick={() => onOpenSupport?.()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-bold shadow-lg transition-colors"
          >
            <Headphones className="w-4 h-4" />
            <span>Contact Us</span>
          </button>
        </div>
      </div>
    );
  }

  // PAGE 1: ADD COINS (Screenshot 1)
  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-zinc-950 flex flex-col justify-between pb-8">
      <div>
        {/* Clean White Header */}
        <header className="sticky top-0 z-30 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToWallet}
              className="min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center text-slate-900 dark:text-white"
              aria-label="Back to My Wallet"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Add Coins</h1>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-3.5 sm:px-6 py-4 space-y-4">
          {/* Select Payment Method */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="w-0.5 h-4 bg-slate-900 dark:bg-white rounded-full" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Select Payment Method
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 max-w-md">
              {(
                [
                  {
                    id: 'ZapUPI' as PaymentGateway,
                    desc: 'Safe • Smooth • Instant UPI Service',
                  },
                  {
                    id: 'TranzUPI' as PaymentGateway,
                    desc: 'Quick • Secure • Reliable Payments',
                  },
                ] as const
              ).map((gw) => {
                const selected = gateway === gw.id;
                return (
                  <button
                    key={gw.id}
                    type="button"
                    onClick={() => setGateway(gw.id)}
                    className={`rounded-2xl p-3.5 text-left transition-all border ${
                      selected
                        ? 'bg-white dark:bg-zinc-900 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                        : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <UpiWalletBadgeIcon />
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {gw.id}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-2 leading-snug">
                      {gw.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Select the amount Banner */}
          <section className="rounded-2xl bg-gradient-to-r from-[#EEF2FF] to-[#E2E9FF] dark:from-zinc-900 dark:to-indigo-950/60 border border-indigo-100 dark:border-zinc-800 px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <GoldCoinIcon className="w-9 h-9 shrink-0" />
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Select the amount
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400">
                  Choose any amount to add coins
                </p>
              </div>
            </div>
            <MiniWalletIllustration />
          </section>

          {/* Quick Amount Presets */}
          <section className="flex items-center gap-2 overflow-x-auto pb-1">
            {['10', '20', '50', '100', '200', '500', '1000'].map((preset) => {
              const active = amountStr === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setError(null);
                    setAmountStr(preset);
                  }}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-extrabold font-mono-num whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? 'bg-[#EEF2FF] dark:bg-indigo-950 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                      : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 hover:border-slate-300'
                  }`}
                >
                  ₹{preset}
                </button>
              );
            })}
          </section>

          {/* Editable Amount Field Card */}
          <section
            onClick={() => amountInputRef.current?.focus()}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 px-4 py-3 flex items-center justify-between gap-3 cursor-text"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl bg-[#ECECFF] dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0">
                ₹
              </div>
              <div className="flex-1">
                <div className="text-[11px] font-medium text-slate-400 dark:text-zinc-400">
                  Amount
                </div>
                <div className="flex items-center gap-1 text-lg font-extrabold font-mono-num text-slate-900 dark:text-white">
                  <span>₹</span>
                  <input
                    ref={amountInputRef}
                    type="number"
                    min={10}
                    max={10000}
                    value={amountStr}
                    onChange={(e) => {
                      setError(null);
                      setAmountStr(e.target.value);
                    }}
                    aria-label="Deposit amount"
                    className="w-full bg-transparent focus:outline-none font-mono-num"
                  />
                </div>
              </div>
            </div>
            <Pencil className="w-4 h-4 text-slate-400 shrink-0" />
          </section>

          {error && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-4 py-2.5 text-xs text-rose-700 dark:text-rose-200">
              {error}
            </div>
          )}

          {/* PAY NOW Button */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handlePayNow}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#2D45BF] via-[#2656D8] to-[#1D4ED8] hover:brightness-110 active:scale-[0.99] text-white font-extrabold text-sm tracking-wide uppercase flex items-center justify-center relative shadow-md transition-all"
            >
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-200" />
                <span>PAY NOW</span>
              </span>
              <ChevronRight className="w-4 h-4 absolute right-4" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>100% Secure Payment</span>
            </div>
          </div>

          {/* 100% SECURE Green Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-[#10A36C] to-[#15B87A] text-white px-4 py-3 flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold uppercase tracking-wide">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>100% SECURE</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-emerald-50">
              <span>Safe • Fast • Reliable</span>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            </div>
          </div>

          {/* How To Add Coins with Us? */}
          <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/70 dark:border-zinc-800 p-4 space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              How To Add Coins with Us?
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-zinc-300">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>Do not press back during payment.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>No hidden charges.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-slate-700 dark:text-zinc-300 shrink-0 mt-0.5" />
                <span>Wait till the payment gets confirmed.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Radio className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>Instant confirmation on successful payment.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>Payment is 100% secure.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Headphones className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Contact support for any issues with transactions.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-4 h-4 text-sky-600 font-bold text-center leading-4 shrink-0">
                  $
                </span>
                <span>Accepts all payment methods.</span>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Bottom Floating Pill */}
      <div className="flex justify-center pt-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4A4C52] text-white text-xs font-semibold shadow-md">
          <span className="w-5 h-5 rounded-full bg-black overflow-hidden flex items-center justify-center">
            <SkillClashEmblem className="w-full h-full" />
          </span>
          <span>2 payment methods available</span>
        </div>
      </div>
    </div>
  );
};
