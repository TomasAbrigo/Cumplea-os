import { darken, isLight, rgba } from "@/lib/color";

export function CandyButton({
  children,
  color = "#B4FF39",
  onClick,
  disabled = false,
  type = "button",
  className = "",
  fullWidth = true,
}: {
  children: React.ReactNode;
  color?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
  fullWidth?: boolean;
}) {
  const textColor = isLight(color) ? darken(color, 0.82) : "#FFFFFF";
  const edge = darken(color, 0.55);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden rounded-[22px] px-7 py-4 font-display text-xl tracking-wide transition-transform duration-100 active:translate-y-[3px] disabled:opacity-40 disabled:active:translate-y-0 ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      style={{
        color: textColor,
        background: `linear-gradient(to bottom, ${rgba("#FFFFFF", 0.4)}, ${rgba(
          "#000000",
          0.2
        )}), ${color}`,
        boxShadow: `0 5px 0 ${rgba("#FFFFFF", 0.55)} inset, 0 -6px 0 ${rgba(
          "#000000",
          0.22
        )} inset, 0 8px 0 ${edge}, 0 16px 20px -4px ${rgba("#000000", 0.45)}`,
      }}
    >
      <span
        className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 animate-shimmer bg-white/25"
        style={{ filter: "blur(6px)" }}
      />
      <span className="relative">{children}</span>
    </button>
  );
}
