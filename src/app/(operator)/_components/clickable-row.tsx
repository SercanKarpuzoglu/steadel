"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

/** Table row that navigates on click / Enter — keeps full-row targets accessible. */
export function ClickableRow({ href, children }: { href: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <tr
      className="rowlink"
      role="link"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(href);
      }}
    >
      {children}
    </tr>
  );
}
