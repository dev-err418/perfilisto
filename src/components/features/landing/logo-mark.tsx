export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <rect width="32" height="32" rx="7" fill="#141414" />
      <circle cx="16" cy="12.25" r="4.15" fill="#fff" />
      <path
        d="M8.6 24.4c1.35-4.05 4.05-6.05 7.4-6.05s6.05 2 7.4 6.05"
        stroke="#fff"
        strokeWidth="2.35"
        strokeLinecap="round"
      />
    </svg>
  );
}
