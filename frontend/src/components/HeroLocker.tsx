/**
 * The hero illustration: a red-framed glass locker cabinet with a 3×3 grid of
 * lit compartments, each holding a file-type glyph, wired together by glowing
 * accent connectors. Pure SVG so it stays crisp, themes itself off the CSS
 * variables, and weighs nothing. Replaces the old "browser window" mock.
 */

const GRID_X = 64;
const GRID_Y = 54;
const CELL = 96;
const GAP = 18;

type IconKind = "pdf" | "image" | "doc" | "code" | "wave" | "key" | "list";

/** Reading order, top-left to bottom-right. */
const LAYOUT: IconKind[] = ["pdf", "image", "doc", "doc", "code", "wave", "code", "list", "key"];

const cellX = (c: number) => GRID_X + c * (CELL + GAP);
const cellY = (r: number) => GRID_Y + r * (CELL + GAP);

export function HeroLocker() {
  return (
    <div className="pl-hidem" style={{ position: "relative", width: "100%" }}>
      <svg
        viewBox="0 0 452 432"
        width="100%"
        role="img"
        aria-label="A glass locker cabinet holding your files"
        style={{ display: "block", filter: "drop-shadow(0 40px 60px var(--shadow))" }}
      >
        <defs>
          <linearGradient id="plFrame" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="color-mix(in srgb, var(--accent) 78%, #fff)" />
            <stop offset="0.5" stopColor="var(--accent)" />
            <stop offset="1" stopColor="color-mix(in srgb, var(--accent) 70%, #000)" />
          </linearGradient>
          <linearGradient id="plGlass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="color-mix(in srgb, var(--text) 8%, transparent)" />
            <stop offset="1" stopColor="color-mix(in srgb, var(--text) 2%, transparent)" />
          </linearGradient>
          <radialGradient id="plAura" cx="0.5" cy="0.45" r="0.6">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
          <filter id="plGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ambient glow behind the cabinet */}
        <ellipse cx="226" cy="210" rx="232" ry="220" fill="url(#plAura)" />

        {/* cabinet body */}
        <rect x="40" y="30" width="372" height="372" rx="22" fill="url(#plGlass)" stroke="url(#plFrame)" strokeWidth="6" />
        {/* top sheen */}
        <rect x="48" y="38" width="356" height="120" rx="16" fill="color-mix(in srgb, var(--text) 3%, transparent)" />

        {/* connectors run behind the panels so they tuck under the glass edges */}
        <g stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" filter="url(#plGlow)" opacity="0.85">
          {[0, 1, 2].map((r) =>
            [0, 1].map((c) => {
              const y = cellY(r) + CELL / 2;
              return <line key={`h${r}${c}`} x1={cellX(c) + CELL} y1={y} x2={cellX(c + 1)} y2={y} />;
            }),
          )}
          {[0, 1].map((r) =>
            [0, 1, 2].map((c) => {
              const x = cellX(c) + CELL / 2;
              return <line key={`v${r}${c}`} x1={x} y1={cellY(r) + CELL} x2={x} y2={cellY(r + 1)} />;
            }),
          )}
        </g>
        {/* connector nodes */}
        <g fill="var(--accent)" filter="url(#plGlow)">
          {[0, 1, 2].map((r) =>
            [0, 1].map((c) => {
              const y = cellY(r) + CELL / 2;
              const x = (cellX(c) + CELL + cellX(c + 1)) / 2;
              return <circle key={`hn${r}${c}`} cx={x} cy={y} r="2.6" />;
            }),
          )}
          {[0, 1].map((r) =>
            [0, 1, 2].map((c) => {
              const x = cellX(c) + CELL / 2;
              const y = (cellY(r) + CELL + cellY(r + 1)) / 2;
              return <circle key={`vn${r}${c}`} cx={x} cy={y} r="2.6" />;
            }),
          )}
        </g>

        {/* compartments + glyphs */}
        {LAYOUT.map((kind, i) => {
          const c = i % 3;
          const r = Math.floor(i / 3);
          const x = cellX(c);
          const y = cellY(r);
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={CELL}
                height={CELL}
                rx="14"
                fill="url(#plGlass)"
                stroke="color-mix(in srgb, var(--accent) 30%, transparent)"
                strokeWidth="1.5"
              />
              {/* compartment top highlight */}
              <rect x={x + 8} y={y + 8} width={CELL - 16} height="26" rx="9" fill="color-mix(in srgb, var(--text) 4%, transparent)" />
              <Glyph kind={kind} cx={x + CELL / 2} cy={y + CELL / 2} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** One file-type glyph, drawn centered on (cx, cy) in a ~36px box. */
function Glyph({ kind, cx, cy }: { kind: IconKind; cx: number; cy: number }) {
  const stroke = {
    fill: "none",
    stroke: "var(--accent)",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <g transform={`translate(${cx} ${cy})`} filter="url(#plGlow)">
      {kind === "pdf" && (
        <>
          <rect x="-15" y="-11" width="30" height="22" rx="4" {...stroke} />
          <text x="0" y="4" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fontWeight="800" fill="var(--accent)">
            PDF
          </text>
        </>
      )}
      {kind === "image" && (
        <>
          <rect x="-14" y="-12" width="28" height="24" rx="4" {...stroke} />
          <circle cx="-5" cy="-4" r="2.6" {...stroke} />
          <path d="M-14 8 L-3 -2 L4 4 L14 -5" {...stroke} />
        </>
      )}
      {kind === "doc" && (
        <>
          <path d="M-11 -14 H5 L11 -8 V14 H-11 Z" {...stroke} />
          <path d="M5 -14 V-8 H11" {...stroke} />
          <path d="M-6 -1 H6 M-6 4 H6 M-6 9 H2" {...stroke} />
        </>
      )}
      {kind === "code" && (
        <>
          <path d="M-3 -10 L-13 0 L-3 10" {...stroke} />
          <path d="M3 -10 L13 0 L3 10" {...stroke} />
        </>
      )}
      {kind === "wave" && (
        <path d="M-12 -3 V3 M-6 -9 V9 M0 -13 V13 M6 -7 V7 M12 -2 V2" {...stroke} />
      )}
      {kind === "list" && (
        <path d="M-11 -8 H11 M-11 0 H11 M-11 8 H4" {...stroke} />
      )}
      {kind === "key" && (
        <>
          <circle cx="-5" cy="-5" r="6" {...stroke} />
          <path d="M-1 -1 L11 11 M6 8 L9 5 M11 11 L14 8" {...stroke} />
        </>
      )}
    </g>
  );
}
