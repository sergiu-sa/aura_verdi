import type { NextConfig } from "next";

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
          // Note: 'unsafe-eval' and 'unsafe-inline' required by Next.js dev mode
          // In production, consider tightening these
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.supabase.co",
              // Supabase, Anthropic API, Neonomics sandbox
              // ws://localhost:* is needed for Next.js HMR in development
              "connect-src 'self' https://*.supabase.co https://api.anthropic.com https://sandbox.neonomics.io wss://*.supabase.co ws://localhost:* wss://localhost:*",
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
