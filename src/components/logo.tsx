import { cn } from "@/lib/utils";

/** Brand mark: geometric S built from three level strokes (see brand/README). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn("h-7 w-7", className)}>
      <rect width="64" height="64" rx="14" fill="#064e3b" />
      <path
        d="M46 18 H28 Q20 18 20 25 Q20 32 28 32 H36 Q44 32 44 39 Q44 46 36 46 H18"
        fill="none"
        stroke="#f8e7c9"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  on = "light",
  className,
}: {
  /** Surface the logo sits on — controls wordmark color. */
  on?: "light" | "dark";
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span
        className={cn(
          "font-heading text-xl font-semibold",
          on === "dark" ? "text-paper" : "text-ink",
        )}
        style={{ fontFamily: "var(--font-heading)" }}
      >
        steadel<span>.</span>
      </span>
    </span>
  );
}
