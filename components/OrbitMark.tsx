/**
 * Decorative orbital-globe motif (light, technical — ref: Kepler).
 * Pure SVG, no JS. Used on the landing hero and as the globe skeleton.
 */
export function OrbitMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="om-globe" cx="42%" cy="38%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#f0f0f0" />
          <stop offset="100%" stopColor="#e3e3e3" />
        </radialGradient>
      </defs>

      {/* Orbit rings */}
      <circle cx="200" cy="200" r="178" stroke="#dedede" strokeWidth="1" />
      <circle
        cx="200"
        cy="200"
        r="138"
        stroke="#dedede"
        strokeWidth="1"
        strokeDasharray="2 6"
      />

      {/* Globe */}
      <circle cx="200" cy="200" r="92" fill="url(#om-globe)" stroke="#dedede" />

      {/* Graticule */}
      <g stroke="#e2e2e2" strokeWidth="1">
        <ellipse cx="200" cy="200" rx="92" ry="30" />
        <ellipse cx="200" cy="200" rx="92" ry="62" />
        <ellipse cx="200" cy="200" rx="30" ry="92" />
        <ellipse cx="200" cy="200" rx="62" ry="92" />
        <line x1="108" y1="200" x2="292" y2="200" />
      </g>

      {/* Orange markers on the orbits */}
      <g>
        <circle cx="200" cy="22" r="11" fill="#f25623" />
        <circle cx="200" cy="22" r="4" fill="#fff" />
        <circle cx="338" cy="200" r="9" fill="#f25623" />
        <circle cx="338" cy="200" r="3.2" fill="#fff" />
        <circle cx="62" cy="138" r="6" fill="#171717" />
      </g>
    </svg>
  );
}
