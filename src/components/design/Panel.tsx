export function Panel({
  children,
  className = "",
  glow,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: string;
}) {
  return (
    <div
      className={`rounded-[32px] border-2 border-surface-line bg-surface/60 ${className}`}
      style={glow ? { boxShadow: `0 0 50px ${glow}` } : undefined}
    >
      {children}
    </div>
  );
}

export function Pill({
  children,
  className = "",
  tone = "neutral",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "neutral" | "danger" | "gold";
}) {
  const tones = {
    neutral: "bg-black/30 border-surface-line text-text-secondary",
    danger: "bg-black/40 border-danger text-danger",
    gold: "bg-gold border-transparent text-[#5A3A00]",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 font-heading text-xs font-bold uppercase tracking-widest ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
