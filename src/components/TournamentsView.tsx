import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bomb,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  KeyRound,
  Lock,
  Plus,
} from 'lucide-react';
import { IMAGES } from '../constants/assets';
import { GoldCoinIcon, SkillClashEmblem } from './BrandIcons';
import { getRoomRevealInfo } from '../utils/matchSchedule';
import type { MatchStatus, TournamentCategory, TournamentMatch, UserProfile } from '../types';

interface TournamentsViewProps {
  mode: 'tournaments' | 'contests';
  categories: TournamentCategory[];
  matches: TournamentMatch[];
  user: UserProfile;
  onBack: () => void;
  onJoinMatch: (
    matchId: string,
    inGameName: string,
    uid: string,
    position?: number,
  ) => Promise<void>;
  onCreatePrivateContest: (payload: {
    title: string;
    teamType: '1v1' | '2v2' | '4v4';
    entryFee: number;
    map: string;
  }) => Promise<TournamentMatch | null>;
  onFindPrivateByCode: (inviteCode: string) => Promise<TournamentMatch | null>;
  onOpenWallet: () => void;
  onOpenSupport?: () => void;
}

function WalletBadgeIcon() {
  return (
    <svg viewBox="0 0 64 56" fill="none" className="w-16 h-14 shrink-0" aria-hidden="true">
      <path d="M16 14L44 4L50 18L18 22L16 14Z" fill="#A7F3D0" />
      <path d="M10 18L42 10L46 22L12 26L10 18Z" fill="#6EE7B7" />
      <rect x="4" y="14" width="52" height="36" rx="6" fill="#F59E0B" />
      <rect x="6" y="16" width="48" height="32" rx="5" fill="#FBBF24" />
      <path
        d="M56 18H52C48 18 46 21 46 25V39C46 43 48 46 52 46H56V18Z"
        fill="#EF4444"
      />
      <circle cx="50" cy="32" r="3" fill="#FCA5A5" />
    </svg>
  );
}

export const TournamentsView: React.FC<TournamentsViewProps> = ({
  mode,
  categories,
  matches,
  user,
  onBack,
  onJoinMatch,
  onCreatePrivateContest,
  onFindPrivateByCode,
  onOpenWallet,
  onOpenSupport,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TournamentCategory | null>(null);
  const [matchTab, setMatchTab] = useState<MatchStatus>('UPCOMING');
  const [expandedPrizeId, setExpandedPrizeId] = useState<string | null>(null);
  const [detailMatchId, setDetailMatchId] = useState<string | null>(null);
  const [resultMatchId, setResultMatchId] = useState<string | null>(null);
  const [watchNoticeId, setWatchNoticeId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'DESCRIPTION' | 'JOINED MEMBER'>('DESCRIPTION');
  const [subscribeNotice, setSubscribeNotice] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // 2-step Join Flow state matching Screenshots 1 & 2
  const [joinTarget, setJoinTarget] = useState<TournamentMatch | null>(null);
  const [joinStep, setJoinStep] = useState<'position' | 'confirm'>('position');
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [inGameName, setInGameName] = useState(() => {
    if (user.savedGameName) return user.savedGameName;
    try {
      return window.localStorage.getItem(`skillbattle_game_name_${user.id}`) || '';
    } catch {
      return '';
    }
  });
  const [uid, setUid] = useState(() => {
    if (user.savedGameUid) return user.savedGameUid;
    try {
      return window.localStorage.getItem(`skillbattle_game_uid_${user.id}`) || '1928374650';
    } catch {
      return '1928374650';
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let nextName = user.savedGameName || '';
    if (!nextName) {
      try {
        nextName = window.localStorage.getItem(`skillbattle_game_name_${user.id}`) || '';
      } catch {
        nextName = '';
      }
    }
    setInGameName(nextName);

    let nextUid = user.savedGameUid || '';
    if (!nextUid) {
      try {
        nextUid = window.localStorage.getItem(`skillbattle_game_uid_${user.id}`) || '';
      } catch {
        nextUid = '';
      }
    }
    setUid(nextUid || '1928374650');
  }, [user.id, user.savedGameName, user.savedGameUid]);

  // Private contest creator & join by code
  const [showCreatePvt, setShowCreatePvt] = useState(false);
  const [pvtTitle, setPvtTitle] = useState('');
  const [pvtTeam, setPvtTeam] = useState<'1v1' | '2v2' | '4v4'>('1v1');
  const [pvtFee, setPvtFee] = useState('10');
  const [pvtMap] = useState('Iron Cage');
  const [inviteCodeInput, setInviteCodeInput] = useState('');

  const filteredCategories = categories.filter((c) =>
    mode === 'contests' ? Boolean(c.isPrivateContest) : !c.isPrivateContest,
  );

  const getCategoryImage = (cat: TournamentCategory) => {
    switch (cat.artVariant) {
      case 'battle':
        return IMAGES.BATTLE_ART;
      case 'headshot':
        return IMAGES.HEADSHOT_ART;
      case 'yellow':
        return IMAGES.TOP_GAME;
      case 'promo':
      default:
        return IMAGES.MORE_PROMO;
    }
  };

  const categoryMatches = useMemo(() => {
    if (!selectedCategory) return [];
    return matches.filter((m) => m.categoryId === selectedCategory.id);
  }, [matches, selectedCategory]);

  const tabMatches = useMemo(() => {
    return categoryMatches.filter((m) => m.status === matchTab);
  }, [categoryMatches, matchTab]);

  const takenSet = useMemo(() => {
    if (!joinTarget) return new Set<number>();
    if (joinTarget.takenPositions && joinTarget.takenPositions.length > 0) {
      return new Set(joinTarget.takenPositions);
    }
    return new Set(Array.from({ length: joinTarget.filledSlots }, (_, i) => i + 1));
  }, [joinTarget]);

  const openJoinFlow = (match: TournamentMatch) => {
    setError(null);
    setSuccessNote(null);
    let savedName = user.savedGameName || '';
    if (!savedName) {
      try {
        savedName = window.localStorage.getItem(`skillbattle_game_name_${user.id}`) || '';
      } catch {
        savedName = '';
      }
    }
    if (savedName) {
      setInGameName(savedName);
    }
    let savedUid = user.savedGameUid || '';
    if (!savedUid) {
      try {
        savedUid = window.localStorage.getItem(`skillbattle_game_uid_${user.id}`) || '';
      } catch {
        savedUid = '';
      }
    }
    if (savedUid) {
      setUid(savedUid);
    }
    setJoinTarget(match);
    setJoinStep('position');
    setSelectedPosition(null);
  };

  const handleProceedToConfirm = () => {
    setError(null);
    if (!selectedPosition) {
      setError('Please select an available match position first.');
      return;
    }
    setJoinStep('confirm');
  };

  const handleFinalJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinTarget || !selectedPosition) return;
    setError(null);
    const cleanName = inGameName.trim();
    const cleanUidVal = uid.trim() || '1928374650';
    if (cleanName.length < 2) {
      setError('Please enter your Game Name.');
      return;
    }
    setSubmitting(true);
    try {
      try {
        window.localStorage.setItem(`skillbattle_game_name_${user.id}`, cleanName);
        window.localStorage.setItem(`skillbattle_game_uid_${user.id}`, cleanUidVal);
      } catch {
        // Ignore storage quota errors
      }
      await onJoinMatch(joinTarget.id, cleanName, cleanUidVal, selectedPosition);
      setSuccessNote(`Joined ${joinTarget.title} at Position #${selectedPosition}!`);
      setJoinTarget(null);
      setSelectedPosition(null);
      setJoinStep('position');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to join match');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePrivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const created = await onCreatePrivateContest({
        title: pvtTitle || `${user.username} Private Clash`,
        teamType: pvtTeam,
        entryFee: Number(pvtFee) || 0,
        map: pvtMap,
      });
      if (created) {
        setShowCreatePvt(false);
        setPvtTitle('');
        setMatchTab('UPCOMING');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLookupCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!inviteCodeInput.trim()) return;
    const found = await onFindPrivateByCode(inviteCodeInput.trim());
    if (found) {
      openJoinFlow(found);
      setInviteCodeInput('');
    } else {
      setError('No private room found for that invite code.');
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const detailMatch = useMemo(
    () => (detailMatchId ? matches.find((m) => m.id === detailMatchId) || null : null),
    [detailMatchId, matches],
  );

  const resultMatch = useMemo(
    () => (resultMatchId ? matches.find((m) => m.id === resultMatchId) || null : null),
    [resultMatchId, matches],
  );

  const openMatchDetail = (match: TournamentMatch) => {
    if (match.status === 'RESULTS') {
      setResultMatchId(match.id);
      setWatchNoticeId(null);
      return;
    }
    setDetailMatchId(match.id);
    setDetailTab('DESCRIPTION');
    setSubscribeNotice(false);
  };

  const renderPosterBanner = (m: TournamentMatch, cat: TournamentCategory) => (
    <div className="relative h-44 bg-zinc-950 overflow-hidden">
      <img
        src={m.bannerUrl || getCategoryImage(cat)}
        alt={m.title}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover opacity-85"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/45 to-black/85" />

      <div className="absolute inset-y-0 right-0 w-[64%] p-2.5 flex flex-col justify-between text-white text-left">
        <div className="flex items-start justify-end gap-1.5">
          <div className="w-6 h-6 rounded-full bg-black border border-white/25 overflow-hidden shrink-0">
            <SkillClashEmblem className="w-full h-full" />
          </div>
          <div className="text-right leading-none">
            <div className="text-[11px] sm:text-xs font-extrabold italic text-amber-300 uppercase drop-shadow">
              {m.teamType === 'Squad'
                ? 'FULL MAP SQUAD'
                : m.teamType === 'Solo'
                  ? 'SOLO PER KILL'
                  : `${m.teamType} CUSTOM`}
            </div>
            <div className="text-[11px] sm:text-xs font-extrabold italic text-white uppercase drop-shadow">
              TOURNAMENT
            </div>
          </div>
        </div>

        <div className="rounded-md bg-black/75 border border-white/15 p-1.5 space-y-0.5 text-[9px] leading-tight">
          <div className="inline-block bg-rose-600 text-white font-extrabold px-2 py-0.5 rounded-xs text-[9px] uppercase mb-0.5">
            RULES!
          </div>
          <div className="truncate">• RECORD ROOM ENTRY &amp; GAMEPLAY</div>
          <div className="truncate">• BAN GUN - DOUBLE VECTOR, M79</div>
          <div className="truncate">• MINIMUM LVL 40 · HUD POV MUST</div>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // STEP 1: SELECT MATCH POSITION (Screenshot 1)
  // ============================================================================
  if (joinTarget && joinStep === 'position') {
    const positions = Array.from({ length: joinTarget.maxSlots }, (_, idx) => idx + 1);

    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
        <header className="sticky top-0 z-30 bg-[#0B0C10] text-white">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setJoinTarget(null);
                setError(null);
              }}
              className="min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center text-white"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-semibold truncate">{joinTarget.title}</h1>
          </div>
          <div className="bg-[#56E698] text-white text-center text-[15px] font-medium py-2.5">
            Select Match Position
          </div>
        </header>

        <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-5 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            {error && (
              <div className="rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-3.5 py-2.5 text-xs text-rose-700 dark:text-rose-200">
                {error}
              </div>
            )}

            <div className="grid grid-cols-4 gap-y-6 gap-x-3 pt-1">
              {positions.map((pos) => {
                const isTaken = takenSet.has(pos);
                const isPicked = selectedPosition === pos;

                return (
                  <button
                    key={pos}
                    type="button"
                    disabled={isTaken}
                    onClick={() => {
                      setError(null);
                      setSelectedPosition(pos);
                    }}
                    className="flex items-center justify-center gap-2.5 py-1 disabled:cursor-not-allowed"
                  >
                    <span
                      className={`w-6 text-right text-[15px] font-mono-num ${
                        isTaken
                          ? 'text-slate-600 dark:text-zinc-500'
                          : 'text-slate-900 dark:text-white font-medium'
                      }`}
                    >
                      {pos}
                    </span>
                    <span
                      className={`w-5 h-5 rounded-xs flex items-center justify-center border-2 transition-colors ${
                        isTaken
                          ? 'bg-slate-300 dark:bg-zinc-700 border-slate-300 dark:border-zinc-700 text-white'
                          : isPicked
                            ? 'bg-[#56E698] border-[#56E698] text-white'
                            : 'bg-white dark:bg-zinc-900 border-zinc-700 dark:border-zinc-400'
                      }`}
                    >
                      {(isTaken || isPicked) && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pb-4">
            <button
              type="button"
              onClick={handleProceedToConfirm}
              className="w-full h-12 rounded-md bg-[#56E698] hover:bg-[#46d687] active:scale-[0.99] text-white font-semibold uppercase tracking-wide text-sm shadow-sm transition-all"
            >
              JOIN NOW
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ============================================================================
  // STEP 2: JOINING MATCH CONFIRMATION (Screenshot 2)
  // ============================================================================
  if (joinTarget && joinStep === 'confirm') {
    const teamNumber =
      joinTarget.teamType === 'Squad' || joinTarget.teamType === '4v4'
        ? Math.ceil((selectedPosition || 1) / 4)
        : joinTarget.teamType === 'Duo' || joinTarget.teamType === '2v2'
          ? Math.ceil((selectedPosition || 1) / 2)
          : 1;

    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
        <header className="sticky top-0 z-30 bg-[#0B0C10] text-white">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setJoinStep('position');
              }}
              className="min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center text-white"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">Joining Match</h1>
          </div>
        </header>

        <main className="w-full max-w-3xl mx-auto px-4 py-4 space-y-5">
          {/* Wallet + Entry Fee Summary */}
          <div className="flex items-start justify-between gap-4">
            <WalletBadgeIcon />

            <div className="space-y-2 text-right text-[14px] text-slate-900 dark:text-zinc-100">
              <div className="flex items-center justify-end gap-1.5">
                <span>Your Current Balance :</span>
                <GoldCoinIcon className="w-4 h-4" />
                <span className="font-mono-num font-semibold">{user.balance}</span>
              </div>
              <div className="flex items-center justify-end gap-1.5">
                <span>Match Entry Fee Per Person :</span>
                <GoldCoinIcon className="w-4 h-4" />
                <span className="font-mono-num font-semibold">{joinTarget.entryFee}</span>
              </div>
              <div className="flex items-center justify-end gap-1.5">
                <span>Total Payable Amount :</span>
                <GoldCoinIcon className="w-4 h-4" />
                <span className="font-mono-num font-semibold">{joinTarget.entryFee}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-3.5 py-2.5 text-xs text-rose-700 dark:text-rose-200">
              {error}
            </div>
          )}

          {/* Selected Position Card */}
          <form onSubmit={handleFinalJoin} className="space-y-5">
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-xs">
              <div className="bg-[#56E698] text-white text-center text-[15px] font-medium py-2.5">
                Selected Position
              </div>

              <div className="bg-[#343A46] text-white grid grid-cols-12 text-xs sm:text-sm font-medium py-2.5 px-3">
                <div className="col-span-3">Team</div>
                <div className="col-span-3 text-center">Position</div>
                <div className="col-span-6 text-center">Game Name</div>
              </div>

              <div className="bg-white dark:bg-zinc-900 grid grid-cols-12 items-center px-3 py-3 text-sm text-slate-900 dark:text-white">
                <div className="col-span-3 font-medium">Team {teamNumber}</div>
                <div className="col-span-3 text-center font-mono-num font-semibold">
                  {selectedPosition}
                </div>
                <div className="col-span-6">
                  <input
                    type="text"
                    required
                    value={inGameName}
                    onChange={(e) => {
                      const nextVal = e.target.value;
                      setInGameName(nextVal);
                      try {
                        if (nextVal.trim()) {
                          window.localStorage.setItem(`skillbattle_game_name_${user.id}`, nextVal.trim());
                        } else {
                          window.localStorage.removeItem(`skillbattle_game_name_${user.id}`);
                        }
                      } catch {
                        // Ignore storage quota errors
                      }
                    }}
                    placeholder="Enter Game Name"
                    aria-label="Game Name"
                    className="w-full text-center bg-transparent border-b border-slate-300 dark:border-zinc-700 focus:border-[#56E698] py-1 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Optional UID field subtly available if user wants to customize */}
            <div className="flex items-center justify-between gap-3 px-1 text-xs text-slate-500 dark:text-zinc-400">
              <label htmlFor="ff-uid-opt" className="shrink-0">
                Game UID (optional):
              </label>
              <input
                id="ff-uid-opt"
                type="text"
                value={uid}
                onChange={(e) => {
                  const nextUid = e.target.value;
                  setUid(nextUid);
                  try {
                    if (nextUid.trim()) {
                      window.localStorage.setItem(`skillbattle_game_uid_${user.id}`, nextUid.trim());
                    }
                  } catch {
                    // Ignore storage quota errors
                  }
                }}
                placeholder="1928374650"
                className="w-40 text-right bg-transparent border-b border-slate-200 dark:border-zinc-700 py-0.5 font-mono-num text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-[#56E698]"
              />
            </div>

            {/* CANCEL & JOIN side-by-side buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setJoinStep('position');
                }}
                className="h-11 rounded-md bg-[#7E7AF2] hover:bg-[#6d69e6] text-white font-semibold uppercase tracking-wide text-sm shadow-xs transition-colors"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="h-11 rounded-md bg-[#56E698] hover:bg-[#46d687] disabled:opacity-60 text-white font-semibold uppercase tracking-wide text-sm shadow-xs transition-colors"
              >
                {submitting ? 'JOINING...' : 'JOIN'}
              </button>
            </div>
          </form>

          <p className="pt-8 text-[15px] text-slate-900 dark:text-zinc-200 font-medium">
            Note - Enter your Game Name once; it will be saved automatically for future matches.
          </p>
        </main>
      </div>
    );
  }

  // ============================================================================
  // MATCH RESULT SCREEN (Screenshot 1 - Full Leaderboard & Winner Table)
  // ============================================================================
  if (resultMatch && selectedCategory) {
    const datePart =
      resultMatch.dateLabel || resultMatch.startTime.split('·')[0]?.trim() || resultMatch.startTime;
    const timePart = resultMatch.timeLabel || resultMatch.startTime.split('·')[1]?.trim() || '';
    const rows =
      resultMatch.results && resultMatch.results.length > 0
        ? resultMatch.results
        : [
            {
              rank: 1,
              playerName: resultMatch.winnerUsername || 'ROHITIM',
              kills: 4,
              winning: 34,
            },
          ];
    const winnerRow = rows[0];

    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 pb-10 flex flex-col">
        <header className="sticky top-0 z-30 bg-[#0B0C10] text-white">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setResultMatchId(null)}
              className="min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center text-white"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-medium">Match Result</h1>
          </div>
        </header>

        <main className="w-full max-w-3xl mx-auto px-3 py-3 space-y-4">
          {/* Top Poster Banner */}
          <div className="rounded-md overflow-hidden shadow-xs">
            {renderPosterBanner(resultMatch, selectedCategory)}
          </div>

          {/* Mint Green Match Title */}
          <h2 className="text-[15px] sm:text-base font-semibold text-[#56E698]">
            {resultMatch.title}
          </h2>

          {/* Meta Info Pills */}
          <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-slate-900 dark:text-zinc-100">
            <span className="inline-flex items-center px-2.5 py-1.5 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
              Organised on {datePart} {timePart}
            </span>
            <span className="inline-flex items-center px-2.5 py-1.5 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs font-mono-num">
              Winning Prize : {resultMatch.prizePool}(₹)
            </span>
            <span className="inline-flex items-center px-2.5 py-1.5 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs font-mono-num">
              Per Kill : {resultMatch.perKill}(₹)
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs font-mono-num">
              <span>Entry Fee :</span>
              <GoldCoinIcon className="w-4 h-4" />
              <span>{resultMatch.entryFee}</span>
            </span>
          </div>

          {/* Winner Box */}
          <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-xs bg-white dark:bg-zinc-900">
            <div className="bg-[#56E698] text-white text-center text-sm font-semibold py-2.5">
              Winner
            </div>
            <div className="bg-[#343A46] text-white grid grid-cols-12 px-3 py-2 text-xs sm:text-sm font-medium items-center">
              <div className="col-span-2 text-center">#</div>
              <div className="col-span-6 text-center">Player Name</div>
              <div className="col-span-2 text-center">Kills</div>
              <div className="col-span-2 text-center">Winning</div>
            </div>
            <div className="grid grid-cols-12 px-3 py-3 text-sm text-slate-900 dark:text-zinc-100 items-center text-center">
              <div className="col-span-2 font-mono-num font-medium">{winnerRow.rank}</div>
              <div className="col-span-6 font-medium truncate">{winnerRow.playerName}</div>
              <div className="col-span-2 font-mono-num">{winnerRow.kills}</div>
              <div className="col-span-2 font-mono-num">{winnerRow.winning}</div>
            </div>
          </div>

          {/* Full Match Result Table */}
          <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-xs bg-white dark:bg-zinc-900">
            <div className="bg-[#56E698] text-white text-center text-sm font-semibold py-2.5">
              Match Result
            </div>
            <div className="bg-[#343A46] text-white grid grid-cols-12 px-3 py-2 text-xs sm:text-sm font-medium items-center">
              <div className="col-span-2 text-center">#</div>
              <div className="col-span-6 text-center">Player Name</div>
              <div className="col-span-2 text-center">Kills</div>
              <div className="col-span-2 text-center">Winning</div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
              {rows.map((row) => (
                <div
                  key={`${row.rank}-${row.playerName}`}
                  className="grid grid-cols-12 px-3 py-3 text-sm text-slate-900 dark:text-zinc-100 items-center text-center"
                >
                  <div className="col-span-2 font-mono-num">{row.rank}</div>
                  <div className="col-span-6 font-medium truncate">{row.playerName}</div>
                  <div className="col-span-2 font-mono-num">{row.kills}</div>
                  <div className="col-span-2 font-mono-num">{row.winning}</div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ============================================================================
  // MATCH DETAIL SCREEN (When tapping any match banner - 4 Screenshots)
  // ============================================================================
  if (detailMatch && selectedCategory) {
    const isJoined = detailMatch.joinedUsers.some((j) => j.userId === user.id);
    const myJoinEntry = detailMatch.joinedUsers.find((j) => j.userId === user.id);
    const isFull = detailMatch.filledSlots >= detailMatch.maxSlots;
    const datePart =
      detailMatch.dateLabel || detailMatch.startTime.split('·')[0]?.trim() || detailMatch.startTime;
    const timePart = detailMatch.timeLabel || detailMatch.startTime.split('·')[1]?.trim() || '';
    const detailTakenSlots =
      detailMatch.takenPositions && detailMatch.takenPositions.length > 0
        ? detailMatch.takenPositions
        : Array.from({ length: detailMatch.filledSlots }, (_, idx) => idx + 1);

    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 pb-20 flex flex-col">
        {/* Black Sticky Top Bar */}
        <header className="sticky top-0 z-30 bg-[#0B0C10] text-white">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setDetailMatchId(null);
                setSubscribeNotice(false);
              }}
              className="min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center text-white"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-medium truncate">
              {detailMatch.title.replace(/\s*-\s*Match\s*#\d+$/i, '')}
            </h1>
          </div>
        </header>

        <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col">
          {/* Match Poster Banner */}
          <div className="p-2.5 pb-0 bg-[#0B0C10]">
            <div className="rounded-t-md overflow-hidden">
              {renderPosterBanner(detailMatch, selectedCategory)}
            </div>
          </div>

          {/* DESCRIPTION | JOINED MEMBER Black Tab Bar */}
          <div className="bg-[#0B0C10] grid grid-cols-2 text-center border-b border-zinc-800">
            {(['DESCRIPTION', 'JOINED MEMBER'] as const).map((tab) => {
              const active = detailTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setDetailTab(tab)}
                  className={`py-3 text-xs sm:text-sm font-bold tracking-wide transition-colors border-b-2 ${
                    active
                      ? 'text-white border-white'
                      : 'text-zinc-500 border-transparent hover:text-zinc-300'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {detailTab === 'DESCRIPTION' ? (
            <main className="px-3.5 py-4 space-y-4 text-slate-900 dark:text-zinc-100">
              {/* Match title & number */}
              <section className="space-y-2">
                <h2 className="text-[15px] font-semibold text-[#56E698]">
                  Match title &amp; number
                </h2>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="inline-flex items-center px-2.5 py-1 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
                    Team {detailMatch.teamType}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs font-mono-num">
                    <span>Entry Fee</span>
                    <GoldCoinIcon className="w-4 h-4" />
                    <span>{detailMatch.entryFee}</span>
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
                    Match Type :{detailMatch.entryFee > 0 ? 'PAID' : 'FREE'}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
                    Map :{detailMatch.map}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs font-mono-num">
                    Match Schedule :{datePart} {timePart}
                  </span>
                </div>
              </section>

              {/* Room Detail */}
              {(() => {
                const detailReveal = getRoomRevealInfo(detailMatch, nowMs, isJoined);
                return (
                  <section className="space-y-2">
                    <h2 className="text-[15px] font-semibold text-[#56E698]">Room Detail</h2>
                    <div className="rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-center text-sm font-medium shadow-2xs font-mono-num">
                      {detailReveal.isUnlocked ? (
                        `Room ID: ${detailMatch.roomId}   |   Password: ${detailMatch.roomPassword}`
                      ) : isJoined ? (
                        <div className="space-y-0.5 font-sans">
                          <div className="text-slate-900 dark:text-white font-semibold">
                            Room ID &amp; Password reveal at {detailReveal.revealClock} (10 mins
                            before match)
                          </div>
                          <div className="text-xs font-mono-num text-emerald-600 dark:text-emerald-400">
                            Slot Confirmed · Opens in {detailReveal.countdownLabel}
                          </div>
                        </div>
                      ) : (
                        <div className="font-sans text-slate-700 dark:text-zinc-300">
                          Room ID &amp; Password will be revealed at{' '}
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {detailReveal.revealClock}
                          </span>{' '}
                          (10 mins before match)
                        </div>
                      )}
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          if (detailReveal.isUnlocked) {
                            copyText(
                              `${detailMatch.roomId} / ${detailMatch.roomPassword}`,
                              `play-${detailMatch.id}`,
                            );
                          } else if (!isJoined && !isFull && detailMatch.status === 'UPCOMING') {
                            openJoinFlow(detailMatch);
                          }
                        }}
                        className="px-4 py-2 rounded-md bg-[#7E7AF2] hover:bg-[#6d69e6] text-white text-xs font-bold uppercase tracking-wide shadow-xs transition-colors"
                      >
                        {copiedId === `play-${detailMatch.id}`
                          ? 'ROOM COPIED'
                          : isJoined && !detailReveal.isUnlocked
                            ? `REVEALS AT ${detailReveal.revealClock.toUpperCase()}`
                            : 'PLAY NOW'}
                      </button>
                    </div>
                  </section>
                );
              })()}

              {/* Price Details */}
              <section className="space-y-2">
                <h2 className="text-[15px] font-semibold text-[#56E698]">Price Details</h2>
                <div className="flex flex-wrap gap-2 text-sm font-mono-num">
                  <span className="inline-flex items-center px-2.5 py-1 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
                    Winning Prize : ₹{detailMatch.prizePool}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
                    Per Kill : ₹{detailMatch.perKill}
                  </span>
                </div>
              </section>

              {/* About this Match + Full Extracted Rules (Screenshots 1, 2, 3, 4) */}
              <section className="space-y-3.5 pt-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[15px] font-semibold text-[#56E698]">About this Match</h2>
                    <p className="text-sm text-slate-800 dark:text-zinc-200 mt-1">
                      About this Match
                    </p>
                  </div>

                  {/* Floating YouTube Redeem Code badge button matching Screenshot 4 */}
                  <button
                    type="button"
                    onClick={() => setSubscribeNotice((v) => !v)}
                    aria-label="Subscribe for Sunday Redeem Code"
                    className="w-11 h-11 rounded-full bg-zinc-700/80 border-2 border-zinc-400 flex items-center justify-center shadow-md shrink-0 hover:scale-105 transition-transform"
                  >
                    <span className="w-7 h-5 rounded bg-red-600 flex items-center justify-center">
                      <span className="ml-0.5 w-0 h-0 border-y-[4px] border-y-transparent border-l-[7px] border-l-white" />
                    </span>
                  </button>
                </div>

                {subscribeNotice && (
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-200">
                    Weekly Sunday Redeem Codes are shared inside SkillBattle Announcements &amp; Official Channel every Sunday at 12:00 PM.
                  </div>
                )}

                <div className="space-y-4 pt-1 text-slate-900 dark:text-zinc-100">
                  <h3 className="text-[22px] leading-snug font-medium uppercase tracking-tight">
                    SKILLBATTLE TOURNAMENT RULES &amp; REGULATIONS
                  </h3>

                  <button
                    type="button"
                    onClick={() => setSubscribeNotice(true)}
                    className="text-left text-sm font-medium underline underline-offset-2 text-slate-900 dark:text-white"
                  >
                    SUBSCRIBE FOR FREE REDEEM CODE EVERY SUNDAY
                  </button>

                  <p className="text-lg font-normal text-slate-900 dark:text-zinc-100 pt-1">
                    Horses , Double Vector Gun &amp; M79 Gun BAN
                  </p>

                  <div className="border-t-2 border-dashed border-slate-500/70 my-2" />

                  <div className="space-y-4 text-[14px] leading-relaxed">
                    <p className="font-medium text-slate-900 dark:text-white">
                      Joining Instructions :- ( RECORDING IS COMPULSORY FROM ROOM JOINING TO WHEN
                      ROOM STARTS ) = IF NOT PROVIDED = DIRECT BAN / NO EXCUSE
                    </p>

                    <ul className="space-y-3.5 text-slate-800 dark:text-zinc-200">
                      <li>
                        • Enter Account Name: Please enter your FF MAX account name; no changes will
                        be allowed.
                      </li>
                      <li>
                        • Verify Account Name: Ensure your FF MAX account name matches your
                        registered name.
                      </li>
                      <li>
                        • Match Room ID &amp; Password: The match room ID and password will be sent
                        10 minutes before the match.
                      </li>
                      <li>• Refund Policy: No refunds for missed matches.</li>
                    </ul>
                  </div>

                  <div className="space-y-3 pt-1">
                    <h4 className="text-base font-medium text-slate-900 dark:text-white">
                      Eligibility Rules
                    </h4>
                    <ul className="space-y-3 text-[14px] text-slate-800 dark:text-zinc-200">
                      <li>• Level Requirement: Level 40+ ID holders are eligible.</li>
                      <li>• Headshot Rate: BR career headshot rate must not exceed 70%.</li>
                      <li>
                        • Device Requirement: Play on Android, iOS, tablets, or phones (emulators
                        not allowed).
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3 pt-1">
                    <h4 className="text-base font-medium text-slate-900 dark:text-white">
                      Prohibited Behavior
                    </h4>
                    <ul className="space-y-3 text-[14px] text-slate-800 dark:text-zinc-200">
                      <li>• Aimbot</li>
                      <li>• No recoil</li>
                      <li>• Hacking</li>
                      <li>• Game modifying tools</li>
                      <li>• Glitches</li>
                      <li>• Bugs</li>
                      <li>• Teaming up with opponents</li>
                      <li>• Inviting unregistered players</li>
                    </ul>
                  </div>

                  <div className="space-y-3 pt-1">
                    <h4 className="text-base font-medium text-slate-900 dark:text-white">
                      Gameplay Requirements
                    </h4>
                    <ul className="space-y-3 text-[14px] text-slate-800 dark:text-zinc-200">
                      <li>
                        • Mandatory Match Recording: Record matches; failure to comply will result
                        in penalties.
                      </li>
                      <li>
                        • Prize Adjustment: Prizes adjusted if tournament slots are not full.
                      </li>
                      <li>
                        • Report Issues: Report concerns to{' '}
                        <button
                          type="button"
                          onClick={() => onOpenSupport?.()}
                          className="underline font-semibold text-slate-900 dark:text-white uppercase"
                        >
                          CUSTOMER SUPPORT
                        </button>{' '}
                        within 1 hour of match end.
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3 pt-1 pb-4">
                    <h4 className="text-xl font-mono font-normal text-slate-900 dark:text-white">
                      Important Notes
                    </h4>
                    <ul className="space-y-3 text-[14px] text-slate-800 dark:text-zinc-200">
                      <li>
                        • Blacklisted Game-ID: Blacklisted Game-IDs require recording proofs for
                        prizes.
                      </li>
                      <li>• Screen Recording: Record screens when joining Custom Rooms.</li>
                      <li>
                        • SkillBattle Rights: SkillBattle reserves the right to modify prizes and
                        rules.
                      </li>
                    </ul>
                  </div>
                </div>
              </section>
            </main>
          ) : (
            /* JOINED MEMBER TAB */
            <main className="px-3.5 py-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-zinc-400 px-1">
                <span>Joined Slots</span>
                <span className="font-mono-num">
                  {detailMatch.filledSlots}/{detailMatch.maxSlots} Players
                </span>
              </div>

              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="bg-[#343A46] text-white grid grid-cols-12 px-3 py-2.5 text-xs font-semibold">
                  <div className="col-span-3">Position</div>
                  <div className="col-span-3">Team</div>
                  <div className="col-span-6">Player Name</div>
                </div>

                {detailTakenSlots.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500 dark:text-zinc-400">
                    No players joined yet. Be the first to pick a slot!
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {detailTakenSlots
                      .slice()
                      .sort((a, b) => a - b)
                      .map((slotPos) => {
                        const member = detailMatch.joinedUsers.find(
                          (u) => u.position === slotPos,
                        );
                        const teamNum =
                          detailMatch.teamType === 'Squad' || detailMatch.teamType === '4v4'
                            ? Math.ceil(slotPos / 4)
                            : detailMatch.teamType === 'Duo' || detailMatch.teamType === '2v2'
                              ? Math.ceil(slotPos / 2)
                              : 1;
                        return (
                          <div
                            key={slotPos}
                            className="grid grid-cols-12 items-center px-3 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-zinc-200"
                          >
                            <div className="col-span-3 font-mono-num font-bold">#{slotPos}</div>
                            <div className="col-span-3">Team {teamNum}</div>
                            <div className="col-span-6 font-medium truncate">
                              {member ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                  {member.inGameName}
                                </span>
                              ) : (
                                <span className="text-slate-500 dark:text-zinc-400">
                                  Verified Player #{slotPos}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </main>
          )}
        </div>

        {/* Fixed Bottom Bar: MATCH FULL or JOIN NOW */}
        <div className="fixed bottom-0 inset-x-0 z-30 bg-[#23252C] border-t border-zinc-800">
          <button
            type="button"
            disabled={isJoined || isFull || detailMatch.status !== 'UPCOMING'}
            onClick={() => openJoinFlow(detailMatch)}
            className="w-full max-w-3xl mx-auto h-12 flex items-center justify-center gap-2 text-white font-semibold text-sm uppercase tracking-wide disabled:opacity-95"
          >
            {isJoined ? (
              <span>JOINED (POSITION #{myJoinEntry?.position || '—'})</span>
            ) : isFull || detailMatch.status !== 'UPCOMING' ? (
              <span>MATCH FULL</span>
            ) : (
              <>
                <span>JOIN NOW</span>
                <GoldCoinIcon className="w-4 h-4" />
                <span className="font-mono-num">{detailMatch.entryFee}</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // CATEGORY GRID & CATEGORY MATCH LIST (Screenshot 3)
  // ============================================================================
  return (
    <div className="min-h-screen bg-[#EDEDEE] dark:bg-zinc-950 pb-24">
      {!selectedCategory ? (
        /* Category Grid Header */
        <header className="sticky top-0 z-30 bg-white dark:bg-zinc-900 rounded-b-2xl shadow-xs px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center text-slate-900 dark:text-white"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
              {mode === 'contests' ? 'Contests' : 'Tournaments'}
            </h1>
          </div>

          <button
            type="button"
            onClick={onOpenWallet}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16181D] text-white text-xs font-bold font-mono-num"
          >
            <GoldCoinIcon className="w-4 h-4" />
            <span>{user.balance.toFixed(1)}</span>
          </button>
        </header>
      ) : (
        /* Black Match List Header + ONGOING | UPCOMING | RESULTS tabs (Screenshot 3) */
        <header className="sticky top-0 z-30 bg-[#0B0C10] text-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(null);
                  setError(null);
                  setSuccessNote(null);
                }}
                className="min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center text-white"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-semibold capitalize">
                {selectedCategory.title.toLowerCase()}
              </h1>
            </div>

            <button
              type="button"
              onClick={onOpenWallet}
              className="inline-flex items-center gap-1.5 bg-white text-zinc-900 px-2.5 py-1 rounded-md text-xs font-extrabold font-mono-num"
            >
              <GoldCoinIcon className="w-4 h-4" />
              <span>{user.balance.toFixed(1)}</span>
            </button>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-3 text-center">
            {(['ONGOING', 'UPCOMING', 'RESULTS'] as MatchStatus[]).map((tab) => {
              const active = matchTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setMatchTab(tab)}
                  className={`py-2.5 text-xs font-bold tracking-wider transition-colors border-b-2 ${
                    active
                      ? 'text-white border-white'
                      : 'text-zinc-500 border-transparent hover:text-zinc-300'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </header>
      )}

      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 py-4">
        {!selectedCategory ? (
          /* 3-column mobile / 5-column desktop grid */
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessNote(null);
                  setMatchTab('UPCOMING');
                  setSelectedCategory(cat);
                }}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-900 shadow-sm border border-black/10 dark:border-zinc-800 text-left hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                <img
                  src={getCategoryImage(cat)}
                  alt={cat.title}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className={`absolute inset-0 bg-gradient-to-b ${cat.accentGradient} opacity-45`} />

                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[8px] sm:text-[9px] font-extrabold tracking-wide text-white uppercase">
                  {cat.badgeLabel}
                </div>

                <div className="absolute inset-x-0 bottom-0 bg-black/95 py-1.5 px-1.5 text-center">
                  <span className="block text-[10px] sm:text-xs font-extrabold tracking-tight text-white uppercase truncate">
                    {cat.title}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* Category Match Lobby */
          <div className="space-y-4">
            {selectedCategory.isPrivateContest && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-200 dark:border-zinc-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Private Custom Contests
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Create a friend room or enter an invite code to join directly.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreatePvt((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#16181D] text-white text-xs font-bold"
                  >
                    <Plus className="w-4 h-4" />
                    Create Room
                  </button>
                </div>

                <form onSubmit={handleLookupCode} className="flex gap-2">
                  <input
                    type="text"
                    value={inviteCodeInput}
                    onChange={(e) => setInviteCodeInput(e.target.value)}
                    placeholder="Enter Invite Code (e.g. SC-PVT99)"
                    className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm text-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase"
                  >
                    Find Room
                  </button>
                </form>

                {showCreatePvt && (
                  <form
                    onSubmit={handleCreatePrivate}
                    className="pt-3 border-t border-slate-100 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-4 gap-3"
                  >
                    <input
                      type="text"
                      value={pvtTitle}
                      onChange={(e) => setPvtTitle(e.target.value)}
                      placeholder="Room Title"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                    />
                    <select
                      value={pvtTeam}
                      onChange={(e) => setPvtTeam(e.target.value as '1v1' | '2v2' | '4v4')}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                    >
                      <option value="1v1">1v1 Duel</option>
                      <option value="2v2">2v2 Duo</option>
                      <option value="4v4">4v4 Squad</option>
                    </select>
                    <input
                      type="number"
                      min={0}
                      max={1000}
                      value={pvtFee}
                      onChange={(e) => setPvtFee(e.target.value)}
                      placeholder="Entry ₹"
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold uppercase"
                    >
                      {submitting ? 'Creating...' : 'Launch Room'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {successNote && (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200 font-medium">
                {successNote}
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-4 py-3 text-sm text-rose-700 dark:text-rose-200">
                {error}
              </div>
            )}

            {tabMatches.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-10 text-center text-sm text-slate-500 dark:text-zinc-400 shadow-xs">
                No {matchTab.toLowerCase()} matches in {selectedCategory.title} right now.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tabMatches.map((m) => {
                  const isJoined = m.joinedUsers.some((j) => j.userId === user.id);
                  const isFull = m.filledSlots >= m.maxSlots;
                  const fillPercent = Math.min(100, Math.round((m.filledSlots / m.maxSlots) * 100));
                  const isPrizeOpen = expandedPrizeId === m.id;
                  const datePart = m.dateLabel || m.startTime.split('·')[0]?.trim() || m.startTime;
                  const timePart = m.timeLabel || m.startTime.split('·')[1]?.trim() || '';

                  return (
                    <article
                      key={m.id}
                      className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-zinc-800 shadow-sm flex flex-col justify-between"
                    >
                      {/* Top Tournament Poster Banner — Tap to open Match Detail */}
                      <button
                        type="button"
                        onClick={() => openMatchDetail(m)}
                        className="w-full block text-left cursor-pointer focus:outline-none"
                        aria-label={`View rules and details for ${m.title}`}
                      >
                        {renderPosterBanner(m, selectedCategory)}
                      </button>

                      {/* Card Body */}
                      <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-2.5">
                          {/* Coral & Mint Badges */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2.5 py-0.5 rounded-md bg-[#F37676] text-white text-xs font-bold">
                              {m.teamType}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md bg-[#56E698] text-white text-xs font-semibold truncate max-w-[230px]">
                              {m.mode}
                            </span>
                            {m.inviteCode && (
                              <button
                                type="button"
                                onClick={() => copyText(m.inviteCode!, `inv-${m.id}`)}
                                className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[11px] font-mono-num font-bold text-slate-700 dark:text-zinc-200"
                              >
                                {copiedId === `inv-${m.id}` ? 'Copied' : m.inviteCode}
                                <Copy className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {/* Bomb Icon + Title (also opens Match Detail on tap) */}
                          <button
                            type="button"
                            onClick={() => openMatchDetail(m)}
                            className="flex items-start gap-2 text-left w-full"
                          >
                            <span className="w-6 h-6 rounded-full bg-zinc-900 dark:bg-zinc-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                              <Bomb className="w-3.5 h-3.5" />
                            </span>
                            <h3 className="text-[15px] font-medium text-slate-900 dark:text-white leading-snug">
                              {m.title}
                            </h3>
                          </button>

                          {/* 3-Column Date | PRIZE POOL | PER KILL */}
                          <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-zinc-800 pt-1 text-center items-center">
                            <div className="pr-2 text-xs font-semibold text-[#EB6A6A] leading-tight">
                              <div>{datePart}</div>
                              {timePart && <div className="mt-0.5">{timePart}</div>}
                            </div>

                            <button
                              type="button"
                              onClick={() => setExpandedPrizeId(isPrizeOpen ? null : m.id)}
                              className="px-1 flex items-center justify-center gap-1 text-center"
                            >
                              <div>
                                <div className="text-[11px] font-bold text-[#56E698] uppercase">
                                  PRIZE POOL
                                </div>
                                <div className="text-sm font-bold font-mono-num text-[#56E698]">
                                  (₹){m.prizePool}
                                </div>
                              </div>
                              <ChevronDown
                                className={`w-4 h-4 text-slate-600 dark:text-zinc-400 transition-transform ${
                                  isPrizeOpen ? 'rotate-180' : ''
                                }`}
                              />
                            </button>

                            <div className="pl-2">
                              <div className="text-[11px] font-bold text-[#3B82F6] uppercase">
                                PER KILL
                              </div>
                              <div className="text-sm font-bold font-mono-num text-[#3B82F6]">
                                (₹){m.perKill}
                              </div>
                            </div>
                          </div>

                          {isPrizeOpen && (
                            <div className="rounded-lg bg-slate-50 dark:bg-zinc-800/70 px-3 py-2 text-xs text-slate-600 dark:text-zinc-300 flex items-center justify-between">
                              <span>1st Booyah: ₹{m.rank1Prize ?? Math.round(m.prizePool * 0.5)}</span>
                              <span>2nd: ₹{m.rank2Prize ?? Math.round(m.prizePool * 0.3)}</span>
                              <span>3rd: ₹{m.rank3Prize ?? Math.round(m.prizePool * 0.2)}</span>
                            </div>
                          )}
                        </div>

                        {/* Room details if joined */}
                        {isJoined &&
                          (() => {
                            const cardReveal = getRoomRevealInfo(m, nowMs, true);
                            return (
                              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 p-2.5 space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                  <span className="flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Slot Confirmed
                                  </span>
                                  {cardReveal.isUnlocked ? (
                                    <button
                                      type="button"
                                      onClick={() => copyText(`${m.roomId} / ${m.roomPassword}`, m.id)}
                                      className="underline"
                                    >
                                      {copiedId === m.id ? 'Copied!' : 'Copy Room'}
                                    </button>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 font-mono-num text-[11px]">
                                      <Clock className="w-3 h-3" />
                                      {cardReveal.countdownLabel}
                                    </span>
                                  )}
                                </div>
                                {cardReveal.isUnlocked ? (
                                  <div className="flex items-center justify-between text-xs font-mono-num text-slate-800 dark:text-zinc-200">
                                    <span className="flex items-center gap-1">
                                      <KeyRound className="w-3.5 h-3.5" /> ID: {m.roomId}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Lock className="w-3.5 h-3.5" /> Pass: {m.roomPassword}
                                    </span>
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-emerald-800 dark:text-emerald-200/90">
                                    Room ID &amp; Pass reveal at{' '}
                                    <strong className="font-mono-num">{cardReveal.revealClock}</strong>{' '}
                                    (10 mins before match)
                                  </p>
                                )}
                              </div>
                            );
                          })()}

                        {m.status === 'RESULTS' ? (
                          <div className="space-y-2 pt-1">
                            {watchNoticeId === m.id && (
                              <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 px-3 py-2 text-xs text-indigo-800 dark:text-indigo-200 flex items-center justify-between gap-2">
                                <span>
                                  Match #{m.title.match(/#(\d+)/)?.[1] || m.id} Winner:{' '}
                                  <strong>{m.winnerUsername || m.results?.[0]?.playerName || 'Verified'}</strong>{' '}
                                  · Highlight replay ready on SkillBattle TV.
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openMatchDetail(m)}
                                  className="underline font-bold shrink-0"
                                >
                                  Scoreboard
                                </button>
                              </div>
                            )}

                            {/* 2 Side-by-side lavender buttons matching Screenshot 2 */}
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  setWatchNoticeId((prev) => (prev === m.id ? null : m.id))
                                }
                                className="h-10 rounded-md bg-[#7E7AF2] hover:bg-[#6d69e6] text-white text-xs sm:text-sm font-semibold uppercase tracking-wide shadow-xs transition-colors"
                              >
                                WATCH
                              </button>
                              <button
                                type="button"
                                onClick={() => openMatchDetail(m)}
                                className="h-10 rounded-md bg-[#7E7AF2] hover:bg-[#6d69e6] text-white text-xs sm:text-sm font-semibold uppercase tracking-wide shadow-xs inline-flex items-center justify-center gap-1.5 font-mono-num transition-colors"
                              >
                                <GoldCoinIcon className="w-4 h-4" />
                                <span>
                                  {m.entryFee} {isJoined ? 'JOINED' : 'NOT JOINED'}
                                </span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Bottom Progress + Black Action Pill matching Screenshot 3 */
                          <div className="flex items-center justify-between gap-3 pt-1">
                            <div className="flex-1 space-y-1">
                              <div className="text-xs font-mono-num text-slate-800 dark:text-zinc-200">
                                {m.filledSlots}/{m.maxSlots}
                              </div>
                              <div className="h-1 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                                <div
                                  className="h-full bg-[#6C5CE7] rounded-full transition-all"
                                  style={{ width: `${fillPercent}%` }}
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={isJoined || isFull || m.status !== 'UPCOMING'}
                              onClick={() => openJoinFlow(m)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B0C10] hover:bg-zinc-800 disabled:bg-[#0B0C10] disabled:opacity-90 text-white text-xs font-extrabold font-mono-num shrink-0 transition-colors"
                            >
                              <GoldCoinIcon className="w-4 h-4" />
                              <span>
                                {isJoined
                                  ? 'JOINED'
                                  : isFull || m.status !== 'UPCOMING'
                                    ? `${m.entryFee} MATCH FULL`
                                    : `${m.entryFee} JOIN`}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
