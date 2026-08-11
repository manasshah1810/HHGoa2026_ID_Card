const BRAND = "HACKER HOUSE GOA 2026 · 2:47 PM STUDIO · ";

/** Two thin fabric straps converging into a metal clasp at the top of the ID card. */
export function Lanyard({ kick = false }: { kick?: boolean }) {
  return (
    <svg
      viewBox="0 0 440 172"
      className={`pointer-events-none block w-full ${kick ? "hh-lanyard hh-lanyard-kick" : "hh-lanyard"}`}
      style={{ marginBottom: "-6px" }}
      aria-hidden="true"
    >
      <defs>
        {/* woven weft threads */}
        <pattern id="hh-weave" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
          <rect width="3" height="3" fill="oklch(0.3 0.05 155)" />
          <rect width="3" height="1" fill="oklch(0.35 0.055 155)" opacity="0.75" />
          <rect y="1.5" width="1.4" height="1.5" fill="oklch(0.26 0.045 155)" opacity="0.6" />
        </pattern>
        {/* cross-strap lighting: bright centre, darker soft edges */}
        <linearGradient id="hh-shade-l" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="oklch(0.12 0.02 155)" stopOpacity="0.85" />
          <stop offset="35%" stopColor="oklch(0.75 0.05 155)" stopOpacity="0.18" />
          <stop offset="62%" stopColor="oklch(0.95 0.03 155)" stopOpacity="0.1" />
          <stop offset="100%" stopColor="oklch(0.1 0.02 155)" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="hh-shade-r" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="oklch(0.12 0.02 155)" stopOpacity="0.85" />
          <stop offset="35%" stopColor="oklch(0.75 0.05 155)" stopOpacity="0.18" />
          <stop offset="62%" stopColor="oklch(0.95 0.03 155)" stopOpacity="0.1" />
          <stop offset="100%" stopColor="oklch(0.1 0.02 155)" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="hh-metal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.88 0.01 250)" />
          <stop offset="38%" stopColor="oklch(0.62 0.01 250)" />
          <stop offset="55%" stopColor="oklch(0.82 0.01 250)" />
          <stop offset="100%" stopColor="oklch(0.5 0.012 250)" />
        </linearGradient>
        <filter id="hh-soft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="0.45" />
        </filter>

        {/* strap centre-lines: from off-frame at top, converging to the clasp */}
        <path id="hh-strap-l" d="M 70 -20 C 104 54, 176 96, 209 144" />
        <path id="hh-strap-r" d="M 370 -20 C 336 54, 264 96, 231 144" />
      </defs>

      {/* cast shadow */}
      <g opacity="0.28" filter="url(#hh-soft)" transform="translate(3,5)">
        <use href="#hh-strap-l" stroke="oklch(0.08 0 0)" strokeWidth="14" fill="none" />
        <use href="#hh-strap-r" stroke="oklch(0.08 0 0)" strokeWidth="14" fill="none" />
      </g>

      {[
        { id: "#hh-strap-l", shade: "url(#hh-shade-l)", text: "hh-strap-l" },
        { id: "#hh-strap-r", shade: "url(#hh-shade-r)", text: "hh-strap-r" },
      ].map((s) => (
        <g key={s.id}>
          {/* soft outer edge (stitched border) */}
          <use href={s.id} stroke="oklch(0.16 0.03 155)" strokeWidth="12.6" fill="none" strokeLinecap="butt" filter="url(#hh-soft)" />
          {/* woven body */}
          <use href={s.id} stroke="url(#hh-weave)" strokeWidth="11" fill="none" />
          {/* lighting across the weave */}
          <use href={s.id} stroke={s.shade} strokeWidth="11" fill="none" />
          {/* printed branding, following the fabric */}
          <text
            fill="oklch(0.9 0.19 100)"
            fillOpacity="0.62"
            fontSize="5.1"
            letterSpacing="1.05"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            fontWeight="700"
          >
            <textPath href={s.id} startOffset="0" dominantBaseline="middle">
              {BRAND.repeat(4)}
            </textPath>
          </text>
        </g>
      ))}

      {/* fabric folds where the straps meet the clasp */}
      <path d="M 206 140 L 220 150 L 234 140" fill="none" stroke="oklch(0.14 0.02 155)" strokeWidth="1" opacity="0.5" />

      {/* metal clasp: crimp + swivel ring + card bar */}
      <g>
        <path d="M 210 138 L 230 138 L 227.5 149 L 212.5 149 Z" fill="url(#hh-metal)" stroke="oklch(0.35 0.01 250)" strokeWidth="0.6" />
        <circle cx="220" cy="154" r="5.2" fill="none" stroke="url(#hh-metal)" strokeWidth="2.2" />
        <rect x="206" y="159" width="28" height="6" rx="2.4" fill="url(#hh-metal)" stroke="oklch(0.32 0.01 250)" strokeWidth="0.6" />
        <rect x="211" y="161" width="18" height="1.6" rx="0.8" fill="oklch(0.25 0.01 250)" opacity="0.7" />
      </g>
    </svg>
  );
}
