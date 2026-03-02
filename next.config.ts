import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Build connect-src dynamically based on environment
const connectSrc = [
  "'self'",
  "https://*.supabase.co",
  "https://api.anthropic.com",
  // Neonomics URL — sandbox in dev, live in production
  process.env.NEONOMICS_BASE_URL || "https://sandbox.neonomics.io",
  // Supabase Realtime WebSocket
  "wss://*.supabase.co",
  // HMR WebSockets — only in development
  ...(isDev ? ["ws://localhost:*", "wss://localhost:*", "ws://127.0.0.1:*"] : []),
].join(" ");

const nextConfig: NextConfig = {
  // Security headers applied to all routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Prevent MIME type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Control referrer information
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // XSS protection (legacy browsers)
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // unsafe-eval only in dev (Next.js HMR), unsafe-inline kept for Next.js hydration scripts
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.supabase.co",
              `connect-src ${connectSrc}`,
              "frame-ancestors 'none'",
            ].join("; "),
          },
          // Disable browser features not needed by a finance app
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
