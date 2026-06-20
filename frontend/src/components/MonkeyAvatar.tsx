import { useEffect, useRef } from "react";

/**
 * "See-no-evil" monkey mascot (🙈) for the auth screens.
 *  - neutral → eyes follow the cursor around the page
 *  - closed  → hands spring up over the eyes (password hidden — peek-a-boo)
 *  - peek    → fingers fan apart and the eyes glance down (password revealed)
 *
 * Pure SVG. The hand spring and finger fan live in CSS (the `svg.pl-mk` rules
 * in styles.css), keyed off the `data-mk` attribute. Pupils are nudged
 * imperatively so cursor tracking never triggers a React re-render.
 */
export type MonkeyMood = "neutral" | "closed" | "peek";

export function MonkeyAvatar({ mood, size = 124 }: { mood: MonkeyMood; size?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const lpRef = useRef<SVGGElement>(null);
  const rpRef = useRef<SVGGElement>(null);

  const setPupils = (x: number, y: number) => {
    for (const ref of [lpRef, rpRef]) {
      if (ref.current) ref.current.style.transform = `translate(${x}px,${y}px)`;
    }
  };

  // Peek glances down at the field; returning to neutral re-centers the eyes.
  useEffect(() => {
    if (mood === "peek") setPupils(0, 3.4);
    else if (mood === "neutral") setPupils(0, 0);
  }, [mood]);

  // In neutral the eyes track the cursor across the page.
  useEffect(() => {
    if (mood !== "neutral") return;
    const onMove = (e: MouseEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const r = svg.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height * 0.47);
      const d = Math.hypot(dx, dy) || 1;
      const max = 3.4;
      setPupils((dx / d) * max, (dy / d) * max);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mood]);

  return (
    <svg
      ref={svgRef}
      className="pl-mk"
      data-mk={mood}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label="A friendly monkey"
    >
      {/* ears */}
      <circle cx="50" cy="92" r="25" fill="#6e4a2e" />
      <circle cx="50" cy="92" r="14" fill="#c89160" />
      <circle cx="150" cy="92" r="25" fill="#6e4a2e" />
      <circle cx="150" cy="92" r="14" fill="#c89160" />

      {/* head (dark fur) */}
      <ellipse cx="100" cy="104" rx="51" ry="53" fill="#6e4a2e" />

      {/* tan face */}
      <path
        d="M100 72 C 88 60, 71 62, 65 80 C 59 97, 61 122, 73 137 C 84 150, 116 150, 127 137 C 139 122, 141 97, 135 80 C 129 62, 112 60, 100 72 Z"
        fill="#dcab74"
      />

      {/* mouth */}
      <path d="M86 128 Q 100 139 114 128" fill="none" stroke="#6e4a2e" strokeWidth="3.4" strokeLinecap="round" />
      {/* nostrils */}
      <ellipse cx="92" cy="118" rx="2.6" ry="2" fill="#6e4a2e" />
      <ellipse cx="108" cy="118" rx="2.6" ry="2" fill="#6e4a2e" />

      {/* eyes */}
      <circle cx="84" cy="96" r="10" fill="#fff" />
      <circle cx="116" cy="96" r="10" fill="#fff" />
      <g className="pupil" ref={lpRef}>
        <circle cx="84" cy="96" r="5.6" fill="#2e2016" />
        <circle cx="86" cy="93.5" r="1.7" fill="#fff" />
      </g>
      <g className="pupil" ref={rpRef}>
        <circle cx="116" cy="96" r="5.6" fill="#2e2016" />
        <circle cx="118" cy="93.5" r="1.7" fill="#fff" />
      </g>

      {/* left hand */}
      <g className="hand">
        <path d="M86 116 C 80 142, 67 158, 57 182" fill="none" stroke="#6e4a2e" strokeWidth="23" strokeLinecap="round" />
        <rect x="64" y="103" width="42" height="27" rx="13" fill="#c2885a" />
        <rect className="finger f-l0" x="66" y="70" width="9.5" height="42" rx="4.7" fill="#c2885a" />
        <rect className="finger f-l1" x="75" y="68" width="9.5" height="44" rx="4.7" fill="#bd8254" />
        <rect className="finger f-l2" x="84" y="68" width="9.5" height="44" rx="4.7" fill="#c2885a" />
        <rect className="finger f-l3" x="93" y="70" width="9.5" height="42" rx="4.7" fill="#bd8254" />
      </g>
      {/* right hand */}
      <g className="hand">
        <path d="M114 116 C 120 142, 133 158, 143 182" fill="none" stroke="#6e4a2e" strokeWidth="23" strokeLinecap="round" />
        <rect x="94" y="103" width="42" height="27" rx="13" fill="#c2885a" />
        <rect className="finger f-r0" x="97.5" y="70" width="9.5" height="42" rx="4.7" fill="#bd8254" />
        <rect className="finger f-r1" x="106.5" y="68" width="9.5" height="44" rx="4.7" fill="#c2885a" />
        <rect className="finger f-r2" x="115.5" y="68" width="9.5" height="44" rx="4.7" fill="#bd8254" />
        <rect className="finger f-r3" x="124.5" y="70" width="9.5" height="42" rx="4.7" fill="#c2885a" />
      </g>
    </svg>
  );
}
