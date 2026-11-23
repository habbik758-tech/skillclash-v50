import React, { useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, LogOut, MailCheck, RefreshCw } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { SkillClashEmblem } from './BrandIcons';

export interface PendingRegistrationMeta {
  firstName: string;
  lastName: string;
  username: string;
  countryCode: string;
  mobile: string;
  referralCode: string;
}

const PENDING_REG_KEY = 'skillbattle_pending_reg';

export function savePendingRegistration(uid: string, meta: PendingRegistrationMeta): void {
  try {
    window.sessionStorage.setItem(`${PENDING_REG_KEY}_${uid}`, JSON.stringify(meta));
  } catch {
    // Ignore storage restriction
  }
}

export function consumePendingRegistration(uid: string): PendingRegistrationMeta | undefined {
  try {
    const raw = window.sessionStorage.getItem(`${PENDING_REG_KEY}_${uid}`);
    if (!raw) return undefined;
    window.sessionStorage.removeItem(`${PENDING_REG_KEY}_${uid}`);
    return JSON.parse(raw) as PendingRegistrationMeta;
  } catch {
    return undefined;
  }
}

function mapFirebaseAuthError(err: unknown): string {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: string }).code)
      : '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please check and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please login instead.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing.';
    case 'auth/popup-blocked':
      return 'Popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/unauthorized-domain':
      return 'This domain is not yet authorized in Firebase Authentication settings.';
    default:
      return err instanceof Error ? err.message : 'Authentication failed. Please try again.';
  }
}

interface AuthScreensProps {
  initialMode?: 'login' | 'register';
  sessionNotice?: string | null;
  registrationsEnabled?: boolean;
  onBack?: () => void;
}

export const AuthScreens: React.FC<AuthScreensProps> = ({
  initialMode = 'login',
  sessionNotice = null,
  registrationsEnabled = true,
  onBack,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(sessionNotice);

  useEffect(() => {
    setInfo(sessionNotice);
  }, [sessionNotice]);

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Reset password fields
  const [resetEmail, setResetEmail] = useState('');

  const handleGoogleSignIn = async () => {
    setError(null);
    setInfo(null);
    setGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const trimmedEmail = loginEmail.trim();
    if (!trimmedEmail || !loginPassword) {
      setError('Please enter your email address and password.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, loginPassword);
    } catch (err) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!registrationsEnabled) {
      setError('New player registrations are temporarily paused by admin.');
      return;
    }

    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const cleanUser = regUsername.trim();
    const cleanDigits = mobile.replace(/\D/g, '');
    const cleanEmail = email.trim();

    if (!cleanFirst || !cleanLast) {
      setError('First Name and Last Name are required.');
      return;
    }
    if (cleanUser.length < 2 || cleanUser.length > 40) {
      setError('Please enter a valid username (2–40 characters).');
      return;
    }
    if (cleanDigits.length < 7 || cleanDigits.length > 15) {
      setError('Please enter a valid mobile number (7–15 digits).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, regPassword);
      savePendingRegistration(cred.user.uid, {
        firstName: cleanFirst,
        lastName: cleanLast,
        username: cleanUser,
        countryCode,
        mobile: cleanDigits,
        referralCode: referralCode.trim(),
      });
      await updateProfile(cred.user, {
        displayName: `${cleanFirst} ${cleanLast}`.trim(),
      }).catch(() => {});
      await sendEmailVerification(cred.user).catch(() => {});
    } catch (err) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const cleanEmail = resetEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter your registered email address.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setInfo(`Password reset email sent to ${cleanEmail}. Check your inbox & spam folder.`);
      setMode('login');
      setLoginEmail(cleanEmail);
      setLoginPassword('');
      setResetEmail('');
    } catch (err) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-zinc-950 flex flex-col">
      <header className="bg-[#0B0C10] text-white h-14 px-4 flex items-center justify-center relative shrink-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="absolute left-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-white/90 hover:text-white"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-base font-bold tracking-wider uppercase">
          {mode === 'login' ? 'LOGIN' : mode === 'register' ? 'REGISTER' : 'RESET PASSWORD'}
        </h1>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-5 py-7 flex flex-col">
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="w-16 h-16 rounded-full bg-black border border-zinc-800 overflow-hidden shadow-md">
            <SkillClashEmblem className="w-full h-full" />
          </div>
          <span className="font-display font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
            SkillBattle
          </span>
        </div>

        {error && (
          <div className="mb-5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-4 py-3 text-sm text-rose-700 dark:text-rose-200">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200">
            {info}
          </div>
        )}

        {mode === 'login' && (
          <div className="space-y-5">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Email Address *"
                  className="w-full bg-transparent border-b border-slate-300 dark:border-zinc-700 py-3 text-base text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Password *"
                  className="w-full bg-transparent border-b border-slate-300 dark:border-zinc-700 py-3 pr-11 text-base text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-600 dark:text-zinc-400"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full h-12 rounded-md bg-[#54E397] hover:bg-[#43d688] active:scale-[0.99] text-zinc-950 font-bold text-sm tracking-wide uppercase shadow-sm transition-all disabled:opacity-60"
                >
                  {loading ? 'Logging in...' : 'LOGIN'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setInfo(null);
                    setMode('register');
                  }}
                  className="w-full h-12 rounded-md bg-[#7E7AF2] hover:bg-[#6d69e6] active:scale-[0.99] text-white font-bold text-sm tracking-wide uppercase shadow-sm transition-all"
                >
                  CREATE NEW ACCOUNT
                </button>
              </div>
            </form>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-300 dark:bg-zinc-800" />
              <span className="text-xs font-semibold uppercase text-slate-400">or</span>
              <div className="h-px flex-1 bg-slate-300 dark:bg-zinc-800" />
            </div>

            <button
              type="button"
              disabled={loading || googleLoading}
              onClick={handleGoogleSignIn}
              className="w-full h-12 rounded-md bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-900 dark:text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-xs transition-all disabled:opacity-60"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
              <span>{googleLoading ? 'Connecting Google...' : 'Continue with Google'}</span>
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setInfo(null);
                  setShowPassword(false);
                  if (!resetEmail && loginEmail.trim()) {
                    setResetEmail(loginEmail.trim());
                  }
                  setMode('reset');
                }}
                className="text-sm font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white py-2"
              >
                Forgot Password? Reset via Email
              </button>
            </div>
          </div>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-5">
            {!registrationsEnabled && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-200">
                New registrations are currently paused by admin. Existing users can still login.
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                required
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name *"
                className="w-full bg-transparent border-b border-slate-300 dark:border-zinc-700 py-3 text-base text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                required
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name *"
                className="w-full bg-transparent border-b border-slate-300 dark:border-zinc-700 py-3 text-base text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <input
                type="text"
                required
                autoComplete="username"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="Username *"
                className="w-full bg-transparent border-b border-slate-300 dark:border-zinc-700 py-3 text-base text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-end gap-3">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                aria-label="Country Code"
                className="w-24 bg-transparent border-b border-slate-300 dark:border-zinc-700 py-3 text-sm font-medium text-slate-700 dark:text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="+91">+91 (IN)</option>
                <option value="+1">+1 (US)</option>
                <option value="+977">+977 (NP)</option>
                <option value="+880">+880 (BD)</option>
              </select>
              <input
                type="tel"
                required
                autoComplete="tel-national"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Mobile Number *"
                className="flex-1 bg-transparent border-b border-slate-300 dark:border-zinc-700 py-3 text-base text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email *"
                className="w-full bg-transparent border-b border-slate-300 dark:border-zinc-700 py-3 text-base text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="Referral Code (Optional)"
                className="w-full bg-transparent border-b border-slate-300 dark:border-zinc-700 py-3 text-base text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Password (min 6 chars) *"
                className="w-full bg-transparent border-b border-slate-300 dark:border-zinc-700 py-3 pr-11 text-base text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-0 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-600 dark:text-zinc-400"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="pt-3 space-y-3.5">
              <button
                type="submit"
                disabled={loading || !registrationsEnabled}
                className="w-full h-12 rounded-md bg-[#54E397] hover:bg-[#43d688] active:scale-[0.99] text-zinc-950 font-bold text-sm tracking-wide uppercase shadow-sm transition-all disabled:opacity-60"
              >
                {loading ? 'Creating account...' : 'SIGNUP & SEND VERIFICATION'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setInfo(null);
                  setMode('login');
                }}
                className="w-full h-12 rounded-md bg-[#7E7AF2] hover:bg-[#6d69e6] active:scale-[0.99] text-white font-bold text-sm tracking-wide uppercase shadow-sm transition-all"
              >
                BACK TO LOGIN
              </button>
            </div>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleReset} className="space-y-6">
            <p className="text-sm text-slate-600 dark:text-zinc-400">
              Enter your registered email address to receive an official password reset link.
            </p>
            <div>
              <input
                type="email"
                required
                autoComplete="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Registered Email Address *"
                className="w-full bg-transparent border-b border-slate-300 dark:border-zinc-700 py-3 text-base text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-md bg-[#54E397] hover:bg-[#43d688] active:scale-[0.99] text-zinc-950 font-bold text-sm uppercase tracking-wide shadow-sm transition-all disabled:opacity-60"
              >
                {loading ? 'Sending Link...' : 'SEND RESET EMAIL'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setInfo(null);
                  setShowPassword(false);
                  setMode('login');
                }}
                className="w-full h-12 rounded-md bg-[#7E7AF2] hover:bg-[#6d69e6] active:scale-[0.99] text-white font-bold text-sm uppercase tracking-wide shadow-sm transition-all"
              >
                BACK TO LOGIN
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

interface EmailVerificationGateProps {
  firebaseUser: FirebaseUser;
  onVerified: (refreshedUser: FirebaseUser) => void | Promise<void>;
}

export const EmailVerificationGate: React.FC<EmailVerificationGateProps> = ({
  firebaseUser,
  onVerified,
}) => {
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckVerified = async () => {
    setError(null);
    setMessage(null);
    setChecking(true);
    try {
      await firebaseUser.reload();
      await firebaseUser.getIdToken(true);
      if (auth.currentUser?.emailVerified) {
        await onVerified(auth.currentUser);
      } else {
        setError('Your email is still not verified. Please click the verification link in your email inbox (or Spam folder) first.');
      }
    } catch (err) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setMessage(null);
    setResending(true);
    try {
      await sendEmailVerification(firebaseUser);
      setMessage(`Verification link resent to ${firebaseUser.email}.`);
    } catch (err) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0C10] text-white flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-5 shadow-xl text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 mx-auto flex items-center justify-center text-emerald-400">
          <MailCheck className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h1 className="font-display text-xl font-extrabold tracking-tight">Verify Your Email</h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            For security, all SkillBattle accounts require email verification before accessing tournaments and wallets. We sent a verification link to:
          </p>
          <p className="text-sm font-bold text-emerald-400 break-all pt-1">{firebaseUser.email}</p>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-950/60 border border-rose-800 px-3.5 py-2.5 text-xs text-rose-200 text-left">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-xl bg-emerald-950/60 border border-emerald-800 px-3.5 py-2.5 text-xs text-emerald-200 flex items-center gap-2 text-left">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            disabled={checking}
            onClick={handleCheckVerified}
            className="w-full h-11 rounded-xl bg-[#54E397] hover:bg-[#43d688] text-zinc-950 font-extrabold text-xs uppercase tracking-wide flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Checking...' : "I've Verified — Continue"}</span>
          </button>

          <button
            type="button"
            disabled={resending}
            onClick={handleResend}
            className="w-full h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wide disabled:opacity-60"
          >
            {resending ? 'Sending...' : 'Resend Verification Email'}
          </button>

          <button
            type="button"
            onClick={() => void signOut(auth)}
            className="w-full h-10 rounded-xl border border-zinc-700 hover:bg-zinc-800/80 text-zinc-300 font-semibold text-xs flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch Account / Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
