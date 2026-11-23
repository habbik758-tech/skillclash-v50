import React from 'react';

import { BRAND_LOGO } from '../constants/assets';

export function SkillClashEmblem({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <img
      src={BRAND_LOGO}
      alt="SkillBattle"
      draggable={false}
      className={`${className} rounded-full object-cover select-none bg-black`}
    />
  );
}

export const SkillBattleLogo = SkillClashEmblem;

export function GoldCoinIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="14" fill="#F59E0B" />
      <circle cx="16" cy="16" r="11" fill="#FBBF24" />
      <path
        d="M17.5 8.5L11.5 17H16L14.5 23.5L20.5 15H16L17.5 8.5Z"
        fill="#FFFBEB"
        stroke="#D97706"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}
