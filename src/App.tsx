import React, { useEffect, useMemo, useState } from 'react';
import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signOut,
  updatePassword,
  type User as FirebaseUser,
} from 'firebase/auth';
import { ShieldAlert, User, Wrench } from 'lucide-react';
import { AboutView } from './components/AboutView';
import { AccountView } from './components/AccountView';
import { ActionModals } from './components/ActionModals';
import { AnnouncementView } from './components/AnnouncementView';
import {
  AuthScreens,
  consumePendingRegistration,
  EmailVerificationGate,
} from './components/AuthScreens';
import { GoldCoinIcon, SkillClashEmblem } from './components/BrandIcons';
import { ChooseLanguageView } from './components/ChooseLanguageView';
import { CustomerSupportView } from './components/CustomerSupportView';
import { HomePlayView, type ModalType } from './components/HomePlayView';
import { MoreView } from './components/MoreView';
import { MyMatchesView } from './components/MyMatchesView';
import { MyProfileView } from './components/MyProfileView';
import { MyStatisticsView } from './components/MyStatisticsView';
import { MyWalletView } from './components/MyWalletView';
import { ReferAndEarnView } from './components/ReferAndEarnView';
import { TermsView } from './components/TermsView';
import { TopPlayersView } from './components/TopPlayersView';
import { TournamentsView } from './components/TournamentsView';
import { auth, testConnection } from './firebase';
import {
  buildMatchesState,
  createPrivateContestInFirestore,
  createSupportTicketInFirestore,
  DEFAULT_APP_SETTINGS,
  DEFAULT_CATEGORIES,
  ensureUserProfile,
  findPrivateContestByCodeInFirestore,
  joinMatchInFirestore,
  submitFeedbackInFirestore,
  submitLuckyDrawSpinInFirestore,
  submitPendingDepositUtr,
  submitPromoInFirestore,
  submitWithdrawalInFirestore,
  subscribeAdminStatus,
  subscribeAnnouncements,
  subscribeAppSettings,
  subscribeBanners,
  subscribeCategories,
  subscribeFeedbacks,
  subscribeLeaderboard,
  subscribeMatchesRaw,
  subscribeMatchResultsRaw,
  subscribeNotifications,
  subscribeParticipantsRaw,
  subscribePublicWithdrawals,
  subscribeRoomSecret,
  subscribeUserProfile,
  subscribeUserTickets,
  subscribeUserTransactions,
  updateUserProfileInFirestore,
  type RawMatchParticipant,
  type RawMatchResult,
  type RawRoomSecret,
} from './services/firestoreService';
import type {
  AnnouncementItem,
  AppControlSettings,
  AppLanguage,
  AppNotification,
  BannerItem,
  FeedbackEntry,
  LeaderboardEntry,
  SupportTicket,
  TournamentCategory,
  TournamentMatch,
  UserProfile,
  WalletTransaction,
  WithdrawalTicker,
} from './types';

type ActiveRoute =
  | 'more'
  | 'play'
  | 'account'
  | 'tournaments'
  | 'contests'
  | 'my_matches'
  | 'wallet'
  | 'profile'
  | 'statistics'
  | 'leaders'
  | 'support'
  | 'language'
  | 'refer'
  | 'about'
  | 'terms'
  | 'announcements';

const SUB_ROUTES: ActiveRoute[] = [
  'wallet',
  'profile',
  'statistics',
  'leaders',
  'support',
  'language',
  'refer',
  'about',
  'terms',
  'announcements',
];

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  const [route, setRoute] = useState<ActiveRoute>('play');
  const [returnRoute, setReturnRoute] = useState<ActiveRoute>('play');
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const [appSettings, setAppSettings] = useState<AppControlSettings>(DEFAULT_APP_SETTINGS);
  const [categories, setCategories] = useState<TournamentCategory[]>(DEFAULT_CATEGORIES);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([]);
  const [recentWithdrawals, setRecentWithdrawals] = useState<WithdrawalTicker[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  const [rawMatches, setRawMatches] = useState<{ id: string; data: Record<string, unknown> }[]>([]);
  const [rawParticipants, setRawParticipants] = useState<RawMatchParticipant[]>([]);
  const [rawResults, setRawResults] = useState<RawMatchResult[]>([]);
  const [secretsByMatchId, setSecretsByMatchId] = useState<Record<string, RawRoomSecret | null>>({});

  // Initial Firestore connectivity verification
  useEffect(() => {
    void testConnection();
  }, []);

  // Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setFirebaseUser(nextUser);
      setAuthReady(true);
      if (!nextUser) {
        setUser(null);
        setIsAdmin(false);
        setTransactions([]);
        setTickets([]);
        setRawMatches([]);
        setRawParticipants([]);
        setRawResults([]);
        setSecretsByMatchId({});
        setActiveModal(null);
        setRoute('play');
        setReturnRoute('play');
        document.documentElement.classList.remove('dark');
      }
    });
    return () => unsub();
  }, []);

  // Platform settings listener (available when signed in)
  useEffect(() => {
    if (!firebaseUser) return;
    return subscribeAppSettings(setAppSettings);
  }, [firebaseUser]);

  // Verified user profile + real-time Firestore collections sync
  useEffect(() => {
    if (!firebaseUser || !firebaseUser.emailVerified) return;

    let cancelled = false;
    const unsubs: (() => void)[] = [];
    setBootError(null);

    const startSubscriptions = async () => {
      try {
        const regMeta = consumePendingRegistration(firebaseUser.uid);
        const ensured = await ensureUserProfile(firebaseUser, regMeta);
        if (cancelled) return;
        setUser(ensured);

        unsubs.push(
          subscribeUserProfile(
            firebaseUser.uid,
            firebaseUser,
            (profile) => setUser(profile),
            (err) => setBootError(err.message),
          ),
          subscribeAdminStatus(firebaseUser.uid, firebaseUser.email, setIsAdmin),
          subscribeCategories(setCategories),
          subscribeBanners(setBanners),
          subscribeAnnouncements(setAnnouncements),
          subscribeNotifications(firebaseUser.uid, setNotifications),
          subscribeLeaderboard(setLeaderboard),
          subscribePublicWithdrawals(setRecentWithdrawals),
          subscribeFeedbacks(setFeedbacks),
          subscribeUserTransactions(firebaseUser.uid, setTransactions),
          subscribeUserTickets(firebaseUser.uid, setTickets),
          subscribeMatchesRaw(setRawMatches),
          subscribeParticipantsRaw(setRawParticipants),
          subscribeMatchResultsRaw(setRawResults),
        );
      } catch (err) {
        if (!cancelled) {
          setBootError(
            err instanceof Error
              ? err.message
              : 'Unable to sync your SkillBattle profile. Please retry.',
          );
        }
      }
    };

    void startSubscriptions();

    return () => {
      cancelled = true;
      unsubs.forEach((fn) => fn());
    };
  }, [firebaseUser, firebaseUser?.emailVerified]);

  // Protected room secrets listeners ONLY for matches the user has joined, hosts, or administers
  const currentUid = firebaseUser?.emailVerified ? firebaseUser.uid : '';
  const secretWatchMatchIds = useMemo(() => {
    if (!currentUid) return [] as string[];
    const joinedIds = new Set(
      rawParticipants.filter((p) => p.userId === currentUid).map((p) => p.matchId),
    );
    const hostedIds = rawMatches
      .filter((m) => m.data.hostUid === currentUid || isAdmin)
      .map((m) => m.id);
    hostedIds.forEach((id) => joinedIds.add(id));
    return Array.from(joinedIds).sort();
  }, [currentUid, rawParticipants, rawMatches, isAdmin]);

  useEffect(() => {
    if (secretWatchMatchIds.length === 0) {
      setSecretsByMatchId({});
      return;
    }
    const unsubs = secretWatchMatchIds.map((matchId) =>
      subscribeRoomSecret(matchId, (secret) => {
        setSecretsByMatchId((prev) => ({ ...prev, [matchId]: secret }));
      }),
    );
    return () => {
      unsubs.forEach((u) => u());
    };
  }, [secretWatchMatchIds]);

  const { matches, joinedMatches, matchStats } = useMemo(
    () =>
      buildMatchesState({
        rawMatches,
        participants: rawParticipants,
        results: rawResults,
        secretsByMatchId,
        categories,
        currentUserId: currentUid,
      }),
    [rawMatches, rawParticipants, rawResults, secretsByMatchId, categories, currentUid],
  );

  // Sync dark mode class
  useEffect(() => {
    if (user?.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user?.darkMode]);

  const openModalOrWallet = (m: ModalType) => {
    if (m === 'pvt_rules') {
      if (!SUB_ROUTES.includes(route)) {
        setReturnRoute(route);
      }
      setActiveModal(null);
      setRoute('announcements');
      return;
    }
    if (
      m === 'wallet' ||
      m === 'profile' ||
      m === 'statistics' ||
      m === 'leaders' ||
      m === 'support' ||
      m === 'language' ||
      m === 'refer' ||
      m === 'about' ||
      m === 'terms' ||
      m === 'announcements'
    ) {
      if (!SUB_ROUTES.includes(route)) {
        setReturnRoute(route);
      }
      setActiveModal(null);
      setRoute(m);
      return;
    }
    setActiveModal(m);
  };

  const handleLogout = async () => {
    await signOut(auth).catch(() => {});
    setSessionNotice(null);
  };

  const handleJoinMatch = async (
    matchId: string,
    inGameName: string,
    uid: string,
    position?: number,
  ) => {
    if (!user) return;
    await joinMatchInFirestore({ user, matchId, inGameName, uid, position });
  };

  const handleCreatePrivateContest = async (payload: {
    title: string;
    teamType: '1v1' | '2v2' | '4v4';
    entryFee: number;
    map: string;
  }): Promise<TournamentMatch | null> => {
    if (!user) return null;
    return createPrivateContestInFirestore({ user, ...payload });
  };

  const handleFindPrivateByCode = async (inviteCode: string): Promise<TournamentMatch | null> => {
    return findPrivateContestByCodeInFirestore(inviteCode, categories);
  };

  const handleDeposit = async (amount: number, method: string, utr?: string) => {
    if (!user) return;
    await submitPendingDepositUtr({
      userId: user.id,
      amount,
      method,
      utr: utr || '',
    });
  };

  const handleWithdraw = async (amount: number, upiId: string) => {
    if (!user) return;
    await submitWithdrawalInFirestore({
      user,
      amount,
      upiId,
      minWithdrawal: appSettings.minWithdrawal,
    });
  };

  const handleSpinLuckyDraw = async (): Promise<number> => {
    if (!user) return 0;
    return submitLuckyDrawSpinInFirestore(user);
  };

  const handleSubmitPromo = async (videoUrl: string, channelName: string) => {
    if (!user) return;
    await submitPromoInFirestore(user, videoUrl, channelName);
  };

  const handleSubmitFeedback = async (rating: number, comment: string) => {
    if (!user) return;
    await submitFeedbackInFirestore(user, rating, comment);
  };

  const handleCreateTicket = async (subject: string, message: string) => {
    if (!user) return;
    await createSupportTicketInFirestore(user, subject, message);
  };

  const handlePatchUser = async (patch: {
    firstName?: string;
    lastName?: string;
    countryCode?: string;
    mobile?: string;
    email?: string;
    dateOfBirth?: string;
    gender?: 'Male' | 'Female';
    avatarPreset?: string;
    avatarUrl?: string;
    darkMode?: boolean;
    language?: AppLanguage;
    savedGameName?: string;
    savedGameUid?: string;
  }) => {
    if (!user) return;
    await updateUserProfileInFirestore(user.id, patch);
  };

  const handleChangePassword = async (oldPassword: string, newPassword: string) => {
    const fbUser = auth.currentUser;
    if (!fbUser || !fbUser.email) {
      throw new Error('No active user session found.');
    }
    const hasPasswordProvider = fbUser.providerData.some((p) => p.providerId === 'password');
    if (!hasPasswordProvider) {
      throw new Error(
        'Your account uses Google Sign-In. Manage your password in your Google account settings.',
      );
    }
    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }
    const cred = EmailAuthProvider.credential(fbUser.email, oldPassword);
    await reauthenticateWithCredential(fbUser, cred);
    await updatePassword(fbUser, newPassword);
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#0B0C10] text-white flex flex-col items-center justify-center gap-3">
        <div className="w-16 h-16 rounded-full bg-black border border-zinc-800 overflow-hidden flex items-center justify-center shadow-lg">
          <SkillClashEmblem className="w-full h-full" />
        </div>
        <span className="font-display font-extrabold text-xl tracking-tight">SkillBattle</span>
        <span className="text-xs text-zinc-400">Connecting to SkillBattle Arena...</span>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <AuthScreens
        initialMode="login"
        sessionNotice={sessionNotice}
        registrationsEnabled={appSettings.registrationsEnabled}
      />
    );
  }

  if (!firebaseUser.emailVerified) {
    return (
      <EmailVerificationGate
        firebaseUser={firebaseUser}
        onVerified={(refreshed) => {
          setFirebaseUser({ ...refreshed } as FirebaseUser);
        }}
      />
    );
  }

  if (bootError) {
    return (
      <div className="min-h-screen bg-[#0B0C10] text-white flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-black border border-zinc-800 overflow-hidden flex items-center justify-center shadow-lg">
          <SkillClashEmblem className="w-full h-full" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h1 className="font-display font-extrabold text-xl tracking-tight">SkillBattle</h1>
          <p className="text-sm text-zinc-400">{bootError}</p>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 h-11 rounded-md bg-[#54E397] hover:bg-[#43d688] text-zinc-950 font-bold text-sm"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="px-5 h-11 rounded-md bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0C10] text-white flex flex-col items-center justify-center gap-3">
        <div className="w-16 h-16 rounded-full bg-black border border-zinc-800 overflow-hidden flex items-center justify-center shadow-lg">
          <SkillClashEmblem className="w-full h-full" />
        </div>
        <span className="font-display font-extrabold text-xl tracking-tight">SkillBattle</span>
        <span className="text-xs text-zinc-400">Syncing player profile...</span>
      </div>
    );
  }

  if (user.status === 'Banned' && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#0B0C10] text-white flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h1 className="font-display font-extrabold text-xl tracking-tight">Account Suspended</h1>
          <p className="text-sm text-zinc-400">
            Your SkillBattle account ({user.username}) has been flagged for FairPlay policy review.
            Contact Customer Support if you believe this is an error.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="px-5 h-11 rounded-md bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm"
        >
          Logout
        </button>
      </div>
    );
  }

  if (appSettings.maintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#0B0C10] text-white flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
          <Wrench className="w-7 h-7" />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h1 className="font-display font-extrabold text-xl tracking-tight">
            Scheduled Maintenance
          </h1>
          <p className="text-sm text-zinc-400">
            SkillBattle servers are currently upgrading for smoother tournaments. Please check back shortly!
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="px-5 h-11 rounded-md bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm"
        >
          Logout
        </button>
      </div>
    );
  }

  const showBottomNav = route === 'play' || route === 'more' || route === 'account';

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
      {/* Desktop 3-Zone Top Bar */}
      <header className="hidden lg:block sticky top-0 z-40 bg-[#0B0C10] text-white border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => setRoute('play')}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0"
          >
            <span className="w-9 h-9 rounded-full bg-black border border-zinc-700 overflow-hidden flex items-center justify-center">
              <SkillClashEmblem className="w-full h-full" />
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight">SkillBattle</span>
          </button>

          <nav className="flex items-center gap-7 text-sm font-medium">
            {[
              { id: 'play', label: 'Play' },
              { id: 'tournaments', label: 'Tournaments' },
              { id: 'contests', label: 'Contests' },
              { id: 'my_matches', label: 'My Matches' },
              { id: 'more', label: 'More' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRoute(item.id as ActiveRoute)}
                className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                  route === item.id
                    ? 'text-white border-emerald-400 font-semibold'
                    : 'text-zinc-400 border-transparent hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setRoute('account')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                route === 'account'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              {user.username}
            </button>
            <button
              type="button"
              onClick={() => openModalOrWallet('wallet')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#54E397] hover:bg-[#43d688] text-zinc-950 font-extrabold text-xs font-mono-num whitespace-nowrap shrink-0 transition-colors"
            >
              <span>Wallet ₹{user.balance.toFixed(2)}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Views */}
      {route === 'play' && (
        <HomePlayView
          user={user}
          joinedMatches={joinedMatches}
          feedbacks={feedbacks}
          recentWithdrawals={recentWithdrawals}
          announcements={announcements}
          banners={banners}
          notifications={notifications}
          onOpenTournaments={() => setRoute('tournaments')}
          onOpenContests={() => setRoute('contests')}
          onOpenMyMatches={() => setRoute('my_matches')}
          onOpenModal={openModalOrWallet}
        />
      )}

      {(route === 'tournaments' || route === 'contests') && (
        <TournamentsView
          mode={route}
          categories={categories}
          matches={matches}
          user={user}
          onBack={() => setRoute('play')}
          onJoinMatch={handleJoinMatch}
          onCreatePrivateContest={handleCreatePrivateContest}
          onFindPrivateByCode={handleFindPrivateByCode}
          onOpenWallet={() => openModalOrWallet('wallet')}
          onOpenSupport={() => openModalOrWallet('support')}
        />
      )}

      {route === 'my_matches' && (
        <MyMatchesView
          user={user}
          joinedMatches={joinedMatches}
          onBack={() => setRoute('play')}
          onExploreTournaments={() => setRoute('tournaments')}
          onOpenWallet={() => openModalOrWallet('wallet')}
        />
      )}

      {route === 'wallet' && (
        <MyWalletView
          user={user}
          transactions={transactions}
          onBack={() => setRoute(SUB_ROUTES.includes(returnRoute) ? 'play' : returnRoute)}
          onDeposit={handleDeposit}
          onWithdraw={handleWithdraw}
          onOpenSupport={() => openModalOrWallet('support')}
          minWithdrawal={appSettings.minWithdrawal}
          merchantUpiId={appSettings.merchantUpiId}
          upiLabel={appSettings.upiLabel}
        />
      )}

      {route === 'profile' && (
        <MyProfileView
          user={user}
          onBack={() => setRoute(SUB_ROUTES.includes(returnRoute) ? 'account' : returnRoute)}
          onUpdateProfile={(patch) => handlePatchUser(patch)}
          onChangePassword={handleChangePassword}
        />
      )}

      {route === 'statistics' && (
        <MyStatisticsView
          stats={matchStats}
          onBack={() => setRoute(SUB_ROUTES.includes(returnRoute) ? 'account' : returnRoute)}
        />
      )}

      {route === 'leaders' && (
        <TopPlayersView
          user={user}
          leaderboard={leaderboard}
          onBack={() => setRoute(SUB_ROUTES.includes(returnRoute) ? 'play' : returnRoute)}
        />
      )}

      {route === 'support' && (
        <CustomerSupportView
          onBack={() => setRoute(SUB_ROUTES.includes(returnRoute) ? 'account' : returnRoute)}
          tickets={tickets}
          onCreateTicket={handleCreateTicket}
          supportEmail={appSettings.supportEmail}
          supportTelegram={appSettings.supportTelegram}
        />
      )}

      {route === 'language' && (
        <ChooseLanguageView
          currentLanguage={user.language}
          onBack={() => setRoute(SUB_ROUTES.includes(returnRoute) ? 'account' : returnRoute)}
          onContinue={async (language) => {
            await handlePatchUser({ language });
          }}
        />
      )}

      {route === 'refer' && (
        <ReferAndEarnView
          user={user}
          onBack={() => setRoute(SUB_ROUTES.includes(returnRoute) ? 'play' : returnRoute)}
        />
      )}

      {route === 'about' && (
        <AboutView
          onBack={() => setRoute(SUB_ROUTES.includes(returnRoute) ? 'account' : returnRoute)}
        />
      )}

      {route === 'terms' && (
        <TermsView
          onBack={() => setRoute(SUB_ROUTES.includes(returnRoute) ? 'account' : returnRoute)}
        />
      )}

      {route === 'announcements' && (
        <AnnouncementView
          onBack={() => setRoute(SUB_ROUTES.includes(returnRoute) ? 'account' : returnRoute)}
          announcements={announcements}
          notifications={notifications}
        />
      )}

      {route === 'more' && <MoreView user={user} onOpenModal={openModalOrWallet} />}

      {route === 'account' && (
        <AccountView
          user={user}
          onToggleDarkMode={(next) => {
            void handlePatchUser({ darkMode: next }).catch(() => {});
          }}
          onOpenMyMatches={() => setRoute('my_matches')}
          onOpenModal={openModalOrWallet}
          onLogout={handleLogout}
        />
      )}

      {/* Mobile Bottom Tab Bar */}
      {showBottomNav && (
        <nav
          aria-label="Primary mobile navigation"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0C10] text-white border-t border-zinc-800 pb-safe"
        >
          <div className="grid grid-cols-3 items-center h-16 max-w-lg mx-auto relative">
            <button
              type="button"
              onClick={() => setRoute('more')}
              className="flex flex-col items-center justify-center gap-0.5 min-h-[48px]"
            >
              <GoldCoinIcon className="w-6 h-6" />
              <span
                className={`text-[11px] font-semibold ${
                  route === 'more' ? 'text-white' : 'text-zinc-400'
                }`}
              >
                More
              </span>
            </button>

            <div className="flex flex-col items-center justify-center relative">
              <button
                type="button"
                onClick={() => setRoute('play')}
                aria-label="Play"
                className={`-mt-6 w-14 h-14 rounded-full bg-black border-3 overflow-hidden flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                  route === 'play' ? 'border-white' : 'border-zinc-500'
                }`}
              >
                <SkillClashEmblem className="w-full h-full" />
              </button>
              <span
                className={`text-[11px] font-semibold mt-0.5 ${
                  route === 'play' ? 'text-white' : 'text-zinc-400'
                }`}
              >
                Play
              </span>
            </div>

            <button
              type="button"
              onClick={() => setRoute('account')}
              className="flex flex-col items-center justify-center gap-0.5 min-h-[48px]"
            >
              <User
                className={`w-5 h-5 ${route === 'account' ? 'text-white' : 'text-zinc-300'}`}
              />
              <span
                className={`text-[11px] font-semibold ${
                  route === 'account' ? 'text-white' : 'text-zinc-400'
                }`}
              >
                Account
              </span>
            </button>
          </div>
        </nav>
      )}

      {/* Action Modals */}
      <ActionModals
        modal={activeModal}
        onClose={() => setActiveModal(null)}
        user={user}
        transactions={transactions}
        leaderboard={leaderboard}
        feedbacks={feedbacks}
        announcements={announcements}
        onDeposit={handleDeposit}
        onWithdraw={handleWithdraw}
        onSpinLuckyDraw={handleSpinLuckyDraw}
        onSubmitPromo={handleSubmitPromo}
        onSubmitFeedback={handleSubmitFeedback}
        onUpdateProfile={(payload) => handlePatchUser(payload)}
      />
    </div>
  );
}
