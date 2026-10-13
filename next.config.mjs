/** @type {import('next').NextConfig} */

/* Baseline hardening headers. A full CSP is left out on purpose: the site
   ships small inline scripts (JSON-LD, the first-visit intro flag) and a
   nonce-based CSP would force every page to render dynamically. */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
]

const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  eslint: {
    // No ESLint config in this repo.
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
  async redirects() {
    return [
      // Removed post — keep old links from 404ing.
      { source: "/blog/first-post", destination: "/blog", permanent: true },
    ]
  },
}

export default nextConfig
