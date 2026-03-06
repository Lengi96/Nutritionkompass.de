export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 256 256"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#78A897" />
          <stop offset="100%" stopColor="#50917B" />
        </linearGradient>
      </defs>
      <circle
        cx="128"
        cy="128"
        r="96"
        stroke="url(#logoGradient)"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <polygon
        points="128,52 170,128 128,112 86,204 96,128"
        fill="url(#logoGradient)"
      />
      <circle cx="128" cy="128" r="6" fill="#355F51" />
    </svg>
  );
}
