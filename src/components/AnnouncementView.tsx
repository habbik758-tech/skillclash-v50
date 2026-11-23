import React from 'react';
import { ArrowLeft, Bell, Megaphone } from 'lucide-react';
import type { AnnouncementItem, AppNotification } from '../types';

interface AnnouncementViewProps {
  onBack: () => void;
  announcements?: AnnouncementItem[];
  notifications?: AppNotification[];
}

export const AnnouncementView: React.FC<AnnouncementViewProps> = ({
  onBack,
  announcements = [],
  notifications = [],
}) => {
  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-zinc-950 flex flex-col">
      {/* Black Top Header matching Screenshot */}
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
          <h1 className="text-lg font-semibold">Announcement</h1>
        </div>
      </header>

      <main className="w-full max-w-3xl mx-auto px-3 py-4 space-y-4 pb-12 text-[14.5px] leading-relaxed text-slate-900 dark:text-zinc-100">
        {(announcements.length > 0 || notifications.length > 0) && (
          <section className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-xs border border-slate-200/70 dark:border-zinc-800 space-y-3">
            <h2 className="text-base font-bold uppercase tracking-tight text-slate-950 dark:text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-rose-500" />
              <span>LIVE ADMIN ANNOUNCEMENTS</span>
            </h2>
            <div className="space-y-2.5">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg bg-slate-50 dark:bg-zinc-800/70 border border-slate-200/70 dark:border-zinc-700 p-3 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {a.title}
                    </span>
                    <span className="text-[11px] font-mono-num text-slate-500 shrink-0">
                      {a.date}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-zinc-300">{a.body}</p>
                </div>
              ))}
              {notifications.slice(0, 5).map((n) => (
                <div
                  key={n.id}
                  className="rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/60 p-3 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                      <Bell className="w-3.5 h-3.5 text-indigo-500" />
                      {n.title}
                    </span>
                    <span className="text-[10px] font-mono-num text-slate-500 shrink-0">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-zinc-300">{n.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Card 1: PRIVATE CONTEST RULES */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-xs border border-slate-200/70 dark:border-zinc-800 space-y-4">
          <h2 className="text-base font-bold uppercase tracking-tight text-slate-950 dark:text-white">
            PRIVATE CONTEST RULES
          </h2>

          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Match Limit</h3>
            <ul className="space-y-1">
              <li>
                * All <strong>Private Contest</strong> matches are included in the{' '}
                <strong>Lone Wolf / Clash Squad daily match limit</strong>.
              </li>
              <li>
                * Every created or accepted challenge counts toward the limit,{' '}
                <strong>whether the match is played or cancelled</strong>.
              </li>
            </ul>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              HUD POV (Mandatory)
            </h3>
            <ul className="space-y-1">
              <li>
                * <strong>HUD POV is compulsory for every Private Contest match.</strong>
              </li>
              <li>
                * Failure to provide <strong>any requested HUD POV</strong> will result in a{' '}
                <strong>Direct Ban</strong>, regardless of your verification status.
              </li>
            </ul>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Additional Rules
            </h3>
            <ul className="space-y-1">
              <li>
                * All <strong>SkillBattle Official Rules &amp; Policies</strong> apply to Private
                Contests.
              </li>
              <li>
                * For complete rules, visit the <strong>Rules</strong> section in the app or join
                the <strong>SkillBattle Telegram Channel</strong>.
              </li>
            </ul>
          </div>
        </section>

        {/* Card 2: SKILLBATTLE OFFICIAL RULES & POLICIES */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-xs border border-slate-200/70 dark:border-zinc-800 space-y-5">
          <h2 className="text-base font-bold uppercase tracking-tight text-slate-950 dark:text-white">
            SKILLBATTLE OFFICIAL RULES &amp; POLICIES
          </h2>

          {/* 1. Account & Identity Rules */}
          <div className="space-y-2">
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
              1. Account &amp; Identity Rules
            </h3>
            <ul className="space-y-2">
              <li>* Only 1 SkillBattle account is allowed per user.</li>
              <li>* Only 1 Game ID can be linked to one SkillBattle account.</li>
              <li>
                * Creating a new account while already owning one will result in Direct Ban of the
                new account. Coins in the banned account will not be recovered.
              </li>
              <li>
                * If you forgot your old account password or have any issue, contact Customer
                Support instead of creating a new account.
              </li>
              <li>
                * Using multiple accounts for registration bonus or any unfair benefit = Permanent
                Ban.
              </li>
              <li>* Using 2 Game IDs on one SkillBattle account = Direct Ban.</li>
            </ul>
          </div>

          {/* 2. Ban Policy */}
          <div className="space-y-2">
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
              2. Ban Policy (Direct Ban Without Warning)
            </h3>
            <ul className="space-y-2">
              <li>* Using banned hacker names, UPI ID or blacklisted IDs.</li>
              <li>* Playing as an Unregistered Player or inviting unregistered players.</li>
              <li>* Using hacks, panels, cheats, or any unfair tools / glitches.</li>
              <li>* Using names related to hack seller, panel seller, hack, panel, or similar violations.</li>
              <li>
                * Promoting any other app, App cloning owners, website, course, panel, or service
                anywhere on SkillBattle.
              </li>
              <li>* Abusing Room Hosts or SkillBattle Management.</li>
              <li>* Using multiple Game IDs on one SkillBattle account.</li>
            </ul>
          </div>

          {/* 3. Screen Recording & HUD POV */}
          <div className="space-y-2">
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
              3. Screen Recording &amp; HUD POV (Mandatory)
            </h3>
            <ul className="space-y-2">
              <li>* Screen recording is mandatory for every match.</li>
              <li>
                * Recording must be saved for 24 hours. But If any Match Host Asked Pov Within Time
                Limit, Then The Player Must Provide Within Time Limit Otherwise Direct Ban || Host
                Can ask for pov within 30-240 min of match end.
              </li>
              <li>* Only HUD POV is accepted as valid evidence.</li>
              <li>* POV may be requested even after withdrawal for security verification.</li>
              <li>
                * In Duo/Squad matches, every joined player must provide their own HUD POV if
                requested.
              </li>
              <li>* Failure to provide requested HUD POV = ₹100 Penalty.</li>
            </ul>

            <div className="mt-2 rounded-lg bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 p-3 text-sm space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">
                SkillBattle Survival Team:
              </div>
              <p>
                IDP is usually shared 1–3 minutes before the match because Survival matches can
                sometimes run late. We start matches on time to ensure the next match doesn&apos;t
                get delayed.
              </p>
              <p>
                This is currently the best way to maintain a smooth, fair &amp; timely Survival Mode
                experience.
              </p>
            </div>
          </div>

          {/* 4. Verification Rules */}
          <div className="space-y-2">
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
              4. Verification Rules
            </h3>
            <ul className="space-y-2">
              <li>* You can be called for verification at any time.</li>
              <li>* If verification is requested, it must be completed within 24 hours.</li>
              <li>* Failure to verify within 24 hours = Direct Ban + action on linked accounts.</li>
              <li>
                * Even if you withdraw after 24 hours, you must provide the required POV if
                requested for that eligible match period.
              </li>
            </ul>
          </div>

          {/* 5. Match Join Limit */}
          <div className="space-y-2">
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
              5. Match Join Limit (LW/CS Only)
            </h3>
            <p>This limit applies only to Lone Wolf and Clash Squad modes.</p>
            <ul className="space-y-2">
              <li>* Maximum 10 matches per day.</li>
              <li>* If you enter tomorrow&apos;s match today, it is counted today.</li>
              <li>* Cancelled or unplayed matches still count toward the daily limit.</li>
              <li>
                * Exceeding the limit = ₹50 Penalty. + Winnings Of Extra Matches Won Will Be
                Deducted!
              </li>
              <li>* Every additional 3 extra matches = +₹50 Penalty.</li>
              <li>
                * Lone Wolf players must follow all joining rules carefully; violation may result in
                ₹100 Penalty.
              </li>
            </ul>
          </div>

          {/* 6. Game Name Policy */}
          <div className="space-y-2">
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
              6. Game Name Policy (LW / CS / Survival)
            </h3>
            <ul className="space-y-2">
              <li>* Using 2 registered game names is allowed.</li>
              <li>* Using 3 or more names on the same account is prohibited.</li>
              <li>
                * Using multiple names across modes beyond the allowed limit = ₹100 Penalty/per Name
                or Direct Ban.
              </li>
              <li>* Using the same Game ID across multiple SkillBattle accounts = Direct Ban.</li>
            </ul>
          </div>

          {/* 7. Penalty Rules */}
          <div className="space-y-2">
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
              7. Penalty Rules
            </h3>
            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-zinc-700">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold">
                  <tr>
                    <th className="px-3 py-2">Violation</th>
                    <th className="px-3 py-2 text-right">Penalty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-zinc-700">
                  <tr>
                    <td className="px-3 py-2">Misbehaving with opponent</td>
                    <td className="px-3 py-2 text-right font-semibold">₹50</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">Fake proof submission</td>
                    <td className="px-3 py-2 text-right font-semibold">₹200</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">Executive involvement</td>
                    <td className="px-3 py-2 text-right font-semibold">₹500 / Permanent Ban</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">HUD POV not provided</td>
                    <td className="px-3 py-2 text-right font-semibold">₹100</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">Match limit exceeded (LW/CS)</td>
                    <td className="px-3 py-2 text-right font-semibold">
                      ₹50 + additional as applicable
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">Penalty not cleared within 24 hours</td>
                    <td className="px-3 py-2 text-right font-semibold">+₹100</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 8. Penalty Resolution */}
          <div className="space-y-2">
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
              8. Penalty Resolution
            </h3>
            <div className="space-y-1">
              <div className="font-semibold text-slate-900 dark:text-white">HUD POV Case</div>
              <p>
                If you provide a valid HUD POV, the penalty will be removed and your withdrawal will
                be processed.
              </p>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-slate-900 dark:text-white">
                No HUD POV / Match Limit / Multiple Account Case
              </div>
              <p>The penalty can only be cleared by depositing the penalty amount.</p>
            </div>
          </div>

          {/* 9. Opponent POV Request Rules */}
          <div className="space-y-2">
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
              9. Opponent POV Request Rules
            </h3>
            <ul className="space-y-2">
              <li>* You must first submit your own HUD POV.</li>
              <li>
                * After review, if suspicion is found, SkillBattle may request the opponent&apos;s
                POV.
              </li>
              <li>* POV complaints must be submitted within 1 hour after match completion.</li>
              <li>* No POV request will be accepted after the time limit.</li>
            </ul>
          </div>

          {/* 10. Refund Policy */}
          <div className="space-y-2">
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
              10. Refund Policy (Per Kill / Survival)
            </h3>
            <p>Refund is available only if all conditions are met:</p>
            <ul className="space-y-1">
              <li>* You were killed by an Unregistered Player or Hacker.</li>
              <li>* You had 0 kills before dying.</li>
            </ul>
            <p className="pt-1">No refund if:</p>
            <ul className="space-y-1">
              <li>* You have 1 or more kills.</li>
              <li>* You receive any match reward or winning amount.</li>
            </ul>
          </div>

          {/* 11. Withdrawal Policy */}
          <div className="space-y-2">
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
              11. Withdrawal Policy
            </h3>
            <ul className="space-y-2">
              <li>* If a withdrawal is rejected, 100% amount is refunded to Join Money.</li>
              <li>
                * If you request withdrawal without playing any paid match in between withdrawals,
                the amount is refunded to Join Money.
              </li>
              <li>
                * Users who have played only Free Matches or used only registered bonus must
                complete any deposit before becoming eligible for withdrawal. Violation = ₹100
                penalty.
              </li>
              <li>* Enter a valid UPI ID (Example: 99xxxxxx98@upi).</li>
              <li>* Incorrect withdrawal details are the user&apos;s responsibility.</li>
            </ul>
          </div>

          {/* 12. Add Coin Issue */}
          <div className="space-y-2">
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
              12. Add Coin Issue
            </h3>
            <p>If payment is successful but coins are not credited:</p>
            <ul className="space-y-1">
              <li>* Contact Customer Support within 12 hours.</li>
              <li>* Send payment screenshot + SkillBattle username.</li>
              <li>* Late reports may not be eligible for resolution.</li>
            </ul>
          </div>

          {/* 13. Final Authority */}
          <div className="space-y-2">
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
              13. Final Authority
            </h3>
            <p>
              SkillBattle reserves the right to verify any account, match, withdrawal, or gameplay
              activity at any time. Any attempt to bypass these rules or gain an unfair advantage
              may result in penalties, suspension, or permanent account termination without prior
              notice.
            </p>
          </div>
        </section>

        {/* Bottom Fair Gameplay Footer */}
        <div className="rounded-xl bg-[#1C1D22] text-white px-4 py-3 text-center text-xs font-semibold tracking-wide">
          Follow The Rules → Enjoy Fair Gameplay ♦ SkillBattle = Safe, Secure &amp; Trusted ♦
        </div>
      </main>
    </div>
  );
};
