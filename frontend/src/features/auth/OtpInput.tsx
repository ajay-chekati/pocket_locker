import { useRef, type KeyboardEvent } from "react";

const LEN = 6;

/**
 * Six single-digit boxes for entering a numeric OTP. Controlled: the parent owns
 * the code as a string (e.g. "1234"), so clearing it on resend is a setState.
 * Supports pasting several digits into one box and backspace-to-previous.
 */
export function OtpInput({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (next: string) => void;
  error?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: LEN }, (_, i) => value[i] ?? "");

  const focus = (i: number) =>
    refs.current[Math.max(0, Math.min(LEN - 1, i))]?.focus();

  const onCellChange = (i: number, raw: string) => {
    const clean = raw.replace(/\D/g, "");
    const next = [...digits];
    if (!clean) {
      next[i] = "";
      onChange(next.join(""));
      return;
    }
    for (let k = 0; k < clean.length && i + k < LEN; k++) next[i + k] = clean[k];
    onChange(next.join(""));
    focus(i + clean.length);
  };

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      e.preventDefault();
      const next = [...digits];
      next[i - 1] = "";
      onChange(next.join(""));
      focus(i - 1);
    }
  };

  return (
    <div style={{ display: "flex", gap: 10 }}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={digit}
          onChange={(e) => onCellChange(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          inputMode="numeric"
          maxLength={LEN}
          aria-label={`Digit ${i + 1}`}
          className={`pl-input${error ? " pl-input-error" : ""}`}
          style={{
            flex: 1,
            width: 0,
            height: 62,
            textAlign: "center",
            borderRadius: 12,
            fontSize: 24,
            fontWeight: 700,
          }}
        />
      ))}
    </div>
  );
}
