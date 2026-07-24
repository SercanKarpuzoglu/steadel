import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink placeholder:text-ink-soft/60 focus-visible:outline-2 focus-visible:outline-amber",
        className,
      )}
      {...props}
    />
  );
}
