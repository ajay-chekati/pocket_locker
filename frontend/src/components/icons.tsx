/**
 * Small inline SVG icons used across the UI. Each inherits `currentColor` so it
 * picks up whatever text color its container sets.
 */
import type { SVGProps } from "react";

export function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" {...props}>
      <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 3 a7 7 0 0 0 0 14 Z" fill="currentColor" />
    </svg>
  );
}

export function UploadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <line x1="12" y1="4" x2="12" y2="15" />
      <polyline points="7 9 12 4 17 9" />
      <path d="M5 16 v3 a1 1 0 0 0 1 1 h12 a1 1 0 0 0 1-1 v-3" />
    </svg>
  );
}

export function DownloadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <line x1="12" y1="4" x2="12" y2="15" />
      <polyline points="8 11 12 15 16 11" />
      <line x1="6" y1="19" x2="18" y2="19" />
    </svg>
  );
}

export function LogoutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
      <path d="M9 5 H6 a1 1 0 0 0-1 1 v12 a1 1 0 0 0 1 1 h3" />
      <polyline points="14 8 18 12 14 16" />
      <line x1="18" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <circle cx="9" cy="9" r="5.5" />
      <line x1="13.5" y1="13.5" x2="17" y2="17" />
    </svg>
  );
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M4 11 L12 4 L20 11" />
      <path d="M6 10 v9 a1 1 0 0 0 1 1 h10 a1 1 0 0 0 1-1 v-9" />
    </svg>
  );
}

export function AccountIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5.5 19.5 a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

export function PlayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" {...props}>
      <path d="M8 5 L19 12 L8 19 Z" />
    </svg>
  );
}
