import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Allows a 5 MB image plus multipart form overhead.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
