export default function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#0b6769" />
      <path d="M27 13.5A10 10 0 1 0 27 26.5" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="29" cy="20" r="3.2" fill="#e3a72f" />
    </svg>
  );
}
