import type { User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';
import { db, handleFirestoreError, OperationType, storage } from '../firebase';
import type {
  AnnouncementItem,
  AppControlSettings,
  AppLanguage,
  AppNotification,
  BannerItem,
  FeedbackEntry,
  LeaderboardEntry,
  MatchResultRow,
  MatchStatEntry,
  MatchStatus,
  SupportTicket,
  TournamentCategory,
  TournamentMatch,
  UserProfile,
  WalletTransaction,
  WithdrawalTicker,
} from '../types';

export const BOOTSTRAP_ADMIN_EMAIL = 'habbik758@gmail.com';

export const DEFAULT_APP_SETTINGS: AppControlSettings = {
  maintenanceMode: false,
  registrationsEnabled: true,
  minWithdrawal: 20,
  merchantUpiId: 'chhatishx21@fam',
  upiLabel: 'SkillBattle UPI',
  supportEmail: 'contactontelegramonly@xyz.com',
  supportTelegram: 'https://t.me/+917854967349',
};

export const DEFAULT_CATEGORIES: TournamentCategory[] = [
  {
    id: 'full-map-bermuda',
    slug: 'full-map-bermuda',
    title: 'FULL MAP BERMUDA',
    shortTag: 'Solo • Duo • Squad',
    accentGradient: 'from-amber-500/80 via-orange-600/70 to-zinc-950/90',
    artVariant: 'battle',
    badgeLabel: 'POPULAR',
  },
  {
    id: 'survival-mode',
    slug: 'survival-mode',
    title: 'SURVIVAL MODE',
    shortTag: '48 Players • High Pool',
    accentGradient: 'from-emerald-500/80 via-teal-700/70 to-zinc-950/90',
    artVariant: 'battle',
    badgeLabel: 'SURVIVAL',
  },
  {
    id: 'cs-1v1',
    slug: 'cs-1v1',
    title: 'CLASH SQUAD 1v1',
    shortTag: 'Custom Room • Fast',
    accentGradient: 'from-indigo-500/80 via-purple-700/70 to-zinc-950/90',
    artVariant: 'headshot',
    badgeLabel: '1V1',
  },
  {
    id: 'cs-2v2',
    slug: 'cs-2v2',
    title: 'CLASH SQUAD 2v2',
    shortTag: 'Duo Clash • Instant',
    accentGradient: 'from-sky-500/80 via-blue-700/70 to-zinc-950/90',
    artVariant: 'headshot',
    badgeLabel: '2V2',
  },
  {
    id: 'cs-4v4',
    slug: 'cs-4v4',
    title: 'CLASH SQUAD 4v4',
    shortTag: 'Full Squad • Booyah',
    accentGradient: 'from-rose-500/80 via-red-700/70 to-zinc-950/90',
    artVariant: 'battle',
    badgeLabel: '4V4',
  },
  {
    id: 'lone-wolf-1v1',
    slug: 'lone-wolf-1v1',
    title: 'LONE WOLF 1v1',
    shortTag: 'Iron Cage • Duel',
    accentGradient: 'from-yellow-500/80 via-amber-700/70 to-zinc-950/90',
    artVariant: 'yellow',
    badgeLabel: 'LW 1V1',
  },
  {
    id: 'lone-wolf-2v2',
    slug: 'lone-wolf-2v2',
    title: 'LONE WOLF 2v2',
    shortTag: 'Iron Cage • Duo',
    accentGradient: 'from-amber-400/80 via-orange-700/70 to-zinc-950/90',
    artVariant: 'yellow',
    badgeLabel: 'LW 2V2',
  },
  {
    id: 'only-head-1v1',
    slug: 'only-head-1v1',
    title: 'ONLY HEAD 1v1',
    shortTag: 'Headshot Only • Desert Eagle',
    accentGradient: 'from-red-500/80 via-rose-800/70 to-zinc-950/90',
    artVariant: 'headshot',
    badgeLabel: 'HEADSHOT',
  },
  {
    id: 'only-head-2v2',
    slug: 'only-head-2v2',
    title: 'ONLY HEAD 2v2',
    shortTag: 'Headshot Only • Duo',
    accentGradient: 'from-fuchsia-500/80 via-purple-800/70 to-zinc-950/90',
    artVariant: 'headshot',
    badgeLabel: 'HEADSHOT',
  },
  {
    id: 'per-kill-special',
    slug: 'per-kill-special',
    title: 'PER KILL SPECIAL',
    shortTag: 'Every Kill Pays ₹',
    accentGradient: 'from-lime-500/80 via-emerald-800/70 to-zinc-950/90',
    artVariant: 'battle',
    badgeLabel: 'PER KILL',
  },
  {
    id: 'free-giveaway',
    slug: 'free-giveaway',
    title: 'FREE GIVEAWAY',
    shortTag: '₹0 Entry • Real Prizes',
    accentGradient: 'from-cyan-500/80 via-teal-800/70 to-zinc-950/90',
    artVariant: 'promo',
    badgeLabel: 'FREE',
  },
  {
    id: 'high-stakes',
    slug: 'high-stakes',
    title: 'HIGH STAKES PRO',
    shortTag: 'VIP Entry • Max Pool',
    accentGradient: 'from-violet-500/80 via-indigo-900/70 to-zinc-950/90',
    artVariant: 'promo',
    badgeLabel: 'PRO',
  },
  {
    id: 'sunday-special',
    slug: 'sunday-special',
    title: 'SUNDAY MEGA CUP',
    shortTag: 'Weekly Championship',
    accentGradient: 'from-orange-500/80 via-amber-800/70 to-zinc-950/90',
    artVariant: 'yellow',
    badgeLabel: 'MEGA',
  },
  {
    id: 'private-contest',
    slug: 'private-contest',
    title: 'PRIVATE CONTEST',
    shortTag: 'Custom Invite Code',
    accentGradient: 'from-slate-600/80 via-zinc-800/80 to-black/95',
    artVariant: 'promo',
    badgeLabel: 'PRIVATE',
    isPrivateContest: true,
  },
];

export function timestampToIso(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (typeof val === 'string') return val;
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === 'object' && val !== null && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

function normalizeMatchStatus(raw: unknown): MatchStatus {
  const s = String(raw || 'Upcoming').toUpperCase();
  if (s === 'LIVE' || s === 'ONGOING') return 'ONGOING';
  if (s === 'COMPLETED' || s === 'CANCELLED' || s === 'RESULTS') return 'RESULTS';
  return 'UPCOMING';
}

function normalizeTeamType(raw: unknown, mode: string): TournamentMatch['teamType'] {
  const str = String(raw || mode || 'Solo').toLowerCase();
  if (str.includes('1v1')) return '1v1';
  if (str.includes('2v2')) return '2v2';
  if (str.includes('4v4')) return '4v4';
  if (str.includes('squad')) return 'Squad';
  if (str.includes('duo')) return 'Duo';
  return 'Solo';
}

function inferCategoryId(data: Record<string, unknown>, categories: TournamentCategory[]): string {
  if (typeof data.categoryId === 'string' && data.categoryId.trim()) {
    const exact = categories.find(
      (c) => c.id === data.categoryId || c.slug === data.categoryId,
    );
    if (exact) return exact.id;
    return data.categoryId;
  }
  if (data.isPrivate === true) {
    const pvt = categories.find((c) => c.isPrivateContest);
    return pvt?.id || 'private-contest';
  }
  const haystack = `${data.mode || ''} ${data.title || ''} ${data.game || ''}`.toLowerCase();
  if (haystack.includes('lone wolf') && haystack.includes('2v2')) return 'lone-wolf-2v2';
  if (haystack.includes('lone wolf')) return 'lone-wolf-1v1';
  if (haystack.includes('head') && haystack.includes('2v2')) return 'only-head-2v2';
  if (haystack.includes('head')) return 'only-head-1v1';
  if (haystack.includes('1v1')) return 'cs-1v1';
  if (haystack.includes('2v2')) return 'cs-2v2';
  if (haystack.includes('4v4') || haystack.includes('clash squad') || haystack.includes('cs')) return 'cs-4v4';
  if (haystack.includes('survival')) return 'survival-mode';
  if (haystack.includes('free') || Number(data.entryFee) === 0) return 'free-giveaway';
  if (haystack.includes('per kill')) return 'per-kill-special';
  return categories.find((c) => !c.isPrivateContest)?.id || 'full-map-bermuda';
}

function formatScheduleLabels(rawSchedule: unknown): {
  startsAt?: string;
  startTime: string;
  dateLabel: string;
  timeLabel: string;
} {
  const iso = typeof rawSchedule === 'string' ? rawSchedule : rawSchedule instanceof Timestamp ? rawSchedule.toDate().toISOString() : '';
  if (!iso) {
    return {
      startTime: 'Today · 08:00 PM',
      dateLabel: 'Today',
      timeLabel: '08:00 PM',
    };
  }
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) {
    const parts = iso.split('·').map((s) => s.trim());
    return {
      startTime: iso,
      dateLabel: parts[0] || iso,
      timeLabel: parts[1] || '',
    };
  }
  const dateLabel = dt.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
  });
  const timeLabel = dt.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return {
    startsAt: dt.toISOString(),
    startTime: `${dateLabel} · ${timeLabel}`,
    dateLabel,
    timeLabel,
  };
}

export function normalizeUserProfile(
  uid: string,
  data: Record<string, unknown>,
  fbUser?: FirebaseUser | null,
): UserProfile {
  const email = String(data.email || fbUser?.email || '');
  const displayName = fbUser?.displayName || '';
  const nameParts = displayName.trim().split(/\s+/);
  const firstName = String(data.firstName ?? (nameParts[0] || 'Player'));
  const lastName = String(data.lastName ?? (nameParts.slice(1).join(' ') || 'One'));
  const username = String(
    data.username || email.split('@')[0]?.replace(/[^a-zA-Z0-9_]/g, '') || `Player_${uid.slice(0, 6)}`,
  ).slice(0, 40);

  const matchesPlayed = Number(data.matchesPlayed || 0);
  const totalKilled = Number(data.totalKilled || 0);
  const amountWon = Number(data.amountWon || 0);
  const winRate =
    typeof data.winRate === 'number'
      ? data.winRate
      : matchesPlayed > 0
        ? Math.min(100, Math.round((amountWon > 0 ? Math.max(1, Math.round(totalKilled / 2)) : 0) / matchesPlayed * 100))
        : 0;

  return {
    id: uid,
    uid,
    role: data.role === 'admin' ? 'admin' : 'player',
    status: data.status === 'Banned' ? 'Banned' : 'Active',
    firstName,
    lastName,
    username,
    countryCode: String(data.countryCode || '+91'),
    mobile: String(data.mobile || data.phone || ''),
    phone: String(data.phone || data.mobile || ''),
    email,
    referralCode: String(data.referralCode || ''),
    myReferralCode: String(data.myReferralCode || `SB${uid.slice(0, 6).toUpperCase()}`),
    rankTitle: String(data.rankTitle || 'Bronze Challenger'),
    level: Number(data.level || 1),
    balance: Number(data.balance || 0),
    depositedBalance: Number(data.depositedBalance || 0),
    winningBalance: Number(data.winningBalance || 0),
    bonusBalance: Number(data.bonusBalance || 0),
    coins: Number(data.coins ?? data.balance ?? 0),
    payoutsCount: Number(data.payoutsCount || 0),
    totalWithdrawals: Number(data.totalWithdrawals || 0),
    matchesPlayed,
    totalKilled,
    amountWon,
    winRate,
    darkMode: Boolean(data.darkMode),
    language: data.language === 'hi' ? 'hi' : 'en',
    dateOfBirth: typeof data.dateOfBirth === 'string' ? data.dateOfBirth : '',
    gender: data.gender === 'Female' ? 'Female' : data.gender === 'Male' ? 'Male' : undefined,
    avatarPreset: typeof data.avatarPreset === 'string' ? data.avatarPreset : 'emblem',
    avatarUrl: typeof data.avatarUrl === 'string' ? data.avatarUrl : '',
    savedGameName: typeof data.savedGameName === 'string' ? data.savedGameName : '',
    savedGameUid: typeof data.savedGameUid === 'string' ? data.savedGameUid : '',
    referredCount: Number(data.referredCount || 0),
    referralEarnings: Number(data.referralEarnings || 0),
    luckyDrawLastSpinAt:
      typeof data.luckyDrawLastSpinAt === 'string' ? data.luckyDrawLastSpinAt : null,
  };
}

export async function ensureUserProfile(
  fbUser: FirebaseUser,
  regMeta?: {
    firstName?: string;
    lastName?: string;
    username?: string;
    countryCode?: string;
    mobile?: string;
    referralCode?: string;
  },
): Promise<UserProfile> {
  const userRef = doc(db, 'users', fbUser.uid);
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return normalizeUserProfile(fbUser.uid, snap.data() as Record<string, unknown>, fbUser);
    }

    const email = fbUser.email || 'player@skillbattle.app';
    const rawName = (fbUser.displayName || '').trim();
    const parts = rawName ? rawName.split(/\s+/) : [];
    const firstName = (regMeta?.firstName || parts[0] || 'Player').trim().slice(0, 60);
    const lastName = (regMeta?.lastName || parts.slice(1).join(' ') || 'Pro').trim().slice(0, 60);
    const fallbackHandle = email.split('@')[0]?.replace(/[^a-zA-Z0-9_]/g, '') || `Player${fbUser.uid.slice(0, 5)}`;
    const username = (regMeta?.username || fallbackHandle).trim().slice(0, 40) || `Player_${fbUser.uid.slice(0, 5)}`;
    const mobile = (regMeta?.mobile || '').replace(/\D/g, '').slice(0, 20);
    const countryCode = (regMeta?.countryCode || '+91').slice(0, 8);
    const avatarUrl = fbUser.photoURL && fbUser.photoURL.length <= 950 ? fbUser.photoURL : '';

    const payload = {
      uid: fbUser.uid,
      firstName,
      lastName,
      username,
      email,
      countryCode,
      mobile,
      phone: mobile ? `${countryCode}${mobile}` : '',
      referralCode: (regMeta?.referralCode || '').trim().slice(0, 30),
      myReferralCode: `SB${fbUser.uid.slice(0, 6).toUpperCase()}`,
      role: 'player' as const,
      status: 'Active' as const,
      balance: 0,
      depositedBalance: 0,
      winningBalance: 0,
      bonusBalance: 0,
      payoutsCount: 0,
      totalWithdrawals: 0,
      matchesPlayed: 0,
      totalKilled: 0,
      amountWon: 0,
      winRate: 0,
      darkMode: false,
      language: 'en' as AppLanguage,
      avatarPreset: 'emblem',
      avatarUrl,
      savedGameName: '',
      savedGameUid: '',
      referredCount: 0,
      referralEarnings: 0,
      rankTitle: 'Bronze Challenger',
      level: 1,
      luckyDrawLastSpinAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userRef, payload);
    const fresh = await getDoc(userRef);
    return normalizeUserProfile(fbUser.uid, (fresh.data() || payload) as Record<string, unknown>, fbUser);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${fbUser.uid}`);
  }
}

export function subscribeUserProfile(
  uid: string,
  fbUser: FirebaseUser,
  onData: (profile: UserProfile) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const path = `users/${uid}`;
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      if (snap.exists()) {
        onData(normalizeUserProfile(uid, snap.data() as Record<string, unknown>, fbUser));
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    },
  );
}

export function subscribeAdminStatus(
  uid: string,
  email: string | null | undefined,
  onData: (isAdmin: boolean) => void,
): Unsubscribe {
  if (email && email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) {
    onData(true);
  }
  return onSnapshot(
    doc(db, 'admins', uid),
    (snap) => {
      const isBootstrap = Boolean(email && email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase());
      const activeAdmin = snap.exists() && snap.data()?.status !== 'Inactive';
      onData(isBootstrap || activeAdmin);
    },
    () => {
      const isBootstrap = Boolean(email && email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase());
      onData(isBootstrap);
    },
  );
}

export async function updateUserProfileInFirestore(
  uid: string,
  patch: Partial<{
    firstName: string;
    lastName: string;
    countryCode: string;
    mobile: string;
    phone: string;
    dateOfBirth: string;
    gender: 'Male' | 'Female';
    avatarPreset: string;
    avatarUrl: string;
    darkMode: boolean;
    language: AppLanguage;
    savedGameName: string;
    savedGameUid: string;
  }>,
): Promise<void> {
  const allowed: Record<string, unknown> = {};
  if (patch.firstName !== undefined) allowed.firstName = String(patch.firstName).slice(0, 60);
  if (patch.lastName !== undefined) allowed.lastName = String(patch.lastName).slice(0, 60);
  if (patch.countryCode !== undefined) allowed.countryCode = String(patch.countryCode).slice(0, 8);
  if (patch.mobile !== undefined) {
    const cleanMob = String(patch.mobile).slice(0, 20);
    allowed.mobile = cleanMob;
    allowed.phone = cleanMob;
  }
  if (patch.phone !== undefined) allowed.phone = String(patch.phone).slice(0, 20);
  if (patch.dateOfBirth !== undefined) allowed.dateOfBirth = String(patch.dateOfBirth).slice(0, 20);
  if (patch.gender !== undefined) allowed.gender = patch.gender;
  if (patch.avatarPreset !== undefined) allowed.avatarPreset = String(patch.avatarPreset).slice(0, 30);
  if (patch.avatarUrl !== undefined) allowed.avatarUrl = String(patch.avatarUrl).slice(0, 1000);
  if (patch.darkMode !== undefined) allowed.darkMode = Boolean(patch.darkMode);
  if (patch.language !== undefined) allowed.language = patch.language;
  if (patch.savedGameName !== undefined) allowed.savedGameName = String(patch.savedGameName).slice(0, 40);
  if (patch.savedGameUid !== undefined) allowed.savedGameUid = String(patch.savedGameUid).slice(0, 14);
  allowed.updatedAt = serverTimestamp();

  try {
    await updateDoc(doc(db, 'users', uid), allowed);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function uploadUserAvatarToStorage(uid: string, dataUrl: string): Promise<string> {
  const storageRef = ref(storage, `userAvatars/${uid}/avatar_${Date.now()}.jpg`);
  await uploadString(storageRef, dataUrl, 'data_url', { contentType: 'image/jpeg' });
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
}

export function subscribeAppSettings(onData: (settings: AppControlSettings) => void): Unsubscribe {
  return onSnapshot(
    doc(db, 'appSettings', 'control'),
    (snap) => {
      if (!snap.exists()) {
        onData(DEFAULT_APP_SETTINGS);
        return;
      }
      const d = snap.data() as Record<string, unknown>;
      onData({
        maintenanceMode: Boolean(d.maintenanceMode),
        registrationsEnabled: d.registrationsEnabled !== false,
        minWithdrawal: Number(d.minWithdrawal) >= 10 ? Number(d.minWithdrawal) : DEFAULT_APP_SETTINGS.minWithdrawal,
        merchantUpiId: String(d.merchantUpiId || d.upiId || DEFAULT_APP_SETTINGS.merchantUpiId),
        upiLabel: String(d.upiLabel || DEFAULT_APP_SETTINGS.upiLabel),
        supportEmail: String(d.supportEmail || DEFAULT_APP_SETTINGS.supportEmail),
        supportTelegram: String(d.supportTelegram || DEFAULT_APP_SETTINGS.supportTelegram),
      });
    },
    () => {
      onData(DEFAULT_APP_SETTINGS);
    },
  );
}

export function subscribeCategories(onData: (categories: TournamentCategory[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, 'categories'),
    (snap) => {
      if (snap.empty) {
        onData(DEFAULT_CATEGORIES);
        return;
      }
      const list: TournamentCategory[] = snap.docs.map((docSnap) => {
        const d = docSnap.data() as Record<string, unknown>;
        return {
          id: docSnap.id,
          slug: String(d.slug || docSnap.id),
          title: String(d.title || docSnap.id).toUpperCase(),
          shortTag: String(d.shortTag || 'Tournament'),
          accentGradient: String(d.accentGradient || 'from-amber-500/80 via-orange-600/70 to-zinc-950/90'),
          artVariant:
            d.artVariant === 'headshot' || d.artVariant === 'yellow' || d.artVariant === 'promo'
              ? d.artVariant
              : 'battle',
          badgeLabel: String(d.badgeLabel || 'LIVE'),
          isPrivateContest: Boolean(d.isPrivateContest),
        };
      });
      if (!list.some((c) => c.isPrivateContest)) {
        const fallbackPrivate = DEFAULT_CATEGORIES.find((c) => c.isPrivateContest);
        if (fallbackPrivate) list.push(fallbackPrivate);
      }
      onData(list);
    },
    () => {
      onData(DEFAULT_CATEGORIES);
    },
  );
}

export function subscribeBanners(onData: (banners: BannerItem[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'banners'), where('active', '==', true)),
    (snap) => {
      const list = snap.docs.map((docSnap) => {
        const d = docSnap.data() as Record<string, unknown>;
        return {
          id: docSnap.id,
          imageUrl: String(d.imageUrl || ''),
          badgeText: typeof d.badgeText === 'string' ? d.badgeText : undefined,
          title: typeof d.title === 'string' ? d.title : undefined,
          subtitle: typeof d.subtitle === 'string' ? d.subtitle : undefined,
          targetMatchId: typeof d.targetMatchId === 'string' ? d.targetMatchId : undefined,
          active: true,
        };
      });
      onData(list);
    },
    () => onData([]),
  );
}

export function subscribeAnnouncements(onData: (items: AnnouncementItem[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'announcements'), where('active', '==', true)),
    (snap) => {
      const items: AnnouncementItem[] = snap.docs
        .map((docSnap) => {
          const d = docSnap.data() as Record<string, unknown>;
          return {
            id: docSnap.id,
            title: String(d.title || 'Announcement'),
            body: String(d.body || ''),
            category: typeof d.category === 'string' ? d.category : undefined,
            date: String(d.date || timestampToIso(d.createdAt).slice(0, 10)),
            pinned: Boolean(d.pinned),
          };
        })
        .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));
      onData(items);
    },
    () => onData([]),
  );
}

export function subscribeNotifications(uid: string, onData: (items: AppNotification[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, 'notifications'),
    (snap) => {
      const items = snap.docs
        .map((docSnap) => {
          const d = docSnap.data() as Record<string, unknown>;
          return {
            id: docSnap.id,
            title: String(d.title || 'SkillBattle Alert'),
            body: String(d.body || ''),
            targetUserId: typeof d.targetUserId === 'string' ? d.targetUserId : 'ALL',
            createdAt: timestampToIso(d.createdAt),
          };
        })
        .filter((n) => !n.targetUserId || n.targetUserId === 'ALL' || n.targetUserId === uid)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(items);
    },
    () => onData([]),
  );
}

export function subscribeLeaderboard(onData: (entries: LeaderboardEntry[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, 'leaderboard'),
    (snap) => {
      const entries = snap.docs
        .map((docSnap) => {
          const d = docSnap.data() as Record<string, unknown>;
          return {
            rank: Number(d.rank || 0),
            username: String(d.username || 'Player'),
            matches: Number(d.matches || d.matchesPlayed || 0),
            kills: Number(d.kills ?? d.totalKilled ?? 0),
            winnings: Number(d.winnings ?? d.amountWon ?? 0),
            tier: String(d.tier || 'Pro Tier'),
            avatarUrl: typeof d.avatarUrl === 'string' ? d.avatarUrl : undefined,
          };
        })
        .sort((a, b) => (a.rank && b.rank ? a.rank - b.rank : b.winnings - a.winnings))
        .map((entry, idx) => ({
          ...entry,
          rank: entry.rank > 0 ? entry.rank : idx + 1,
        }));
      onData(entries);
    },
    () => onData([]),
  );
}

export function subscribePublicWithdrawals(onData: (items: WithdrawalTicker[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'publicWithdrawals'), where('verified', '==', true), limit(20)),
    (snap) => {
      const items = snap.docs
        .map((docSnap) => {
          const d = docSnap.data() as Record<string, unknown>;
          return {
            id: docSnap.id,
            username: String(d.username || 'Player'),
            amount: Number(d.amount || 0),
            verified: Boolean(d.verified),
            timeAgo: String(d.timeAgo || 'Recently'),
            createdAt: timestampToIso(d.createdAt),
            avatarUrl: typeof d.avatarUrl === 'string' ? d.avatarUrl : undefined,
          };
        })
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      onData(items);
    },
    () => onData([]),
  );
}

export function subscribeFeedbacks(onData: (items: FeedbackEntry[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'feedbacks'), limit(25)),
    (snap) => {
      const items = snap.docs
        .map((docSnap) => {
          const d = docSnap.data() as Record<string, unknown>;
          return {
            id: docSnap.id,
            username: String(d.username || 'Player'),
            rating: Number(d.rating || 5),
            comment: String(d.comment || ''),
            createdAt: timestampToIso(d.createdAt),
            avatarUrl: typeof d.avatarUrl === 'string' ? d.avatarUrl : undefined,
          };
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(items);
    },
    () => onData([]),
  );
}

export function subscribeUserTransactions(uid: string, onData: (items: WalletTransaction[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'transactions'), where('userId', '==', uid)),
    (snap) => {
      const items: WalletTransaction[] = snap.docs
        .map((docSnap) => {
          const d = docSnap.data() as Record<string, unknown>;
          const type = String(d.type || 'DEPOSIT') as WalletTransaction['type'];
          const statusRaw = String(d.status || 'PENDING').toUpperCase();
          const status: WalletTransaction['status'] =
            statusRaw === 'SUCCESS' ? 'SUCCESS' : statusRaw === 'REJECTED' ? 'REJECTED' : 'PENDING';
          return {
            id: docSnap.id,
            userId: String(d.userId || uid),
            type,
            amount: Number(d.amount || 0),
            title: String(d.title || type),
            upiOrRef: String(d.upiOrRef || 'SkillBattle'),
            method: typeof d.method === 'string' ? d.method : undefined,
            status,
            createdAt: timestampToIso(d.createdAt),
          };
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    },
  );
}

export function subscribeUserTickets(uid: string, onData: (items: SupportTicket[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'tickets'), where('userId', '==', uid)),
    (snap) => {
      const items: SupportTicket[] = snap.docs
        .map((docSnap): SupportTicket => {
          const d = docSnap.data() as Record<string, unknown>;
          return {
            id: docSnap.id,
            userId: String(d.userId || uid),
            username: String(d.username || 'Player'),
            subject: String(d.subject || 'Support Request'),
            message: String(d.message || ''),
            status: d.status === 'Resolved' ? 'Resolved' : 'Open',
            adminReply: typeof d.adminReply === 'string' ? d.adminReply : undefined,
            createdAt: timestampToIso(d.createdAt),
            updatedAt: d.updatedAt ? timestampToIso(d.updatedAt) : undefined,
          };
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(items);
    },
    () => onData([]),
  );
}

export interface RawMatchParticipant {
  matchId: string;
  userId: string;
  username: string;
  inGameName: string;
  uid: string;
  position: number;
  entryFeePaid: number;
  joinedAt: string;
}

export interface RawMatchResult {
  id: string;
  matchId: string;
  matchTitle: string;
  userId: string;
  username: string;
  inGameName: string;
  rank: number;
  kills: number;
  totalWinning: number;
  entryFeePaid: number;
  prizeStatus: 'Pending' | 'Credited';
  published: boolean;
  dateTime: string;
  createdAt: string;
}

export interface RawRoomSecret {
  roomId: string;
  roomPassword: string;
  roomRevealTime?: string;
}

export function subscribeMatchesRaw(onData: (docs: { id: string; data: Record<string, unknown> }[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'matches'), where('published', '==', true)),
    (snap) => {
      onData(snap.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> })));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'matches');
    },
  );
}

export function subscribeParticipantsRaw(onData: (items: RawMatchParticipant[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, 'matchParticipants'),
    (snap) => {
      onData(
        snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          return {
            matchId: String(data.matchId || ''),
            userId: String(data.userId || ''),
            username: String(data.username || ''),
            inGameName: String(data.inGameName || ''),
            uid: String(data.uid || ''),
            position: Number(data.position || 1),
            entryFeePaid: Number(data.entryFeePaid || 0),
            joinedAt: timestampToIso(data.joinedAt),
          };
        }),
      );
    },
    () => onData([]),
  );
}

export function subscribeMatchResultsRaw(
  onData: (items: RawMatchResult[]) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'matchResults'), where('published', '==', true)),
    (snap) => {
      onData(
        snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          return {
            id: d.id,
            matchId: String(data.matchId || ''),
            matchTitle: String(data.matchTitle || 'Tournament Match'),
            userId: String(data.userId || ''),
            username: String(data.username || ''),
            inGameName: String(data.inGameName || data.username || 'Player'),
            rank: Number(data.rank || 1),
            kills: Number(data.kills || 0),
            totalWinning: Number(data.totalWinning || 0),
            entryFeePaid: Number(data.entryFeePaid || 0),
            prizeStatus: data.prizeStatus === 'Credited' ? 'Credited' : 'Pending',
            published: Boolean(data.published),
            dateTime: String(data.dateTime || timestampToIso(data.createdAt).slice(0, 10)),
            createdAt: timestampToIso(data.createdAt),
          };
        }),
      );
    },
    () => onData([]),
  );
}

export function subscribeRoomSecret(
  matchId: string,
  onData: (secret: RawRoomSecret | null) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, 'matches', matchId, 'secrets', 'room'),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      const d = snap.data() as Record<string, unknown>;
      onData({
        roomId: String(d.roomId || ''),
        roomPassword: String(d.roomPassword || ''),
        roomRevealTime: typeof d.roomRevealTime === 'string' ? d.roomRevealTime : undefined,
      });
    },
    () => {
      onData(null);
    },
  );
}

export function buildMatchesState(params: {
  rawMatches: { id: string; data: Record<string, unknown> }[];
  participants: RawMatchParticipant[];
  results: RawMatchResult[];
  secretsByMatchId: Record<string, RawRoomSecret | null>;
  categories: TournamentCategory[];
  currentUserId: string;
}): {
  matches: TournamentMatch[];
  joinedMatches: TournamentMatch[];
  matchStats: MatchStatEntry[];
} {
  const { rawMatches, participants, results, secretsByMatchId, categories, currentUserId } = params;

  const participantsByMatch = new Map<string, RawMatchParticipant[]>();
  for (const p of participants) {
    const arr = participantsByMatch.get(p.matchId) || [];
    arr.push(p);
    participantsByMatch.set(p.matchId, arr);
  }

  const resultsByMatch = new Map<string, RawMatchResult[]>();
  for (const r of results) {
    const arr = resultsByMatch.get(r.matchId) || [];
    arr.push(r);
    resultsByMatch.set(r.matchId, arr);
  }

  const matches: TournamentMatch[] = rawMatches.map(({ id, data }) => {
    const matchParticipants = participantsByMatch.get(id) || [];
    const matchResults = (resultsByMatch.get(id) || []).slice().sort((a, b) => a.rank - b.rank);
    const secret = secretsByMatchId[id] || null;
    const isJoinedOrHost =
      matchParticipants.some((p) => p.userId === currentUserId) || data.hostUid === currentUserId;

    const mode = String(data.mode || 'Battle Royale');
    const teamType = normalizeTeamType(data.teamType, mode);
    const schedule = formatScheduleLabels(data.scheduleTime ?? data.startsAt ?? data.startTime);

    let revealAt: string | undefined;
    const rawReveal = secret?.roomRevealTime || data.roomRevealTime || data.revealAt;
    if (typeof rawReveal === 'string' && rawReveal.trim()) {
      const rDate = new Date(rawReveal);
      revealAt = Number.isNaN(rDate.getTime()) ? undefined : rDate.toISOString();
    } else if (schedule.startsAt) {
      const startMs = new Date(schedule.startsAt).getTime();
      if (!Number.isNaN(startMs)) {
        revealAt = new Date(startMs - 10 * 60 * 1000).toISOString();
      }
    }

    const maxSlots = Number(data.slotsTotal ?? data.maxSlots ?? 48);
    const takenPositions = Array.isArray(data.takenPositions)
      ? (data.takenPositions as number[]).filter((n) => typeof n === 'number')
      : matchParticipants.map((p) => p.position);
    const filledSlots = Math.max(
      Number(data.slotsFilled ?? data.filledSlots ?? 0),
      matchParticipants.length,
    );

    const status = normalizeMatchStatus(data.status);
    const revealReady =
      Boolean(secret?.roomId) &&
      isJoinedOrHost &&
      (!revealAt || Date.now() >= new Date(revealAt).getTime() || status !== 'UPCOMING');

    const resultRows: MatchResultRow[] =
      matchResults.length > 0
        ? matchResults.map((r) => ({
            rank: r.rank,
            playerName: r.inGameName || r.username,
            kills: r.kills,
            winning: r.totalWinning,
            prizeStatus: r.prizeStatus,
          }))
        : Array.isArray(data.results)
          ? (data.results as MatchResultRow[])
          : [];

    return {
      id,
      categoryId: inferCategoryId(data, categories),
      title: String(data.title || 'Tournament Match'),
      game: typeof data.game === 'string' ? data.game : 'Free Fire MAX',
      mode,
      map: String(data.map || 'Bermuda'),
      teamType,
      bannerUrl: typeof data.bannerUrl === 'string' ? data.bannerUrl : undefined,
      entryFee: Number(data.entryFee || 0),
      prizePool: Number(data.prizePool || 0),
      perKill: Number(data.perKill || 0),
      rank1Prize: typeof data.rank1Prize === 'number' ? data.rank1Prize : undefined,
      rank2Prize: typeof data.rank2Prize === 'number' ? data.rank2Prize : undefined,
      rank3Prize: typeof data.rank3Prize === 'number' ? data.rank3Prize : undefined,
      maxSlots,
      filledSlots,
      takenPositions,
      startTime: schedule.startTime,
      dateLabel: schedule.dateLabel,
      timeLabel: schedule.timeLabel,
      startsAt: schedule.startsAt,
      revealAt,
      roomRevealed: revealReady,
      status,
      roomId: revealReady && secret?.roomId ? secret.roomId : 'Locked until 10m before start',
      roomPassword: revealReady && secret?.roomPassword ? secret.roomPassword : '******',
      isPrivate: Boolean(data.isPrivate),
      inviteCode: typeof data.inviteCode === 'string' ? data.inviteCode : undefined,
      hostUid: typeof data.hostUid === 'string' ? data.hostUid : undefined,
      hostUsername: typeof data.hostUsername === 'string' ? data.hostUsername : undefined,
      winnerUsername:
        typeof data.winnerName === 'string'
          ? data.winnerName
          : typeof data.winnerUsername === 'string'
            ? data.winnerUsername
            : resultRows[0]?.playerName,
      winnerPrizeStatus: data.winnerPrizeStatus === 'Credited' ? 'Credited' : 'Pending',
      resultsStatus:
        data.resultsStatus === 'PUBLISHED' || data.resultsPublished === true
          ? 'PUBLISHED'
          : data.resultsStatus === 'DRAFT'
            ? 'DRAFT'
            : 'NONE',
      results: resultRows,
      joinedUsers: matchParticipants.map((p) => ({
        userId: p.userId,
        username: p.username,
        inGameName: p.inGameName,
        uid: p.uid,
        position: p.position,
        joinedAt: p.joinedAt,
      })),
    };
  });

  const joinedMatches = matches.filter((m) =>
    m.joinedUsers.some((u) => u.userId === currentUserId),
  );

  // Build My Statistics from user's matchResults + joined matches
  const myResults = results.filter((r) => r.userId === currentUserId);
  const resultMatchIds = new Set(myResults.map((r) => r.matchId));
  const matchStats: MatchStatEntry[] = [
    ...myResults.map((r) => ({
      id: r.id,
      userId: currentUserId,
      matchInfo: `${r.matchTitle} (#${r.rank} · ${r.kills} Kills)`,
      dateTime: r.dateTime,
      paid: r.entryFeePaid,
      won: r.totalWinning,
      createdAt: r.createdAt,
    })),
    ...joinedMatches
      .filter((m) => !resultMatchIds.has(m.id))
      .map((m) => {
        const myJoin = m.joinedUsers.find((j) => j.userId === currentUserId);
        return {
          id: `${m.id}_${currentUserId}`,
          userId: currentUserId,
          matchInfo: m.title,
          dateTime: m.startTime,
          paid: m.entryFee,
          won: 0,
          createdAt: myJoin?.joinedAt || new Date().toISOString(),
        };
      }),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return { matches, joinedMatches, matchStats };
}

export async function joinMatchInFirestore(params: {
  user: UserProfile;
  matchId: string;
  inGameName: string;
  uid: string;
  position?: number;
}): Promise<void> {
  const cleanName = params.inGameName.trim();
  const cleanGameUid = params.uid.replace(/\D/g, '');
  if (cleanName.length < 2 || cleanName.length > 40) {
    throw new Error('Game Name must be 2 to 40 characters.');
  }
  if (!/^[0-9]{6,14}$/.test(cleanGameUid)) {
    throw new Error('Game UID must be 6 to 14 numeric digits.');
  }

  const userRef = doc(db, 'users', params.user.id);
  const matchRef = doc(db, 'matches', params.matchId);
  const participantId = `${params.matchId}_${params.user.id}`;
  const participantRef = doc(db, 'matchParticipants', participantId);
  const txRef = doc(collection(db, 'transactions'));

  try {
    await runTransaction(db, async (transaction) => {
      const [userSnap, matchSnap, participantSnap] = await Promise.all([
        transaction.get(userRef),
        transaction.get(matchRef),
        transaction.get(participantRef),
      ]);

      if (!userSnap.exists()) throw new Error('Player profile not found.');
      if (!matchSnap.exists()) throw new Error('Match not found.');
      if (participantSnap.exists()) throw new Error('You have already joined this match.');

      const userData = userSnap.data() as Record<string, unknown>;
      const matchData = matchSnap.data() as Record<string, unknown>;

      if (userData.status === 'Banned') {
        throw new Error('Your account is currently suspended.');
      }

      const matchStatus = normalizeMatchStatus(matchData.status);
      if (matchStatus !== 'UPCOMING' || matchData.published !== true) {
        throw new Error('This match is no longer open for joining.');
      }

      const maxSlots = Number(matchData.slotsTotal ?? matchData.maxSlots ?? 48);
      const curFilled = Number(matchData.slotsFilled ?? matchData.filledSlots ?? 0);
      if (curFilled >= maxSlots) {
        throw new Error('Match slots are full.');
      }

      const curTaken: number[] = Array.isArray(matchData.takenPositions)
        ? (matchData.takenPositions as number[]).filter((n) => typeof n === 'number')
        : [];

      let chosenPos = params.position;
      if (!chosenPos) {
        for (let p = 1; p <= maxSlots; p += 1) {
          if (!curTaken.includes(p)) {
            chosenPos = p;
            break;
          }
        }
      }
      if (!chosenPos || chosenPos < 1 || chosenPos > maxSlots || curTaken.includes(chosenPos)) {
        throw new Error('Selected slot position is already taken. Please pick another.');
      }

      const entryFee = Number(matchData.entryFee || 0);
      const curBal = Number(userData.balance || 0);
      const curDep = Number(userData.depositedBalance || 0);
      const curWin = Number(userData.winningBalance || 0);
      const hasBonus = typeof userData.bonusBalance === 'number';
      const curBonus = Number(userData.bonusBalance || 0);

      if (curBal < entryFee) {
        throw new Error(`Insufficient balance (Need ₹${entryFee}, Available ₹${curBal.toFixed(2)}). Please Add Coins.`);
      }

      let remaining = entryFee;
      const fromDep = Math.min(curDep, remaining);
      remaining -= fromDep;
      const fromWin = Math.min(curWin, remaining);
      remaining -= fromWin;
      const fromBonus = hasBonus ? Math.min(curBonus, remaining) : 0;

      const userUpdate: Record<string, unknown> = {
        balance: Number((curBal - entryFee).toFixed(2)),
        depositedBalance: Number((curDep - fromDep).toFixed(2)),
        winningBalance: Number((curWin - fromWin).toFixed(2)),
        matchesPlayed: Number(userData.matchesPlayed || 0) + 1,
        savedGameName: cleanName,
        savedGameUid: cleanGameUid,
        updatedAt: serverTimestamp(),
      };
      if (hasBonus) {
        userUpdate.bonusBalance = Number((curBonus - fromBonus).toFixed(2));
      }

      transaction.set(participantRef, {
        matchId: params.matchId,
        matchCode: String(matchData.inviteCode || params.matchId),
        userId: params.user.id,
        username: params.user.username,
        inGameName: cleanName,
        uid: cleanGameUid,
        position: chosenPos,
        entryFeePaid: entryFee,
        joinedAt: serverTimestamp(),
      });

      transaction.update(matchRef, {
        slotsFilled: curFilled + 1,
        filledSlots: curFilled + 1,
        takenPositions: [...curTaken, chosenPos],
        updatedAt: serverTimestamp(),
      });

      transaction.update(userRef, userUpdate);

      transaction.set(txRef, {
        userId: params.user.id,
        type: 'ENTRY_FEE',
        amount: entryFee,
        title: `Joined ${String(matchData.title || 'Match')}`,
        upiOrRef: `Slot #${chosenPos} · ${cleanName}`,
        method: 'WALLET',
        status: 'SUCCESS',
        matchId: params.matchId,
        createdAt: serverTimestamp(),
      });
    });
  } catch (error) {
    if (error instanceof Error && !error.message.toLowerCase().includes('permission')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, `matchParticipants/${participantId}`);
  }
}

export async function submitPendingDepositUtr(params: {
  userId: string;
  amount: number;
  method: string;
  utr: string;
}): Promise<void> {
  const cleanUtr = params.utr.trim();
  if (!Number.isFinite(params.amount) || params.amount < 10 || params.amount > 10000) {
    throw new Error('Deposit amount must be between ₹10 and ₹10,000.');
  }
  if (cleanUtr.length < 6 || cleanUtr.length > 80) {
    throw new Error('Please enter a valid 6+ character UTR / Reference ID.');
  }

  // Check duplicate UTR in user's existing deposit transactions
  try {
    const existingSnap = await getDocs(
      query(
        collection(db, 'transactions'),
        where('userId', '==', params.userId),
        where('upiOrRef', '==', cleanUtr),
      ),
    );
    if (!existingSnap.empty) {
      throw new Error('This UTR / Reference ID has already been submitted.');
    }

    const txRef = doc(collection(db, 'transactions'));
    await setDoc(txRef, {
      userId: params.userId,
      type: 'DEPOSIT',
      amount: Number(params.amount),
      title: `Add Coins via ${params.method} (Pending Verification)`,
      upiOrRef: cleanUtr,
      method: params.method.slice(0, 40),
      status: 'PENDING',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already been submitted')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, 'transactions');
  }
}

export async function submitWithdrawalInFirestore(params: {
  user: UserProfile;
  amount: number;
  upiId: string;
  minWithdrawal: number;
}): Promise<void> {
  const cleanUpi = params.upiId.trim();
  const minW = Math.max(10, params.minWithdrawal || 20);
  if (!Number.isFinite(params.amount) || params.amount < minW || params.amount > 50000) {
    throw new Error(`Withdrawal amount must be between ₹${minW} and ₹50,000.`);
  }
  if (cleanUpi.length < 5 || !cleanUpi.includes('@')) {
    throw new Error('Please enter a valid UPI ID (e.g. name@okaxis).');
  }

  const userRef = doc(db, 'users', params.user.id);
  const withdrawalRef = doc(collection(db, 'withdrawals'));
  const txRef = doc(collection(db, 'transactions'));

  try {
    await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) throw new Error('User profile not found.');

      const userData = userSnap.data() as Record<string, unknown>;
      if (userData.status === 'Banned') {
        throw new Error('Account is restricted from withdrawals.');
      }

      const curWin = Number(userData.winningBalance || 0);
      const curBal = Number(userData.balance || 0);
      if (curWin < params.amount || curBal < params.amount) {
        throw new Error(`Insufficient Winning Balance (Available ₹${curWin.toFixed(2)}). Only winnings can be withdrawn.`);
      }

      const curPayouts = Number(userData.payoutsCount || 0);
      const curTotalW = Number(userData.totalWithdrawals || 0);

      transaction.update(userRef, {
        winningBalance: Number((curWin - params.amount).toFixed(2)),
        balance: Number((curBal - params.amount).toFixed(2)),
        payoutsCount: curPayouts + 1,
        totalWithdrawals: Number((curTotalW + params.amount).toFixed(2)),
        updatedAt: serverTimestamp(),
      });

      transaction.set(withdrawalRef, {
        userId: params.user.id,
        username: params.user.username,
        amount: Number(params.amount),
        upiId: cleanUpi,
        method: 'UPI',
        status: 'Pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      transaction.set(txRef, {
        userId: params.user.id,
        type: 'WITHDRAW',
        amount: Number(params.amount),
        title: `Withdraw to ${cleanUpi}`,
        upiOrRef: cleanUpi,
        method: 'UPI',
        status: 'PENDING',
        withdrawalId: withdrawalRef.id,
        createdAt: serverTimestamp(),
      });
    });
  } catch (error) {
    if (error instanceof Error && !error.message.toLowerCase().includes('permission')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, `withdrawals/${withdrawalRef.id}`);
  }
}

export async function createPrivateContestInFirestore(params: {
  user: UserProfile;
  title: string;
  teamType: '1v1' | '2v2' | '4v4';
  entryFee: number;
  map: string;
}): Promise<TournamentMatch> {
  const maxSlots = params.teamType === '4v4' ? 8 : params.teamType === '2v2' ? 4 : 2;
  const entryFee = Math.max(0, Math.min(1000, Number(params.entryFee) || 0));
  const prizePool = Math.round(entryFee * maxSlots * 0.9);
  const inviteCode = `SB-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const roomId = String(10000000 + Math.floor(Math.random() * 89999999));
  const roomPassword = String(1000 + Math.floor(Math.random() * 8999));
  const startIso = new Date(Date.now() + 25 * 60 * 1000).toISOString();
  const revealIso = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const matchRef = doc(collection(db, 'matches'));
  const secretRef = doc(db, 'matches', matchRef.id, 'secrets', 'room');
  const title = (params.title.trim() || `${params.user.username} Private Clash`).slice(0, 120);

  const batch = writeBatch(db);
  batch.set(matchRef, {
    categoryId: 'private-contest',
    title,
    game: 'Free Fire MAX',
    mode: `Private ${params.teamType}`,
    map: params.map || 'Iron Cage',
    teamType: params.teamType,
    entryFee,
    prizePool,
    perKill: 0,
    slotsTotal: maxSlots,
    slotsFilled: 0,
    filledSlots: 0,
    takenPositions: [],
    scheduleTime: startIso,
    roomRevealTime: revealIso,
    status: 'Upcoming',
    published: true,
    isPrivate: true,
    inviteCode,
    hostUid: params.user.id,
    hostUsername: params.user.username,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(secretRef, {
    roomId,
    roomPassword,
    roomRevealTime: revealIso,
    hostUid: params.user.id,
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `matches/${matchRef.id}`);
  }

  return {
    id: matchRef.id,
    categoryId: 'private-contest',
    title,
    game: 'Free Fire MAX',
    mode: `Private ${params.teamType}`,
    map: params.map || 'Iron Cage',
    teamType: params.teamType,
    entryFee,
    prizePool,
    perKill: 0,
    maxSlots,
    filledSlots: 0,
    takenPositions: [],
    startTime: formatScheduleLabels(startIso).startTime,
    startsAt: startIso,
    revealAt: revealIso,
    roomRevealed: true,
    status: 'UPCOMING',
    roomId,
    roomPassword,
    isPrivate: true,
    inviteCode,
    hostUid: params.user.id,
    hostUsername: params.user.username,
    joinedUsers: [],
  };
}

export async function findPrivateContestByCodeInFirestore(
  inviteCode: string,
  categories: TournamentCategory[],
): Promise<TournamentMatch | null> {
  const code = inviteCode.trim().toUpperCase();
  if (!code) return null;
  try {
    const snap = await getDocs(
      query(
        collection(db, 'matches'),
        where('published', '==', true),
        where('inviteCode', '==', code),
        limit(1),
      ),
    );
    if (snap.empty) return null;
    const d = snap.docs[0];
    const built = buildMatchesState({
      rawMatches: [{ id: d.id, data: d.data() as Record<string, unknown> }],
      participants: [],
      results: [],
      secretsByMatchId: {},
      categories,
      currentUserId: '',
    });
    return built.matches[0] || null;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'matches');
  }
}

export async function submitLuckyDrawSpinInFirestore(user: UserProfile): Promise<number> {
  if (user.luckyDrawLastSpinAt) {
    const lastMs = new Date(user.luckyDrawLastSpinAt).getTime();
    if (!Number.isNaN(lastMs) && Date.now() - lastMs < 24 * 60 * 60 * 1000) {
      throw new Error('Daily Lucky Draw already claimed today. Come back after 24 hours!');
    }
  }

  const rewards = [0, 2, 5, 10, 15, 25];
  const won = rewards[Math.floor(Math.random() * rewards.length)];
  const nowIso = new Date().toISOString();

  const batch = writeBatch(db);
  batch.update(doc(db, 'users', user.id), {
    luckyDrawLastSpinAt: nowIso,
    updatedAt: serverTimestamp(),
  });

  if (won > 0) {
    const txRef = doc(collection(db, 'transactions'));
    batch.set(txRef, {
      userId: user.id,
      type: 'BONUS',
      amount: won,
      title: 'Daily Lucky Draw Reward (Pending Approval)',
      upiOrRef: `LD-${Date.now().toString(36).toUpperCase()}`,
      method: 'LUCKY_DRAW',
      status: 'PENDING',
      createdAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
    return won;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.id}`);
  }
}

export async function submitPromoInFirestore(
  user: UserProfile,
  videoUrl: string,
  channelName: string,
): Promise<void> {
  const cleanUrl = videoUrl.trim();
  const cleanChannel = channelName.trim();
  if (!cleanUrl.startsWith('https://')) {
    throw new Error('Please enter a valid https:// YouTube Shorts link.');
  }
  if (cleanChannel.length < 2) {
    throw new Error('Please enter your YouTube channel name.');
  }
  try {
    await setDoc(doc(collection(db, 'promoSubmissions')), {
      userId: user.id,
      username: user.username,
      videoUrl: cleanUrl.slice(0, 200),
      channelName: cleanChannel.slice(0, 60),
      status: 'UNDER_REVIEW',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'promoSubmissions');
  }
}

export async function submitFeedbackInFirestore(
  user: UserProfile,
  rating: number,
  comment: string,
): Promise<void> {
  const cleanComment = comment.trim();
  if (cleanComment.length < 4 || cleanComment.length > 160) {
    throw new Error('Feedback comment must be between 4 and 160 characters.');
  }
  try {
    await setDoc(doc(collection(db, 'feedbacks')), {
      userId: user.id,
      username: user.username,
      rating: Math.max(1, Math.min(5, Math.round(rating))),
      comment: cleanComment,
      avatarUrl: user.avatarUrl || '',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'feedbacks');
  }
}

export async function createSupportTicketInFirestore(
  user: UserProfile,
  subject: string,
  message: string,
): Promise<string> {
  const cleanSubj = subject.trim();
  const cleanMsg = message.trim();
  if (cleanSubj.length < 2 || cleanSubj.length > 120) {
    throw new Error('Ticket subject must be 2 to 120 characters.');
  }
  if (cleanMsg.length < 4 || cleanMsg.length > 1000) {
    throw new Error('Ticket message must be 4 to 1000 characters.');
  }
  const ticketRef = doc(collection(db, 'tickets'));
  try {
    await setDoc(ticketRef, {
      userId: user.id,
      username: user.username,
      subject: cleanSubj,
      message: cleanMsg,
      status: 'Open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ticketRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `tickets/${ticketRef.id}`);
  }
}
