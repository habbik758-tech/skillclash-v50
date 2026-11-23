import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import { createServer as createHttpServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import type {
  AnnouncementItem,
  AppLanguage,
  FeedbackEntry,
  LeaderboardEntry,
  MatchStatEntry,
  PromoSubmission,
  TournamentCategory,
  TournamentMatch,
  UserProfile,
  WalletTransaction,
  WithdrawalTicker,
} from './src/types.ts';

interface StoredUser extends UserProfile {
  passwordHash: string;
  passwordSalt: string;
  isDemoAccount?: boolean;
}

interface AuthSession {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: number;
}

interface DatabaseState {
  users: StoredUser[];
  sessions?: AuthSession[];
  sessionSecret?: string;
  categories: TournamentCategory[];
  matches: TournamentMatch[];
  transactions: WalletTransaction[];
  leaderboard: LeaderboardEntry[];
  matchStats: MatchStatEntry[];
  feedbacks: FeedbackEntry[];
  recentWithdrawals: WithdrawalTicker[];
  announcements: AnnouncementItem[];
  promoSubmissions: PromoSubmission[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'skillclash-db.json');
const SESSION_TTL_MS = 365 * 24 * 60 * 60 * 1000; // Persistent until manual logout or password reset

function computeTotalBalance(user: StoredUser): number {
  return Number(
    ((user.depositedBalance || 0) + (user.winningBalance || 0) + (user.bonusBalance || 0)).toFixed(2),
  );
}

function getSessionSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim()) {
    return process.env.SESSION_SECRET.trim();
  }
  if (!db.sessionSecret) {
    db.sessionSecret = crypto.randomBytes(32).toString('hex');
    saveDatabase();
  }
  return db.sessionSecret;
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const computed = crypto.scryptSync(password, salt, 64);
  const target = Buffer.from(storedHash, 'hex');
  if (computed.length !== target.length) return false;
  return crypto.timingSafeEqual(computed, target);
}

function createToken(userId: string): string {
  const sessionId = crypto.randomUUID();
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;

  if (!Array.isArray(db.sessions)) {
    db.sessions = [];
  }
  db.sessions = db.sessions.filter((s) => s.expiresAt > now);
  db.sessions.push({
    id: sessionId,
    userId,
    createdAt: new Date(now).toISOString(),
    expiresAt,
  });
  saveDatabase();

  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      jti: sessionId,
      iat: now,
      exp: expiresAt,
    }),
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function parseVerifiedToken(token: string): { userId: string; sessionId: string } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      sub?: string;
      jti?: string;
      exp?: number;
    };
    if (!decoded.sub || !decoded.jti || !decoded.exp || decoded.exp < Date.now()) {
      return null;
    }
    const activeSession = (db.sessions || []).find(
      (s) => s.id === decoded.jti && s.userId === decoded.sub && s.expiresAt > Date.now(),
    );
    if (!activeSession) {
      return null;
    }
    return { userId: decoded.sub, sessionId: decoded.jti };
  } catch {
    return null;
  }
}

function verifyToken(token: string): string | null {
  return parseVerifiedToken(token)?.userId ?? null;
}

function revokeSessionByToken(token: string): void {
  const parsed = parseVerifiedToken(token);
  if (!parsed || !Array.isArray(db.sessions)) return;
  const next = db.sessions.filter((s) => s.id !== parsed.sessionId);
  if (next.length !== db.sessions.length) {
    db.sessions = next;
    saveDatabase();
  }
}

function revokeAllUserSessions(userId: string): void {
  if (!Array.isArray(db.sessions)) return;
  const next = db.sessions.filter((s) => s.userId !== userId);
  if (next.length !== db.sessions.length) {
    db.sessions = next;
  }
}

function findUserByIdentifier(identifier: string): StoredUser | undefined {
  const trimmed = identifier.trim();
  const lower = trimmed.toLowerCase();
  const digits = trimmed.replace(/\D/g, '');
  const digitsNoZero = digits.replace(/^0+/, '');
  return db.users.find((u) => {
    if (u.username.trim().toLowerCase() === lower) return true;
    if (u.email && u.email.trim().toLowerCase() === lower) return true;
    if (digits.length >= 7 && u.mobile) {
      const userDigits = u.mobile.replace(/\D/g, '');
      const userDigitsNoZero = userDigits.replace(/^0+/, '');
      const fullUserDigits = `${(u.countryCode || '').replace(/\D/g, '')}${userDigitsNoZero}`;
      if (
        userDigits === digits ||
        (digitsNoZero.length >= 7 && userDigitsNoZero === digitsNoZero) ||
        fullUserDigits === digits
      ) {
        return true;
      }
    }
    return false;
  });
}

function sanitizeUser(user: StoredUser): UserProfile {
  const { passwordHash: _ph, passwordSalt: _ps, isDemoAccount: _demo, ...safe } = user;
  return safe;
}

function seedInitialState(): DatabaseState {
  const demoSalt = crypto.randomBytes(16).toString('hex');
  const demoUser: StoredUser = {
    id: 'user-chhatish',
    firstName: 'Chhatish',
    lastName: 'Gamer',
    username: 'chhatish.ff',
    countryCode: '+91',
    mobile: '9876543210',
    email: 'chhatish@skillclash.gg',
    referralCode: '',
    myReferralCode: 'SCCHH91',
    rankTitle: 'Champion',
    level: 1,
    balance: 10.0,
    depositedBalance: 4.0,
    winningBalance: 6.0,
    payoutsCount: 0,
    matchesPlayed: 11,
    totalKilled: 1,
    amountWon: 6,
    winRate: 9,
    darkMode: false,
    language: 'en',
    dateOfBirth: '',
    gender: 'Male',
    avatarPreset: 'emblem',
    referredCount: 3,
    referralEarnings: 15,
    luckyDrawLastSpinAt: null,
    passwordSalt: demoSalt,
    passwordHash: hashPassword(crypto.randomBytes(16).toString('hex'), demoSalt),
    isDemoAccount: true,
  };

  const categories: TournamentCategory[] = [
    {
      id: 'cat-battle-royale',
      slug: 'battle-royale',
      title: 'BATTLE ROYALE',
      shortTag: '48 Players · Full Map',
      accentGradient: 'from-amber-500/80 via-orange-600/60 to-zinc-950',
      artVariant: 'battle',
      badgeLabel: 'FREE FIRE INDIA',
    },
    {
      id: 'cat-ff-survival',
      slug: 'ff-survival',
      title: 'FF SURVIVAL',
      shortTag: 'Last Man Standing',
      accentGradient: 'from-cyan-500/80 via-blue-700/60 to-zinc-950',
      artVariant: 'yellow',
      badgeLabel: 'FREE FIRE INDIA',
    },
    {
      id: 'cat-loss-heal-lw',
      slug: 'loss-heal-lw',
      title: 'LOSS/HEAL LW',
      shortTag: 'Lone Wolf Special',
      accentGradient: 'from-rose-600/80 via-red-700/60 to-zinc-950',
      artVariant: 'promo',
      badgeLabel: 'FREE FIRE INDIA',
    },
    {
      id: 'cat-cs-lw-1v1',
      slug: 'cs-lw-1v1',
      title: 'CS/LW 1V1',
      shortTag: '1v1 Custom Room',
      accentGradient: 'from-zinc-600/80 via-neutral-800/60 to-black',
      artVariant: 'headshot',
      badgeLabel: 'FREE FIRE INDIA',
    },
    {
      id: 'cat-cs-lw-2v2',
      slug: 'cs-lw-2v2',
      title: 'CS/LW 2V2',
      shortTag: 'Duo Clash Squad',
      accentGradient: 'from-sky-500/80 via-indigo-800/60 to-zinc-950',
      artVariant: 'headshot',
      badgeLabel: 'FREE FIRE INDIA',
    },
    {
      id: 'cat-10-only',
      slug: '10-only',
      title: '₹10 ONLY',
      shortTag: 'Quick ₹10 Entry',
      accentGradient: 'from-emerald-500/80 via-teal-800/60 to-zinc-950',
      artVariant: 'yellow',
      badgeLabel: 'FREE FIRE INDIA',
    },
    {
      id: 'cat-only-head-1v1',
      slug: 'only-head-1v1',
      title: 'ONLY HEAD 1V1',
      shortTag: 'Headshot Only Mode',
      accentGradient: 'from-blue-600/80 via-violet-800/60 to-zinc-950',
      artVariant: 'headshot',
      badgeLabel: 'FREE FIRE INDIA',
    },
    {
      id: 'cat-only-head-2v2',
      slug: 'only-head-2v2',
      title: 'ONLY HEAD 2V2',
      shortTag: '2v2 Headshot Rules',
      accentGradient: 'from-red-600/80 via-rose-900/60 to-zinc-950',
      artVariant: 'promo',
      badgeLabel: 'FREE FIRE INDIA',
    },
    {
      id: 'cat-low-mix-2v2',
      slug: 'low-mix-2v2',
      title: 'LOW MIX 2V2',
      shortTag: '2v2 Balanced Guns',
      accentGradient: 'from-amber-400/80 via-yellow-700/60 to-zinc-950',
      artVariant: 'battle',
      badgeLabel: 'FREE FIRE INDIA',
    },
    {
      id: 'cat-gun-pro',
      slug: 'gun-pro',
      title: 'GUN PRO ??',
      shortTag: 'Weapon Mastery',
      accentGradient: 'from-indigo-500/80 via-blue-900/60 to-zinc-950',
      artVariant: 'headshot',
      badgeLabel: 'FREE FIRE INDIA',
    },
    {
      id: 'cat-cs-4v4',
      slug: 'cs-4v4',
      title: 'CS 4V4',
      shortTag: 'Squad 4v4 Battle',
      accentGradient: 'from-orange-500/80 via-red-800/60 to-zinc-950',
      artVariant: 'promo',
      badgeLabel: 'FREE FIRE INDIA',
    },
    {
      id: 'cat-free-match',
      slug: 'free-match',
      title: 'FREE MATCH',
      shortTag: '₹0 Entry · Win Coins',
      accentGradient: 'from-sky-400/80 via-cyan-800/60 to-zinc-950',
      artVariant: 'battle',
      badgeLabel: 'FREE FIRE INDIA',
    },
    {
      id: 'cat-giveaway-sc',
      slug: 'giveaway-x-sc',
      title: 'GIVEAWAY X SC',
      shortTag: 'Mega Prize Pool',
      accentGradient: 'from-purple-500/80 via-fuchsia-900/60 to-zinc-950',
      artVariant: 'yellow',
      badgeLabel: 'FREE FIRE INDIA',
    },
    {
      id: 'cat-pvt-contest',
      slug: 'pvt-contest',
      title: 'PVT CONTEST',
      shortTag: 'Custom Friend Rooms',
      accentGradient: 'from-sky-500/80 via-slate-800/70 to-black',
      artVariant: 'headshot',
      badgeLabel: 'FREE FIRE INDIA',
      isPrivateContest: true,
    },
  ];

  const matches: TournamentMatch[] = [
    {
      id: 'match-br-101',
      categoryId: 'cat-battle-royale',
      title: 'SOLO – Per Kill + Top Prize | Ryden BAN',
      mode: 'Har Players Ki Choice – Fast Withdrawal',
      map: 'Bermuda',
      teamType: 'Solo',
      entryFee: 7,
      prizePool: 310,
      perKill: 6,
      maxSlots: 48,
      filledSlots: 27,
      takenPositions: [
        1, 2, 3, 4, 5, 6, 7, 10, 11, 13, 14, 22, 23, 25, 28, 35, 36, 37, 38, 40, 42, 43, 44, 45,
        46, 47, 48,
      ],
      startTime: '22/11/2026 · 02:30 pm',
      dateLabel: '22/11/2026',
      timeLabel: '02:30 pm',
      status: 'UPCOMING',
      roomId: '88410294',
      roomPassword: 'SC48',
      joinedUsers: [],
    },
    {
      id: 'match-br-102',
      categoryId: 'cat-battle-royale',
      title: 'SQUAD – Per Kill + Top Prize | Ryden BAN - Match #382770',
      mode: 'Har Players Ki Choice – Fast Withdrawal',
      map: 'Purgatory',
      teamType: 'Squad',
      entryFee: 8,
      prizePool: 350,
      perKill: 7,
      maxSlots: 48,
      filledSlots: 36,
      takenPositions: Array.from({ length: 36 }, (_, i) => i + 1),
      startTime: '22/11/2026 · 03:15 pm',
      dateLabel: '22/11/2026',
      timeLabel: '03:15 pm',
      status: 'UPCOMING',
      roomId: '99201451',
      roomPassword: 'BOOY',
      joinedUsers: [],
    },
    {
      id: 'match-br-103',
      categoryId: 'cat-battle-royale',
      title: 'SQUAD – Per Kill + Top Prize | Ryden BAN - Match #382761',
      mode: 'Har Players Ki Choice – Fast Withdrawal',
      map: 'Bermuda',
      teamType: 'Squad',
      entryFee: 8,
      prizePool: 350,
      perKill: 7,
      maxSlots: 48,
      filledSlots: 48,
      takenPositions: Array.from({ length: 48 }, (_, i) => i + 1),
      startTime: '22/11/2026 · 01:20 pm',
      dateLabel: '22/11/2026',
      timeLabel: '01:20 pm',
      status: 'ONGOING',
      roomId: '66190233',
      roomPassword: 'SQ48',
      joinedUsers: [],
    },
    {
      id: 'match-br-104',
      categoryId: 'cat-battle-royale',
      title: 'SOLO – Per Kill + Top Prize | Ryden BAN - Match #382746',
      mode: 'Har Players Ki Choice – Fast Withdrawal',
      map: 'Bermuda',
      teamType: 'Solo',
      entryFee: 7,
      prizePool: 310,
      perKill: 6,
      maxSlots: 48,
      filledSlots: 48,
      takenPositions: Array.from({ length: 48 }, (_, i) => i + 1),
      startTime: '22/11/2026 · 01:50 pm',
      dateLabel: '22/11/2026',
      timeLabel: '01:50 pm',
      status: 'ONGOING',
      roomId: '77192044',
      roomPassword: 'SL48',
      joinedUsers: [],
    },
    {
      id: 'match-br-res-382745',
      categoryId: 'cat-battle-royale',
      title: 'SOLO – Per Kill + Top Prize | Ryden BAN - Match #382745',
      mode: 'Har Players Ki Choice – Fast Withdrawal',
      map: 'Bermuda',
      teamType: 'Solo',
      entryFee: 7,
      prizePool: 310,
      perKill: 6,
      maxSlots: 48,
      filledSlots: 48,
      takenPositions: Array.from({ length: 48 }, (_, i) => i + 1),
      startTime: '22/11/2026 · 12:50 pm',
      dateLabel: '22/11/2026',
      timeLabel: '12:50 pm',
      status: 'RESULTS',
      winnerUsername: 'ROHITIM',
      roomId: '88274510',
      roomPassword: 'RES1',
      results: [
        { rank: 1, playerName: 'ROHITIM', kills: 4, winning: 34 },
        { rank: 2, playerName: 'AS N?GATO', kills: 4, winning: 24 },
        { rank: 3, playerName: 'asif', kills: 4, winning: 24 },
        { rank: 4, playerName: 'SHIVʀM__Ꮼ', kills: 2, winning: 22 },
        { rank: 5, playerName: 'IsHxCHETRI', kills: 3, winning: 18 },
        { rank: 6, playerName: 'To!d  Ovr¿', kills: 3, winning: 18 },
        { rank: 7, playerName: 'AV STRIKE', kills: 3, winning: 18 },
        { rank: 8, playerName: 'ᴍɪɴᴀᴛᴏᴴ⁴ˣ', kills: 3, winning: 18 },
        { rank: 9, playerName: '?AaDaRSH?', kills: 3, winning: 18 },
        { rank: 10, playerName: 'Levi Xco !!', kills: 2, winning: 12 },
        { rank: 11, playerName: '⌧KESHAV࿐모', kills: 2, winning: 12 },
      ],
      joinedUsers: [],
    },
    {
      id: 'match-br-res-382760',
      categoryId: 'cat-battle-royale',
      title: 'SQUAD – Per Kill + Top Prize | Ryden BAN - Match #382760',
      mode: 'Har Players Ki Choice – Fast Withdrawal',
      map: 'Bermuda',
      teamType: 'Squad',
      entryFee: 8,
      prizePool: 350,
      perKill: 7,
      maxSlots: 48,
      filledSlots: 48,
      takenPositions: Array.from({ length: 48 }, (_, i) => i + 1),
      startTime: '22/11/2026 · 12:20 pm',
      dateLabel: '22/11/2026',
      timeLabel: '12:20 pm',
      status: 'RESULTS',
      winnerUsername: 'rajib_boy_gamee',
      roomId: '88276022',
      roomPassword: 'RES2',
      results: [
        { rank: 1, playerName: 'rajib_boy_gamee', kills: 6, winning: 52 },
        { rank: 2, playerName: 'flexerxi', kills: 5, winning: 35 },
        { rank: 3, playerName: 'ironman11', kills: 4, winning: 28 },
        { rank: 4, playerName: 'JERRYff..', kills: 4, winning: 28 },
        { rank: 5, playerName: 'SUDAIS9990', kills: 3, winning: 21 },
        { rank: 6, playerName: 'fxaryanff', kills: 3, winning: 21 },
        { rank: 7, playerName: 'ZEXISTEY', kills: 2, winning: 14 },
        { rank: 8, playerName: 'AryanRajput90', kills: 2, winning: 14 },
      ],
      joinedUsers: [],
    },
    {
      id: 'match-br-105',
      categoryId: 'cat-battle-royale',
      title: 'SOLO – Per Kill + Top Prize | Ryden BAN - Match #382711',
      mode: 'Har Players Ki Choice – Fast Withdrawal',
      map: 'Bermuda',
      teamType: 'Solo',
      entryFee: 7,
      prizePool: 310,
      perKill: 6,
      maxSlots: 48,
      filledSlots: 48,
      takenPositions: Array.from({ length: 48 }, (_, i) => i + 1),
      startTime: '21/11/2026 · 10:50 am',
      dateLabel: '21/11/2026',
      timeLabel: '10:50 am',
      status: 'RESULTS',
      winnerUsername: '@stormff',
      roomId: '55190288',
      roomPassword: 'DONE',
      results: [
        { rank: 1, playerName: '@stormff', kills: 5, winning: 40 },
        { rank: 2, playerName: 'SAILAKSH', kills: 4, winning: 24 },
        { rank: 3, playerName: 'Bgh✿Alina࿐', kills: 3, winning: 18 },
        { rank: 4, playerName: 'RUDRA_FF', kills: 3, winning: 18 },
        { rank: 5, playerName: 'TOXIC_KING', kills: 2, winning: 12 },
      ],
      joinedUsers: [],
    },
    {
      id: 'match-surv-201',
      categoryId: 'cat-ff-survival',
      title: 'FF Survival Zone Blitz #201',
      mode: 'Survival · Rank Rules',
      map: 'Nexterra',
      teamType: 'Solo',
      entryFee: 10,
      prizePool: 350,
      perKill: 7,
      maxSlots: 48,
      filledSlots: 29,
      startTime: 'Today · 10:00 PM',
      status: 'UPCOMING',
      roomId: '77419022',
      roomPassword: 'SURV',
      joinedUsers: [],
    },
    {
      id: 'match-lw-heal',
      categoryId: 'cat-loss-heal-lw',
      title: 'Loss / Heal Lone Wolf #304',
      mode: 'Lone Wolf · Unlimited Gloo',
      map: 'Iron Cage',
      teamType: '1v1',
      entryFee: 10,
      prizePool: 18,
      perKill: 0,
      maxSlots: 2,
      filledSlots: 1,
      startTime: 'Today · 09:35 PM',
      status: 'UPCOMING',
      roomId: '55192011',
      roomPassword: 'LW10',
      joinedUsers: [],
    },
    {
      id: 'match-cs-1v1',
      categoryId: 'cat-cs-lw-1v1',
      title: 'CS / LW 1v1 Desert Eagle #402',
      mode: 'Clash Squad · 1v1',
      map: 'Clash Arena',
      teamType: '1v1',
      entryFee: 10,
      prizePool: 18,
      perKill: 0,
      maxSlots: 2,
      filledSlots: 1,
      startTime: 'Today · 09:40 PM',
      status: 'UPCOMING',
      roomId: '61904412',
      roomPassword: 'DEAG',
      joinedUsers: [],
    },
    {
      id: 'match-cs-2v2',
      categoryId: 'cat-cs-lw-2v2',
      title: 'CS / LW 2v2 Fast Cup #409',
      mode: 'Clash Squad · 2v2',
      map: 'Factory',
      teamType: '2v2',
      entryFee: 10,
      prizePool: 36,
      perKill: 0,
      maxSlots: 4,
      filledSlots: 2,
      startTime: 'Today · 10:15 PM',
      status: 'UPCOMING',
      roomId: '32098811',
      roomPassword: 'DUO2',
      joinedUsers: [],
    },
    {
      id: 'match-10-only',
      categoryId: 'cat-10-only',
      title: '₹10 Mega Solo Drop #501',
      mode: 'Classic · ₹10 Only',
      map: 'Bermuda Remastered',
      teamType: 'Solo',
      entryFee: 10,
      prizePool: 420,
      perKill: 8,
      maxSlots: 48,
      filledSlots: 39,
      startTime: 'Today · 10:45 PM',
      status: 'UPCOMING',
      roomId: '44901283',
      roomPassword: 'TENX',
      joinedUsers: [],
    },
    {
      id: 'match-head-1v1',
      categoryId: 'cat-only-head-1v1',
      title: 'Only Headshot 1v1 One-Tap #601',
      mode: 'Headshot Only · No Vest',
      map: 'Iron Cage',
      teamType: '1v1',
      entryFee: 10,
      prizePool: 19,
      perKill: 0,
      maxSlots: 2,
      filledSlots: 1,
      startTime: 'Today · 09:50 PM',
      status: 'UPCOMING',
      roomId: '71928311',
      roomPassword: 'HEAD',
      joinedUsers: [],
    },
    {
      id: 'match-head-2v2',
      categoryId: 'cat-only-head-2v2',
      title: 'Only Head 2v2 Snipers & M1887 #608',
      mode: 'Headshot Only · 2v2',
      map: 'Clock Tower',
      teamType: '2v2',
      entryFee: 15,
      prizePool: 54,
      perKill: 0,
      maxSlots: 4,
      filledSlots: 2,
      startTime: 'Today · 11:00 PM',
      status: 'UPCOMING',
      roomId: '88291044',
      roomPassword: 'TAP2',
      joinedUsers: [],
    },
    {
      id: 'match-low-mix',
      categoryId: 'cat-low-mix-2v2',
      title: 'Low Mix 2v2 Custom #702',
      mode: 'Low Mix · Limited Ammo',
      map: 'Mill',
      teamType: '2v2',
      entryFee: 10,
      prizePool: 35,
      perKill: 0,
      maxSlots: 4,
      filledSlots: 3,
      startTime: 'Today · 10:20 PM',
      status: 'UPCOMING',
      roomId: '11092834',
      roomPassword: 'MIX2',
      joinedUsers: [],
    },
    {
      id: 'match-gun-pro',
      categoryId: 'cat-gun-pro',
      title: 'Gun Pro Mystery Loadout #801',
      mode: 'Gun Pro · Random Arms',
      map: 'Kalahari',
      teamType: '1v1',
      entryFee: 10,
      prizePool: 18,
      perKill: 0,
      maxSlots: 2,
      filledSlots: 1,
      startTime: 'Today · 10:10 PM',
      status: 'UPCOMING',
      roomId: '66201944',
      roomPassword: 'GUNP',
      joinedUsers: [],
    },
    {
      id: 'match-cs-4v4',
      categoryId: 'cat-cs-4v4',
      title: 'CS 4v4 Championship Scrim #901',
      mode: 'Clash Squad · 4v4',
      map: 'Bermuda CS',
      teamType: '4v4',
      entryFee: 10,
      prizePool: 72,
      perKill: 0,
      maxSlots: 8,
      filledSlots: 5,
      startTime: 'Today · 11:15 PM',
      status: 'UPCOMING',
      roomId: '90817263',
      roomPassword: 'CS44',
      joinedUsers: [],
    },
    {
      id: 'match-free-001',
      categoryId: 'cat-free-match',
      title: 'Free Match Practice Arena #1001',
      mode: 'Free Entry · Win Coins',
      map: 'Bermuda',
      teamType: 'Solo',
      entryFee: 0,
      prizePool: 100,
      perKill: 2,
      maxSlots: 48,
      filledSlots: 28,
      startTime: 'Today · 09:55 PM',
      status: 'UPCOMING',
      roomId: '10293847',
      roomPassword: 'FREE',
      joinedUsers: [],
    },
    {
      id: 'match-giveaway-01',
      categoryId: 'cat-giveaway-sc',
      title: 'SkillBattle Night Giveaway #1101',
      mode: 'Special Giveaway · Squad',
      map: 'Bermuda',
      teamType: 'Squad',
      entryFee: 0,
      prizePool: 500,
      perKill: 5,
      maxSlots: 48,
      filledSlots: 42,
      startTime: 'Today · 11:30 PM',
      status: 'UPCOMING',
      roomId: '77788899',
      roomPassword: 'GIFT',
      joinedUsers: [],
    },
    {
      id: 'match-pvt-01',
      categoryId: 'cat-pvt-contest',
      title: 'Private 1v1 Duel Room #PVT1',
      mode: 'Private Contest · FairPlay ON',
      map: 'Iron Cage',
      teamType: '1v1',
      entryFee: 10,
      prizePool: 18,
      perKill: 0,
      maxSlots: 2,
      filledSlots: 1,
      startTime: 'Open Now',
      status: 'UPCOMING',
      roomId: '45019283',
      roomPassword: 'PVT9',
      isPrivate: true,
      inviteCode: 'SC-PVT99',
      hostUsername: 'devilyt',
      joinedUsers: [],
    },
  ];

  const transactions: WalletTransaction[] = [
    {
      id: 'tx-seed-1',
      userId: demoUser.id,
      type: 'WINNING',
      amount: 6,
      title: 'Bermuda Classic Kill Reward',
      upiOrRef: 'SC-WIN-8821',
      status: 'SUCCESS',
      createdAt: new Date(Date.now() - 86400 * 1000).toISOString(),
    },
    {
      id: 'tx-seed-2',
      userId: demoUser.id,
      type: 'BONUS',
      amount: 4,
      title: 'Signup FairPlay Bonus',
      upiOrRef: 'SC-BON-1001',
      status: 'SUCCESS',
      createdAt: new Date(Date.now() - 172800 * 1000).toISOString(),
    },
  ];

  const leaderboard: LeaderboardEntry[] = [
    { rank: 1, username: '@stormff', matches: 96, kills: 342, winnings: 2812, tier: 'Grandmaster' },
    { rank: 2, username: 'rajib_boy_gamee', matches: 84, kills: 298, winnings: 2441, tier: 'Grandmaster' },
    { rank: 3, username: 'flexerxi', matches: 79, kills: 271, winnings: 2386, tier: 'Heroic' },
    { rank: 4, username: 'ironman11', matches: 72, kills: 249, winnings: 2302, tier: 'Heroic' },
    { rank: 5, username: 'JERRYff..', matches: 69, kills: 241, winnings: 2287, tier: 'Heroic' },
    { rank: 6, username: 'SUDAIS9990', matches: 67, kills: 230, winnings: 2270, tier: 'Diamond' },
    { rank: 7, username: 'fxaryanff', matches: 61, kills: 215, winnings: 2131, tier: 'Diamond' },
    { rank: 8, username: 'ZEXISTEY', matches: 59, kills: 204, winnings: 2113, tier: 'Diamond' },
    { rank: 9, username: 'AryanRajput90', matches: 58, kills: 199, winnings: 2107, tier: 'Platinum' },
    { rank: 10, username: 'SAILAKSH', matches: 53, kills: 186, winnings: 2016, tier: 'Platinum' },
  ];

  const matchStats: MatchStatEntry[] = [
    {
      id: 'stat-1',
      userId: demoUser.id,
      matchInfo: 'SOLO - Per Kill + Top Prize | Ryden BAN - Match #382724',
      dateTime: '21/11/2026 11:50 pm',
      paid: 7,
      won: 0,
      createdAt: '2026-11-21T23:50:00.000Z',
    },
    {
      id: 'stat-2',
      userId: demoUser.id,
      matchInfo: 'SOLO - Per Kill + Top Prize | Ryden BAN - Match #382723',
      dateTime: '21/11/2026 10:50 pm',
      paid: 7,
      won: 0,
      createdAt: '2026-11-21T22:50:00.000Z',
    },
    {
      id: 'stat-3',
      userId: demoUser.id,
      matchInfo: 'SOLO - Per Kill + Top Prize | Ryden BAN - Match #382720',
      dateTime: '21/11/2026 07:50 pm',
      paid: 7,
      won: 0,
      createdAt: '2026-11-21T19:50:00.000Z',
    },
    {
      id: 'stat-4',
      userId: demoUser.id,
      matchInfo: 'SOLO - Per Kill + Top Prize | Ryden BAN - Match #382711',
      dateTime: '21/11/2026 10:50 am',
      paid: 7,
      won: 0,
      createdAt: '2026-11-21T10:50:00.000Z',
    },
    {
      id: 'stat-5',
      userId: demoUser.id,
      matchInfo: 'SOLO - Per Kill + Top Prize | Ryden BAN - Match #381695',
      dateTime: '15/11/2026 06:50 pm',
      paid: 7,
      won: 0,
      createdAt: '2026-11-15T18:50:00.000Z',
    },
    {
      id: 'stat-6',
      userId: demoUser.id,
      matchInfo: 'SQUAD - Per Kill + Top Prize | Ryden BAN - Match #381681',
      dateTime: '14/11/2026 09:20 pm',
      paid: 8,
      won: 0,
      createdAt: '2026-11-14T21:20:00.000Z',
    },
    {
      id: 'stat-7',
      userId: demoUser.id,
      matchInfo: 'SQUAD - Per Kill + Top Prize | Ryden BAN - Match #370153',
      dateTime: '31/10/2026 11:20 am',
      paid: 8,
      won: 0,
      createdAt: '2026-10-31T11:20:00.000Z',
    },
    {
      id: 'stat-8',
      userId: demoUser.id,
      matchInfo: 'SOLO - Per Kill + Top Prize | Ryden BAN - Match #370149',
      dateTime: '30/10/2026 10:50 pm',
      paid: 7,
      won: 0,
      createdAt: '2026-10-30T22:50:00.000Z',
    },
    {
      id: 'stat-9',
      userId: demoUser.id,
      matchInfo: 'SOLO - Per Kill + Top Prize | Ryden BAN - Match #370147',
      dateTime: '30/10/2026 08:50 pm',
      paid: 7,
      won: 6,
      createdAt: '2026-10-30T20:50:00.000Z',
    },
  ];

  const feedbacks: FeedbackEntry[] = [
    {
      id: 'fb-1',
      username: 'GamingGuru',
      rating: 4,
      comment: 'Good platform but needs more game',
      createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    },
    {
      id: 'fb-2',
      username: 'devilyt',
      rating: 5,
      comment: 'Instant UPI withdrawal & clean 1v1 custom rooms!',
      createdAt: new Date(Date.now() - 3600 * 1000 * 14).toISOString(),
    },
  ];

  const recentWithdrawals: WithdrawalTicker[] = [
    { id: 'wd-1', username: 'devilyt', amount: 250, verified: true, timeAgo: '2m ago' },
    { id: 'wd-2', username: 'raistar.sc', amount: 180, verified: true, timeAgo: '14m ago' },
    { id: 'wd-3', username: 'ankush_ff', amount: 120, verified: true, timeAgo: '29m ago' },
  ];

  const announcements: AnnouncementItem[] = [
    {
      id: 'ann-1',
      title: 'Follow The Rules → Enjoy Fair Gameplay ♦ SkillBattle = Safe, Secure & Trusted ♦',
      body: '100% FairPlay anti-hack monitoring is active across all Battle Royale, Lone Wolf & Clash Squad rooms. Instant UPI payouts processed daily.',
      date: '2026-11-22',
      pinned: true,
    },
    {
      id: 'ann-2',
      title: 'Create & Earn ₹250 YT Shorts Challenge',
      body: 'Upload your SkillBattle gameplay or highlight clip on YouTube Shorts. Hit 5,000+ views and submit your link in the More tab to claim ₹250!',
      date: '2026-11-21',
    },
  ];

  return {
    users: [demoUser],
    sessions: [],
    sessionSecret: crypto.randomBytes(32).toString('hex'),
    categories,
    matches,
    transactions,
    leaderboard,
    matchStats,
    feedbacks,
    recentWithdrawals,
    announcements,
    promoSubmissions: [],
  };
}

function loadDatabase(): DatabaseState {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    const initial = seedInitialState();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw) as DatabaseState;
    const seed = seedInitialState();
    parsed.users = parsed.users.map((u) => {
      if (typeof u.depositedBalance !== 'number' || typeof u.winningBalance !== 'number') {
        const win = u.username === 'chhatish.ff' ? 6 : Math.min(u.balance, u.amountWon || 0);
        const dep = Number(Math.max(0, u.balance - win).toFixed(2));
        return {
          ...u,
          depositedBalance: dep,
          winningBalance: Number(win.toFixed(2)),
          bonusBalance: typeof u.bonusBalance === 'number' ? u.bonusBalance : 0,
          coins: typeof u.coins === 'number' ? u.coins : 0,
          payoutsCount: typeof u.payoutsCount === 'number' ? u.payoutsCount : 0,
          totalWithdrawals: typeof u.totalWithdrawals === 'number' ? u.totalWithdrawals : 0,
          balance: Number((dep + win + (typeof u.bonusBalance === 'number' ? u.bonusBalance : 0)).toFixed(2)),
        };
      }
      return {
        ...u,
        bonusBalance: typeof u.bonusBalance === 'number' ? u.bonusBalance : 0,
        coins: typeof u.coins === 'number' ? u.coins : 0,
        payoutsCount: typeof u.payoutsCount === 'number' ? u.payoutsCount : 0,
        totalWithdrawals: typeof u.totalWithdrawals === 'number' ? u.totalWithdrawals : 0,
      };
    });
    if (!Array.isArray(parsed.matchStats) || parsed.matchStats.length === 0) {
      parsed.matchStats = seed.matchStats;
    }
    if (!Array.isArray(parsed.leaderboard) || parsed.leaderboard.length < 10) {
      parsed.leaderboard = seed.leaderboard;
    }
    parsed.announcements = (parsed.announcements || []).map((a) => ({
      ...a,
      title:
        a.id === 'ann-1'
          ? 'Follow The Rules → Enjoy Fair Gameplay ♦ SkillBattle = Safe, Secure & Trusted ♦'
          : a.title.replace(/SkillClash/g, 'SkillBattle'),
      body: a.body.replace(/SkillClash/g, 'SkillBattle'),
    }));
    parsed.matches = (parsed.matches || []).map((m) => {
      const seedMatch = seed.matches.find((sm) => sm.id === m.id);
      if (m.id === 'match-br-101' && seedMatch) {
        return {
          ...seedMatch,
          joinedUsers: m.joinedUsers || [],
          takenPositions: m.takenPositions?.length ? m.takenPositions : seedMatch.takenPositions,
          filledSlots: Math.max(seedMatch.filledSlots, m.joinedUsers?.length || 0),
        };
      }
      return {
        ...m,
        title: m.title.replace(/SkillClash/g, 'SkillBattle'),
        results: m.results?.length ? m.results : seedMatch?.results,
      };
    });
    for (const seedMatch of seed.matches) {
      if (!parsed.matches.some((m) => m.id === seedMatch.id)) {
        if (seedMatch.status === 'RESULTS') {
          parsed.matches.unshift(seedMatch);
        } else {
          parsed.matches.push(seedMatch);
        }
      }
    }
    // Keep Match #382745 and #382760 ordered cleanly ahead of older results
    const priorityOrder = ['match-br-res-382745', 'match-br-res-382760'];
    parsed.matches.sort((a, b) => {
      const ia = priorityOrder.indexOf(a.id);
      const ib = priorityOrder.indexOf(b.id);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return 0;
    });
    let needsSessionPersist = false;
    if (!Array.isArray(parsed.sessions)) {
      parsed.sessions = [];
      needsSessionPersist = true;
    } else {
      const now = Date.now();
      const validSessions = parsed.sessions.filter(
        (s) => s && typeof s.expiresAt === 'number' && s.expiresAt > now,
      );
      if (validSessions.length !== parsed.sessions.length) {
        parsed.sessions = validSessions;
        needsSessionPersist = true;
      }
    }
    if (!parsed.sessionSecret || typeof parsed.sessionSecret !== 'string') {
      parsed.sessionSecret = crypto.randomBytes(32).toString('hex');
      needsSessionPersist = true;
    }
    if (needsSessionPersist) {
      const tmpPath = `${DB_FILE}.${process.pid}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(parsed, null, 2), 'utf8');
      fs.renameSync(tmpPath, DB_FILE);
    }
    return parsed;
  } catch {
    const initial = seedInitialState();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
}

let db: DatabaseState = loadDatabase();

function saveDatabase(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmpPath = `${DB_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmpPath, DB_FILE);
}

interface AuthedRequest extends Request {
  user?: StoredUser;
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const token = header.slice(7).trim();
  const userId = verifyToken(token);
  if (!userId) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }
  const found = db.users.find((u) => u.id === userId);
  if (!found) {
    res.status(401).json({ error: 'Account not found' });
    return;
  }
  req.user = found;
  next();
}

function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const userId = verifyToken(header.slice(7).trim());
    if (userId) {
      req.user = db.users.find((u) => u.id === userId);
    }
  }
  next();
}

const TEN_MINUTES_MS = 10 * 60 * 1000;

function parseIstStartTimeMs(match: TournamentMatch): number | null {
  if (match.startsAt) {
    const ms = new Date(match.startsAt).getTime();
    if (!Number.isNaN(ms)) return ms;
  }

  // Format 1: DD/MM/YYYY + hh:mm am/pm (IST +05:30)
  const combined =
    match.dateLabel && match.timeLabel ? `${match.dateLabel} · ${match.timeLabel}` : match.startTime;

  const dmyMatch = combined.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s*[·•-]?\s*(\d{1,2}):(\d{2})\s*(am|pm)$/i,
  );
  if (dmyMatch) {
    const [, dd, mm, yyyy, hhRaw, minStr, ampm] = dmyMatch;
    let hh = Number(hhRaw);
    if (ampm.toLowerCase() === 'pm' && hh < 12) hh += 12;
    if (ampm.toLowerCase() === 'am' && hh === 12) hh = 0;
    const iso = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}T${String(hh).padStart(2, '0')}:${minStr}:00+05:30`;
    const ms = new Date(iso).getTime();
    return Number.isNaN(ms) ? null : ms;
  }

  // Format 2: "Today · 09:35 PM" in IST (+05:30)
  const todayMatch = combined.match(/^Today\s*[·•-]?\s*(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (todayMatch) {
    const [, hhRaw, minStr, ampm] = todayMatch;
    let hh = Number(hhRaw);
    if (ampm.toLowerCase() === 'pm' && hh < 12) hh += 12;
    if (ampm.toLowerCase() === 'am' && hh === 12) hh = 0;

    const istDateParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const iso = `${istDateParts}T${String(hh).padStart(2, '0')}:${minStr}:00+05:30`;
    const ms = new Date(iso).getTime();
    return Number.isNaN(ms) ? null : ms;
  }

  return null;
}

function sanitizeMatchesForUser(matches: TournamentMatch[], userId?: string) {
  const now = Date.now();
  return matches.map((m) => {
    const hasJoined = Boolean(userId && m.joinedUsers.some((j) => j.userId === userId));
    const isInstantPrivate = Boolean(m.isPrivate || m.startTime === 'Open Now');
    const startsMs = isInstantPrivate ? null : parseIstStartTimeMs(m);
    const revealMs = startsMs !== null ? startsMs - TEN_MINUTES_MS : null;

    const isRevealWindowOpen =
      isInstantPrivate ||
      m.status !== 'UPCOMING' ||
      revealMs === null ||
      now >= revealMs;

    const roomRevealed = hasJoined && isRevealWindowOpen;

    return {
      ...m,
      startsAt: startsMs !== null ? new Date(startsMs).toISOString() : m.startsAt,
      revealAt: revealMs !== null ? new Date(revealMs).toISOString() : undefined,
      roomRevealed,
      roomId: roomRevealed ? m.roomId : hasJoined ? 'Reveals 10m before' : 'Join to Reveal',
      roomPassword: roomRevealed ? m.roomPassword : '••••',
    };
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '512kb' }));
  let broadcastLiveEvent: (payload: Record<string, unknown>) => void = () => {};

  // Auth routes
  app.get('/api/auth/session', requireAuth, (req: AuthedRequest, res: Response) => {
    res.json({ valid: true, user: sanitizeUser(req.user!) });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      revokeSessionByToken(header.slice(7).trim());
    }
    res.json({ ok: true, message: 'Logged out successfully' });
  });

  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { firstName, lastName, username, countryCode, mobile, email, referralCode, password } =
      req.body ?? {};
    if (
      typeof firstName !== 'string' ||
      typeof lastName !== 'string' ||
      typeof username !== 'string' ||
      typeof password !== 'string'
    ) {
      res.status(400).json({ error: 'First Name, Last Name, Username, and Password are required' });
      return;
    }

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    if (!cleanFirstName || !cleanLastName) {
      res.status(400).json({ error: 'First Name and Last Name cannot be empty' });
      return;
    }

    const cleanUsername = username.trim();
    const cleanUsernameLower = cleanUsername.toLowerCase();
    if (cleanUsername.length < 1 || cleanUsername.length > 40) {
      res.status(400).json({ error: 'Please enter a valid username (1–40 characters)' });
      return;
    }

    const cleanCountryCode =
      typeof countryCode === 'string' && countryCode.trim() ? countryCode.trim().slice(0, 6) : '+91';
    const cleanMobile = typeof mobile === 'string' ? mobile.replace(/\D/g, '').slice(0, 15) : '';
    if (cleanMobile.length < 7 || cleanMobile.length > 15) {
      res.status(400).json({ error: 'Please enter a valid mobile number (7–15 digits)' });
      return;
    }

    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase().slice(0, 100) : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address' });
      return;
    }

    if (password.length < 1) {
      res.status(400).json({ error: 'Password cannot be empty' });
      return;
    }

    if (db.users.some((u) => u.username.trim().toLowerCase() === cleanUsernameLower)) {
      res.status(409).json({ error: 'Username is already registered' });
      return;
    }
    if (db.users.some((u) => u.email && u.email.toLowerCase() === cleanEmail)) {
      res.status(409).json({ error: 'Email address is already registered' });
      return;
    }
    const cleanCountryDigits = cleanCountryCode.replace(/\D/g, '');
    if (
      db.users.some((u) => {
        if (!u.mobile) return false;
        const uDigits = u.mobile.replace(/\D/g, '');
        const uFull = `${(u.countryCode || '').replace(/\D/g, '')}${uDigits}`;
        return uDigits === cleanMobile || uFull === `${cleanCountryDigits}${cleanMobile}`;
      })
    ) {
      res.status(409).json({ error: 'Mobile number is already registered' });
      return;
    }

    const cleanReferral = typeof referralCode === 'string' ? referralCode.trim().toUpperCase() : '';
    const referrer = cleanReferral
      ? db.users.find(
          (u) =>
            u.myReferralCode.toUpperCase() === cleanReferral ||
            u.username.trim().toUpperCase() === cleanReferral,
        )
      : undefined;

    const salt = crypto.randomBytes(16).toString('hex');
    let newUserId = `user-${crypto.randomUUID().slice(0, 12)}`;
    while (db.users.some((u) => u.id === newUserId)) {
      newUserId = `user-${crypto.randomUUID().slice(0, 12)}`;
    }

    const refPrefix = cleanUsername.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase().padEnd(3, 'X');

    const newUser: StoredUser = {
      id: newUserId,
      firstName: cleanFirstName.slice(0, 40),
      lastName: cleanLastName.slice(0, 40),
      username: cleanUsername,
      countryCode: cleanCountryCode,
      mobile: cleanMobile,
      email: cleanEmail,
      referralCode: cleanReferral,
      myReferralCode: `SC${refPrefix}${Math.floor(100 + Math.random() * 899)}`,
      rankTitle: 'Contender',
      level: 1,
      balance: 0,
      depositedBalance: 0,
      winningBalance: 0,
      bonusBalance: 0,
      coins: 0,
      payoutsCount: 0,
      totalWithdrawals: 0,
      matchesPlayed: 0,
      totalKilled: 0,
      amountWon: 0,
      winRate: 0,
      darkMode: false,
      language: 'en',
      referredCount: 0,
      referralEarnings: 0,
      luckyDrawLastSpinAt: null,
      passwordSalt: salt,
      passwordHash: hashPassword(password, salt),
    };

    db.users.push(newUser);

    if (referrer) {
      referrer.referredCount += 1;
    }

    saveDatabase();
    const token = createToken(newUser.id);
    res.status(201).json({ token, user: sanitizeUser(newUser) });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const rawIdentifier = req.body?.identifier ?? req.body?.username;
    const password = req.body?.password;
    if (typeof rawIdentifier !== 'string' || !rawIdentifier.trim() || typeof password !== 'string') {
      res.status(400).json({ error: 'Username, email, or mobile number and password are required' });
      return;
    }
    const user = findUserByIdentifier(rawIdentifier);
    if (!user) {
      res.status(404).json({ error: 'Account not found. Please create an account.' });
      return;
    }
    if (!verifyPassword(password, user.passwordSalt, user.passwordHash)) {
      res.status(401).json({ error: 'Incorrect password. Please try again.' });
      return;
    }
    const token = createToken(user.id);
    res.json({ token, user: sanitizeUser(user) });
  });

  app.post('/api/auth/reset-password', (req: Request, res: Response) => {
    const rawIdentifier =
      req.body?.identifier ?? req.body?.username ?? req.body?.email ?? req.body?.mobile;
    const newPassword = req.body?.newPassword ?? req.body?.password;
    const confirmPassword = req.body?.confirmPassword;
    if (
      typeof rawIdentifier !== 'string' ||
      !rawIdentifier.trim() ||
      typeof newPassword !== 'string' ||
      newPassword.length < 1
    ) {
      res.status(400).json({ error: 'Valid account identifier and new password are required' });
      return;
    }
    if (typeof confirmPassword === 'string' && confirmPassword !== newPassword) {
      res.status(400).json({ error: 'New password and confirm password do not match' });
      return;
    }
    const user = findUserByIdentifier(rawIdentifier);
    if (!user) {
      res.status(404).json({ error: 'Account not found. Please check your username, email, or mobile number.' });
      return;
    }
    const salt = crypto.randomBytes(16).toString('hex');
    user.passwordSalt = salt;
    user.passwordHash = hashPassword(newPassword, salt);
    revokeAllUserSessions(user.id);
    saveDatabase();
    res.json({
      ok: true,
      identifier: user.username,
      message: 'Password updated successfully. You can login now.',
    });
  });

  // Public + contextual overview data
  app.get('/api/bootstrap', optionalAuth, (req: AuthedRequest, res: Response) => {
    res.json({
      categories: db.categories,
      matches: sanitizeMatchesForUser(db.matches, req.user?.id),
      leaderboard: db.leaderboard,
      feedbacks: db.feedbacks,
      recentWithdrawals: db.recentWithdrawals,
      announcements: db.announcements,
    });
  });

  app.get('/api/me', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const transactions = db.transactions.filter((t) => t.userId === user.id);
    const matchStats = db.matchStats.filter((s) => s.userId === user.id);
    const joinedMatches = sanitizeMatchesForUser(
      db.matches.filter((m) => m.joinedUsers.some((j) => j.userId === user.id)),
      user.id,
    );
    res.json({
      user: sanitizeUser(user),
      transactions,
      matchStats,
      joinedMatches,
    });
  });

  app.patch('/api/me', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const {
      firstName,
      lastName,
      countryCode,
      mobile,
      email,
      darkMode,
      language,
      dateOfBirth,
      gender,
      avatarPreset,
      avatarUrl,
      savedGameName,
      savedGameUid,
    } = req.body ?? {};
    if (typeof firstName === 'string') {
      user.firstName = firstName.trim().slice(0, 40);
    }
    if (typeof lastName === 'string') {
      user.lastName = lastName.trim().slice(0, 40);
    }
    if (typeof countryCode === 'string' && countryCode.trim()) {
      user.countryCode = countryCode.trim().slice(0, 6);
    }
    if (typeof mobile === 'string') {
      const nextMobile = mobile.replace(/\D/g, '').slice(0, 15);
      if (nextMobile && nextMobile.length < 7) {
        res.status(400).json({ error: 'Please enter a valid mobile number (7–15 digits)' });
        return;
      }
      if (
        nextMobile &&
        db.users.some((u) => u.id !== user.id && u.mobile && u.mobile.replace(/\D/g, '') === nextMobile)
      ) {
        res.status(409).json({ error: 'Mobile number is already linked to another account' });
        return;
      }
      user.mobile = nextMobile;
    }
    if (typeof email === 'string') {
      const nextEmail = email.trim().toLowerCase().slice(0, 100);
      if (nextEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
        res.status(400).json({ error: 'Please enter a valid email address' });
        return;
      }
      if (
        nextEmail &&
        db.users.some((u) => u.id !== user.id && u.email && u.email.toLowerCase() === nextEmail)
      ) {
        res.status(409).json({ error: 'Email address is already linked to another account' });
        return;
      }
      user.email = nextEmail;
    }
    if (typeof darkMode === 'boolean') {
      user.darkMode = darkMode;
    }
    if (language === 'en' || language === 'hi') {
      user.language = language as AppLanguage;
    }
    if (typeof dateOfBirth === 'string') {
      user.dateOfBirth = dateOfBirth.trim().slice(0, 20);
    }
    if (gender === 'Male' || gender === 'Female') {
      user.gender = gender;
    }
    if (typeof avatarPreset === 'string' && avatarPreset.trim()) {
      user.avatarPreset = avatarPreset.trim().slice(0, 30);
    }
    if (typeof savedGameName === 'string') {
      const cleanGameName = savedGameName.trim().slice(0, 30);
      if (cleanGameName.length >= 2) {
        user.savedGameName = cleanGameName;
      }
    }
    if (typeof savedGameUid === 'string') {
      const cleanGameUid = savedGameUid.trim();
      if (/^\d{6,14}$/.test(cleanGameUid)) {
        user.savedGameUid = cleanGameUid;
      }
    }
    if (avatarUrl === null || avatarUrl === '') {
      user.avatarUrl = undefined;
    } else if (typeof avatarUrl === 'string') {
      const trimmedAvatar = avatarUrl.trim();
      const isValidDataImage = /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(
        trimmedAvatar,
      );
      if (!isValidDataImage || trimmedAvatar.length > 320_000) {
        res.status(400).json({ error: 'Please select a valid image under 250 KB.' });
        return;
      }
      user.avatarUrl = trimmedAvatar;
    }
    saveDatabase();
    res.json({ user: sanitizeUser(user) });
  });

  app.post('/api/me/change-password', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const { oldPassword, newPassword } = req.body ?? {};
    if (typeof oldPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 1) {
      res.status(400).json({ error: 'Old password and a new password are required.' });
      return;
    }
    if (!verifyPassword(oldPassword, user.passwordSalt, user.passwordHash)) {
      res.status(400).json({ error: 'Old password is incorrect.' });
      return;
    }
    const salt = crypto.randomBytes(16).toString('hex');
    user.passwordSalt = salt;
    user.passwordHash = hashPassword(newPassword, salt);
    saveDatabase();
    res.json({ message: 'Password reset successfully.' });
  });

  app.post('/api/tournaments/:matchId/join', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const { matchId } = req.params;
    const { inGameName, uid, position } = req.body ?? {};

    if (typeof inGameName !== 'string' || inGameName.trim().length < 2) {
      res.status(400).json({ error: 'Please enter a valid In-Game Username/Name' });
      return;
    }
    const cleanUid = typeof uid === 'string' && uid.trim() ? uid.trim() : '10000001';
    if (!/^\d{6,14}$/.test(cleanUid)) {
      res.status(400).json({ error: 'Please enter a valid numeric Free Fire UID (6–14 digits)' });
      return;
    }

    const match = db.matches.find((m) => m.id === matchId);
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }
    if (match.joinedUsers.some((j) => j.userId === user.id)) {
      res.status(409).json({ error: 'You have already joined this match' });
      return;
    }
    if (match.filledSlots >= match.maxSlots) {
      res.status(409).json({ error: 'Match slots are full' });
      return;
    }
    if (user.balance < match.entryFee) {
      res.status(400).json({ error: 'Insufficient wallet balance. Add coins in My Wallet.' });
      return;
    }

    const taken = new Set<number>(
      match.takenPositions && match.takenPositions.length > 0
        ? match.takenPositions
        : Array.from({ length: match.filledSlots }, (_, i) => i + 1),
    );

    let chosenPosition: number | undefined;
    if (position !== undefined && position !== null) {
      const posNum = Number(position);
      if (!Number.isInteger(posNum) || posNum < 1 || posNum > match.maxSlots) {
        res.status(400).json({ error: `Position must be between 1 and ${match.maxSlots}` });
        return;
      }
      if (taken.has(posNum)) {
        res.status(409).json({ error: `Position #${posNum} is already taken. Pick another slot.` });
        return;
      }
      chosenPosition = posNum;
    } else {
      for (let p = 1; p <= match.maxSlots; p += 1) {
        if (!taken.has(p)) {
          chosenPosition = p;
          break;
        }
      }
    }

    if (chosenPosition !== undefined) {
      taken.add(chosenPosition);
      match.takenPositions = Array.from(taken).sort((a, b) => a - b);
    }

    let remainingFee = match.entryFee;
    const fromDep = Math.min(user.depositedBalance, remainingFee);
    user.depositedBalance = Number((user.depositedBalance - fromDep).toFixed(2));
    remainingFee = Number((remainingFee - fromDep).toFixed(2));
    if (remainingFee > 0) {
      user.winningBalance = Number(Math.max(0, user.winningBalance - remainingFee).toFixed(2));
    }
    const cleanInGameName = inGameName.trim().slice(0, 30);
    user.savedGameName = cleanInGameName;
    user.savedGameUid = cleanUid;
    user.balance = computeTotalBalance(user);
    user.matchesPlayed += 1;
    match.filledSlots += 1;
    match.joinedUsers.push({
      userId: user.id,
      username: user.username,
      inGameName: cleanInGameName,
      uid: cleanUid,
      position: chosenPosition,
      joinedAt: new Date().toISOString(),
    });

    if (match.entryFee > 0) {
      db.transactions.unshift({
        id: `tx-${crypto.randomUUID().slice(0, 8)}`,
        userId: user.id,
        type: 'ENTRY_FEE',
        amount: match.entryFee,
        title: `Joined ${match.title}`,
        upiOrRef: `MATCH-${match.id}`,
        status: 'SUCCESS',
        createdAt: new Date().toISOString(),
      });
    }

    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}`;
    db.matchStats.unshift({
      id: `stat-${crypto.randomUUID().slice(0, 8)}`,
      userId: user.id,
      matchInfo: `${match.teamType.toUpperCase()} - ${match.title}`,
      dateTime: formattedDate,
      paid: match.entryFee,
      won: 0,
      createdAt: now.toISOString(),
    });

    saveDatabase();
    res.json({
      user: sanitizeUser(user),
      match: sanitizeMatchesForUser([match], user.id)[0],
      transactions: db.transactions.filter((t) => t.userId === user.id),
      matchStats: db.matchStats.filter((s) => s.userId === user.id),
    });
  });

  app.post('/api/contests/private', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const { action, inviteCode, title, teamType, entryFee, map } = req.body ?? {};

    if (action === 'join_by_code') {
      if (typeof inviteCode !== 'string' || !inviteCode.trim()) {
        res.status(400).json({ error: 'Please enter a valid Private Room Invite Code' });
        return;
      }
      const match = db.matches.find(
        (m) => m.isPrivate && m.inviteCode?.toUpperCase() === inviteCode.trim().toUpperCase(),
      );
      if (!match) {
        res.status(404).json({ error: 'No Private Contest found with that Invite Code' });
        return;
      }
      res.json({ match: sanitizeMatchesForUser([match], user.id)[0] });
      return;
    }

    // Create new private contest
    const cleanFee = Number(entryFee);
    if (!Number.isFinite(cleanFee) || cleanFee < 0 || cleanFee > 1000) {
      res.status(400).json({ error: 'Entry fee must be between ₹0 and ₹1000' });
      return;
    }
    const validTeams = ['1v1', '2v2', '4v4'] as const;
    const chosenTeam = validTeams.includes(teamType) ? (teamType as '1v1' | '2v2' | '4v4') : '1v1';
    const maxSlots = chosenTeam === '1v1' ? 2 : chosenTeam === '2v2' ? 4 : 8;
    const code = `SC-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const newMatch: TournamentMatch = {
      id: `match-pvt-${crypto.randomUUID().slice(0, 6)}`,
      categoryId: 'cat-pvt-contest',
      title: typeof title === 'string' && title.trim() ? title.trim().slice(0, 50) : `${user.username} Private Room`,
      mode: `Private Contest · ${chosenTeam}`,
      map: typeof map === 'string' && map.trim() ? map.trim().slice(0, 30) : 'Iron Cage',
      teamType: chosenTeam,
      entryFee: Math.round(cleanFee),
      prizePool: Math.round(cleanFee * maxSlots * 0.9),
      perKill: 0,
      maxSlots,
      filledSlots: 0,
      startTime: 'Open Now',
      status: 'UPCOMING',
      roomId: String(Math.floor(10000000 + Math.random() * 89999999)),
      roomPassword: code.slice(3, 7),
      isPrivate: true,
      inviteCode: code,
      hostUsername: user.username,
      joinedUsers: [],
    };

    db.matches.unshift(newMatch);
    saveDatabase();
    res.status(201).json({ match: sanitizeMatchesForUser([newMatch], user.id)[0] });
  });

  app.post('/api/wallet/deposit', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const rawAmount = Number(req.body?.amount);
    const amount = Number.isFinite(rawAmount) ? Math.round(rawAmount * 100) / 100 : NaN;
    const method = typeof req.body?.method === 'string' ? req.body.method.trim().slice(0, 30) : 'ZapUPI';
    const rawUtr = typeof req.body?.utr === 'string' ? req.body.utr.trim().replace(/[^a-zA-Z0-9_-]/g, '') : '';
    if (!Number.isFinite(amount) || amount < 10 || amount > 10000) {
      res.status(400).json({ error: 'Deposit amount must be between ₹10 and ₹10,000' });
      return;
    }

    const txRef = rawUtr ? `UTR-${rawUtr.slice(0, 20)}` : `UPI-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    if (
      rawUtr &&
      db.transactions.some((t) => t.type === 'DEPOSIT' && t.upiOrRef.toLowerCase() === txRef.toLowerCase())
    ) {
      res.status(409).json({ error: 'Duplicate transaction detected. This UTR reference has already been used.' });
      return;
    }

    user.depositedBalance = Number(((user.depositedBalance || 0) + amount).toFixed(2));
    user.balance = computeTotalBalance(user);
    const tx: WalletTransaction = {
      id: `tx-${crypto.randomUUID().slice(0, 8)}`,
      userId: user.id,
      type: 'DEPOSIT',
      amount,
      title: `Added via ${method}`,
      upiOrRef: txRef,
      status: 'SUCCESS',
      createdAt: new Date().toISOString(),
    };
    db.transactions.unshift(tx);
    saveDatabase();
    res.json({ user: sanitizeUser(user), transactions: db.transactions.filter((t) => t.userId === user.id) });
  });

  app.post('/api/wallet/withdraw', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const rawAmount = Number(req.body?.amount);
    const amount = Number.isFinite(rawAmount) ? Math.round(rawAmount * 100) / 100 : NaN;
    const upiId = typeof req.body?.upiId === 'string' ? req.body.upiId.trim() : '';

    if (!Number.isFinite(amount) || amount < 20 || amount > 50000) {
      res.status(400).json({ error: 'Minimum withdrawal is ₹20' });
      return;
    }
    if (!upiId.includes('@') || upiId.length < 5) {
      res.status(400).json({ error: 'Please enter a valid UPI ID (e.g. player@upi)' });
      return;
    }
    if (user.winningBalance < amount) {
      res.status(400).json({
        error: `Only winnings can be redeemed. Available winning balance: ₹${user.winningBalance.toFixed(1)}`,
      });
      return;
    }

    user.winningBalance = Number((user.winningBalance - amount).toFixed(2));
    user.balance = computeTotalBalance(user);
    user.payoutsCount += 1;
    user.totalWithdrawals = Number(((user.totalWithdrawals || 0) + amount).toFixed(2));
    const tx: WalletTransaction = {
      id: `tx-${crypto.randomUUID().slice(0, 8)}`,
      userId: user.id,
      type: 'WITHDRAW',
      amount,
      title: `Withdraw to ${upiId}`,
      upiOrRef: upiId,
      status: 'SUCCESS',
      createdAt: new Date().toISOString(),
    };
    db.transactions.unshift(tx);
    const withdrawalEntry: WithdrawalTicker = {
      id: `wd-${crypto.randomUUID().slice(0, 6)}`,
      username: user.username,
      amount,
      verified: true,
      timeAgo: 'Just now',
      createdAt: new Date().toISOString(),
      avatarUrl: user.avatarUrl,
    };
    db.recentWithdrawals.unshift(withdrawalEntry);
    db.recentWithdrawals = db.recentWithdrawals.slice(0, 10);
    saveDatabase();
    broadcastLiveEvent({
      type: 'withdrawal:created',
      entry: withdrawalEntry,
      recentWithdrawals: db.recentWithdrawals,
    });
    res.json({
      user: sanitizeUser(user),
      transactions: db.transactions.filter((t) => t.userId === user.id),
      recentWithdrawals: db.recentWithdrawals,
    });
  });

  app.post('/api/lucky-draw', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const rewards = [0, 2, 5, 10, 1, 25];
    const picked = rewards[Math.floor(Math.random() * rewards.length)];
    user.luckyDrawLastSpinAt = new Date().toISOString();
    if (picked > 0) {
      user.winningBalance = Number((user.winningBalance + picked).toFixed(2));
      user.balance = computeTotalBalance(user);
      user.amountWon = Number((user.amountWon + picked).toFixed(2));
      db.transactions.unshift({
        id: `tx-${crypto.randomUUID().slice(0, 8)}`,
        userId: user.id,
        type: 'BONUS',
        amount: picked,
        title: 'Lucky Draw Ticket Reward',
        upiOrRef: 'SC-LUCKY-TICKET',
        status: 'SUCCESS',
        createdAt: new Date().toISOString(),
      });
    }
    saveDatabase();
    res.json({
      reward: picked,
      user: sanitizeUser(user),
      transactions: db.transactions.filter((t) => t.userId === user.id),
    });
  });

  app.post('/api/promo-submit', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const { videoUrl, channelName } = req.body ?? {};
    if (typeof videoUrl !== 'string' || !/^https?:\/\//i.test(videoUrl.trim())) {
      res.status(400).json({ error: 'Please enter a valid YouTube Shorts https:// URL' });
      return;
    }
    if (typeof channelName !== 'string' || channelName.trim().length < 2) {
      res.status(400).json({ error: 'Please enter your channel name' });
      return;
    }
    const submission: PromoSubmission = {
      id: `promo-${crypto.randomUUID().slice(0, 8)}`,
      userId: user.id,
      videoUrl: videoUrl.trim().slice(0, 200),
      channelName: channelName.trim().slice(0, 60),
      status: 'UNDER_REVIEW',
      createdAt: new Date().toISOString(),
    };
    db.promoSubmissions.unshift(submission);
    saveDatabase();
    res.status(201).json({ submission });
  });

  app.post('/api/feedback', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const rating = Number(req.body?.rating);
    const comment = typeof req.body?.comment === 'string' ? req.body.comment.trim() : '';
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length < 4) {
      res.status(400).json({ error: 'Please select a star rating (1–5) and enter feedback' });
      return;
    }
    const entry: FeedbackEntry = {
      id: `fb-${crypto.randomUUID().slice(0, 6)}`,
      username: user.username,
      rating,
      comment: comment.slice(0, 160),
      createdAt: new Date().toISOString(),
      avatarUrl: user.avatarUrl,
    };
    db.feedbacks.unshift(entry);
    db.feedbacks = db.feedbacks.slice(0, 20);
    saveDatabase();
    broadcastLiveEvent({
      type: 'feedback:created',
      entry,
      feedbacks: db.feedbacks,
    });
    res.status(201).json({ feedbacks: db.feedbacks });
  });

  // Vite middleware in dev, static dist in production
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  const httpServer = createHttpServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/live' });

  broadcastLiveEvent = (payload: Record<string, unknown>) => {
    const serialized = JSON.stringify(payload);
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(serialized);
      }
    }
  };

  wss.on('connection', (socket) => {
    socket.send(
      JSON.stringify({
        type: 'feed:init',
        feedbacks: db.feedbacks,
        recentWithdrawals: db.recentWithdrawals,
      }),
    );
  });

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`SkillBattle server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
