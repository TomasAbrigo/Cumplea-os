const FEATHER_MASK =
  "radial-gradient(ellipse at center, black 45%, transparent 72%)";

export function ArtImage({
  src,
  className = "",
}: {
  src: string;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt=""
      className={className}
      style={{
        mixBlendMode: "screen",
        WebkitMaskImage: FEATHER_MASK,
        maskImage: FEATHER_MASK,
      }}
    />
  );
}
