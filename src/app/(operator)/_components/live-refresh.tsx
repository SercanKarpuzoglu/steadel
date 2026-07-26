"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** Headless periodic refresh — no UI. Pauses while the tab is hidden. */
export function AutoRefresh({ seconds = 20 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}

/**
 * Re-fetches the server component tree on an interval so activity/queue
 * screens stay near-real-time. Pauses while the tab is hidden and while the
 * operator has explicitly paused the stream. CSP-safe (no eval, no sockets).
 */
export function LiveRefresh({ seconds = 8 }: { seconds?: number }) {
  const router = useRouter();
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds, paused]);

  return (
    <button
      type="button"
      className="btn sm"
      onClick={() => setPaused((p) => !p)}
      aria-pressed={paused}
    >
      {paused ? "Resume" : "Pause"}
    </button>
  );
}
