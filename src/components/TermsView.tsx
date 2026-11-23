import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface TermsViewProps {
  onBack: () => void;
}

export const TermsView: React.FC<TermsViewProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
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
          <h1 className="text-lg font-semibold">Terms &amp; Conditions</h1>
        </div>
      </header>

      <main className="w-full max-w-3xl mx-auto px-5 py-5 space-y-7 text-[15px] leading-relaxed text-slate-900 dark:text-zinc-100 pb-12">
        <p>
          •Acceptance of Terms: By using SKILLBATTLE, you agree to comply with and be bound by
          these Terms and Conditions. If you do not agree with any part of these terms, please do
          not use the application.
        </p>

        <p>
          •Eligibility: Users must be at least 13 years old to participate in tournaments. Users
          under 18 must have parental consent.
        </p>

        <p>
          • Account Security: You are responsible for maintaining the confidentiality of your account
          information and for all activities that occur under your account. Notify us immediately of
          any unauthorized use.
        </p>

        <p>
          •Tournament Rules: All participants must follow the specific rules and guidelines set for
          each tournament. Violations may result in disqualification.
        </p>

        <p>
          •Content Ownership: SKILLBATTLE reserves the right to use and display user-generated
          content for promotional purposes.
        </p>

        <p>
          • Deposits &amp; Financial Responsibility: All deposits made on SKILLBATTLE are done at
          the user&apos;s own discretion after evaluating their own potential profit or loss.
          Deposits are non-refundable under any circumstances. SKILLBATTLE holds no responsibility
          for a user&apos;s financial decisions, deposit amounts, or outcomes resulting from
          gameplay.
        </p>

        <p>
          •Prohibited Activities: Users must not engage in cheating, exploiting bugs, or any
          activities that may harm the integrity of the tournament or the application.
        </p>

        <p>
          •Liability: SKILLBATTLE is not responsible for any loss or damage resulting from the use
          of the application or participation in tournaments.
        </p>

        <p>
          •Changes to Terms: We may update these terms from time to time. Continued use of the
          application constitutes acceptance of any changes.
        </p>

        <p>
          •Contact Information: For any questions or concerns, please contact at
          [teamxesports69@gmail.com].
        </p>
      </main>
    </div>
  );
};
