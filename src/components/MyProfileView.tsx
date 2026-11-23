import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  Crown,
  Eye,
  EyeOff,
  Flame,
  Gamepad2,
  ImagePlus,
  Pencil,
  Shield,
  Trash2,
} from 'lucide-react';
import { SkillClashEmblem } from './BrandIcons';
import { uploadUserAvatarToStorage } from '../services/firestoreService';
import type { UserProfile } from '../types';

interface MyProfileViewProps {
  user: UserProfile;
  onBack: () => void;
  onUpdateProfile: (patch: {
    firstName?: string;
    lastName?: string;
    countryCode?: string;
    mobile?: string;
    email?: string;
    dateOfBirth?: string;
    gender?: 'Male' | 'Female';
    avatarPreset?: string;
    avatarUrl?: string;
  }) => Promise<void>;
  onChangePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

const AVATAR_PRESETS = [
  { id: 'emblem', label: 'SkillBattle Emblem' },
  { id: 'crown', label: 'Champion Crown' },
  { id: 'flame', label: 'Inferno Striker' },
  { id: 'gamepad', label: 'Pro Gamer' },
  { id: 'shield', label: 'FairPlay Guard' },
] as const;

export const MyProfileView: React.FC<MyProfileViewProps> = ({
  user,
  onBack,
  onUpdateProfile,
  onChangePassword,
}) => {
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [email, setEmail] = useState(user.email || '');
  const [countryCode, setCountryCode] = useState(user.countryCode || '+91');
  const [mobile, setMobile] = useState(user.mobile || '');
  const [dateOfBirth, setDateOfBirth] = useState(user.dateOfBirth || '');
  const [gender, setGender] = useState<'Male' | 'Female'>(user.gender || 'Male');
  const [avatarPreset, setAvatarPreset] = useState(user.avatarPreset || 'emblem');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);

  // Reset Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [resettingPw, setResettingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);

  const compressGalleryImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read the selected image.'));
      reader.onload = () => {
        const src = typeof reader.result === 'string' ? reader.result : '';
        if (!src) {
          reject(new Error('Invalid image file.'));
          return;
        }
        const img = new Image();
        img.onerror = () => reject(new Error('Unsupported image format.'));
        img.onload = () => {
          const size = 256;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas not supported.'));
            return;
          }
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    });

  const handleGalleryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setProfileErr('Please pick an image file from your gallery.');
      return;
    }
    setProfileMsg(null);
    setProfileErr(null);
    setUploadingPhoto(true);
    try {
      const dataUrl = await compressGalleryImage(file);
      const downloadUrl = await uploadUserAvatarToStorage(user.id, dataUrl);
      setAvatarUrl(downloadUrl);
      await onUpdateProfile({ avatarUrl: downloadUrl });
      setShowAvatarPicker(false);
      setProfileMsg('Profile photo uploaded and saved!');
    } catch (err) {
      setProfileErr(err instanceof Error ? err.message : 'Unable to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileErr(null);
    setSavingProfile(true);
    try {
      await onUpdateProfile({
        firstName,
        lastName,
        countryCode,
        mobile,
        email,
        dateOfBirth,
        gender,
        avatarPreset,
        avatarUrl,
      });
      setProfileMsg('Profile updated successfully!');
    } catch (err) {
      setProfileErr(err instanceof Error ? err.message : 'Unable to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    setPwErr(null);
    setResettingPw(true);
    try {
      await onChangePassword(oldPassword, newPassword);
      setPwMsg('Password reset successfully!');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setPwErr(err instanceof Error ? err.message : 'Unable to reset password');
    } finally {
      setResettingPw(false);
    }
  };

  const renderAvatarIcon = (preset: string) => {
    switch (preset) {
      case 'crown':
        return <Crown className="w-12 h-12 text-amber-500" />;
      case 'flame':
        return <Flame className="w-12 h-12 text-orange-500" />;
      case 'gamepad':
        return <Gamepad2 className="w-12 h-12 text-indigo-600" />;
      case 'shield':
        return <Shield className="w-12 h-12 text-emerald-600" />;
      case 'emblem':
      default:
        return <SkillClashEmblem className="w-full h-full" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-zinc-950 pb-16">
      {/* Black Top Bar matching Screenshot */}
      <header className="sticky top-0 z-30 bg-[#0B0C10] text-white">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center text-white"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">My Profile</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-6">
        {/* Edit Profile Section */}
        <section className="space-y-4">
          <h2 className="text-base font-medium text-slate-900 dark:text-white">Edit Profile</h2>

          {/* Centered Avatar with Gallery Upload & Pencil Edit Badge */}
          <div className="flex flex-col items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleGalleryFileChange}
              className="hidden"
            />
            <div className="relative">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Choose profile photo from gallery"
                className={`w-24 h-24 rounded-full shadow-md border flex items-center justify-center overflow-hidden transition-transform active:scale-95 ${
                  avatarUrl
                    ? 'bg-zinc-900 border-emerald-400'
                    : avatarPreset === 'emblem'
                      ? 'bg-black border-zinc-800'
                      : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800'
                }`}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={`${user.username} profile photo`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  renderAvatarIcon(avatarPreset)
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowAvatarPicker((v) => !v)}
                aria-label="Edit avatar options"
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-slate-200 dark:bg-zinc-700 border-2 border-white dark:border-zinc-950 text-slate-800 dark:text-white flex items-center justify-center shadow-xs hover:bg-slate-300 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={uploadingPhoto}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 dark:bg-zinc-800 text-white text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors disabled:opacity-60"
              >
                <ImagePlus className="w-3.5 h-3.5 text-[#54E397]" />
                <span>{uploadingPhoto ? 'Uploading...' : 'Choose from Gallery'}</span>
              </button>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={async () => {
                    setAvatarUrl('');
                    try {
                      await onUpdateProfile({ avatarUrl: '' });
                      setProfileMsg('Custom photo removed.');
                    } catch (err) {
                      setProfileErr(err instanceof Error ? err.message : 'Could not remove photo');
                    }
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 text-xs font-semibold hover:bg-rose-100 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            {showAvatarPicker && (
              <div className="flex flex-wrap items-center justify-center gap-2 bg-white dark:bg-zinc-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-xs">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                  Gallery Photo
                </button>
                {AVATAR_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setAvatarUrl('');
                      setAvatarPreset(p.id);
                      setShowAvatarPicker(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      !avatarUrl && avatarPreset === p.id
                        ? 'bg-[#54E397] text-zinc-950'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {profileErr && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-3.5 py-2.5 text-xs text-rose-700 dark:text-rose-200">
              {profileErr}
            </div>
          )}
          {profileMsg && (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3.5 py-2.5 text-xs text-emerald-700 dark:text-emerald-200">
              {profileMsg}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {/* First Name | Last Name */}
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First Name"
                  className="w-full bg-transparent border-b border-slate-300 dark:border-zinc-700 focus:border-slate-900 dark:focus:border-white py-2 text-sm text-slate-900 dark:text-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last Name"
                  className="w-full bg-transparent border-b border-slate-300 dark:border-zinc-700 focus:border-slate-900 dark:focus:border-white py-2 text-sm text-slate-900 dark:text-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Username * */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                Username *
              </label>
              <input
                type="text"
                readOnly
                value={user.username}
                className="w-full bg-transparent border-b border-slate-300 dark:border-zinc-700 py-2 text-sm text-slate-800 dark:text-zinc-200 focus:outline-none cursor-not-allowed"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                Email Address (Verified)
              </label>
              <input
                type="email"
                readOnly
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full bg-transparent border-b border-slate-300 dark:border-zinc-700 py-2 text-sm text-slate-700 dark:text-zinc-300 focus:outline-none cursor-not-allowed"
              />
            </div>

            {/* Country Code + Mobile Number */}
            <div className="flex items-end gap-3">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                aria-label="Country code"
                className="w-20 bg-transparent border-b border-slate-300 dark:border-zinc-700 py-2 text-sm text-slate-800 dark:text-zinc-200 focus:outline-none"
              >
                <option value="+91">+91</option>
                <option value="+1">+1</option>
                <option value="+977">+977</option>
                <option value="+880">+880</option>
              </select>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Mobile Number"
                className="flex-1 bg-transparent border-b border-slate-300 dark:border-zinc-700 focus:border-slate-900 dark:focus:border-white py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <input
                type={dateOfBirth ? 'date' : 'text'}
                onFocus={(e) => {
                  e.currentTarget.type = 'date';
                }}
                onBlur={(e) => {
                  if (!e.currentTarget.value) e.currentTarget.type = 'text';
                }}
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                placeholder="Date of Birth"
                aria-label="Date of Birth"
                className="w-full bg-transparent border-b border-slate-300 dark:border-zinc-700 focus:border-slate-900 dark:focus:border-white py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Gender */}
            <div className="flex items-center gap-5 pt-1 text-sm text-slate-800 dark:text-zinc-200">
              <span className="font-medium">Gender:</span>
              {(['Male', 'Female'] as const).map((g) => (
                <label key={g} className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={gender === g}
                    onChange={() => setGender(g)}
                    className="w-4 h-4 accent-zinc-900 dark:accent-emerald-400"
                  />
                  <span>{g}</span>
                </label>
              ))}
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full h-12 rounded-md bg-[#54E397] hover:bg-[#43d688] active:scale-[0.99] text-white font-bold text-sm uppercase tracking-wide shadow-xs transition-all disabled:opacity-60"
            >
              {savingProfile ? 'UPDATING...' : 'UPDATE PROFILE'}
            </button>
          </form>
        </section>

        {/* Reset Password Section */}
        <section className="space-y-4 pt-1">
          <h2 className="text-base font-medium text-slate-900 dark:text-white">Reset Password</h2>

          {pwErr && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-3.5 py-2.5 text-xs text-rose-700 dark:text-rose-200">
              {pwErr}
            </div>
          )}
          {pwMsg && (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3.5 py-2.5 text-xs text-emerald-700 dark:text-emerald-200">
              {pwMsg}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showOldPw ? 'text' : 'password'}
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Old Password"
                className="w-full bg-transparent border-b border-slate-300 dark:border-zinc-700 focus:border-slate-900 dark:focus:border-white py-2.5 pr-10 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowOldPw((v) => !v)}
                className="absolute right-0 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-600 dark:text-zinc-400"
                aria-label={showOldPw ? 'Hide old password' : 'Show old password'}
              >
                {showOldPw ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>

            <div className="relative">
              <input
                type={showNewPw ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
                className="w-full bg-transparent border-b border-slate-300 dark:border-zinc-700 focus:border-slate-900 dark:focus:border-white py-2.5 pr-10 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowNewPw((v) => !v)}
                className="absolute right-0 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-600 dark:text-zinc-400"
                aria-label={showNewPw ? 'Hide new password' : 'Show new password'}
              >
                {showNewPw ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={resettingPw}
              className="w-full h-12 rounded-md bg-[#54E397] hover:bg-[#43d688] active:scale-[0.99] text-white font-bold text-sm uppercase tracking-wide shadow-xs transition-all disabled:opacity-60"
            >
              {resettingPw ? 'RESETTING...' : 'RESET'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
};
