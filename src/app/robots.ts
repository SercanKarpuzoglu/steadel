import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep the app + auth surfaces out of the index; marketing/guides stay crawlable.
        disallow: ["/dashboard", "/settings", "/admin", "/login", "/signup", "/verify", "/magic", "/reset-password", "/onboarding", "/stores", "/automations", "/reports"],
      },
    ],
    sitemap: "https://app.steadel.com/sitemap.xml",
  };
}
