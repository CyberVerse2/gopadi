import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve("."),
  },
  cacheMaxMemorySize: 10 * 1024 * 1024,
  onDemandEntries: {
    maxInactiveAge: 15 * 1000,
    pagesBufferLength: 1,
  },
  experimental: {
    turbopackFileSystemCacheForDev: true,
    turbopackMemoryLimit: 512 * 1024 * 1024,
  },
};

export default nextConfig;
