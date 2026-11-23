import React, { useState } from 'react';
import { ArrowLeft, Check, CheckCircle2, Clock, Mail, MessageSquarePlus, Send } from 'lucide-react';
import { SUPPORT_TELEGRAM_URL } from '../constants/assets';
import type { SupportTicket } from '../types';

interface CustomerSupportViewProps {
  onBack: () => void;
  tickets?: SupportTicket[];
  onCreateTicket?: (subject: string, message: string) => Promise<void>;
  supportEmail?: string;
  supportTelegram?: string;
}

export const CustomerSupportView: React.FC<CustomerSupportViewProps> = ({
  onBack,
  tickets = [],
  onCreateTicket,
  supportEmail = 'contactontelegramonly@xyz.com',
  supportTelegram = SUPPORT_TELEGRAM_URL,
}) => {
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);
  const [ticketError, setTicketError] = useState<string | null>(null);

  const handleCopy = (label: string, value: string) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopiedNotice(`${label} copied: ${value}`);
    setTimeout(() => setCopiedNotice(null), 2200);
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCreateTicket) return;
    setTicketError(null);
    setTicketSuccess(null);
    setSubmitting(true);
    try {
      await onCreateTicket(subject, message);
      setTicketSuccess('Support ticket submitted! Our team will reply right here.');
      setSubject('');
      setMessage('');
    } catch (err) {
      setTicketError(err instanceof Error ? err.message : 'Unable to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col pb-10">
      {/* Black Top Header */}
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
          <h1 className="text-lg font-semibold">Customer Support</h1>
        </div>
      </header>

      <main className="w-full max-w-3xl mx-auto px-5 py-3 space-y-6">
        <div className="divide-y divide-slate-200 dark:divide-zinc-800 text-[15px] text-slate-900 dark:text-zinc-100">
          <div className="py-4">
            <span className="font-medium">Address :</span>
            <span>REPLY TIME ONLY 10AM - 10PM FIX !! ⚡</span>
          </div>

          <div className="py-4 flex items-center justify-between gap-3">
            <div className="min-w-0 break-words">
              <span className="font-medium">Email :</span>
              <span>{supportEmail}</span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy('Email', supportEmail)}
              aria-label="Copy support email"
              className="w-8 h-6 rounded-sm bg-[#62E699] hover:bg-[#4cd986] text-white flex items-center justify-center shrink-0 transition-colors"
            >
              <Mail className="w-4 h-4" />
            </button>
          </div>

          <div className="py-4 flex items-center justify-between gap-3">
            <div className="min-w-0 break-words">
              <span className="font-medium">Telegram : </span>
              <a
                href={supportTelegram}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-sky-600 dark:text-sky-400 hover:underline"
              >
                SKILLBATTLE care
              </a>
            </div>
            <a
              href={supportTelegram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open SKILLBATTLE care on Telegram"
              className="w-7 h-7 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center shrink-0 transition-colors"
            >
              <Send className="w-3.5 h-3.5 -ml-0.5" />
            </a>
          </div>

          <div className="py-4">
            <span className="font-medium">Street :</span>
            <span>INDIAN ESPORTS COMMUNITY ⚡</span>
          </div>

          <div className="py-4 leading-snug">
            <span className="font-medium">Time :</span>
            <span>10AM - 10PM • SO DON&apos;T SPAM MESSAGE JUST WAIT FOR OUR REPLY ⚡</span>
          </div>
        </div>

        {copiedNotice && (
          <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <Check className="w-3.5 h-3.5" />
            <span>{copiedNotice}</span>
          </div>
        )}

        {onCreateTicket && (
          <section className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <MessageSquarePlus className="w-4 h-4 text-[#54E397]" />
              <span>Raise a Support Ticket</span>
            </div>

            {ticketError && (
              <div className="rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-3 py-2 text-xs text-rose-700 dark:text-rose-200">
                {ticketError}
              </div>
            )}
            {ticketSuccess && (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{ticketSuccess}</span>
              </div>
            )}

            <form onSubmit={handleTicketSubmit} className="space-y-3">
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject (e.g. Deposit UTR not credited / Match POV)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-slate-900 dark:text-white"
              />
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue (Match ID, UTR, or Game UID)..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-xl bg-[#16181D] hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wide disabled:opacity-60"
              >
                {submitting ? 'Submitting Ticket...' : 'Submit Support Ticket'}
              </button>
            </form>

            {tickets.length > 0 && (
              <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 space-y-2.5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Your Recent Tickets
                </h3>
                {tickets.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-xl bg-white dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700 p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {t.subject}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                          t.status === 'Resolved'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {t.status === 'Resolved' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {t.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-zinc-300">{t.message}</p>
                    {t.adminReply && (
                      <div className="mt-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-2 text-xs text-emerald-800 dark:text-emerald-200">
                        <strong className="block text-[10px] uppercase tracking-wider mb-0.5">
                          Admin Reply:
                        </strong>
                        {t.adminReply}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};
