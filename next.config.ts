import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep already-visited pages in the client router cache for a while, so
  // navigating back to a page you just saw is instant (no server round trip).
  experimental: {
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
  },
};

export default nextConfig;
