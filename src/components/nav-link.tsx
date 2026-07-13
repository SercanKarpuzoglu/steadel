"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLink({
  href,
  match,
  children,
  className,
}: {
  href: string;
  /** Path prefix that counts as active (defaults to href). */
  match?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const prefix = match ?? href;
  const active = pathname === prefix || pathname.startsWith(`${prefix}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "block rounded-md px-3 py-2 text-sm transition",
        active
          ? "bg-white font-medium text-ink shadow-sm"
          : "text-ink-soft hover:bg-white/70 hover:text-ink",
        className,
      )}
    >
      {children}
    </Link>
  );
}
