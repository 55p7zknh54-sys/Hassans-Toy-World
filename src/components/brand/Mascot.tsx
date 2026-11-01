/**
 * "Twinkle" — the little star mascot of Hassan's Toys World.
 * Pure SVG, no assets. Use anywhere as a friendly brand character.
 */
const POINTS = Array.from({ length: 10 }, (_, i) => {
  const r = i % 2 ? 15 : 33;
  const a = ((-90 + i * 36) * Math.PI) / 180;
  return `${(50 + r * Math.cos(a)).toFixed(1)},${(54 + r * Math.sin(a)).toFixed(1)}`;
}).join(' ');

type Props = {
  size?: number;
  className?: string;
  /** Adds little sparkles around the star. */
  sparkles?: boolean;
  /** "wink" closes one eye. */
  mood?: 'happy' | 'wink';
  title?: string;
};

export function Mascot({ size = 48, className, sparkles = false, mood = 'happy', title }: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {sparkles && (
        <g fill="#49C1FF">
          <path d="M12 22 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" />
          <path d="M86 14 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6z" fill="#FF6B9D" />
          <circle cx="90" cy="70" r="3" fill="#A78BFA" />
        </g>
      )}
      <ellipse cx="50" cy="90" rx="22" ry="4" fill="#29254D" opacity="0.12" />
      <polygon points={POINTS} fill="#FFD93D" stroke="#FFD93D" strokeWidth="10" strokeLinejoin="round" />
      <polygon points={POINTS} fill="none" stroke="#FFB800" strokeWidth="1.5" strokeLinejoin="round" opacity="0.35" transform="translate(0 1.5)" />
      <ellipse cx="38" cy="38" rx="6" ry="3" fill="#FFF7E6" opacity="0.8" transform="rotate(-35 38 38)" />
      <ellipse cx="38" cy="58" rx="4.6" ry="3" fill="#FF6B9D" opacity="0.55" />
      <ellipse cx="62" cy="58" rx="4.6" ry="3" fill="#FF6B9D" opacity="0.55" />
      <ellipse cx="42" cy="52" rx="2.8" ry="3.6" fill="#29254D" />
      <circle cx="43" cy="50.6" r="1" fill="#fff" />
      {mood === 'wink' ? (
        <path d="M56 52.5 q3 -3.5 6 0" fill="none" stroke="#29254D" strokeWidth="2.2" strokeLinecap="round" />
      ) : (
        <>
          <ellipse cx="58" cy="52" rx="2.8" ry="3.6" fill="#29254D" />
          <circle cx="59" cy="50.6" r="1" fill="#fff" />
        </>
      )}
      <path d="M45 61 q5 5.5 10 0" fill="none" stroke="#29254D" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
