import { useEffect, type ReactNode } from "react";

/**
 * Overlay + centered panel used by every modal (storage, preview, tokens).
 * Clicking the backdrop or pressing Escape closes it; clicks inside don't
 * bubble out. The panel width is caller-controlled via `maxWidth`.
 */
export function Modal({
  onClose,
  maxWidth = 440,
  padding = 32,
  label,
  children,
}: {
  onClose: () => void;
  maxWidth?: number;
  padding?: number;
  label?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "var(--overlay)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        animation: "plFade .25s ease both",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth,
          maxHeight: "92vh",
          overflow: "auto",
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding,
          boxShadow: "0 36px 80px -24px rgba(0,0,0,.5)",
          animation: "plPop .3s ease both",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Shared header row for a modal: title on the left, close button on the right. */
export function ModalHeader({
  title,
  onClose,
  children,
}: {
  title?: string;
  onClose: () => void;
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        justifyContent: "space-between",
        marginBottom: 24,
      }}
    >
      {children ?? (
        <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-.02em", margin: 0 }}>
          {title}
        </h3>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="pl-modal-close"
        style={{
          width: 32,
          height: 32,
          flex: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          borderRadius: 9,
          background: "var(--surface)",
          color: "var(--text-2)",
          cursor: "pointer",
        }}
      >
        <CloseGlyph />
      </button>
    </div>
  );
}

function CloseGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}
