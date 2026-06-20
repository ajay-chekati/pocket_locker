/**
 * The hero illustration: a 3D-tilted glass card mocking the Pocket Locker app —
 * a titled header with a storage meter, a couple of stored files, and a live
 * upload in progress, with three small cards floating off the corners for depth.
 * It floats gently (plHeroFloat) and themes itself off the CSS variables.
 */

const equalizerBars = [0, 0.12, 0.24, 0.36, 0.48];

export function HeroLocker() {
  return (
    <div
      className="pl-hero3d"
      style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 548, perspective: 1700 }}
    >
      {/* ambient accent glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          width: 360,
          height: 360,
          borderRadius: "50%",
          background: "radial-gradient(circle at 50% 42%,var(--accent-soft),transparent 66%)",
          pointerEvents: "none",
        }}
      />
      {/* grounding shadow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: 60,
          width: 300,
          height: 52,
          borderRadius: "50%",
          background: "var(--shadow)",
          filter: "blur(28px)",
          transform: "scaleX(1.3)",
        }}
      />

      <div
        style={{
          position: "relative",
          transformStyle: "preserve-3d",
          transform: "rotateX(9deg) rotateY(-21deg)",
          animation: "plHeroFloat 8s ease-in-out infinite",
        }}
      >
        {/* the app card */}
        <div
          style={{
            position: "relative",
            width: 360,
            borderRadius: 24,
            background: "var(--bg-elev)",
            border: "1px solid var(--border)",
            boxShadow: "0 50px 92px -32px var(--shadow),0 20px 44px -24px var(--shadow)",
            overflow: "hidden",
            transform: "translateZ(0)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
            <span
              style={{
                width: 36,
                height: 36,
                flex: "none",
                borderRadius: 11,
                background: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 12px 24px -8px color-mix(in srgb,var(--accent) 55%,transparent)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11 V8 a4 4 0 0 1 8 0 v3" />
              </svg>
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 13.5, fontWeight: 800, letterSpacing: "-.01em" }}>Pocket Locker</span>
              <span style={{ fontSize: 10.5, color: "var(--muted)", fontFamily: "ui-monospace,monospace" }}>encrypted · synced</span>
            </div>
            <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 600, color: "var(--text-2)" }}>
              <span style={{ width: 42, height: 6, borderRadius: 4, background: "var(--border)", overflow: "hidden" }}>
                <span style={{ display: "block", height: "100%", width: "68%", background: "var(--accent)", borderRadius: 4 }} />
              </span>
              68%
            </span>
          </div>

          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 9 }}>
            <FileRow ext="PDF" name="Q3-Report.pdf" size="4.2 MB" />
            <FileRow ext="PNG" name="design-mockup.png" size="8.1 MB" />

            {/* live upload */}
            <div style={{ marginTop: 5, padding: 14, border: "1.5px dashed var(--accent)", borderRadius: 12, background: "var(--accent-soft)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>roadmap.key</span>
                <span style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 600 }}>64% · 12s</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 20, marginBottom: 11 }}>
                {equalizerBars.map((delay, i) => (
                  <span
                    key={i}
                    style={{
                      width: 3,
                      height: 20,
                      borderRadius: 2,
                      background: "var(--accent)",
                      transformOrigin: "bottom",
                      animation: `plEq 1s ease-in-out ${delay}s infinite`,
                    }}
                  />
                ))}
              </div>
              <div style={{ height: 6, borderRadius: 4, background: "var(--border)", overflow: "hidden" }}>
                <span
                  style={{
                    display: "block",
                    height: "100%",
                    width: "64%",
                    borderRadius: 4,
                    background: "linear-gradient(90deg,var(--accent),color-mix(in srgb,var(--accent) 55%,#fff))",
                    backgroundSize: "200% 100%",
                    animation: "plShimmer 1.3s linear infinite",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* floating PDF chip, top-left */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: -30,
            left: -52,
            width: 74,
            height: 74,
            borderRadius: 18,
            background: "var(--bg-elev)",
            border: "1px solid var(--border)",
            boxShadow: "0 28px 46px -22px var(--shadow)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            transform: "translateZ(78px)",
          }}
        >
          <span style={{ padding: "3px 7px", borderRadius: 6, background: "var(--accent-soft)", color: "var(--accent)", fontSize: 9.5, fontWeight: 800 }}>
            PDF
          </span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="1.6">
            <path d="M7 3 h7 l4 4 v14 a1 1 0 0 1-1 1 H7 a1 1 0 0 1-1-1 V4 a1 1 0 0 1 1-1 Z" />
            <path d="M14 3 v4 h4" />
          </svg>
        </div>

        {/* floating image chip, bottom-right */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: -26,
            right: -40,
            width: 70,
            height: 70,
            borderRadius: 18,
            background: "var(--bg-elev)",
            border: "1px solid var(--border)",
            boxShadow: "0 26px 42px -22px var(--shadow)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: "translateZ(54px)",
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="8.5" cy="10" r="1.6" />
            <path d="M21 16 l-5-5 -8 8" />
          </svg>
        </div>

        {/* floating lock badge, right */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "46%",
            right: -62,
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--accent)",
            boxShadow: "0 30px 50px -18px color-mix(in srgb,var(--accent) 60%,transparent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: "translateZ(118px)",
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11 V8 a4 4 0 0 1 8 0 v3" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/** A single stored-file row inside the mock app card. */
function FileRow({ ext, name, size }: { ext: string; name: string; size: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", border: "1px solid var(--border)", borderRadius: 11, background: "var(--bg)" }}>
      <span style={{ padding: "3px 7px", borderRadius: 6, background: "var(--accent-soft)", color: "var(--accent)", fontSize: 10, fontWeight: 700 }}>{ext}</span>
      <span style={{ fontSize: 12.5, fontWeight: 600 }}>{name}</span>
      <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--muted)" }}>{size}</span>
    </div>
  );
}
