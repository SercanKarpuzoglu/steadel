import type { MetadataRoute } from "next";
import { GUIDES } from "./guides/guides-content";
import { GUIDES_DE } from "./de/guides/guides-content-de";

const BASE = "https://app.steadel.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/guides", "/woocommerce-plugin", "/privacy", "/terms", "/refunds"].map((path) => ({
    url: `${BASE}${path}`,
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : 0.6,
  }));
  const guideRoutes = GUIDES.map((g) => ({
    url: `${BASE}/guides/${g.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  const deRoutes = [
    {
      url: `${BASE}/de/guides`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    ...GUIDES_DE.map((g) => ({
      url: `${BASE}/de/guides/${g.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
  return [...staticRoutes, ...guideRoutes, ...deRoutes];
}
