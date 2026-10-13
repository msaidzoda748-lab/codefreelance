export default function Avatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
  const sizeCls =
    size === "lg"
      ? "h-16 w-16 text-xl"
      : size === "sm"
        ? "h-8 w-8 text-xs"
        : "h-10 w-10 text-sm";
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={`${sizeCls} shrink-0 rounded-full object-cover shadow-sm ring-2 ring-white dark:ring-slate-900`}
      />
    );
  }
  return (
    <div
      className={`inline-flex ${sizeCls} shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 font-bold text-white shadow-sm`}
    >
      {initials || "?"}
    </div>
  );
}
