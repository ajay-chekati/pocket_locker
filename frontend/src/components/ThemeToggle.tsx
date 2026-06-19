import { useTheme } from "../theme/ThemeProvider.js";
import { MoonIcon } from "./icons.js";

/** 38×38 square button that flips light/dark. */
export function ThemeToggle({
  className = "pl-icon-btn",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const { toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className={className}
      style={{ width: 38, height: 38, ...style }}
    >
      <MoonIcon />
    </button>
  );
}
