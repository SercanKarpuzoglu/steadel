import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-amber cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-amber text-paper hover:bg-amber-dark",
        secondary:
          "border border-line bg-panel text-ink hover:bg-white/10",
        ghost: "text-ink-soft hover:bg-paper-soft hover:text-ink",
        danger: "bg-red-700 text-white hover:bg-red-800",
        darkOutline:
          "border border-mist/30 text-paper hover:border-mist/70",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
