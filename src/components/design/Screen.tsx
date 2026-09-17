import { Background } from "./Background";

export function Screen({
  children,
  variant = "mobile",
  confetti = false,
  className = "",
}: {
  children: React.ReactNode;
  variant?: "mobile" | "tv";
  confetti?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative min-h-screen overflow-hidden font-heading text-text-primary ${className}`}>
      <Background variant={variant} confetti={confetti} />
      <div className="flex min-h-screen flex-col">{children}</div>
    </div>
  );
}
