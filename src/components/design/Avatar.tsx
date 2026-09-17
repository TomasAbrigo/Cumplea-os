import { rgba } from "@/lib/color";

export function Avatar({
  color,
  emoji,
  size = 96,
  dim = false,
  animated = false,
  className = "",
}: {
  color: string;
  emoji: string;
  size?: number;
  dim?: boolean;
  animated?: boolean;
  className?: string;
}) {
  const radius = Math.round(size * 0.3);
  return (
    <div
      className={`relative shrink-0 flex items-center justify-center overflow-hidden ${
        animated ? "animate-wiggle" : ""
      } ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `linear-gradient(to bottom, ${rgba(color, 0)} 45%, ${rgba(
          "#000000",
          0.33
        )} 100%), ${color}`,
        boxShadow: `0 -${size * 0.05}px ${size * 0.1}px ${rgba("#000000", 0.35)}, 0 ${size * 0.05}px ${size * 0.07}px ${rgba(
          "#FFFFFF",
          0.3
        )}`,
        opacity: dim ? 0.35 : 1,
      }}
    >
      <div
        className="absolute rounded-full"
        style={{
          left: size * 0.18,
          top: size * 0.09,
          width: size * 0.64,
          height: size * 0.41,
          background: `radial-gradient(ellipse, ${rgba("#FFFFFF", 0.8)} 0%, ${rgba(
            "#FFFFFF",
            0
          )} 100%)`,
        }}
      />
      <span style={{ fontSize: size * 0.53, lineHeight: 1 }}>{emoji}</span>
    </div>
  );
}
