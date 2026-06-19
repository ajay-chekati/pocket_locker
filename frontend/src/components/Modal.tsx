import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

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
  fitHeight = false,
  children,
}: {
  onClose: () => void;
  maxWidth?: number;
  padding?: number;
  label?: string;
  /**
   * When true the panel becomes a fixed-height flex column (capped to the
   * viewport) instead of growing with its content. Children lay out as flex
   * rows: pin a header/footer with `flex: "none"` and let a middle region
   * `flex: 1` fill and scroll. Used by the file previewer so large media never
   * pushes the modal past the window.
   */
  fitHeight?: boolean;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Portal to <body> so the fixed overlay is positioned relative to the viewport.
  // Rendered inline it would be trapped by any transformed ancestor (e.g. a
  // section mid entrance-animation), which throws off centering/sizing.
  return createPortal(
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
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding,
          boxShadow: "0 36px 80px -24px rgba(0,0,0,.5)",
          animation: "plPop .3s ease both",
          ...(fitHeight
            ? {
                // Definite height so a flex:1 child (e.g. the PDF iframe) has a
                // box to fill; capped to the viewport so it never overflows.
                height: "min(88vh, 820px)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }
            : { maxHeight: "92vh", overflow: "auto" }),
        }}
      >
        {children}
      </div>
    </div>,
    document.body,
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
