"use client";

import { useEffect } from "react";

/**
 * Cookieless first-party pageview beacon. Fires once per marketing page view;
 * stores nothing on the client. Only mounted on marketing pages (via
 * MarketingHeader) — the app stays analytics-free.
 */
export function MarketingAnalytics() {
  useEffect(() => {
    try {
      const payload = JSON.stringify({
        path: window.location.pathname,
        ref: document.referrer,
      });
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/collect", blob);
      } else {
        void fetch("/api/collect", {
          method: "POST",
          body: payload,
          headers: { "content-type": "application/json" },
          keepalive: true,
        });
      }
    } catch {
      /* never let analytics break the page */
    }
  }, []);
  return null;
}
