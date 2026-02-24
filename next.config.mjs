/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESM-Pakete die per dynamic import geladen werden
  experimental: {
    esmExternals: "loose",
  },
  // CSP-Headers für Sicherheit
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "form-action 'self' https://checkout.stripe.com",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' data: blob:",
              "connect-src 'self' ws: wss: https://api.openai.com https://api.stripe.com https://checkout.stripe.com",
              "frame-src 'self' https://js.stripe.com https://checkout.stripe.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
  // Webpack-Konfiguration für @react-pdf/renderer (benötigt Canvas-Polyfill)
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
