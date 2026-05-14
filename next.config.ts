import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // typedRoutes will be re-enabled in a later phase once /chalets,
  // /bungalows, /book, /admin/* routes actually exist. Turning it on
  // now would break the header placeholders.
  typedRoutes: false,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Editorial pages use a few Unsplash placeholders for POIs and
      // generic experience photos. Restrict to the canonical image host.
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
