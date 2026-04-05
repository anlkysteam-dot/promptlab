/** Küçük kare logo — monogram pL (beyaz p, mor L) */
export function LogoMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect width="40" height="40" rx="10" fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize="15"
        fontFamily="system-ui, sans-serif"
        fontWeight="500"
        letterSpacing="-0.06em"
      >
        <tspan fill="#ffffff">p</tspan>
        <tspan fill="#a78bfa" fontWeight="700">
          L
        </tspan>
      </text>
    </svg>
  );
}
