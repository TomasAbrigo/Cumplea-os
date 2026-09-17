const ORBS_MOBILE = [
  { color: "#FF2E93", size: 220, top: "-4%", left: "-14%", opacity: 0.5, anim: "animate-float-a" },
  { color: "#00E5FF", size: 160, top: "2%", left: "62%", opacity: 0.38, anim: "animate-float-b" },
  { color: "#9D4EDD", size: 240, top: "62%", left: "38%", opacity: 0.45, anim: "animate-float-c" },
  { color: "#B4FF39", size: 190, top: "80%", left: "-8%", opacity: 0.32, anim: "animate-float-b" },
];

const ORBS_TV = [
  { color: "#FF2E93", size: 460, top: "-14%", left: "-8%", opacity: 0.4, anim: "animate-float-a" },
  { color: "#00E5FF", size: 380, top: "6%", left: "72%", opacity: 0.32, anim: "animate-float-b" },
  { color: "#9D4EDD", size: 520, top: "50%", left: "38%", opacity: 0.32, anim: "animate-float-c" },
  { color: "#FFC93C", size: 340, top: "68%", left: "4%", opacity: 0.26, anim: "animate-float-b" },
  { color: "#B4FF39", size: 300, top: "72%", left: "80%", opacity: 0.28, anim: "animate-float-a" },
];

const DOTS = [
  { color: "#B4FF39", size: 12, top: "18%", left: "20%", delay: "0s" },
  { color: "#00E5FF", size: 10, top: "30%", left: "80%", delay: "0.4s" },
  { color: "#FFD54A", size: 14, top: "68%", left: "12%", delay: "0.8s" },
  { color: "#FF2E93", size: 9, top: "50%", left: "88%", delay: "1.2s" },
  { color: "#FFFFFF", size: 8, top: "84%", left: "60%", delay: "1.6s" },
  { color: "#9D4EDD", size: 11, top: "8%", left: "50%", delay: "2s" },
];

const CONFETTI = [
  { color: "#FF2E93", left: "6%", delay: "0s", size: 16 },
  { color: "#00E5FF", left: "16%", delay: "0.6s", size: 12 },
  { color: "#B4FF39", left: "28%", delay: "1.1s", size: 18 },
  { color: "#FFD54A", left: "40%", delay: "0.3s", size: 14 },
  { color: "#FF5C7A", left: "54%", delay: "1.5s", size: 16 },
  { color: "#9D4EDD", left: "66%", delay: "0.8s", size: 12 },
  { color: "#00E5FF", left: "78%", delay: "0.1s", size: 15 },
  { color: "#B4FF39", left: "88%", delay: "1.9s", size: 13 },
  { color: "#FFD54A", left: "96%", delay: "1.2s", size: 17 },
];

export function Background({
  variant = "mobile",
  confetti = false,
}: {
  variant?: "mobile" | "tv";
  confetti?: boolean;
}) {
  const orbs = variant === "tv" ? ORBS_TV : ORBS_MOBILE;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {orbs.map((o, i) => (
        <div
          key={i}
          className={`absolute rounded-full ${o.anim}`}
          style={{
            width: o.size,
            height: o.size,
            top: o.top,
            left: o.left,
            background: o.color,
            opacity: o.opacity,
            filter: "blur(70px)",
          }}
        />
      ))}
      {DOTS.map((d, i) => (
        <div
          key={i}
          className="absolute animate-twinkle rounded-full"
          style={{
            width: d.size,
            height: d.size,
            top: d.top,
            left: d.left,
            background: d.color,
            animationDelay: d.delay,
          }}
        />
      ))}
      {confetti &&
        CONFETTI.map((c, i) => (
          <div
            key={i}
            className="absolute top-0 animate-confetti-fall rounded-sm"
            style={{
              width: c.size,
              height: c.size,
              left: c.left,
              background: c.color,
              animationDelay: c.delay,
            }}
          />
        ))}
    </div>
  );
}
