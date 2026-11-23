import type { TournamentMatch } from '../types';

/**
 * Formats an ISO timestamp in IST (Asia/Kolkata) 12-hour lowercase format, e.g. "02:20 pm".
 */
export function formatRevealClockTime(match: TournamentMatch): string {
  if (match.revealAt) {
    const dt = new Date(match.revealAt);
    if (!Number.isNaN(dt.getTime())) {
      return dt
        .toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
        .toLowerCase();
    }
  }
  return '10 mins before match';
}

/**
 * Formats remaining milliseconds until revealAt cleanly ("01h 08m 12s" or "09m 45s").
 */
export function formatCountdownMs(ms: number): string {
  const safeSec = Math.max(0, Math.floor(ms / 1000));
  const hrs = Math.floor(safeSec / 3600);
  const mins = Math.floor((safeSec % 3600) / 60);
  const secs = safeSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (hrs > 0) {
    return `${pad(hrs)}h ${pad(mins)}m ${pad(secs)}s`;
  }
  return `${pad(mins)}m ${pad(secs)}s`;
}

/**
 * Returns live room visibility status for UI rendering.
 * Server enforces real redaction until `now >= revealAt` (10 mins before start).
 */
export function getRoomRevealInfo(match: TournamentMatch, nowMs: number, isJoined: boolean) {
  const revealClock = formatRevealClockTime(match);
  const revealMs = match.revealAt ? new Date(match.revealAt).getTime() : 0;
  const msUntilReveal = revealMs > 0 ? Math.max(0, revealMs - nowMs) : 0;
  const isTimeReached = !match.revealAt || nowMs >= revealMs || match.status !== 'UPCOMING';
  const isUnlocked = Boolean(isJoined && match.roomRevealed && isTimeReached);

  return {
    revealClock,
    msUntilReveal,
    countdownLabel: msUntilReveal > 0 ? formatCountdownMs(msUntilReveal) : '00m 00s',
    isTimeReached,
    isUnlocked,
  };
}
