/* Operator sigil — a code-drawn emblem that stands in for a profile photo.
   Colours come from the Red Cell tokens so it follows the theme. */

const TICKS = Array.from({ length: 72 }, (_, i) => i * 5)

export default function Sigil({ label = "3angour" }: { label?: string }) {
  return (
    <svg
      className="sigil"
      viewBox="0 0 300 300"
      role="img"
      aria-label={`${label} operator sigil`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="sigil-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="var(--line)" strokeWidth="1" />
        </pattern>
        <radialGradient id="sigil-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--red)" stopOpacity="0.28" />
          <stop offset="70%" stopColor="var(--red)" stopOpacity="0.04" />
          <stop offset="100%" stopColor="var(--red)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* field */}
      <rect width="300" height="300" fill="var(--bg)" />
      <rect width="300" height="300" fill="url(#sigil-grid)" />
      <circle cx="150" cy="150" r="140" fill="url(#sigil-glow)" />

      {/* outer dial with ticks */}
      <g className="sigil__dial" stroke="var(--line-3)" strokeWidth="1">
        {TICKS.map((deg) => (
          <line
            key={deg}
            x1="150"
            y1={deg % 45 === 0 ? 22 : deg % 15 === 0 ? 26 : 29}
            x2="150"
            y2="33"
            stroke={deg % 45 === 0 ? "var(--red)" : undefined}
            transform={`rotate(${deg} 150 150)`}
          />
        ))}
      </g>
      <circle cx="150" cy="150" r="112" fill="none" stroke="var(--line-2)" strokeWidth="1" />
      <circle
        className="sigil__orbit"
        cx="150"
        cy="150"
        r="96"
        fill="none"
        stroke="var(--red)"
        strokeWidth="1.5"
        strokeDasharray="64 22 8 22"
      />

      {/* crosshair */}
      <g stroke="var(--red)" strokeWidth="1.5">
        <path d="M150 40v34M150 226v34M40 150h34M226 150h34" />
      </g>

      {/* chamfered core */}
      <path
        d="M112 78h76l34 34v76l-34 34h-76l-34-34v-76z"
        fill="var(--red-ink)"
        stroke="var(--red)"
        strokeWidth="1.5"
      />
      <path d="M118 90h64l28 28v64l-28 28h-64l-28-28v-64z" fill="none" stroke="var(--red-a35)" strokeWidth="1" />

      {/* monogram */}
      <text
        x="150"
        y="166"
        textAnchor="middle"
        fill="var(--text)"
        fontFamily="var(--ff-display)"
        fontWeight="700"
        fontSize="50"
        letterSpacing="2"
      >
        3A
      </text>
      <rect x="128" y="176" width="44" height="3" fill="var(--red)" />

      {/* corner labels */}
      <g fill="var(--text-3)" fontFamily="var(--ff-mono)" fontSize="9" letterSpacing="1.5">
        <text x="12" y="20">ID//{label.toUpperCase()}</text>
        <text x="288" y="20" textAnchor="end">
          RED CELL
        </text>
        <text x="12" y="290">
          LLM · CTF · SOC
        </text>
        <text x="288" y="290" textAnchor="end" fill="var(--red)">
          ● ONLINE
        </text>
      </g>
    </svg>
  )
}
