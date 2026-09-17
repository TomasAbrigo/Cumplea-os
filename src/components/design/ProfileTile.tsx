import { Avatar } from "./Avatar";
import { rgba } from "@/lib/color";
import type { Profile } from "@/lib/profiles";

export function ProfileTile({
  profile,
  state = "default",
  avatarSize = 76,
  onClick,
  className = "",
}: {
  profile: Profile;
  state?: "default" | "selected" | "locked" | "empty";
  avatarSize?: number;
  onClick?: () => void;
  className?: string;
}) {
  const locked = state === "locked";
  const empty = state === "empty";
  const selected = state === "selected";
  const interactive = !!onClick && !locked;

  return (
    <button
      type="button"
      onClick={interactive ? onClick : undefined}
      disabled={!interactive}
      className={`relative flex flex-col items-center justify-center gap-2.5 rounded-[26px] border-2 px-3 py-4 transition-transform duration-150 ${
        interactive ? "active:scale-95 cursor-pointer" : "cursor-default"
      } ${selected ? "animate-bounce-in" : ""} ${className}`}
      style={{
        background: empty
          ? "rgba(46, 26, 84, 0.4)"
          : `linear-gradient(to bottom, ${rgba("#FFFFFF", 0.1)}, ${rgba("#000000", 0)} 50%), #43277E`,
        borderColor: selected ? profile.color : "#5A3AA0",
        boxShadow: selected
          ? `0 0 0 3px ${rgba(profile.color, 0.4)}, 0 10px 22px -4px ${rgba("#000000", 0.4)}`
          : `0 10px 22px -4px ${rgba("#000000", 0.4)}`,
        opacity: locked ? 0.45 : 1,
      }}
    >
      {selected && (
        <span
          className="absolute -top-2.5 rounded-full px-2.5 py-0.5 font-display text-[11px] tracking-wide text-[#123300]"
          style={{ background: profile.color }}
        >
          VOS
        </span>
      )}
      {locked && (
        <span className="absolute right-2 top-2 text-sm opacity-80" aria-hidden>
          🔒
        </span>
      )}
      <Avatar color={empty ? "#5A4A78" : profile.color} emoji={empty ? "?" : profile.emoji} size={avatarSize} dim={locked} />
      <span className="font-heading text-base font-semibold text-text-primary">
        {empty ? "esperando…" : profile.name}
      </span>
    </button>
  );
}
