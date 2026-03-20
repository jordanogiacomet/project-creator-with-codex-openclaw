import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const immutableBuildAssetHeaders = [
  {
    key: "Cache-Control",
    value: "public, max-age=31536000, immutable",
  },
];

const longLivedPublicAssetHeaders = [
  {
    key: "Cache-Control",
    value: "public, max-age=604800, stale-while-revalidate=86400",
  },
];

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: false,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    // External image hosts stay disabled until a later story defines them.
    remotePatterns: [],
  },
  async headers() {
    return [
      // Limit custom cache headers to asset URLs so admin and app routes keep default behavior.
      {
        source: "/_next/static/:path*",
        headers: immutableBuildAssetHeaders,
      },
      {
        source: "/fonts/:path*",
        headers: longLivedPublicAssetHeaders,
      },
    ];
  },
};

export default withPayload(nextConfig);
