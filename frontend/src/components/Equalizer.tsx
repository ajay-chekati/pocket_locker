/**
 * The animated "equalizer" bars used throughout the brand — busy buttons, the
 * upload indicator, the toast, the Pro hero. Bars scale up and down on a loop,
 * each offset by a stagger so they ripple.
 */
export function Equalizer({
  bars = 5,
  width = 4,
  height = 26,
  gap = 4,
  color = "var(--accent)",
  duration = 1,
  stagger = 0.12,
  radius = 2,
}: {
  bars?: number;
  width?: number;
  height?: number;
  gap?: number;
  color?: string;
  duration?: number;
  stagger?: number;
  radius?: number;
}) {
  return (
    <span
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap,
        height,
      }}
    >
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          style={{
            width,
            height,
            borderRadius: radius,
            background: color,
            transformOrigin: "bottom",
            animation: `plEq ${duration}s ease-in-out ${i * stagger}s infinite`,
          }}
        />
      ))}
    </span>
  );
}
