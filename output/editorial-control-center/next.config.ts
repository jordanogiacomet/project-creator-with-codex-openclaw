import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const ONE_DAY_IN_SECONDS = 60 * 60 * 24;
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

const IMMUTABLE_STATIC_ASSET_CACHE_CONTROL = `public, max-age=${ONE_YEAR_IN_SECONDS}, immutable`;
const PUBLIC_MEDIA_CACHE_CONTROL =
  `public, max-age=${ONE_DAY_IN_SECONDS}, stale-while-revalidate=${ONE_YEAR_IN_SECONDS}`;

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: false,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    localPatterns: [
      {
        pathname: "/images/**",
      },
      {
        pathname: "/media/**",
      },
    ],
    minimumCacheTTL: ONE_DAY_IN_SECONDS,
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: IMMUTABLE_STATIC_ASSET_CACHE_CONTROL,
          },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: IMMUTABLE_STATIC_ASSET_CACHE_CONTROL,
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: PUBLIC_MEDIA_CACHE_CONTROL,
          },
        ],
      },
      {
        source: "/media/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: PUBLIC_MEDIA_CACHE_CONTROL,
          },
        ],
      },
    ];
  },
};

export default withPayload(nextConfig);
