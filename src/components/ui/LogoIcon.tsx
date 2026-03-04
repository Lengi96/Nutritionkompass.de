export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient
          id="lg"
          x1="5"
          y1="95"
          x2="95"
          y2="5"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#1B3D7A" />
          <stop offset="100%" stopColor="#6BAAD5" />
        </linearGradient>
      </defs>
      {/* Outer ring – partial circle, gap at lower-left (~220°) */}
      <path
        d="M 19,73 A 41,41 0 1,1 73,19"
        stroke="url(#lg)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* Compass needle – NE-pointing half (forward direction) */}
      <path d="M 50,50 L 44,44 L 73,26 L 58,56 Z" fill="url(#lg)" />
      {/* Compass needle – SW-pointing half (back direction, slightly transparent) */}
      <path
        d="M 50,50 L 58,56 L 27,74 L 44,44 Z"
        fill="url(#lg)"
        opacity="0.55"
      />
    </svg>
  );
}
