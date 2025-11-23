import React from 'react';

interface MoovlyGoBirdLogoProps {
  className?: string;
  size?: number;
}

export function MoovlyGoBirdLogo({ className = "", size = 24 }: MoovlyGoBirdLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Bird silhouette based on the provided design */}
      <path
        d="M25 45c0-15 8-25 22-28 8-2 16 0 22 5 4 3 6 8 6 13v2c2 1 4 2 5 4 2 3 2 7 0 10-1 2-3 3-5 4v2c0 8-4 15-10 20-6 4-14 5-21 3-7-2-13-7-16-14-2-4-3-9-3-14v-7z"
        fill="#1e3a8a"
      />
      {/* White accent/wing marking */}
      <path
        d="M35 50c3-2 7-3 11-2 4 1 7 3 9 6 1 2 1 4 0 6-1 1-2 2-4 2-3 0-6-1-8-3-3-2-5-5-6-8-1-1-1-1-2-1z"
        fill="white"
      />
      {/* Eye */}
      <circle
        cx="45"
        cy="42"
        r="3"
        fill="white"
      />
      <circle
        cx="45"
        cy="42"
        r="1.5"
        fill="#1e3a8a"
      />
      {/* Beak */}
      <path
        d="M32 44c-3-1-5-2-6-4-1-1-1-2 0-3 1-1 2-1 3 0 2 1 4 3 5 5 0 1-1 2-2 2z"
        fill="#1e3a8a"
      />
      {/* Legs/feet */}
      <path
        d="M48 75c0 2-1 3-2 3s-2-1-2-3v-8c0-1 1-2 2-2s2 1 2 2v8z"
        fill="#1e3a8a"
      />
      <path
        d="M58 75c0 2-1 3-2 3s-2-1-2-3v-8c0-1 1-2 2-2s2 1 2 2v8z"
        fill="#1e3a8a"
      />
      {/* Tail */}
      <path
        d="M70 58c3-1 6-1 8 0 2 1 3 3 2 5-1 2-3 3-5 2-2-1-4-3-5-5 0-1 0-2 0-2z"
        fill="#1e3a8a"
      />
    </svg>
  );
}