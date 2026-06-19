import type { SVGProps } from "react";

/**
 * The Pocket Locker app mark: a red rounded-square "tile" holding a small white
 * locker glyph (a vault door with a vent slot and a knob). Used as the brand
 * logo in headers/footers and as the favicon. Self-contained colors so it reads
 * the same on any background and in either theme.
 */
export function LockerMark({ size = 26, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" {...props}>
      <rect x="0" y="0" width="32" height="32" rx="8" fill="var(--accent)" />
      {/* inner door */}
      <rect x="8" y="7" width="16" height="18" rx="3.5" fill="none" stroke="#fff" strokeWidth="2" />
      {/* vent slot */}
      <line x1="12" y1="12" x2="20" y2="12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      {/* knob */}
      <rect x="14" y="16.5" width="4" height="4" rx="1.2" fill="#fff" />
    </svg>
  );
}
