import { useNavigate } from "react-router-dom";
import { Modal, ModalHeader } from "../../components/Modal.js";
import { formatBytes } from "../../lib/format.js";
import { useUsage } from "./useFiles.js";

/** Storage usage breakdown with an upgrade CTA. */
export function StorageModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { data } = useUsage();
  const used = data?.used ?? 0;
  const quota = data?.quota ?? 0;
  const pct = quota > 0 ? Math.min(100, (used / quota) * 100) : 0;
  const free = Math.max(0, quota - used);

  return (
    <Modal onClose={onClose} label="Storage">
      <ModalHeader title="Storage" onClose={onClose} />

      <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-.03em", marginBottom: 6 }}>
        {formatBytes(used)}{" "}
        <span style={{ fontSize: 18, fontWeight: 600, color: "var(--muted)" }}>of {formatBytes(quota)}</span>
      </div>
      <div style={{ height: 10, borderRadius: 6, background: "var(--surface)", overflow: "hidden", margin: "18px 0 12px" }}>
        <span
          style={{
            display: "block",
            height: "100%",
            width: `${pct}%`,
            borderRadius: 6,
            background: "var(--accent)",
            transition: "width .3s ease",
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-2)", marginBottom: 28 }}>
        <span>{pct.toFixed(1)}% used</span>
        <span>{formatBytes(free)} free</span>
      </div>
      <button
        type="button"
        className="pl-btn-primary"
        onClick={() => {
          onClose();
          navigate("/pro");
        }}
        style={{ width: "100%", height: 50, borderRadius: 11, fontSize: 15 }}
      >
        Upgrade to 50 GB Pro
      </button>
      <div style={{ textAlign: "center", marginTop: 12, fontSize: 12.5, color: "var(--muted)" }}>Free tier · 100 MB</div>
    </Modal>
  );
}
