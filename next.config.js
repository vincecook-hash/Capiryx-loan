/** @type {import('next').NextConfig} */
module.exports = {
  poweredByHeader: false,
  experimental: {
    serverComponentsExternalPackages: ["@node-rs/argon2"],
  },
  async headers() {
    return [{ source: "/(.*)", headers: [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
    ] }];
  },
};
