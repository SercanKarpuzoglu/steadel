import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            // Paddle (Merchant of Record) checkout is the only allowed
            // external origin — no analytics, no trackers (SPEC §2/§8).
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://cdn.paddle.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://*.paddle.com",
              "font-src 'self' data:",
              "connect-src 'self' https://*.paddle.com",
              "frame-src https://buy.paddle.com https://sandbox-buy.paddle.com",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
