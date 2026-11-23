export type AppLanguage = 'en' | 'hi';

export interface UserProfile {
  id: string;
  uid?: string;
  role?: 'player' | 'admin';
  status?: 'Active' | 'Banned';
  firstName: string;
  lastName: string;
  username: string;
  countryCode: string;
  mobile: string;
  phone?: string;
  email: string;
  referralCode: string;
  myReferralCode: string;
  rankTitle: string;
  level: number;
  balance: number;
  depositedBalance: number;
  winningBalance: number;
  bonusBalance?: number;
  coins?: number;
  payoutsCount: number;
  totalWithdrawals?: number;
  matchesPlayed: number;
  totalKilled: number;
  amountWon: number;
  winRate: number;
  darkMode: boolean;
  language: AppLanguage;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female';
  avatarPreset?: string;
  avatarUrl?: string;
  savedGameName?: string;
  savedGameUid?: string;
  referredCount: number;
  referralEarnings: number;
  luckyDrawLastSpinAt: string | null;
}

export interface TournamentCategory {
  id: string;
  slug: string;
  title: string;
  shortTag: string;
  accentGradient: string;
  artVariant: 'battle' | 'headshot' | 'yellow' | 'promo';
  badgeLabel: string;
  isPrivateContest?: boolean;
}

export type MatchStatus = 'UPCOMING' | 'ONGOING' | 'RESULTS';

export interface MatchResultRow {
  rank: number;
  playerName: string;
  kills: number;
  winning: number;
  prizeStatus?: 'Pending' | 'Credited';
}

export interface TournamentMatch {
  id: string;
  categoryId: string;
  title: string;
  game?: string;
  mode: string;
  map: string;
  teamType: 'Solo' | 'Duo' | 'Squad' | '1v1' | '2v2' | '4v4';
  bannerUrl?: string;
  entryFee: number;
  prizePool: number;
  perKill: number;
  rank1Prize?: number;
  rank2Prize?: number;
  rank3Prize?: number;
  maxSlots: number;
  filledSlots: number;
  takenPositions?: number[];
  startTime: string;
  dateLabel?: string;
  timeLabel?: string;
  startsAt?: string;
  revealAt?: string;
  roomRevealed?: boolean;
  status: MatchStatus;
  roomId: string;
  roomPassword: string;
  isPrivate?: boolean;
  inviteCode?: string;
  hostUid?: string;
  hostUsername?: string;
  winnerUsername?: string;
  winnerPrizeStatus?: 'Pending' | 'Credited';
  resultsStatus?: 'NONE' | 'DRAFT' | 'PUBLISHED';
  results?: MatchResultRow[];
  joinedUsers: {
    userId: string;
    username: string;
    inGameName: string;
    uid: string;
    position?: number;
    joinedAt: string;
  }[];
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'ENTRY_FEE' | 'WINNING' | 'BONUS';
  amount: number;
  title: string;
  upiOrRef: string;
  method?: string;
  status: 'SUCCESS' | 'PENDING' | 'REJECTED';
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  matches: number;
  kills: number;
  winnings: number;
  tier: string;
  avatarUrl?: string;
}

export interface MatchStatEntry {
  id: string;
  userId: string;
  matchInfo: string;
  dateTime: string;
  paid: number;
  won: number;
  createdAt: string;
}

export interface FeedbackEntry {
  id: string;
  username: string;
  rating: number;
  comment: string;
  createdAt: string;
  avatarUrl?: string;
}

export interface WithdrawalTicker {
  id: string;
  username: string;
  amount: number;
  verified: boolean;
  timeAgo: string;
  createdAt?: string;
  avatarUrl?: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  category?: string;
  date: string;
  pinned?: boolean;
}

export interface PromoSubmission {
  id: string;
  userId: string;
  videoUrl: string;
  channelName: string;
  status: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface BannerItem {
  id: string;
  imageUrl: string;
  badgeText?: string;
  title?: string;
  subtitle?: string;
  targetMatchId?: string;
  active: boolean;
}

export interface SupportTicket {
  id: string;
  userId: string;
  username: string;
  subject: string;
  message: string;
  status: 'Open' | 'Resolved';
  adminReply?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  targetUserId?: string;
  createdAt: string;
}

export interface AppControlSettings {
  maintenanceMode: boolean;
  registrationsEnabled: boolean;
  minWithdrawal: number;
  merchantUpiId: string;
  upiLabel: string;
  supportEmail: string;
  supportTelegram: string;
}
