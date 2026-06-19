import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface ToastContextValue {
  /** Show a transient message at the bottom of the screen (auto-dismisses). */
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DISMISS_MS = 2600;

/**
 * App-wide transient toasts. A single toast is shown at a time; a new message
 * replaces the current one and resets the dismiss timer. Many flows fire toasts
 * (upload, download, resend code, Pro waitlist), so this lives at the root.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback((next: string) => {
    setMessage(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), DISMISS_MS);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message && (
        <div
          role="status"
          style={{
            position: "fixed",
            left: "50%",
            bottom: 90,
            transform: "translateX(-50%)",
            zIndex: 60,
            padding: "13px 20px",
            background: "var(--text)",
            color: "var(--bg)",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            boxShadow: "0 16px 36px -10px rgba(0,0,0,.45)",
            animation: "plToast .35s ease both",
            maxWidth: "90vw",
          }}
        >
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
