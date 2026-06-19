import { Modal, ModalHeader } from "./Modal.js";

/** Read-only reference of the design system's colors, radii, spacing and type. */
export function DesignTokensModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={onClose} maxWidth={540} padding={30} label="Design tokens">
      <ModalHeader title="Design tokens" onClose={onClose} />

      <SectionLabel>COLORS</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 30 }}>
        <Swatch name="Background" token="--bg" swatch={{ background: "var(--bg)", border: "1px solid var(--border)" }} />
        <Swatch name="Surface" token="--surface" swatch={{ background: "var(--surface)", border: "1px solid var(--border)" }} />
        <Swatch name="Border" token="--border" swatch={{ background: "var(--border)" }} />
        <Swatch name="Text" token="--text" swatch={{ background: "var(--text)" }} />
        <Swatch name="Muted" token="--muted" swatch={{ background: "var(--muted)" }} />
        <Swatch name="Accent" token="--accent" swatch={{ background: "var(--accent)" }} />
      </div>

      <SectionLabel>RADIUS</SectionLabel>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 30 }}>
        {[
          { r: 8, label: "8 — controls" },
          { r: 14, label: "14 — cards" },
          { r: 20, label: "20 — modals" },
        ].map((x) => (
          <div key={x.r} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <span style={{ width: 48, height: 48, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: x.r }} />
            <span style={{ fontSize: 11, color: "var(--muted)" }}>{x.label}</span>
          </div>
        ))}
      </div>

      <SectionLabel>SPACING</SectionLabel>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 30 }}>
        {[8, 16, 24, 40, 64].map((s) => (
          <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <span style={{ width: s, height: s, background: "var(--accent)", borderRadius: 2 }} />
            <span style={{ fontSize: 11, color: "var(--muted)" }}>{s}</span>
          </div>
        ))}
      </div>

      <SectionLabel>TYPE — MANROPE</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <TypeRow size={32} weight={800} note="32 / 800 — display" style={{ letterSpacing: "-.03em" }} />
        <TypeRow size={20} weight={700} note="20 / 700 — heading" />
        <TypeRow size={15} weight={500} note="15 / 500 — body" />
        <TypeRow size={12.5} weight={600} note="12.5 / 600 — caption" muted />
      </div>
    </Modal>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".12em", color: "var(--muted)", marginBottom: 14 }}>
      {children}
    </div>
  );
}

function Swatch({ name, token, swatch }: { name: string; token: string; swatch: React.CSSProperties }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ height: 48, borderRadius: 10, ...swatch }} />
      <span style={{ fontSize: 12, fontWeight: 600 }}>{name}</span>
      <span style={{ fontSize: 10.5, color: "var(--muted)", fontFamily: "ui-monospace,monospace" }}>{token}</span>
    </div>
  );
}

function TypeRow({
  size,
  weight,
  note,
  muted,
  style,
}: {
  size: number;
  weight: number;
  note: string;
  muted?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
      <span style={{ fontSize: size, fontWeight: weight, color: muted ? "var(--muted)" : undefined, ...style }}>Aa</span>
      <span style={{ fontSize: 11, color: "var(--muted)" }}>{note}</span>
    </div>
  );
}
