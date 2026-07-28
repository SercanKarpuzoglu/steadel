import type { MetadataRoute } from "next";
import { GUIDES } from "./guides/guides-content";

const BASE = "https://app.steadel.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/guides", "/privacy", "/terms", "/refunds"].map((path) => ({
    url: `${BASE}${path}`,
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : 0.6,
  }));
  const guideRoutes = GUIDES.map((g) => ({
    url: `${BASE}/guides/${g.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  return [...staticRoutes, ...guideRoutes];
}
